package ug.tera5g.ui.theme

import androidx.compose.ui.graphics.Color

// ── Logo-derived dark palette ────────────────────────────────────────────────
// Logo: #011A01 background, neon globe ~#1CE660

val SplashBg            = Color(0xFF060D06)   // Deepest dark for splash
val DarkBg              = Color(0xFF080F08)
val DarkSurface         = Color(0xFF0D1C0D)
val DarkSurfaceVariant  = Color(0xFF152B15)
val DarkOverlay         = Color(0xFF1E3521)

// Neon greens (from globe)
val NeonGreen           = Color(0xFF1CE660)
val NeonGreenMid        = Color(0xFF14A846)
val ForestGreen         = Color(0xFF006E28)
val DeepGreen           = Color(0xFF003318)
val GlowGreen           = Color(0xFF00FF7F)

// Light palette
val LightBg             = Color(0xFFF2FAF4)
val LightSurface        = Color(0xFFFFFFFF)
val LightSurfaceVariant = Color(0xFFE4F2E8)
val LightPrimary        = Color(0xFF006E28)
val LightSecondary      = Color(0xFF4CAF75)

// Text
val TextPrimaryDark     = Color(0xFFE0F4E6)
val TextSecondaryDark   = Color(0xFF7EAF86)
val TextPrimaryLight    = Color(0xFF061209)
val TextSecondaryLight  = Color(0xFF3B6343)

// State colors
val ConnectedGreen      = Color(0xFF1CE660)
val ConnectingBlue      = Color(0xFF0A84FF)
val DisconnectedGray    = Color(0xFF4A5E4E)
val ErrorRed            = Color(0xFFFF453A)
val WarningOrange       = Color(0xFFFF9F0A)

// Borders / separators
val DarkOutline         = Color(0xFF2A5030)
val DarkSeparator       = Color(0xFF1A3020)
val LightOutline        = Color(0xFF71A077)
val LightSeparator      = Color(0xFFC0DEC5)

// Payment providers
val MTNYellow           = Color(0xFFFFCC00)
val AirtelRed           = Color(0xFFE40000)

// Utility
val White               = Color(0xFFFFFFFF)
val Black               = Color(0xFF000000)

// Legacy aliases kept for existing references
val SystemBlue          = ConnectingBlue
val SystemGreen         = NeonGreen
val SystemOrange        = WarningOrange
val SystemRed           = ErrorRed
val SystemPurple        = Color(0xFFAF52DE)
val SystemTeal          = Color(0xFF5AC8FA)
val SystemIndigo        = Color(0xFF5856D6)
val SystemYellow        = MTNYellow
val DarkSystemBlue      = ConnectingBlue
val DarkSystemGreen     = NeonGreen
val DarkSystemOrange    = WarningOrange
val DarkSystemRed       = ErrorRed
val LabelPrimary        = TextPrimaryLight
val LabelSecondary      = TextSecondaryLight
val DarkLabelPrimary    = TextPrimaryDark
val DarkLabelSecondary  = TextSecondaryDark
val DarkLabelTertiary   = Color(0xFF48484A)
val SystemBackground    = LightBg
val SecondaryBackground = LightSurfaceVariant
val TertiaryBackground  = Color(0xFFD5EAD9)
val DarkSystemBackground    = DarkBg
val DarkSecondaryBackground = DarkSurface
val DarkTertiaryBackground  = DarkSurfaceVariant
val Separator           = LightSeparator
val OpaqueSeparator     = Color(0xFFD1D1D6)
val DarkSeparatorLegacy = DarkSeparator
val ConnectingBlueLegacy = ConnectingBlue
val DisconnectedGrayLegacy = DisconnectedGray
