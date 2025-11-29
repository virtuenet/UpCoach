import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/app_constants.dart';
import '../../shared/models/task_model.dart';

class TaskService {
  static final TaskService _instance = TaskService._internal();
  factory TaskService() => _instance;
  
  final Dio _dio = Dio();
  final Uuid _uuid = const Uuid();

  TaskService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout = const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  Future<List<TaskModel>> getTasks({
    TaskStatus? status,
    TaskCategory? category,
    TaskPriority? priority,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (status != null) queryParams['status'] = status.name;
      if (category != null) queryParams['category'] = category.name;
      if (priority != null) queryParams['priority'] = priority.name;
      if (startDate != null) queryParams['start_date'] = startDate.toIso8601String();
      if (endDate != null) queryParams['end_date'] = endDate.toIso8601String();

      final response = await _dio.get(
        '/tasks',
        queryParameters: queryParams,
      );

      final List<dynamic> tasksJson = response.data['tasks'] ?? [];
      return tasksJson
          .map((json) => TaskModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<TaskModel> createTask({
    required String title,
    String? description,
    required TaskPriority priority,
    required TaskCategory category,
    DateTime? dueDate,
    List<String>? tags,
  }) async {
    try {
      final response = await _dio.post(
        '/tasks',
        data: {
          'title': title,
          if (description != null) 'description': description,
          'priority': priority.name,
          'category': category.name,
          if (dueDate != null) 'due_date': dueDate.toIso8601String(),
          if (tags != null && tags.isNotEmpty) 'tags': tags,
        },
      );

      return TaskModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<TaskModel> updateTask({
    required String taskId,
    String? title,
    String? description,
    TaskPriority? priority,
    TaskStatus? status,
    TaskCategory? category,
    DateTime? dueDate,
    List<String>? tags,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (description != null) data['description'] = description;
      if (priority != null) data['priority'] = priority.name;
      if (status != null) data['status'] = status.name;
      if (category != null) data['category'] = category.name;
      if (dueDate != null) data['due_date'] = dueDate.toIso8601String();
      if (tags != null) data['tags'] = tags;

      final response = await _dio.patch('/tasks/$taskId', data: data);
      return TaskModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<TaskModel> completeTask(String taskId) async {
    try {
      final response = await _dio.post('/tasks/$taskId/complete');
      return TaskModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<TaskModel> uncompleteTask(String taskId) async {
    try {
      final response = await _dio.post('/tasks/$taskId/uncomplete');
      return TaskModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteTask(String taskId) async {
    try {
      await _dio.delete('/tasks/$taskId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getTaskStats() async {
    try {
      final response = await _dio.get('/tasks/stats');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get all tasks without filtering (for data export)
  Future<List<TaskModel>> getAllTasks() async {
    return getTasks();
  }

  // Create a temporary task for optimistic UI updates
  TaskModel createTemporaryTask({
    required String title,
    String? description,
    required TaskPriority priority,
    required TaskCategory category,
    DateTime? dueDate,
    List<String>? tags,
  }) {
    return TaskModel(
      id: _uuid.v4(),
      userId: 'temp',
      title: title,
      description: description,
      priority: priority,
      status: TaskStatus.pending,
      category: category,
      dueDate: dueDate,
      tags: tags ?? [],
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