package ug.tera5g.v2ray

import android.app.*
import android.content.Intent
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
        const val NOTIF_ID = 1001

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
                val configJson = intent.getStringExtra(EXTRA_CONFIG_JSON) ?: return START_NOT_STICKY
                startForegroundNotification()
                scope.launch { startTunnel(configJson) }
            }
            ACTION_STOP -> stopTunnel()
        }
        return START_NOT_STICKY
    }

    override fun onRevoke() {
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
            // 1. Copy geo assets to filesDir so V2Ray can load them
            V2RayAssets.copyToFilesDir(this)

            // 2. Init core environment with the assets path
            Libv2ray.initCoreEnv(filesDir.absolutePath, "")

            // 3. Start V2Ray/Xray core via libv2ray
            val ctrl = Libv2ray.newCoreController(this)
            ctrl.startLoop(configJson, 0)
            coreController = ctrl

            // 4. Establish Android VPN tunnel
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

            // Load per-app bypass list
            loadBypassApps(builder)

            pfd = builder.establish() ?: throw Exception("VPN tunnel establishment failed")

            // 5. Start tun2socks to bridge tun → SOCKS5:10808
            startTun2socks(pfd!!.fd)

            isRunning = true
            VpnPrefs.setRunning(this@V2RayVpnService, true)
            V2RayController.onStateChanged(VpnState.CONNECTED)
            Log.i(TAG, "Tunnel started successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start tunnel", e)
            stopTunnel()
            V2RayController.onStateChanged(VpnState.ERROR)
        }
    }

    private fun stopTunnel() {
        isRunning = false
        VpnPrefs.setRunning(this, false)
        try {
            tun2socksProcess?.destroy()
            tun2socksProcess = null
            pfd?.close()
            pfd = null
            coreController?.stopLoop()
            coreController = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping tunnel", e)
        }
        V2RayController.onStateChanged(VpnState.DISCONNECTED)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startTun2socks(tunFd: Int) {
        val tunPath  = "${applicationInfo.nativeLibraryDir}/libtun2socks.so"
        val cfgFile  = java.io.File(filesDir, "hev-tun.yml")
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

    // ── Foreground notification ───────────────────────────────────────────

    private fun startForegroundNotification() {
        createNotificationChannel()
        val notif = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.notification_connected))
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    this, 0,
                    Intent(this, MainActivity::class.java),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Disconnect",
                PendingIntent.getService(
                    this, 1,
                    Intent(this, V2RayVpnService::class.java).apply { action = ACTION_STOP },
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            )
            .build()
        startForeground(NOTIF_ID, notif)
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_vpn),
            NotificationManager.IMPORTANCE_LOW
        ).apply { setShowBadge(false) }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    // ── CoreCallbackHandler callbacks ─────────────────────────────────────

    override fun shutdown(): Long { stopTunnel(); return 0L }
    override fun startup(): Long = 0L
    override fun onEmitStatus(l: Long, s: String?): Long = 0L
}
