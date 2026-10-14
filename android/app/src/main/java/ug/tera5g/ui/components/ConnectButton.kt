package ug.tera5g.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
    val isConnected    = state == VpnState.CONNECTED
    val isConnecting   = state == VpnState.CONNECTING || state == VpnState.FINDING_SERVER

    val buttonColor = when {
        isConnected  -> ConnectedGreen
        isConnecting -> ConnectingBlue
        else         -> DisconnectedGray
    }

    // Pulse animation when connecting
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue  = if (isConnecting) 1.08f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ), label = "pulseScale"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue  = if (isConnecting) 0.0f else 0.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ), label = "pulseAlpha"
    )

    // Glow ring when connected
    val glowScale by animateFloatAsState(
        targetValue  = if (isConnected) 1.18f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label        = "glowScale"
    )

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(200.dp)
        ) {
            // Outer glow ring (connected state)
            if (isConnected) {
                Box(
                    Modifier
                        .size(200.dp)
                        .scale(glowScale)
                        .background(
                            color  = ConnectedGreen.copy(alpha = 0.15f),
                            shape  = CircleShape
                        )
                )
            }

            // Pulse ring (connecting state)
            if (isConnecting) {
                Box(
                    Modifier
                        .size(200.dp)
                        .scale(pulseScale)
                        .alpha(pulseAlpha)
                        .background(
                            color  = ConnectingBlue.copy(alpha = 0.25f),
                            shape  = CircleShape
                        )
                )
            }

            // Middle ring
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(176.dp)
                    .shadow(
                        elevation = if (isConnected) 16.dp else 6.dp,
                        shape     = CircleShape,
                        ambientColor  = buttonColor.copy(alpha = 0.3f),
                        spotColor     = buttonColor.copy(alpha = 0.3f)
                    )
                    .background(
                        color  = if (isConnected) ConnectedGreen.copy(0.12f)
                                 else MaterialTheme.colorScheme.surface,
                        shape  = CircleShape
                    )
            ) {
                // Inner button
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(148.dp)
                        .background(color = buttonColor, shape = CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = onClick
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = "Connect",
                        tint = Color.White,
                        modifier = Modifier.size(52.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(20.dp))

        Text(
            text = when {
                isConnected  -> "Protected"
                isConnecting -> if (state == VpnState.FINDING_SERVER)
                                    "Finding best connection…"
                                else "Connecting…"
                else         -> "Tap to Protect"
            },
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            color = when {
                isConnected  -> ConnectedGreen
                isConnecting -> ConnectingBlue
                else         -> MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
    }
}
