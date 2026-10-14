package ug.tera5g.core

import android.content.Context
import android.provider.Settings
import java.security.MessageDigest

object DeviceId {
    private var cached: String? = null

    fun get(context: Context): String {
        if (cached != null) return cached!!
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"
        val input = "$androidId:${context.packageName}"
        cached = MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray(Charsets.UTF_8))
            .joinToString("") { "%02x".format(it) }
        return cached!!
    }
}
