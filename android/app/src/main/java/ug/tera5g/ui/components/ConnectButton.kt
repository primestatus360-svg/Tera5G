package ug.tera5g.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ug.tera5g.ui.theme.*
import ug.tera5g.v2ray.VpnState

@Composable
fun ConnectButton(
    state: VpnState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isConnected  = state == VpnState.CONNECTED
    val isConnecting = state == VpnState.CONNECTING || state == VpnState.FINDING_SERVER

    val infinite = rememberInfiniteTransition(label = "btn")

    // Radar pulse (connecting)
    val pulse by infinite.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(1300, easing = LinearEasing), RepeatMode.Restart),
        "pulse"
    )

    // Glow breathe (connected)
    val breathe by infinite.animateFloat(
        0.15f, 0.30f,
        infiniteRepeatable(tween(2000, easing = EaseInOutSine), RepeatMode.Reverse),
        "breathe"
    )

    // Scale spring on state change
    val buttonScale by animateFloatAsState(
        targetValue   = if (isConnected) 1.05f else 1f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow),
        label = "scale"
    )

    val iconTint = when {
        isConnected  -> NeonGreen
        isConnecting -> ConnectingBlue
        else         -> DisconnectedGray
    }
    val ringColor = when {
        isConnected  -> NeonGreen
        isConnecting -> ConnectingBlue
        else         -> DarkOutline
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(224.dp).scale(buttonScale)
        ) {
            // Connected glow halo
            if (isConnected) {
                Box(
                    Modifier
                        .size(224.dp)
                        .background(NeonGreen.copy(breathe), CircleShape)
                )
            }

            // Radar rings (connecting) — two rings offset by 50% phase
            if (isConnecting) {
                listOf(pulse, (pulse + 0.5f) % 1f).forEach { p ->
                    Box(
                        Modifier
                            .size(200.dp)
                            .scale(0.55f + p * 0.95f)
                            .alpha((1f - p) * 0.55f)
                            .background(ConnectingBlue.copy(0.28f), CircleShape)
                    )
                }
            }

            // Outer ring
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(186.dp)
                    .shadow(
                        elevation     = if (isConnected) 22.dp else 8.dp,
                        shape         = CircleShape,
                        ambientColor  = ringColor.copy(if (isConnected) 0.35f else 0.15f),
                        spotColor     = ringColor.copy(if (isConnected) 0.35f else 0.15f)
                    )
                    .background(DarkSurface, CircleShape)
            ) {
                // Inner clickable circle
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(156.dp)
                        .background(
                            color = when {
                                isConnected  -> NeonGreen.copy(0.14f)
                                isConnecting -> ConnectingBlue.copy(0.10f)
                                else         -> DarkSurfaceVariant
                            },
                            shape = CircleShape
                        )
                        .border(
                            width = if (isConnected) 2.5.dp else 1.5.dp,
                            color = ringColor.copy(if (isConnected) 1f else 0.55f),
                            shape = CircleShape
                        )
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick    = onClick
                        )
                ) {
                    Icon(
                        imageVector        = Icons.Outlined.Language,
                        contentDescription = "Connect / Disconnect",
                        tint               = iconTint,
                        modifier           = Modifier.size(58.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(22.dp))

        Text(
            text = when {
                isConnected  -> "Protected"
                isConnecting -> if (state == VpnState.FINDING_SERVER) "Finding Server…" else "Connecting…"
                else         -> "Tap to Connect"
            },
            style      = MaterialTheme.typography.displaySmall,
            fontWeight = FontWeight.SemiBold,
            color      = when {
                isConnected  -> NeonGreen
                isConnecting -> ConnectingBlue
                else         -> MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
    }
}
