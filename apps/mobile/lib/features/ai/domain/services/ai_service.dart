import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:upcoach_mobile/core/services/api_service.dart';
import 'package:upcoach_mobile/core/services/auth_service.dart';
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

  // Conversational AI
  Future<AIResponse> sendMessage(String message, {String? sessionId}) async {
    final response = await _api.post(
      '/ai/conversation/process',
      data: {
        'message': message,
        'sessionId': sessionId,
        'userId': _auth.currentUser?.id,
      },
    );
    return AIResponse.fromJson(response.data['data']);
  }

  Future<AIResponse> getSmartResponse(
    String message, {
    List<Map<String, String>>? conversationHistory,
  }) async {
    final response = await _api.post(
      '/ai/conversation/smart-response',
      data: {
        'message': message,
        'conversationHistory': conversationHistory ?? [],
        'userId': _auth.currentUser?.id,
      },
    );
    return AIResponse.fromJson(response.data['data']);
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
}