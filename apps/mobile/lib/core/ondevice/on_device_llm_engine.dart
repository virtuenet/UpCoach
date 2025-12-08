import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Inference backend types
enum LlmBackend {
  coreML,
  nnapi,
  gpu,
  cpu,
  unknown,
}

/// Result from on-device inference
class LlmInferenceResult {
  final String text;
  final int tokensGenerated;
  final int latencyMs;
  final LlmBackend backend;

  const LlmInferenceResult({
    required this.text,
    required this.tokensGenerated,
    required this.latencyMs,
    required this.backend,
  });

  double get tokensPerSecond =>
      latencyMs > 0 ? (tokensGenerated / latencyMs) * 1000 : 0;
}

/// Generation configuration
class LlmGenerationConfig {
  final int maxTokens;
  final double temperature;
  final double topP;
  final int topK;
  final double repetitionPenalty;
  final List<String> stopSequences;

  const LlmGenerationConfig({
    this.maxTokens = 256,
    this.temperature = 0.7,
    this.topP = 0.9,
    this.topK = 40,
    this.repetitionPenalty = 1.1,
    this.stopSequences = const ['</s>', '[END]'],
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

/// Enhanced on-device LLM engine with native platform integration
class OnDeviceLlmEngine {
  static const MethodChannel _channel =
      MethodChannel('com.upcoach/on_device_llm');
  static const EventChannel _streamChannel =
      EventChannel('com.upcoach/on_device_llm_stream');

  bool _isInitialized = false;
  LlmBackend _activeBackend = LlmBackend.unknown;
  String? _modelPath;

  /// Whether the engine is ready for inference
  bool get isReady => _isInitialized;

  /// The active inference backend
  LlmBackend get activeBackend => _activeBackend;

  /// Initialize the engine with a model
  Future<bool> initialize(String modelPath) async {
    if (_isInitialized && _modelPath == modelPath) {
      return true;
    }

    try {
      // Detect best backend for this device
      _activeBackend = await _detectBackend();

      final result = await _channel.invokeMethod<bool>('initialize', {
        'modelPath': modelPath,
        'backend': _activeBackend.name,
      });

      _isInitialized = result ?? false;
      if (_isInitialized) {
        _modelPath = modelPath;
        debugPrint(
            '[OnDeviceLlmEngine] Initialized with backend: ${_activeBackend.name}');
      }

      return _isInitialized;
    } on MissingPluginException {
      debugPrint(
          '[OnDeviceLlmEngine] Native plugin not available, using fallback');
      _isInitialized = true;
      _modelPath = modelPath;
      _activeBackend = LlmBackend.cpu;
      return true;
    } catch (e) {
      debugPrint('[OnDeviceLlmEngine] Initialization failed: $e');
      return false;
    }
  }

  /// Detect the best inference backend
  Future<LlmBackend> _detectBackend() async {
    try {
      final backend = await _channel.invokeMethod<String>('detectBackend');
      switch (backend) {
        case 'coreml':
          return LlmBackend.coreML;
        case 'nnapi':
          return LlmBackend.nnapi;
        case 'gpu':
          return LlmBackend.gpu;
        case 'cpu':
          return LlmBackend.cpu;
        default:
          return LlmBackend.unknown;
      }
    } catch (e) {
      return LlmBackend.cpu;
    }
  }

  /// Generate text completion (legacy compatibility method)
  Future<String> generate(String prompt, {int maxTokens = 160}) async {
    final result = await generateWithResult(
      prompt,
      config: LlmGenerationConfig(maxTokens: maxTokens),
    );
    return result.text;
  }

  /// Generate text completion with full result metadata
  Future<LlmInferenceResult> generateWithResult(
    String prompt, {
    LlmGenerationConfig config = const LlmGenerationConfig(),
  }) async {
    final stopwatch = Stopwatch()..start();

    try {
      final response = await _channel.invokeMethod<Map>('generate', {
        'prompt': prompt,
        'config': config.toMap(),
      });

      stopwatch.stop();

      if (response != null) {
        return LlmInferenceResult(
          text: response['text'] as String? ?? '',
          tokensGenerated: response['tokensGenerated'] as int? ?? 0,
          latencyMs: stopwatch.elapsedMilliseconds,
          backend: _activeBackend,
        );
      }
    } on MissingPluginException {
      debugPrint('[OnDeviceLlmEngine] Native plugin missing, using fallback');
    } catch (error) {
      debugPrint('[OnDeviceLlmEngine] Native inference failed: $error');
    }

    stopwatch.stop();
    final fallbackText =
        _fallbackCompletion(prompt, maxTokens: config.maxTokens);

    return LlmInferenceResult(
      text: fallbackText,
      tokensGenerated: fallbackText.split(' ').length,
      latencyMs: stopwatch.elapsedMilliseconds,
      backend: LlmBackend.cpu,
    );
  }

  /// Generate streaming text completion
  Stream<String> generateStream(
    String prompt, {
    LlmGenerationConfig config = const LlmGenerationConfig(),
  }) async* {
    try {
      // Start streaming generation on native side
      await _channel.invokeMethod('startStream', {
        'prompt': prompt,
        'config': config.toMap(),
      });

      // Listen to event channel for tokens
      await for (final token in _streamChannel.receiveBroadcastStream()) {
        if (token is String) {
          yield token;
        }
      }
    } on MissingPluginException {
      // Fallback: simulate streaming with word-by-word output
      final text = _fallbackCompletion(prompt, maxTokens: config.maxTokens);
      for (final word in text.split(' ')) {
        yield '$word ';
        await Future.delayed(const Duration(milliseconds: 50));
      }
    } catch (e) {
      debugPrint('[OnDeviceLlmEngine] Stream generation failed: $e');
      yield 'Error generating response. Please try again.';
    }
  }

  /// Get model information
  Future<Map<String, dynamic>> getModelInfo() async {
    try {
      final info = await _channel.invokeMethod<Map>('getModelInfo');
      return Map<String, dynamic>.from(info ?? {});
    } catch (e) {
      return {
        'path': _modelPath,
        'backend': _activeBackend.name,
        'initialized': _isInitialized,
      };
    }
  }

  /// Benchmark inference performance
  Future<Map<String, dynamic>> benchmark({int iterations = 3}) async {
    if (!_isInitialized) {
      return {'error': 'Engine not initialized'};
    }

    const testPrompt = 'What is the best way to build a morning routine?';
    final latencies = <int>[];
    final tokenCounts = <int>[];

    for (var i = 0; i < iterations; i++) {
      final result = await generateWithResult(testPrompt);
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

  /// Dispose and cleanup resources
  Future<void> dispose() async {
    try {
      await _channel.invokeMethod('dispose');
    } catch (e) {
      debugPrint('[OnDeviceLlmEngine] Dispose error: $e');
    } finally {
      _isInitialized = false;
      _modelPath = null;
    }
  }

  /// Fallback completion when native inference is unavailable
  String _fallbackCompletion(String prompt, {int maxTokens = 160}) {
    final normalized = prompt.trim().toLowerCase();
    if (normalized.isEmpty) {
      return 'On-device assistant is ready. Ask me something concise.';
    }

    // Coaching-specific fallback responses
    if (normalized.contains('goal') || normalized.contains('achieve')) {
      return 'Setting clear, achievable goals is the foundation of success. '
          'Break your goal into smaller milestones and track your progress daily.';
    }

    if (normalized.contains('habit') || normalized.contains('routine')) {
      return 'Building habits takes consistency. Start small with just 2 minutes a day, '
          'then gradually increase. Stack new habits onto existing ones.';
    }

    if (normalized.contains('motivation') || normalized.contains('stuck')) {
      return 'Feeling stuck is normal. Reconnect with your "why" - the deeper reason '
          'behind your goals. Take a small action today, even just 5 minutes.';
    }

    if (normalized.contains('stress') || normalized.contains('anxious')) {
      return 'Managing stress is crucial. Try the 4-7-8 breathing technique: inhale for 4 seconds, '
          'hold for 7, exhale for 8. Regular breaks make a big difference.';
    }

    if (normalized.contains('sleep') || normalized.contains('tired')) {
      return 'Quality sleep is essential for peak performance. Create a consistent sleep schedule, '
          'limit screens before bed, and keep your bedroom cool and dark.';
    }

    // Generic response
    final sentences = prompt.split(RegExp(r'(?<=[.!?])\s+'));
    final summaryCount = min(2, sentences.length);
    final summary = sentences.take(summaryCount).join(' ');

    final text = 'Every step forward brings you closer to your goals. $summary';
    return text.length > maxTokens ? text.substring(0, maxTokens).trim() : text;
  }
}
