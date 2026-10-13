package com.tera5g.vpn.ui

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.tera5g.vpn.browser.BrowserCache
import com.tera5g.vpn.browser.RelayWebViewClient
import com.tera5g.vpn.data.SessionInfo
import kotlinx.coroutines.delay
import java.net.URLEncoder

private data class BrowserTab(val id: Int, val url: String, val title: String)

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun BrowserScreen(
    sessionInfo: SessionInfo?,
    onSessionExpired: () -> Unit,
) {
    val context = LocalContext.current

    // Stable MutableState objects captured by WebView callbacks
    val tabsState = remember { mutableStateOf(listOf(BrowserTab(0, "https://www.google.com", "New Tab"))) }
    val activeIdxState = remember { mutableStateOf(0) }
    val currentUrlState = remember { mutableStateOf("https://www.google.com") }
    val addressTextState = remember { mutableStateOf("https://www.google.com") }
    val addressFocusedState = remember { mutableStateOf(false) }
    val isLoadingState = remember { mutableStateOf(false) }
    val loadProgressState = remember { mutableStateOf(0) }
    val canGoBackState = remember { mutableStateOf(false) }
    val canGoFwdState = remember { mutableStateOf(false) }
    val webViewRef = remember { mutableStateOf<WebView?>(null) }
    val cache = remember { BrowserCache(context) }

    var tabs by tabsState
    var activeTabIdx by activeIdxState
    var currentUrl by currentUrlState
    var addressText by addressTextState
    var addressFocused by addressFocusedState
    var isLoading by isLoadingState
    var loadProgress by loadProgressState
    var canGoBack by canGoBackState
    var canGoFwd by canGoFwdState

    val sessionId = sessionInfo?.sessionId ?: ""

    LaunchedEffect(sessionInfo) {
        if (sessionInfo == null) { onSessionExpired(); return@LaunchedEffect }
        while (true) {
            delay(30_000)
            if (System.currentTimeMillis() > sessionInfo.expiresAt) { onSessionExpired(); break }
        }
    }

    val relayClient = remember(sessionId) {
        RelayWebViewClient(
            context = context,
            sessionId = sessionId,
            cache = cache,
            onPageTitle = { title ->
                val list = tabsState.value.toMutableList()
                val idx = activeIdxState.value
                if (idx in list.indices) { list[idx] = list[idx].copy(title = title); tabsState.value = list }
            },
            onPageUrl = { url ->
                currentUrlState.value = url
                if (!addressFocusedState.value) addressTextState.value = url
                val list = tabsState.value.toMutableList()
                val idx = activeIdxState.value
                if (idx in list.indices) { list[idx] = list[idx].copy(url = url); tabsState.value = list }
            },
            onLoadingChanged = { loading -> isLoadingState.value = loading },
            onNavState = { back, fwd ->
                canGoBackState.value = back
                canGoFwdState.value = fwd
            },
        )
    }

    val chromeClient = remember {
        object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                loadProgressState.value = newProgress
            }
            override fun onReceivedTitle(view: WebView, title: String?) {
                if (!title.isNullOrBlank() && title != "about:blank") {
                    val list = tabsState.value.toMutableList()
                    val idx = activeIdxState.value
                    if (idx in list.indices) { list[idx] = list[idx].copy(title = title); tabsState.value = list }
                }
            }
        }
    }

    BackHandler {
        val wv = webViewRef.value
        if (wv?.canGoBack() == true) wv.goBack()
    }

    Column(Modifier.fillMaxSize().background(Color.Black)) {

        // ── Tab Bar ───────────────────────────────────────────
        Row(
            Modifier.fillMaxWidth().height(40.dp).background(Color(0xFF0F0F0F)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                Modifier.weight(1f).horizontalScroll(rememberScrollState()),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                tabs.forEachIndexed { i, tab ->
                    val active = i == activeTabIdx
                    Row(
                        modifier = Modifier
                            .height(32.dp)
                            .widthIn(min = 72.dp, max = 150.dp)
                            .padding(horizontal = 2.dp, vertical = 3.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (active) Color(0xFF1C1C1E) else Color.Transparent)
                            .clickable {
                                activeTabIdx = i
                                webViewRef.value?.loadUrl(tab.url)
                            }
                            .padding(horizontal = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            tab.title.ifBlank { "New Tab" },
                            color = if (active) Color.White else Color.White.copy(.45f),
                            fontSize = 11.sp, maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f),
                        )
                        if (tabs.size > 1) {
                            Spacer(Modifier.width(4.dp))
                            Text(
                                "×",
                                color = Color.White.copy(.5f),
                                fontSize = 14.sp,
                                modifier = Modifier.clickable {
                                    val newTabs = tabs.toMutableList().also { it.removeAt(i) }
                                    tabs = newTabs
                                    val newIdx = (i - 1).coerceAtLeast(0).coerceAtMost(newTabs.lastIndex)
                                    activeTabIdx = newIdx
                                    webViewRef.value?.loadUrl(newTabs[newIdx].url)
                                },
                            )
                        }
                    }
                }
            }
            Box(
                Modifier.size(40.dp).clickable {
                    val nid = (tabs.maxOfOrNull { it.id } ?: 0) + 1
                    val url = "https://www.google.com"
                    tabs = tabs + BrowserTab(nid, url, "New Tab")
                    activeTabIdx = tabs.lastIndex
                    webViewRef.value?.loadUrl(url)
                },
                contentAlignment = Alignment.Center,
            ) {
                Text("+", color = Accent, fontSize = 22.sp, fontWeight = FontWeight.Light)
            }
        }

        // ── Address Bar ───────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth().height(46.dp)
                .background(Color(0xFF111111))
                .padding(horizontal = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            NavBtn("←", canGoBack) { webViewRef.value?.goBack() }
            NavBtn("→", canGoFwd) { webViewRef.value?.goForward() }
            NavBtn(if (isLoading) "✕" else "↻", true) {
                if (isLoading) webViewRef.value?.stopLoading() else webViewRef.value?.reload()
            }

            Box(
                modifier = Modifier
                    .weight(1f).height(30.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFF1C1C1E))
                    .border(1.dp, Color.White.copy(.07f), RoundedCornerShape(8.dp))
                    .clickable { addressFocused = true; addressText = currentUrl }
                    .padding(horizontal = 10.dp),
                contentAlignment = Alignment.CenterStart,
            ) {
                if (addressFocused) {
                    BasicTextField(
                        value = addressText,
                        onValueChange = { addressText = it },
                        singleLine = true,
                        textStyle = TextStyle(
                            color = Color.White,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                        ),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Go),
                        keyboardActions = KeyboardActions(onGo = {
                            addressFocused = false
                            val nav = resolveInput(addressText)
                            webViewRef.value?.loadUrl(nav)
                        }),
                        modifier = Modifier.fillMaxWidth(),
                        decorationBox = { inner ->
                            if (addressText.isEmpty()) {
                                Text("Search or enter address", color = Color.White.copy(.3f), fontSize = 11.sp)
                            }
                            inner()
                        },
                    )
                } else {
                    Text(
                        currentUrl.ifBlank { "New Tab" },
                        color = Color.White.copy(.65f),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }

            // Relay badge
            Box(
                Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Accent.copy(.1f))
                    .border(1.dp, Accent.copy(.2f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 5.dp, vertical = 3.dp),
            ) {
                Text("RELAY", color = Accent, fontSize = 8.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
            }
        }

        // ── Progress bar ──────────────────────────────────────
        if (isLoading) {
            LinearProgressIndicator(
                progress = { loadProgress / 100f },
                modifier = Modifier.fillMaxWidth().height(2.dp),
                color = Accent,
                trackColor = Color.Transparent,
            )
        }

        // ── WebView ───────────────────────────────────────────
        AndroidView(
            factory = { ctx ->
                @SuppressLint("SetJavaScriptEnabled")
                WebView(ctx).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.loadWithOverviewMode = true
                    settings.useWideViewPort = true
                    settings.setSupportZoom(true)
                    settings.builtInZoomControls = true
                    settings.displayZoomControls = false
                    webViewClient = relayClient
                    webChromeClient = chromeClient
                    loadUrl("https://www.google.com")
                    webViewRef.value = this
                }
            },
            update = { wv ->
                wv.webViewClient = relayClient
                wv.webChromeClient = chromeClient
            },
            modifier = Modifier.weight(1f).fillMaxWidth(),
        )

        // ── Status Footer ──────────────────────────────────────
        Row(
            Modifier
                .fillMaxWidth()
                .background(Color(0xFF090909))
                .padding(horizontal = 12.dp, vertical = 3.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(5.dp).clip(CircleShape).background(Accent))
                Spacer(Modifier.width(5.dp))
                Text(
                    "tera5g.world relay",
                    color = Color.White.copy(.2f),
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                )
            }
            sessionInfo?.let { info ->
                val rem = (info.expiresAt - System.currentTimeMillis()).coerceAtLeast(0)
                val h = rem / 3_600_000
                val m = (rem % 3_600_000) / 60_000
                Text(
                    "%dh %02dm".format(h, m),
                    color = Accent.copy(.5f),
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
    }
}

private fun resolveInput(input: String): String {
    val s = input.trim()
    return when {
        s.startsWith("http://") || s.startsWith("https://") -> s
        s.contains(".") && !s.contains(" ") -> "https://$s"
        else -> "https://www.google.com/search?q=${URLEncoder.encode(s, "UTF-8")}"
    }
}

@Composable
private fun NavBtn(label: String, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .size(32.dp)
            .clip(RoundedCornerShape(6.dp))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = if (enabled) Color.White.copy(.85f) else Color.White.copy(.2f), fontSize = 16.sp)
    }
}
