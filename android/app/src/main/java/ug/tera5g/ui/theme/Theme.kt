package ug.tera5g.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary          = SystemBlue,
    onPrimary        = White,
    primaryContainer = Color(0xFFD1E8FF),
    secondary        = SystemGreen,
    onSecondary      = White,
    tertiary         = SystemOrange,
    background       = SystemBackground,
    onBackground     = LabelPrimary,
    surface          = White,
    onSurface        = LabelPrimary,
    surfaceVariant   = SecondaryBackground,
    onSurfaceVariant = LabelSecondary,
    outline          = Separator,
    outlineVariant   = OpaqueSeparator,
    error            = SystemRed,
    onError          = White,
)

private val DarkColorScheme = darkColorScheme(
    primary          = DarkSystemBlue,
    onPrimary        = White,
    primaryContainer = Color(0xFF003366),
    secondary        = DarkSystemGreen,
    onSecondary      = White,
    tertiary         = DarkSystemOrange,
    background       = DarkSystemBackground,
    onBackground     = DarkLabelPrimary,
    surface          = DarkSecondaryBackground,
    onSurface        = DarkLabelPrimary,
    surfaceVariant   = DarkTertiaryBackground,
    onSurfaceVariant = DarkLabelSecondary,
    outline          = DarkSeparator,
    outlineVariant   = Color(0xFF48484A),
    error            = DarkSystemRed,
    onError          = White,
)

@Composable
fun Tera5GTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography  = Tera5GTypography,
        content     = content
    )
}
