package ug.tera5g.v2ray

import android.content.Context
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.RoutingMode

object VpnPrefs {
    private const val NAME        = "vpn_state"
    private const val KEY_RUNNING = "was_running"
    private const val KEY_MODE    = "last_connection_mode"
    private const val KEY_ROUTING = "last_routing_mode"

    fun setRunning(context: Context, running: Boolean) {
        prefs(context).edit().putBoolean(KEY_RUNNING, running).apply()
    }

    fun wasRunning(context: Context): Boolean =
        prefs(context).getBoolean(KEY_RUNNING, false)

    fun saveLastMode(context: Context, mode: ConnectionMode, routing: RoutingMode) {
        prefs(context).edit()
            .putString(KEY_MODE,    mode.name)
            .putString(KEY_ROUTING, routing.name)
            .apply()
    }

    fun getLastConnectionMode(context: Context): ConnectionMode = try {
        ConnectionMode.valueOf(prefs(context).getString(KEY_MODE, null) ?: "")
    } catch (_: IllegalArgumentException) { ConnectionMode.HIGH_SPEED }

    fun getLastRoutingMode(context: Context): RoutingMode = try {
        RoutingMode.valueOf(prefs(context).getString(KEY_ROUTING, null) ?: "")
    } catch (_: IllegalArgumentException) { RoutingMode.SMART }

    private fun prefs(context: Context) =
        context.getSharedPreferences(NAME, Context.MODE_PRIVATE)
}
