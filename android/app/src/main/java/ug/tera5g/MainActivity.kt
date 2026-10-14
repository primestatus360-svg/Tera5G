package ug.tera5g

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import ug.tera5g.ui.screens.HomeScreen
import ug.tera5g.ui.screens.PaywallScreen
import ug.tera5g.ui.theme.Tera5GTheme

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Keep splash visible while checking access token
        var accessChecked = false
        splash.setKeepOnScreenCondition { !accessChecked }

        setContent {
            Tera5GTheme {
                var showPaywall by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    viewModel.refreshAccess()
                    accessChecked = true
                }

                if (showPaywall) {
                    PaywallScreen(
                        onAccessGranted = {
                            showPaywall = false
                            viewModel.refreshAccess()
                        },
                        onDismiss = { showPaywall = false }
                    )
                } else {
                    HomeScreen(
                        viewModel = viewModel,
                        onPaywallRequested = { showPaywall = true }
                    )
                }
            }
        }
    }
}
