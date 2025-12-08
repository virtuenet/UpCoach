import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../ondevice/on_device_inference_engine.dart';
import '../ondevice/on_device_llm_manager.dart';
import '../ondevice/on_device_llm_state.dart';
import '../../features/ai/domain/services/ai_service.dart';
import '../../features/ai/domain/models/ai_response.dart';

/// AI inference mode
enum AIInferenceMode {
  /// Always use server (requires internet)
  serverOnly,

  /// Always use on-device (works offline)
  onDeviceOnly,

  /// Prefer on-device, fall back to server
  onDevicePreferred,

  /// Prefer server, fall back to on-device
  serverPreferred,

  /// Automatically choose based on context
  auto,
}

/// Result source indicator
enum AIResponseSource {
  server,
  onDevice,
  cache,
  fallback,
}

/// Extended AI response with source info
class HybridAIResponse {
  final AIResponse response;
  final AIResponseSource source;
  final int latencyMs;
  final String? modelName;

  const HybridAIResponse({
    required this.response,
    required this.source,
    required this.latencyMs,
    this.modelName,
  });
}

/// Configuration for hybrid AI
class HybridAIConfig {
  final AIInferenceMode mode;
  final int serverTimeoutMs;
  final int onDeviceMaxPromptLength;
  final bool enableOfflineMode;
  final bool cacheResponses;

  const HybridAIConfig({
    this.mode = AIInferenceMode.auto,
    this.serverTimeoutMs = 10000,
    this.onDeviceMaxPromptLength = 500,
    this.enableOfflineMode = true,
    this.cacheResponses = true,
  });
}

/// Hybrid AI service that combines on-device and server-side LLM capabilities
class HybridAIService {
  final AIService _serverAI;
  final OnDeviceInferenceEngine _onDeviceEngine;
  final OnDeviceLlmState Function() _getLlmState;

  HybridAIConfig _config;
  bool _isOnline = true;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  // Preferences keys
  static const _prefsInferenceModeKey = 'hybrid_ai_inference_mode';
  static const _prefsOfflineModeKey = 'hybrid_ai_offline_mode';

  HybridAIService({
    required AIService serverAI,
    required OnDeviceInferenceEngine onDeviceEngine,
    required OnDeviceLlmState Function() getLlmState,
    HybridAIConfig config = const HybridAIConfig(),
  })  : _serverAI = serverAI,
        _onDeviceEngine = onDeviceEngine,
        _getLlmState = getLlmState,
        _config = config {
    _initConnectivityMonitoring();
    _loadConfig();
  }

  /// Initialize connectivity monitoring
  void _initConnectivityMonitoring() {
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      _isOnline = !results.contains(ConnectivityResult.none);
      debugPrint('[HybridAI] Connectivity changed: $_isOnline');
    });

    // Check initial connectivity
    Connectivity().checkConnectivity().then((results) {
      _isOnline = !results.contains(ConnectivityResult.none);
    });
  }

  /// Load saved configuration
  Future<void> _loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final modeIndex = prefs.getInt(_prefsInferenceModeKey);
    final offlineMode = prefs.getBool(_prefsOfflineModeKey) ?? true;

    if (modeIndex != null && modeIndex < AIInferenceMode.values.length) {
      _config = HybridAIConfig(
        mode: AIInferenceMode.values[modeIndex],
        enableOfflineMode: offlineMode,
        serverTimeoutMs: _config.serverTimeoutMs,
        onDeviceMaxPromptLength: _config.onDeviceMaxPromptLength,
        cacheResponses: _config.cacheResponses,
      );
    }
  }

  /// Update configuration
  Future<void> setConfig(HybridAIConfig config) async {
    _config = config;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_prefsInferenceModeKey, config.mode.index);
    await prefs.setBool(_prefsOfflineModeKey, config.enableOfflineMode);
  }

  /// Get current configuration
  HybridAIConfig get config => _config;

  /// Get current LLM state
  OnDeviceLlmState get _llmState => _getLlmState();

  /// Check if on-device inference is available
  bool get isOnDeviceAvailable =>
      _llmState.enabled && _llmState.status == OnDeviceModelStatus.ready;

  /// Check if server is available
  bool get isServerAvailable => _isOnline;

  /// Send a message and get AI response using hybrid approach
  Future<HybridAIResponse> sendMessage(
    String message, {
    String? sessionId,
    List<Map<String, String>>? conversationHistory,
  }) async {
    final stopwatch = Stopwatch()..start();

    // Determine which backend to use
    final useOnDevice = _shouldUseOnDevice(message);

    if (useOnDevice && isOnDeviceAvailable) {
      try {
        final result = await _generateOnDevice(message);
        stopwatch.stop();

        return HybridAIResponse(
          response: AIResponse(
            content: result.text,
            sessionId: sessionId ?? '',
            role: 'assistant',
            timestamp: DateTime.now(),
          ),
          source: result.fromCache
              ? AIResponseSource.cache
              : AIResponseSource.onDevice,
          latencyMs: stopwatch.elapsedMilliseconds,
          modelName: _llmState.activeModel.name,
        );
      } catch (e) {
        debugPrint('[HybridAI] On-device generation failed: $e');
        // Fall through to server
      }
    }

    // Try server if available
    if (isServerAvailable) {
      try {
        final response = await _serverAI
            .getSmartResponse(
              message,
              conversationHistory: conversationHistory,
            )
            .timeout(Duration(milliseconds: _config.serverTimeoutMs));

        stopwatch.stop();

        return HybridAIResponse(
          response: response,
          source: AIResponseSource.server,
          latencyMs: stopwatch.elapsedMilliseconds,
          modelName: 'Server LLM',
        );
      } catch (e) {
        debugPrint('[HybridAI] Server request failed: $e');
        // Fall through to on-device fallback
      }
    }

    // Final fallback to on-device if available
    if (isOnDeviceAvailable) {
      try {
        final result = await _generateOnDevice(message);
        stopwatch.stop();

        return HybridAIResponse(
          response: AIResponse(
            content: result.text,
            sessionId: sessionId ?? '',
            role: 'assistant',
            timestamp: DateTime.now(),
          ),
          source: AIResponseSource.onDevice,
          latencyMs: stopwatch.elapsedMilliseconds,
          modelName: _llmState.activeModel.name,
        );
      } catch (e) {
        debugPrint('[HybridAI] On-device fallback failed: $e');
      }
    }

    // Ultimate fallback
    stopwatch.stop();
    return HybridAIResponse(
      response: AIResponse(
        content: _getFallbackResponse(message),
        sessionId: sessionId ?? '',
        role: 'assistant',
        timestamp: DateTime.now(),
      ),
      source: AIResponseSource.fallback,
      latencyMs: stopwatch.elapsedMilliseconds,
    );
  }

  /// Stream AI response
  Stream<String> streamMessage(
    String message, {
    String? sessionId,
  }) async* {
    final useOnDevice = _shouldUseOnDevice(message);

    if (useOnDevice && isOnDeviceAvailable) {
      try {
        await for (final token in _onDeviceEngine.generateStream(message)) {
          yield token;
        }
        return;
      } catch (e) {
        debugPrint('[HybridAI] On-device streaming failed: $e');
      }
    }

    // Fall back to non-streaming server response
    if (isServerAvailable) {
      try {
        final response = await _serverAI.getSmartResponse(message);
        // Simulate streaming for server response
        for (final word in response.content.split(' ')) {
          yield '$word ';
          await Future.delayed(const Duration(milliseconds: 30));
        }
        return;
      } catch (e) {
        debugPrint('[HybridAI] Server request failed: $e');
      }
    }

    // Fallback
    yield _getFallbackResponse(message);
  }

  /// Determine if on-device inference should be used
  bool _shouldUseOnDevice(String message) {
    switch (_config.mode) {
      case AIInferenceMode.serverOnly:
        return false;
      case AIInferenceMode.onDeviceOnly:
        return true;
      case AIInferenceMode.onDevicePreferred:
        return isOnDeviceAvailable;
      case AIInferenceMode.serverPreferred:
        return !isServerAvailable && isOnDeviceAvailable;
      case AIInferenceMode.auto:
        // Use on-device for:
        // - Short prompts (faster response)
        // - When offline
        // - Simple queries
        if (!isServerAvailable) return true;
        if (message.length <= _config.onDeviceMaxPromptLength) {
          return _isSimpleQuery(message);
        }
        return false;
    }
  }

  /// Check if query is simple enough for on-device
  bool _isSimpleQuery(String message) {
    final lowerMessage = message.toLowerCase();

    // Simple coaching queries that on-device can handle well
    final simplePatterns = [
      'motivation',
      'routine',
      'habit',
      'goal',
      'tip',
      'advice',
      'help me',
      'how to',
      'what is',
      'stress',
      'sleep',
      'exercise',
      'morning',
      'evening',
    ];

    return simplePatterns.any((pattern) => lowerMessage.contains(pattern));
  }

  /// Generate response using on-device engine
  Future<InferenceResult> _generateOnDevice(String message) async {
    // Format prompt for coaching context
    final formattedPrompt = _formatCoachingPrompt(message);
    return _onDeviceEngine.generate(formattedPrompt);
  }

  /// Format message as coaching prompt
  String _formatCoachingPrompt(String message) {
    return '''You are a supportive life coach helping users achieve their goals.
User: $message
Coach:''';
  }

  /// Get fallback response when both backends fail
  String _getFallbackResponse(String message) {
    return 'I\'m currently unable to process your request. '
        'Please check your internet connection or try again later. '
        'In the meantime, remember that small consistent actions lead to big results!';
  }

  /// Get recommendations (server only)
  Future<List<AIRecommendation>> getRecommendations() async {
    if (!isServerAvailable) {
      throw Exception('Server not available for recommendations');
    }
    return _serverAI.getRecommendations();
  }

  /// Get predictions (server only)
  Future<List<AIPrediction>> getPredictions() async {
    if (!isServerAvailable) {
      throw Exception('Server not available for predictions');
    }
    return _serverAI.getPredictions();
  }

  /// Analyze voice (server only)
  Future<VoiceAnalysis> analyzeVoice(File audioFile) async {
    if (!isServerAvailable) {
      throw Exception('Server not available for voice analysis');
    }
    return _serverAI.analyzeVoice(audioFile);
  }

  /// Get learning paths (server only)
  Future<List<LearningPath>> getLearningPaths() async {
    if (!isServerAvailable) {
      throw Exception('Server not available for learning paths');
    }
    return _serverAI.getLearningPaths();
  }

  /// Get insights report (server only)
  Future<Map<String, dynamic>> getInsightReport() async {
    if (!isServerAvailable) {
      throw Exception('Server not available for insights');
    }
    return _serverAI.getInsightReport();
  }

  /// Get AI status for UI display
  Map<String, dynamic> getStatus() {
    return {
      'isOnline': _isOnline,
      'onDeviceAvailable': isOnDeviceAvailable,
      'onDeviceModel': _llmState.activeModel.name,
      'onDeviceStatus': _llmState.status.name,
      'inferenceMode': _config.mode.name,
      'engineBackend': _onDeviceEngine.activeBackend.name,
    };
  }

  /// Dispose resources
  void dispose() {
    _connectivitySubscription?.cancel();
  }
}

// ============================================================================
// Provider
// ============================================================================

final hybridAIServiceProvider = Provider<HybridAIService>((ref) {
  final serverAI = ref.watch(aiServiceProvider);
  final llmState = ref.watch(onDeviceLlmManagerProvider);
  final engine = OnDeviceInferenceEngine();

  final service = HybridAIService(
    serverAI: serverAI,
    onDeviceEngine: engine,
    getLlmState: () => llmState,
  );

  ref.onDispose(() {
    service.dispose();
    engine.dispose();
  });

  return service;
});

/// Provider for AI status
final aiStatusProvider = Provider<Map<String, dynamic>>((ref) {
  final hybridAI = ref.watch(hybridAIServiceProvider);
  return hybridAI.getStatus();
});
