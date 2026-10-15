package ug.tera5g

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.runtime.*
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import ug.tera5g.ui.screens.HomeScreen
import ug.tera5g.ui.screens.PaywallScreen
import ug.tera5g.ui.screens.SplashScreen
import ug.tera5g.ui.theme.Tera5GTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        splash.setKeepOnScreenCondition { false }

        setContent {
            Tera5GTheme {
                var showSplash  by remember { mutableStateOf(true) }
                var showPaywall by remember { mutableStateOf(false) }

                AnimatedContent(
                    targetState  = showSplash,
                    transitionSpec = { fadeIn(tween(420)) togetherWith fadeOut(tween(420)) },
                    label        = "root"
                ) { isSplash ->
                    if (isSplash) {
                        SplashScreen {
                            viewModel.refreshAccess()
                            showSplash = false
                        }
                    } else {
                        if (showPaywall) {
                            PaywallScreen(
                                onAccessGranted = { showPaywall = false; viewModel.refreshAccess() },
                                onDismiss       = { showPaywall = false }
                            )
                        } else {
                            HomeScreen(
                                viewModel         = viewModel,
                                onPaywallRequested = { showPaywall = true }
                            )
                        }
                    }
                }
            }
        }
    }
}
