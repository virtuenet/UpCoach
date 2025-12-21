package com.upcoach.wear.tiles

import android.content.Context
import androidx.wear.protolayout.*
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.protolayout.ModifiersBuilders.*
import androidx.wear.protolayout.ResourceBuilders.*
import androidx.wear.protolayout.TimelineBuilders.*
import androidx.wear.tiles.*
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.upcoach.wear.data.DataLayerService
import kotlinx.coroutines.runBlocking

/**
 * Tile service for displaying streak information
 */
class StreakTileService : TileService() {

    companion object {
        private const val RESOURCES_VERSION = "1"

        // Colors
        private const val COLOR_STREAK = 0xFFFF6B35.toInt()
        private const val COLOR_SUCCESS = 0xFF4CAF50.toInt()
        private const val COLOR_POINTS = 0xFFFFD700.toInt()
        private const val COLOR_LEVEL = 0xFF9C27B0.toInt()
        private const val COLOR_SURFACE = 0xFF1A1A1A.toInt()
        private const val COLOR_TEXT = 0xFFFFFFFF.toInt()
        private const val COLOR_TEXT_SECONDARY = 0xFFB3B3B3.toInt()
    }

    private lateinit var dataLayerService: DataLayerService

    override fun onCreate() {
        super.onCreate()
        dataLayerService = DataLayerService.getInstance(this)
    }

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val companionData = runBlocking { dataLayerService.companionData.value }

        val timeline = Timeline.Builder()
            .addTimelineEntry(
                TimelineEntry.Builder()
                    .setLayout(
                        Layout.Builder()
                            .setRoot(buildLayout(companionData))
                            .build()
                    )
                    .build()
            )
            .build()

        return Futures.immediateFuture(
            TileBuilders.Tile.Builder()
                .setResourcesVersion(RESOURCES_VERSION)
                .setTileTimeline(timeline)
                .setFreshnessIntervalMillis(3600000) // 1 hour
                .build()
        )
    }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<Resources> {
        return Futures.immediateFuture(
            Resources.Builder()
                .setVersion(RESOURCES_VERSION)
                .build()
        )
    }

    private fun buildLayout(data: com.upcoach.wear.data.CompanionData): LayoutElement {
        return Box.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setModifiers(
                Modifiers.Builder()
                    .setBackground(
                        Background.Builder()
                            .setColor(argb(COLOR_SURFACE))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Column.Builder()
                    .setWidth(expand())
                    .setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
                    .addContent(buildStreakDisplay(data.currentStreak))
                    .addContent(Spacer.Builder().setHeight(dp(8f)).build())
                    .addContent(buildStats(data))
                    .build()
            )
            .build()
    }

    private fun buildStreakDisplay(streak: Int): LayoutElement {
        val emoji = when {
            streak == 0 -> "🌱"
            streak < 7 -> "🔥"
            streak < 30 -> "🔥🔥"
            streak < 100 -> "🔥🔥🔥"
            else -> "⭐"
        }

        return Column.Builder()
            .setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
            .addContent(
                Text.Builder()
                    .setText(emoji)
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(32f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText("$streak")
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(48f))
                            .setWeight(FONT_WEIGHT_BOLD)
                            .setColor(argb(COLOR_STREAK))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(if (streak == 1) "day" else "days")
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(12f))
                            .setColor(argb(COLOR_TEXT_SECONDARY))
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun buildStats(data: com.upcoach.wear.data.CompanionData): LayoutElement {
        return Row.Builder()
            .setWidth(expand())
            .setVerticalAlignment(VERTICAL_ALIGN_CENTER)
            .addContent(
                buildStatItem("🏆", "${data.bestStreak}", "best", COLOR_POINTS)
            )
            .addContent(
                Spacer.Builder().setWidth(dp(12f)).build()
            )
            .addContent(
                buildStatItem("⭐", "${data.currentLevel}", "level", COLOR_LEVEL)
            )
            .addContent(
                Spacer.Builder().setWidth(dp(12f)).build()
            )
            .addContent(
                buildStatItem("⚡", formatPoints(data.totalPoints), "pts", COLOR_STREAK)
            )
            .build()
    }

    private fun buildStatItem(emoji: String, value: String, label: String, color: Int): LayoutElement {
        return Column.Builder()
            .setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
            .addContent(
                Text.Builder()
                    .setText(emoji)
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(10f))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(value)
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(14f))
                            .setWeight(FONT_WEIGHT_BOLD)
                            .setColor(argb(color))
                            .build()
                    )
                    .build()
            )
            .addContent(
                Text.Builder()
                    .setText(label)
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(8f))
                            .setColor(argb(COLOR_TEXT_SECONDARY))
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun formatPoints(points: Int): String {
        return when {
            points >= 1000000 -> "${points / 1000000}M"
            points >= 1000 -> "${points / 1000}k"
            else -> "$points"
        }
    }
}
