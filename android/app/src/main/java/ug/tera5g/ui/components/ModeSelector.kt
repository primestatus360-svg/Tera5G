package ug.tera5g.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.RoutingMode
import ug.tera5g.ui.theme.*

private val FreeModeAmber = Color(0xFFFFC107)

private fun ConnectionMode.icon(): ImageVector = when (this) {
    ConnectionMode.HIGH_SPEED   -> Icons.Outlined.Speed
    ConnectionMode.ULTRA_SECURE -> Icons.Outlined.VerifiedUser
    ConnectionMode.LIGHTNING    -> Icons.Outlined.Bolt
    ConnectionMode.FREE_BROWSE  -> Icons.Outlined.WifiOff
    ConnectionMode.FALLBACK     -> Icons.Outlined.Tune
}

@Composable
fun ConnectionModeSelector(
    selected: ConnectionMode,
    onSelect: (ConnectionMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val modes = listOf(
        ConnectionMode.HIGH_SPEED,
        ConnectionMode.ULTRA_SECURE,
        ConnectionMode.LIGHTNING,
        ConnectionMode.FREE_BROWSE
    )
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        modes.forEach { mode ->
            ConnectionModeCard(
                mode       = mode,
                isSelected = mode == selected,
                onClick    = { onSelect(mode) }
            )
        }
    }
}

@Composable
private fun ConnectionModeCard(
    mode: ConnectionMode,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val accent = if (mode == ConnectionMode.FREE_BROWSE) FreeModeAmber else NeonGreen

    val bgColor by animateColorAsState(
        targetValue   = if (isSelected) accent.copy(alpha = 0.08f) else GlassWhite,
        animationSpec = tween(300), label = "bg"
    )
    val borderColor by animateColorAsState(
        targetValue   = if (isSelected) accent.copy(alpha = 0.38f) else GlassBorder,
        animationSpec = tween(300), label = "border"
    )
    val iconBg by animateColorAsState(
        targetValue   = if (isSelected) accent.copy(alpha = 0.18f) else accent.copy(alpha = 0.06f),
        animationSpec = tween(300), label = "iconBg"
    )
    val iconTint by animateColorAsState(
        targetValue   = if (isSelected) accent else accent.copy(alpha = 0.40f),
        animationSpec = tween(300), label = "iconTint"
    )

    Surface(
        onClick  = onClick,
        shape    = RoundedCornerShape(18.dp),
        color    = bgColor,
        border   = BorderStroke(if (isSelected) 1.5.dp else 1.dp, borderColor),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            Modifier.padding(horizontal = 16.dp, vertical = 15.dp),
            verticalAlignment     = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                Modifier
                    .size(44.dp)
                    .background(iconBg, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector        = mode.icon(),
                    contentDescription = null,
                    tint               = iconTint,
                    modifier           = Modifier.size(20.dp)
                )
            }

            Column(Modifier.weight(1f)) {
                Row(
                    verticalAlignment     = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        mode.label,
                        style      = MaterialTheme.typography.bodyMedium,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        color      = if (isSelected) MaterialTheme.colorScheme.onSurface
                                     else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                    )
                    if (mode == ConnectionMode.FREE_BROWSE) {
                        Text(
                            "FREE",
                            style         = MaterialTheme.typography.labelSmall.copy(
                                fontSize      = 9.sp,
                                letterSpacing = 0.8.sp
                            ),
                            fontWeight    = FontWeight.Bold,
                            color         = FreeModeAmber,
                            modifier      = Modifier
                                .background(FreeModeAmber.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 5.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    mode.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(
                        alpha = if (isSelected) 0.75f else 0.45f
                    )
                )
            }

            if (isSelected) {
                Box(
                    Modifier
                        .size(24.dp)
                        .background(accent.copy(alpha = 0.18f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Outlined.Check,
                        contentDescription = null,
                        tint     = accent,
                        modifier = Modifier.size(14.dp)
                    )
                }
            } else {
                Spacer(Modifier.size(24.dp))
            }
        }
    }
}

@Composable
fun RoutingModeChips(
    selected: RoutingMode,
    onSelect: (RoutingMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        RoutingMode.values().forEach { mode ->
            FilterChip(
                selected = mode == selected,
                onClick  = { onSelect(mode) },
                label    = {
                    Text(
                        mode.label,
                        style      = MaterialTheme.typography.labelMedium,
                        fontWeight = if (mode == selected) FontWeight.SemiBold else FontWeight.Normal
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = NeonGreen.copy(alpha = 0.18f),
                    selectedLabelColor     = NeonGreen,
                    containerColor         = GlassWhite,
                    labelColor             = MaterialTheme.colorScheme.onSurfaceVariant
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled             = true,
                    selected            = mode == selected,
                    selectedBorderColor = NeonGreen.copy(alpha = 0.50f),
                    selectedBorderWidth = 1.5.dp,
                    borderColor         = GlassBorder
                )
            )
        }
    }
}
