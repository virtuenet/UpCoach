package com.upcoach.upcoach_mobile

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.*
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import kotlinx.coroutines.*
import org.json.JSONObject
import java.nio.charset.Charset

/**
 * Flutter plugin for Wear OS Data Layer communication
 * Enables data sync and messaging between phone and Wear OS watch
 */
class WearDataLayerPlugin : FlutterPlugin, MethodChannel.MethodCallHandler,
    EventChannel.StreamHandler, DataClient.OnDataChangedListener,
    MessageClient.OnMessageReceivedListener, CapabilityClient.OnCapabilityChangedListener {

    companion object {
        private const val TAG = "WearDataLayerPlugin"
        private const val METHOD_CHANNEL = "com.upcoach/watch_connectivity"
        private const val EVENT_CHANNEL = "com.upcoach/watch_events"

        // Data Layer paths
        private const val COMPANION_DATA_PATH = "/companion_data"
        private const val MESSAGE_PATH = "/message"

        // Capability for discovering Wear OS app
        private const val WEAR_CAPABILITY = "upcoach_wear"
    }

    private lateinit var context: Context
    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel
    private var eventSink: EventChannel.EventSink? = null

    private lateinit var dataClient: DataClient
    private lateinit var messageClient: MessageClient
    private lateinit var capabilityClient: CapabilityClient
    private lateinit var nodeClient: NodeClient

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var connectedNodes: Set<Node> = emptySet()

    override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        context = binding.applicationContext

        // Initialize method channel
        methodChannel = MethodChannel(binding.binaryMessenger, METHOD_CHANNEL)
        methodChannel.setMethodCallHandler(this)

        // Initialize event channel
        eventChannel = EventChannel(binding.binaryMessenger, EVENT_CHANNEL)
        eventChannel.setStreamHandler(this)

        // Initialize Wearable clients
        initializeWearableClients()
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
        eventChannel.setStreamHandler(null)
        scope.cancel()

        // Remove listeners
        dataClient.removeListener(this)
        messageClient.removeListener(this)
        capabilityClient.removeListener(this, WEAR_CAPABILITY)
    }

    private fun initializeWearableClients() {
        dataClient = Wearable.getDataClient(context)
        messageClient = Wearable.getMessageClient(context)
        capabilityClient = Wearable.getCapabilityClient(context)
        nodeClient = Wearable.getNodeClient(context)

        // Add listeners
        dataClient.addListener(this)
        messageClient.addListener(this)
        capabilityClient.addListener(this, WEAR_CAPABILITY)

        // Initial capability check
        checkConnectedNodes()
    }

    private fun checkConnectedNodes() {
        scope.launch {
            try {
                val capabilityInfo = capabilityClient.getCapability(
                    WEAR_CAPABILITY,
                    CapabilityClient.FILTER_REACHABLE
                ).await()
                updateConnectedNodes(capabilityInfo)
            } catch (e: Exception) {
                Log.e(TAG, "Error checking connected nodes", e)
            }
        }
    }

    private fun updateConnectedNodes(capabilityInfo: CapabilityInfo) {
        connectedNodes = capabilityInfo.nodes
        val isConnected = connectedNodes.isNotEmpty()

        scope.launch(Dispatchers.Main) {
            eventSink?.success(if (isConnected) "connection:connected" else "connection:disconnected")
        }
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "activateSession" -> activateSession(result)
            "isWatchAppInstalled" -> isWatchAppInstalled(result)
            "isReachable" -> isReachable(result)
            "sendMessage" -> {
                val message = call.argument<String>("message")
                if (message != null) {
                    sendMessage(message, result)
                } else {
                    result.error("INVALID_ARGS", "Message is required", null)
                }
            }
            "syncData" -> {
                val data = call.argument<String>("data")
                if (data != null) {
                    syncData(data, result)
                } else {
                    result.error("INVALID_ARGS", "Data is required", null)
                }
            }
            "updateApplicationContext" -> {
                val contextData = call.argument<String>("context")
                if (contextData != null) {
                    updateApplicationContext(contextData, result)
                } else {
                    result.error("INVALID_ARGS", "Context is required", null)
                }
            }
            "getApplicationContext" -> getApplicationContext(result)
            "getPairedWatch" -> getPairedWatch(result)
            "getConnectedDevices" -> getConnectedDevices(result)
            else -> result.notImplemented()
        }
    }

    private fun activateSession(result: MethodChannel.Result) {
        checkConnectedNodes()
        result.success(true)
    }

    private fun isWatchAppInstalled(result: MethodChannel.Result) {
        scope.launch {
            try {
                val capabilityInfo = capabilityClient.getCapability(
                    WEAR_CAPABILITY,
                    CapabilityClient.FILTER_ALL
                ).await()
                result.success(capabilityInfo.nodes.isNotEmpty())
            } catch (e: Exception) {
                Log.e(TAG, "Error checking watch app", e)
                result.success(false)
            }
        }
    }

    private fun isReachable(result: MethodChannel.Result) {
        result.success(connectedNodes.isNotEmpty())
    }

    private fun sendMessage(message: String, result: MethodChannel.Result) {
        scope.launch {
            try {
                val node = connectedNodes.firstOrNull()
                if (node == null) {
                    result.error("NOT_REACHABLE", "No connected Wear OS device", null)
                    return@launch
                }

                messageClient.sendMessage(
                    node.id,
                    MESSAGE_PATH,
                    message.toByteArray(Charset.forName("UTF-8"))
                ).await()

                result.success(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error sending message", e)
                result.error("SEND_ERROR", e.message, null)
            }
        }
    }

    private fun syncData(data: String, result: MethodChannel.Result) {
        scope.launch {
            try {
                // Store in SharedPreferences for widget access
                val prefs = context.getSharedPreferences("companion_data", Context.MODE_PRIVATE)
                prefs.edit()
                    .putString("companion_data", data)
                    .putLong("companion_last_sync", System.currentTimeMillis())
                    .apply()

                // Sync to Wear OS via Data Layer
                val putDataRequest = PutDataMapRequest.create(COMPANION_DATA_PATH).apply {
                    dataMap.putString("data", data)
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest().setUrgent()

                dataClient.putDataItem(putDataRequest).await()

                result.success(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error syncing data", e)
                // Still return success if SharedPreferences was updated
                result.success(true)
            }
        }
    }

    private fun updateApplicationContext(contextData: String, result: MethodChannel.Result) {
        scope.launch {
            try {
                val putDataRequest = PutDataMapRequest.create(COMPANION_DATA_PATH).apply {
                    dataMap.putString("context", contextData)
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest().setUrgent()

                dataClient.putDataItem(putDataRequest).await()
                result.success(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error updating context", e)
                result.error("UPDATE_ERROR", e.message, null)
            }
        }
    }

    private fun getApplicationContext(result: MethodChannel.Result) {
        scope.launch {
            try {
                val dataItems = dataClient.getDataItems().await()
                for (item in dataItems) {
                    if (item.uri.path == COMPANION_DATA_PATH) {
                        val dataMap = DataMapItem.fromDataItem(item).dataMap
                        val context = dataMap.getString("context")
                        dataItems.release()
                        result.success(context)
                        return@launch
                    }
                }
                dataItems.release()
                result.success(null)
            } catch (e: Exception) {
                Log.e(TAG, "Error getting context", e)
                result.success(null)
            }
        }
    }

    private fun getPairedWatch(result: MethodChannel.Result) {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                if (nodes.isNotEmpty()) {
                    val node = nodes.first()
                    result.success(mapOf(
                        "name" to node.displayName,
                        "model" to "Wear OS",
                        "osVersion" to "Unknown",
                        "isWatchAppInstalled" to connectedNodes.any { it.id == node.id }
                    ))
                } else {
                    result.success(null)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting paired watch", e)
                result.success(null)
            }
        }
    }

    private fun getConnectedDevices(result: MethodChannel.Result) {
        scope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                val devices = nodes.map { node ->
                    mapOf(
                        "id" to node.id,
                        "type" to "wearOS",
                        "name" to node.displayName,
                        "isReachable" to connectedNodes.any { it.id == node.id },
                        "osVersion" to ""
                    )
                }
                result.success(devices)
            } catch (e: Exception) {
                Log.e(TAG, "Error getting connected devices", e)
                result.success(emptyList<Map<String, Any>>())
            }
        }
    }

    // DataClient.OnDataChangedListener
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED) {
                val dataItem = event.dataItem
                if (dataItem.uri.path == COMPANION_DATA_PATH) {
                    val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
                    val data = dataMap.getString("data")
                    if (data != null) {
                        scope.launch(Dispatchers.Main) {
                            eventSink?.success(data)
                        }
                    }
                }
            }
        }
    }

    // MessageClient.OnMessageReceivedListener
    override fun onMessageReceived(messageEvent: MessageEvent) {
        val message = String(messageEvent.data, Charset.forName("UTF-8"))
        scope.launch(Dispatchers.Main) {
            eventSink?.success(message)
        }
    }

    // CapabilityClient.OnCapabilityChangedListener
    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        updateConnectedNodes(capabilityInfo)
    }

    // EventChannel.StreamHandler
    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }
}
