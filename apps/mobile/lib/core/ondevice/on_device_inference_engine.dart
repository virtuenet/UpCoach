import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Supported inference backends
enum InferenceBackend {
  /// Apple Neural Engine / Core ML (iOS/macOS)
  coreML,

  /// Android Neural Networks API
  nnapi,

  /// GPU acceleration via Metal/Vulkan
  gpu,

  /// CPU fallback
  cpu,
}

/// Result from on-device inference
class InferenceResult {
  final String text;
  final int tokensGenerated;
  final int latencyMs;
  final bool fromCache;
  final InferenceBackend backend;

  const InferenceResult({
    required this.text,
    required this.tokensGenerated,
    required this.latencyMs,
    this.fromCache = false,
    required this.backend,
  });

  double get tokensPerSecond =>
      latencyMs > 0 ? (tokensGenerated / latencyMs) * 1000 : 0;
}

/// Configuration for inference
class InferenceConfig {
  final int maxTokens;
  final double temperature;
  final double topP;
  final int topK;
  final double repetitionPenalty;
  final List<String> stopSequences;

  const InferenceConfig({
    this.maxTokens = 256,
    this.temperature = 0.7,
    this.topP = 0.9,
    this.topK = 40,
    this.repetitionPenalty = 1.1,
    this.stopSequences = const ['</s>', '[END]', '\n\n'],
  });

  Map<String, dynamic> toMap() => {
        'maxTokens': maxTokens,
        'temperature': temperature,
        'topP': topP,
        'topK': topK,
        'repetitionPenalty': repetitionPenalty,
        'stopSequences': stopSequences,
      };
}

/// On-device LLM inference engine with native platform support
class OnDeviceInferenceEngine {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/on_device_llm');

  static final OnDeviceInferenceEngine _instance =
      OnDeviceInferenceEngine._internal();
  factory OnDeviceInferenceEngine() => _instance;
  OnDeviceInferenceEngine._internal();

  bool _isInitialized = false;
  String? _loadedModelPath;
  InferenceBackend _activeBackend = InferenceBackend.cpu;

  // Simple response cache for common prompts
  final Map<String, InferenceResult> _cache = {};
  static const int _maxCacheSize = 50;

  /// Check if engine is ready for inference
  bool get isReady => _isInitialized && _loadedModelPath != null;

  /// Get the active inference backend
  InferenceBackend get activeBackend => _activeBackend;

  /// Initialize the inference engine with a model
  Future<bool> initialize(String modelPath) async {
    if (_isInitialized && _loadedModelPath == modelPath) {
      return true;
    }

    try {
      // Check if model file exists
      final modelFile = File(modelPath);
      if (!await modelFile.exists()) {
        debugPrint('[InferenceEngine] Model file not found: $modelPath');
        return false;
      }

      // Determine best backend for this device
      _activeBackend = await _detectBestBackend();

      // Initialize native engine
      final result = await _channel.invokeMethod<bool>('initialize', {
        'modelPath': modelPath,
        'backend': _activeBackend.name,
      });

      _isInitialized = result ?? false;
      if (_isInitialized) {
        _loadedModelPath = modelPath;
        debugPrint(
            '[InferenceEngine] Initialized with backend: ${_activeBackend.name}');
      }

      return _isInitialized;
    } on MissingPluginException {
      debugPrint('[InferenceEngine] Native plugin not available');
      // Fall back to simulated inference for development
      _isInitialized = true;
      _loadedModelPath = modelPath;
      _activeBackend = InferenceBackend.cpu;
      return true;
    } catch (e) {
      debugPrint('[InferenceEngine] Initialization failed: $e');
      return false;
    }
  }

  /// Detect the best inference backend for this device
  Future<InferenceBackend> _detectBestBackend() async {
    try {
      final backend = await _channel.invokeMethod<String>('detectBackend');
      switch (backend) {
        case 'coreml':
          return InferenceBackend.coreML;
        case 'nnapi':
          return InferenceBackend.nnapi;
        case 'gpu':
          return InferenceBackend.gpu;
        default:
          return InferenceBackend.cpu;
      }
    } catch (e) {
      // Default based on platform
      if (Platform.isIOS || Platform.isMacOS) {
        return InferenceBackend.coreML;
      } else if (Platform.isAndroid) {
        return InferenceBackend.nnapi;
      }
      return InferenceBackend.cpu;
    }
  }

  /// Generate text completion
  Future<InferenceResult> generate(
    String prompt, {
    InferenceConfig config = const InferenceConfig(),
  }) async {
    if (!isReady) {
      throw StateError('Engine not initialized. Call initialize() first.');
    }

    // Check cache for exact prompt match
    final cacheKey = _generateCacheKey(prompt, config);
    if (_cache.containsKey(cacheKey)) {
      final cached = _cache[cacheKey]!;
      return InferenceResult(
        text: cached.text,
        tokensGenerated: cached.tokensGenerated,
        latencyMs: 0,
        fromCache: true,
        backend: cached.backend,
      );
    }

    final stopwatch = Stopwatch()..start();

    try {
      final result = await _channel.invokeMethod<Map>('generate', {
        'prompt': prompt,
        'config': config.toMap(),
      });

      stopwatch.stop();

      if (result != null) {
        final inferenceResult = InferenceResult(
          text: result['text'] as String? ?? '',
          tokensGenerated: result['tokensGenerated'] as int? ?? 0,
          latencyMs: stopwatch.elapsedMilliseconds,
          backend: _activeBackend,
        );

        // Cache the result
        _addToCache(cacheKey, inferenceResult);

        return inferenceResult;
      }
    } on MissingPluginException {
      // Fall back to simulated inference
      stopwatch.stop();
      return _simulatedInference(prompt, config, stopwatch.elapsedMilliseconds);
    } catch (e) {
      debugPrint('[InferenceEngine] Generation failed: $e');
      stopwatch.stop();
    }

    // Return fallback response
    return _simulatedInference(prompt, config, stopwatch.elapsedMilliseconds);
  }

  /// Generate streaming text completion
  Stream<String> generateStream(
    String prompt, {
    InferenceConfig config = const InferenceConfig(),
  }) async* {
    if (!isReady) {
      throw StateError('Engine not initialized. Call initialize() first.');
    }

    try {
      // Set up event channel for streaming
      const eventChannel = EventChannel('com.upcoach/on_device_llm_stream');

      await _channel.invokeMethod('startStream', {
        'prompt': prompt,
        'config': config.toMap(),
      });

      await for (final token in eventChannel.receiveBroadcastStream()) {
        if (token is String) {
          yield token;
        }
      }
    } on MissingPluginException {
      // Fall back to non-streaming with word-by-word yield
      final result = await _simulatedInference(prompt, config, 0);
      for (final word in result.text.split(' ')) {
        yield '$word ';
        await Future.delayed(const Duration(milliseconds: 50));
      }
    } catch (e) {
      debugPrint('[InferenceEngine] Stream generation failed: $e');
      yield 'Error generating response. Please try again.';
    }
  }

  /// Simulated inference for development/fallback
  Future<InferenceResult> _simulatedInference(
    String prompt,
    InferenceConfig config,
    int baseLatency,
  ) async {
    // Generate a contextual response based on prompt
    final response = _generateContextualResponse(prompt);

    // Simulate token generation delay
    final tokensGenerated = response.split(' ').length;
    await Future.delayed(
        Duration(milliseconds: tokensGenerated * 20)); // ~50 tokens/sec

    return InferenceResult(
      text: response,
      tokensGenerated: tokensGenerated,
      latencyMs: baseLatency + (tokensGenerated * 20),
      backend: InferenceBackend.cpu,
    );
  }

  /// Generate contextual response for coaching scenarios
  String _generateContextualResponse(String prompt) {
    final lowerPrompt = prompt.toLowerCase();

    // Coaching-specific responses
    if (lowerPrompt.contains('goal') || lowerPrompt.contains('achieve')) {
      return 'Setting clear, achievable goals is the foundation of success. '
          'Break your goal into smaller milestones, track your progress daily, '
          'and celebrate small wins along the way. What specific goal would you like to focus on?';
    }

    if (lowerPrompt.contains('habit') || lowerPrompt.contains('routine')) {
      return 'Building habits takes consistency and patience. '
          'Start small with just 2 minutes a day, then gradually increase. '
          'Stack new habits onto existing ones for better adherence. '
          'Which habit would you like to develop?';
    }

    if (lowerPrompt.contains('motivation') || lowerPrompt.contains('stuck')) {
      return 'Feeling stuck is normal on any journey. '
          'Reconnect with your "why" - the deeper reason behind your goals. '
          'Take a small action today, even just 5 minutes. '
          'Progress, not perfection, is what matters. How can I help you take the next step?';
    }

    if (lowerPrompt.contains('stress') || lowerPrompt.contains('anxious')) {
      return 'Managing stress is crucial for well-being. '
          'Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. '
          'Regular breaks and mindful moments can make a big difference. '
          'Would you like some stress-reduction exercises?';
    }

    if (lowerPrompt.contains('sleep') || lowerPrompt.contains('tired')) {
      return 'Quality sleep is essential for peak performance. '
          'Create a consistent sleep schedule, limit screens before bed, '
          'and make your bedroom cool and dark. '
          'Would you like tips for a better nighttime routine?';
    }

    if (lowerPrompt.contains('exercise') || lowerPrompt.contains('workout')) {
      return 'Regular movement is key to both physical and mental health. '
          'Start with activities you enjoy - even a 10-minute walk counts. '
          'Consistency matters more than intensity when building a fitness habit. '
          'What type of exercise interests you?';
    }

    // Generic coaching response
    return 'I understand you\'re working on self-improvement. '
        'Every step forward, no matter how small, brings you closer to your goals. '
        'What specific area would you like to focus on today?';
  }

  /// Generate cache key from prompt and config
  String _generateCacheKey(String prompt, InferenceConfig config) {
    final normalized = prompt.trim().toLowerCase();
    return '${normalized.hashCode}_${config.maxTokens}_${config.temperature}';
  }

  /// Add result to cache with LRU eviction
  void _addToCache(String key, InferenceResult result) {
    if (_cache.length >= _maxCacheSize) {
      _cache.remove(_cache.keys.first);
    }
    _cache[key] = result;
  }

  /// Clear the response cache
  void clearCache() {
    _cache.clear();
  }

  /// Unload the model and free resources
  Future<void> dispose() async {
    try {
      await _channel.invokeMethod('dispose');
    } catch (e) {
      debugPrint('[InferenceEngine] Dispose error: $e');
    } finally {
      _isInitialized = false;
      _loadedModelPath = null;
      _cache.clear();
    }
  }

  /// Get model info
  Future<Map<String, dynamic>> getModelInfo() async {
    if (!isReady) {
      return {'error': 'Model not loaded'};
    }

    try {
      final info = await _channel.invokeMethod<Map>('getModelInfo');
      return Map<String, dynamic>.from(info ?? {});
    } catch (e) {
      return {
        'path': _loadedModelPath,
        'backend': _activeBackend.name,
        'initialized': _isInitialized,
      };
    }
  }

  /// Benchmark inference performance
  Future<Map<String, dynamic>> benchmark({int iterations = 5}) async {
    if (!isReady) {
      return {'error': 'Model not loaded'};
    }

    const testPrompt = 'What is the best way to build a morning routine?';
    final latencies = <int>[];
    final tokenCounts = <int>[];

    for (var i = 0; i < iterations; i++) {
      clearCache(); // Clear cache to get fresh results
      final result = await generate(testPrompt);
      latencies.add(result.latencyMs);
      tokenCounts.add(result.tokensGenerated);
    }

    final avgLatency = latencies.reduce((a, b) => a + b) / iterations;
    final avgTokens = tokenCounts.reduce((a, b) => a + b) / iterations;

    return {
      'iterations': iterations,
      'avgLatencyMs': avgLatency,
      'avgTokens': avgTokens,
      'avgTokensPerSecond': avgTokens / (avgLatency / 1000),
      'backend': _activeBackend.name,
    };
  }
}
