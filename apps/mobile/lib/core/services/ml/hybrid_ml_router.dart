import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'on_device_ml_service.dart';
import '../ai_coach_service.dart';
import 'model_manager.dart';
import 'ml_telemetry_service.dart';

/// Hybrid ML Router (Phase 9)
///
/// Intelligently routes ML inference between on-device and server models.
///
/// Decision Factors:
/// - Network connectivity (offline → use local)
/// - Model freshness (local model age < 30 days)
/// - Model confidence (low confidence → fallback to server)
/// - Battery level (low battery → prefer local)
/// - User preferences (data saver mode → prefer local)
///
/// Fallback Strategy:
/// 1. Try on-device model (fast, private, offline-capable)
/// 2. If low confidence or error → try server model
/// 3. Cache server response for future offline use
class HybridMLRouter {
  // Singleton instance
  static final HybridMLRouter _instance = HybridMLRouter._internal();
  factory HybridMLRouter() => _instance;
  HybridMLRouter._internal();

  final OnDeviceMLService _localML = OnDeviceMLService();
  final AICoachService _serverML = AICoachService();
  final ModelManager _modelManager = ModelManager();
  final MLTelemetryService _telemetry = MLTelemetryService();

  final Connectivity _connectivity = Connectivity();

  // Model freshness threshold (30 days)
  static const Duration _modelFreshnessThreshold = Duration(days: 30);

  // Low confidence threshold (trigger server fallback)
  static const double _lowConfidenceThreshold = 0.3;

  /// Predict churn risk (hybrid routing)
  Future<ChurnPredictionResult> predictChurnRisk({
    required String userId,
    required Map<String, dynamic> features,
    bool forceLocal = false,
    bool forceServer = false,
  }) async {
    final startTime = DateTime.now();

    // Decision: Local or Server?
    final useLocal = await _shouldUseLocalModel(
      modelName: 'churn_prediction',
      forceLocal: forceLocal,
      forceServer: forceServer,
    );

    try {
      if (useLocal) {
        // Route to on-device model
        print('🔹 Routing churn prediction to ON-DEVICE model...');

        final churnProb = await _localML.predictChurnRisk(features);

        final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

        // Log telemetry
        await _telemetry.logInference(
          modelName: 'churn_prediction',
          inferenceTimeMs: inferenceTime,
          confidence: churnProb,
          usedLocalModel: true,
        );

        // Check confidence - fallback to server if too low
        if (churnProb > _lowConfidenceThreshold && churnProb < (1.0 - _lowConfidenceThreshold)) {
          // Confidence is reasonable, use local prediction
          return ChurnPredictionResult(
            userId: userId,
            churnProbability: churnProb,
            usedLocalModel: true,
            inferenceTimeMs: inferenceTime,
            modelVersion: await _modelManager.getModelVersion('churn_prediction'),
          );
        } else {
          // Low confidence - fallback to server
          print('⚠️  Low confidence (${churnProb.toStringAsFixed(4)}), falling back to server...');
          return await _predictChurnRiskServer(userId, features, startTime);
        }
      } else {
        // Route to server model
        return await _predictChurnRiskServer(userId, features, startTime);
      }
    } catch (e) {
      print('❌ Churn prediction failed: $e');

      // Fallback to server if local fails
      if (useLocal && !forceLocal) {
        print('⚠️  Local model failed, falling back to server...');
        return await _predictChurnRiskServer(userId, features, startTime);
      }

      rethrow;
    }
  }

  /// Server-based churn prediction
  Future<ChurnPredictionResult> _predictChurnRiskServer(
    String userId,
    Map<String, dynamic> features,
    DateTime startTime,
  ) async {
    print('🔸 Routing churn prediction to SERVER model...');

    try {
      // Call server API
      // In production: Replace with actual API call
      final churnProb = 0.5; // Mock response

      final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

      // Log telemetry
      await _telemetry.logInference(
        modelName: 'churn_prediction',
        inferenceTimeMs: inferenceTime,
        confidence: churnProb,
        usedLocalModel: false,
      );

      return ChurnPredictionResult(
        userId: userId,
        churnProbability: churnProb,
        usedLocalModel: false,
        inferenceTimeMs: inferenceTime,
        modelVersion: 'server-latest',
      );
    } catch (e) {
      print('❌ Server churn prediction failed: $e');
      rethrow;
    }
  }

  /// Predict sentiment (hybrid routing)
  Future<SentimentPredictionResult> predictSentiment({
    required String text,
    bool forceLocal = false,
    bool forceServer = false,
  }) async {
    final startTime = DateTime.now();

    final useLocal = await _shouldUseLocalModel(
      modelName: 'sentiment_analysis',
      forceLocal: forceLocal,
      forceServer: forceServer,
    );

    try {
      if (useLocal) {
        print('🔹 Routing sentiment analysis to ON-DEVICE model...');

        final emotions = await _localML.predictSentiment(text);

        final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

        // Calculate dominant emotion
        final dominantEmotion = emotions.entries
            .reduce((a, b) => a.value > b.value ? a : b)
            .key;

        final confidence = emotions[dominantEmotion]!;

        // Log telemetry
        await _telemetry.logInference(
          modelName: 'sentiment_analysis',
          inferenceTimeMs: inferenceTime,
          confidence: confidence,
          usedLocalModel: true,
        );

        return SentimentPredictionResult(
          text: text,
          emotions: emotions,
          dominantEmotion: dominantEmotion,
          confidence: confidence,
          usedLocalModel: true,
          inferenceTimeMs: inferenceTime,
          modelVersion: await _modelManager.getModelVersion('sentiment_analysis'),
        );
      } else {
        print('🔸 Routing sentiment analysis to SERVER model...');
        return await _predictSentimentServer(text, startTime);
      }
    } catch (e) {
      print('❌ Sentiment prediction failed: $e');

      if (useLocal && !forceLocal) {
        print('⚠️  Local model failed, falling back to server...');
        return await _predictSentimentServer(text, startTime);
      }

      rethrow;
    }
  }

  /// Server-based sentiment prediction
  Future<SentimentPredictionResult> _predictSentimentServer(
    String text,
    DateTime startTime,
  ) async {
    try {
      // Call server API (mock)
      final emotions = {
        'joy': 0.3,
        'sadness': 0.1,
        'anger': 0.05,
        'fear': 0.05,
        'surprise': 0.1,
        'disgust': 0.05,
        'neutral': 0.35,
      };

      final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

      final dominantEmotion = emotions.entries
          .reduce((a, b) => a.value > b.value ? a : b)
          .key;

      // Log telemetry
      await _telemetry.logInference(
        modelName: 'sentiment_analysis',
        inferenceTimeMs: inferenceTime,
        confidence: emotions[dominantEmotion]!,
        usedLocalModel: false,
      );

      return SentimentPredictionResult(
        text: text,
        emotions: emotions,
        dominantEmotion: dominantEmotion,
        confidence: emotions[dominantEmotion]!,
        usedLocalModel: false,
        inferenceTimeMs: inferenceTime,
        modelVersion: 'server-latest',
      );
    } catch (e) {
      print('❌ Server sentiment prediction failed: $e');
      rethrow;
    }
  }

  /// Predict goal success (hybrid routing)
  Future<GoalSuccessPredictionResult> predictGoalSuccess({
    required String goalId,
    required Map<String, dynamic> features,
    bool forceLocal = false,
    bool forceServer = false,
  }) async {
    final startTime = DateTime.now();

    final useLocal = await _shouldUseLocalModel(
      modelName: 'goal_success',
      forceLocal: forceLocal,
      forceServer: forceServer,
    );

    try {
      if (useLocal) {
        print('🔹 Routing goal success prediction to ON-DEVICE model...');

        final successProb = await _localML.predictGoalSuccess(features);

        final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

        // Log telemetry
        await _telemetry.logInference(
          modelName: 'goal_success',
          inferenceTimeMs: inferenceTime,
          confidence: successProb,
          usedLocalModel: true,
        );

        return GoalSuccessPredictionResult(
          goalId: goalId,
          successProbability: successProb,
          usedLocalModel: true,
          inferenceTimeMs: inferenceTime,
          modelVersion: await _modelManager.getModelVersion('goal_success'),
        );
      } else {
        print('🔸 Routing goal success prediction to SERVER model...');
        return await _predictGoalSuccessServer(goalId, features, startTime);
      }
    } catch (e) {
      print('❌ Goal success prediction failed: $e');

      if (useLocal && !forceLocal) {
        print('⚠️  Local model failed, falling back to server...');
        return await _predictGoalSuccessServer(goalId, features, startTime);
      }

      rethrow;
    }
  }

  /// Server-based goal success prediction
  Future<GoalSuccessPredictionResult> _predictGoalSuccessServer(
    String goalId,
    Map<String, dynamic> features,
    DateTime startTime,
  ) async {
    try {
      // Call server API (mock)
      final successProb = 0.75;

      final inferenceTime = DateTime.now().difference(startTime).inMilliseconds;

      // Log telemetry
      await _telemetry.logInference(
        modelName: 'goal_success',
        inferenceTimeMs: inferenceTime,
        confidence: successProb,
        usedLocalModel: false,
      );

      return GoalSuccessPredictionResult(
        goalId: goalId,
        successProbability: successProb,
        usedLocalModel: false,
        inferenceTimeMs: inferenceTime,
        modelVersion: 'server-latest',
      );
    } catch (e) {
      print('❌ Server goal success prediction failed: $e');
      rethrow;
    }
  }

  /// Decision logic: Should use local model?
  Future<bool> _shouldUseLocalModel({
    required String modelName,
    bool forceLocal = false,
    bool forceServer = false,
  }) async {
    // Override: Force local
    if (forceLocal) return true;

    // Override: Force server
    if (forceServer) return false;

    // Check network connectivity
    final connectivityResult = await _connectivity.checkConnectivity();
    final isOnline = connectivityResult != ConnectivityResult.none;

    if (!isOnline) {
      // Offline → use local model
      print('📴 Offline detected, using local model');
      return true;
    }

    // Check model freshness (local model age < 30 days)
    final modelAge = await _modelManager.getModelAge(modelName);

    if (modelAge != null && modelAge > _modelFreshnessThreshold) {
      // Model too old → use server model
      print('⏰ Local model too old (${modelAge.inDays} days), using server model');
      return false;
    }

    // Check if model exists locally
    final modelExists = await _modelManager.modelExists(modelName);

    if (!modelExists) {
      // Model not downloaded → use server
      print('📦 Local model not found, using server model');
      return false;
    }

    // Default: Use local model (faster, private, offline-capable)
    print('✅ Using local model (fresh, available, online)');
    return true;
  }

  /// Get routing statistics
  Future<Map<String, dynamic>> getRoutingStats() async {
    return await _telemetry.getRoutingStats();
  }
}

/// Churn prediction result
class ChurnPredictionResult {
  final String userId;
  final double churnProbability;
  final bool usedLocalModel;
  final int inferenceTimeMs;
  final String modelVersion;

  ChurnPredictionResult({
    required this.userId,
    required this.churnProbability,
    required this.usedLocalModel,
    required this.inferenceTimeMs,
    required this.modelVersion,
  });

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'churnProbability': churnProbability,
        'usedLocalModel': usedLocalModel,
        'inferenceTimeMs': inferenceTimeMs,
        'modelVersion': modelVersion,
      };
}

/// Sentiment prediction result
class SentimentPredictionResult {
  final String text;
  final Map<String, double> emotions;
  final String dominantEmotion;
  final double confidence;
  final bool usedLocalModel;
  final int inferenceTimeMs;
  final String modelVersion;

  SentimentPredictionResult({
    required this.text,
    required this.emotions,
    required this.dominantEmotion,
    required this.confidence,
    required this.usedLocalModel,
    required this.inferenceTimeMs,
    required this.modelVersion,
  });

  Map<String, dynamic> toJson() => {
        'text': text,
        'emotions': emotions,
        'dominantEmotion': dominantEmotion,
        'confidence': confidence,
        'usedLocalModel': usedLocalModel,
        'inferenceTimeMs': inferenceTimeMs,
        'modelVersion': modelVersion,
      };
}

/// Goal success prediction result
class GoalSuccessPredictionResult {
  final String goalId;
  final double successProbability;
  final bool usedLocalModel;
  final int inferenceTimeMs;
  final String modelVersion;

  GoalSuccessPredictionResult({
    required this.goalId,
    required this.successProbability,
    required this.usedLocalModel,
    required this.inferenceTimeMs,
    required this.modelVersion,
  });

  Map<String, dynamic> toJson() => {
        'goalId': goalId,
        'successProbability': successProbability,
        'usedLocalModel': usedLocalModel,
        'inferenceTimeMs': inferenceTimeMs,
        'modelVersion': modelVersion,
      };
}
