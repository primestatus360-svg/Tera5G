package com.tera5g.vpn.vpn

import android.net.VpnService
import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import okio.ByteString.Companion.toByteString
import java.io.InputStream
import java.io.OutputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class LocalProxyServer(
    private val sessionId: String,
    private val vpnService: VpnService,
) {
    companion object {
        private const val TAG = "LocalProxyServer"
        private const val PORT = 8080
    }

    private var serverSocket: ServerSocket? = null
    private var running = false

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    fun start() {
        running = true
        Thread({
            try {
                serverSocket = ServerSocket(PORT, 50, InetAddress.getByName("127.0.0.1"))
                Log.d(TAG, "Local proxy listening on 127.0.0.1:$PORT")
                while (running) {
                    try {
                        val client = serverSocket!!.accept()
                        Thread({ handleConnection(client) }, "proxy-conn").start()
                    } catch (e: Exception) {
                        if (running) Log.e(TAG, "Accept error", e)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Server socket error", e)
            }
        }, "proxy-server").start()
    }

    fun stop() {
        running = false
        try { serverSocket?.close() } catch (_: Exception) {}
    }

    private fun handleConnection(socket: Socket) {
        try {
            val input = socket.getInputStream()
            val output = socket.getOutputStream()

            // Read request line + headers byte by byte until \r\n\r\n
            val headerBytes = readUntilDoubleCrlf(input) ?: run {
                socket.close()
                return
            }
            val headerText = String(headerBytes, Charsets.US_ASCII)
            val lines = headerText.split("\r\n")
            if (lines.isEmpty()) { socket.close(); return }

            val requestLine = lines[0]

            if (requestLine.startsWith("CONNECT ")) {
                handleConnect(requestLine, input, output, socket)
            } else {
                handleHttp(requestLine, lines, output, socket)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Connection handler error", e)
            try { socket.close() } catch (_: Exception) {}
        }
    }

    /**
     * Reads bytes from the stream until the sequence \r\n\r\n is found.
     * Returns all bytes up to and including the terminator, or null on stream end.
     */
    private fun readUntilDoubleCrlf(input: InputStream): ByteArray? {
        val buf = mutableListOf<Byte>()
        val terminator = byteArrayOf('\r'.code.toByte(), '\n'.code.toByte(), '\r'.code.toByte(), '\n'.code.toByte())
        var matchLen = 0

        while (true) {
            val b = input.read()
            if (b == -1) return if (buf.isEmpty()) null else buf.toByteArray()
            buf.add(b.toByte())
            if (b.toByte() == terminator[matchLen]) {
                matchLen++
                if (matchLen == terminator.size) return buf.toByteArray()
            } else {
                matchLen = if (b.toByte() == terminator[0]) 1 else 0
            }
        }
    }

    // ─── CONNECT (HTTPS tunnel via WebSocket) ────────────────────────────────

    private fun handleConnect(
        requestLine: String,
        clientIn: InputStream,
        clientOut: OutputStream,
        socket: Socket,
    ) {
        // CONNECT host:port HTTP/1.1
        val parts = requestLine.split(" ")
        if (parts.size < 2) { socket.close(); return }
        val hostPort = parts[1]
        val colonIdx = hostPort.lastIndexOf(':')
        val host = if (colonIdx >= 0) hostPort.substring(0, colonIdx) else hostPort
        val port = if (colonIdx >= 0) hostPort.substring(colonIdx + 1).toIntOrNull() ?: 443 else 443

        val wsUrl = "${ApiClient.SERVER.replace("https://", "wss://")}/ws/tunnel" +
            "?host=${URLEncoder.encode(host, "UTF-8")}&port=$port&sessionId=${URLEncoder.encode(sessionId, "UTF-8")}"

        val request = Request.Builder().url(wsUrl).build()

        // Protect the underlying socket that OkHttp will open
        // OkHttp doesn't expose its socket before connect, so we use socketFactory interception;
        // instead we rely on VpnService.protect via a custom approach below.

        val connected = java.util.concurrent.CountDownLatch(1)
        var wsRef: WebSocket? = null
        var openSuccess = false

        val listener = object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                openSuccess = true
                wsRef = webSocket
                connected.countDown()
                // Signal the client that the tunnel is ready
                clientOut.write("HTTP/1.1 200 Connection Established\r\n\r\n".toByteArray(Charsets.US_ASCII))
                clientOut.flush()

                // Forward client → WS in a separate thread
                Thread({
                    try {
                        val chunk = ByteArray(8192)
                        while (true) {
                            val n = clientIn.read(chunk)
                            if (n == -1) break
                            webSocket.send(chunk.copyOf(n).toByteString())
                        }
                    } catch (_: Exception) {}
                    webSocket.close(1000, null)
                    try { socket.close() } catch (_: Exception) {}
                }, "ws-to-client-up").start()
            }

            override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
                try {
                    clientOut.write(bytes.toByteArray())
                    clientOut.flush()
                } catch (_: Exception) {
                    webSocket.close(1000, null)
                }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                try {
                    clientOut.write(text.toByteArray(Charsets.UTF_8))
                    clientOut.flush()
                } catch (_: Exception) {
                    webSocket.close(1000, null)
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WS failure for $host:$port", t)
                connected.countDown()
                try {
                    clientOut.write("HTTP/1.1 502 Bad Gateway\r\n\r\n".toByteArray(Charsets.US_ASCII))
                    clientOut.flush()
                } catch (_: Exception) {}
                try { socket.close() } catch (_: Exception) {}
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                try { socket.close() } catch (_: Exception) {}
            }
        }

        wsRef = httpClient.newWebSocket(request, listener)
        connected.await(30, TimeUnit.SECONDS)
        if (!openSuccess) {
            try { socket.close() } catch (_: Exception) {}
        }
    }

    // ─── Plain HTTP relay ─────────────────────────────────────────────────────

    private val ApiClient get() = com.tera5g.vpn.data.ApiClient

    private fun handleHttp(
        requestLine: String,
        allLines: List<String>,
        clientOut: OutputStream,
        socket: Socket,
    ) {
        try {
            // Extract target URL from request line: GET http://example.com/path HTTP/1.1
            val parts = requestLine.split(" ")
            if (parts.size < 2) { socket.close(); return }
            val targetUrl = parts[1]

            val encodedUrl = URLEncoder.encode(targetUrl, "UTF-8")
            val encodedSession = URLEncoder.encode(sessionId, "UTF-8")
            val relayUrl = "${com.tera5g.vpn.data.ApiClient.SERVER}/api/browse?url=$encodedUrl&sessionId=$encodedSession"

            val request = Request.Builder().url(relayUrl).get().build()

            httpClient.newCall(request).execute().use { resp ->
                // Write status line
                val statusLine = "HTTP/1.1 ${resp.code} ${resp.message}\r\n"
                clientOut.write(statusLine.toByteArray(Charsets.US_ASCII))

                // Write headers
                for (i in 0 until resp.headers.size) {
                    val name = resp.headers.name(i)
                    val value = resp.headers.value(i)
                    clientOut.write("$name: $value\r\n".toByteArray(Charsets.US_ASCII))
                }
                clientOut.write("\r\n".toByteArray(Charsets.US_ASCII))

                // Write body
                resp.body?.byteStream()?.use { bodyStream ->
                    val buf = ByteArray(8192)
                    while (true) {
                        val n = bodyStream.read(buf)
                        if (n == -1) break
                        clientOut.write(buf, 0, n)
                    }
                }
                clientOut.flush()
            }
        } catch (e: Exception) {
            Log.e(TAG, "HTTP relay error", e)
            try {
                clientOut.write("HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n".toByteArray(Charsets.US_ASCII))
                clientOut.flush()
            } catch (_: Exception) {}
        } finally {
            try { socket.close() } catch (_: Exception) {}
        }
    }
}
