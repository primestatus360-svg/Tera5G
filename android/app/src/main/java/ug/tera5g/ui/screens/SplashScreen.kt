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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
        delay(360)
        titleVisible = true
        delay(260)
        taglineVisible = true
        delay(1700)
        onComplete()
    }

    val logoScale by animateFloatAsState(
        targetValue   = if (logoVisible) 1f else 0.55f,
        animationSpec = spring(Spring.DampingRatioMediumBouncy, Spring.StiffnessMediumLow),
        label = "logoScale"
    )
    val logoAlpha  by animateFloatAsState(if (logoVisible) 1f else 0f,    tween(500),  label = "la")
    val titleAlpha by animateFloatAsState(if (titleVisible) 1f else 0f,   tween(520),  label = "ta")
    val tagAlpha   by animateFloatAsState(if (taglineVisible) 1f else 0f, tween(640),  label = "ga")

    val infinite = rememberInfiniteTransition(label = "glow")
    val glowPulse by infinite.animateFloat(
        0.08f, 0.22f,
        infiniteRepeatable(tween(2000, easing = EaseInOutSine), RepeatMode.Reverse),
        label = "gp"
    )

    Box(
        Modifier
            .fillMaxSize()
            .background(SplashBg),
        contentAlignment = Alignment.Center
    ) {
        // Full-screen ambient glow behind logo
        Box(
            Modifier
                .size(600.dp)
                .background(
                    Brush.radialGradient(
                        listOf(NeonGreen.copy(alpha = glowPulse * 0.8f), Color.Transparent)
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.alpha(logoAlpha).scale(logoScale)
        ) {
            // Logo with 5 concentric glow rings
            Box(contentAlignment = Alignment.Center) {
                Box(Modifier.size(280.dp).background(NeonGreen.copy(glowPulse * 0.22f), CircleShape))
                Box(Modifier.size(240.dp).background(NeonGreen.copy(glowPulse * 0.35f), CircleShape))
                Box(Modifier.size(200.dp).background(NeonGreen.copy(glowPulse * 0.50f), CircleShape))
                Box(Modifier.size(166.dp).background(NeonGreen.copy(glowPulse * 0.25f), CircleShape))
                Box(Modifier.size(140.dp).background(NeonGreen.copy(glowPulse * 0.08f), CircleShape))
                Image(
                    painter            = painterResource(R.mipmap.ic_launcher_foreground),
                    contentDescription = "Tera5G",
                    modifier           = Modifier.size(148.dp).clip(CircleShape)
                )
            }

            Spacer(Modifier.height(52.dp))

            Text(
                "TERA5G",
                style       = MaterialTheme.typography.displayLarge.copy(
                    fontSize      = 42.sp,
                    letterSpacing = 8.sp
                ),
                fontWeight  = FontWeight.Bold,
                color       = White,
                modifier    = Modifier.alpha(titleAlpha)
            )

            Spacer(Modifier.height(14.dp))

            Text(
                "Secure  ·  Fast  ·  Private",
                style    = MaterialTheme.typography.bodyMedium.copy(letterSpacing = 2.2.sp),
                color    = NeonGreen.copy(alpha = 0.75f),
                modifier = Modifier.alpha(tagAlpha)
            )
        }

        Text(
            "Uganda's Premium VPN",
            style    = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.2.sp),
            color    = TextSecondaryDark.copy(alpha = 0.35f),
            textAlign = TextAlign.Center,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 56.dp)
                .alpha(tagAlpha)
        )
    }
}
