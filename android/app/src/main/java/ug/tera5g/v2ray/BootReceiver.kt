package ug.tera5g.v2ray

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.util.Log
import kotlinx.coroutines.*
import ug.tera5g.config.ConfigBuilder
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.ServerRepository
import ug.tera5g.core.TokenStore
import ug.tera5g.port.DynamicPortManager

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "Tera5G_Boot"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED) return

        // Only attempt reconnect if VPN was explicitly running before reboot
        if (!VpnPrefs.wasRunning(context)) return

        // goAsync() keeps the BroadcastReceiver alive while we do coroutine work
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                reconnectVpn(context)
            } catch (e: Exception) {
                Log.e(TAG, "Boot reconnect failed", e)
            } finally {
                pending.finish()
            }
        }
    }

    private suspend fun reconnectVpn(context: Context) {
        // 1. Verify the user's access token is still valid before reconnecting
        val token = TokenStore(context).load()
        if (token?.isActive != true) {
            Log.i(TAG, "Access expired — clearing VPN running state")
            VpnPrefs.setRunning(context, false)
            return
        }

        // 2. VPN permission must have been pre-granted (user previously connected).
        //    We cannot show a permission dialog from a BroadcastReceiver.
        if (VpnService.prepare(context) != null) {
            Log.w(TAG, "VPN permission not pre-granted — cannot auto-reconnect after boot")
            return
        }

        // 3. Load server config — prefers in-memory cache, falls back to emergency bundle
        val config = ServerRepository(context).getConfig()
        if (config == null || config.servers.isEmpty()) {
            Log.e(TAG, "No server config available for boot reconnect")
            return
        }

        // 4. Restore the last chosen connection and routing modes
        val connMode    = VpnPrefs.getLastConnectionMode(context)
        val routingMode = VpnPrefs.getLastRoutingMode(context)

        // Free Browse uses its own WireGuard config loop — cannot auto-reconnect
        // from a BroadcastReceiver without a UI context to iterate configs.
        if (connMode == ConnectionMode.FREE_BROWSE) {
            VpnPrefs.setRunning(context, false)
            Log.i(TAG, "Last mode was Free Browse — skipping auto-reconnect after boot")
            return
        }

        // 5. Select the lowest-latency server for the restored mode
        val portManager = DynamicPortManager()
        val candidates  = config.servers
            .filter { it.connectionMode == connMode }
            .ifEmpty { config.servers }

        val best = portManager.selectBest(candidates, connMode)
        portManager.destroy()

        if (best == null) {
            Log.e(TAG, "No reachable server found during boot reconnect")
            return
        }

        // 6. Build config and start the VPN service
        val configJson  = ConfigBuilder.buildV2RayJson(best, routingMode, config.routing)
        val startIntent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_START
            putExtra(V2RayVpnService.EXTRA_CONFIG_JSON, configJson)
        }
        context.startForegroundService(startIntent)

        Log.i(TAG, "Boot reconnect → ${best.protocol}://${best.address}:${best.port} [${connMode.label}]")
    }
}
