package ug.tera5g.v2ray

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.VpnService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import ug.tera5g.config.*
import ug.tera5g.port.DynamicPortManager

enum class VpnState { IDLE, FINDING_SERVER, CONNECTING, CONNECTED, DISCONNECTED, ERROR }

object V2RayController {

    private val _state = MutableStateFlow(VpnState.IDLE)
    val state: StateFlow<VpnState> = _state.asStateFlow()

    private val _currentProfile = MutableStateFlow<ServerProfile?>(null)
    val currentProfile: StateFlow<ServerProfile?> = _currentProfile.asStateFlow()

    private val portManager = DynamicPortManager()

    val VPN_PERMISSION_REQUEST_CODE = 1001

    fun onStateChanged(newState: VpnState) {
        _state.value = newState
    }

    // Returns null if VPN permission is needed (caller must call prepare())
    suspend fun connect(
        context: Context,
        candidates: List<ServerProfile>,
        mode: ConnectionMode,
        routingMode: RoutingMode,
        routing: RoutingConfig
    ) {
        _state.value = VpnState.FINDING_SERVER

        // Select the best server
        val selected = portManager.selectBest(candidates, mode)
            ?: run {
                _state.value = VpnState.ERROR
                return
            }
        _currentProfile.value = selected
        _state.value = VpnState.CONNECTING

        // Build V2Ray config JSON
        val configJson = ConfigBuilder.buildV2RayJson(selected, routingMode, routing)

        // Start VPN service
        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_START
            putExtra(V2RayVpnService.EXTRA_CONFIG_JSON, configJson)
        }
        context.startForegroundService(intent)

        // Start background monitoring for better server
        portManager.startBackgroundMonitoring(
            candidates,
            currentProfile = { _currentProfile.value }
        ) { betterProfile ->
            // Seamlessly switch to better server
            CoroutineScope(Dispatchers.Main).launch {
                val newConfig = ConfigBuilder.buildV2RayJson(betterProfile, routingMode, routing)
                _currentProfile.value = betterProfile
                disconnect(context)
                delay(500)
                val switchIntent = Intent(context, V2RayVpnService::class.java).apply {
                    action = V2RayVpnService.ACTION_START
                    putExtra(V2RayVpnService.EXTRA_CONFIG_JSON, newConfig)
                }
                context.startForegroundService(switchIntent)
            }
        }
    }

    fun connectFreeMode(context: Context, configJson: String) {
        _state.value = VpnState.CONNECTING
        _currentProfile.value = null
        val intent = Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_START
            putExtra(V2RayVpnService.EXTRA_CONFIG_JSON, configJson)
            putExtra(V2RayVpnService.EXTRA_IS_FREE_BROWSE, true)
        }
        context.startForegroundService(intent)
    }

    fun disconnect(context: Context) {
        portManager.stopMonitoring()
        _currentProfile.value = null
        context.startService(Intent(context, V2RayVpnService::class.java).apply {
            action = V2RayVpnService.ACTION_STOP
        })
        _state.value = VpnState.DISCONNECTED
    }

    fun checkPermission(context: Context): Intent? = VpnService.prepare(context)
}
