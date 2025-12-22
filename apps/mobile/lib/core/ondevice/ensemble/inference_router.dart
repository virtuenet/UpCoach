import 'dart:async';

import '../models/coaching_nlu_model.dart';
import '../models/behavior_predictor_model.dart';
import '../models/quick_response_model.dart';
import 'model_ensemble_manager.dart';

/// Inference Router
/// Intelligent routing of inference requests to the most appropriate model
/// Optimizes for latency, accuracy, and resource usage
class InferenceRouter {
  static final InferenceRouter _instance = InferenceRouter._internal();
  factory InferenceRouter() => _instance;
  InferenceRouter._internal();

  // Models
  final CoachingNLUModel _nluModel = CoachingNLUModel();
  final BehaviorPredictorModel _behaviorModel = BehaviorPredictorModel();
  final QuickResponseModel _quickResponseModel = QuickResponseModel();

  // Routing configuration
  final RouterConfig _config = RouterConfig();

  // Metrics tracking
  final Map<String, RouteMetrics> _routeMetrics = {};

  // Model availability
  final Map<String, ModelStatus> _modelStatus = {};

  // Request queue
  final List<PendingRequest> _requestQueue = [];
  bool _processing = false;

  /// Initialize the router
  Future<void> initialize() async {
    // Initialize model status
    _modelStatus['nlu'] = ModelStatus(
      modelId: 'nlu',
      isAvailable: true,
      avgLatencyMs: 50,
      maxConcurrent: 3,
      currentLoad: 0,
    );

    _modelStatus['behavior'] = ModelStatus(
      modelId: 'behavior',
      isAvailable: true,
      avgLatencyMs: 30,
      maxConcurrent: 3,
      currentLoad: 0,
    );

    _modelStatus['quick_response'] = ModelStatus(
      modelId: 'quick_response',
      isAvailable: true,
      avgLatencyMs: 100,
      maxConcurrent: 2,
      currentLoad: 0,
    );

    // Initialize route metrics
    _routeMetrics['text_understanding'] = RouteMetrics(routeType: 'text_understanding');
    _routeMetrics['behavior_prediction'] = RouteMetrics(routeType: 'behavior_prediction');
    _routeMetrics['quick_response'] = RouteMetrics(routeType: 'quick_response');
    _routeMetrics['hybrid'] = RouteMetrics(routeType: 'hybrid');
  }

  /// Route a text understanding request
  Future<RoutingResult> routeTextUnderstanding(String text) async {
    final request = InferenceRequest(
      requestId: _generateRequestId(),
      type: RequestType.textUnderstanding,
      input: text,
      timestamp: DateTime.now(),
      priority: RequestPriority.normal,
    );

    return _routeRequest(request);
  }

  /// Route a behavior prediction request
  Future<RoutingResult> routeBehaviorPrediction(BehaviorFeatures features) async {
    final request = InferenceRequest(
      requestId: _generateRequestId(),
      type: RequestType.behaviorPrediction,
      input: features,
      timestamp: DateTime.now(),
      priority: RequestPriority.normal,
    );

    return _routeRequest(request);
  }

  /// Route a quick response request
  Future<RoutingResult> routeQuickResponse({
    required String intent,
    required Map<String, dynamic> context,
    ResponseStyle style = ResponseStyle.balanced,
  }) async {
    final request = InferenceRequest(
      requestId: _generateRequestId(),
      type: RequestType.quickResponse,
      input: {
        'intent': intent,
        'context': context,
        'style': style,
      },
      timestamp: DateTime.now(),
      priority: RequestPriority.high,
    );

    return _routeRequest(request);
  }

  /// Route a complex request that may require multiple models
  Future<RoutingResult> routeHybridRequest({
    required String text,
    BehaviorFeatures? behaviorContext,
    bool needsQuickResponse = false,
  }) async {
    final request = InferenceRequest(
      requestId: _generateRequestId(),
      type: RequestType.hybrid,
      input: {
        'text': text,
        'behaviorContext': behaviorContext,
        'needsQuickResponse': needsQuickResponse,
      },
      timestamp: DateTime.now(),
      priority: RequestPriority.normal,
    );

    return _routeRequest(request);
  }

  /// Get routing recommendation without executing
  RouteRecommendation getRouteRecommendation(InferenceRequest request) {
    final analysis = _analyzeRequest(request);
    final route = _selectOptimalRoute(analysis);

    return RouteRecommendation(
      recommendedRoute: route,
      alternativeRoutes: _getAlternativeRoutes(route, analysis),
      estimatedLatencyMs: _estimateLatency(route),
      estimatedConfidence: _estimateConfidence(route, analysis),
      reasoning: _generateRoutingReasoning(route, analysis),
    );
  }

  /// Get current model status
  Map<String, ModelStatus> getModelStatus() {
    return Map.from(_modelStatus);
  }

  /// Get routing metrics
  Map<String, RouteMetrics> getRouteMetrics() {
    return Map.from(_routeMetrics);
  }

  /// Update model availability
  void updateModelStatus(String modelId, {bool? isAvailable, double? latencyMs}) {
    if (_modelStatus.containsKey(modelId)) {
      final status = _modelStatus[modelId]!;
      _modelStatus[modelId] = ModelStatus(
        modelId: modelId,
        isAvailable: isAvailable ?? status.isAvailable,
        avgLatencyMs: latencyMs ?? status.avgLatencyMs,
        maxConcurrent: status.maxConcurrent,
        currentLoad: status.currentLoad,
      );
    }
  }

  /// Set routing preferences
  void setRoutingPreferences(RouterConfig config) {
    _config.preferLowLatency = config.preferLowLatency;
    _config.preferHighAccuracy = config.preferHighAccuracy;
    _config.maxLatencyMs = config.maxLatencyMs;
    _config.minConfidenceThreshold = config.minConfidenceThreshold;
    _config.enableLoadBalancing = config.enableLoadBalancing;
  }

  // ==================== Private Methods ====================

  Future<RoutingResult> _routeRequest(InferenceRequest request) async {
    final startTime = DateTime.now();

    // Analyze request
    final analysis = _analyzeRequest(request);

    // Select route
    final route = _selectOptimalRoute(analysis);

    // Execute inference
    final result = await _executeRoute(route, request);

    // Record metrics
    _recordMetrics(route, result, DateTime.now().difference(startTime));

    return result;
  }

  RequestAnalysis _analyzeRequest(InferenceRequest request) {
    double complexity = 0.5;
    Set<String> requiredCapabilities = {};
    bool isTimeSensitive = request.priority == RequestPriority.high ||
        request.priority == RequestPriority.urgent;

    switch (request.type) {
      case RequestType.textUnderstanding:
        final text = request.input as String;
        complexity = _estimateTextComplexity(text);
        requiredCapabilities = {'nlu', 'intent_classification'};
        break;

      case RequestType.behaviorPrediction:
        complexity = 0.4; // Relatively straightforward
        requiredCapabilities = {'behavior_prediction'};
        break;

      case RequestType.quickResponse:
        complexity = 0.3; // Template-based, fast
        requiredCapabilities = {'response_generation'};
        isTimeSensitive = true;
        break;

      case RequestType.hybrid:
        complexity = 0.8; // Multi-model, complex
        requiredCapabilities = {'nlu', 'behavior_prediction', 'response_generation'};
        break;
    }

    return RequestAnalysis(
      requestType: request.type,
      complexity: complexity,
      requiredCapabilities: requiredCapabilities,
      isTimeSensitive: isTimeSensitive,
      estimatedTokens: _estimateTokens(request),
    );
  }

  InferenceRoute _selectOptimalRoute(RequestAnalysis analysis) {
    // Check if quick path is available
    if (analysis.isTimeSensitive && analysis.complexity < 0.4) {
      if (_isModelAvailable('quick_response')) {
        return InferenceRoute.quickResponse;
      }
    }

    // Check capabilities
    if (analysis.requiredCapabilities.contains('behavior_prediction') &&
        !analysis.requiredCapabilities.contains('nlu')) {
      return InferenceRoute.behaviorOnly;
    }

    if (analysis.requiredCapabilities.contains('nlu') &&
        !analysis.requiredCapabilities.contains('behavior_prediction')) {
      return InferenceRoute.nluOnly;
    }

    // Hybrid route for complex requests
    if (analysis.complexity > 0.6 ||
        analysis.requiredCapabilities.length > 2) {
      return InferenceRoute.hybrid;
    }

    // Default to NLU
    return InferenceRoute.nluOnly;
  }

  Future<RoutingResult> _executeRoute(
    InferenceRoute route,
    InferenceRequest request,
  ) async {
    final startTime = DateTime.now();

    try {
      switch (route) {
        case InferenceRoute.nluOnly:
          final text = request.input as String;
          final nluResult = await _nluModel.process(text);
          return RoutingResult(
            requestId: request.requestId,
            route: route,
            success: true,
            data: nluResult.toJson(),
            latencyMs: DateTime.now().difference(startTime).inMilliseconds,
            confidence: nluResult.confidence,
            modelsUsed: ['nlu'],
          );

        case InferenceRoute.behaviorOnly:
          final features = request.input as BehaviorFeatures;
          final prediction = await _behaviorModel.predict(features);
          return RoutingResult(
            requestId: request.requestId,
            route: route,
            success: true,
            data: prediction.toJson(),
            latencyMs: DateTime.now().difference(startTime).inMilliseconds,
            confidence: prediction.confidence,
            modelsUsed: ['behavior'],
          );

        case InferenceRoute.quickResponse:
          final input = request.input as Map<String, dynamic>;
          final response = await _quickResponseModel.generateResponse(
            intent: input['intent'] as String,
            userInput: input['userInput'] as String?,
            context: input['context'] as Map<String, dynamic>,
            style: input['style'] as ResponseStyle? ?? ResponseStyle.balanced,
          );
          return RoutingResult(
            requestId: request.requestId,
            route: route,
            success: true,
            data: response.toJson(),
            latencyMs: DateTime.now().difference(startTime).inMilliseconds,
            confidence: response.confidence,
            modelsUsed: ['quick_response'],
          );

        case InferenceRoute.hybrid:
          final input = request.input as Map<String, dynamic>;
          final text = input['text'] as String;
          final behaviorContext = input['behaviorContext'] as BehaviorFeatures?;
          final needsQuickResponse = input['needsQuickResponse'] as bool? ?? false;

          // Run NLU
          final nluResult = await _nluModel.process(text);

          // Run behavior if context available
          BehaviorPrediction? behaviorResult;
          if (behaviorContext != null) {
            behaviorResult = await _behaviorModel.predict(behaviorContext);
          }

          // Generate response if needed
          QuickResponse? responseResult;
          if (needsQuickResponse && nluResult.primaryIntent != null) {
            responseResult = await _quickResponseModel.generateResponse(
              intent: nluResult.primaryIntent!,
              userInput: text,
              context: {'nluResult': nluResult.toJson()},
            );
          }

          return RoutingResult(
            requestId: request.requestId,
            route: route,
            success: true,
            data: {
              'nlu': nluResult.toJson(),
              if (behaviorResult != null) 'behavior': behaviorResult.toJson(),
              if (responseResult != null) 'response': responseResult.toJson(),
            },
            latencyMs: DateTime.now().difference(startTime).inMilliseconds,
            confidence: nluResult.confidence,
            modelsUsed: [
              'nlu',
              if (behaviorResult != null) 'behavior',
              if (responseResult != null) 'quick_response',
            ],
          );

        case InferenceRoute.fallback:
          return RoutingResult(
            requestId: request.requestId,
            route: route,
            success: false,
            data: {'error': 'Fallback route - no suitable model available'},
            latencyMs: DateTime.now().difference(startTime).inMilliseconds,
            confidence: 0.0,
            modelsUsed: [],
          );
      }
    } catch (e) {
      return RoutingResult(
        requestId: request.requestId,
        route: route,
        success: false,
        data: {'error': e.toString()},
        latencyMs: DateTime.now().difference(startTime).inMilliseconds,
        confidence: 0.0,
        modelsUsed: [],
        error: e.toString(),
      );
    }
  }

  double _estimateTextComplexity(String text) {
    final words = text.split(' ').length;
    final hasQuestion = text.contains('?');
    final sentences = text.split(RegExp(r'[.!?]')).length;

    var complexity = 0.0;
    complexity += (words / 50).clamp(0.0, 0.4);
    if (hasQuestion) complexity += 0.2;
    if (sentences > 1) complexity += 0.2;

    return complexity.clamp(0.0, 1.0);
  }

  int _estimateTokens(InferenceRequest request) {
    if (request.input is String) {
      return (request.input as String).split(' ').length * 2;
    }
    return 100; // Default estimate
  }

  bool _isModelAvailable(String modelId) {
    final status = _modelStatus[modelId];
    return status != null &&
        status.isAvailable &&
        status.currentLoad < status.maxConcurrent;
  }

  List<InferenceRoute> _getAlternativeRoutes(
    InferenceRoute primary,
    RequestAnalysis analysis,
  ) {
    final alternatives = <InferenceRoute>[];

    for (final route in InferenceRoute.values) {
      if (route != primary && route != InferenceRoute.fallback) {
        alternatives.add(route);
      }
    }

    return alternatives.take(2).toList();
  }

  int _estimateLatency(InferenceRoute route) {
    switch (route) {
      case InferenceRoute.nluOnly:
        return 50;
      case InferenceRoute.behaviorOnly:
        return 30;
      case InferenceRoute.quickResponse:
        return 100;
      case InferenceRoute.hybrid:
        return 150;
      case InferenceRoute.fallback:
        return 10;
    }
  }

  double _estimateConfidence(InferenceRoute route, RequestAnalysis analysis) {
    switch (route) {
      case InferenceRoute.nluOnly:
        return analysis.complexity < 0.5 ? 0.85 : 0.75;
      case InferenceRoute.behaviorOnly:
        return 0.8;
      case InferenceRoute.quickResponse:
        return 0.9;
      case InferenceRoute.hybrid:
        return 0.85;
      case InferenceRoute.fallback:
        return 0.0;
    }
  }

  String _generateRoutingReasoning(InferenceRoute route, RequestAnalysis analysis) {
    final parts = <String>[];

    parts.add('Selected ${route.name} route');
    parts.add('Complexity: ${(analysis.complexity * 100).round()}%');

    if (analysis.isTimeSensitive) {
      parts.add('Time-sensitive request');
    }

    parts.add('Capabilities: ${analysis.requiredCapabilities.join(", ")}');

    return parts.join('. ');
  }

  void _recordMetrics(
    InferenceRoute route,
    RoutingResult result,
    Duration duration,
  ) {
    final metrics = _routeMetrics[route.name];
    if (metrics != null) {
      metrics.totalRequests++;
      if (result.success) {
        metrics.successfulRequests++;
      }
      metrics.totalLatencyMs += duration.inMilliseconds;
      metrics.avgLatencyMs =
          metrics.totalLatencyMs / metrics.totalRequests;
    }
  }

  String _generateRequestId() {
    return 'req_${DateTime.now().millisecondsSinceEpoch}_${_requestQueue.length}';
  }
}

/// Inference route types
enum InferenceRoute {
  nluOnly,
  behaviorOnly,
  quickResponse,
  hybrid,
  fallback,
}

/// Request types
enum RequestType {
  textUnderstanding,
  behaviorPrediction,
  quickResponse,
  hybrid,
}

/// Request priority
enum RequestPriority {
  low,
  normal,
  high,
  urgent,
}

/// Inference request
class InferenceRequest {
  final String requestId;
  final RequestType type;
  final dynamic input;
  final DateTime timestamp;
  final RequestPriority priority;

  InferenceRequest({
    required this.requestId,
    required this.type,
    required this.input,
    required this.timestamp,
    required this.priority,
  });
}

/// Request analysis
class RequestAnalysis {
  final RequestType requestType;
  final double complexity;
  final Set<String> requiredCapabilities;
  final bool isTimeSensitive;
  final int estimatedTokens;

  RequestAnalysis({
    required this.requestType,
    required this.complexity,
    required this.requiredCapabilities,
    required this.isTimeSensitive,
    required this.estimatedTokens,
  });
}

/// Routing result
class RoutingResult {
  final String requestId;
  final InferenceRoute route;
  final bool success;
  final Map<String, dynamic> data;
  final int latencyMs;
  final double confidence;
  final List<String> modelsUsed;
  final String? error;

  RoutingResult({
    required this.requestId,
    required this.route,
    required this.success,
    required this.data,
    required this.latencyMs,
    required this.confidence,
    required this.modelsUsed,
    this.error,
  });

  Map<String, dynamic> toJson() => {
    'requestId': requestId,
    'route': route.name,
    'success': success,
    'data': data,
    'latencyMs': latencyMs,
    'confidence': confidence,
    'modelsUsed': modelsUsed,
    if (error != null) 'error': error,
  };
}

/// Route recommendation
class RouteRecommendation {
  final InferenceRoute recommendedRoute;
  final List<InferenceRoute> alternativeRoutes;
  final int estimatedLatencyMs;
  final double estimatedConfidence;
  final String reasoning;

  RouteRecommendation({
    required this.recommendedRoute,
    required this.alternativeRoutes,
    required this.estimatedLatencyMs,
    required this.estimatedConfidence,
    required this.reasoning,
  });
}

/// Model status
class ModelStatus {
  final String modelId;
  final bool isAvailable;
  final double avgLatencyMs;
  final int maxConcurrent;
  final int currentLoad;

  ModelStatus({
    required this.modelId,
    required this.isAvailable,
    required this.avgLatencyMs,
    required this.maxConcurrent,
    required this.currentLoad,
  });
}

/// Route metrics
class RouteMetrics {
  final String routeType;
  int totalRequests = 0;
  int successfulRequests = 0;
  int totalLatencyMs = 0;
  double avgLatencyMs = 0;

  RouteMetrics({required this.routeType});

  double get successRate =>
      totalRequests > 0 ? successfulRequests / totalRequests : 0;
}

/// Router configuration
class RouterConfig {
  bool preferLowLatency = true;
  bool preferHighAccuracy = false;
  int maxLatencyMs = 200;
  double minConfidenceThreshold = 0.5;
  bool enableLoadBalancing = true;
}

/// Pending request for queue
class PendingRequest {
  final InferenceRequest request;
  final Completer<RoutingResult> completer;

  PendingRequest({
    required this.request,
    required this.completer,
  });
}
