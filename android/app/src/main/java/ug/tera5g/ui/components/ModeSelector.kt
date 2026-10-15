package ug.tera5g.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ug.tera5g.config.ConnectionMode
import ug.tera5g.config.RoutingMode
import ug.tera5g.ui.theme.NeonGreen

@Composable
fun ConnectionModeSelector(
    selected: ConnectionMode,
    onSelect: (ConnectionMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val modes = listOf(ConnectionMode.HIGH_SPEED, ConnectionMode.ULTRA_SECURE, ConnectionMode.LIGHTNING)
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            "Connection Type",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(Modifier.height(2.dp))
        modes.forEach { mode ->
            val isSelected = mode == selected
            Surface(
                onClick        = { onSelect(mode) },
                shape          = RoundedCornerShape(16.dp),
                color          = if (isSelected) NeonGreen.copy(alpha = 0.10f)
                                 else MaterialTheme.colorScheme.surface,
                border         = BorderStroke(
                    width = if (isSelected) 1.5.dp else 1.dp,
                    color = if (isSelected) NeonGreen.copy(alpha = 0.55f)
                            else MaterialTheme.colorScheme.outlineVariant
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    Modifier.padding(horizontal = 18.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            mode.label,
                            style      = MaterialTheme.typography.bodyMedium,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                            color      = if (isSelected) NeonGreen
                                         else MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            mode.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (isSelected) {
                        RadioButton(
                            selected = true,
                            onClick  = null,
                            colors   = RadioButtonDefaults.colors(selectedColor = NeonGreen)
                        )
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
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        RoutingMode.values().forEach { mode ->
            FilterChip(
                selected = mode == selected,
                onClick  = { onSelect(mode) },
                label    = { Text(mode.label, style = MaterialTheme.typography.labelMedium) },
                colors   = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = NeonGreen.copy(alpha = 0.18f),
                    selectedLabelColor     = NeonGreen
                ),
                border   = FilterChipDefaults.filterChipBorder(
                    enabled             = true,
                    selected            = mode == selected,
                    selectedBorderColor = NeonGreen.copy(alpha = 0.55f),
                    selectedBorderWidth = 1.5.dp
                )
            )
        }
    }
}
