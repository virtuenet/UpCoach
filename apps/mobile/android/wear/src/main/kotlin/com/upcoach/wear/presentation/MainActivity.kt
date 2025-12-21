package com.upcoach.wear.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.upcoach.wear.data.DataLayerService
import com.upcoach.wear.presentation.screens.HabitListScreen
import com.upcoach.wear.presentation.screens.ProgressScreen
import com.upcoach.wear.presentation.screens.StreakScreen
import com.upcoach.wear.presentation.theme.UpCoachWearTheme

/**
 * Main activity for Wear OS app
 */
class MainActivity : ComponentActivity() {

    private lateinit var dataLayerService: DataLayerService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        dataLayerService = DataLayerService.getInstance(this)

        setContent {
            UpCoachWearTheme {
                val navController = rememberSwipeDismissableNavController()
                val companionData by dataLayerService.companionData.collectAsState()
                val isConnected by dataLayerService.isConnected.collectAsState()

                SwipeDismissableNavHost(
                    navController = navController,
                    startDestination = "habits"
                ) {
                    composable("habits") {
                        HabitListScreen(
                            companionData = companionData,
                            isConnected = isConnected,
                            onHabitComplete = { habitId ->
                                dataLayerService.completeHabit(habitId)
                            },
                            onHabitUncomplete = { habitId ->
                                dataLayerService.uncompleteHabit(habitId)
                            },
                            onRefresh = {
                                dataLayerService.requestSync()
                            },
                            onNavigateToStreak = {
                                navController.navigate("streak")
                            },
                            onNavigateToProgress = {
                                navController.navigate("progress")
                            }
                        )
                    }

                    composable("streak") {
                        StreakScreen(
                            companionData = companionData,
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable("progress") {
                        ProgressScreen(
                            companionData = companionData,
                            isConnected = isConnected,
                            onBack = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        dataLayerService.checkConnection()
    }

    override fun onDestroy() {
        super.onDestroy()
        dataLayerService.cleanup()
    }
}
