package ug.tera5g

import android.app.Application
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.TrafficStats
import android.net.VpnService
import android.net.wifi.WifiManager
import android.telephony.TelephonyManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import ug.tera5g.config.*
import ug.tera5g.core.AccessToken
import ug.tera5g.freemode.FreeModeManager
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

    private val _connectionMode = MutableStateFlow(ConnectionMode.FREE_BROWSE)
    val connectionMode: StateFlow<ConnectionMode> = _connectionMode.asStateFlow()

    private val _vpnPermissionIntent = MutableStateFlow<Intent?>(null)
    val vpnPermissionIntent: StateFlow<Intent?> = _vpnPermissionIntent.asStateFlow()

    // ── Network stats ─────────────────────────────────────────────────────────
    private val _downloadSpeed = MutableStateFlow(0L)
    val downloadSpeed: StateFlow<Long> = _downloadSpeed.asStateFlow()

    private val _uploadSpeed = MutableStateFlow(0L)
    val uploadSpeed: StateFlow<Long> = _uploadSpeed.asStateFlow()

    private val _sessionDownloaded = MutableStateFlow(0L)
    val sessionDownloaded: StateFlow<Long> = _sessionDownloaded.asStateFlow()

    private val _sessionUploaded = MutableStateFlow(0L)
    val sessionUploaded: StateFlow<Long> = _sessionUploaded.asStateFlow()

    private val _networkName = MutableStateFlow<String?>(null)
    val networkName: StateFlow<String?> = _networkName.asStateFlow()

    private val _signalLevel = MutableStateFlow(0)
    val signalLevel: StateFlow<Int> = _signalLevel.asStateFlow()

    // ── Paywall enforcement ────────────────────────────────────────────────────
    private val _forceShowPaywall = MutableStateFlow(false)
    val forceShowPaywall: StateFlow<Boolean> = _forceShowPaywall.asStateFlow()

    private var serverConfig: ServerConfig? = null
    private var statsJob: Job? = null
    private var accessPollJob: Job? = null
    private var freeModeJob: Job? = null

    init {
        refreshAccess()
        viewModelScope.launch {
            vpnState.collect { state ->
                if (state == VpnState.CONNECTED) {
                    startNetworkStats()
                    startAccessPolling()
                } else {
                    stopMonitoringJobs()
                }
            }
        }
    }

    fun refreshAccess() {
        viewModelScope.launch {
            _accessToken.value = paymentRepo.getLocalToken()
            val result = paymentRepo.verifyWithBackend()
            _accessToken.value = paymentRepo.getLocalToken()
            if (result == false) _accessToken.value = null
        }
    }

    fun setRoutingMode(mode: RoutingMode) { _routingMode.value = mode }
    fun setConnectionMode(mode: ConnectionMode) { _connectionMode.value = mode }

    fun onVpnPermissionGranted() {
        _vpnPermissionIntent.value = null
        startVpn()
    }

    fun toggleConnection() {
        when (vpnState.value) {
            VpnState.CONNECTED, VpnState.CONNECTING, VpnState.FINDING_SERVER -> disconnect()
            else -> startVpn()
        }
    }

    private fun startVpn() {
        if (_connectionMode.value == ConnectionMode.FREE_BROWSE) {
            startFreeModeTunnel()
            return
        }
        val ctx = getApplication<Application>()

        val permIntent = VpnService.prepare(ctx)
        if (permIntent != null) {
            _vpnPermissionIntent.value = permIntent
            return
        }

        viewModelScope.launch {
            val config = serverConfig ?: serverRepo.getConfig()?.also { serverConfig = it }
                ?: return@launch
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

    private fun startFreeModeTunnel() {
        val ctx = getApplication<Application>()

        val permIntent = VpnService.prepare(ctx)
        if (permIntent != null) {
            _vpnPermissionIntent.value = permIntent
            return
        }

        freeModeJob?.cancel()
        freeModeJob = viewModelScope.launch(Dispatchers.IO) {
            val cm = ctx.getSystemService(ConnectivityManager::class.java)

            // Require any radio link — cellular counts even without a data plan.
            // Do NOT use cm.activeNetwork: Android sets it to null when there is no
            // internet service, even though the cellular radio is live and WireGuard
            // UDP packets can still flow through the carrier.
            val hasRadio = cm.allNetworks.any { net ->
                val caps = cm.getNetworkCapabilities(net) ?: return@any false
                caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
            }
            if (!hasRadio) {
                V2RayController.onStateChanged(VpnState.ERROR)
                return@launch
            }

            val configs = FreeModeManager.loadConfigs(ctx)
            if (configs.isEmpty()) {
                V2RayController.onStateChanged(VpnState.ERROR)
                return@launch
            }

            V2RayController.onStateChanged(VpnState.FINDING_SERVER)
            var roundOffset = FreeModeManager.getStartIndex(ctx) % configs.size
            var failRounds  = 0

            // Keep trying as long as the user hasn't disconnected (coroutine is active).
            while (isActive) {
                val ordered = configs.drop(roundOffset) + configs.take(roundOffset)
                var connected = false

                for (cfg in ordered) {
                    if (!isActive) return@launch

                    ug.tera5g.v2ray.VpnPrefs.saveLastMode(ctx, _connectionMode.value, _routingMode.value)
                    V2RayController.connectFreeMode(ctx, cfg.toJson())

                    var waited = 0
                    while (waited < 12_000 && isActive) {
                        delay(250); waited += 250
                        when (vpnState.value) {
                            VpnState.CONNECTED -> { FreeModeManager.saveSuccessIndex(ctx, cfg.index); connected = true }
                            VpnState.ERROR     -> { }
                            else               -> continue
                        }
                        break
                    }

                    if (connected) break
                    if (!isActive) return@launch
                    V2RayController.disconnect(ctx)
                    delay(300)
                }

                if (connected) {
                    failRounds = 0
                    // Hold until the connection drops, then retry automatically.
                    while (isActive && vpnState.value == VpnState.CONNECTED) {
                        delay(500)
                    }
                    if (!isActive) return@launch
                    // Unexpected drop — keep state visible and retry from last-working config.
                    V2RayController.onStateChanged(VpnState.FINDING_SERVER)
                } else {
                    // All configs failed this round — back off before the next sweep.
                    failRounds++
                    val backoffMs = minOf(failRounds * 5_000L, 60_000L)
                    delay(backoffMs)
                    roundOffset = (roundOffset + 1) % configs.size
                    if (isActive) V2RayController.onStateChanged(VpnState.FINDING_SERVER)
                }
            }
        }
    }

    fun disconnect() {
        freeModeJob?.cancel()
        freeModeJob = null
        V2RayController.disconnect(getApplication())
    }

    fun resetForcePaywall() { _forceShowPaywall.value = false }

    // ── Network monitoring ────────────────────────────────────────────────────

    private fun startNetworkStats() {
        statsJob?.cancel()
        _sessionDownloaded.value = 0L
        _sessionUploaded.value   = 0L
        statsJob = viewModelScope.launch {
            var prevRx = TrafficStats.getTotalRxBytes()
            var prevTx = TrafficStats.getTotalTxBytes()
            var tick = 0
            while (isActive) {
                delay(1_000)
                val currRx = TrafficStats.getTotalRxBytes()
                val currTx = TrafficStats.getTotalTxBytes()
                val dlDelta = (currRx - prevRx).coerceAtLeast(0L)
                val ulDelta = (currTx - prevTx).coerceAtLeast(0L)
                _downloadSpeed.value      = dlDelta
                _uploadSpeed.value        = ulDelta
                _sessionDownloaded.value += dlDelta
                _sessionUploaded.value   += ulDelta
                prevRx = currRx
                prevTx = currTx
                if (tick % 5 == 0) updateNetworkInfo()
                tick++
            }
        }
    }

    private fun startAccessPolling() {
        accessPollJob?.cancel()
        accessPollJob = viewModelScope.launch {
            while (isActive) {
                delay(30_000)
                val granted = paymentRepo.verifyWithBackend()
                when (granted) {
                    false -> {
                        if (vpnState.value == VpnState.CONNECTED) {
                            disconnect()
                            _forceShowPaywall.value = true
                        }
                        _accessToken.value = null
                    }
                    true  -> _accessToken.value = paymentRepo.getLocalToken()
                    null  -> { /* network error — keep current state */ }
                }
            }
        }
    }

    private fun stopMonitoringJobs() {
        statsJob?.cancel();      statsJob = null
        accessPollJob?.cancel(); accessPollJob = null
        _downloadSpeed.value     = 0L
        _uploadSpeed.value       = 0L
        _sessionDownloaded.value = 0L
        _sessionUploaded.value   = 0L
    }

    private fun updateNetworkInfo() {
        val ctx  = getApplication<Application>()
        val cm   = ctx.getSystemService(ConnectivityManager::class.java)
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return

        when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> {
                val wm = ctx.applicationContext.getSystemService(WifiManager::class.java)
                @Suppress("DEPRECATION")
                val rawSsid = wm.connectionInfo?.ssid
                val ssid = rawSsid?.trim('"')
                    ?.takeIf { it.isNotEmpty() && it != "<unknown ssid>" }
                _networkName.value = ssid ?: "WiFi"
                @Suppress("DEPRECATION")
                val rssi = wm.connectionInfo?.rssi ?: -100
                @Suppress("DEPRECATION")
                _signalLevel.value = WifiManager.calculateSignalLevel(rssi, 5).coerceIn(0, 4)
            }
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> {
                val tm      = ctx.getSystemService(TelephonyManager::class.java)
                val carrier = tm.networkOperatorName.takeIf { it.isNotEmpty() } ?: "Mobile"
                val netType = try {
                    when (tm.dataNetworkType) {
                        TelephonyManager.NETWORK_TYPE_NR   -> "5G"
                        TelephonyManager.NETWORK_TYPE_LTE  -> "4G"
                        TelephonyManager.NETWORK_TYPE_HSPAP,
                        TelephonyManager.NETWORK_TYPE_HSDPA,
                        TelephonyManager.NETWORK_TYPE_HSPA,
                        TelephonyManager.NETWORK_TYPE_UMTS -> "3G"
                        else                               -> ""
                    }
                } catch (_: SecurityException) { "" }
                _networkName.value = listOf(carrier, netType)
                    .filter { it.isNotEmpty() }.joinToString(" ")
                val bw = caps.linkDownstreamBandwidthKbps
                _signalLevel.value = when {
                    bw > 100_000 -> 4
                    bw > 20_000  -> 3
                    bw > 5_000   -> 2
                    bw > 0       -> 1
                    else         -> 0
                }
            }
            else -> {
                _networkName.value = null
                _signalLevel.value = 0
            }
        }
    }
}
