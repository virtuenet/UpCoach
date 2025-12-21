package com.upcoach.wear.presentation.screens

import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material.*
import com.upcoach.wear.data.CompanionData
import com.upcoach.wear.data.HabitSummary
import com.upcoach.wear.presentation.theme.UpCoachColors

/**
 * Main habit list screen with quick check-in functionality
 */
@Composable
fun HabitListScreen(
    companionData: CompanionData,
    isConnected: Boolean,
    onHabitComplete: (String) -> Unit,
    onHabitUncomplete: (String) -> Unit,
    onRefresh: () -> Unit,
    onNavigateToStreak: () -> Unit,
    onNavigateToProgress: () -> Unit
) {
    val listState = rememberScalingLazyListState()
    val context = LocalContext.current
    val vibrator = context.getSystemService(Vibrator::class.java)

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
            // Progress header
            item {
                ProgressHeader(
                    completed = companionData.todayCompletedHabits,
                    total = companionData.todayTotalHabits,
                    progress = companionData.todayProgress.toFloat(),
                    onClick = onNavigateToProgress
                )
            }

            // Pending habits
            if (companionData.pendingHabits.isNotEmpty()) {
                items(companionData.pendingHabits, key = { it.id }) { habit ->
                    HabitRow(
                        habit = habit,
                        isCompleted = false,
                        onClick = {
                            vibrator?.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
                            onHabitComplete(habit.id)
                        }
                    )
                }
            } else if (companionData.habits.isEmpty()) {
                // Empty state
                item {
                    EmptyState()
                }
            } else {
                // All done state
                item {
                    AllDoneState(onNavigateToStreak = onNavigateToStreak)
                }
            }

            // Completed habits section
            if (companionData.completedHabits.isNotEmpty()) {
                item {
                    Text(
                        text = "Completed (${companionData.completedHabits.size})",
                        style = MaterialTheme.typography.caption2,
                        color = UpCoachColors.OnSurfaceVariant,
                        modifier = Modifier.padding(top = 12.dp, bottom = 4.dp)
                    )
                }

                items(companionData.completedHabits, key = { it.id }) { habit ->
                    HabitRow(
                        habit = habit,
                        isCompleted = true,
                        onClick = {
                            vibrator?.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
                            onHabitUncomplete(habit.id)
                        }
                    )
                }
            }

            // Navigation buttons
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp, bottom = 8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    CompactChip(
                        onClick = onNavigateToStreak,
                        label = { Text("🔥 ${companionData.currentStreak}") },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = UpCoachColors.Streak.copy(alpha = 0.3f)
                        )
                    )

                    CompactChip(
                        onClick = onRefresh,
                        icon = { Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh") },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = UpCoachColors.Surface
                        )
                    )
                }
            }

            // Connection status
            item {
                ConnectionStatus(isConnected = isConnected)
            }
        }
    }
}

/**
 * Progress header with circular indicator
 */
@Composable
fun ProgressHeader(
    completed: Int,
    total: Int,
    progress: Float,
    onClick: () -> Unit
) {
    Chip(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        colors = ChipDefaults.chipColors(
            backgroundColor = UpCoachColors.Surface
        ),
        label = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth()
            ) {
                CircularProgressIndicator(
                    progress = progress,
                    modifier = Modifier.size(32.dp),
                    strokeWidth = 4.dp,
                    indicatorColor = if (progress >= 1f) UpCoachColors.Success else UpCoachColors.Primary,
                    trackColor = Color.Gray.copy(alpha = 0.3f)
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = "$completed of $total",
                        style = MaterialTheme.typography.body1
                    )
                    Text(
                        text = if (progress >= 1f) "All done!" else "${(progress * 100).toInt()}% complete",
                        style = MaterialTheme.typography.caption2,
                        color = if (progress >= 1f) UpCoachColors.Success else UpCoachColors.OnSurfaceVariant
                    )
                }
            }
        }
    )
}

/**
 * Single habit row with tap to complete
 */
@Composable
fun HabitRow(
    habit: HabitSummary,
    isCompleted: Boolean,
    onClick: () -> Unit
) {
    Chip(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        colors = ChipDefaults.chipColors(
            backgroundColor = if (isCompleted)
                UpCoachColors.Success.copy(alpha = 0.2f)
            else
                UpCoachColors.Surface
        ),
        icon = {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(
                        if (isCompleted) UpCoachColors.Success else Color.Gray.copy(alpha = 0.3f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isCompleted) "✓" else habit.displayEmoji,
                    style = MaterialTheme.typography.caption1,
                    color = if (isCompleted) Color.White else Color.Unspecified
                )
            }
        },
        label = {
            Text(
                text = habit.name,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = if (isCompleted) UpCoachColors.OnSurfaceVariant else Color.White
            )
        },
        secondaryLabel = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "🔥 ${habit.currentStreak}",
                    style = MaterialTheme.typography.caption2,
                    color = UpCoachColors.Streak
                )
            }
        }
    )
}

/**
 * Empty state when no habits exist
 */
@Composable
fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "📋",
            style = MaterialTheme.typography.display2
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "No Habits",
            style = MaterialTheme.typography.title3,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Add habits in the app",
            style = MaterialTheme.typography.caption2,
            color = UpCoachColors.OnSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * All done celebration state
 */
@Composable
fun AllDoneState(onNavigateToStreak: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "✅",
            style = MaterialTheme.typography.display2
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "All Done!",
            style = MaterialTheme.typography.title3,
            color = UpCoachColors.Success,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Great job today!",
            style = MaterialTheme.typography.caption2,
            color = UpCoachColors.OnSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(12.dp))
        CompactChip(
            onClick = onNavigateToStreak,
            label = { Text("View Streak") },
            colors = ChipDefaults.chipColors(
                backgroundColor = UpCoachColors.Streak.copy(alpha = 0.3f)
            )
        )
    }
}

/**
 * Connection status indicator
 */
@Composable
fun ConnectionStatus(isConnected: Boolean) {
    Row(
        modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(if (isConnected) UpCoachColors.Success else Color.Red)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = if (isConnected) "Connected" else "Offline",
            style = MaterialTheme.typography.caption2,
            color = UpCoachColors.OnSurfaceVariant
        )
    }
}

// Placeholder for Icons - would use actual icon library
private object Icons {
    object Default {
        val Refresh = androidx.compose.material.icons.Icons.Default.Refresh
    }
}
