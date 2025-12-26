package com.upcoach.mobile

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import android.util.Log
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

/**
 * Google Assistant Action Handler (Phase 10)
 *
 * Processes voice commands from Google Assistant and executes
 * corresponding actions in the UpCoach app.
 *
 * Voice Commands:
 * - "Hey Google, check in my habit on UpCoach"
 * - "Hey Google, show my goals on UpCoach"
 * - "Hey Google, log my mood on UpCoach"
 * - "Hey Google, track my water intake on UpCoach"
 */
class AssistantActionHandler(private val context: Context) {
    
    companion object {
        private const val TAG = "AssistantActionHandler"
        private const val PREFS_NAME = "upcoach_shared_prefs"
        
        // Action types
        const val ACTION_CHECK_IN_HABIT = "actions.intent.CHECK_IN_HABIT"
        const val ACTION_VIEW_GOALS = "actions.intent.VIEW_GOALS"
        const val ACTION_LOG_MOOD = "actions.intent.LOG_MOOD"
        const val ACTION_TRACK_WATER = "actions.intent.TRACK_WATER"
        const val ACTION_VIEW_PROGRESS = "actions.intent.VIEW_PROGRESS"
    }
    
    private val sharedPrefs: SharedPreferences = 
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    /**
     * Handle incoming Assistant action
     *
     * @param intent Intent from Assistant with action and parameters
     * @return Response message for voice feedback
     */
    fun handleAction(intent: Intent): String {
        val action = intent.action ?: return "Unknown action"
        val data = intent.data
        
        Log.d(TAG, "Handling action: $action, data: $data")
        
        return when (action) {
            Intent.ACTION_VIEW -> handleDeepLink(data)
            ACTION_CHECK_IN_HABIT -> handleCheckInHabit(intent)
            ACTION_VIEW_GOALS -> handleViewGoals(intent)
            ACTION_LOG_MOOD -> handleLogMood(intent)
            ACTION_TRACK_WATER -> handleTrackWater(intent)
            ACTION_VIEW_PROGRESS -> handleViewProgress()
            else -> "Action not supported"
        }
    }
    
    /**
     * Handle deep link navigation
     */
    private fun handleDeepLink(uri: Uri?): String {
        uri ?: return "Invalid deep link"
        
        Log.d(TAG, "Deep link: $uri")
        
        return when (uri.host) {
            "habits" -> when (uri.pathSegments.firstOrNull()) {
                "checkin" -> handleCheckInHabitFromDeepLink(uri)
                "water" -> handleTrackWaterFromDeepLink(uri)
                else -> "Opening habits"
            }
            "goals" -> "Opening goals"
            "mood" -> when (uri.pathSegments.firstOrNull()) {
                "log" -> handleLogMoodFromDeepLink(uri)
                else -> "Opening mood tracker"
            }
            "dashboard" -> "Opening dashboard"
            else -> "Opening UpCoach"
        }
    }
    
    /**
     * Check in a habit via voice command
     */
    private fun handleCheckInHabit(intent: Intent): String {
        val habitName = intent.getStringExtra("habitName") ?: getPrimaryHabitName()
        
        if (habitName.isEmpty()) {
            return "You don't have any active habits. Open UpCoach to create one."
        }
        
        // Record check-in
        val success = recordHabitCheckIn(habitName)
        
        return if (success) {
            val streak = getHabitStreak()
            if (streak > 0) {
                when {
                    streak % 7 == 0 -> "🎉 Great job! You've completed $habitName and reached a $streak-day streak!"
                    else -> "✅ $habitName checked in! Your streak is now $streak days."
                }
            } else {
                "✅ $habitName checked in!"
            }
        } else {
            "❌ Failed to check in $habitName. Please try again."
        }
    }
    
    private fun handleCheckInHabitFromDeepLink(uri: Uri): String {
        val habitName = uri.getQueryParameter("name") ?: getPrimaryHabitName()
        return handleCheckInHabitInternal(habitName)
    }
    
    private fun handleCheckInHabitInternal(habitName: String): String {
        val success = recordHabitCheckIn(habitName)
        val streak = getHabitStreak()
        
        return if (success) {
            if (streak % 7 == 0) {
                "🎉 $habitName checked in! $streak-day streak milestone!"
            } else {
                "✅ $habitName checked in! Streak: $streak days"
            }
        } else {
            "❌ Failed to check in $habitName"
        }
    }
    
    /**
     * View goals via voice command
     */
    private fun handleViewGoals(intent: Intent): String {
        val goalType = intent.getStringExtra("goalType")
        val goals = fetchGoals(goalType)
        
        if (goals.isEmpty()) {
            return "You don't have any active goals. Open UpCoach to create one."
        }
        
        val summary = buildGoalsSummary(goals, goalType)
        return summary
    }
    
    /**
     * Log mood via voice command
     */
    private fun handleLogMood(intent: Intent): String {
        val moodType = intent.getStringExtra("moodType") ?: "neutral"
        val notes = intent.getStringExtra("notes") ?: ""
        
        val success = recordMoodEntry(moodType, notes)
        
        return if (success) {
            val emoji = getMoodEmoji(moodType)
            var response = "$emoji Mood logged as $moodType"
            
            if (notes.isNotEmpty()) {
                response += " with note: '$notes'"
            }
            
            // Add motivational message
            response += when (moodType) {
                "great", "amazing", "happy" -> ". Keep up the great energy!"
                "bad", "terrible", "sad" -> ". Remember to take care of yourself today."
                else -> ""
            }
            
            response
        } else {
            "❌ Failed to log mood. Please try again."
        }
    }
    
    private fun handleLogMoodFromDeepLink(uri: Uri): String {
        val moodType = uri.getQueryParameter("type") ?: "neutral"
        val notes = uri.getQueryParameter("notes") ?: ""
        return handleLogMoodInternal(moodType, notes)
    }
    
    private fun handleLogMoodInternal(moodType: String, notes: String): String {
        val success = recordMoodEntry(moodType, notes)
        return if (success) {
            "${getMoodEmoji(moodType)} Mood logged as $moodType"
        } else {
            "❌ Failed to log mood"
        }
    }
    
    /**
     * Track water intake via voice command
     */
    private fun handleTrackWater(intent: Intent): String {
        val amount = intent.getStringExtra("amount")?.toIntOrNull() ?: 250 // Default 250ml
        
        val success = recordWaterIntake(amount)
        
        return if (success) {
            val totalToday = getTodayWaterIntake()
            "💧 Logged ${amount}ml of water. Today's total: ${totalToday}ml"
        } else {
            "❌ Failed to log water intake. Please try again."
        }
    }
    
    private fun handleTrackWaterFromDeepLink(uri: Uri): String {
        val amount = uri.getQueryParameter("amount")?.toIntOrNull() ?: 250
        return handleTrackWaterInternal(amount)
    }
    
    private fun handleTrackWaterInternal(amount: Int): String {
        val success = recordWaterIntake(amount)
        val totalToday = getTodayWaterIntake()
        return if (success) {
            "💧 Logged ${amount}ml. Total: ${totalToday}ml"
        } else {
            "❌ Failed to log water"
        }
    }
    
    /**
     * View progress via voice command
     */
    private fun handleViewProgress(): String {
        val completedToday = sharedPrefs.getInt("habits_completed_today", 0)
        val totalHabits = sharedPrefs.getStringSet("active_habits", setOf())?.size ?: 0
        val currentStreak = sharedPrefs.getInt("primary_habit_streak", 0)
        
        return if (totalHabits > 0) {
            "You've completed $completedToday out of $totalHabits habits today. Current streak: $currentStreak days."
        } else {
            "You don't have any active habits yet. Open UpCoach to get started."
        }
    }
    
    // MARK: - Helper Methods
    
    private fun recordHabitCheckIn(habitName: String): Boolean {
        try {
            val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val timestamp = System.currentTimeMillis()
            
            // Get existing check-ins
            val checkInsJson = sharedPrefs.getString("habit_check_ins", "{}")
            val checkIns = JSONObject(checkInsJson ?: "{}")
            
            // Add new check-in
            val checkInKey = "${habitName}_$today"
            val checkInData = JSONObject().apply {
                put("habitName", habitName)
                put("date", today)
                put("timestamp", timestamp)
                put("source", "google_assistant")
            }
            checkIns.put(checkInKey, checkInData)
            
            // Save
            sharedPrefs.edit().apply {
                putString("habit_check_ins", checkIns.toString())
                putInt("primary_habit_streak", getHabitStreak() + 1)
                putBoolean("primary_habit_completed_today", true)
                
                // Update daily progress
                val completed = sharedPrefs.getInt("habits_completed_today", 0) + 1
                putInt("habits_completed_today", completed)
                
                apply()
            }
            
            Log.d(TAG, "✅ Checked in '$habitName' via Google Assistant")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to record habit check-in", e)
            return false
        }
    }
    
    private fun recordMoodEntry(moodType: String, notes: String): Boolean {
        try {
            val timestamp = System.currentTimeMillis()
            val moodScore = getMoodScore(moodType)
            
            // Create mood entry
            val entry = JSONObject().apply {
                put("id", UUID.randomUUID().toString())
                put("timestamp", timestamp)
                put("mood", moodType)
                put("moodScore", moodScore)
                put("emoji", getMoodEmoji(moodType))
                put("notes", notes)
                put("source", "google_assistant")
            }
            
            // Get existing entries
            val entriesJson = sharedPrefs.getString("mood_entries", "[]")
            val entries = org.json.JSONArray(entriesJson ?: "[]")
            entries.put(entry)
            
            // Save
            sharedPrefs.edit().apply {
                putString("mood_entries", entries.toString())
                apply()
            }
            
            Log.d(TAG, "✅ Logged mood '$moodType' via Google Assistant")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to record mood entry", e)
            return false
        }
    }
    
    private fun recordWaterIntake(amount: Int): Boolean {
        try {
            val currentTotal = getTodayWaterIntake()
            val newTotal = currentTotal + amount
            
            sharedPrefs.edit().apply {
                putInt("water_intake_today", newTotal)
                apply()
            }
            
            Log.d(TAG, "✅ Logged ${amount}ml water via Google Assistant")
            return true
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to record water intake", e)
            return false
        }
    }
    
    private fun getPrimaryHabitName(): String {
        return sharedPrefs.getString("primary_habit_name", "") ?: ""
    }
    
    private fun getHabitStreak(): Int {
        return sharedPrefs.getInt("primary_habit_streak", 0)
    }
    
    private fun getTodayWaterIntake(): Int {
        return sharedPrefs.getInt("water_intake_today", 0)
    }
    
    private fun fetchGoals(type: String?): List<Goal> {
        // TODO: Implement actual goal fetching from shared preferences
        return emptyList()
    }
    
    private fun buildGoalsSummary(goals: List<Goal>, type: String?): String {
        val typeLabel = type?.let { "$it " } ?: ""
        return "You have ${goals.size} ${typeLabel}goal${if (goals.size > 1) "s" else ""}."
    }
    
    private fun getMoodScore(moodType: String): Int {
        return when (moodType.lowercase()) {
            "amazing" -> 10
            "great", "happy" -> 8
            "good" -> 7
            "okay", "neutral" -> 5
            "meh" -> 4
            "bad", "sad" -> 3
            "terrible" -> 1
            else -> 5
        }
    }
    
    private fun getMoodEmoji(moodType: String): String {
        return when (moodType.lowercase()) {
            "amazing" -> "🤩"
            "great", "happy" -> "😄"
            "good" -> "🙂"
            "okay", "neutral" -> "😐"
            "meh" -> "😕"
            "bad", "sad" -> "😞"
            "terrible" -> "😢"
            else -> "😐"
        }
    }
    
    data class Goal(
        val id: String,
        val name: String,
        val type: String,
        val progress: Double
    )
}
