package ug.tera5g.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.RoutingMode

@Composable
fun ConnectionModeSelector(
    selected: ConnectionMode,
    onSelect: (ConnectionMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val modes = listOf(
        ConnectionMode.HIGH_SPEED,
        ConnectionMode.ULTRA_SECURE,
        ConnectionMode.LIGHTNING
    )
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text  = "Connection Type",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        modes.forEach { mode ->
            val isSelected = mode == selected
            Surface(
                onClick   = { onSelect(mode) },
                shape     = RoundedCornerShape(14.dp),
                color     = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                            else MaterialTheme.colorScheme.surface,
                tonalElevation = if (isSelected) 0.dp else 2.dp,
                border    = if (isSelected) ButtonDefaults.outlinedButtonBorder else null,
                modifier  = Modifier.fillMaxWidth()
            ) {
                Row(
                    Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text       = mode.label,
                            style      = MaterialTheme.typography.bodyMedium,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                            color      = if (isSelected) MaterialTheme.colorScheme.primary
                                         else MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text  = mode.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (isSelected) {
                        RadioButton(selected = true, onClick = null)
                    }
                }
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
    Row(modifier = modifier, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        RoutingMode.values().forEach { mode ->
            FilterChip(
                selected = mode == selected,
                onClick  = { onSelect(mode) },
                label    = { Text(mode.label, style = MaterialTheme.typography.labelMedium) }
            )
        }
    }
}
