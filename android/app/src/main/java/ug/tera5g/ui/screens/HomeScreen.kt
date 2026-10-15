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
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ug.tera5g.MainViewModel
import ug.tera5g.R
import ug.tera5g.config.RoutingMode
import ug.tera5g.ui.components.*
import ug.tera5g.ui.theme.*
import ug.tera5g.v2ray.VpnState

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onPaywallRequested: () -> Unit
) {
    val vpnState      by viewModel.vpnState.collectAsState()
    val token         by viewModel.accessToken.collectAsState()
    val routingMode   by viewModel.routingMode.collectAsState()
    val connMode      by viewModel.connectionMode.collectAsState()
    val permIntent    by viewModel.vpnPermissionIntent.collectAsState()
    val downloadSpeed by viewModel.downloadSpeed.collectAsState()
    val uploadSpeed   by viewModel.uploadSpeed.collectAsState()
    val networkName   by viewModel.networkName.collectAsState()
    val signalLevel   by viewModel.signalLevel.collectAsState()
    val forcePaywall  by viewModel.forceShowPaywall.collectAsState()

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { if (it.resultCode == android.app.Activity.RESULT_OK) viewModel.onVpnPermissionGranted() }

    LaunchedEffect(permIntent) {
        permIntent?.let { permLauncher.launch(it) }
    }

    LaunchedEffect(forcePaywall) {
        if (forcePaywall) {
            viewModel.resetForcePaywall()
            onPaywallRequested()
        }
    }

    val isConnected = vpnState == VpnState.CONNECTED
    val isActive    = vpnState == VpnState.CONNECTED ||
                      vpnState == VpnState.CONNECTING ||
                      vpnState == VpnState.FINDING_SERVER
    val hasAccess   = token?.isActive == true

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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape    = CircleShape,
                    color    = NeonGreen.copy(alpha = 0.15f),
                    modifier = Modifier.size(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Image(
                            painter            = painterResource(R.mipmap.ic_launcher_foreground),
                            contentDescription = null,
                            modifier           = Modifier.size(30.dp)
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

                ConnectButton(
                    state   = vpnState,
                    onClick = {
                        if (isActive) viewModel.toggleConnection()
                        else if (!hasAccess) onPaywallRequested()
                        else viewModel.toggleConnection()
                    }
                )

                Spacer(Modifier.height(10.dp))

                AnimatedVisibility(visible = !hasAccess && !isActive) {
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

                AnimatedVisibility(
                    visible = isConnected,
                    enter   = fadeIn() + slideInVertically { it / 3 },
                    exit    = fadeOut() + slideOutVertically { it / 3 }
                ) {
                    Column {
                        ConnectedCard(
                            networkName   = networkName,
                            signalLevel   = signalLevel,
                            downloadSpeed = downloadSpeed,
                            uploadSpeed   = uploadSpeed
                        )
                        Spacer(Modifier.height(24.dp))
                    }
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
                    selected = connMode,
                    onSelect = viewModel::setConnectionMode,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

@Composable
private fun ConnectedCard(
    networkName: String?,
    signalLevel: Int,
    downloadSpeed: Long,
    uploadSpeed: Long
) {
    Surface(
        shape    = RoundedCornerShape(20.dp),
        color    = NeonGreen.copy(alpha = 0.08f),
        border   = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.22f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(horizontal = 18.dp, vertical = 16.dp)) {

            // Top: shield + status text + active badge
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment     = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape    = CircleShape,
                        color    = NeonGreen.copy(alpha = 0.18f),
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

            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = NeonGreen.copy(alpha = 0.10f))
            Spacer(Modifier.height(12.dp))

            // Network name + signal bars
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Text(
                    networkName ?: "—",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                SignalBars(level = signalLevel)
            }

            Spacer(Modifier.height(8.dp))

            // Download + upload speed
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                SpeedChip(arrow = "↓", speed = downloadSpeed, color = NeonGreen)
                SpeedChip(arrow = "↑", speed = uploadSpeed,   color = ConnectingBlue)
            }
        }
    }
}

@Composable
private fun SignalBars(level: Int) {
    Row(
        verticalAlignment     = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        listOf(5.dp, 8.dp, 11.dp, 15.dp).forEachIndexed { index, height ->
            Box(
                Modifier
                    .width(4.dp)
                    .height(height)
                    .clip(RoundedCornerShape(1.dp))
                    .background(
                        if (index < level) NeonGreen else NeonGreen.copy(alpha = 0.18f)
                    )
            )
        }
    }
}

@Composable
private fun SpeedChip(arrow: String, speed: Long, color: Color) {
    Row(
        verticalAlignment     = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Text(
            arrow,
            style      = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.ExtraBold,
            color      = color
        )
        Text(
            formatSpeed(speed),
            style      = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Medium,
            color      = MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun formatSpeed(bytesPerSec: Long): String = when {
    bytesPerSec >= 1_048_576 -> "%.1f MB/s".format(bytesPerSec / 1_048_576.0)
    bytesPerSec >= 1_024     -> "%.0f KB/s".format(bytesPerSec / 1_024.0)
    else                     -> "${bytesPerSec} B/s"
}
