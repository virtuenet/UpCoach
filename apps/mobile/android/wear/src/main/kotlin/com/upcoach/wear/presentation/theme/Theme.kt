package com.upcoach.wear.presentation.theme

import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.MaterialTheme
import androidx.compose.runtime.Composable

/**
 * UpCoach brand colors
 */
object UpCoachColors {
    val Primary = Color(0xFF4361EE)
    val PrimaryVariant = Color(0xFF3A56D4)
    val Secondary = Color(0xFF7209B7)
    val SecondaryVariant = Color(0xFF5E07A0)
    val Background = Color(0xFF000000)
    val Surface = Color(0xFF1A1A1A)
    val SurfaceVariant = Color(0xFF2D2D2D)
    val OnPrimary = Color.White
    val OnSecondary = Color.White
    val OnBackground = Color.White
    val OnSurface = Color.White
    val OnSurfaceVariant = Color(0xFFB3B3B3)
    val Error = Color(0xFFCF6679)
    val OnError = Color.Black

    // Status colors
    val Success = Color(0xFF4CAF50)
    val Warning = Color(0xFFFF9800)
    val Streak = Color(0xFFFF6B35)
    val Level = Color(0xFF9C27B0)
    val Points = Color(0xFFFFD700)
}

/**
 * Wear OS Material theme colors
 */
val WearColors = Colors(
    primary = UpCoachColors.Primary,
    primaryVariant = UpCoachColors.PrimaryVariant,
    secondary = UpCoachColors.Secondary,
    secondaryVariant = UpCoachColors.SecondaryVariant,
    background = UpCoachColors.Background,
    surface = UpCoachColors.Surface,
    error = UpCoachColors.Error,
    onPrimary = UpCoachColors.OnPrimary,
    onSecondary = UpCoachColors.OnSecondary,
    onBackground = UpCoachColors.OnBackground,
    onSurface = UpCoachColors.OnSurface,
    onSurfaceVariant = UpCoachColors.OnSurfaceVariant,
    onError = UpCoachColors.OnError
)

/**
 * UpCoach Wear theme
 */
@Composable
fun UpCoachWearTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colors = WearColors,
        content = content
    )
}
