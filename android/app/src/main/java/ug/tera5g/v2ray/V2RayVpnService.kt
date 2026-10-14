package ug.tera5g.v2ray

import android.app.*
import android.content.Intent
import android.net.VpnService
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import libv2ray.Libv2ray
import libv2ray.V2RayPoint
import libv2ray.V2RayVPNServiceSupportsSet
import ug.tera5g.R
import ug.tera5g.MainActivity
import ug.tera5g.config.ConfigBuilder
import ug.tera5g.config.RoutingMode
import ug.tera5g.config.ServerProfile

class V2RayVpnService : VpnService(), V2RayVPNServiceSupportsSet {

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

    private var v2rayPoint: V2RayPoint? = null
    private var pfd: ParcelFileDescriptor? = null
    private var tun2socksProcess: Process? = null
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

            // 2. Start V2Ray core via libv2ray
            val point = Libv2ray.newV2RayPoint(this, false)
            point.configureFileContent = configJson
            point.domainName = ""
            point.enableLocalDNS = false
            point.forwardIpv6 = false
            point.runLoop(false)
            v2rayPoint = point

            // 3. Establish Android VPN tunnel
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

            // 4. Start tun2socks to bridge tun → SOCKS5:10808
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
            v2rayPoint?.stopLoop()
            v2rayPoint = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping tunnel", e)
        }
        V2RayController.onStateChanged(VpnState.DISCONNECTED)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startTun2socks(tunFd: Int) {
        val tun2socksPath = "${applicationInfo.nativeLibraryDir}/libtun2socks.so"
        val cmd = arrayOf(
            tun2socksPath,
            "--netif-ipaddr",          "10.0.0.2",
            "--netif-netmask",         "255.255.255.0",
            "--socks-server-addr",     "127.0.0.1:10808",
            "--tunfd",                 tunFd.toString(),
            "--tunmtu",               "1500",
            "--udpgw-remote-server-addr", "127.0.0.1:7300",
            "--udpgw-transparent-dns",
            "--loglevel",             "error"
        )
        tun2socksProcess = Runtime.getRuntime().exec(cmd)
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

    // ── V2RayVPNServiceSupportsSet callbacks ──────────────────────────────

    override fun shutdown() { stopTunnel() }
    override fun prepare(): Int = 0
    override fun protect(l: Long): Boolean = protect(l.toInt())
    override fun onEmitStatus(l: Long, s: String?): Int = 0
}
