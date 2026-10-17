package ug.tera5g.v2ray

import android.app.*
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.LinkProperties
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
import ug.tera5g.freemode.WireGuardNative
import java.net.Inet4Address
import java.util.concurrent.TimeUnit

class V2RayVpnService : VpnService(), CoreCallbackHandler {

    companion object {
        private const val TAG = "Tera5G_VPN"
        const val CHANNEL_ID = "tera5g_vpn_status"
        const val NOTIF_ID   = 1001

        const val ACTION_START = "ug.tera5g.START"
        const val ACTION_STOP  = "ug.tera5g.STOP"

        const val EXTRA_CONFIG_JSON    = "config_json"
        const val EXTRA_IS_FREE_BROWSE = "is_free_browse"

        var isRunning = false
            private set
    }

    private var coreController: CoreController? = null
    private var pfd: ParcelFileDescriptor? = null
    private var tun2socksProcess: java.lang.Process? = null
    private var wgHandle: Int = -1
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Catch system power-off and cleanly release the TUN fd before Android
    // tears down the network stack — prevents freeze on next boot.
    private val shutdownReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            Log.i(TAG, "System shutdown — stopping VPN")
            VpnPrefs.clearConfigJson(this@V2RayVpnService)
            stopTunnel()
        }
    }

    // ── VpnService lifecycle ──────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        registerReceiver(shutdownReceiver, IntentFilter(Intent.ACTION_SHUTDOWN))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val configJson = intent.getStringExtra(EXTRA_CONFIG_JSON)
                    ?: VpnPrefs.getConfigJson(this)
                    ?: return START_NOT_STICKY
                val isFreeBrowse = intent.getBooleanExtra(EXTRA_IS_FREE_BROWSE, false)
                VpnPrefs.saveConfigJson(this, configJson)
                startForegroundNotification("Connecting…", 0L, 0L)
                scope.launch { startTunnel(configJson, isFreeBrowse) }
                return START_NOT_STICKY
            }
            ACTION_STOP -> {
                VpnPrefs.clearConfigJson(this)
                stopTunnel()
            }
            null -> { /* system restart — do nothing, user taps reconnect */ }
        }
        return START_NOT_STICKY
    }

    override fun onRevoke() {
        VpnPrefs.clearConfigJson(this)
        stopTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        try { unregisterReceiver(shutdownReceiver) } catch (_: Exception) {}
        stopTunnel()
        scope.cancel()
        super.onDestroy()
    }

    // ── Tunnel start/stop ─────────────────────────────────────────────────

    private fun startTunnel(configJson: String, isFreeBrowse: Boolean = false) {
        try {
            val builder = Builder()
                .setSession("Tera5G")
                .setMtu(1500)
                .addAddress("10.0.0.2", 24)
                .allowFamily(android.system.OsConstants.AF_INET)
                .allowFamily(android.system.OsConstants.AF_INET6)

            val dnsServers = if (isFreeBrowse) getCarrierDns() else listOf("1.1.1.1", "8.8.8.8")
            dnsServers.forEach { builder.addDnsServer(it) }

            if (isFreeBrowse) {
                // Route all traffic except 10.0.0.0/8 through the TUN so the
                // WireGuard server at 10.7.x.x stays reachable via the carrier.
                builder.addRoute("0.0.0.0", 1)    // 0.0.0.0/1  covers 0–127
                builder.addRoute("128.0.0.0", 1)  // 128.0.0.0/1 covers 128–255
                builder.addRoute("172.16.0.0", 12)
                builder.addRoute("192.168.0.0", 16)
            } else {
                builder.addRoute("0.0.0.0", 0)
                builder.addRoute("::", 0)
            }

            loadBypassApps(builder)

            if (isFreeBrowse) {
                // ── Free Browse: native wireguard-go via libwg.so ─────────────
                // Establish TUN first (need the fd), then hand it to wireguard-go.
                // xray-core is NOT involved — its userspace netstack crashes on
                // armeabi-v7a; wireguard-go with a real kernel TUN fd does not.
                pfd = builder.establish() ?: throw Exception("VPN tunnel establishment failed")
                startNativeWireGuard(configJson)
            } else {
                // ── Normal mode: xray-core + tun2socks ───────────────────────
                // xray-core must start first (opens SOCKS listener on 10808),
                // then the TUN is established, then tun2socks bridges them.
                V2RayAssets.copyToFilesDir(this)
                Libv2ray.initCoreEnv(filesDir.absolutePath, "")
                java.io.File(filesDir, "last_config.json").writeText(configJson)
                val ctrl = Libv2ray.newCoreController(this)
                ctrl.startLoop(configJson, 0)
                coreController = ctrl
                pfd = builder.establish() ?: throw Exception("VPN tunnel establishment failed")
                startTun2socks(pfd!!.fd)
            }

            isRunning = true
            VpnPrefs.setRunning(this@V2RayVpnService, true)
            V2RayController.onStateChanged(VpnState.CONNECTED)
            Log.i(TAG, "Tunnel started (freeBrowse=$isFreeBrowse)")
            startNotifStatsLoop()

        } catch (e: Throwable) {
            Log.e(TAG, "Failed to start tunnel", e)
            stopTunnel()
            V2RayController.onStateChanged(VpnState.ERROR)
        }
    }

    /**
     * Hand the VPN TUN fd directly to wireguard-go via libwg.so (wireguard-android).
     * [wgSettings] is a WireGuard UAPI settings string (private_key, peer public_key,
     * endpoint, allowed_ip) with keys in lowercase hex.
     */
    private fun startNativeWireGuard(wgSettings: String) {
        val fd = pfd?.fd ?: throw Exception("No TUN fd for WireGuard")
        val handle = WireGuardNative.turnOn("wg0", fd, wgSettings)
        if (handle < 0) throw Exception("wgTurnOn failed ($handle)")
        wgHandle = handle
        // Protect WireGuard's UDP sockets so they route through the carrier,
        // not back into our own VPN TUN (which would loop infinitely).
        val v4 = WireGuardNative.getSocketV4(handle)
        val v6 = WireGuardNative.getSocketV6(handle)
        if (v4 > 0) protect(v4)
        if (v6 > 0) protect(v6)
        Log.i(TAG, "Native WireGuard started handle=$handle")
    }

    private fun stopTunnel() {
        scope.coroutineContext.cancelChildren()
        isRunning = false
        VpnPrefs.setRunning(this, false)
        try {
            // Close the TUN fd first — wireguard-go and tun2socks both see a
            // read error and exit on their own before we forcibly stop them.
            pfd?.close(); pfd = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing TUN fd", e)
        }
        // Stop native WireGuard (Free Browse mode)
        val wg = wgHandle
        if (wg >= 0) {
            wgHandle = -1
            try { WireGuardNative.turnOff(wg) } catch (e: Exception) {
                Log.e(TAG, "Error stopping WireGuard", e)
            }
        }
        // Stop tun2socks (normal mode)
        try {
            tun2socksProcess?.let { proc ->
                proc.destroy()
                if (!proc.waitFor(3, TimeUnit.SECONDS)) {
                    proc.destroyForcibly()
                    proc.waitFor(1, TimeUnit.SECONDS)
                }
            }
            tun2socksProcess = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping tun2socks", e)
        }
        // Stop xray-core (normal mode)
        try {
            coreController?.stopLoop(); coreController = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping core", e)
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

    private fun getCarrierDns(): List<String> {
        return try {
            val cm = getSystemService(ConnectivityManager::class.java)
            val lp: LinkProperties? = cm.getLinkProperties(cm.activeNetwork)
            val servers = lp?.dnsServers
                ?.filterIsInstance<Inet4Address>()
                ?.map { it.hostAddress }
                ?.filter { !it.isNullOrEmpty() }
                ?.filterNotNull()
                ?.take(2)
                ?.ifEmpty { null }
            servers ?: listOf("8.8.8.8", "1.1.0.0")
        } catch (_: Exception) {
            listOf("8.8.8.8", "1.1.0.0")
        }
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
