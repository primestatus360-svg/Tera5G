package com.tera5g.vpn

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.tera5g.vpn.ui.Accent
import com.tera5g.vpn.ui.BrowserScreen
import com.tera5g.vpn.ui.PaywallScreen
import com.tera5g.vpn.ui.Tera5GTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Tera5GTheme {
                val uiState by viewModel.uiState.collectAsState()
                val sessionInfo by viewModel.sessionInfo.collectAsState()

                when (uiState) {
                    UiState.LOADING -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Accent)
                    }
                    UiState.PAYWALL -> PaywallScreen(
                        onSessionActivated = { id, plan, exp ->
                            viewModel.onSessionActivated(id, plan, exp)
                        },
                    )
                    UiState.MAIN -> BrowserScreen(
                        sessionInfo = sessionInfo,
                        onSessionExpired = { viewModel.onSessionCleared() },
                    )
                }
            }
        }
    }
}
