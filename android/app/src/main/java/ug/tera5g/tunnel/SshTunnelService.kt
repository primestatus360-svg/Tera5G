package ug.tera5g.tunnel

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.trilead.ssh2.Connection
import com.trilead.ssh2.LocalStreamForwarder
import kotlinx.coroutines.*
import ug.tera5g.config.ServerProfile
import java.io.InputStream
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket

/**
 * SSH tunnel: connects to SSH server, then runs a local SOCKS5 server on localhost:10808 backed
 * by SSH direct-tcpip channels. tun2socks in V2RayVpnService points to this SOCKS5 proxy.
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

    private var connection: Connection? = null
    private var serverSocket: ServerSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val host = intent.getStringExtra(EXTRA_HOST) ?: return START_NOT_STICKY
                val port = intent.getIntExtra(EXTRA_PORT, 22)
                val user = intent.getStringExtra(EXTRA_USER) ?: "vpnuser"
                val pass = intent.getStringExtra(EXTRA_PASS) ?: ""
                scope.launch { connect(host, port, user, pass) }
            }
            ACTION_STOP -> disconnect()
        }
        return START_NOT_STICKY
    }

    private suspend fun connect(host: String, port: Int, user: String, pass: String) {
        try {
            val conn = Connection(host, port)
            conn.connect(null, 10_000, 10_000)
            if (!conn.authenticateWithPassword(user, pass))
                throw Exception("SSH authentication failed")
            connection = conn

            val loopback = java.net.InetAddress.getLoopbackAddress()
            val ss = ServerSocket(LOCAL_SOCKS_PORT, 50, loopback)
            serverSocket = ss
            Log.i(TAG, "SSH tunnel active → $host:$port, SOCKS5 on $LOCAL_SOCKS_PORT")

            while (true) {
                val client = try { ss.accept() } catch (_: Exception) { break }
                scope.launch { handleSocks5(client, conn) }
            }
        } catch (e: Exception) {
            Log.e(TAG, "SSH tunnel error", e)
            disconnect()
        }
    }

    private fun handleSocks5(client: Socket, conn: Connection) {
        try {
            val cin  = client.getInputStream()
            val cout = client.getOutputStream()

            // SOCKS5 greeting: VER NMETHODS [METHODS...]
            val greeting = readExact(cin, 2)
            if (greeting[0] != 0x05.toByte()) return
            val nMethods = greeting[1].toInt() and 0xFF
            readExact(cin, nMethods)
            cout.write(byteArrayOf(0x05, 0x00)) // no auth required

            // SOCKS5 request: VER CMD RSV ATYP ...
            val req = readExact(cin, 4)
            if (req[0] != 0x05.toByte() || req[1] != 0x01.toByte()) return

            val destHost = when (val atyp = req[3].toInt() and 0xFF) {
                0x01 -> { // IPv4
                    val b = readExact(cin, 4)
                    "${b[0].toInt() and 0xFF}.${b[1].toInt() and 0xFF}" +
                    ".${b[2].toInt() and 0xFF}.${b[3].toInt() and 0xFF}"
                }
                0x03 -> { // Domain name
                    val len = cin.read()
                    String(readExact(cin, len))
                }
                else -> return // IPv6 or unknown: unsupported
            }
            val portHi  = cin.read()
            val portLo  = cin.read()
            val destPort = (portHi shl 8) or portLo

            val fwd: LocalStreamForwarder = conn.createLocalStreamForwarder(destHost, destPort)

            // Reply: success, bound address 0.0.0.0:0
            cout.write(byteArrayOf(0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0))
            cout.flush()

            // Relay bidirectionally
            val fin  = fwd.inputStream
            val fout = fwd.outputStream
            scope.launch { relay(fin, cout) }
            relay(cin, fout)
        } catch (_: Exception) {
        } finally {
            try { client.close() } catch (_: Exception) {}
        }
    }

    private fun readExact(input: InputStream, n: Int): ByteArray {
        val buf = ByteArray(n)
        var off = 0
        while (off < n) {
            val read = input.read(buf, off, n - off)
            if (read == -1) throw java.io.EOFException("Stream closed")
            off += read
        }
        return buf
    }

    private fun relay(src: InputStream, dst: OutputStream) {
        try {
            val buf = ByteArray(8192)
            var n: Int
            while (src.read(buf).also { n = it } != -1) {
                dst.write(buf, 0, n)
                dst.flush()
            }
        } catch (_: Exception) {}
    }

    private fun disconnect() {
        try { serverSocket?.close() } catch (_: Exception) {}
        try { connection?.close() } catch (_: Exception) {}
        serverSocket = null
        connection = null
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        disconnect()
        scope.cancel()
        super.onDestroy()
    }
}
