package ug.tera5g.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import ug.tera5g.core.AccessToken
import ug.tera5g.ui.theme.*

@Composable
fun SessionTimer(token: AccessToken?, modifier: Modifier = Modifier) {
    AnimatedVisibility(
        visible  = token != null && token.isActive,
        enter    = fadeIn(),
        exit     = fadeOut(),
        modifier = modifier
    ) {
        token ?: return@AnimatedVisibility
        var remaining by remember(token.expiresAt) {
            mutableStateOf(token.remainingMs)
        }
        LaunchedEffect(token.expiresAt) {
            while (remaining > 0) {
                delay(1_000)
                remaining = maxOf(0L, token.expiresAt - System.currentTimeMillis())
            }
        }

        val accent = when {
            remaining < 300_000   -> SystemRed
            remaining < 1_800_000 -> SystemOrange
            else                  -> ConnectedGreen
        }

        val hours   = remaining / 3_600_000
        val minutes = (remaining % 3_600_000) / 60_000
        val seconds = (remaining % 60_000) / 1_000

        Row(
            modifier = Modifier
                .background(accent.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                .border(1.dp, accent.copy(alpha = 0.22f), RoundedCornerShape(10.dp))
                .padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Icon(
                Icons.Outlined.Timer,
                contentDescription = null,
                tint     = accent,
                modifier = Modifier.size(13.dp)
            )
            Text(
                "%02d:%02d:%02d".format(hours, minutes, seconds),
                style      = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color      = accent
            )
        }
    }
}
