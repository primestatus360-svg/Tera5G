package ug.tera5g.core

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "tera5g_access",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun save(token: AccessToken) {
        prefs.edit()
            .putString("device_id",  token.deviceId)
            .putString("plan",       token.plan)
            .putLong("expires_at",   token.expiresAt)
            .putString("tx_ref",     token.txRef)
            .apply()
    }

    fun load(): AccessToken? {
        val deviceId  = prefs.getString("device_id",  null) ?: return null
        val plan      = prefs.getString("plan",       null) ?: return null
        val expiresAt = prefs.getLong("expires_at",   0L)
        val txRef     = prefs.getString("tx_ref",     "") ?: ""
        if (expiresAt == 0L) return null
        return AccessToken(deviceId, plan, expiresAt, txRef)
    }

    fun clear() {
        prefs.edit().clear().apply()
    }
}
