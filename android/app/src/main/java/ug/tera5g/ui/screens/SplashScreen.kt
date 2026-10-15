package ug.tera5g.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import ug.tera5g.R
import ug.tera5g.ui.theme.*

@Composable
fun SplashScreen(onComplete: () -> Unit) {
    var logoVisible    by remember { mutableStateOf(false) }
    var titleVisible   by remember { mutableStateOf(false) }
    var taglineVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        logoVisible = true
        delay(380)
        titleVisible = true
        delay(280)
        taglineVisible = true
        delay(1600)
        onComplete()
    }

    val logoScale by animateFloatAsState(
        targetValue   = if (logoVisible) 1f else 0.6f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow),
        label = "logoScale"
    )
    val logoAlpha  by animateFloatAsState(if (logoVisible) 1f else 0f, tween(480), label = "la")
    val titleAlpha by animateFloatAsState(if (titleVisible) 1f else 0f, tween(500), label = "ta")
    val tagAlpha   by animateFloatAsState(if (taglineVisible) 1f else 0f, tween(600), label = "ga")

    val infinite = rememberInfiniteTransition(label = "glow")
    val glowPulse by infinite.animateFloat(
        0.10f, 0.26f,
        infiniteRepeatable(tween(1900, easing = EaseInOutSine), RepeatMode.Reverse),
        label = "gp"
    )

    Box(
        Modifier.fillMaxSize().background(SplashBg),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Logo with layered glow rings
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.scale(logoScale).alpha(logoAlpha)
            ) {
                Box(Modifier.size(240.dp).background(NeonGreen.copy(glowPulse * 0.35f), CircleShape))
                Box(Modifier.size(192.dp).background(NeonGreen.copy(glowPulse * 0.55f), CircleShape))
                Box(Modifier.size(156.dp).background(NeonGreen.copy(glowPulse * 0.08f), CircleShape))
                Image(
                    painter            = painterResource(R.mipmap.ic_launcher_foreground),
                    contentDescription = "Tera5G",
                    modifier           = Modifier.size(144.dp)
                )
            }

            Spacer(Modifier.height(44.dp))

            Text(
                "TERA5G",
                style       = MaterialTheme.typography.displayLarge.copy(fontSize = 40.sp, letterSpacing = 7.sp),
                fontWeight  = FontWeight.Bold,
                color       = White,
                modifier    = Modifier.alpha(titleAlpha)
            )

            Spacer(Modifier.height(12.dp))

            Text(
                "Secure  ·  Fast  ·  Private",
                style    = MaterialTheme.typography.bodyMedium.copy(letterSpacing = 2.sp),
                color    = NeonGreen.copy(alpha = 0.80f),
                modifier = Modifier.alpha(tagAlpha)
            )
        }

        Text(
            "Uganda's Premium VPN",
            style    = MaterialTheme.typography.labelSmall,
            color    = TextSecondaryDark.copy(alpha = 0.45f),
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 52.dp).alpha(tagAlpha)
        )
    }
}
