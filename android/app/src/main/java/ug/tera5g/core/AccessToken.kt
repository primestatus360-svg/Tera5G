package ug.tera5g.core

data class AccessToken(
    val deviceId: String,
    val plan: String,          // "5h" | "24h"
    val expiresAt: Long,       // unix ms
    val txRef: String
) {
    val isActive: Boolean get() = System.currentTimeMillis() < expiresAt

    val remainingMs: Long get() = maxOf(0L, expiresAt - System.currentTimeMillis())

    val remainingFormatted: String get() {
        val ms = remainingMs
        val hours   = ms / 3_600_000
        val minutes = (ms % 3_600_000) / 60_000
        val seconds = (ms % 60_000) / 1_000
        return "%02d:%02d:%02d".format(hours, minutes, seconds)
    }

    companion object {
        val NONE = AccessToken("", "", 0L, "")
    }
}
