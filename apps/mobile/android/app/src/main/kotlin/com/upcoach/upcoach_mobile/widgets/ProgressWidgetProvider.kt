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
 * Widget provider for displaying daily progress on home screen
 * Compact circular progress widget
 */
class ProgressWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "companion_data"
        private const val PREFS_DATA_KEY = "companion_data"
        private const val ACTION_REFRESH = "com.upcoach.upcoach_mobile.widgets.PROGRESS_REFRESH"
        private const val ACTION_OPEN_APP = "com.upcoach.upcoach_mobile.widgets.PROGRESS_OPEN_APP"

        // Colors
        private const val COLOR_SUCCESS = "#4CAF50"
        private const val COLOR_PRIMARY = "#4361EE"
        private const val COLOR_WARNING = "#FF9800"
        private const val COLOR_DANGER = "#F44336"
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
                    android.content.ComponentName(context, ProgressWidgetProvider::class.java)
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
        val views = RemoteViews(context.packageName, R.layout.widget_progress)
        val data = loadCompanionData(context)

        val progress = data?.todayProgress ?: 0.0
        val completed = data?.todayCompletedHabits ?: 0
        val total = data?.todayTotalHabits ?: 0
        val streak = data?.currentStreak ?: 0

        // Set progress percentage
        val percentText = "${(progress * 100).roundToInt()}%"
        views.setTextViewText(R.id.widget_progress_percent, percentText)
        views.setTextViewText(R.id.widget_progress_count, "$completed/$total")

        // Set progress color based on completion
        val progressColor = when {
            progress >= 1.0 -> COLOR_SUCCESS
            progress >= 0.75 -> COLOR_PRIMARY
            progress >= 0.5 -> COLOR_WARNING
            else -> COLOR_DANGER
        }
        views.setTextColor(R.id.widget_progress_percent, Color.parseColor(progressColor))

        // Set streak display
        views.setTextViewText(R.id.widget_progress_streak, "🔥 $streak")

        // Set status message
        val statusMessage = when {
            progress >= 1.0 -> "All done!"
            completed == 0 -> "Get started"
            else -> "${total - completed} to go"
        }
        views.setTextViewText(R.id.widget_progress_status, statusMessage)

        // Set click action to open app
        val openAppIntent = Intent(context, ProgressWidgetProvider::class.java).apply {
            action = ACTION_OPEN_APP
        }
        val openAppPending = PendingIntent.getBroadcast(
            context, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_progress_container, openAppPending)

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
