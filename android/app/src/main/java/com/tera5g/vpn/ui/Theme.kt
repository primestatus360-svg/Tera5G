package com.tera5g.vpn.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val Background = Color(0xFF050b14)
val Surface = Color(0xFF0d1526)
val Accent = Color(0xFF1DB814)
val OnBackground = Color(0xFFc8d8f0)
val OnSurface = Color(0xFFc8d8f0)
val TextMuted = Color(0xFF4a5c7a)

private val Tera5GDarkColors = darkColorScheme(
    primary = Accent,
    onPrimary = Color.Black,
    background = Background,
    onBackground = OnBackground,
    surface = Surface,
    onSurface = OnSurface,
    secondary = Accent,
    onSecondary = Color.Black,
    tertiary = Accent,
)

@Composable
fun Tera5GTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = Tera5GDarkColors,
        content = content,
    )
}
