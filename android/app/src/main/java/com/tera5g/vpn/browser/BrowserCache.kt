package com.tera5g.vpn.browser

import android.content.Context
import java.io.File
import java.security.MessageDigest

class BrowserCache(context: Context) {
    private val dir = File(context.cacheDir, "relay_pages").also { it.mkdirs() }

    fun put(url: String, body: ByteArray, contentType: String) {
        val key = url.sha1()
        try {
            File(dir, "$key.body").writeBytes(body)
            File(dir, "$key.type").writeText(contentType)
        } catch (_: Exception) {}
    }

    fun get(url: String): Entry? {
        val key = url.sha1()
        val bodyFile = File(dir, "$key.body")
        val typeFile = File(dir, "$key.type")
        if (!bodyFile.exists() || !typeFile.exists()) return null
        return try {
            Entry(bodyFile.readBytes(), typeFile.readText())
        } catch (_: Exception) { null }
    }

    data class Entry(val body: ByteArray, val contentType: String) {
        override fun equals(other: Any?) = other is Entry && body.contentEquals(other.body) && contentType == other.contentType
        override fun hashCode() = 31 * body.contentHashCode() + contentType.hashCode()
    }

    private fun String.sha1(): String =
        MessageDigest.getInstance("SHA-1").digest(toByteArray()).joinToString("") { "%02x".format(it) }
}
