import 'dart:async';

import 'package:flutter/foundation.dart';

import '../ondevice/on_device_llm_engine.dart';

/// Query complexity levels for routing decisions
enum QueryComplexity {
  simple, // Short, common queries - local LLM
  moderate, // Medium complexity - prefer local, fallback to server
  complex, // Complex reasoning - server required
  critical, // High-stakes responses - always server
}

/// Response source for analytics
enum ResponseSource {
  local,
  server,
  cached,
  fallback,
}

/// Result from hybrid AI routing
class HybridAIResult {
  final String text;
  final ResponseSource source;
  final int latencyMs;
  final QueryComplexity complexity;
  final double confidenceScore;
  final Map<String, dynamic>? metadata;

  const HybridAIResult({
    required this.text,
    required this.source,
    required this.latencyMs,
    required this.complexity,
    this.confidenceScore = 0.0,
    this.metadata,
  });

  bool get isFromLocal => source == ResponseSource.local;
  bool get isFromServer => source == ResponseSource.server;
}

/// Configuration for hybrid routing
class HybridAIConfig {
  final int maxLocalTokens;
  final int serverTimeoutMs;
  final double minLocalConfidence;
  final bool preferLocal;
  final bool enableCaching;
  final int maxCacheSize;
  final Duration cacheTTL;

  const HybridAIConfig({
    this.maxLocalTokens = 200,
    this.serverTimeoutMs = 30000,
    this.minLocalConfidence = 0.7,
    this.preferLocal = true,
    this.enableCaching = true,
    this.maxCacheSize = 100,
    this.cacheTTL = const Duration(hours: 1),
  });
}

/// Server API client interface
abstract class ServerAIClient {
  Future<String> generateResponse(
    String prompt, {
    int maxTokens = 500,
    double temperature = 0.7,
  });

  Future<bool> isAvailable();
}

/// Default server client implementation
class DefaultServerAIClient implements ServerAIClient {
  final String baseUrl;
  final String? apiKey;

  DefaultServerAIClient({
    required this.baseUrl,
    this.apiKey,
  });

  @override
  Future<String> generateResponse(
    String prompt, {
    int maxTokens = 500,
    double temperature = 0.7,
  }) async {
    // This would make an actual HTTP call to the server
    // For now, throw to indicate server unavailable
    throw UnimplementedError('Server API not configured');
  }

  @override
  Future<bool> isAvailable() async {
    // Check server connectivity
    return false;
  }
}

/// Cache entry for responses
class _CacheEntry {
  final String response;
  final DateTime timestamp;
  final QueryComplexity complexity;

  _CacheEntry({
    required this.response,
    required this.timestamp,
    required this.complexity,
  });

  bool isExpired(Duration ttl) {
    return DateTime.now().difference(timestamp) > ttl;
  }
}

/// Hybrid AI Router that intelligently routes queries between local and server LLMs
class HybridAIRouter {
  final OnDeviceLlmEngine _localEngine;
  final ServerAIClient? _serverClient;
  final HybridAIConfig _config;

  // Response cache
  final Map<String, _CacheEntry> _cache = {};

  // Analytics
  int _totalRequests = 0;
  int _localRequests = 0;
  int _serverRequests = 0;
  int _cacheHits = 0;
  int _fallbacks = 0;

  HybridAIRouter({
    required OnDeviceLlmEngine localEngine,
    ServerAIClient? serverClient,
    HybridAIConfig config = const HybridAIConfig(),
  })  : _localEngine = localEngine,
        _serverClient = serverClient,
        _config = config;

  /// Main routing method
  Future<HybridAIResult> route(String prompt) async {
    final stopwatch = Stopwatch()..start();
    _totalRequests++;

    // Check cache first
    if (_config.enableCaching) {
      final cached = _checkCache(prompt);
      if (cached != null) {
        _cacheHits++;
        stopwatch.stop();
        return HybridAIResult(
          text: cached.response,
          source: ResponseSource.cached,
          latencyMs: stopwatch.elapsedMilliseconds,
          complexity: cached.complexity,
          confidenceScore: 1.0,
          metadata: {'cacheAge': DateTime.now().difference(cached.timestamp).inSeconds},
        );
      }
    }

    // Analyze query complexity
    final complexity = _analyzeComplexity(prompt);
    debugPrint('[HybridAIRouter] Query complexity: ${complexity.name}');

    // Route based on complexity and configuration
    HybridAIResult result;

    switch (complexity) {
      case QueryComplexity.simple:
        result = await _handleSimpleQuery(prompt, stopwatch);
        break;

      case QueryComplexity.moderate:
        result = await _handleModerateQuery(prompt, stopwatch);
        break;

      case QueryComplexity.complex:
        result = await _handleComplexQuery(prompt, stopwatch);
        break;

      case QueryComplexity.critical:
        result = await _handleCriticalQuery(prompt, stopwatch);
        break;
    }

    // Cache the result
    if (_config.enableCaching && result.source != ResponseSource.fallback) {
      _addToCache(prompt, result.text, complexity);
    }

    return result;
  }

  /// Analyze query to determine complexity
  QueryComplexity _analyzeComplexity(String prompt) {
    final normalized = prompt.toLowerCase().trim();
    final wordCount = normalized.split(RegExp(r'\s+')).length;

    // Critical patterns - always use server
    final criticalPatterns = [
      RegExp(r'payment|billing|subscription|refund|cancel'),
      RegExp(r'privacy|security|password|account'),
      RegExp(r'legal|terms|policy'),
      RegExp(r'emergency|urgent|critical'),
    ];

    for (final pattern in criticalPatterns) {
      if (pattern.hasMatch(normalized)) {
        return QueryComplexity.critical;
      }
    }

    // Complex patterns - prefer server
    final complexPatterns = [
      RegExp(r'explain.*detail|in depth|comprehensive'),
      RegExp(r'compare.*and.*contrast'),
      RegExp(r'analyze|evaluate|assess'),
      RegExp(r'create.*plan|design.*strategy'),
      RegExp(r'multiple.*step|step by step'),
    ];

    for (final pattern in complexPatterns) {
      if (pattern.hasMatch(normalized)) {
        return QueryComplexity.complex;
      }
    }

    // Simple patterns - local is fine
    final simplePatterns = [
      RegExp(r'^(what is|define|meaning of)\s'),
      RegExp(r'^(how to|tip for|quick tip)\s'),
      RegExp(r'^(yes|no|true|false)\?'),
      RegExp(r'motivat|encourag|inspir'),
      RegExp(r'remind|check.?in'),
    ];

    for (final pattern in simplePatterns) {
      if (pattern.hasMatch(normalized)) {
        return QueryComplexity.simple;
      }
    }

    // Use word count as secondary heuristic
    if (wordCount <= 10) {
      return QueryComplexity.simple;
    } else if (wordCount <= 30) {
      return QueryComplexity.moderate;
    } else {
      return QueryComplexity.complex;
    }
  }

  /// Handle simple queries - prefer local
  Future<HybridAIResult> _handleSimpleQuery(
    String prompt,
    Stopwatch stopwatch,
  ) async {
    if (_localEngine.isReady && _config.preferLocal) {
      try {
        final result = await _localEngine.generateWithResult(
          prompt,
          config: LlmGenerationConfig(maxTokens: _config.maxLocalTokens),
        );

        _localRequests++;
        stopwatch.stop();

        return HybridAIResult(
          text: result.text,
          source: ResponseSource.local,
          latencyMs: stopwatch.elapsedMilliseconds,
          complexity: QueryComplexity.simple,
          confidenceScore: 0.85,
          metadata: {
            'backend': result.backend.name,
            'tokensGenerated': result.tokensGenerated,
          },
        );
      } catch (e) {
        debugPrint('[HybridAIRouter] Local generation failed: $e');
      }
    }

    // Fallback to server or fallback response
    return _fallbackResponse(prompt, QueryComplexity.simple, stopwatch);
  }

  /// Handle moderate queries - try local, fallback to server
  Future<HybridAIResult> _handleModerateQuery(
    String prompt,
    Stopwatch stopwatch,
  ) async {
    // Try local first if preferred
    if (_localEngine.isReady && _config.preferLocal) {
      try {
        final result = await _localEngine.generateWithResult(
          prompt,
          config: LlmGenerationConfig(maxTokens: _config.maxLocalTokens),
        );

        // Evaluate local response quality
        final confidence = _evaluateResponseQuality(result.text, prompt);

        if (confidence >= _config.minLocalConfidence) {
          _localRequests++;
          stopwatch.stop();

          return HybridAIResult(
            text: result.text,
            source: ResponseSource.local,
            latencyMs: stopwatch.elapsedMilliseconds,
            complexity: QueryComplexity.moderate,
            confidenceScore: confidence,
            metadata: {
              'backend': result.backend.name,
              'tokensGenerated': result.tokensGenerated,
            },
          );
        }

        debugPrint(
            '[HybridAIRouter] Local confidence too low ($confidence), trying server');
      } catch (e) {
        debugPrint('[HybridAIRouter] Local generation failed: $e');
      }
    }

    // Try server
    if (_serverClient != null) {
      try {
        final isAvailable = await _serverClient!.isAvailable();
        if (isAvailable) {
          final serverResponse = await _serverClient!
              .generateResponse(prompt)
              .timeout(Duration(milliseconds: _config.serverTimeoutMs));

          _serverRequests++;
          stopwatch.stop();

          return HybridAIResult(
            text: serverResponse,
            source: ResponseSource.server,
            latencyMs: stopwatch.elapsedMilliseconds,
            complexity: QueryComplexity.moderate,
            confidenceScore: 0.95,
          );
        }
      } catch (e) {
        debugPrint('[HybridAIRouter] Server request failed: $e');
      }
    }

    return _fallbackResponse(prompt, QueryComplexity.moderate, stopwatch);
  }

  /// Handle complex queries - prefer server
  Future<HybridAIResult> _handleComplexQuery(
    String prompt,
    Stopwatch stopwatch,
  ) async {
    // Try server first for complex queries
    if (_serverClient != null) {
      try {
        final isAvailable = await _serverClient!.isAvailable();
        if (isAvailable) {
          final serverResponse = await _serverClient!
              .generateResponse(prompt, maxTokens: 800)
              .timeout(Duration(milliseconds: _config.serverTimeoutMs));

          _serverRequests++;
          stopwatch.stop();

          return HybridAIResult(
            text: serverResponse,
            source: ResponseSource.server,
            latencyMs: stopwatch.elapsedMilliseconds,
            complexity: QueryComplexity.complex,
            confidenceScore: 0.95,
          );
        }
      } catch (e) {
        debugPrint('[HybridAIRouter] Server request failed: $e');
      }
    }

    // Fallback to local if server unavailable
    if (_localEngine.isReady) {
      try {
        final result = await _localEngine.generateWithResult(
          prompt,
          config: LlmGenerationConfig(maxTokens: _config.maxLocalTokens),
        );

        _localRequests++;
        stopwatch.stop();

        return HybridAIResult(
          text:
              '${result.text}\n\n(Note: This response was generated offline. For more detailed analysis, please ensure you have an internet connection.)',
          source: ResponseSource.local,
          latencyMs: stopwatch.elapsedMilliseconds,
          complexity: QueryComplexity.complex,
          confidenceScore: 0.6,
          metadata: {
            'backend': result.backend.name,
            'offlineMode': true,
          },
        );
      } catch (e) {
        debugPrint('[HybridAIRouter] Local fallback failed: $e');
      }
    }

    return _fallbackResponse(prompt, QueryComplexity.complex, stopwatch);
  }

  /// Handle critical queries - always prefer server
  Future<HybridAIResult> _handleCriticalQuery(
    String prompt,
    Stopwatch stopwatch,
  ) async {
    // Always try server for critical queries
    if (_serverClient != null) {
      try {
        final isAvailable = await _serverClient!.isAvailable();
        if (isAvailable) {
          final serverResponse = await _serverClient!
              .generateResponse(prompt, maxTokens: 1000, temperature: 0.3)
              .timeout(Duration(milliseconds: _config.serverTimeoutMs));

          _serverRequests++;
          stopwatch.stop();

          return HybridAIResult(
            text: serverResponse,
            source: ResponseSource.server,
            latencyMs: stopwatch.elapsedMilliseconds,
            complexity: QueryComplexity.critical,
            confidenceScore: 0.98,
          );
        }
      } catch (e) {
        debugPrint('[HybridAIRouter] Server request failed for critical query: $e');
      }
    }

    // For critical queries, don't use local - return safe fallback
    stopwatch.stop();
    _fallbacks++;

    return HybridAIResult(
      text:
          'I apologize, but I cannot process this request offline. This type of query requires a server connection for accurate and safe responses. Please check your internet connection and try again.',
      source: ResponseSource.fallback,
      latencyMs: stopwatch.elapsedMilliseconds,
      complexity: QueryComplexity.critical,
      confidenceScore: 0.0,
    );
  }

  /// Evaluate response quality
  double _evaluateResponseQuality(String response, String prompt) {
    double score = 0.5; // Base score

    // Length appropriateness
    final wordCount = response.split(RegExp(r'\s+')).length;
    if (wordCount >= 10 && wordCount <= 150) {
      score += 0.2;
    } else if (wordCount < 5) {
      score -= 0.2;
    }

    // Check for coherence (no error messages)
    final errorPatterns = [
      'error',
      'failed',
      'unable to',
      'cannot process',
      'sorry',
    ];
    for (final pattern in errorPatterns) {
      if (response.toLowerCase().contains(pattern)) {
        score -= 0.15;
      }
    }

    // Check for relevance (keywords from prompt appear in response)
    final promptKeywords = prompt
        .toLowerCase()
        .split(RegExp(r'\s+'))
        .where((w) => w.length > 4)
        .toSet();
    final responseWords = response.toLowerCase().split(RegExp(r'\s+')).toSet();

    final overlap = promptKeywords.intersection(responseWords);
    if (overlap.isNotEmpty) {
      score += 0.1 * (overlap.length / promptKeywords.length).clamp(0.0, 0.3);
    }

    return score.clamp(0.0, 1.0);
  }

  /// Check cache for response
  _CacheEntry? _checkCache(String prompt) {
    final key = _cacheKey(prompt);
    final entry = _cache[key];

    if (entry != null && !entry.isExpired(_config.cacheTTL)) {
      return entry;
    }

    // Remove expired entry
    if (entry != null) {
      _cache.remove(key);
    }

    return null;
  }

  /// Add response to cache
  void _addToCache(String prompt, String response, QueryComplexity complexity) {
    // Enforce cache size limit
    if (_cache.length >= _config.maxCacheSize) {
      // Remove oldest entry
      final oldestKey = _cache.entries
          .reduce((a, b) =>
              a.value.timestamp.isBefore(b.value.timestamp) ? a : b)
          .key;
      _cache.remove(oldestKey);
    }

    _cache[_cacheKey(prompt)] = _CacheEntry(
      response: response,
      timestamp: DateTime.now(),
      complexity: complexity,
    );
  }

  /// Generate cache key
  String _cacheKey(String prompt) {
    // Simple hash for cache key
    return prompt.toLowerCase().trim().hashCode.toString();
  }

  /// Generate fallback response
  Future<HybridAIResult> _fallbackResponse(
    String prompt,
    QueryComplexity complexity,
    Stopwatch stopwatch,
  ) async {
    _fallbacks++;
    stopwatch.stop();

    final fallbackText = _generateFallbackText(prompt);

    return HybridAIResult(
      text: fallbackText,
      source: ResponseSource.fallback,
      latencyMs: stopwatch.elapsedMilliseconds,
      complexity: complexity,
      confidenceScore: 0.3,
    );
  }

  /// Generate fallback text
  String _generateFallbackText(String prompt) {
    final normalized = prompt.toLowerCase();

    if (normalized.contains('goal')) {
      return 'Setting clear goals is the first step to achievement. '
          'Break down your goal into smaller, actionable steps and track your progress regularly.';
    }

    if (normalized.contains('habit')) {
      return 'Building habits takes time and consistency. '
          'Start small, stay consistent, and celebrate small wins along the way.';
    }

    if (normalized.contains('motivat')) {
      return 'Motivation comes and goes, but discipline stays. '
          'Focus on why you started and take one small step forward today.';
    }

    return 'I am here to help you on your coaching journey. '
        'Could you rephrase your question so I can provide better guidance?';
  }

  /// Get routing analytics
  Map<String, dynamic> getAnalytics() {
    return {
      'totalRequests': _totalRequests,
      'localRequests': _localRequests,
      'serverRequests': _serverRequests,
      'cacheHits': _cacheHits,
      'fallbacks': _fallbacks,
      'localRate': _totalRequests > 0 ? _localRequests / _totalRequests : 0.0,
      'cacheHitRate': _totalRequests > 0 ? _cacheHits / _totalRequests : 0.0,
      'fallbackRate': _totalRequests > 0 ? _fallbacks / _totalRequests : 0.0,
      'cacheSize': _cache.length,
    };
  }

  /// Clear cache
  void clearCache() {
    _cache.clear();
  }

  /// Reset analytics
  void resetAnalytics() {
    _totalRequests = 0;
    _localRequests = 0;
    _serverRequests = 0;
    _cacheHits = 0;
    _fallbacks = 0;
  }
}
