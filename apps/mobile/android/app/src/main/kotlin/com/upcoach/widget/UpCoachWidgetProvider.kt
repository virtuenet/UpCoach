package com.upcoach.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews
import com.upcoach.R
import java.text.SimpleDateFormat
import java.util.*

class UpCoachWidgetProvider : AppWidgetProvider() {
    
    companion object {
        const val PREFS_NAME = "com.upcoach.widget"
        const val PREF_WIDGET_TYPE = "widget_type"
        const val PREF_LAST_UPDATED = "last_updated"
        
        // Goals prefs
        const val PREF_COMPLETED_COUNT = "completed_count"
        const val PREF_TOTAL_COUNT = "total_count"
        
        // Tasks prefs
        const val PREF_COMPLETED_TODAY = "completed_today"
        const val PREF_PENDING_TODAY = "pending_today"
        
        // Streak prefs
        const val PREF_CURRENT_STREAK = "current_streak"
        const val PREF_BEST_STREAK = "best_streak"
        const val PREF_LAST_ACTIVITY = "last_activity"
        
        // Progress prefs
        const val PREF_WEEKLY_PROGRESS = "weekly_progress"
        const val PREF_SESSIONS_COMPLETED = "sessions_completed"
        const val PREF_POINTS_EARNED = "points_earned"
        const val PREF_NEXT_MILESTONE = "next_milestone"
    }
    
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }
    
    override fun onEnabled(context: Context) {
        // Enter relevant functionality for when the first widget is created
    }
    
    override fun onDisabled(context: Context) {
        // Enter relevant functionality for when the last widget is disabled
    }
    
    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val widgetType = prefs.getString(PREF_WIDGET_TYPE, "goals") ?: "goals"
        
        val views = when (widgetType) {
            "goals" -> createGoalsWidget(context, prefs)
            "tasks" -> createTasksWidget(context, prefs)
            "streak" -> createStreakWidget(context, prefs)
            "progress" -> createProgressWidget(context, prefs)
            else -> createGoalsWidget(context, prefs)
        }
        
        // Set click intent to open app
        val intent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("upcoach://open?widget=$widgetType")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
    
    private fun createGoalsWidget(context: Context, prefs: SharedPreferences): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_goals)
        
        val completedCount = prefs.getInt(PREF_COMPLETED_COUNT, 0)
        val totalCount = prefs.getInt(PREF_TOTAL_COUNT, 0)
        
        views.setTextViewText(R.id.widget_title, "Goals Progress")
        views.setTextViewText(R.id.widget_count, "$completedCount/$totalCount")
        
        // Set progress bar
        views.setProgressBar(
            R.id.widget_progress,
            totalCount,
            completedCount,
            false
        )
        
        // Load goals data
        for (i in 0..2) {
            val goalTitle = prefs.getString("goal_${i}_title", null)
            val goalStatus = prefs.getString("goal_${i}_status", "pending")
            val goalProgress = prefs.getFloat("goal_${i}_progress", 0f)
            
            if (goalTitle != null) {
                when (i) {
                    0 -> {
                        views.setTextViewText(R.id.goal_1_title, goalTitle)
                        views.setProgressBar(R.id.goal_1_progress, 100, (goalProgress * 100).toInt(), false)
                        views.setImageViewResource(
                            R.id.goal_1_icon,
                            if (goalStatus == "completed") R.drawable.ic_check_circle else R.drawable.ic_circle
                        )
                    }
                    1 -> {
                        views.setTextViewText(R.id.goal_2_title, goalTitle)
                        views.setProgressBar(R.id.goal_2_progress, 100, (goalProgress * 100).toInt(), false)
                        views.setImageViewResource(
                            R.id.goal_2_icon,
                            if (goalStatus == "completed") R.drawable.ic_check_circle else R.drawable.ic_circle
                        )
                    }
                    2 -> {
                        views.setTextViewText(R.id.goal_3_title, goalTitle)
                        views.setProgressBar(R.id.goal_3_progress, 100, (goalProgress * 100).toInt(), false)
                        views.setImageViewResource(
                            R.id.goal_3_icon,
                            if (goalStatus == "completed") R.drawable.ic_check_circle else R.drawable.ic_circle
                        )
                    }
                }
            }
        }
        
        return views
    }
    
    private fun createTasksWidget(context: Context, prefs: SharedPreferences): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_tasks)
        
        val completedToday = prefs.getInt(PREF_COMPLETED_TODAY, 0)
        val pendingToday = prefs.getInt(PREF_PENDING_TODAY, 0)
        
        views.setTextViewText(R.id.widget_title, "Today's Tasks")
        views.setTextViewText(R.id.completed_count, completedToday.toString())
        views.setTextViewText(R.id.pending_count, pendingToday.toString())
        
        // Load tasks data
        for (i in 0..2) {
            val taskTitle = prefs.getString("task_${i}_title", null)
            val taskPriority = prefs.getString("task_${i}_priority", "medium")
            
            if (taskTitle != null) {
                val taskViewIds = when (i) {
                    0 -> Triple(R.id.task_1_title, R.id.task_1_priority, R.id.task_1_checkbox)
                    1 -> Triple(R.id.task_2_title, R.id.task_2_priority, R.id.task_2_checkbox)
                    2 -> Triple(R.id.task_3_title, R.id.task_3_priority, R.id.task_3_checkbox)
                    else -> continue
                }
                
                views.setTextViewText(taskViewIds.first, taskTitle)
                
                val priorityColor = when (taskPriority) {
                    "high" -> Color.RED
                    "medium" -> Color.parseColor("#FF9800")
                    else -> Color.GREEN
                }
                views.setInt(taskViewIds.second, "setBackgroundColor", priorityColor)
            }
        }
        
        return views
    }
    
    private fun createStreakWidget(context: Context, prefs: SharedPreferences): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_streak)
        
        val currentStreak = prefs.getInt(PREF_CURRENT_STREAK, 0)
        val bestStreak = prefs.getInt(PREF_BEST_STREAK, 0)
        
        views.setTextViewText(R.id.streak_count, "$currentStreak Day Streak!")
        views.setTextViewText(R.id.best_streak, "Best: $bestStreak days")
        
        // Update day indicators
        val dayOfWeek = Calendar.getInstance().get(Calendar.DAY_OF_WEEK)
        val dayViews = listOf(
            R.id.day_mon, R.id.day_tue, R.id.day_wed,
            R.id.day_thu, R.id.day_fri, R.id.day_sat, R.id.day_sun
        )
        
        for ((index, dayViewId) in dayViews.withIndex()) {
            val isActive = index < currentStreak % 7
            views.setInt(
                dayViewId,
                "setBackgroundResource",
                if (isActive) R.drawable.bg_day_active else R.drawable.bg_day_inactive
            )
        }
        
        return views
    }
    
    private fun createProgressWidget(context: Context, prefs: SharedPreferences): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.widget_progress)
        
        val weeklyProgress = prefs.getFloat(PREF_WEEKLY_PROGRESS, 0f)
        val sessionsCompleted = prefs.getInt(PREF_SESSIONS_COMPLETED, 0)
        val pointsEarned = prefs.getInt(PREF_POINTS_EARNED, 0)
        val nextMilestone = prefs.getString(PREF_NEXT_MILESTONE, "50 pts") ?: "50 pts"
        
        views.setTextViewText(R.id.widget_title, "Weekly Progress")
        views.setTextViewText(R.id.progress_percentage, "${(weeklyProgress * 100).toInt()}%")
        views.setProgressBar(R.id.progress_circular, 100, (weeklyProgress * 100).toInt(), false)
        
        views.setTextViewText(R.id.sessions_count, sessionsCompleted.toString())
        views.setTextViewText(R.id.points_count, pointsEarned.toString())
        views.setTextViewText(R.id.next_milestone_value, nextMilestone)
        
        return views
    }
}

// Widget configuration activity
class UpCoachWidgetConfigureActivity : android.app.Activity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID
    
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED)
        
        setContentView(R.layout.widget_configure)
        
        // Extract widget ID from intent
        val extras = intent.extras
        if (extras != null) {
            appWidgetId = extras.getInt(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID
            )
        }
        
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish()
            return
        }
        
        // Set up widget type selection
        findViewById<android.view.View>(R.id.select_goals).setOnClickListener {
            saveWidgetType("goals")
        }
        
        findViewById<android.view.View>(R.id.select_tasks).setOnClickListener {
            saveWidgetType("tasks")
        }
        
        findViewById<android.view.View>(R.id.select_streak).setOnClickListener {
            saveWidgetType("streak")
        }
        
        findViewById<android.view.View>(R.id.select_progress).setOnClickListener {
            saveWidgetType("progress")
        }
    }
    
    private fun saveWidgetType(type: String) {
        val prefs = getSharedPreferences(UpCoachWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(UpCoachWidgetProvider.PREF_WIDGET_TYPE, type).apply()
        
        // Update widget
        val appWidgetManager = AppWidgetManager.getInstance(this)
        UpCoachWidgetProvider().updateAppWidget(this, appWidgetManager, appWidgetId)
        
        // Return result
        val resultValue = Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
        }
        setResult(RESULT_OK, resultValue)
        finish()
    }
}