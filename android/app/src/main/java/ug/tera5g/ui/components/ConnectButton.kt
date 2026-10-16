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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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

    val rotation by infinite.animateFloat(
        0f, 360f,
        infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart),
        "rotation"
    )
    val pulse by infinite.animateFloat(
        0f, 1f,
        infiniteRepeatable(tween(1400, easing = LinearEasing), RepeatMode.Restart),
        "pulse"
    )
    val breathe by infinite.animateFloat(
        0.12f, 0.32f,
        infiniteRepeatable(tween(2400, easing = EaseInOutSine), RepeatMode.Reverse),
        "breathe"
    )
    val logoBreath by infinite.animateFloat(
        1.00f, 1.08f,
        infiniteRepeatable(tween(2400, easing = EaseInOutSine), RepeatMode.Reverse),
        "logoBreath"
    )

    val innerBg by animateColorAsState(
        targetValue   = when {
            isConnected  -> NeonGreen.copy(alpha = 0.20f)
            isConnecting -> ConnectingBlue.copy(alpha = 0.10f)
            else         -> DarkSurfaceVariant
        },
        animationSpec = tween(700), label = "innerBg"
    )
    val borderCol by animateColorAsState(
        targetValue   = when {
            isConnected  -> NeonGreen
            isConnecting -> ConnectingBlue.copy(alpha = 0.85f)
            else         -> DarkOutline
        },
        animationSpec = tween(700), label = "borderCol"
    )
    val borderW by animateDpAsState(
        targetValue   = when {
            isConnected  -> 2.5.dp
            isConnecting -> 1.5.dp
            else         -> 1.dp
        },
        animationSpec = tween(700), label = "borderW"
    )
    val buttonScale by animateFloatAsState(
        targetValue   = if (isConnected) 1.05f else 1f,
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
            modifier = Modifier.size(230.dp).scale(buttonScale)
        ) {
            // ── Connected: 4 concentric breathing halos ────────────────────────
            if (isConnected) {
                Box(Modifier.size(230.dp).background(NeonGreen.copy(breathe * 0.40f), CircleShape))
                Box(Modifier.size(212.dp).background(NeonGreen.copy(breathe * 0.55f), CircleShape))
                Box(Modifier.size(198.dp).background(NeonGreen.copy(breathe * 0.70f), CircleShape))
                Box(Modifier.size(184.dp).background(NeonGreen.copy(breathe * 0.50f), CircleShape))
            }

            // ── Connecting: dual expanding radar sweeps ────────────────────────
            if (isConnecting) {
                listOf(pulse, (pulse + 0.5f) % 1f).forEach { p ->
                    Box(
                        Modifier
                            .size(214.dp)
                            .scale(0.48f + p * 1.05f)
                            .alpha((1f - p) * 0.48f)
                            .background(ConnectingBlue.copy(0.22f), CircleShape)
                    )
                }
            }

            // ── Outer dark ring with colour-tinted shadow ──────────────────────
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(192.dp)
                    .shadow(
                        elevation    = if (isConnected) 44.dp else 10.dp,
                        shape        = CircleShape,
                        ambientColor = borderCol.copy(if (isConnected) 0.60f else 0.12f),
                        spotColor    = borderCol.copy(if (isConnected) 0.60f else 0.12f)
                    )
                    .background(DarkSurface, CircleShape)
            ) {
                // ── Inner circle: radial gradient fill + border ────────────────
                val innerGradient = if (isConnected) {
                    Brush.radialGradient(listOf(NeonGreen.copy(0.30f), innerBg))
                } else {
                    Brush.radialGradient(listOf(innerBg, innerBg))
                }

                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(162.dp)
                        .clip(CircleShape)
                        .background(brush = innerGradient)
                        .border(borderW, borderCol, CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication        = null,
                            onClick           = onClick
                        )
                ) {
                    Image(
                        painter            = painterResource(R.mipmap.ic_launcher_foreground),
                        contentDescription = "Connect / Disconnect",
                        modifier           = Modifier
                            .size(76.dp)
                            .clip(CircleShape)
                            .graphicsLayer {
                                rotationZ = if (isConnecting) rotation else 0f
                                val s = if (isConnected) logoBreath else 1f
                                scaleX = s; scaleY = s
                            }
                            .alpha(if (!isConnected && !isConnecting) 0.50f else 1f)
                    )
                }
            }
        }

        Spacer(Modifier.height(26.dp))

        Text(
            text = when {
                isConnected  -> "Protected"
                isConnecting -> if (state == VpnState.FINDING_SERVER) "Finding Server…" else "Connecting…"
                else         -> "Tap to Connect"
            },
            style         = MaterialTheme.typography.displaySmall,
            fontWeight    = FontWeight.SemiBold,
            color         = labelColor,
            letterSpacing = if (!isConnected && !isConnecting) 0.8.sp else 0.sp
        )
    }
}
