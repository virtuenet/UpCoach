package com.upcoach.upcoach_mobile

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Register On-Device LLM Plugin
        flutterEngine.plugins.add(OnDeviceLLMPlugin())
    }
}
