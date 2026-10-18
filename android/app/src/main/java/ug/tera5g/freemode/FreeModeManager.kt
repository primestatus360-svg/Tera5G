package ug.tera5g.freemode

import android.content.Context
import android.content.SharedPreferences

object FreeModeManager {

    private const val PREFS         = "free_mode_prefs"
    private const val KEY_LAST_INDEX = "last_index"

    // ── Proxy server configuration ────────────────────────────────────────────
    // Deploy backend/proxy-server.js on a VPS, then set these to point at it.
    // The proxy server parses "CONNECT host:port@injectHost" and strips the suffix.
    private const val MTN_PROXY_HOST  = "proxy.tera5g.ug"   // ← replace with your VPS IP/domain
    private const val MTN_PROXY_PORT  = 80
    private const val MTN_INJECT_HOST = "mtnplay.co.ug"

    fun loadConfigs(@Suppress("UNUSED_PARAMETER") context: Context): List<FreeModeConfig> =
        listOf(
            FreeModeConfig(
                index      = 0,
                name       = "MTN Uganda",
                proxyHost  = MTN_PROXY_HOST,
                proxyPort  = MTN_PROXY_PORT,
                injectHost = MTN_INJECT_HOST
            )
        )

    fun getStartIndex(context: Context): Int =
        prefs(context).getInt(KEY_LAST_INDEX, 0)

    fun saveSuccessIndex(context: Context, index: Int) {
        prefs(context).edit().putInt(KEY_LAST_INDEX, index).apply()
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
