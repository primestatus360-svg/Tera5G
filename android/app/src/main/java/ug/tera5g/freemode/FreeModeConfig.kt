package ug.tera5g.freemode

import com.google.gson.Gson

data class FreeModeConfig(
    val index: Int,
    val name: String,
    val proxyHost: String,
    val proxyPort: Int,
    val injectHost: String
) {
    fun toJson(): String = Gson().toJson(this)

    companion object {
        fun fromJson(json: String): FreeModeConfig =
            Gson().fromJson(json, FreeModeConfig::class.java)
    }
}
