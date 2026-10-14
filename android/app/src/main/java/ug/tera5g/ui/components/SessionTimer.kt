package ug.tera5g.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import ug.tera5g.core.AccessToken
import ug.tera5g.ui.theme.ConnectedGreen
import ug.tera5g.ui.theme.SystemOrange
import ug.tera5g.ui.theme.SystemRed

@Composable
fun SessionTimer(token: AccessToken?, modifier: Modifier = Modifier) {
    AnimatedVisibility(
        visible = token != null && token.isActive,
        enter   = fadeIn(),
        exit    = fadeOut(),
        modifier = modifier
    ) {
        token ?: return@AnimatedVisibility
        var remaining by remember(token.expiresAt) {
            mutableStateOf(token.remainingMs)
        }
        LaunchedEffect(token.expiresAt) {
            while (remaining > 0) {
                delay(1000)
                remaining = maxOf(0L, token.expiresAt - System.currentTimeMillis())
            }
        }

        val color = when {
            remaining < 300_000  -> SystemRed      // < 5 min
            remaining < 1_800_000 -> SystemOrange  // < 30 min
            else                 -> ConnectedGreen
        }

        val hours   = remaining / 3_600_000
        val minutes = (remaining % 3_600_000) / 60_000
        val seconds = (remaining % 60_000) / 1_000

        Surface(
            shape = MaterialTheme.shapes.medium,
            color = color.copy(alpha = 0.10f),
            modifier = Modifier.padding(horizontal = 4.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Outlined.Timer,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text  = "%02d:%02d:%02d".format(hours, minutes, seconds),
                    style = MaterialTheme.typography.labelLarge,
                    color = color
                )
                Text(
                    text  = "remaining",
                    style = MaterialTheme.typography.labelSmall,
                    color = color.copy(alpha = 0.7f)
                )
            }
        }
    }
}
