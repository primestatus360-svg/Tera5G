package com.tera5g.vpn.browser

import android.content.Context
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
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
    private val context: Context,
    private val sessionId: String,
    private val cache: BrowserCache,
    private val onPageTitle: (String) -> Unit,
    private val onPageUrl: (String) -> Unit,
    private val onLoadingChanged: (Boolean) -> Unit,
    private val onNavState: (canBack: Boolean, canFwd: Boolean) -> Unit,
) : WebViewClient() {

    private val http = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    companion object {
        private const val SERVER = "https://tera5g.world"
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val url = request.url.toString()
        val scheme = request.url.scheme ?: ""
        if (scheme != "http" && scheme != "https") return null

        return if (hasConnectivity()) {
            fetchViaRelay(url) ?: serveFromCache(url) ?: offlinePage(request.isForMainFrame)
        } else {
            serveFromCache(url) ?: offlinePage(request.isForMainFrame)
        }
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

    private fun fetchViaRelay(url: String): WebResourceResponse? = try {
        val encodedUrl = URLEncoder.encode(url, "UTF-8")
        val encodedSid = URLEncoder.encode(sessionId, "UTF-8")
        val relayUrl = "$SERVER/api/browse?url=$encodedUrl&sessionId=$encodedSid"
        val resp = http.newCall(Request.Builder().url(relayUrl).build()).execute()
        val bytes = resp.body?.bytes() ?: return null
        val ct = resp.header("Content-Type") ?: "application/octet-stream"
        cache.put(url, bytes, ct)
        makeResponse(ct, bytes)
    } catch (_: Exception) { null }

    private fun serveFromCache(url: String): WebResourceResponse? {
        val entry = cache.get(url) ?: return null
        return makeResponse(entry.contentType, entry.body)
    }

    private fun offlinePage(isMain: Boolean): WebResourceResponse? {
        if (!isMain) return null
        val html = """<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#fff;font-family:monospace;
display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
h2{color:#1DB814;margin-bottom:16px;font-size:22px}p{opacity:.55;line-height:1.8;font-size:13px}
.dot{width:8px;height:8px;border-radius:50%;background:#cc3333;margin:0 auto 20px}</style>
</head><body><div class="dot"></div><h2>Tera5G</h2>
<p>Cannot reach relay server.<br>This page has not been cached.<br>Check your connection and try again.</p>
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

    private fun hasConnectivity(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val caps = cm.getNetworkCapabilities(cm.activeNetwork ?: return false) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
