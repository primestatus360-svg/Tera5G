package ug.tera5g.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import ug.tera5g.R
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

    // ── Connecting: logo spins + dual radar rings ─────────────────────────────
    val rotation by infinite.animateFloat(
        0f, 360f,
        infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart),
        "rotation"
    )
    val pulse by infinite.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(1300, easing = LinearEasing), RepeatMode.Restart),
        "pulse"
    )

    // ── Connected: outer halo breathes, logo scale pulses softly ─────────────
    val breathe by infinite.animateFloat(
        0.18f, 0.40f,
        infiniteRepeatable(tween(1800, easing = EaseInOutSine), RepeatMode.Reverse),
        "breathe"
    )
    val logoBreath by infinite.animateFloat(
        1.00f, 1.07f,
        infiniteRepeatable(tween(1800, easing = EaseInOutSine), RepeatMode.Reverse),
        "logoBreath"
    )

    // ── Animated colour transitions between states ────────────────────────────
    val innerBg by animateColorAsState(
        targetValue   = when {
            isConnected  -> NeonGreen.copy(alpha = 0.22f)
            isConnecting -> ConnectingBlue.copy(alpha = 0.12f)
            else         -> DarkSurfaceVariant
        },
        animationSpec = tween(500),
        label         = "innerBg"
    )
    val borderCol by animateColorAsState(
        targetValue   = when {
            isConnected  -> NeonGreen
            isConnecting -> ConnectingBlue.copy(alpha = 0.85f)
            else         -> DarkOutline
        },
        animationSpec = tween(500),
        label         = "borderCol"
    )
    val borderW by animateDpAsState(
        targetValue   = when {
            isConnected  -> 3.dp
            isConnecting -> 1.5.dp
            else         -> 1.dp
        },
        animationSpec = tween(500),
        label         = "borderW"
    )

    // ── Overall button scale spring ───────────────────────────────────────────
    val buttonScale by animateFloatAsState(
        targetValue   = if (isConnected) 1.06f else 1f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow),
        label         = "btnScale"
    )

    val labelColor = when {
        isConnected  -> NeonGreen
        isConnecting -> ConnectingBlue
        else         -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(224.dp).scale(buttonScale)
        ) {

            // ── Connected: breathing green halo ───────────────────────────────
            if (isConnected) {
                Box(Modifier.size(224.dp).background(NeonGreen.copy(breathe * 0.7f), CircleShape))
                Box(Modifier.size(200.dp).background(NeonGreen.copy(breathe * 0.5f), CircleShape))
            }

            // ── Connecting: dual radar rings ──────────────────────────────────
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

            // ── Outer ring with shadow ─────────────────────────────────────────
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(186.dp)
                    .shadow(
                        elevation    = if (isConnected) 28.dp else 8.dp,
                        shape        = CircleShape,
                        ambientColor = borderCol.copy(if (isConnected) 0.45f else 0.15f),
                        spotColor    = borderCol.copy(if (isConnected) 0.45f else 0.15f)
                    )
                    .background(DarkSurface, CircleShape)
            ) {
                // ── Inner clickable circle ─────────────────────────────────────
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(156.dp)
                        .background(innerBg, CircleShape)
                        .border(borderW, borderCol, CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication        = null,
                            onClick           = onClick
                        )
                ) {
                    // ── App logo — spins when connecting, breathes when connected
                    Image(
                        painter            = painterResource(R.mipmap.ic_launcher_foreground),
                        contentDescription = "Connect / Disconnect",
                        modifier           = Modifier
                            .size(72.dp)
                            .graphicsLayer {
                                rotationZ = if (isConnecting) rotation else 0f
                                val s = when {
                                    isConnected  -> logoBreath
                                    else         -> 1f
                                }
                                scaleX = s; scaleY = s
                            }
                            .alpha(if (!isConnected && !isConnecting) 0.45f else 1f)
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
            color      = labelColor
        )
    }
}
