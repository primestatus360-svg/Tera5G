package ug.tera5g.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary             = NeonGreen,
    onPrimary           = DeepGreen,
    primaryContainer    = Color(0xFF00391C),
    onPrimaryContainer  = Color(0xFF9AFFC0),
    secondary           = Color(0xFF5FD88A),
    onSecondary         = Color(0xFF003821),
    secondaryContainer  = Color(0xFF004D27),
    onSecondaryContainer = Color(0xFF9AFFC0),
    tertiary            = ConnectingBlue,
    onTertiary          = White,
    tertiaryContainer   = Color(0xFF003663),
    onTertiaryContainer = Color(0xFFD4E3FF),
    background          = DarkBg,
    onBackground        = TextPrimaryDark,
    surface             = DarkSurface,
    onSurface           = TextPrimaryDark,
    surfaceVariant      = DarkSurfaceVariant,
    onSurfaceVariant    = TextSecondaryDark,
    outline             = DarkOutline,
    outlineVariant      = DarkSeparator,
    error               = ErrorRed,
    onError             = White,
    errorContainer      = Color(0xFF93000A),
    onErrorContainer    = Color(0xFFFFDAD6),
    scrim               = Black.copy(alpha = 0.6f)
)

private val LightColorScheme = lightColorScheme(
    primary             = LightPrimary,
    onPrimary           = White,
    primaryContainer    = Color(0xFFADFAD0),
    onPrimaryContainer  = Color(0xFF00210D),
    secondary           = LightSecondary,
    onSecondary         = White,
    secondaryContainer  = Color(0xFFCCF7DE),
    onSecondaryContainer = Color(0xFF00210D),
    tertiary            = Color(0xFF006E85),
    onTertiary          = White,
    tertiaryContainer   = Color(0xFFBBEAFF),
    onTertiaryContainer = Color(0xFF001F2A),
    background          = LightBg,
    onBackground        = TextPrimaryLight,
    surface             = LightSurface,
    onSurface           = TextPrimaryLight,
    surfaceVariant      = LightSurfaceVariant,
    onSurfaceVariant    = TextSecondaryLight,
    outline             = LightOutline,
    outlineVariant      = LightSeparator,
    error               = Color(0xFFFF3B30),
    onError             = White
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
