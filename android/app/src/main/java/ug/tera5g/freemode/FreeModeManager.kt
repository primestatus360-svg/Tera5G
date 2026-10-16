package ug.tera5g.freemode

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.gson.GsonBuilder

object FreeModeManager {

    private const val TAG = "FreeModeManager"
    private const val PREFS = "free_mode_prefs"
    private const val KEY_LAST_INDEX = "last_index"
    private const val WG_PORT = 51820

    private val gson = GsonBuilder().setPrettyPrinting().create()

    fun loadConfigs(context: Context): List<FreeModeConfig> {
        val results = mutableListOf<FreeModeConfig>()
        return try {
            val files = context.assets.list("wg") ?: return emptyList()
            files.filter { it.startsWith("am") && it.endsWith(".conf") }
                .sortedBy { it.removePrefix("am").removeSuffix(".conf").toIntOrNull() ?: Int.MAX_VALUE }
                .forEachIndexed { index, fileName ->
                    try {
                        val text = context.assets.open("wg/$fileName").bufferedReader().readText()
                        parseConf(index, text)?.let { results.add(it) }
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to parse $fileName: ${e.message}")
                    }
                }
            results
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load WG configs", e)
            emptyList()
        }
    }

    private fun parseConf(index: Int, text: String): FreeModeConfig? {
        var endpoint: String? = null
        var hash1: String? = null
        var hash2: String? = null
        for (line in text.lines()) {
            val trimmed = line.trim()
            when {
                trimmed.startsWith("Endpoint") -> endpoint = trimmed.substringAfter("=").trim()
                trimmed.startsWith("Hash1")    -> hash1    = trimmed.substringAfter("=").trim()
                trimmed.startsWith("Hash2")    -> hash2    = trimmed.substringAfter("=").trim()
            }
        }
        return if (endpoint != null && hash1 != null && hash2 != null)
            FreeModeConfig(index, endpoint, hash1, hash2)
        else null
    }

    fun buildXrayJson(cfg: FreeModeConfig): String {
        val ep = if (cfg.endpoint.contains(":")) cfg.endpoint else "${cfg.endpoint}:$WG_PORT"
        val config = mapOf(
            "log" to mapOf("loglevel" to "warning"),
            "inbounds" to listOf(
                mapOf(
                    "tag" to "socks",
                    "port" to 10808,
                    "listen" to "127.0.0.1",
                    "protocol" to "socks",
                    "settings" to mapOf("auth" to "noauth", "udp" to true, "userLevel" to 8),
                    "sniffing" to mapOf(
                        "enabled" to true,
                        "destOverride" to listOf("http", "tls", "quic")
                    )
                )
            ),
            "outbounds" to listOf(
                mapOf(
                    "tag" to "proxy",
                    "protocol" to "wireguard",
                    "settings" to mapOf(
                        "secretKey"      to cfg.privateKey,
                        "address"        to listOf("10.0.0.2/32"),
                        "peers" to listOf(mapOf(
                            "publicKey"  to cfg.serverPublicKey,
                            "endpoint"   to ep,
                            "allowedIPs" to listOf("0.0.0.0/0", "::/0"),
                            "keepAlive"  to 25
                        )),
                        "mtu"            to 1420
                    )
                ),
                mapOf(
                    "protocol" to "freedom",
                    "tag"      to "direct",
                    "settings" to mapOf("domainStrategy" to "UseIP")
                ),
                mapOf(
                    "protocol" to "blackhole",
                    "tag"      to "block",
                    "settings" to mapOf("response" to mapOf("type" to "http"))
                )
            ),
            "routing" to mapOf(
                "domainStrategy" to "IPIfNonMatch",
                "rules" to listOf(
                    mapOf(
                        "type"         to "field",
                        "outboundTag"  to "direct",
                        "ip"           to listOf("geoip:private")
                    ),
                    mapOf(
                        "type"         to "field",
                        "outboundTag"  to "proxy",
                        "port"         to "0-65535"
                    )
                )
            ),
            "dns" to mapOf(
                "servers" to listOf("1.1.1.1", "8.8.8.8")
            )
        )
        return gson.toJson(config)
    }

    fun getStartIndex(context: Context): Int =
        prefs(context).getInt(KEY_LAST_INDEX, 0)

    fun saveSuccessIndex(context: Context, index: Int) {
        prefs(context).edit().putInt(KEY_LAST_INDEX, index).apply()
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
