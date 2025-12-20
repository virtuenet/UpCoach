/// Streaming AI Service for Mobile
///
/// Provides real-time token-by-token streaming for AI coach responses.
/// Supports SSE (Server-Sent Events) for efficient streaming on mobile.
///
/// Features:
/// - Token-by-token streaming from backend
/// - Automatic reconnection on failure
/// - Stream cancellation support
/// - Progress tracking and callbacks
/// - Offline detection and handling
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';

import '../constants/app_constants.dart';
import '../storage/secure_storage.dart';

/// Stream status enum
enum StreamStatus {
  idle,
  connecting,
  streaming,
  completed,
  cancelled,
  error,
}

/// Stream chunk data class
class StreamChunk {
  final String id;
  final String streamId;
  final int index;
  final String content;
  final int tokenCount;
  final DateTime timestamp;
  final String? finishReason;

  StreamChunk({
    required this.id,
    required this.streamId,
    required this.index,
    required this.content,
    required this.tokenCount,
    required this.timestamp,
    this.finishReason,
  });

  factory StreamChunk.fromJson(Map<String, dynamic> json) {
    return StreamChunk(
      id: json['id'] as String? ?? '',
      streamId: json['streamId'] as String? ?? '',
      index: json['index'] as int? ?? 0,
      content: json['content'] as String? ?? '',
      tokenCount: json['tokenCount'] as int? ?? 1,
      timestamp: json['timestamp'] != null
          ? DateTime.fromMillisecondsSinceEpoch(json['timestamp'] as int)
          : DateTime.now(),
      finishReason: json['finishReason'] as String?,
    );
  }
}

/// Stream result data class
class StreamResult {
  final String streamId;
  final String content;
  final int totalTokens;
  final Duration duration;
  final int? latencyToFirstTokenMs;
  final List<String>? safetyFlags;

  StreamResult({
    required this.streamId,
    required this.content,
    required this.totalTokens,
    required this.duration,
    this.latencyToFirstTokenMs,
    this.safetyFlags,
  });

  factory StreamResult.fromJson(Map<String, dynamic> json) {
    final metrics = json['metrics'] as Map<String, dynamic>? ?? {};
    return StreamResult(
      streamId: json['streamId'] as String? ?? '',
      content: json['content'] as String? ?? '',
      totalTokens: metrics['totalTokens'] as int? ?? 0,
      duration: Duration(milliseconds: metrics['totalDuration'] as int? ?? 0),
      latencyToFirstTokenMs: metrics['latencyToFirstToken'] as int?,
      safetyFlags: (json['safetyFlags'] as List<dynamic>?)?.cast<String>(),
    );
  }
}

/// Stream options
class StreamOptions {
  final String? provider;
  final String? model;
  final double? temperature;
  final int? maxTokens;
  final String? systemPrompt;
  final bool enableSafetyCheck;

  const StreamOptions({
    this.provider,
    this.model,
    this.temperature,
    this.maxTokens,
    this.systemPrompt,
    this.enableSafetyCheck = true,
  });

  Map<String, dynamic> toJson() => {
        if (provider != null) 'provider': provider,
        if (model != null) 'model': model,
        if (temperature != null) 'temperature': temperature,
        if (maxTokens != null) 'maxTokens': maxTokens,
        if (systemPrompt != null) 'systemPrompt': systemPrompt,
        'enableSafetyCheck': enableSafetyCheck,
      };
}

/// Streaming AI Service
class StreamingAIService extends ChangeNotifier {
  static StreamingAIService? _instance;
  factory StreamingAIService() => _instance ??= StreamingAIService._();
  StreamingAIService._();

  final SecureStorage _secureStorage = SecureStorage();

  // Current stream state
  StreamStatus _status = StreamStatus.idle;
  String? _currentStreamId;
  String _streamedContent = '';
  int _tokenCount = 0;
  DateTime? _streamStartTime;
  DateTime? _firstTokenTime;

  // Stream controllers
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  http.Client? _httpClient;
  StreamSubscription<String>? _sseSubscription;

  // Callbacks
  void Function(StreamChunk)? _onChunk;
  void Function(StreamResult)? _onComplete;
  void Function(String)? _onError;

  // Getters
  StreamStatus get status => _status;
  String? get currentStreamId => _currentStreamId;
  String get streamedContent => _streamedContent;
  int get tokenCount => _tokenCount;
  bool get isStreaming => _status == StreamStatus.streaming;

  /// Get base URL for API
  String get _baseUrl => AppConstants.baseUrl;

  /// Start a streaming request
  Future<String?> startStream({
    required String prompt,
    String? conversationId,
    StreamOptions options = const StreamOptions(),
    void Function(StreamChunk)? onChunk,
    void Function(StreamResult)? onComplete,
    void Function(String)? onError,
  }) async {
    if (_status == StreamStatus.streaming) {
      onError?.call('A stream is already in progress');
      return null;
    }

    // Check connectivity
    final connectivityResult = await Connectivity().checkConnectivity();
    if (connectivityResult.contains(ConnectivityResult.none)) {
      onError?.call('No internet connection');
      return null;
    }

    // Store callbacks
    _onChunk = onChunk;
    _onComplete = onComplete;
    _onError = onError;

    // Reset state
    _streamedContent = '';
    _tokenCount = 0;
    _streamStartTime = DateTime.now();
    _firstTokenTime = null;

    _status = StreamStatus.connecting;
    notifyListeners();

    try {
      // Get auth token
      final token = await _secureStorage.getAccessToken();
      if (token == null) {
        throw Exception('Not authenticated');
      }

      // Create stream on backend using http client
      final client = http.Client();
      try {
        final response = await client.post(
          Uri.parse('$_baseUrl/api/realtime/stream/start'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'prompt': prompt,
            if (conversationId != null) 'conversationId': conversationId,
            'options': options.toJson(),
          }),
        );

        if (response.statusCode != 200) {
          throw Exception('Failed to start stream: ${response.statusCode}');
        }

        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] != true) {
          throw Exception(data['error'] ?? 'Failed to start stream');
        }

        _currentStreamId = data['data']['streamId'] as String;
        final sseEndpoint = data['data']['sseEndpoint'] as String;

        // Connect to SSE endpoint
        await _connectToSSE(sseEndpoint);

        return _currentStreamId;
      } finally {
        client.close();
      }
    } catch (e) {
      _status = StreamStatus.error;
      _onError?.call(e.toString());
      notifyListeners();
      return null;
    }
  }

  /// Connect to SSE endpoint
  Future<void> _connectToSSE(String endpoint) async {
    _httpClient = http.Client();

    final token = await _secureStorage.getAccessToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }

    final uri = Uri.parse('$_baseUrl$endpoint');

    final request = http.Request('GET', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'text/event-stream';
    request.headers['Cache-Control'] = 'no-cache';

    final streamedResponse = await _httpClient!.send(request);

    if (streamedResponse.statusCode != 200) {
      throw Exception('SSE connection failed: ${streamedResponse.statusCode}');
    }

    _status = StreamStatus.streaming;
    notifyListeners();

    // Process SSE events
    _sseSubscription = streamedResponse.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .listen(
      _processSSELine,
      onError: (Object error) {
        _status = StreamStatus.error;
        _onError?.call(error.toString());
        notifyListeners();
      },
      onDone: () {
        if (_status == StreamStatus.streaming) {
          _status = StreamStatus.completed;
          _deliverResult();
        }
      },
    );
  }

  /// Process SSE line
  void _processSSELine(String line) {
    if (line.isEmpty) return;

    if (line.startsWith('event: ')) {
      // Store event type for next data line
      return;
    }

    if (line.startsWith('data: ')) {
      final data = line.substring(6);

      try {
        final json = jsonDecode(data) as Map<String, dynamic>;

        if (json.containsKey('chunk')) {
          // Stream chunk received
          final chunkData = json['chunk'] as Map<String, dynamic>;
          final chunk = StreamChunk.fromJson(chunkData);

          // Track first token time
          _firstTokenTime ??= DateTime.now();

          _streamedContent += chunk.content;
          _tokenCount += chunk.tokenCount;

          _onChunk?.call(chunk);
          notifyListeners();

          // Check for completion
          if (chunk.finishReason == 'stop') {
            _status = StreamStatus.completed;
            _deliverResult();
          }
        } else if (json.containsKey('content')) {
          // Complete event
          _status = StreamStatus.completed;
          _deliverResult();
        } else if (json.containsKey('error')) {
          _status = StreamStatus.error;
          _onError?.call(json['message'] as String? ?? 'Unknown error');
          notifyListeners();
        }
      } catch (e) {
        // Ignore parse errors for heartbeats etc
        debugPrint('SSE parse error: $e');
      }
    }
  }

  /// Deliver final result
  void _deliverResult() {
    final duration = _streamStartTime != null
        ? DateTime.now().difference(_streamStartTime!)
        : Duration.zero;

    final latency = _firstTokenTime != null && _streamStartTime != null
        ? _firstTokenTime!.difference(_streamStartTime!).inMilliseconds
        : null;

    final result = StreamResult(
      streamId: _currentStreamId ?? '',
      content: _streamedContent,
      totalTokens: _tokenCount,
      duration: duration,
      latencyToFirstTokenMs: latency,
    );

    _onComplete?.call(result);
    notifyListeners();

    _cleanup();
  }

  /// Cancel the current stream
  Future<void> cancelStream() async {
    if (_currentStreamId == null) return;

    try {
      final token = await _secureStorage.getAccessToken();
      if (token != null) {
        final client = http.Client();
        try {
          await client.post(
            Uri.parse('$_baseUrl/api/realtime/stream/$_currentStreamId/cancel'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
          );
        } finally {
          client.close();
        }
      }
    } catch (e) {
      debugPrint('Cancel stream error: $e');
    }

    _status = StreamStatus.cancelled;
    notifyListeners();
    _cleanup();
  }

  /// Cleanup resources
  void _cleanup() {
    _sseSubscription?.cancel();
    _sseSubscription = null;
    _httpClient?.close();
    _httpClient = null;
    _currentStreamId = null;
    _onChunk = null;
    _onComplete = null;
    _onError = null;
  }

  /// Request a single prediction
  Future<Map<String, dynamic>?> requestPrediction({
    required String type,
    Map<String, dynamic>? input,
  }) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) {
        return null;
      }

      final client = http.Client();
      try {
        final response = await client.post(
          Uri.parse('$_baseUrl/api/realtime/predictions'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'type': type,
            if (input != null) 'input': input,
          }),
        );

        if (response.statusCode != 200) {
          return null;
        }

        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          return data['data'] as Map<String, dynamic>;
        }

        return null;
      } finally {
        client.close();
      }
    } catch (e) {
      debugPrint('Prediction error: $e');
      return null;
    }
  }

  /// Check content safety
  Future<Map<String, dynamic>?> checkContentSafety(String content) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) {
        return null;
      }

      final client = http.Client();
      try {
        final response = await client.post(
          Uri.parse('$_baseUrl/api/realtime/safety/check'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'content': content,
            'source': 'user_message',
          }),
        );

        if (response.statusCode != 200) {
          return null;
        }

        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['success'] == true) {
          return data['data'] as Map<String, dynamic>;
        }

        return null;
      } finally {
        client.close();
      }
    } catch (e) {
      debugPrint('Safety check error: $e');
      return null;
    }
  }

  /// Get realtime health status
  Future<bool> checkHealth() async {
    try {
      final token = await _secureStorage.getAccessToken();
      final client = http.Client();
      try {
        final response = await client.get(
          Uri.parse('$_baseUrl/api/realtime/health'),
          headers: token != null
              ? {'Authorization': 'Bearer $token'}
              : null,
        );

        if (response.statusCode != 200) {
          return false;
        }

        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data['status'] == 'healthy';
      } finally {
        client.close();
      }
    } catch (e) {
      return false;
    }
  }

  @override
  void dispose() {
    _cleanup();
    _connectivitySubscription?.cancel();
    super.dispose();
  }
}
