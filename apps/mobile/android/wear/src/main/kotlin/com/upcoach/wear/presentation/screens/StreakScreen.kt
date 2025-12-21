package com.upcoach.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.*
import com.upcoach.wear.data.CompanionData
import com.upcoach.wear.presentation.theme.UpCoachColors

/**
 * Streak display screen
 */
@Composable
fun StreakScreen(
    companionData: CompanionData,
    onBack: () -> Unit
) {
    val listState = rememberScalingLazyListState()

    Scaffold(
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) },
        timeText = { TimeText() },
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) }
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            state = listState,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Main streak display
            item {
                CurrentStreakCard(streak = companionData.currentStreak)
            }

            // Stats row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatCard(
                        title = "Best",
                        value = "${companionData.bestStreak}",
                        emoji = "🏆",
                        color = UpCoachColors.Points
                    )

                    StatCard(
                        title = "Week",
                        value = "${(companionData.weeklyProgress * 100).toInt()}%",
                        emoji = "📅",
                        color = UpCoachColors.Primary
                    )
                }
            }

            // Level and points row
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatCard(
                        title = "Level",
                        value = "${companionData.currentLevel}",
                        emoji = "⭐",
                        color = UpCoachColors.Level
                    )

                    StatCard(
                        title = "Points",
                        value = formatPoints(companionData.totalPoints),
                        emoji = "⚡",
                        color = UpCoachColors.Streak
                    )
                }
            }

            // Back button
            item {
                CompactChip(
                    onClick = onBack,
                    label = { Text("Back") },
                    modifier = Modifier.padding(top = 16.dp),
                    colors = ChipDefaults.chipColors(
                        backgroundColor = UpCoachColors.Surface
                    )
                )
            }
        }
    }
}

/**
 * Main streak card with flame animation
 */
@Composable
fun CurrentStreakCard(streak: Int) {
    val streakEmoji = when {
        streak == 0 -> "🌱"
        streak < 7 -> "🔥"
        streak < 30 -> "🔥🔥"
        streak < 100 -> "🔥🔥🔥"
        else -> "⭐"
    }

    val streakMessage = when {
        streak == 0 -> "Start your streak!"
        streak == 1 -> "First day!"
        streak < 7 -> "Keep it up!"
        streak == 7 -> "One week!"
        streak < 14 -> "Going strong!"
        streak == 14 -> "Two weeks!"
        streak < 30 -> "Incredible!"
        streak == 30 -> "One month!"
        else -> "Amazing streak!"
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(UpCoachColors.Streak.copy(alpha = 0.15f))
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = streakEmoji,
                style = MaterialTheme.typography.display2
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "$streak",
                style = MaterialTheme.typography.display1,
                color = UpCoachColors.Streak
            )

            Text(
                text = if (streak == 1) "day" else "days",
                style = MaterialTheme.typography.caption1,
                color = UpCoachColors.OnSurfaceVariant
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = streakMessage,
                style = MaterialTheme.typography.caption2,
                color = UpCoachColors.OnSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * Small stat card
 */
@Composable
fun StatCard(
    title: String,
    value: String,
    emoji: String,
    color: Color
) {
    Box(
        modifier = Modifier
            .size(width = 70.dp, height = 60.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(UpCoachColors.Surface)
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = emoji,
                style = MaterialTheme.typography.caption1
            )
            Text(
                text = value,
                style = MaterialTheme.typography.title3,
                color = color
            )
            Text(
                text = title,
                style = MaterialTheme.typography.caption2,
                color = UpCoachColors.OnSurfaceVariant
            )
        }
    }
}

/**
 * Format points for display
 */
private fun formatPoints(points: Int): String {
    return when {
        points >= 1000000 -> "${points / 1000000}M"
        points >= 1000 -> "${points / 1000}k"
        else -> "$points"
    }
}
