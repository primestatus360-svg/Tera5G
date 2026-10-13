package com.tera5g.vpn

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.tera5g.vpn.data.SessionInfo
import com.tera5g.vpn.data.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class VpnState { DISCONNECTED, CONNECTED }
enum class UiState { LOADING, PAYWALL, MAIN }

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val _sessionInfo = MutableStateFlow<SessionInfo?>(null)
    val sessionInfo = _sessionInfo.asStateFlow()

    private val _vpnState = MutableStateFlow(VpnState.DISCONNECTED)
    val vpnState = _vpnState.asStateFlow()

    private val _uiState = MutableStateFlow(UiState.LOADING)
    val uiState = _uiState.asStateFlow()

    init {
        val session = SessionManager.load()
        _sessionInfo.value = session
        _uiState.value = if (session != null) UiState.MAIN else UiState.PAYWALL
    }

    fun onSessionActivated(sessionId: String, plan: String, expiresAt: Long) {
        SessionManager.save(sessionId, plan, expiresAt)
        _sessionInfo.value = SessionInfo(sessionId, plan, expiresAt)
        _uiState.value = UiState.MAIN
    }

    fun onSessionCleared() {
        SessionManager.clear()
        _sessionInfo.value = null
        _vpnState.value = VpnState.DISCONNECTED
        _uiState.value = UiState.PAYWALL
    }

    fun onVpnStarted() {
        _vpnState.value = VpnState.CONNECTED
    }

    fun onVpnStopped() {
        _vpnState.value = VpnState.DISCONNECTED
    }
}
