package com.upcoach.upcoach_mobile.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.upcoach.upcoach_mobile.R
import kotlin.math.roundToInt

/**
 * Widget provider for displaying habits on home screen
 */
class HabitWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "companion_data"
        private const val PREFS_DATA_KEY = "companion_data"
        private const val ACTION_REFRESH = "com.upcoach.upcoach_mobile.widgets.REFRESH"
        private const val ACTION_OPEN_APP = "com.upcoach.upcoach_mobile.widgets.OPEN_APP"
    }

    private val gson: Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_REFRESH -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val widgetIds = appWidgetManager.getAppWidgetIds(
                    android.content.ComponentName(context, HabitWidgetProvider::class.java)
                )
                onUpdate(context, appWidgetManager, widgetIds)
            }
            ACTION_OPEN_APP -> {
                val launchIntent = context.packageManager
                    .getLaunchIntentForPackage(context.packageName)
                    ?.apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
                context.startActivity(launchIntent)
            }
        }
    }

    private fun updateWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_habits)
        val data = loadCompanionData(context)

        // Update header
        val progress = data?.todayProgress ?: 0.0
        val completed = data?.todayCompletedHabits ?: 0
        val total = data?.todayTotalHabits ?: 0

        views.setTextViewText(R.id.widget_habits_progress_text, "$completed/$total")
        views.setTextViewText(
            R.id.widget_habits_progress_percent,
            "${(progress * 100).roundToInt()}%"
        )

        // Update progress bar color
        val progressColor = when {
            progress >= 1.0 -> Color.parseColor("#4CAF50")  // Success green
            progress >= 0.5 -> Color.parseColor("#4361EE")  // Primary blue
            else -> Color.parseColor("#FF9800")  // Warning orange
        }
        views.setInt(R.id.widget_habits_progress_bar, "setBackgroundColor", progressColor)

        // Update habit list
        val pendingHabits = data?.habits?.filter { !it.isCompletedToday }?.take(3) ?: emptyList()

        if (pendingHabits.isEmpty() && data?.habits?.isNotEmpty() == true) {
            views.setTextViewText(R.id.widget_habit_1_text, "✅ All done!")
            views.setTextViewText(R.id.widget_habit_2_text, "")
            views.setTextViewText(R.id.widget_habit_3_text, "")
        } else {
            views.setTextViewText(
                R.id.widget_habit_1_text,
                pendingHabits.getOrNull(0)?.let { "${it.emoji ?: "○"} ${it.name}" } ?: ""
            )
            views.setTextViewText(
                R.id.widget_habit_2_text,
                pendingHabits.getOrNull(1)?.let { "${it.emoji ?: "○"} ${it.name}" } ?: ""
            )
            views.setTextViewText(
                R.id.widget_habit_3_text,
                pendingHabits.getOrNull(2)?.let { "${it.emoji ?: "○"} ${it.name}" } ?: ""
            )
        }

        // Set click actions
        val openAppIntent = Intent(context, HabitWidgetProvider::class.java).apply {
            action = ACTION_OPEN_APP
        }
        val openAppPending = PendingIntent.getBroadcast(
            context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_habits_container, openAppPending)

        val refreshIntent = Intent(context, HabitWidgetProvider::class.java).apply {
            action = ACTION_REFRESH
        }
        val refreshPending = PendingIntent.getBroadcast(
            context, 1, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_habits_refresh_btn, refreshPending)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun loadCompanionData(context: Context): WidgetCompanionData? {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(PREFS_DATA_KEY, null)
            if (json != null) {
                gson.fromJson(json, WidgetCompanionData::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}

/**
 * Simplified companion data for widget display
 */
data class WidgetCompanionData(
    val habits: List<WidgetHabitSummary> = emptyList(),
    val currentStreak: Int = 0,
    val bestStreak: Int = 0,
    val todayCompletedHabits: Int = 0,
    val todayTotalHabits: Int = 0,
    val todayProgress: Double = 0.0,
    val totalPoints: Int = 0,
    val currentLevel: Int = 1
)

data class WidgetHabitSummary(
    val id: String,
    val name: String,
    val emoji: String?,
    val isCompletedToday: Boolean,
    val currentStreak: Int
)
