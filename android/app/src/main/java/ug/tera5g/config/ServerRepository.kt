package ug.tera5g.config

import android.content.Context
import android.util.Base64
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import ug.tera5g.BuildConfig
import ug.tera5g.core.DeviceId
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class ServerRepository(private val context: Context) {

    private val client = OkHttpClient.Builder().build()
    private val gson   = Gson()
    private var cached: ServerConfig? = null
    private var cachedAt: Long = 0
    private val ttlMs = 3_600_000L

    suspend fun getConfig(): ServerConfig? {
        val now = System.currentTimeMillis()
        if (cached != null && (now - cachedAt) < ttlMs) return cached
        return try {
            val fetched = fetchFromBackend()
            cached   = fetched
            cachedAt = now
            fetched
        } catch (e: Exception) {
            cached ?: loadBundledEmergency()
        }
    }

    private suspend fun fetchFromBackend(): ServerConfig = withContext(Dispatchers.IO) {
        val deviceId = DeviceId.get(context)
        val request  = Request.Builder()
            .url("${BuildConfig.BACKEND_URL}/api/config")
            .header("X-Device-Id", deviceId)
            .build()
        val response = client.newCall(request).execute()
        val body = response.body?.string() ?: throw Exception("Empty config response")
        if (!response.isSuccessful) throw Exception("Config fetch failed: ${response.code}")
        val encrypted = gson.fromJson(body, EncryptedPayload::class.java)
        val plain     = decrypt(encrypted)
        gson.fromJson(plain, ServerConfig::class.java)
    }

    private fun decrypt(payload: EncryptedPayload): String {
        val keyBytes = hexToBytes(BuildConfig.CONFIG_AES_KEY)
        val iv       = Base64.decode(payload.iv, Base64.NO_WRAP)
        val tag      = Base64.decode(payload.tag, Base64.NO_WRAP)
        val data     = Base64.decode(payload.data, Base64.NO_WRAP)
        val combined = data + tag
        val cipher   = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(keyBytes, "AES"), GCMParameterSpec(128, iv))
        return String(cipher.doFinal(combined), Charsets.UTF_8)
    }

    private fun loadBundledEmergency(): ServerConfig? = try {
        val json = context.assets.open("emergency_config.json").bufferedReader().readText()
        gson.fromJson(json, ServerConfig::class.java)
    } catch (e: Exception) { null }

    private fun hexToBytes(hex: String) = ByteArray(hex.length / 2) {
        hex.substring(it * 2, it * 2 + 2).toInt(16).toByte()
    }

    data class EncryptedPayload(val iv: String, val tag: String, val data: String)
}
