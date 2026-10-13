package com.tera5g.vpn.browser

import android.content.Context
import java.io.File
import java.security.MessageDigest

class BrowserCache(context: Context) {
    private val dir = File(context.cacheDir, "relay_pages").also { it.mkdirs() }

    // Max cache size: 60 MB. Evict oldest entries when exceeded.
    private val maxBytes = 60L * 1024 * 1024

    fun put(url: String, body: ByteArray, contentType: String) {
        val key = cacheKey(url)
        try {
            File(dir, "$key.body").writeBytes(body)
            File(dir, "$key.type").writeText(contentType)
            File(dir, "$key.ts").writeText(System.currentTimeMillis().toString())
        } catch (_: Exception) {}
        evictIfNeeded()
    }

    fun get(url: String): Entry? {
        val key = cacheKey(url)
        val bodyFile = File(dir, "$key.body")
        val typeFile = File(dir, "$key.type")
        if (!bodyFile.exists() || !typeFile.exists()) return null
        return try {
            Entry(bodyFile.readBytes(), typeFile.readText())
        } catch (_: Exception) { null }
    }

    data class Entry(val body: ByteArray, val contentType: String) {
        override fun equals(other: Any?) =
            other is Entry && body.contentEquals(other.body) && contentType == other.contentType
        override fun hashCode() = 31 * body.contentHashCode() + contentType.hashCode()
    }

    // Strip fragment (#section) — different fragments of the same page share one cache entry
    private fun cacheKey(url: String): String {
        val stripped = url.substringBefore("#")
        return MessageDigest.getInstance("SHA-1")
            .digest(stripped.toByteArray())
            .joinToString("") { "%02x".format(it) }
    }

    private fun evictIfNeeded() {
        try {
            val bodies = dir.listFiles { f -> f.name.endsWith(".body") } ?: return
            val totalSize = bodies.sumOf { it.length() }
            if (totalSize <= maxBytes) return

            // Sort by last-modified time (oldest first) and delete until under limit
            val sorted = bodies.sortedBy { f ->
                val tsFile = File(dir, f.name.replace(".body", ".ts"))
                tsFile.readText().trim().toLongOrNull() ?: f.lastModified()
            }

            var freed = 0L
            val target = totalSize - (maxBytes * 3 / 4) // free down to 75% capacity
            for (f in sorted) {
                if (freed >= target) break
                freed += f.length()
                val base = f.name.replace(".body", "")
                File(dir, "$base.body").delete()
                File(dir, "$base.type").delete()
                File(dir, "$base.ts").delete()
            }
        } catch (_: Exception) {}
    }
}
