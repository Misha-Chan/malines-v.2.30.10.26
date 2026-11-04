package com.malines.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val MalinesBlack = Color(0xFF050505)
val MalinesRed = Color(0xFFC0392B)
val MalinesGold = Color(0xFFD4AF37)
val MalinesPaper = Color(0xFFE8E2D6)
val MalinesSurface = Color(0xFF0D0D0D)

private val MalinesColors = darkColorScheme(
    primary = MalinesRed,
    onPrimary = Color.White,
    secondary = MalinesGold,
    onSecondary = Color.Black,
    tertiary = MalinesGold,
    onTertiary = Color.Black,
    background = MalinesBlack,
    onBackground = MalinesPaper,
    surface = MalinesSurface,
    onSurface = MalinesPaper,
    surfaceVariant = Color(0xFF161616),
    onSurfaceVariant = Color(0xFFB9B2A4),
    outline = Color(0xFF3A3A3A),
)

@Composable
fun MalinesTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MalinesColors,
        typography = Typography(),
        content = content,
    )
}
