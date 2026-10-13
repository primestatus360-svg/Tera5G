package com.tera5g.vpn.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tera5g.vpn.VpnState
import com.tera5g.vpn.data.SessionInfo
import kotlinx.coroutines.delay
import kotlin.math.max

private val Blue = Color(0xFF0A84FF)
private val CardSurface = Color(0xFF1C1C1E)
private val BorderSubtle = Color(0xFF545458)

@Composable
fun MainScreen(
    vpnState: VpnState,
    sessionInfo: SessionInfo?,
    onToggleVpn: () -> Unit,
    onGetPlan: () -> Unit,
) {
    val isConnected = vpnState == VpnState.CONNECTED
    val hasSession = sessionInfo != null

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(56.dp))

        // Header
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Tera", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Text("5G", color = Accent, fontWeight = FontWeight.Bold, fontSize = 22.sp)
        }

        Spacer(Modifier.height(20.dp))

        // Session card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(CardSurface.copy(alpha = 0.8f))
                .border(1.dp, BorderSubtle.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                .then(if (hasSession) Modifier.clickable { onToggleVpn() } else Modifier)
                .padding(16.dp),
        ) {
            // SESSION label + ACTIVE/INACTIVE badge
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "SESSION",
                    color = Color.White.copy(alpha = 0.35f),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 1.5.sp,
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (isConnected) Accent.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.05f))
                        .border(
                            1.dp,
                            if (isConnected) Accent.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.1f),
                            RoundedCornerShape(4.dp),
                        )
                        .padding(horizontal = 6.dp, vertical = 3.dp),
                ) {
                    Text(
                        text = if (isConnected) "ACTIVE" else "INACTIVE",
                        color = if (isConnected) Accent else TextMuted,
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp,
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            // Timer
            if (sessionInfo != null) {
                SessionTimer(sessionInfo)
            } else {
                Text(
                    text = "00:00:00",
                    color = Color.White,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
                Text(
                    text = "no active session",
                    color = Color.White.copy(alpha = 0.25f),
                    fontSize = 10.sp,
                    modifier = Modifier.padding(top = 2.dp),
                )
            }

            Spacer(Modifier.height(14.dp))

            // Progress bar
            val progress = if (sessionInfo != null) {
                val totalMs = if (sessionInfo.plan.contains("24")) 24 * 3_600_000L else 6 * 3_600_000L
                val remaining = max(0L, sessionInfo.expiresAt - System.currentTimeMillis())
                (remaining.toFloat() / totalMs).coerceIn(0f, 1f)
            } else 0f

            Box(
                Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.08f)),
            ) {
                Box(
                    Modifier
                        .fillMaxWidth(progress)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(2.dp))
                        .background(Accent),
                )
            }
        }

        // Hint
        Text(
            text = if (!hasSession) "Select a plan to activate" else if (isConnected) "Tap card to disconnect" else "Tap card to connect",
            color = Color.White.copy(alpha = 0.2f),
            fontSize = 10.sp,
            modifier = Modifier.padding(top = 6.dp),
        )

        Spacer(Modifier.height(14.dp))

        // Plan buttons
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            PlanButton("6H", "UGX 500", Accent, Modifier.weight(1f), onGetPlan)
            PlanButton("24H", "UGX 1,500", Blue, Modifier.weight(1f), onGetPlan)
        }

        Spacer(Modifier.weight(1f))

        // Relay status — pulsing dot
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 32.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PulsingDot(active = isConnected)
            Spacer(Modifier.width(6.dp))
            Text(
                text = if (isConnected) "Relay active" else "Relay inactive",
                color = Color.White.copy(alpha = 0.25f),
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
            )
        }
    }
}

@Composable
private fun PlanButton(
    label: String,
    price: String,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color.copy(alpha = 0.28f), RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, color = color, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(Modifier.height(2.dp))
            Text(price, color = Color.White.copy(alpha = 0.25f), fontSize = 10.sp)
        }
    }
}

@Composable
private fun PulsingDot(active: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "dotScale",
    )
    Box(
        modifier = Modifier
            .size(6.dp)
            .scale(if (active) scale else 1f)
            .clip(CircleShape)
            .background(if (active) Accent else TextMuted),
    )
}

@Composable
private fun SessionTimer(sessionInfo: SessionInfo) {
    var remaining by remember { mutableLongStateOf(max(0L, sessionInfo.expiresAt - System.currentTimeMillis())) }

    LaunchedEffect(sessionInfo.expiresAt) {
        while (remaining > 0) {
            delay(1_000)
            remaining = max(0L, sessionInfo.expiresAt - System.currentTimeMillis())
        }
    }

    val h = remaining / 3_600_000
    val m = (remaining % 3_600_000) / 60_000
    val s = (remaining % 60_000) / 1_000

    Text(
        text = "%02d:%02d:%02d".format(h, m, s),
        color = Color.White,
        fontSize = 32.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
    )
    Text(
        text = "remaining",
        color = Color.White.copy(alpha = 0.25f),
        fontSize = 10.sp,
        modifier = Modifier.padding(top = 2.dp),
    )
}
