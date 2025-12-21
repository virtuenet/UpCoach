package com.upcoach.wear.data

import com.google.gson.annotations.SerializedName
import java.util.Date

/**
 * Habit summary model synced from phone
 */
data class HabitSummary(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("emoji") val emoji: String?,
    @SerializedName("isCompletedToday") val isCompletedToday: Boolean,
    @SerializedName("currentStreak") val currentStreak: Int,
    @SerializedName("targetFrequency") val targetFrequency: Int,
    @SerializedName("completedThisWeek") val completedThisWeek: Int,
    @SerializedName("category") val category: String?,
    @SerializedName("color") val color: String?
) {
    val displayEmoji: String
        get() = emoji ?: "✓"
}

/**
 * Companion data synced from phone app
 */
data class CompanionData(
    @SerializedName("habits") val habits: List<HabitSummary> = emptyList(),
    @SerializedName("currentStreak") val currentStreak: Int = 0,
    @SerializedName("bestStreak") val bestStreak: Int = 0,
    @SerializedName("streakLastActivity") val streakLastActivity: Date? = null,
    @SerializedName("todayCompletedHabits") val todayCompletedHabits: Int = 0,
    @SerializedName("todayTotalHabits") val todayTotalHabits: Int = 0,
    @SerializedName("todayProgress") val todayProgress: Double = 0.0,
    @SerializedName("pendingHabitIds") val pendingHabitIds: List<String> = emptyList(),
    @SerializedName("weeklyProgress") val weeklyProgress: Double = 0.0,
    @SerializedName("totalPoints") val totalPoints: Int = 0,
    @SerializedName("currentLevel") val currentLevel: Int = 1,
    @SerializedName("lastUpdated") val lastUpdated: Date = Date(),
    @SerializedName("syncVersion") val syncVersion: Int = 1
) {
    val pendingHabits: List<HabitSummary>
        get() = habits.filter { !it.isCompletedToday }

    val completedHabits: List<HabitSummary>
        get() = habits.filter { it.isCompletedToday }

    val todayProgressPercent: Int
        get() = (todayProgress * 100).toInt()
}

/**
 * Habit completion request to send to phone
 */
data class HabitCompletionRequest(
    @SerializedName("habitId") val habitId: String,
    @SerializedName("completedAt") val completedAt: Date = Date(),
    @SerializedName("source") val source: String = "wearOS"
)

/**
 * Watch message types
 */
enum class WatchMessageType {
    @SerializedName("sync_request") SYNC_REQUEST,
    @SerializedName("habit_completed") HABIT_COMPLETED,
    @SerializedName("habit_uncompleted") HABIT_UNCOMPLETED,
    @SerializedName("refresh_data") REFRESH_DATA
}

/**
 * Watch message wrapper
 */
data class WatchMessage(
    @SerializedName("type") val type: WatchMessageType,
    @SerializedName("payload") val payload: String? = null,
    @SerializedName("timestamp") val timestamp: Date = Date()
)
