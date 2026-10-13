package com.tera5g.vpn.browser

import android.graphics.Bitmap
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.ByteArrayInputStream
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class RelayWebViewClient(
    private val sessionId: String,
    private val cache: BrowserCache,
    private val onPageTitle: (String) -> Unit,
    private val onPageUrl: (String) -> Unit,
    private val onLoadingChanged: (Boolean) -> Unit,
    private val onNavState: (canBack: Boolean, canFwd: Boolean) -> Unit,
    private val onSessionExpired: () -> Unit,
    private val onRelayStatus: (reachable: Boolean) -> Unit,
) : WebViewClient() {

    // Short timeouts: fail fast so cache fallback kicks in quickly on zero-rated networks
    // where tera5g.world (behind Cloudflare) is reachable but Android reports no internet.
    private val http = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    companion object {
        private const val SERVER = "https://tera5g.world"

        // Patched into every HTML page so JS WebSocket connections are redirected
        // through /ws/proxy on tera5g.world (Cloudflare-fronted, carrier-accessible)
        // instead of going directly to their target domain which would be blocked.
        private const val WS_PATCH = """<script>(function(){if(window.__t5ws)return;window.__t5ws=true;
var W=window.WebSocket;window.WebSocket=function(u,p){try{
var r='wss://tera5g.world/ws/proxy?url='+encodeURIComponent(u)+'&sessionId=%SID%';
return new W(r,p);}catch(e){return new W(u,p);}};
window.WebSocket.prototype=W.prototype;
['CONNECTING','OPEN','CLOSING','CLOSED'].forEach(function(k){window.WebSocket[k]=W[k];});
})()</script>"""
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val url = request.url.toString()
        val scheme = request.url.scheme ?: ""

        // Only intercept HTTP/HTTPS — let WebView handle data:, blob:, file:, etc. natively
        if (scheme != "http" && scheme != "https") return null

        // CRITICAL FIX: Do NOT check Android's NET_CAPABILITY_INTERNET here.
        // On zero-rated connections (device has no data bundle but carrier allows
        // Cloudflare traffic), Android marks the network as having no internet even
        // though tera5g.world is perfectly reachable through Cloudflare.
        // We always attempt the relay first and fall back to cache on failure.

        val relayResult = fetchViaRelay(url, request)
        if (relayResult != null) {
            onRelayStatus(true)
            return relayResult
        }

        // Relay unreachable (timeout, no path to Cloudflare) — try disk cache
        val cached = serveFromCache(url)
        if (cached != null) {
            onRelayStatus(false)
            return cached
        }

        onRelayStatus(false)
        return offlinePage(request.isForMainFrame)
    }

    override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
        onLoadingChanged(true)
        onPageUrl(url)
        onNavState(view.canGoBack(), view.canGoForward())
    }

    override fun onPageFinished(view: WebView, url: String) {
        onLoadingChanged(false)
        onPageUrl(url)
        view.title?.let { if (it.isNotBlank() && it != url) onPageTitle(it) }
        onNavState(view.canGoBack(), view.canGoForward())
    }

    private fun fetchViaRelay(url: String, request: WebResourceRequest): WebResourceResponse? {
        return try {
            val encodedUrl = URLEncoder.encode(url, "UTF-8")
            val encodedSid = URLEncoder.encode(sessionId, "UTF-8")
            val relayUrl = "$SERVER/api/browse?url=$encodedUrl&sessionId=$encodedSid"

            val httpRequest = Request.Builder()
                .url(relayUrl)
                .header(
                    "User-Agent",
                    request.requestHeaders["User-Agent"]
                        ?: "Mozilla/5.0 (Linux; Android 11; Tera5G) AppleWebKit/537.36 Mobile Safari/537.36",
                )
                .header("Accept", request.requestHeaders["Accept"] ?: "*/*")
                .header("Accept-Language", request.requestHeaders["Accept-Language"] ?: "en-US,en;q=0.9")
                .build()

            val resp = http.newCall(httpRequest).execute()

            when (resp.code) {
                401 -> {
                    // Session expired — signal the UI to show paywall
                    onSessionExpired()
                    resp.body?.close()
                    return null
                }
                403 -> {
                    // Firewall patched mode — return the 403 page as-is
                    val bytes = resp.body?.bytes() ?: return null
                    val ct = resp.header("Content-Type") ?: "text/html"
                    return makeResponse(ct, bytes)
                }
            }

            val bytes = resp.body?.bytes() ?: return null
            val ct = resp.header("Content-Type") ?: "application/octet-stream"

            // Only cache successful responses
            if (resp.code in 200..299) {
                cache.put(url, bytes, ct)
                return makeResponse(ct, injectWsPatch(bytes, ct))
            }

            makeResponse(ct, bytes)
        } catch (_: Exception) {
            null
        }
    }

    // Inject the WebSocket redirect patch into every HTML page so that JS WebSocket
    // connections from page scripts are tunnelled through tera5g.world instead of
    // going directly to blocked domains.
    private fun injectWsPatch(bytes: ByteArray, contentType: String): ByteArray {
        val mime = contentType.split(";")[0].trim().lowercase()
        if (mime != "text/html") return bytes

        val html = try { bytes.toString(Charsets.UTF_8) } catch (_: Exception) { return bytes }
        val patch = WS_PATCH.replace("%SID%", sessionId)

        val injected = when {
            html.contains("<head>", ignoreCase = true) ->
                html.replaceFirst(Regex("<head>", RegexOption.IGNORE_CASE), "<head>$patch")
            html.contains("<body>", ignoreCase = true) ->
                html.replaceFirst(Regex("<body>", RegexOption.IGNORE_CASE), "$patch<body>")
            else -> patch + html
        }
        return injected.toByteArray(Charsets.UTF_8)
    }

    private fun serveFromCache(url: String): WebResourceResponse? {
        val entry = cache.get(url) ?: return null
        return makeResponse(entry.contentType, entry.body)
    }

    private fun offlinePage(isMain: Boolean): WebResourceResponse? {
        if (!isMain) return null
        val html = """<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:monospace;display:flex;flex-direction:column;
align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
h2{color:#1DB814;margin-bottom:16px;font-size:22px}
p{opacity:.55;line-height:1.8;font-size:13px}
.dot{width:8px;height:8px;border-radius:50%;background:#cc3333;margin:0 auto 20px}
.tip{margin-top:20px;font-size:11px;opacity:.3;border:1px solid #333;border-radius:6px;padding:8px 12px}
</style></head>
<body><div class="dot"></div>
<h2>Tera5G</h2>
<p>Cannot reach relay server.<br>This page has not been cached yet.</p>
<div class="tip">Relay: tera5g.world (Cloudflare) · Check your network</div>
</body></html>"""
        return WebResourceResponse("text/html", "UTF-8", ByteArrayInputStream(html.toByteArray()))
    }

    private fun makeResponse(contentType: String, body: ByteArray): WebResourceResponse {
        val parts = contentType.split(";")
        val mime = parts[0].trim().ifBlank { "application/octet-stream" }
        val charset = parts.drop(1)
            .firstOrNull { it.trim().startsWith("charset=", ignoreCase = true) }
            ?.trim()?.removePrefix("charset=")?.trim() ?: "UTF-8"
        return WebResourceResponse(mime, charset, ByteArrayInputStream(body))
    }
}
