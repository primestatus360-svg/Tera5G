package ug.tera5g.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    val downloadSpeed    by viewModel.downloadSpeed.collectAsState()
    val uploadSpeed      by viewModel.uploadSpeed.collectAsState()
    val sessionDown      by viewModel.sessionDownloaded.collectAsState()
    val sessionUp        by viewModel.sessionUploaded.collectAsState()
    val networkName      by viewModel.networkName.collectAsState()
    val signalLevel      by viewModel.signalLevel.collectAsState()
    val forcePaywall  by viewModel.forceShowPaywall.collectAsState()

    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { if (it.resultCode == android.app.Activity.RESULT_OK) viewModel.onVpnPermissionGranted() }

    LaunchedEffect(permIntent) { permIntent?.let { permLauncher.launch(it) } }

    LaunchedEffect(forcePaywall) {
        if (forcePaywall) { viewModel.resetForcePaywall(); onPaywallRequested() }
    }

    val isConnected = vpnState == VpnState.CONNECTED
    val isActive    = vpnState == VpnState.CONNECTED ||
                      vpnState == VpnState.CONNECTING ||
                      vpnState == VpnState.FINDING_SERVER
    val hasAccess   = token?.isActive == true

    val glowColor by animateColorAsState(
        targetValue   = when {
            isConnected -> NeonGreen.copy(alpha = 0.13f)
            isActive    -> ConnectingBlue.copy(alpha = 0.08f)
            else        -> NeonGreen.copy(alpha = 0.04f)
        },
        animationSpec = tween(900), label = "glow"
    )

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // ── Ambient radial glow behind connect button ─────────────────────────
        Box(
            Modifier
                .size(560.dp)
                .align(Alignment.TopCenter)
                .offset(y = 70.dp)
                .background(Brush.radialGradient(listOf(glowColor, Color.Transparent)))
        )

        Column(
            Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            // ── Header ────────────────────────────────────────────────────────
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape    = CircleShape,
                    color    = NeonGreen.copy(alpha = 0.12f),
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

            // ── Scrollable body ───────────────────────────────────────────────
            Column(
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(20.dp))

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
                        Text(
                            "Get access from 500 UGX  →",
                            style         = MaterialTheme.typography.labelMedium,
                            color         = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                            letterSpacing = 0.3.sp
                        )
                    }
                }

                Spacer(Modifier.height(28.dp))

                // ── Connected card ────────────────────────────────────────────
                AnimatedVisibility(
                    visible = isConnected,
                    enter   = fadeIn() + slideInVertically { it / 3 },
                    exit    = fadeOut() + slideOutVertically { it / 3 }
                ) {
                    Column {
                        PremiumConnectedCard(
                            networkName      = networkName,
                            signalLevel      = signalLevel,
                            downloadSpeed    = downloadSpeed,
                            uploadSpeed      = uploadSpeed,
                            sessionDownBytes = sessionDown,
                            sessionUpBytes   = sessionUp
                        )
                        Spacer(Modifier.height(28.dp))
                    }
                }

                // ── Routing ───────────────────────────────────────────────────
                SectionLabel("Routing")
                Spacer(Modifier.height(10.dp))
                RoutingModeChips(
                    selected = routingMode,
                    onSelect = viewModel::setRoutingMode,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    when (routingMode) {
                        RoutingMode.SMART       -> "Local services bypass the tunnel automatically."
                        RoutingMode.FULL_TUNNEL -> "All traffic routed through the encrypted tunnel."
                        RoutingMode.FAST        -> "Direct local network, tunnel for blocked sites."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.55f)
                )

                Spacer(Modifier.height(28.dp))

                // Glowing divider
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color.Transparent,
                                    NeonGreen.copy(alpha = 0.18f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                Spacer(Modifier.height(24.dp))

                // ── Protocol ──────────────────────────────────────────────────
                SectionLabel("Protocol")
                Spacer(Modifier.height(12.dp))

                ConnectionModeSelector(
                    selected = connMode,
                    onSelect = viewModel::setConnectionMode,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(52.dp))
            }
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text          = text.uppercase(),
        style         = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.8.sp),
        fontWeight    = FontWeight.SemiBold,
        color         = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.50f),
        modifier      = Modifier.fillMaxWidth()
    )
}

@Composable
private fun PremiumConnectedCard(
    networkName: String?,
    signalLevel: Int,
    downloadSpeed: Long,
    uploadSpeed: Long,
    sessionDownBytes: Long,
    sessionUpBytes: Long
) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(GlassWhite)
            .border(1.dp, GlassBorder, RoundedCornerShape(24.dp))
    ) {
        // Subtle top green glow
        Box(
            Modifier
                .fillMaxWidth()
                .height(90.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(NeonGreen.copy(alpha = 0.06f), Color.Transparent)
                    )
                )
        )

        Column(Modifier.padding(horizontal = 20.dp, vertical = 18.dp)) {

            // Status row
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment     = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        Modifier
                            .size(38.dp)
                            .background(NeonGreen.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Shield, null, tint = NeonGreen, modifier = Modifier.size(18.dp))
                    }
                    Column {
                        Text(
                            "Connection Secure",
                            style      = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.SemiBold,
                            color      = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            "End-to-end encrypted",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)
                        )
                    }
                }
                // Live dot + "Active"
                Row(
                    Modifier
                        .background(NeonGreen.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment     = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Box(Modifier.size(6.dp).background(NeonGreen, CircleShape))
                    Text(
                        "Active",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonGreen
                    )
                }
            }

            Spacer(Modifier.height(14.dp))
            Box(Modifier.fillMaxWidth().height(1.dp).background(GlassBorder))
            Spacer(Modifier.height(14.dp))

            // Network name + signal
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment     = Alignment.CenterVertically
            ) {
                Text(
                    networkName ?: "—",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.75f)
                )
                SignalBars(level = signalLevel)
            }

            Spacer(Modifier.height(12.dp))

            // Speed row
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(32.dp)
            ) {
                SpeedChip(arrow = "↓", label = "Download", speed = downloadSpeed, color = NeonGreen)
                SpeedChip(arrow = "↑", label = "Upload",   speed = uploadSpeed,   color = ConnectingBlue)
            }

            Spacer(Modifier.height(12.dp))
            Box(Modifier.fillMaxWidth().height(1.dp).background(GlassBorder))
            Spacer(Modifier.height(12.dp))

            // Session data consumed
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Session Data",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.50f)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(
                        "↓ ${formatBytes(sessionDownBytes)}",
                        style      = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium,
                        color      = NeonGreen.copy(alpha = 0.85f)
                    )
                    Text(
                        "↑ ${formatBytes(sessionUpBytes)}",
                        style      = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Medium,
                        color      = ConnectingBlue.copy(alpha = 0.85f)
                    )
                }
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
                    .background(if (index < level) NeonGreen else NeonGreen.copy(alpha = 0.18f))
            )
        }
    }
}

@Composable
private fun SpeedChip(arrow: String, label: String, speed: Long, color: Color) {
    Column {
        Row(
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                arrow,
                style      = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.ExtraBold,
                color      = color
            )
            Text(
                formatSpeed(speed),
                style      = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color      = MaterialTheme.colorScheme.onSurface
            )
        }
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.45f)
        )
    }
}

private fun formatSpeed(bytesPerSec: Long): String = when {
    bytesPerSec >= 1_048_576 -> "%.1f MB/s".format(bytesPerSec / 1_048_576.0)
    bytesPerSec >= 1_024     -> "%.0f KB/s".format(bytesPerSec / 1_024.0)
    else                     -> "${bytesPerSec} B/s"
}

private fun formatBytes(bytes: Long): String = when {
    bytes >= 1_073_741_824 -> "%.2f GB".format(bytes / 1_073_741_824.0)
    bytes >= 1_048_576     -> "%.1f MB".format(bytes / 1_048_576.0)
    bytes >= 1_024         -> "%.0f KB".format(bytes / 1_024.0)
    else                   -> "${bytes} B"
}
