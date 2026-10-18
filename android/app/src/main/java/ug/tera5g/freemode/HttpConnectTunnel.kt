package ug.tera5g.freemode

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket

/**
 * Local SOCKS5 proxy that tunnels connections through an HTTP CONNECT proxy
 * using host injection to bypass MTN Uganda's zero-rating check.
 *
 * tun2socks → SOCKS5(:10808) → raw TCP to proxyHost:proxyPort →
 *   CONNECT target:port@injectHost → proxy connects to real target → internet
 */
class HttpConnectTunnel(
    val proxyHost: String,
    val proxyPort: Int,
    val injectHost: String,
    private val protectSocket: (Socket) -> Boolean,
    private val listenPort: Int = 10808
) {
    private val TAG = "HttpConnectTunnel"

    @Volatile private var serverSocket: ServerSocket? = null

    fun start(scope: CoroutineScope) {
        scope.launch(Dispatchers.IO) {
            try {
                val ss = ServerSocket(listenPort, 128, InetAddress.getByName("127.0.0.1"))
                serverSocket = ss
                Log.i(TAG, "SOCKS5 on :$listenPort → $proxyHost:$proxyPort inject=$injectHost")
                while (isActive) {
                    val client = try {
                        ss.accept()
                    } catch (e: Exception) {
                        if (isActive) Log.w(TAG, "accept error: ${e.message}")
                        break
                    }
                    launch(Dispatchers.IO) { handleClient(client) }
                }
            } catch (e: Exception) {
                Log.e(TAG, "server error: ${e.message}")
            }
        }
    }

    fun stop() {
        try { serverSocket?.close() } catch (_: Exception) {}
        serverSocket = null
    }

    /** Probes the proxy server with a test CONNECT request. Returns true on 200. */
    fun testConnection(): Boolean {
        return try {
            val sock = Socket(proxyHost, proxyPort)
            protectSocket(sock)
            sock.soTimeout = 8_000
            val req = "CONNECT 8.8.8.8:53@$injectHost HTTP/1.0\r\n" +
                      "Host: $injectHost\r\n\r\n"
            sock.getOutputStream().apply { write(req.toByteArray(Charsets.US_ASCII)); flush() }
            val line = readHttpLine(sock.getInputStream())
            sock.close()
            val ok = line != null && line.contains(" 200 ")
            Log.i(TAG, "testConnection → $line (ok=$ok)")
            ok
        } catch (e: Exception) {
            Log.w(TAG, "testConnection failed: ${e.message}")
            false
        }
    }

    // ── Per-connection handler ────────────────────────────────────────────────

    private fun handleClient(client: Socket) {
        try {
            client.soTimeout = 30_000
            val cIn  = client.getInputStream()
            val cOut = client.getOutputStream()

            // SOCKS5 greeting
            if (cIn.read() != 5) return
            repeat(cIn.read()) { cIn.read() }           // skip offered methods
            cOut.write(byteArrayOf(5, 0)); cOut.flush() // select NO_AUTH

            // SOCKS5 request header: VER CMD RSV ATYP
            val hdr = ByteArray(4); readFull(cIn, hdr)
            if (hdr[1].toInt() != 1) return             // only CONNECT supported

            val targetHost: String = when (hdr[3].toInt()) {
                1 -> {  // IPv4
                    val b = ByteArray(4); readFull(cIn, b)
                    "${b[0].ui}.${b[1].ui}.${b[2].ui}.${b[3].ui}"
                }
                3 -> {  // domain name
                    val d = ByteArray(cIn.read()); readFull(cIn, d); String(d)
                }
                4 -> {  // IPv6
                    val b = ByteArray(16); readFull(cIn, b)
                    b.toList().chunked(2).joinToString(":") { "%02x%02x".format(it[0], it[1]) }
                }
                else -> return
            }
            val pb = ByteArray(2); readFull(cIn, pb)
            val targetPort = (pb[0].ui shl 8) or pb[1].ui

            // Open raw socket to our proxy server (outside the VPN TUN)
            val proxy = Socket(proxyHost, proxyPort)
            protectSocket(proxy)
            proxy.soTimeout = 30_000

            val pIn  = proxy.getInputStream()
            val pOut = proxy.getOutputStream()

            // Send HTTP CONNECT with MTN injection headers
            val req = "CONNECT $targetHost:$targetPort@$injectHost HTTP/1.0\r\n" +
                      "Host: $injectHost\r\n" +
                      "X-Online-Host: $injectHost\r\n" +
                      "X-Forward-Host: $injectHost\r\n" +
                      "X-Forwarded-For: $injectHost\r\n" +
                      "Connection: Keep-Alive\r\n" +
                      "User-Agent: Mozilla/5.0\r\n\r\n"
            pOut.write(req.toByteArray(Charsets.US_ASCII)); pOut.flush()

            // Validate proxy response
            val resp = readHttpLine(pIn)
            if (resp == null || !resp.contains(" 200 ")) {
                Log.w(TAG, "$targetHost:$targetPort proxy rejected: $resp")
                cOut.write(byteArrayOf(5, 5, 0, 1, 0, 0, 0, 0, 0, 0)); cOut.flush()
                proxy.close()
                return
            }
            while (true) { val l = readHttpLine(pIn) ?: break; if (l.isEmpty()) break }

            // Tell tun2socks the connection succeeded
            cOut.write(byteArrayOf(5, 0, 0, 1, 0, 0, 0, 0, 0, 0)); cOut.flush()

            // Bidirectional pipe — two blocking threads, each closes both sockets on EOF
            val t1 = Thread { pipe(cIn, pOut, client, proxy) }
            val t2 = Thread { pipe(pIn, cOut, proxy, client) }
            t1.start(); t2.start(); t1.join(); t2.join()

        } catch (e: Exception) {
            Log.w(TAG, "handler: ${e.message}")
        } finally {
            try { client.close() } catch (_: Exception) {}
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun pipe(from: InputStream, to: OutputStream, a: Socket, b: Socket) {
        val buf = ByteArray(16_384)
        try {
            while (true) {
                val n = from.read(buf)
                if (n < 0) break
                to.write(buf, 0, n); to.flush()
            }
        } catch (_: IOException) {}
        try { a.close() } catch (_: Exception) {}
        try { b.close() } catch (_: Exception) {}
    }

    private fun readFull(input: InputStream, buf: ByteArray) {
        var off = 0
        while (off < buf.size) {
            val n = input.read(buf, off, buf.size - off)
            if (n < 0) throw IOException("premature EOF")
            off += n
        }
    }

    private fun readHttpLine(input: InputStream): String? {
        val sb = StringBuilder()
        var prev = -1
        while (true) {
            val b = input.read()
            if (b < 0) return if (sb.isEmpty()) null else sb.toString().trimEnd('\r')
            if (prev == '\r'.code && b == '\n'.code) return sb.dropLast(1).toString()
            sb.append(b.toChar())
            prev = b
        }
    }

    private val Byte.ui: Int get() = toInt() and 0xFF
}
