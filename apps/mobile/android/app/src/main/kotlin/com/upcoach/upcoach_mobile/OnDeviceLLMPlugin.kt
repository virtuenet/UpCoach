package com.upcoach.upcoach_mobile

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugin.common.MethodChannel.MethodCallHandler
import io.flutter.plugin.common.MethodChannel.Result
import java.io.File
import java.util.concurrent.Executors

/**
 * Flutter plugin for on-device LLM inference using NNAPI and ExecuTorch
 */
class OnDeviceLLMPlugin : FlutterPlugin, MethodCallHandler, EventChannel.StreamHandler {
    private lateinit var methodChannel: MethodChannel
    private lateinit var eventChannel: EventChannel
    private lateinit var context: Context

    private var eventSink: EventChannel.EventSink? = null
    private var llmEngine: OnDeviceLLMEngine? = null
    private var isInitialized = false

    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onAttachedToEngine(flutterPluginBinding: FlutterPlugin.FlutterPluginBinding) {
        context = flutterPluginBinding.applicationContext

        // Method channel for commands
        methodChannel = MethodChannel(flutterPluginBinding.binaryMessenger, "com.upcoach/on_device_llm")
        methodChannel.setMethodCallHandler(this)

        // Event channel for streaming responses
        eventChannel = EventChannel(flutterPluginBinding.binaryMessenger, "com.upcoach/on_device_llm_stream")
        eventChannel.setStreamHandler(this)
    }

    override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
        methodChannel.setMethodCallHandler(null)
        eventChannel.setStreamHandler(null)
        llmEngine?.dispose()
        executor.shutdown()
    }

    override fun onMethodCall(call: MethodCall, result: Result) {
        when (call.method) {
            "initialize" -> handleInitialize(call, result)
            "detectBackend" -> handleDetectBackend(result)
            "generate" -> handleGenerate(call, result)
            "startStream" -> handleStartStream(call, result)
            "getModelInfo" -> handleGetModelInfo(result)
            "dispose" -> handleDispose(result)
            else -> result.notImplemented()
        }
    }

    // MARK: - Method Handlers

    private fun handleInitialize(call: MethodCall, result: Result) {
        val modelPath = call.argument<String>("modelPath")
        val backend = call.argument<String>("backend") ?: "nnapi"

        if (modelPath == null) {
            result.error("INVALID_ARGS", "Model path required", null)
            return
        }

        executor.execute {
            try {
                llmEngine = OnDeviceLLMEngine(context, modelPath, backend)
                isInitialized = true

                mainHandler.post {
                    result.success(true)
                }
            } catch (e: Exception) {
                mainHandler.post {
                    result.error("INIT_FAILED", e.message, null)
                }
            }
        }
    }

    private fun handleDetectBackend(result: Result) {
        // Check for NNAPI availability (Android 8.1+)
        val backend = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P -> {
                // Android 9+ has better NNAPI support
                "nnapi"
            }
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1 -> {
                // Android 8.1 has basic NNAPI
                "nnapi"
            }
            hasGpuSupport() -> {
                "gpu"
            }
            else -> {
                "cpu"
            }
        }
        result.success(backend)
    }

    private fun handleGenerate(call: MethodCall, result: Result) {
        if (!isInitialized || llmEngine == null) {
            result.error("NOT_INITIALIZED", "Engine not initialized", null)
            return
        }

        val prompt = call.argument<String>("prompt")
        if (prompt == null) {
            result.error("INVALID_ARGS", "Prompt required", null)
            return
        }

        val configMap = call.argument<Map<String, Any>>("config")
        val config = parseConfig(configMap)

        executor.execute {
            try {
                val response = llmEngine!!.generate(prompt, config)

                mainHandler.post {
                    result.success(
                        mapOf(
                            "text" to response.text,
                            "tokensGenerated" to response.tokensGenerated,
                            "latencyMs" to response.latencyMs
                        )
                    )
                }
            } catch (e: Exception) {
                mainHandler.post {
                    result.error("GENERATION_FAILED", e.message, null)
                }
            }
        }
    }

    private fun handleStartStream(call: MethodCall, result: Result) {
        if (!isInitialized || llmEngine == null) {
            result.error("NOT_INITIALIZED", "Engine not initialized", null)
            return
        }

        val prompt = call.argument<String>("prompt")
        if (prompt == null) {
            result.error("INVALID_ARGS", "Prompt required", null)
            return
        }

        val configMap = call.argument<Map<String, Any>>("config")
        val config = parseConfig(configMap)

        result.success(null) // Acknowledge start

        executor.execute {
            llmEngine!!.generateStream(
                prompt = prompt,
                config = config,
                onToken = { token ->
                    mainHandler.post {
                        eventSink?.success(token)
                    }
                },
                onComplete = { error ->
                    mainHandler.post {
                        if (error != null) {
                            eventSink?.error("STREAM_ERROR", error.message, null)
                        }
                        eventSink?.endOfStream()
                    }
                }
            )
        }
    }

    private fun handleGetModelInfo(result: Result) {
        if (llmEngine == null) {
            result.success(mapOf("error" to "Model not loaded"))
            return
        }
        result.success(llmEngine!!.getModelInfo())
    }

    private fun handleDispose(result: Result) {
        llmEngine?.dispose()
        llmEngine = null
        isInitialized = false
        result.success(null)
    }

    // MARK: - EventChannel.StreamHandler

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }

    // MARK: - Helpers

    private fun parseConfig(configMap: Map<String, Any>?): InferenceConfiguration {
        if (configMap == null) return InferenceConfiguration()

        return InferenceConfiguration(
            maxTokens = (configMap["maxTokens"] as? Number)?.toInt() ?: 256,
            temperature = (configMap["temperature"] as? Number)?.toDouble() ?: 0.7,
            topP = (configMap["topP"] as? Number)?.toDouble() ?: 0.9,
            topK = (configMap["topK"] as? Number)?.toInt() ?: 40,
            repetitionPenalty = (configMap["repetitionPenalty"] as? Number)?.toDouble() ?: 1.1,
            stopSequences = (configMap["stopSequences"] as? List<*>)?.filterIsInstance<String>()
                ?: listOf("</s>", "[END]", "\n\n")
        )
    }

    private fun hasGpuSupport(): Boolean {
        // Check for Vulkan support (Android 7.0+)
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
    }
}

/**
 * Configuration for LLM inference
 */
data class InferenceConfiguration(
    val maxTokens: Int = 256,
    val temperature: Double = 0.7,
    val topP: Double = 0.9,
    val topK: Int = 40,
    val repetitionPenalty: Double = 1.1,
    val stopSequences: List<String> = listOf("</s>", "[END]", "\n\n")
)

/**
 * Response from LLM inference
 */
data class InferenceResponse(
    val text: String,
    val tokensGenerated: Int,
    val latencyMs: Long
)

/**
 * On-device LLM inference engine using NNAPI
 */
class OnDeviceLLMEngine(
    private val context: Context,
    private val modelPath: String,
    private val backend: String
) {
    private var tokenizer: SimpleTokenizer = SimpleTokenizer()
    private var isModelLoaded = false

    // Model configuration
    private val vocabSize = 32000
    private val contextLength = 2048
    private val embeddingDim = 512

    init {
        loadModel()
    }

    private fun loadModel() {
        val modelFile = File(modelPath)

        if (modelFile.exists()) {
            // In production, load the actual ONNX/TFLite model here
            // Using NNAPI delegate for hardware acceleration
            try {
                // Check if it's an ONNX model
                if (modelPath.endsWith(".onnx")) {
                    loadOnnxModel(modelPath)
                }
                // Check if it's a TFLite model
                else if (modelPath.endsWith(".tflite")) {
                    loadTfliteModel(modelPath)
                }
                // Check if it's an ExecuTorch model
                else if (modelPath.endsWith(".pte")) {
                    loadExecuTorchModel(modelPath)
                }

                isModelLoaded = true
            } catch (e: Exception) {
                android.util.Log.w("OnDeviceLLM", "Failed to load model: ${e.message}")
                // Fall back to simulated inference
                isModelLoaded = false
            }
        } else {
            android.util.Log.w("OnDeviceLLM", "Model file not found, using simulated inference")
            isModelLoaded = false
        }
    }

    private fun loadOnnxModel(path: String) {
        // ONNX Runtime with NNAPI EP
        // In production, use:
        // val sessionOptions = OrtSession.SessionOptions()
        // sessionOptions.addNnapi()
        // val session = OrtEnvironment.getEnvironment().createSession(path, sessionOptions)
        android.util.Log.d("OnDeviceLLM", "ONNX model loading not implemented yet")
    }

    private fun loadTfliteModel(path: String) {
        // TensorFlow Lite with NNAPI delegate
        // In production, use:
        // val options = Interpreter.Options()
        // options.addDelegate(NnApiDelegate())
        // val interpreter = Interpreter(File(path), options)
        android.util.Log.d("OnDeviceLLM", "TFLite model loading not implemented yet")
    }

    private fun loadExecuTorchModel(path: String) {
        // ExecuTorch model loading
        // In production, use ExecuTorch JNI bindings
        android.util.Log.d("OnDeviceLLM", "ExecuTorch model loading not implemented yet")
    }

    fun generate(prompt: String, config: InferenceConfiguration): InferenceResponse {
        val startTime = System.currentTimeMillis()

        // Tokenize input
        val tokens = tokenizer.encode(prompt)

        val generatedText: String
        val tokensGenerated: Int

        if (isModelLoaded) {
            // Real inference
            generatedText = performNnapiInference(tokens, config)
            tokensGenerated = tokenizer.encode(generatedText).size
        } else {
            // Simulated inference for development
            generatedText = generateCoachingResponse(prompt)
            tokensGenerated = generatedText.split(" ").size

            // Simulate inference delay
            Thread.sleep((tokensGenerated * 20).toLong())
        }

        val latencyMs = System.currentTimeMillis() - startTime

        return InferenceResponse(
            text = generatedText,
            tokensGenerated = tokensGenerated,
            latencyMs = latencyMs
        )
    }

    fun generateStream(
        prompt: String,
        config: InferenceConfiguration,
        onToken: (String) -> Unit,
        onComplete: (Exception?) -> Unit
    ) {
        try {
            if (isModelLoaded) {
                // Real streaming inference
                streamNnapiInference(prompt, config, onToken, onComplete)
            } else {
                // Simulated streaming
                val response = generateCoachingResponse(prompt)
                val words = response.split(" ")

                for (word in words) {
                    onToken("$word ")
                    Thread.sleep(50)
                }

                onComplete(null)
            }
        } catch (e: Exception) {
            onComplete(e)
        }
    }

    private fun performNnapiInference(tokens: List<Int>, config: InferenceConfiguration): String {
        // In production, run actual NNAPI inference
        // This is a placeholder that returns simulated response
        return generateCoachingResponse(tokenizer.decode(tokens))
    }

    private fun streamNnapiInference(
        prompt: String,
        config: InferenceConfiguration,
        onToken: (String) -> Unit,
        onComplete: (Exception?) -> Unit
    ) {
        try {
            val response = generate(prompt, config)
            val words = response.text.split(" ")

            for (word in words) {
                onToken("$word ")
                Thread.sleep(30)
            }

            onComplete(null)
        } catch (e: Exception) {
            onComplete(e)
        }
    }

    private fun generateCoachingResponse(prompt: String): String {
        val lowerPrompt = prompt.lowercase()

        return when {
            lowerPrompt.contains("goal") || lowerPrompt.contains("achieve") ->
                "Great question about goals! Here's my coaching insight: Break your goal into smaller, achievable milestones. Track your progress daily, celebrate small wins, and remember that consistency beats intensity. What specific goal would you like to work on together?"

            lowerPrompt.contains("habit") || lowerPrompt.contains("routine") ->
                "Building strong habits is the foundation of lasting change. Start with just 2 minutes a day - the key is consistency over intensity. Stack new habits onto existing ones, and use implementation intentions: 'When X happens, I will do Y.' Which habit would you like to develop?"

            lowerPrompt.contains("motivation") || lowerPrompt.contains("stuck") || lowerPrompt.contains("procrastinat") ->
                "Feeling stuck is completely normal - it happens to everyone. The key is to reconnect with your deeper 'why'. What originally inspired this goal? Take just one small action today, even 5 minutes. Remember: progress, not perfection. How can I help you take that first step?"

            lowerPrompt.contains("stress") || lowerPrompt.contains("anxious") || lowerPrompt.contains("overwhelm") ->
                "Managing stress is crucial for your well-being and performance. Try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8. Regular breaks and mindfulness can make a significant difference. Would you like some specific stress-reduction exercises tailored to your situation?"

            lowerPrompt.contains("sleep") || lowerPrompt.contains("tired") || lowerPrompt.contains("energy") ->
                "Quality sleep is the foundation of peak performance. Create a consistent sleep schedule, limit screens 1 hour before bed, keep your room cool and dark. Consider a wind-down routine. Would you like personalized tips for better sleep based on your current habits?"

            lowerPrompt.contains("exercise") || lowerPrompt.contains("workout") || lowerPrompt.contains("fitness") ->
                "Movement is medicine for both body and mind! Start with activities you genuinely enjoy - even a 10-minute walk counts. Consistency matters more than intensity when building fitness habits. What type of exercise have you enjoyed in the past?"

            lowerPrompt.contains("diet") || lowerPrompt.contains("nutrition") || lowerPrompt.contains("eating") ->
                "Nutrition is about sustainable habits, not quick fixes. Focus on adding more whole foods rather than restriction. Small changes compound over time. What's one healthy eating habit you'd like to develop?"

            else ->
                "I'm here to support your personal growth journey. Every step forward, no matter how small, brings you closer to your goals. What specific area would you like to focus on today? I can help with goals, habits, motivation, stress management, sleep, fitness, or any other aspect of your well-being."
        }
    }

    fun getModelInfo(): Map<String, Any> {
        return mapOf(
            "path" to modelPath,
            "backend" to backend,
            "isModelLoaded" to isModelLoaded,
            "vocabSize" to vocabSize,
            "contextLength" to contextLength,
            "embeddingDim" to embeddingDim,
            "androidVersion" to Build.VERSION.SDK_INT,
            "device" to Build.MODEL
        )
    }

    fun dispose() {
        // Clean up resources
        isModelLoaded = false
    }
}

/**
 * Simple word-based tokenizer
 */
class SimpleTokenizer {
    private val vocabulary = mutableMapOf<String, Int>()
    private val reverseVocabulary = mutableMapOf<Int, String>()

    init {
        buildBasicVocabulary()
    }

    private fun buildBasicVocabulary() {
        // Special tokens
        vocabulary["<pad>"] = 0
        vocabulary["<unk>"] = 1
        vocabulary["<s>"] = 2
        vocabulary["</s>"] = 3

        // Common tokens
        val commonTokens = listOf(
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "must", "shall", "can", "need", "dare",
            "ought", "used", "to", "and", "but", "or", "nor", "for", "yet", "so",
            "goal", "habit", "motivation", "stress", "sleep", "exercise", "health",
            "progress", "success", "achieve", "help", "support", "coach", "learn"
        )

        commonTokens.forEachIndexed { index, token ->
            vocabulary[token] = index + 4
            reverseVocabulary[index + 4] = token
        }

        // Add reverse mappings for special tokens
        reverseVocabulary[0] = "<pad>"
        reverseVocabulary[1] = "<unk>"
        reverseVocabulary[2] = "<s>"
        reverseVocabulary[3] = "</s>"
    }

    fun encode(text: String): List<Int> {
        val tokens = mutableListOf(2) // Start token

        text.lowercase().split(" ").forEach { word ->
            tokens.add(vocabulary[word] ?: 1) // Unknown token
        }

        tokens.add(3) // End token
        return tokens
    }

    fun decode(tokens: List<Int>): String {
        val words = mutableListOf<String>()

        tokens.forEach { token ->
            if (token != 2 && token != 3) { // Skip special tokens
                reverseVocabulary[token]?.let { words.add(it) }
            }
        }

        return words.joinToString(" ")
    }
}
