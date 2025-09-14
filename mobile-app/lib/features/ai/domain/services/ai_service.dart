import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach/core/services/api_service.dart';
import 'package:upcoach/core/services/auth_service.dart';
import '../models/ai_response.dart';

final aiServiceProvider = Provider<AIService>((ref) {
  final api = ref.watch(apiServiceProvider);
  final auth = ref.watch(authServiceProvider);
  return AIService(api: api, auth: auth);
});

class AIService {
  final ApiService _api;
  final AuthService _auth;

  AIService({
    required ApiService api,
    required AuthService auth,
  })  : _api = api,
        _auth = auth;

  // Conversational AI with enhanced error handling and retry logic
  Future<AIResponse> sendMessage(String message, {
    String? sessionId,
    String? conversationId,
    int retryCount = 0,
  }) async {
    try {
      final response = await _api.post(
        '/api/chat/message',
        data: {
          'content': message,
          'conversationId': conversationId,
          'aiProvider': 'openai', // Default to OpenAI, can be made configurable
        },
        options: Options(
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      // Parse the enhanced backend response structure
      final responseData = response.data;
      if (responseData['success'] == true && responseData['data'] != null) {
        final aiMessage = responseData['data']['aiMessage'];
        return AIResponse(
          content: aiMessage['content'] ?? '',
          sessionId: sessionId ?? responseData['data']['conversationId'],
          conversationId: responseData['data']['conversationId'],
          role: 'assistant',
          timestamp: DateTime.parse(aiMessage['created_at'] ?? DateTime.now().toIso8601String()),
          metadata: aiMessage['metadata'],
        );
      } else {
        throw Exception('Invalid response format from AI service');
      }
    } on DioException catch (e) {
      // Implement retry logic for transient errors
      if (retryCount < 2 && _isRetriableError(e)) {
        await Future.delayed(Duration(seconds: retryCount + 1));
        return sendMessage(
          message,
          sessionId: sessionId,
          conversationId: conversationId,
          retryCount: retryCount + 1,
        );
      }
      
      // Log error for monitoring
      _logAIError('sendMessage', e, {'message': message, 'sessionId': sessionId});
      
      // Return fallback response for offline mode
      if (_isOfflineError(e)) {
        return _getOfflineFallbackResponse(message, sessionId);
      }
      
      throw _handleAIServiceError(e);
    } catch (e) {
      _logAIError('sendMessage', e, {'message': message, 'sessionId': sessionId});
      rethrow;
    }
  }

  Future<AIResponse> getSmartResponse(
    String message, {
    List<Map<String, String>>? conversationHistory,
    String? conversationId,
  }) async {
    try {
      // Create or get conversation if not provided
      String? activeConversationId = conversationId;
      
      if (activeConversationId == null) {
        final createResponse = await _api.post(
          '/api/chat/conversations',
          data: {
            'title': message.length > 50 ? message.substring(0, 47) + '...' : message,
          },
        );
        
        if (createResponse.data['success'] == true) {
          activeConversationId = createResponse.data['data']['conversation']['id'];
        }
      }
      
      // Send message with conversation context
      final response = await _api.post(
        '/api/chat/message',
        data: {
          'content': message,
          'conversationId': activeConversationId,
          'aiProvider': 'openai',
        },
        options: Options(
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      // Parse enhanced response with performance metrics
      final responseData = response.data;
      if (responseData['success'] == true && responseData['data'] != null) {
        final aiMessage = responseData['data']['aiMessage'];
        
        // Track performance metrics
        _trackAIPerformance({
          'responseTime': DateTime.now().millisecondsSinceEpoch,
          'tokens': aiMessage['metadata']?['tokens'] ?? 0,
          'provider': aiMessage['metadata']?['provider'] ?? 'openai',
        });
        
        return AIResponse(
          content: aiMessage['content'] ?? '',
          sessionId: activeConversationId,
          conversationId: activeConversationId,
          role: 'assistant',
          timestamp: DateTime.parse(aiMessage['created_at'] ?? DateTime.now().toIso8601String()),
          metadata: {
            ...?aiMessage['metadata'],
            'conversationHistory': conversationHistory,
          },
        );
      } else {
        throw Exception('Invalid response format from AI service');
      }
    } on DioException catch (e) {
      _logAIError('getSmartResponse', e, {'message': message});
      
      if (_isOfflineError(e)) {
        return _getOfflineFallbackResponse(message, conversationId);
      }
      
      throw _handleAIServiceError(e);
    } catch (e) {
      _logAIError('getSmartResponse', e, {'message': message});
      rethrow;
    }
  }

  // Recommendations
  Future<List<AIRecommendation>> getRecommendations() async {
    final response = await _api.get('/ai/recommendations');
    final data = response.data['data'] as Map<String, dynamic>;
    
    final recommendations = <AIRecommendation>[];
    
    // Parse different recommendation types
    if (data['goals'] != null) {
      recommendations.addAll(
        (data['goals'] as List).map(
          (g) => AIRecommendation(
            id: g['id'],
            type: 'goal',
            title: g['title'],
            description: g['description'] ?? '',
            priority: (g['priority'] ?? 0.5).toDouble(),
            data: g,
          ),
        ),
      );
    }
    
    if (data['habits'] != null) {
      recommendations.addAll(
        (data['habits'] as List).map(
          (h) => AIRecommendation(
            id: h['id'],
            type: 'habit',
            title: h['name'],
            description: h['description'] ?? '',
            priority: (h['importance'] ?? 0.5).toDouble(),
            data: h,
          ),
        ),
      );
    }
    
    if (data['activities'] != null) {
      recommendations.addAll(
        (data['activities'] as List).map(
          (a) => AIRecommendation(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            type: 'activity',
            title: a,
            description: 'Recommended activity',
            priority: 0.7,
          ),
        ),
      );
    }
    
    return recommendations;
  }

  Future<Map<String, dynamic>> getOptimalTiming(String activityType) async {
    final response = await _api.get('/ai/recommendations/timing/$activityType');
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getAdaptiveSchedule() async {
    final response = await _api.get('/ai/recommendations/schedule');
    return response.data['data'];
  }

  // Predictions
  Future<List<AIPrediction>> getPredictions() async {
    final response = await _api.get('/ai/predictions');
    final data = response.data['data'] as Map<String, dynamic>;
    
    final predictions = <AIPrediction>[];
    
    if (data['adherence'] != null) {
      predictions.add(AIPrediction(
        type: 'adherence',
        probability: data['adherence']['probability'].toDouble(),
        description: data['adherence']['trend'],
        factors: List<String>.from(data['adherence']['factors'] ?? []),
      ));
    }
    
    if (data['engagement'] != null) {
      predictions.add(AIPrediction(
        type: 'engagement',
        probability: data['engagement']['score'].toDouble(),
        description: data['engagement']['prediction'],
        metadata: data['engagement'],
      ));
    }
    
    if (data['burnout'] != null) {
      predictions.add(AIPrediction(
        type: 'burnout',
        probability: data['burnout']['risk'].toDouble(),
        description: data['burnout']['level'],
        factors: List<String>.from(data['burnout']['indicators'] ?? []),
      ));
    }
    
    return predictions;
  }

  Future<Map<String, dynamic>> predictGoalCompletion(String goalId) async {
    final response = await _api.get('/ai/predictions/goal/$goalId');
    return response.data['data'];
  }

  // Voice AI
  Future<VoiceAnalysis> analyzeVoice(File audioFile) async {
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(
        audioFile.path,
        filename: 'voice_recording.wav',
      ),
      'userId': _auth.currentUser?.id,
    });

    final response = await _api.post(
      '/ai/voice/analyze',
      data: formData,
    );
    
    return VoiceAnalysis.fromJson(response.data['data']);
  }

  Future<Map<String, dynamic>> getVoiceCoaching(String sessionId) async {
    final response = await _api.post(
      '/ai/voice/coaching',
      data: {'sessionId': sessionId},
    );
    return response.data['data'];
  }

  Future<List<Map<String, dynamic>>> getVoiceInsights() async {
    final response = await _api.get('/ai/voice/insights');
    return List<Map<String, dynamic>>.from(response.data['data']);
  }

  // Learning Paths
  Future<LearningPath> createLearningPath(
    String topic, {
    Map<String, dynamic>? preferences,
  }) async {
    final response = await _api.post(
      '/ai/learning/path',
      data: {
        'topic': topic,
        'preferences': preferences ?? {},
        'userId': _auth.currentUser?.id,
      },
    );
    return LearningPath.fromJson(response.data['data']);
  }

  Future<List<LearningPath>> getLearningPaths() async {
    final response = await _api.get('/ai/learning/paths');
    return (response.data['data'] as List)
        .map((p) => LearningPath.fromJson(p))
        .toList();
  }

  Future<Map<String, dynamic>> trackLearningProgress(
    String pathId,
    String moduleId, {
    required bool completed,
    double? score,
    int? timeSpent,
  }) async {
    final response = await _api.post(
      '/ai/learning/path/$pathId/module/$moduleId/progress',
      data: {
        'completed': completed,
        'score': score,
        'timeSpent': timeSpent,
      },
    );
    return response.data['data'];
  }

  Future<LearningModule?> getNextModule(String pathId) async {
    final response = await _api.get('/ai/learning/path/$pathId/next-module');
    final data = response.data['data'];
    return data != null ? LearningModule.fromJson(data) : null;
  }

  // Insights
  Future<Map<String, dynamic>> getInsightReport() async {
    final response = await _api.get('/ai/insights/report');
    return response.data['data'];
  }

  Future<List<Map<String, dynamic>>> getActiveInsights() async {
    final response = await _api.get('/ai/insights/active');
    return List<Map<String, dynamic>>.from(response.data['data']);
  }

  Future<void> dismissInsight(String insightId, {String? reason}) async {
    await _api.post(
      '/ai/insights/$insightId/dismiss',
      data: {'reason': reason},
    );
  }

  // Enhanced error handling and monitoring methods
  bool _isRetriableError(DioException error) {
    return error.type == DioExceptionType.connectionTimeout ||
           error.type == DioExceptionType.receiveTimeout ||
           (error.response?.statusCode ?? 0) >= 500;
  }

  bool _isOfflineError(DioException error) {
    return error.type == DioExceptionType.connectionError ||
           error.type == DioExceptionType.unknown && error.error is SocketException;
  }

  AIResponse _getOfflineFallbackResponse(String message, String? sessionId) {
    return AIResponse(
      content: 'I\'m currently offline, but your message has been saved. I\'ll respond as soon as connection is restored.',
      sessionId: sessionId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'assistant',
      timestamp: DateTime.now(),
      metadata: {
        'offline': true,
        'savedForSync': true,
      },
    );
  }

  Exception _handleAIServiceError(DioException error) {
    if (error.response?.statusCode == 429) {
      final resetTime = error.response?.data?['resetTime'] ?? 60;
      return Exception('Too many requests. Please wait $resetTime seconds.');
    } else if (error.response?.statusCode == 400) {
      return Exception(error.response?.data?['message'] ?? 'Invalid request');
    } else if (error.response?.statusCode == 401) {
      return Exception('Authentication required. Please sign in again.');
    } else {
      return Exception('AI service temporarily unavailable. Please try again.');
    }
  }

  void _logAIError(String method, dynamic error, Map<String, dynamic> context) {
    // In production, this would send to a logging service
    print('[AI Service Error] $method: $error');
    print('Context: $context');
  }

  void _trackAIPerformance(Map<String, dynamic> metrics) {
    // In production, this would send to analytics/monitoring service
    print('[AI Performance] $metrics');
  }

  // Get conversation history for context
  Future<List<Map<String, String>>> getConversationHistory(String conversationId) async {
    try {
      final response = await _api.get('/api/chat/conversations/$conversationId');
      
      if (response.data['success'] == true && response.data['data'] != null) {
        final messages = response.data['data']['conversation']['messages'] as List;
        
        return messages.map<Map<String, String>>((msg) => {
          'role': msg['is_from_user'] ? 'user' : 'assistant',
          'content': msg['content'] ?? '',
        }).toList();
      }
      
      return [];
    } catch (e) {
      _logAIError('getConversationHistory', e, {'conversationId': conversationId});
      return [];
    }
  }

  // Create new conversation
  Future<String?> createConversation({String? title}) async {
    try {
      final response = await _api.post(
        '/api/chat/conversations',
        data: {'title': title ?? 'New AI Coaching Session'},
      );
      
      if (response.data['success'] == true) {
        return response.data['data']['conversation']['id'];
      }
      return null;
    } catch (e) {
      _logAIError('createConversation', e, {'title': title});
      return null;
    }
  }

  // Get all conversations
  Future<List<AIConversation>> getConversations() async {
    try {
      final response = await _api.get('/api/chat/conversations');
      
      if (response.data['success'] == true && response.data['data'] != null) {
        final conversations = response.data['data']['conversations'] as List;
        
        return conversations.map((conv) => AIConversation(
          id: conv['id'],
          title: conv['title'] ?? 'Untitled',
          messageCount: conv['message_count'] ?? 0,
          lastMessageAt: conv['last_message_at'] != null 
            ? DateTime.parse(conv['last_message_at'])
            : null,
          createdAt: DateTime.parse(conv['created_at']),
        )).toList();
      }
      
      return [];
    } catch (e) {
      _logAIError('getConversations', e, {});
      return [];
    }
  }
}