import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/app_constants.dart';
import '../../shared/models/goal_model.dart';

class GoalService {
  static final GoalService _instance = GoalService._internal();
  factory GoalService() => _instance;
  
  final Dio _dio = Dio();
  final Uuid _uuid = const Uuid();

  GoalService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  Future<List<GoalModel>> getGoals({
    GoalStatus? status,
    GoalCategory? category,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (status != null) queryParams['status'] = status.name;
      if (category != null) queryParams['category'] = category.name;

      final response = await _dio.get(
        '/goals',
        queryParameters: queryParams,
      );

      final List<dynamic> goalsJson = response.data['goals'] ?? [];
      return goalsJson
          .map((json) => GoalModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<GoalModel> createGoal({
    required String title,
    String? description,
    required GoalCategory category,
    required GoalPriority priority,
    required DateTime targetDate,
    List<String>? milestones,
  }) async {
    try {
      final response = await _dio.post(
        '/goals',
        data: {
          'title': title,
          if (description != null) 'description': description,
          'category': category.name,
          'priority': priority.name,
          'target_date': targetDate.toIso8601String(),
          if (milestones != null && milestones.isNotEmpty) 'milestones': milestones,
        },
      );

      return GoalModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<GoalModel> updateGoal({
    required String goalId,
    String? title,
    String? description,
    GoalCategory? category,
    GoalPriority? priority,
    GoalStatus? status,
    DateTime? targetDate,
    double? progress,
    List<String>? milestones,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (description != null) data['description'] = description;
      if (category != null) data['category'] = category.name;
      if (priority != null) data['priority'] = priority.name;
      if (status != null) data['status'] = status.name;
      if (targetDate != null) data['target_date'] = targetDate.toIso8601String();
      if (progress != null) data['progress'] = progress;
      if (milestones != null) data['milestones'] = milestones;

      final response = await _dio.patch('/goals/$goalId', data: data);
      return GoalModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<GoalModel> updateProgress({
    required String goalId,
    required double progress,
  }) async {
    try {
      final response = await _dio.post(
        '/goals/$goalId/progress',
        data: {'progress': progress},
      );
      return GoalModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<GoalModel> completeMilestone({
    required String goalId,
    required String milestone,
  }) async {
    try {
      final response = await _dio.post(
        '/goals/$goalId/milestones/complete',
        data: {'milestone': milestone},
      );
      return GoalModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<GoalModel> uncompleteMilestone({
    required String goalId,
    required String milestone,
  }) async {
    try {
      final response = await _dio.post(
        '/goals/$goalId/milestones/uncomplete',
        data: {'milestone': milestone},
      );
      return GoalModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteGoal(String goalId) async {
    try {
      await _dio.delete('/goals/$goalId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getGoalStats() async {
    try {
      final response = await _dio.get('/goals/stats');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Create a temporary goal for optimistic UI updates
  GoalModel createTemporaryGoal({
    required String title,
    String? description,
    required GoalCategory category,
    required GoalPriority priority,
    required DateTime targetDate,
    List<String>? milestones,
  }) {
    return GoalModel(
      id: _uuid.v4(),
      userId: 'temp',
      title: title,
      description: description,
      category: category,
      priority: priority,
      status: GoalStatus.active,
      targetDate: targetDate,
      progress: 0.0,
      milestones: milestones ?? [],
      completedMilestones: [],
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  String _handleError(DioException error) {
    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        return data['message'] as String;
      }
      return 'Request failed with status: ${error.response!.statusCode}';
    } else if (error.type == DioExceptionType.connectionTimeout) {
      return 'Connection timeout';
    } else if (error.type == DioExceptionType.receiveTimeout) {
      return 'Receive timeout';
    } else if (error.type == DioExceptionType.connectionError) {
      return 'Connection error';
    } else {
      return 'An unexpected error occurred';
    }
  }
} 