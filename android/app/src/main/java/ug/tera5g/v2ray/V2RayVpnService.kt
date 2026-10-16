package ug.tera5g.v2ray

import android.app.*
import android.content.Intent
import android.net.TrafficStats
import android.net.VpnService
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import libv2ray.CoreCallbackHandler
import libv2ray.CoreController
import libv2ray.Libv2ray
import ug.tera5g.R
import ug.tera5g.MainActivity

class V2RayVpnService : VpnService(), CoreCallbackHandler {

    companion object {
        private const val TAG = "Tera5G_VPN"
        const val CHANNEL_ID = "tera5g_vpn_status"
        const val NOTIF_ID   = 1001

        const val ACTION_START = "ug.tera5g.START"
        const val ACTION_STOP  = "ug.tera5g.STOP"

        const val EXTRA_CONFIG_JSON = "config_json"

        var isRunning = false
            private set
    }

    private var coreController: CoreController? = null
    private var pfd: ParcelFileDescriptor? = null
    private var tun2socksProcess: java.lang.Process? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ── VpnService lifecycle ──────────────────────────────────────────────

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val configJson = intent.getStringExtra(EXTRA_CONFIG_JSON)
                    ?: VpnPrefs.getConfigJson(this)
                    ?: return START_NOT_STICKY
                VpnPrefs.saveConfigJson(this, configJson)
                startForegroundNotification("Connecting…", 0L, 0L)
                scope.launch { startTunnel(configJson) }
                return START_REDELIVER_INTENT         // persist across system restarts
            }
            ACTION_STOP -> {
                VpnPrefs.clearConfigJson(this)
                stopTunnel()
            }
            null -> {
                // System restarted the service — recover from saved config
                val configJson = VpnPrefs.getConfigJson(this)
                if (configJson != null && VpnPrefs.wasRunning(this)) {
                    startForegroundNotification("Reconnecting…", 0L, 0L)
                    scope.launch { startTunnel(configJson) }
                    return START_REDELIVER_INTENT
                }
            }
        }
        return START_NOT_STICKY
    }

    override fun onRevoke() {
        VpnPrefs.clearConfigJson(this)
        stopTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        stopTunnel()
        scope.cancel()
        super.onDestroy()
    }

    // ── Tunnel start/stop ─────────────────────────────────────────────────

    private fun startTunnel(configJson: String) {
        try {
            V2RayAssets.copyToFilesDir(this)
            Libv2ray.initCoreEnv(filesDir.absolutePath, "")

            val ctrl = Libv2ray.newCoreController(this)
            ctrl.startLoop(configJson, 0)
            coreController = ctrl

            val builder = Builder()
                .setSession("Tera5G")
                .setMtu(1500)
                .addAddress("10.0.0.2", 24)
                .addDnsServer("1.1.1.1")
                .addDnsServer("8.8.8.8")
                .addRoute("0.0.0.0", 0)
                .addRoute("::", 0)
                .allowFamily(android.system.OsConstants.AF_INET)
                .allowFamily(android.system.OsConstants.AF_INET6)

            loadBypassApps(builder)

            pfd = builder.establish() ?: throw Exception("VPN tunnel establishment failed")
            startTun2socks(pfd!!.fd)

            isRunning = true
            VpnPrefs.setRunning(this@V2RayVpnService, true)
            V2RayController.onStateChanged(VpnState.CONNECTED)
            Log.i(TAG, "Tunnel started successfully")

            startNotifStatsLoop()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start tunnel", e)
            stopTunnel()
            V2RayController.onStateChanged(VpnState.ERROR)
        }
    }

    private fun stopTunnel() {
        scope.coroutineContext.cancelChildren()
        isRunning = false
        VpnPrefs.setRunning(this, false)
        try {
            tun2socksProcess?.destroy(); tun2socksProcess = null
            pfd?.close();               pfd = null
            coreController?.stopLoop(); coreController = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping tunnel", e)
        }
        V2RayController.onStateChanged(VpnState.DISCONNECTED)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startTun2socks(tunFd: Int) {
        val tunPath = "${applicationInfo.nativeLibraryDir}/libtun2socks.so"
        val cfgFile = java.io.File(filesDir, "hev-tun.yml")
        cfgFile.writeText("""
tunnel:
  fd: $tunFd
  mtu: 1500
  ipv4: 10.0.0.2

socks5:
  address: 127.0.0.1
  port: 10808
  udp: udp

misc:
  log-file: stderr
  log-level: error
  task-stack-size: 81920
  connect-timeout: 0
  read-write-timeout: 60
  limit-nofile: 65535
""".trimIndent())
        tun2socksProcess = ProcessBuilder(tunPath, cfgFile.absolutePath)
            .redirectErrorStream(true)
            .start() as java.lang.Process
    }

    private fun loadBypassApps(builder: Builder) {
        try {
            assets.open("bypass_apps.txt").bufferedReader().forEachLine { line ->
                val pkg = line.trim()
                if (pkg.isNotEmpty() && !pkg.startsWith("#")) {
                    try { builder.addDisallowedApplication(pkg) } catch (_: Exception) {}
                }
            }
        } catch (_: Exception) {}
    }

    // ── Live notification stats ───────────────────────────────────────────

    private fun startNotifStatsLoop() {
        scope.launch {
            var prevRx = TrafficStats.getTotalRxBytes()
            var prevTx = TrafficStats.getTotalTxBytes()
            while (isActive) {
                delay(2_000)
                val currRx = TrafficStats.getTotalRxBytes()
                val currTx = TrafficStats.getTotalTxBytes()
                val dlBps = ((currRx - prevRx).coerceAtLeast(0L)) / 2
                val ulBps = ((currTx - prevTx).coerceAtLeast(0L)) / 2
                prevRx = currRx
                prevTx = currTx
                updateNotifStats(dlBps, ulBps)
            }
        }
    }

    private fun updateNotifStats(dlBps: Long, ulBps: Long) {
        val nm = getSystemService(NotificationManager::class.java) ?: return
        val notif = buildNotification("↓ ${fmtSpeed(dlBps)}  ↑ ${fmtSpeed(ulBps)}", dlBps, ulBps)
        nm.notify(NOTIF_ID, notif)
    }

    private fun fmtSpeed(bps: Long): String = when {
        bps >= 1_048_576 -> "%.1f MB/s".format(bps / 1_048_576.0)
        bps >= 1_024     -> "%.0f KB/s".format(bps / 1_024.0)
        else             -> "${bps} B/s"
    }

    // ── Foreground notification ───────────────────────────────────────────

    private fun startForegroundNotification(text: String, dlBps: Long, ulBps: Long) {
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification(text, dlBps, ulBps))
    }

    private fun buildNotification(text: String, dlBps: Long, ulBps: Long): Notification {
        val contentIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this, 1,
            Intent(this, V2RayVpnService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Disconnect", stopIntent)
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_vpn),
            NotificationManager.IMPORTANCE_LOW
        ).apply { setShowBadge(false) }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    // ── CoreCallbackHandler ───────────────────────────────────────────────

    override fun shutdown(): Long { stopTunnel(); return 0L }
    override fun startup(): Long = 0L
    override fun onEmitStatus(l: Long, s: String?): Long = 0L
}
