import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:queue/queue.dart';
import '../../features/ai/domain/models/ai_response.dart';
import 'api_service.dart';
import 'auth_service.dart';

/// Manages offline AI operations and queue for sync when online
class OfflineAIService {
  static const String _offlineQueueKey = 'offline_ai_queue';
  static const String _conversationCacheKey = 'offline_conversations';
  static const int _maxQueueSize = 100;
  static const int _maxRetries = 3;
  
  final ApiService _apiService;
  final AuthService _authService;
  final Queue _processingQueue = Queue(parallel: 1);
  
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  final _offlineQueue = <PendingAIRequest>[];
  final _responseCache = <String, AIResponse>{};
  bool _isProcessingQueue = false;
  
  OfflineAIService({
    required ApiService apiService,
    required AuthService authService,
  })  : _apiService = apiService,
        _authService = authService {
    _initialize();
  }
  
  Future<void> _initialize() async {
    // Load offline queue from storage
    await _loadOfflineQueue();
    
    // Listen to connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      (results) {
        final isOnline = results.any((result) => result != ConnectivityResult.none);
        if (isOnline && !_isProcessingQueue) {
          _processOfflineQueue();
        }
      },
    );
    
    // Process queue on startup if online
    _checkAndProcessQueue();
  }
  
  void dispose() {
    _connectivitySubscription?.cancel();
  }
  
  /// Queue an AI request for later processing
  Future<void> queueRequest(PendingAIRequest request) async {
    if (_offlineQueue.length >= _maxQueueSize) {
      // Remove oldest non-priority requests
      _offlineQueue.removeWhere((r) => !r.isPriority);
      
      if (_offlineQueue.length >= _maxQueueSize) {
        throw Exception('Offline queue is full. Please sync when online.');
      }
    }
    
    _offlineQueue.add(request);
    await _saveOfflineQueue();
  }
  
  /// Process a message with offline fallback
  Future<AIResponse> processMessageWithFallback({
    required String message,
    String? conversationId,
    String? sessionId,
    bool allowOffline = true,
  }) async {
    try {
      // Try online processing first
      if (await _isOnline()) {
        final response = await _sendOnlineMessage(
          message: message,
          conversationId: conversationId,
          sessionId: sessionId,
        );
        
        // Cache successful response
        _cacheResponse(message, response);
        
        return response;
      }
    } catch (e) {
      print('Online processing failed: $e');
    }
    
    // Fallback to offline processing
    if (allowOffline) {
      return await _processOfflineMessage(
        message: message,
        conversationId: conversationId,
        sessionId: sessionId,
      );
    }
    
    throw Exception('Unable to process message. Please check your connection.');
  }
  
  /// Process message offline
  Future<AIResponse> _processOfflineMessage({
    required String message,
    String? conversationId,
    String? sessionId,
  }) async {
    // Check if we have a cached response for similar message
    final cachedResponse = _getCachedResponse(message);
    if (cachedResponse != null) {
      return cachedResponse;
    }
    
    // Generate offline response
    final offlineResponse = _generateOfflineResponse(message);
    
    // Queue for sync when online
    final request = PendingAIRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      message: message,
      conversationId: conversationId,
      sessionId: sessionId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      timestamp: DateTime.now(),
      retryCount: 0,
    );
    
    await queueRequest(request);
    
    return offlineResponse;
  }
  
  /// Generate intelligent offline response
  AIResponse _generateOfflineResponse(String message) {
    // Analyze message intent for better offline response
    final lowerMessage = message.toLowerCase();
    String responseContent;
    
    if (lowerMessage.contains('how') || lowerMessage.contains('what')) {
      responseContent = 'I\'m currently offline, but I\'ve saved your question. I\'ll provide a detailed answer once connection is restored. In the meantime, consider reflecting on what specific aspects you\'d like to explore.';
    } else if (lowerMessage.contains('goal') || lowerMessage.contains('achieve')) {
      responseContent = 'Your goal-related message has been saved. While offline, take a moment to break down your goal into smaller, actionable steps. I\'ll help you refine them when we reconnect.';
    } else if (lowerMessage.contains('feel') || lowerMessage.contains('emotion')) {
      responseContent = 'I understand you want to discuss your feelings. Your message is saved and I\'ll respond thoughtfully when online. Meanwhile, consider journaling your thoughts - it can be very helpful.';
    } else if (lowerMessage.contains('help') || lowerMessage.contains('advice')) {
      responseContent = 'I\'ve noted your request for help. While offline, remember that you have inner wisdom. What would you advise a friend in your situation? I\'ll provide personalized guidance once connected.';
    } else {
      responseContent = 'I\'m currently offline but your message has been saved. I\'ll provide a thoughtful response as soon as connection is restored. Your coaching journey continues!';
    }
    
    return AIResponse(
      content: responseContent,
      sessionId: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'assistant',
      timestamp: DateTime.now(),
      metadata: {
        'offline': true,
        'queued': true,
        'originalMessage': message,
      },
    );
  }
  
  /// Process offline queue when online
  Future<void> _processOfflineQueue() async {
    if (_isProcessingQueue || _offlineQueue.isEmpty) return;
    
    _isProcessingQueue = true;
    final processedRequests = <String>[];
    
    try {
      for (final request in List.from(_offlineQueue)) {
        if (request.retryCount >= _maxRetries) {
          processedRequests.add(request.id);
          continue;
        }
        
        try {
          await _processingQueue.add(() async {
            final response = await _sendOnlineMessage(
              message: request.message,
              conversationId: request.conversationId,
              sessionId: request.sessionId,
            );
            
            // Store response for user to see
            await _storeProcessedResponse(request, response);
            processedRequests.add(request.id);
          });
        } catch (e) {
          // Increment retry count
          request.retryCount++;
          print('Failed to process queued request ${request.id}: $e');
        }
      }
      
      // Remove processed requests
      _offlineQueue.removeWhere((r) => processedRequests.contains(r.id));
      await _saveOfflineQueue();
      
    } finally {
      _isProcessingQueue = false;
    }
  }
  
  /// Send message online with error handling
  Future<AIResponse> _sendOnlineMessage({
    required String message,
    String? conversationId,
    String? sessionId,
  }) async {
    final response = await _apiService.post(
      '/api/chat/message',
      data: {
        'content': message,
        'conversationId': conversationId,
        'aiProvider': 'openai',
      },
    );
    
    if (response.data['success'] == true && response.data['data'] != null) {
      final aiMessage = response.data['data']['aiMessage'];
      return AIResponse(
        content: aiMessage['content'] ?? '',
        sessionId: sessionId ?? response.data['data']['conversationId'],
        conversationId: response.data['data']['conversationId'],
        role: 'assistant',
        timestamp: DateTime.parse(aiMessage['created_at'] ?? DateTime.now().toIso8601String()),
        metadata: aiMessage['metadata'],
      );
    }
    
    throw Exception('Invalid response from server');
  }
  
  /// Check if online with actual API test
  Future<bool> _isOnline() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult.every((result) => result == ConnectivityResult.none)) {
        return false;
      }
      
      // Test actual API connectivity
      final response = await _apiService.get(
        '/api/health',
        options: Options(
          sendTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
        ),
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  /// Cache response for offline use
  void _cacheResponse(String message, AIResponse response) {
    final cacheKey = _generateCacheKey(message);
    _responseCache[cacheKey] = response;
    
    // Limit cache size
    if (_responseCache.length > 50) {
      final keysToRemove = _responseCache.keys.take(_responseCache.length - 50).toList();
      for (final key in keysToRemove) {
        _responseCache.remove(key);
      }
    }
    
    _saveCacheToStorage();
  }
  
  /// Get cached response for similar message
  AIResponse? _getCachedResponse(String message) {
    final cacheKey = _generateCacheKey(message);
    
    // Exact match
    if (_responseCache.containsKey(cacheKey)) {
      final cached = _responseCache[cacheKey]!;
      return cached.copyWith(
        metadata: {
          ...?cached.metadata,
          'cached': true,
          'cachedAt': DateTime.now().toIso8601String(),
        },
      );
    }
    
    // Fuzzy match for similar messages
    for (final entry in _responseCache.entries) {
      if (_calculateSimilarity(message, entry.key) > 0.8) {
        return entry.value.copyWith(
          metadata: {
            ...?entry.value.metadata,
            'cached': true,
            'fuzzyMatch': true,
          },
        );
      }
    }
    
    return null;
  }
  
  /// Generate cache key from message
  String _generateCacheKey(String message) {
    return message.toLowerCase().trim().replaceAll(RegExp(r'\s+'), ' ');
  }
  
  /// Calculate message similarity (simple implementation)
  double _calculateSimilarity(String s1, String s2) {
    final words1 = s1.toLowerCase().split(' ').toSet();
    final words2 = s2.toLowerCase().split(' ').toSet();
    
    final intersection = words1.intersection(words2).length;
    final union = words1.union(words2).length;
    
    return union > 0 ? intersection / union : 0.0;
  }
  
  /// Store processed response for user retrieval
  Future<void> _storeProcessedResponse(PendingAIRequest request, AIResponse response) async {
    final prefs = await SharedPreferences.getInstance();
    final key = 'processed_response_${request.id}';
    
    await prefs.setString(key, jsonEncode({
      'request': request.toJson(),
      'response': response.toJson(),
      'processedAt': DateTime.now().toIso8601String(),
    }));
  }
  
  /// Load offline queue from storage
  Future<void> _loadOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = prefs.getString(_offlineQueueKey);
      
      if (queueJson != null) {
        final queueList = jsonDecode(queueJson) as List;
        _offlineQueue.clear();
        _offlineQueue.addAll(
          queueList.map((json) => PendingAIRequest.fromJson(json)),
        );
      }
    } catch (e) {
      print('Error loading offline queue: $e');
    }
  }
  
  /// Save offline queue to storage
  Future<void> _saveOfflineQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final queueJson = jsonEncode(
        _offlineQueue.map((r) => r.toJson()).toList(),
      );
      await prefs.setString(_offlineQueueKey, queueJson);
    } catch (e) {
      print('Error saving offline queue: $e');
    }
  }
  
  /// Save response cache to storage
  Future<void> _saveCacheToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = jsonEncode(
        _responseCache.map((key, value) => MapEntry(key, value.toJson())),
      );
      await prefs.setString(_conversationCacheKey, cacheJson);
    } catch (e) {
      print('Error saving cache: $e');
    }
  }
  
  /// Check and process queue on startup
  Future<void> _checkAndProcessQueue() async {
    await Future.delayed(const Duration(seconds: 2));
    
    if (await _isOnline()) {
      _processOfflineQueue();
    }
  }
  
  /// Get queue status
  Map<String, dynamic> getQueueStatus() {
    return {
      'queueSize': _offlineQueue.length,
      'isProcessing': _isProcessingQueue,
      'cacheSize': _responseCache.length,
      'pendingPriority': _offlineQueue.where((r) => r.isPriority).length,
    };
  }
  
  /// Clear offline queue
  Future<void> clearQueue() async {
    _offlineQueue.clear();
    await _saveOfflineQueue();
  }
}

/// Represents a pending AI request
class PendingAIRequest {
  final String id;
  final String message;
  final String? conversationId;
  final String? sessionId;
  final DateTime timestamp;
  int retryCount;
  final bool isPriority;
  
  PendingAIRequest({
    required this.id,
    required this.message,
    this.conversationId,
    this.sessionId,
    required this.timestamp,
    this.retryCount = 0,
    this.isPriority = false,
  });
  
  Map<String, dynamic> toJson() => {
    'id': id,
    'message': message,
    'conversationId': conversationId,
    'sessionId': sessionId,
    'timestamp': timestamp.toIso8601String(),
    'retryCount': retryCount,
    'isPriority': isPriority,
  };
  
  factory PendingAIRequest.fromJson(Map<String, dynamic> json) => PendingAIRequest(
    id: json['id'],
    message: json['message'],
    conversationId: json['conversationId'],
    sessionId: json['sessionId'],
    timestamp: DateTime.parse(json['timestamp']),
    retryCount: json['retryCount'] ?? 0,
    isPriority: json['isPriority'] ?? false,
  );
}

/// Provider for offline AI service
final offlineAIServiceProvider = Provider<OfflineAIService>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  final authService = ref.watch(authServiceProvider);
  
  return OfflineAIService(
    apiService: apiService,
    authService: authService,
  );
});