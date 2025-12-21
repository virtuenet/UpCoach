package com.upcoach.wear.presentation.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
 * Progress overview screen
 */
@Composable
fun ProgressScreen(
    companionData: CompanionData,
    isConnected: Boolean,
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
            // Today's progress ring
            item {
                TodayProgressRing(
                    progress = companionData.todayProgress.toFloat(),
                    completed = companionData.todayCompletedHabits,
                    total = companionData.todayTotalHabits
                )
            }

            // Weekly progress bar
            item {
                WeeklyProgressBar(progress = companionData.weeklyProgress.toFloat())
            }

            // Category breakdown
            item {
                CategoryBreakdown(habits = companionData.habits.groupBy { it.category ?: "Other" })
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
 * Today's progress as a ring
 */
@Composable
fun TodayProgressRing(
    progress: Float,
    completed: Int,
    total: Int
) {
    val progressColor = when {
        progress == 0f -> Color.Gray
        progress < 0.5f -> UpCoachColors.Warning
        progress < 1f -> UpCoachColors.Primary
        else -> UpCoachColors.Success
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            progress = progress,
            modifier = Modifier.size(100.dp),
            strokeWidth = 8.dp,
            indicatorColor = progressColor,
            trackColor = Color.Gray.copy(alpha = 0.3f)
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${(progress * 100).toInt()}",
                style = MaterialTheme.typography.display2,
                color = progressColor
            )
            Text(
                text = "%",
                style = MaterialTheme.typography.caption2,
                color = UpCoachColors.OnSurfaceVariant
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "$completed/$total",
                style = MaterialTheme.typography.caption1,
                color = UpCoachColors.OnSurfaceVariant
            )
        }
    }
}

/**
 * Weekly progress bar
 */
@Composable
fun WeeklyProgressBar(progress: Float) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(UpCoachColors.Surface)
            .padding(12.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "This Week",
                    style = MaterialTheme.typography.caption1
                )
                Text(
                    text = "${(progress * 100).toInt()}%",
                    style = MaterialTheme.typography.caption1,
                    color = UpCoachColors.OnSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color.Gray.copy(alpha = 0.3f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction = progress)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(4.dp))
                        .background(UpCoachColors.Primary)
                )
            }
        }
    }
}

/**
 * Category breakdown
 */
@Composable
fun CategoryBreakdown(habits: Map<String, List<com.upcoach.wear.data.HabitSummary>>) {
    if (habits.isEmpty()) return

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(UpCoachColors.Surface)
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = "By Category",
                style = MaterialTheme.typography.caption1,
                color = UpCoachColors.OnSurfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            habits.entries.take(4).forEach { (category, categoryHabits) ->
                val completed = categoryHabits.count { it.isCompletedToday }
                val total = categoryHabits.size

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = category,
                        style = MaterialTheme.typography.caption2,
                        maxLines = 1
                    )
                    Text(
                        text = "$completed/$total",
                        style = MaterialTheme.typography.caption2,
                        color = if (completed == total) UpCoachColors.Success else UpCoachColors.OnSurfaceVariant
                    )
                }
            }
        }
    }
}
