package ug.tera5g.tunnel

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.trilead.ssh2.Connection
import com.trilead.ssh2.DynamicPortForwarder
import kotlinx.coroutines.*
import ug.tera5g.config.ServerProfile

/**
 * SSH tunnel: establishes an SSH connection and creates a SOCKS5 dynamic forwarder on
 * localhost:10808, exactly mirroring how Crane Tunnel's SSHVPNService works.
 * badvpn-udpgw runs on the remote server at udpgwPort to handle UDP through the tunnel.
 */
class SshTunnelService : Service() {

    companion object {
        private const val TAG = "Tera5G_SSH"
        const val ACTION_START = "ug.tera5g.SSH_START"
        const val ACTION_STOP  = "ug.tera5g.SSH_STOP"
        const val EXTRA_HOST   = "host"
        const val EXTRA_PORT   = "port"
        const val EXTRA_USER   = "user"
        const val EXTRA_PASS   = "pass"
        const val EXTRA_UDPGW  = "udpgw_port"
        private const val LOCAL_SOCKS_PORT = 10808
    }

    private var connection: Connection? = null
    private var forwarder: DynamicPortForwarder? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val host      = intent.getStringExtra(EXTRA_HOST) ?: return START_NOT_STICKY
                val port      = intent.getIntExtra(EXTRA_PORT, 22)
                val user      = intent.getStringExtra(EXTRA_USER) ?: "vpnuser"
                val pass      = intent.getStringExtra(EXTRA_PASS) ?: ""
                val udpgwPort = intent.getIntExtra(EXTRA_UDPGW, 7300)
                scope.launch { connect(host, port, user, pass, udpgwPort) }
            }
            ACTION_STOP -> disconnect()
        }
        return START_NOT_STICKY
    }

    private suspend fun connect(host: String, port: Int, user: String, pass: String, udpgwPort: Int) {
        try {
            val conn = Connection(host, port)
            conn.connect(null, 10_000, 10_000)
            val authed = conn.authenticateWithPassword(user, pass)
            if (!authed) throw Exception("SSH authentication failed")

            // SOCKS5 dynamic forwarder on localhost:10808
            forwarder = conn.createDynamicPortForwarder(LOCAL_SOCKS_PORT)
            connection = conn
            Log.i(TAG, "SSH tunnel active → $host:$port SOCKS5 on $LOCAL_SOCKS_PORT")

            // badvpn-udpgw is expected to run on the server at udpgwPort.
            // The VpnService's tun2socks references 127.0.0.1:7300 for UDP relay.
            // For SSH mode, tun2socks is started by V2RayVpnService with the same ports.
        } catch (e: Exception) {
            Log.e(TAG, "SSH tunnel error", e)
            disconnect()
        }
    }

    private fun disconnect() {
        try {
            forwarder?.close()
            connection?.close()
        } catch (_: Exception) {}
        forwarder  = null
        connection = null
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        disconnect()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        fun buildIntent(service: android.content.Context, profile: ServerProfile) =
            Intent(service, SshTunnelService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_HOST,  profile.address)
                putExtra(EXTRA_PORT,  profile.port)
                putExtra(EXTRA_USER,  profile.username)
                putExtra(EXTRA_PASS,  profile.password)
                putExtra(EXTRA_UDPGW, profile.udpgwPort)
            }
    }
}
