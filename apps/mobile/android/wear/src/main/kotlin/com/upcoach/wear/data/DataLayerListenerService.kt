package com.upcoach.wear.data

import android.util.Log
import com.google.android.gms.wearable.*

/**
 * Service that listens for data changes and messages from the phone app
 */
class DataLayerListenerService : WearableListenerService() {

    companion object {
        private const val TAG = "DataLayerListener"
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d(TAG, "onDataChanged: ${dataEvents.count} events")

        val dataLayerService = DataLayerService.getInstance(this)

        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED) {
                dataLayerService.handleDataChanged(event.dataItem)
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d(TAG, "onMessageReceived: ${messageEvent.path}")

        val dataLayerService = DataLayerService.getInstance(this)
        dataLayerService.handleMessageReceived(messageEvent)
    }

    override fun onCapabilityChanged(capabilityInfo: CapabilityInfo) {
        Log.d(TAG, "onCapabilityChanged: ${capabilityInfo.name}")

        val dataLayerService = DataLayerService.getInstance(this)
        dataLayerService.checkConnection()
    }
}
