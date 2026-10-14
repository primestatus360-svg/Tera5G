package ug.tera5g.tunnel

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.*
import java.io.*
import java.net.*

/**
 * HTTP Injection tunnel — mirrors Crane Tunnel's RenzInjectorService.
 *
 * Technique: Open a TCP connection to the ISP proxy or upstream server.
 * Send an HTTP CONNECT request with a fake Host header (e.g. m.google.com).
 * Many ISPs' transparent proxies allow this and pass through traffic to
 * the real destination inside the tunnel, making it appear as legitimate
 * Google traffic and bypassing billing or censorship filters.
 *
 * This creates a local SOCKS5 proxy on 10808 that all V2Ray traffic
 * can be routed through when the inject template is active.
 */
class HttpInjectService : Service() {

    companion object {
        private const val TAG = "Tera5G_Inject"
        const val ACTION_START = "ug.tera5g.INJECT_START"
        const val ACTION_STOP  = "ug.tera5g.INJECT_STOP"
        const val EXTRA_REMOTE_HOST = "remote_host"
        const val EXTRA_REMOTE_PORT = "remote_port"
        const val EXTRA_INJECT_HOST = "inject_host"
        const val EXTRA_TEMPLATE    = "template"
        const val EXTRA_SSL         = "ssl"
        private const val LOCAL_PORT = 10810
    }

    private var serverSocket: ServerSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val remoteHost  = intent.getStringExtra(EXTRA_REMOTE_HOST) ?: return START_NOT_STICKY
                val remotePort  = intent.getIntExtra(EXTRA_REMOTE_PORT, 443)
                val injectHost  = intent.getStringExtra(EXTRA_INJECT_HOST) ?: "m.google.com"
                val ssl         = intent.getBooleanExtra(EXTRA_SSL, false)
                scope.launch { startProxy(remoteHost, remotePort, injectHost, ssl) }
            }
            ACTION_STOP -> stopProxy()
        }
        return START_NOT_STICKY
    }

    private suspend fun startProxy(
        remoteHost: String, remotePort: Int,
        injectHost: String, ssl: Boolean
    ) {
        try {
            serverSocket = ServerSocket(LOCAL_PORT)
            Log.i(TAG, "HTTP Inject proxy listening on $LOCAL_PORT → $remoteHost:$remotePort")
            while (!serverSocket!!.isClosed) {
                val client = serverSocket!!.accept()
                scope.launch {
                    handleClient(client, remoteHost, remotePort, injectHost, ssl)
                }
            }
        } catch (e: SocketException) {
            // Normal shutdown
        } catch (e: Exception) {
            Log.e(TAG, "Proxy error", e)
        }
    }

    private suspend fun handleClient(
        client: Socket, remoteHost: String, remotePort: Int,
        injectHost: String, ssl: Boolean
    ) = withContext(Dispatchers.IO) {
        try {
            val remote = Socket(remoteHost, remotePort)

            // Send HTTP CONNECT with fake host — this is the injection payload
            // that tricks ISP transparent proxies into routing freely
            val connectReq = buildString {
                append("CONNECT $remoteHost:$remotePort HTTP/1.1\r\n")
                append("Host: $injectHost\r\n")
                append("User-Agent: Mozilla/5.0\r\n")
                append("Proxy-Connection: Keep-Alive\r\n")
                append("\r\n")
            }
            remote.getOutputStream().write(connectReq.toByteArray())
            remote.getOutputStream().flush()

            // Read CONNECT response
            val reader = BufferedReader(InputStreamReader(remote.getInputStream()))
            val statusLine = reader.readLine() ?: throw Exception("No response from proxy")
            if (!statusLine.contains("200")) throw Exception("CONNECT refused: $statusLine")
            // Drain headers
            while (reader.readLine()?.isNotEmpty() == true) { /* discard */ }

            // Pipe bidirectionally
            val c2r = scope.launch { pipe(client.getInputStream(), remote.getOutputStream()) }
            val r2c = scope.launch { pipe(remote.getInputStream(), client.getOutputStream()) }
            c2r.join(); r2c.join()
        } catch (e: Exception) {
            Log.w(TAG, "Client handling error: ${e.message}")
        } finally {
            client.runCatching { close() }
        }
    }

    private suspend fun pipe(input: InputStream, output: OutputStream) = withContext(Dispatchers.IO) {
        try {
            val buf = ByteArray(8192)
            var n: Int
            while (input.read(buf).also { n = it } != -1) {
                output.write(buf, 0, n)
                output.flush()
            }
        } catch (_: Exception) {}
    }

    private fun stopProxy() {
        serverSocket?.runCatching { close() }
        serverSocket = null
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null
    override fun onDestroy() { stopProxy(); scope.cancel(); super.onDestroy() }
}
