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
 * Tile service for displaying pending habits
 */
class HabitTileService : TileService() {

    companion object {
        private const val RESOURCES_VERSION = "1"

        // Colors
        private const val COLOR_PRIMARY = 0xFF4361EE.toInt()
        private const val COLOR_SUCCESS = 0xFF4CAF50.toInt()
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
                .setFreshnessIntervalMillis(300000) // 5 minutes
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
                    .addContent(buildHeader(data))
                    .addContent(buildHabitList(data))
                    .build()
            )
            .build()
    }

    private fun buildHeader(data: com.upcoach.wear.data.CompanionData): LayoutElement {
        val progress = data.todayProgress.toFloat()
        val completed = data.todayCompletedHabits
        val total = data.todayTotalHabits

        return Row.Builder()
            .setWidth(expand())
            .setVerticalAlignment(VERTICAL_ALIGN_CENTER)
            .addContent(
                // Progress arc
                Arc.Builder()
                    .addContent(
                        ArcLine.Builder()
                            .setLength(degrees(360f * progress))
                            .setThickness(dp(4f))
                            .setColor(argb(if (progress >= 1f) COLOR_SUCCESS else COLOR_PRIMARY))
                            .build()
                    )
                    .setAnchorAngle(degrees(-90f))
                    .setAnchorType(ARC_ANCHOR_START)
                    .build()
            )
            .addContent(
                Spacer.Builder().setWidth(dp(8f)).build()
            )
            .addContent(
                Column.Builder()
                    .addContent(
                        Text.Builder()
                            .setText("$completed/$total")
                            .setFontStyle(
                                FontStyle.Builder()
                                    .setSize(sp(16f))
                                    .setWeight(FONT_WEIGHT_BOLD)
                                    .setColor(argb(COLOR_TEXT))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        Text.Builder()
                            .setText(if (progress >= 1f) "All done!" else "habits")
                            .setFontStyle(
                                FontStyle.Builder()
                                    .setSize(sp(10f))
                                    .setColor(argb(COLOR_TEXT_SECONDARY))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .build()
    }

    private fun buildHabitList(data: com.upcoach.wear.data.CompanionData): LayoutElement {
        val pendingHabits = data.pendingHabits.take(3)

        if (pendingHabits.isEmpty()) {
            return Column.Builder()
                .setWidth(expand())
                .setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
                .addContent(
                    Text.Builder()
                        .setText("✅")
                        .setFontStyle(
                            FontStyle.Builder()
                                .setSize(sp(24f))
                                .build()
                        )
                        .build()
                )
                .addContent(
                    Text.Builder()
                        .setText("Great job!")
                        .setFontStyle(
                            FontStyle.Builder()
                                .setSize(sp(12f))
                                .setColor(argb(COLOR_SUCCESS))
                                .build()
                        )
                        .build()
                )
                .build()
        }

        val columnBuilder = Column.Builder()
            .setWidth(expand())

        pendingHabits.forEach { habit ->
            columnBuilder.addContent(
                Row.Builder()
                    .setWidth(expand())
                    .setVerticalAlignment(VERTICAL_ALIGN_CENTER)
                    .addContent(
                        Text.Builder()
                            .setText(habit.displayEmoji)
                            .setFontStyle(
                                FontStyle.Builder()
                                    .setSize(sp(14f))
                                    .build()
                            )
                            .build()
                    )
                    .addContent(
                        Spacer.Builder().setWidth(dp(6f)).build()
                    )
                    .addContent(
                        Text.Builder()
                            .setText(habit.name.take(15))
                            .setFontStyle(
                                FontStyle.Builder()
                                    .setSize(sp(12f))
                                    .setColor(argb(COLOR_TEXT))
                                    .build()
                            )
                            .setMaxLines(1)
                            .build()
                    )
                    .build()
            )
            columnBuilder.addContent(
                Spacer.Builder().setHeight(dp(4f)).build()
            )
        }

        if (data.pendingHabits.size > 3) {
            columnBuilder.addContent(
                Text.Builder()
                    .setText("+${data.pendingHabits.size - 3} more")
                    .setFontStyle(
                        FontStyle.Builder()
                            .setSize(sp(10f))
                            .setColor(argb(COLOR_TEXT_SECONDARY))
                            .build()
                    )
                    .build()
            )
        }

        return columnBuilder.build()
    }
}
