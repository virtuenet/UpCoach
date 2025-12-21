package com.upcoach.wear.data

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.*
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.nio.charset.Charset

/**
 * Service for communicating with the phone app via Data Layer API
 */
class DataLayerService(private val context: Context) {

    companion object {
        private const val TAG = "DataLayerService"
        private const val COMPANION_DATA_PATH = "/companion_data"
        private const val MESSAGE_PATH = "/message"
        private const val PHONE_CAPABILITY = "upcoach_phone"
        private const val PREFS_NAME = "companion_data_cache"
        private const val PREFS_DATA_KEY = "cached_data"

        @Volatile
        private var INSTANCE: DataLayerService? = null

        fun getInstance(context: Context): DataLayerService {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: DataLayerService(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val capabilityClient: CapabilityClient = Wearable.getCapabilityClient(context)
    private val nodeClient: NodeClient = Wearable.getNodeClient(context)

    private val gson: Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _companionData = MutableStateFlow(loadCachedData())
    val companionData: StateFlow<CompanionData> = _companionData.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private var phoneNodeId: String? = null

    init {
        checkConnection()
    }

    /**
     * Check if phone app is connected
     */
    fun checkConnection() {
        scope.launch {
            try {
                val capabilityInfo = capabilityClient.getCapability(
                    PHONE_CAPABILITY,
                    CapabilityClient.FILTER_REACHABLE
                ).await()

                phoneNodeId = capabilityInfo.nodes.firstOrNull()?.id
                _isConnected.value = phoneNodeId != null

                if (phoneNodeId != null) {
                    requestSync()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking connection", e)
                _isConnected.value = false
            }
        }
    }

    /**
     * Request data sync from phone
     */
    fun requestSync() {
        scope.launch {
            try {
                val nodeId = phoneNodeId ?: findPhoneNode() ?: return@launch

                val message = WatchMessage(type = WatchMessageType.SYNC_REQUEST)
                val messageJson = gson.toJson(message)

                messageClient.sendMessage(
                    nodeId,
                    MESSAGE_PATH,
                    messageJson.toByteArray(Charset.forName("UTF-8"))
                ).await()

                Log.d(TAG, "Sync request sent to phone")
            } catch (e: Exception) {
                Log.e(TAG, "Error requesting sync", e)
            }
        }
    }

    /**
     * Complete a habit and notify phone
     */
    fun completeHabit(habitId: String) {
        scope.launch {
            try {
                // Optimistic local update
                updateLocalHabitCompletion(habitId, completed = true)

                // Send to phone
                val nodeId = phoneNodeId ?: findPhoneNode() ?: return@launch

                val request = HabitCompletionRequest(habitId = habitId)
                val message = WatchMessage(
                    type = WatchMessageType.HABIT_COMPLETED,
                    payload = gson.toJson(request)
                )

                messageClient.sendMessage(
                    nodeId,
                    MESSAGE_PATH,
                    gson.toJson(message).toByteArray(Charset.forName("UTF-8"))
                ).await()

                Log.d(TAG, "Habit completion sent: $habitId")
            } catch (e: Exception) {
                Log.e(TAG, "Error completing habit", e)
            }
        }
    }

    /**
     * Uncomplete a habit and notify phone
     */
    fun uncompleteHabit(habitId: String) {
        scope.launch {
            try {
                // Optimistic local update
                updateLocalHabitCompletion(habitId, completed = false)

                // Send to phone
                val nodeId = phoneNodeId ?: findPhoneNode() ?: return@launch

                val request = HabitCompletionRequest(habitId = habitId)
                val message = WatchMessage(
                    type = WatchMessageType.HABIT_UNCOMPLETED,
                    payload = gson.toJson(request)
                )

                messageClient.sendMessage(
                    nodeId,
                    MESSAGE_PATH,
                    gson.toJson(message).toByteArray(Charset.forName("UTF-8"))
                ).await()

                Log.d(TAG, "Habit uncompletion sent: $habitId")
            } catch (e: Exception) {
                Log.e(TAG, "Error uncompleting habit", e)
            }
        }
    }

    /**
     * Handle data changed from Data Layer
     */
    fun handleDataChanged(dataItem: DataItem) {
        if (dataItem.uri.path == COMPANION_DATA_PATH) {
            try {
                val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
                val dataJson = dataMap.getString("data")

                if (dataJson != null) {
                    val companionData = gson.fromJson(dataJson, CompanionData::class.java)
                    updateCompanionData(companionData)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error handling data changed", e)
            }
        }
    }

    /**
     * Handle message received from phone
     */
    fun handleMessageReceived(messageEvent: MessageEvent) {
        try {
            val messageJson = String(messageEvent.data, Charset.forName("UTF-8"))

            // Try to parse as CompanionData directly
            try {
                val companionData = gson.fromJson(messageJson, CompanionData::class.java)
                updateCompanionData(companionData)
                return
            } catch (e: Exception) {
                // Not CompanionData, try WatchMessage
            }

            // Try to parse as WatchMessage
            val message = gson.fromJson(messageJson, WatchMessage::class.java)
            when (message.type) {
                WatchMessageType.REFRESH_DATA -> requestSync()
                else -> { }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling message", e)
        }
    }

    /**
     * Update companion data from sync
     */
    private fun updateCompanionData(data: CompanionData) {
        _companionData.value = data
        cacheData(data)
    }

    /**
     * Optimistically update local habit completion
     */
    private fun updateLocalHabitCompletion(habitId: String, completed: Boolean) {
        val currentData = _companionData.value
        val updatedHabits = currentData.habits.map { habit ->
            if (habit.id == habitId) {
                habit.copy(
                    isCompletedToday = completed,
                    currentStreak = if (completed) habit.currentStreak + 1 else maxOf(0, habit.currentStreak - 1)
                )
            } else {
                habit
            }
        }

        val completedCount = updatedHabits.count { it.isCompletedToday }
        val totalCount = updatedHabits.size
        val progress = if (totalCount > 0) completedCount.toDouble() / totalCount else 0.0

        _companionData.value = currentData.copy(
            habits = updatedHabits,
            todayCompletedHabits = completedCount,
            todayProgress = progress
        )
    }

    /**
     * Find phone node ID
     */
    private suspend fun findPhoneNode(): String? {
        return try {
            val nodes = nodeClient.connectedNodes.await()
            nodes.firstOrNull()?.id.also { phoneNodeId = it }
        } catch (e: Exception) {
            Log.e(TAG, "Error finding phone node", e)
            null
        }
    }

    /**
     * Cache companion data locally
     */
    private fun cacheData(data: CompanionData) {
        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(PREFS_DATA_KEY, gson.toJson(data)).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error caching data", e)
        }
    }

    /**
     * Load cached companion data
     */
    private fun loadCachedData(): CompanionData {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val json = prefs.getString(PREFS_DATA_KEY, null)
            if (json != null) {
                gson.fromJson(json, CompanionData::class.java)
            } else {
                CompanionData()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading cached data", e)
            CompanionData()
        }
    }

    /**
     * Clean up resources
     */
    fun cleanup() {
        scope.cancel()
    }
}
