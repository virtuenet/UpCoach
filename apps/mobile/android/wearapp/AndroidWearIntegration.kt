package com.upcoach.mobile.wearapp

import android.content.Context
import androidx.health.services.client.HealthServicesClient
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.ExerciseType
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService
import com.google.android.gms.wearable.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.util.*

// MARK: - Data Models

data class WearHabit(
    val id: String,
    val name: String,
    val icon: String,
    val color: String,
    val streak: Int,
    val completedToday: Boolean
)

data class WearGoal(
    val id: String,
    val title: String,
    val progress: Double,
    val target: Double,
    val dueDate: Date?
)

data class WearStatistics(
    val totalGoals: Int,
    val completedGoals: Int,
    val activeStreaks: Int,
    val longestStreak: Int
)

// MARK: - Android Wear Integration

class AndroidWearIntegration(private val context: Context) :
    DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener,
    CapabilityClient.OnCapabilityChangedListener {
    
    private val dataClient: DataClient = Wearable.getDataClient(context)
    private val messageClient: MessageClient = Wearable.getMessageClient(context)
    private val capabilityClient: CapabilityClient = Wearable.getCapabilityClient(context)
    private val nodeClient: NodeClient = Wearable.getNodeClient(context)
    
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    
    private val _habits = MutableStateFlow<List<WearHabit>>(emptyList())
    val habits: StateFlow<List<WearHabit>> = _habits
    
    private val _goals = MutableStateFlow<List<WearGoal>>(emptyList())
    val goals: StateFlow<List<WearGoal>> = _goals
    
    private val _statistics = MutableStateFlow<WearStatistics?>(null)
    val statistics: StateFlow<WearStatistics?> = _statistics
    
    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected
    
    companion object {
        private const val HABITS_PATH = "/habits"
        private const val GOALS_PATH = "/goals"
        private const val STATS_PATH = "/statistics"
        private const val ACTION_PATH = "/action"
        private const val CAPABILITY_WEAR_APP = "upcoach_wear_app"
        
        @Volatile
        private var instance: AndroidWearIntegration? = null
        
        fun getInstance(context: Context): AndroidWearIntegration {
            return instance ?: synchronized(this) {
                instance ?: AndroidWearIntegration(context.applicationContext).also {
                    instance = it
                }
            }
        }
    }
    
    // MARK: - Initialization
    
    fun initialize() {
        dataClient.addListener(this)
        messageClient.addListener(this)
        capabilityClient.addListener(
            this,
            Uri.parse("wear://"),
            CapabilityClient.FILTER_REACHABLE
        )
        
        checkConnection()
    }
    
    fun cleanup() {
        dataClient.removeListener(this)
        messageClient.removeListener(this)
        capabilityClient.removeListener(this)
        scope.cancel()
    }
    
    // MARK: - Connection Management
    
    private fun checkConnection() {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                _isConnected.value = nodes.isNotEmpty()
            } catch (e: Exception) {
                _isConnected.value = false
            }
        }
    }
    
    private suspend fun getConnectedNode(): Node? {
        return try {
            val nodes = nodeClient.connectedNodes.await()
            nodes.firstOrNull()
        } catch (e: Exception) {
            null
        }
    }
    
    // MARK: - Data Sync
    
    fun syncHabitsToWear(habits: List<WearHabit>) {
        scope.launch {
            try {
                val json = JSONArray().apply {
                    habits.forEach { habit ->
                        put(JSONObject().apply {
                            put("id", habit.id)
                            put("name", habit.name)
                            put("icon", habit.icon)
                            put("color", habit.color)
                            put("streak", habit.streak)
                            put("completedToday", habit.completedToday)
                        })
                    }
                }
                
                val putDataReq = PutDataMapRequest.create(HABITS_PATH).apply {
                    dataMap.putString("data", json.toString())
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest()
                    .setUrgent()
                
                dataClient.putDataItem(putDataReq).await()
                _habits.value = habits
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    fun syncGoalsToWear(goals: List<WearGoal>) {
        scope.launch {
            try {
                val json = JSONArray().apply {
                    goals.forEach { goal ->
                        put(JSONObject().apply {
                            put("id", goal.id)
                            put("title", goal.title)
                            put("progress", goal.progress)
                            put("target", goal.target)
                            goal.dueDate?.let { put("dueDate", it.time) }
                        })
                    }
                }
                
                val putDataReq = PutDataMapRequest.create(GOALS_PATH).apply {
                    dataMap.putString("data", json.toString())
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest()
                    .setUrgent()
                
                dataClient.putDataItem(putDataReq).await()
                _goals.value = goals
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    fun syncStatisticsToWear(stats: WearStatistics) {
        scope.launch {
            try {
                val json = JSONObject().apply {
                    put("totalGoals", stats.totalGoals)
                    put("completedGoals", stats.completedGoals)
                    put("activeStreaks", stats.activeStreaks)
                    put("longestStreak", stats.longestStreak)
                }
                
                val putDataReq = PutDataMapRequest.create(STATS_PATH).apply {
                    dataMap.putString("data", json.toString())
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest()
                    .setUrgent()
                
                dataClient.putDataItem(putDataReq).await()
                _statistics.value = stats
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    // MARK: - Message Handling
    
    fun sendMessage(path: String, data: ByteArray, callback: (Boolean) -> Unit) {
        scope.launch {
            try {
                val node = getConnectedNode()
                if (node != null) {
                    messageClient.sendMessage(node.id, path, data).await()
                    callback(true)
                } else {
                    callback(false)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                callback(false)
            }
        }
    }
    
    fun completeHabit(habitId: String, callback: (Boolean, Int?) -> Unit) {
        val json = JSONObject().apply {
            put("action", "complete_habit")
            put("habitId", habitId)
            put("timestamp", System.currentTimeMillis())
        }
        
        sendMessage(ACTION_PATH, json.toString().toByteArray()) { success ->
            if (success) {
                // Update local state
                val updatedHabits = _habits.value.map { habit ->
                    if (habit.id == habitId) {
                        habit.copy(completedToday = true, streak = habit.streak + 1)
                    } else {
                        habit
                    }
                }
                _habits.value = updatedHabits
                
                val newStreak = updatedHabits.find { it.id == habitId }?.streak
                callback(true, newStreak)
            } else {
                callback(false, null)
            }
        }
    }
    
    // MARK: - DataClient Listener
    
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            if (event.type == DataEvent.TYPE_CHANGED) {
                val item = event.dataItem
                when (item.uri.path) {
                    HABITS_PATH -> handleHabitsData(item)
                    GOALS_PATH -> handleGoalsData(item)
                    STATS_PATH -> handleStatisticsData(item)
                }
            }
        }
    }
    
    private fun handleHabitsData(item: DataItem) {
        val dataMap = DataMapItem.fromDataItem(item).dataMap
        val json = dataMap.getString("data")
        
        json?.let {
            try {
                val jsonArray = JSONArray(it)
                val habits = mutableListOf<WearHabit>()
                
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    habits.add(
                        WearHabit(
                            id = obj.getString("id"),
                            name = obj.getString("name"),
                            icon = obj.getString("icon"),
                            color = obj.getString("color"),
                            streak = obj.getInt("streak"),
                            completedToday = obj.getBoolean("completedToday")
                        )
                    )
                }
                
                _habits.value = habits
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun handleGoalsData(item: DataItem) {
        val dataMap = DataMapItem.fromDataItem(item).dataMap
        val json = dataMap.getString("data")
        
        json?.let {
            try {
                val jsonArray = JSONArray(it)
                val goals = mutableListOf<WearGoal>()
                
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    goals.add(
                        WearGoal(
                            id = obj.getString("id"),
                            title = obj.getString("title"),
                            progress = obj.getDouble("progress"),
                            target = obj.getDouble("target"),
                            dueDate = if (obj.has("dueDate")) Date(obj.getLong("dueDate")) else null
                        )
                    )
                }
                
                _goals.value = goals
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    private fun handleStatisticsData(item: DataItem) {
        val dataMap = DataMapItem.fromDataItem(item).dataMap
        val json = dataMap.getString("data")
        
        json?.let {
            try {
                val obj = JSONObject(it)
                _statistics.value = WearStatistics(
                    totalGoals = obj.getInt("totalGoals"),
                    completedGoals = obj.getInt("completedGoals"),
                    activeStreaks = obj.getInt("activeStreaks"),
                    longestStreak = obj.getInt("longestStreak")
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
    
    // MARK: - MessageClient Listener
    
    override fun onMessageReceived(messageEvent: MessageEvent) {
        when (messageEvent.path) {
            ACTION_PATH -> handleActionMessage(messageEvent.data)
            "/sync_request" -> handleSyncRequest()
        }
    }
    
    private fun handleActionMessage(data: ByteArray) {
        try {
            val json = JSONObject(String(data))
            val action = json.getString("action")
            
            when (action) {
                "complete_habit" -> {
                    val habitId = json.getString("habitId")
                    completeHabit(habitId) { success, streak ->
                        // Send response back
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun handleSyncRequest() {
        // Re-sync all data
        scope.launch {
            // Trigger full sync
        }
    }
    
    // MARK: - CapabilityClient Listener
    
    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        checkConnection()
    }
}

// MARK: - Wear Tile Service

class UpCoachTileService : TileService() {
    private lateinit var wearIntegration: AndroidWearIntegration
    
    override fun onCreate() {
        super.onCreate()
        wearIntegration = AndroidWearIntegration.getInstance(this)
    }
    
    // Tile layout and data would be implemented here
}

// MARK: - Complication Data Source

class UpCoachComplicationService : ComplicationDataSourceService() {
    private lateinit var wearIntegration: AndroidWearIntegration
    
    override fun onCreate() {
        super.onCreate()
        wearIntegration = AndroidWearIntegration.getInstance(this)
    }
    
    // Complication data would be provided here
}

// MARK: - Health Services Integration

class HealthServicesIntegration(private val context: Context) {
    private val healthServicesClient: HealthServicesClient by lazy {
        HealthServicesClient.getClient(context)
    }
    
    suspend fun startExercise(exerciseType: ExerciseType) {
        try {
            val exerciseClient = healthServicesClient.exerciseClient
            // Start exercise tracking
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    suspend fun getTodaysSteps(): Long {
        return try {
            // Fetch today's step count from Health Services
            0L
        } catch (e: Exception) {
            e.printStackTrace()
            0L
        }
    }
    
    suspend fun getHeartRate(): Double {
        return try {
            // Fetch current heart rate
            0.0
        } catch (e: Exception) {
            e.printStackTrace()
            0.0
        }
    }
}

// MARK: - Voice Actions Support

class VoiceActionsHandler(private val context: Context) {
    fun handleVoiceAction(action: String, parameters: Map<String, String>) {
        when (action) {
            "complete_habit" -> {
                val habitName = parameters["habit_name"]
                // Handle voice action
            }
            "view_progress" -> {
                // Show progress screen
            }
        }
    }
}
