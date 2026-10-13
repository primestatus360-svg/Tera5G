package com.tera5g.vpn

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.tera5g.vpn.ui.MainScreen
import com.tera5g.vpn.ui.PaywallScreen
import com.tera5g.vpn.ui.Tera5GTheme
import com.tera5g.vpn.ui.Accent
import com.tera5g.vpn.vpn.Tera5GVpnService

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    private val vpnReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                Tera5GVpnService.ACTION_VPN_STARTED -> viewModel.onVpnStarted()
                Tera5GVpnService.ACTION_VPN_STOPPED -> viewModel.onVpnStopped()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val filter = IntentFilter().apply {
            addAction(Tera5GVpnService.ACTION_VPN_STARTED)
            addAction(Tera5GVpnService.ACTION_VPN_STOPPED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(vpnReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(vpnReceiver, filter)
        }

        setContent {
            Tera5GTheme {
                val uiState by viewModel.uiState.collectAsState()
                val vpnState by viewModel.vpnState.collectAsState()
                val sessionInfo by viewModel.sessionInfo.collectAsState()

                var pendingStartVpn by remember { mutableStateOf(false) }

                val vpnPermissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.StartActivityForResult(),
                ) { result ->
                    if (result.resultCode == RESULT_OK) {
                        startVpnService(sessionInfo?.sessionId ?: "")
                    }
                }

                fun toggleVpn() {
                    val sId = sessionInfo?.sessionId ?: return
                    if (vpnState == VpnState.DISCONNECTED) {
                        val prepareIntent = VpnService.prepare(this@MainActivity)
                        if (prepareIntent == null) {
                            startVpnService(sId)
                        } else {
                            pendingStartVpn = true
                            vpnPermissionLauncher.launch(prepareIntent)
                        }
                    } else {
                        stopVpnService()
                    }
                }

                when (uiState) {
                    UiState.LOADING -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Accent)
                    }
                    UiState.PAYWALL -> PaywallScreen(
                        onSessionActivated = { id, plan, exp ->
                            viewModel.onSessionActivated(id, plan, exp)
                        },
                    )
                    UiState.MAIN -> MainScreen(
                        vpnState = vpnState,
                        sessionInfo = sessionInfo,
                        onToggleVpn = { toggleVpn() },
                        onGetPlan = { viewModel.onSessionCleared() },
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(vpnReceiver)
    }

    private fun startVpnService(sessionId: String) {
        val intent = Intent(this, Tera5GVpnService::class.java).apply {
            action = Tera5GVpnService.ACTION_START
            putExtra(Tera5GVpnService.EXTRA_SESSION_ID, sessionId)
        }
        startForegroundService(intent)
    }

    private fun stopVpnService() {
        val intent = Intent(this, Tera5GVpnService::class.java).apply {
            action = Tera5GVpnService.ACTION_STOP
        }
        startService(intent)
    }
}
