package com.tera5g.vpn.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.ProxyInfo
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.tera5g.vpn.MainActivity
import com.tera5g.vpn.R

class Tera5GVpnService : VpnService() {

    companion object {
        private const val TAG = "Tera5GVpnService"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "tera5g_vpn"

        const val ACTION_START = "START"
        const val ACTION_STOP = "STOP"
        const val EXTRA_SESSION_ID = "SESSION_ID"

        const val ACTION_VPN_STARTED = "com.tera5g.vpn.VPN_STARTED"
        const val ACTION_VPN_STOPPED = "com.tera5g.vpn.VPN_STOPPED"
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var proxyServer: LocalProxyServer? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: run {
                    Log.e(TAG, "No sessionId provided — aborting")
                    stopSelf()
                    return START_NOT_STICKY
                }
                startVpn(sessionId)
            }
            ACTION_STOP -> stopVpn()
        }
        return START_STICKY
    }

    private fun startVpn(sessionId: String) {
        try {
            // Start local proxy
            val proxy = LocalProxyServer(sessionId, this)
            proxy.start()
            proxyServer = proxy

            // Build VPN interface
            val builder = Builder()
            builder.setSession("Tera5G")
            builder.addAddress("10.8.0.1", 32)
            builder.addDnsServer("8.8.8.8")
            builder.addDnsServer("8.8.4.4")
            builder.setMtu(1500)
            builder.setHttpProxy(ProxyInfo.buildDirectProxy("127.0.0.1", 8080))
            // Route all traffic through VPN
            builder.addRoute("0.0.0.0", 0)
            vpnInterface = builder.establish()

            startForeground(NOTIFICATION_ID, buildNotification())

            sendBroadcast(Intent(ACTION_VPN_STARTED))
            Log.d(TAG, "VPN started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start VPN", e)
            stopSelf()
        }
    }

    private fun stopVpn() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        closeInterfaces()
        sendBroadcast(Intent(ACTION_VPN_STOPPED))
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        closeInterfaces()
        sendBroadcast(Intent(ACTION_VPN_STOPPED))
    }

    private fun closeInterfaces() {
        try { vpnInterface?.close() } catch (_: Exception) {}
        vpnInterface = null
        try { proxyServer?.stop() } catch (_: Exception) {}
        proxyServer = null
    }

    private fun buildNotification(): Notification {
        createNotificationChannel()

        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text))
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Shows when Tera5G VPN relay is active"
            setShowBadge(false)
        }
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(channel)
    }
}
