package ug.tera5g

import android.app.Application
import android.content.Intent
import android.net.VpnService
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import ug.tera5g.config.*
import ug.tera5g.core.AccessToken
import ug.tera5g.payment.PaymentRepository
import ug.tera5g.v2ray.V2RayController
import ug.tera5g.v2ray.VpnState

class MainViewModel(app: Application) : AndroidViewModel(app) {

    private val serverRepo   = ServerRepository(app)
    private val paymentRepo  = PaymentRepository(app)

    val vpnState: StateFlow<VpnState> = V2RayController.state
    val currentProfile: StateFlow<ServerProfile?> = V2RayController.currentProfile

    private val _accessToken  = MutableStateFlow<AccessToken?>(null)
    val accessToken: StateFlow<AccessToken?> = _accessToken.asStateFlow()

    private val _routingMode  = MutableStateFlow(RoutingMode.SMART)
    val routingMode: StateFlow<RoutingMode> = _routingMode.asStateFlow()

    private val _connectionMode = MutableStateFlow(ConnectionMode.HIGH_SPEED)
    val connectionMode: StateFlow<ConnectionMode> = _connectionMode.asStateFlow()

    private val _vpnPermissionIntent = MutableStateFlow<Intent?>(null)
    val vpnPermissionIntent: StateFlow<Intent?> = _vpnPermissionIntent.asStateFlow()

    private var serverConfig: ServerConfig? = null

    init {
        refreshAccess()
    }

    fun refreshAccess() {
        viewModelScope.launch {
            // Show cached state immediately (fast path)
            _accessToken.value = paymentRepo.getLocalToken()
            // Always check backend — when paywall is off the server grants free access
            // to anyone who asks, even with no prior token
            paymentRepo.verifyWithBackend()
            _accessToken.value = paymentRepo.getLocalToken()
        }
    }

    fun setRoutingMode(mode: RoutingMode) { _routingMode.value = mode }
    fun setConnectionMode(mode: ConnectionMode) { _connectionMode.value = mode }

    fun onVpnPermissionGranted() {
        _vpnPermissionIntent.value = null
        startVpn()
    }

    fun toggleConnection() {
        if (vpnState.value == VpnState.CONNECTED) {
            disconnect()
        } else {
            startVpn()
        }
    }

    private fun startVpn() {
        val ctx = getApplication<Application>()

        val permIntent = VpnService.prepare(ctx)
        if (permIntent != null) {
            _vpnPermissionIntent.value = permIntent
            return
        }

        viewModelScope.launch {
            val config = serverConfig ?: serverRepo.getConfig()?.also { serverConfig = it }
                ?: return@launch
            // Persist current mode so BootReceiver can restore it after reboot
            ug.tera5g.v2ray.VpnPrefs.saveLastMode(ctx, _connectionMode.value, _routingMode.value)
            V2RayController.connect(
                context     = ctx,
                candidates  = config.servers,
                mode        = _connectionMode.value,
                routingMode = _routingMode.value,
                routing     = config.routing
            )
        }
    }

    fun disconnect() {
        V2RayController.disconnect(getApplication())
    }
}
