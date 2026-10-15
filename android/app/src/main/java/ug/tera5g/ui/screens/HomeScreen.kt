package ug.tera5g.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ug.tera5g.MainViewModel
import ug.tera5g.config.RoutingMode
import ug.tera5g.ui.components.*
import ug.tera5g.ui.theme.*
import ug.tera5g.v2ray.VpnState

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onPaywallRequested: () -> Unit
) {
    val vpnState    by viewModel.vpnState.collectAsState()
    val token       by viewModel.accessToken.collectAsState()
    val routingMode by viewModel.routingMode.collectAsState()
    val connMode    by viewModel.connectionMode.collectAsState()
    val permIntent  by viewModel.vpnPermissionIntent.collectAsState()

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { if (it.resultCode == android.app.Activity.RESULT_OK) viewModel.onVpnPermissionGranted() }

    LaunchedEffect(permIntent) {
        permIntent?.let { permLauncher.launch(it) }
    }

    val isConnected  = vpnState == VpnState.CONNECTED
    val hasAccess    = token?.isActive == true

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // ── Header ────────────────────────────────────────────────────
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Surface(
                    shape  = CircleShape,
                    color  = NeonGreen.copy(alpha = 0.15f),
                    modifier = Modifier.size(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            Icons.Outlined.Language,
                            contentDescription = null,
                            tint     = NeonGreen,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Spacer(Modifier.width(10.dp))
                Text(
                    "Tera5G",
                    style      = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    color      = MaterialTheme.colorScheme.onBackground
                )
                Spacer(Modifier.weight(1f))
                SessionTimer(token = token)
            }

            // ── Scrollable body ───────────────────────────────────────────
            Column(
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(16.dp))

                // Connect button (hero)
                ConnectButton(
                    state   = vpnState,
                    onClick = {
                        if (!hasAccess) onPaywallRequested()
                        else viewModel.toggleConnection()
                    }
                )

                Spacer(Modifier.height(10.dp))

                // No-access hint
                AnimatedVisibility(visible = !hasAccess) {
                    TextButton(onClick = onPaywallRequested) {
                        Icon(Icons.Outlined.Info, null, Modifier.size(15.dp))
                        Spacer(Modifier.width(4.dp))
                        Text(
                            "Get access from 500 UGX",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(Modifier.height(28.dp))

                // Connected status card
                AnimatedVisibility(
                    visible = isConnected,
                    enter   = fadeIn() + slideInVertically { it / 3 },
                    exit    = fadeOut() + slideOutVertically { it / 3 }
                ) {
                    ConnectedCard()
                    Spacer(Modifier.height(24.dp))
                }

                // ── Mode section ──────────────────────────────────────────
                Column(Modifier.fillMaxWidth()) {
                    Text(
                        "Traffic Mode",
                        style = MaterialTheme.typography.headlineSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    RoutingModeChips(
                        selected = routingMode,
                        onSelect = viewModel::setRoutingMode,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        when (routingMode) {
                            RoutingMode.SMART       -> "Smart routing bypasses local services directly."
                            RoutingMode.FULL_TUNNEL -> "All traffic is routed through the secure tunnel."
                            RoutingMode.FAST        -> "Local network stays direct for faster browsing."
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(Modifier.height(28.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                Spacer(Modifier.height(20.dp))

                ConnectionModeSelector(
                    selected  = connMode,
                    onSelect  = viewModel::setConnectionMode,
                    modifier  = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun ConnectedCard() {
    Surface(
        shape   = RoundedCornerShape(20.dp),
        color   = NeonGreen.copy(alpha = 0.08f),
        border  = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.22f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            Modifier.padding(horizontal = 18.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment     = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Surface(
                    shape = CircleShape,
                    color = NeonGreen.copy(alpha = 0.18f),
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.Shield, null, tint = NeonGreen, modifier = Modifier.size(18.dp))
                    }
                }
                Column {
                    Text(
                        "Connection Secure",
                        style      = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color      = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        "Encrypted & private",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = NeonGreen.copy(alpha = 0.15f)
            ) {
                Text(
                    "● Active",
                    style    = MaterialTheme.typography.labelSmall,
                    color    = NeonGreen,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                )
            }
        }
    }
}
