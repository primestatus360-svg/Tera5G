package ug.tera5g.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ug.tera5g.MainViewModel
import ug.tera5g.ui.components.*
import ug.tera5g.v2ray.VpnState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onPaywallRequested: () -> Unit
) {
    val vpnState     by viewModel.vpnState.collectAsStateWithLifecycle()
    val token        by viewModel.accessToken.collectAsStateWithLifecycle()
    val routingMode  by viewModel.routingMode.collectAsStateWithLifecycle()
    val connMode     by viewModel.connectionMode.collectAsStateWithLifecycle()
    val permIntent   by viewModel.vpnPermissionIntent.collectAsStateWithLifecycle()

    // Handle VPN permission dialog
    val permLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            viewModel.onVpnPermissionGranted()
        }
    }
    LaunchedEffect(permIntent) {
        permIntent?.let { permLauncher.launch(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Tera5G",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                actions = {
                    if (token != null) {
                        SessionTimer(token = token)
                        Spacer(Modifier.width(8.dp))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(24.dp))

            // ── Main Connect Button ─────────────────────────────────────────
            ConnectButton(
                state   = vpnState,
                onClick = {
                    val hasAccess = token?.isActive == true
                    if (!hasAccess) {
                        onPaywallRequested()
                    } else {
                        viewModel.toggleConnection()
                    }
                }
            )

            Spacer(Modifier.height(8.dp))

            // No access hint
            AnimatedVisibility(visible = token == null || token?.isActive == false) {
                TextButton(onClick = onPaywallRequested) {
                    Icon(
                        Icons.Outlined.Info,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "Get access from 500 UGX",
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(Modifier.height(32.dp))

            // ── Status Card ──────────────────────────────────────────────────
            AnimatedVisibility(
                visible = vpnState == VpnState.CONNECTED,
                enter   = fadeIn() + slideInVertically { it / 2 },
                exit    = fadeOut() + slideOutVertically { it / 2 }
            ) {
                Surface(
                    shape = MaterialTheme.shapes.large,
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Your connection is secure",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                "All traffic is encrypted and private",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = MaterialTheme.colorScheme.secondary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                "● Active",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // ── Routing Mode Chips ───────────────────────────────────────────
            Column(Modifier.fillMaxWidth()) {
                Text(
                    "Traffic Mode",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                RoutingModeChips(
                    selected = routingMode,
                    onSelect = viewModel::setRoutingMode,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    when (routingMode) {
                        ug.tera5g.config.RoutingMode.SMART ->
                            "Smart routing bypasses local services directly."
                        ug.tera5g.config.RoutingMode.FULL_TUNNEL ->
                            "All traffic is routed through the secure tunnel."
                        ug.tera5g.config.RoutingMode.FAST ->
                            "Local network stays direct for faster browsing."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(Modifier.height(28.dp))
            Divider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(Modifier.height(20.dp))

            // ── Connection Mode Selector ─────────────────────────────────────
            ConnectionModeSelector(
                selected  = connMode,
                onSelect  = viewModel::setConnectionMode,
                modifier  = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(40.dp))
        }
    }
}
