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

/**
 * Widget provider for displaying streak information on home screen
 */
class StreakWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "companion_data"
        private const val PREFS_DATA_KEY = "companion_data"
        private const val ACTION_REFRESH = "com.upcoach.upcoach_mobile.widgets.STREAK_REFRESH"
        private const val ACTION_OPEN_APP = "com.upcoach.upcoach_mobile.widgets.STREAK_OPEN_APP"

        // Colors
        private const val COLOR_STREAK = "#FF6B35"
        private const val COLOR_LEVEL = "#9C27B0"
        private const val COLOR_POINTS = "#FFD700"
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
                    android.content.ComponentName(context, StreakWidgetProvider::class.java)
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
        val views = RemoteViews(context.packageName, R.layout.widget_streak)
        val data = loadCompanionData(context)

        val streak = data?.currentStreak ?: 0
        val bestStreak = data?.bestStreak ?: 0
        val level = data?.currentLevel ?: 1
        val points = data?.totalPoints ?: 0

        // Set streak emoji based on streak length
        val streakEmoji = when {
            streak == 0 -> "🌱"
            streak < 7 -> "🔥"
            streak < 30 -> "🔥🔥"
            streak < 100 -> "🔥🔥🔥"
            else -> "⭐"
        }

        views.setTextViewText(R.id.widget_streak_emoji, streakEmoji)
        views.setTextViewText(R.id.widget_streak_count, "$streak")
        views.setTextViewText(R.id.widget_streak_label, if (streak == 1) "day" else "days")
        views.setTextColor(R.id.widget_streak_count, Color.parseColor(COLOR_STREAK))

        // Set stats
        views.setTextViewText(R.id.widget_streak_best_value, "$bestStreak")
        views.setTextViewText(R.id.widget_streak_level_value, "$level")
        views.setTextViewText(R.id.widget_streak_points_value, formatPoints(points))

        // Set click actions
        val openAppIntent = Intent(context, StreakWidgetProvider::class.java).apply {
            action = ACTION_OPEN_APP
        }
        val openAppPending = PendingIntent.getBroadcast(
            context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_streak_container, openAppPending)

        val refreshIntent = Intent(context, StreakWidgetProvider::class.java).apply {
            action = ACTION_REFRESH
        }
        val refreshPending = PendingIntent.getBroadcast(
            context, 1, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_streak_refresh_btn, refreshPending)

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

    private fun formatPoints(points: Int): String {
        return when {
            points >= 1000000 -> "${points / 1000000}M"
            points >= 1000 -> "${points / 1000}k"
            else -> "$points"
        }
    }
}
