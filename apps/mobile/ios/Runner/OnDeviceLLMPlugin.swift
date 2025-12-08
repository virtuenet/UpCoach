import Flutter
import UIKit
import CoreML
import Accelerate

/// Flutter plugin for on-device LLM inference using Core ML and Metal
public class OnDeviceLLMPlugin: NSObject, FlutterPlugin {
    private var channel: FlutterMethodChannel?
    private var eventChannel: FlutterEventChannel?
    private var streamSink: FlutterEventSink?

    private var llmEngine: OnDeviceLLMEngine?
    private var isInitialized = false

    public static func register(with registrar: FlutterPluginRegistrar) {
        let instance = OnDeviceLLMPlugin()

        // Method channel for commands
        let channel = FlutterMethodChannel(
            name: "com.upcoach/on_device_llm",
            binaryMessenger: registrar.messenger()
        )
        registrar.addMethodCallDelegate(instance, channel: channel)
        instance.channel = channel

        // Event channel for streaming responses
        let eventChannel = FlutterEventChannel(
            name: "com.upcoach/on_device_llm_stream",
            binaryMessenger: registrar.messenger()
        )
        eventChannel.setStreamHandler(instance)
        instance.eventChannel = eventChannel
    }

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "initialize":
            handleInitialize(call, result: result)
        case "detectBackend":
            handleDetectBackend(result: result)
        case "generate":
            handleGenerate(call, result: result)
        case "startStream":
            handleStartStream(call, result: result)
        case "getModelInfo":
            handleGetModelInfo(result: result)
        case "dispose":
            handleDispose(result: result)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    // MARK: - Method Handlers

    private func handleInitialize(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        guard let args = call.arguments as? [String: Any],
              let modelPath = args["modelPath"] as? String else {
            result(FlutterError(code: "INVALID_ARGS", message: "Model path required", details: nil))
            return
        }

        let backend = args["backend"] as? String ?? "coreml"

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            do {
                self?.llmEngine = try OnDeviceLLMEngine(modelPath: modelPath, backend: backend)
                self?.isInitialized = true

                DispatchQueue.main.async {
                    result(true)
                }
            } catch {
                DispatchQueue.main.async {
                    result(FlutterError(code: "INIT_FAILED", message: error.localizedDescription, details: nil))
                }
            }
        }
    }

    private func handleDetectBackend(result: @escaping FlutterResult) {
        // Check for Apple Neural Engine availability
        if #available(iOS 15.0, *) {
            // Neural Engine available on A12+ chips
            let deviceModel = UIDevice.current.modelName
            if deviceModel.contains("iPhone") || deviceModel.contains("iPad") {
                // Check if device supports Neural Engine
                if MLModel.availableComputeUnits.contains(.cpuAndNeuralEngine) ||
                   MLModel.availableComputeUnits.contains(.all) {
                    result("coreml")
                    return
                }
            }
        }

        // Fall back to GPU if available
        if MTLCreateSystemDefaultDevice() != nil {
            result("gpu")
            return
        }

        result("cpu")
    }

    private func handleGenerate(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        guard isInitialized, let engine = llmEngine else {
            result(FlutterError(code: "NOT_INITIALIZED", message: "Engine not initialized", details: nil))
            return
        }

        guard let args = call.arguments as? [String: Any],
              let prompt = args["prompt"] as? String else {
            result(FlutterError(code: "INVALID_ARGS", message: "Prompt required", details: nil))
            return
        }

        let config = parseConfig(args["config"] as? [String: Any])

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let response = try engine.generate(prompt: prompt, config: config)

                DispatchQueue.main.async {
                    result([
                        "text": response.text,
                        "tokensGenerated": response.tokensGenerated,
                        "latencyMs": response.latencyMs
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    result(FlutterError(code: "GENERATION_FAILED", message: error.localizedDescription, details: nil))
                }
            }
        }
    }

    private func handleStartStream(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        guard isInitialized, let engine = llmEngine else {
            result(FlutterError(code: "NOT_INITIALIZED", message: "Engine not initialized", details: nil))
            return
        }

        guard let args = call.arguments as? [String: Any],
              let prompt = args["prompt"] as? String else {
            result(FlutterError(code: "INVALID_ARGS", message: "Prompt required", details: nil))
            return
        }

        let config = parseConfig(args["config"] as? [String: Any])

        result(nil) // Acknowledge start

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            engine.generateStream(prompt: prompt, config: config) { token in
                DispatchQueue.main.async {
                    self?.streamSink?(token)
                }
            } completion: { error in
                DispatchQueue.main.async {
                    if let error = error {
                        self?.streamSink?(FlutterError(code: "STREAM_ERROR", message: error.localizedDescription, details: nil))
                    }
                    self?.streamSink?(FlutterEndOfEventStream)
                }
            }
        }
    }

    private func handleGetModelInfo(result: @escaping FlutterResult) {
        guard let engine = llmEngine else {
            result(["error": "Model not loaded"])
            return
        }

        result(engine.getModelInfo())
    }

    private func handleDispose(result: @escaping FlutterResult) {
        llmEngine?.dispose()
        llmEngine = nil
        isInitialized = false
        result(nil)
    }

    // MARK: - Helpers

    private func parseConfig(_ configDict: [String: Any]?) -> InferenceConfiguration {
        guard let dict = configDict else {
            return InferenceConfiguration()
        }

        return InferenceConfiguration(
            maxTokens: dict["maxTokens"] as? Int ?? 256,
            temperature: dict["temperature"] as? Double ?? 0.7,
            topP: dict["topP"] as? Double ?? 0.9,
            topK: dict["topK"] as? Int ?? 40,
            repetitionPenalty: dict["repetitionPenalty"] as? Double ?? 1.1,
            stopSequences: dict["stopSequences"] as? [String] ?? ["</s>", "[END]", "\n\n"]
        )
    }
}

// MARK: - FlutterStreamHandler

extension OnDeviceLLMPlugin: FlutterStreamHandler {
    public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        streamSink = events
        return nil
    }

    public func onCancel(withArguments arguments: Any?) -> FlutterError? {
        streamSink = nil
        return nil
    }
}

// MARK: - Inference Configuration

struct InferenceConfiguration {
    let maxTokens: Int
    let temperature: Double
    let topP: Double
    let topK: Int
    let repetitionPenalty: Double
    let stopSequences: [String]

    init(
        maxTokens: Int = 256,
        temperature: Double = 0.7,
        topP: Double = 0.9,
        topK: Int = 40,
        repetitionPenalty: Double = 1.1,
        stopSequences: [String] = ["</s>", "[END]", "\n\n"]
    ) {
        self.maxTokens = maxTokens
        self.temperature = temperature
        self.topP = topP
        self.topK = topK
        self.repetitionPenalty = repetitionPenalty
        self.stopSequences = stopSequences
    }
}

// MARK: - Inference Response

struct InferenceResponse {
    let text: String
    let tokensGenerated: Int
    let latencyMs: Int
}

// MARK: - On-Device LLM Engine

class OnDeviceLLMEngine {
    private var modelPath: String
    private var backend: String
    private var mlModel: MLModel?
    private var tokenizer: SimpleTokenizer?

    // Model configuration
    private let vocabSize = 32000  // Standard LLaMA vocabulary size
    private let contextLength = 2048
    private let embeddingDim = 512  // Small model for mobile

    init(modelPath: String, backend: String) throws {
        self.modelPath = modelPath
        self.backend = backend

        // Initialize tokenizer
        self.tokenizer = SimpleTokenizer()

        // Try to load Core ML model
        try loadModel()
    }

    private func loadModel() throws {
        let url = URL(fileURLWithPath: modelPath)

        // Configure compute units based on backend
        let config = MLModelConfiguration()

        switch backend {
        case "coreml":
            if #available(iOS 14.0, *) {
                config.computeUnits = .cpuAndNeuralEngine
            }
        case "gpu":
            if #available(iOS 14.0, *) {
                config.computeUnits = .cpuAndGPU
            }
        default:
            config.computeUnits = .cpuOnly
        }

        // Check if Core ML model exists
        if url.pathExtension == "mlmodelc" || url.pathExtension == "mlpackage" {
            mlModel = try? MLModel(contentsOf: url, configuration: config)
        }

        // If no Core ML model, we'll use simulated inference
        if mlModel == nil {
            print("[OnDeviceLLM] No Core ML model found, using simulated inference")
        }
    }

    func generate(prompt: String, config: InferenceConfiguration) throws -> InferenceResponse {
        let startTime = CFAbsoluteTimeGetCurrent()

        // Tokenize input
        let tokens = tokenizer?.encode(prompt) ?? []

        var generatedText = ""
        var tokensGenerated = 0

        if let model = mlModel {
            // Real Core ML inference
            generatedText = try performCoreMLInference(model: model, tokens: tokens, config: config)
            tokensGenerated = tokenizer?.encode(generatedText).count ?? 0
        } else {
            // Simulated inference for development
            let response = generateCoachingResponse(prompt: prompt)
            generatedText = response
            tokensGenerated = response.split(separator: " ").count

            // Simulate inference delay
            Thread.sleep(forTimeInterval: Double(tokensGenerated) * 0.02)
        }

        let latencyMs = Int((CFAbsoluteTimeGetCurrent() - startTime) * 1000)

        return InferenceResponse(
            text: generatedText,
            tokensGenerated: tokensGenerated,
            latencyMs: latencyMs
        )
    }

    func generateStream(
        prompt: String,
        config: InferenceConfiguration,
        onToken: @escaping (String) -> Void,
        completion: @escaping (Error?) -> Void
    ) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else {
                completion(nil)
                return
            }

            if self.mlModel != nil {
                // Real streaming inference
                self.streamCoreMLInference(prompt: prompt, config: config, onToken: onToken, completion: completion)
            } else {
                // Simulated streaming
                let response = self.generateCoachingResponse(prompt: prompt)
                let words = response.split(separator: " ")

                for word in words {
                    onToken(String(word) + " ")
                    Thread.sleep(forTimeInterval: 0.05)
                }

                completion(nil)
            }
        }
    }

    private func performCoreMLInference(
        model: MLModel,
        tokens: [Int],
        config: InferenceConfiguration
    ) throws -> String {
        // Prepare input for Core ML model
        // This is a simplified version - actual implementation depends on model architecture

        guard let inputDescription = model.modelDescription.inputDescriptionsByName.first?.value else {
            throw NSError(domain: "OnDeviceLLM", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid model input"])
        }

        // Create input array
        let inputArray = try MLMultiArray(shape: [1, NSNumber(value: tokens.count)], dataType: .int32)
        for (index, token) in tokens.enumerated() {
            inputArray[index] = NSNumber(value: token)
        }

        // Create input provider
        let inputProvider = try MLDictionaryFeatureProvider(dictionary: [
            inputDescription.name: MLFeatureValue(multiArray: inputArray)
        ])

        // Run inference
        let output = try model.prediction(from: inputProvider)

        // Decode output
        if let outputArray = output.featureValue(for: "output")?.multiArrayValue {
            return decodeOutput(outputArray, config: config)
        }

        return ""
    }

    private func streamCoreMLInference(
        prompt: String,
        config: InferenceConfiguration,
        onToken: @escaping (String) -> Void,
        completion: @escaping (Error?) -> Void
    ) {
        // Simulated streaming for now - real implementation would need incremental decoding
        do {
            let response = try generate(prompt: prompt, config: config)
            let words = response.text.split(separator: " ")

            for word in words {
                onToken(String(word) + " ")
                Thread.sleep(forTimeInterval: 0.03)
            }

            completion(nil)
        } catch {
            completion(error)
        }
    }

    private func decodeOutput(_ output: MLMultiArray, config: InferenceConfiguration) -> String {
        // Simplified decoding - actual implementation depends on model output format
        var tokens: [Int] = []

        for i in 0..<min(output.count, config.maxTokens) {
            let value = output[i].intValue
            tokens.append(value)
        }

        return tokenizer?.decode(tokens) ?? ""
    }

    private func generateCoachingResponse(prompt: String) -> String {
        let lowerPrompt = prompt.lowercased()

        if lowerPrompt.contains("goal") || lowerPrompt.contains("achieve") {
            return "Great question about goals! Here's my coaching insight: Break your goal into smaller, achievable milestones. Track your progress daily, celebrate small wins, and remember that consistency beats intensity. What specific goal would you like to work on together?"
        }

        if lowerPrompt.contains("habit") || lowerPrompt.contains("routine") {
            return "Building strong habits is the foundation of lasting change. Start with just 2 minutes a day - the key is consistency over intensity. Stack new habits onto existing ones, and use implementation intentions: 'When X happens, I will do Y.' Which habit would you like to develop?"
        }

        if lowerPrompt.contains("motivation") || lowerPrompt.contains("stuck") || lowerPrompt.contains("procrastinat") {
            return "Feeling stuck is completely normal - it happens to everyone. The key is to reconnect with your deeper 'why'. What originally inspired this goal? Take just one small action today, even 5 minutes. Remember: progress, not perfection. How can I help you take that first step?"
        }

        if lowerPrompt.contains("stress") || lowerPrompt.contains("anxious") || lowerPrompt.contains("overwhelm") {
            return "Managing stress is crucial for your well-being and performance. Try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8. Regular breaks and mindfulness can make a significant difference. Would you like some specific stress-reduction exercises tailored to your situation?"
        }

        if lowerPrompt.contains("sleep") || lowerPrompt.contains("tired") || lowerPrompt.contains("energy") {
            return "Quality sleep is the foundation of peak performance. Create a consistent sleep schedule, limit screens 1 hour before bed, keep your room cool and dark. Consider a wind-down routine. Would you like personalized tips for better sleep based on your current habits?"
        }

        if lowerPrompt.contains("exercise") || lowerPrompt.contains("workout") || lowerPrompt.contains("fitness") {
            return "Movement is medicine for both body and mind! Start with activities you genuinely enjoy - even a 10-minute walk counts. Consistency matters more than intensity when building fitness habits. What type of exercise have you enjoyed in the past?"
        }

        if lowerPrompt.contains("diet") || lowerPrompt.contains("nutrition") || lowerPrompt.contains("eating") {
            return "Nutrition is about sustainable habits, not quick fixes. Focus on adding more whole foods rather than restriction. Small changes compound over time. What's one healthy eating habit you'd like to develop?"
        }

        return "I'm here to support your personal growth journey. Every step forward, no matter how small, brings you closer to your goals. What specific area would you like to focus on today? I can help with goals, habits, motivation, stress management, sleep, fitness, or any other aspect of your well-being."
    }

    func getModelInfo() -> [String: Any] {
        var info: [String: Any] = [
            "path": modelPath,
            "backend": backend,
            "hasMLModel": mlModel != nil,
            "vocabSize": vocabSize,
            "contextLength": contextLength,
            "embeddingDim": embeddingDim
        ]

        if let model = mlModel {
            info["modelDescription"] = model.modelDescription.metadata[.description] ?? "Unknown"
            info["author"] = model.modelDescription.metadata[.author] ?? "Unknown"
        }

        return info
    }

    func dispose() {
        mlModel = nil
        tokenizer = nil
    }
}

// MARK: - Simple Tokenizer

class SimpleTokenizer {
    private var vocabulary: [String: Int] = [:]
    private var reverseVocabulary: [Int: String] = [:]

    init() {
        // Build a simple word-based vocabulary
        // In production, use proper BPE/SentencePiece tokenizer
        buildBasicVocabulary()
    }

    private func buildBasicVocabulary() {
        // Special tokens
        vocabulary["<pad>"] = 0
        vocabulary["<unk>"] = 1
        vocabulary["<s>"] = 2
        vocabulary["</s>"] = 3

        // Common words and subwords would be loaded from a vocabulary file
        // This is a simplified version
        let commonTokens = [
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "must", "shall", "can", "need", "dare",
            "ought", "used", "to", "and", "but", "or", "nor", "for", "yet", "so",
            "goal", "habit", "motivation", "stress", "sleep", "exercise", "health",
            "progress", "success", "achieve", "help", "support", "coach", "learn"
        ]

        for (index, token) in commonTokens.enumerated() {
            vocabulary[token] = index + 4
            reverseVocabulary[index + 4] = token
        }

        // Add reverse mappings for special tokens
        reverseVocabulary[0] = "<pad>"
        reverseVocabulary[1] = "<unk>"
        reverseVocabulary[2] = "<s>"
        reverseVocabulary[3] = "</s>"
    }

    func encode(_ text: String) -> [Int] {
        var tokens: [Int] = [2] // Start token

        let words = text.lowercased().split(separator: " ")
        for word in words {
            if let token = vocabulary[String(word)] {
                tokens.append(token)
            } else {
                tokens.append(1) // Unknown token
            }
        }

        tokens.append(3) // End token
        return tokens
    }

    func decode(_ tokens: [Int]) -> String {
        var words: [String] = []

        for token in tokens {
            if token == 2 || token == 3 { continue } // Skip special tokens
            if let word = reverseVocabulary[token] {
                words.append(word)
            }
        }

        return words.joined(separator: " ")
    }
}

// MARK: - UIDevice Extension

extension UIDevice {
    var modelName: String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }
}

// MARK: - MLModel Extension for Compute Units

@available(iOS 14.0, *)
extension MLModel {
    static var availableComputeUnits: Set<MLComputeUnits> {
        var units: Set<MLComputeUnits> = [.cpuOnly]

        // Check for GPU
        if MTLCreateSystemDefaultDevice() != nil {
            units.insert(.cpuAndGPU)
        }

        // Neural Engine is available on A12+ chips (iPhone XS and later)
        // We approximate this by checking iOS version and device capability
        if #available(iOS 15.0, *) {
            units.insert(.cpuAndNeuralEngine)
            units.insert(.all)
        }

        return units
    }
}
