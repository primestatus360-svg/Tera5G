package com.tera5g.vpn.data

import android.content.Context

data class SessionInfo(
    val sessionId: String,
    val plan: String,
    val expiresAt: Long,
)

object SessionManager {
    private const val PREFS = "tera5g_session"
    private const val KEY_SESSION_ID = "session_id"
    private const val KEY_PLAN = "plan"
    private const val KEY_EXPIRES_AT = "expires_at"

    private lateinit var ctx: Context

    fun init(context: Context) {
        ctx = context.applicationContext
    }

    fun save(sessionId: String, plan: String, expiresAt: Long) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(KEY_SESSION_ID, sessionId)
            .putString(KEY_PLAN, plan)
            .putLong(KEY_EXPIRES_AT, expiresAt)
            .apply()
    }

    fun load(): SessionInfo? {
        val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val sessionId = prefs.getString(KEY_SESSION_ID, null) ?: return null
        val plan = prefs.getString(KEY_PLAN, null) ?: return null
        val expiresAt = prefs.getLong(KEY_EXPIRES_AT, 0L)
        if (expiresAt < System.currentTimeMillis()) return null
        return SessionInfo(sessionId, plan, expiresAt)
    }

    fun clear() {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
