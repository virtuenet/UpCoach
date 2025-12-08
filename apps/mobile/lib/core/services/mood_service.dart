import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../constants/app_constants.dart';
import '../../shared/models/mood_model.dart';

class MoodService {
  static final MoodService _instance = MoodService._internal();
  factory MoodService() => _instance;

  final Dio _dio = Dio();
  final Uuid _uuid = const Uuid();

  MoodService._internal() {
    _dio.options.baseUrl = AppConstants.apiUrl;
    _dio.options.connectTimeout =
        const Duration(seconds: AppConstants.requestTimeoutSeconds);
    _dio.options.receiveTimeout =
        const Duration(seconds: AppConstants.requestTimeoutSeconds);
  }

  Future<List<MoodModel>> getMoodEntries({
    DateTime? startDate,
    DateTime? endDate,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) {
        queryParams['start_date'] = startDate.toIso8601String();
      }
      if (endDate != null) queryParams['end_date'] = endDate.toIso8601String();
      if (limit != null) queryParams['limit'] = limit;

      final response = await _dio.get(
        '/mood',
        queryParameters: queryParams,
      );

      final List<dynamic> moodsJson = response.data['moods'] ?? [];
      return moodsJson
          .map((json) => MoodModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<MoodModel> createMoodEntry({
    required MoodLevel level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
  }) async {
    try {
      final response = await _dio.post(
        '/mood',
        data: {
          'level': level.name,
          if (categories != null && categories.isNotEmpty)
            'categories': categories.map((c) => c.name).toList(),
          if (note != null && note.isNotEmpty) 'note': note,
          if (activities != null && activities.isNotEmpty)
            'activities': activities,
        },
      );

      return MoodModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<MoodModel> updateMoodEntry({
    required String moodId,
    MoodLevel? level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (level != null) data['level'] = level.name;
      if (categories != null) {
        data['categories'] = categories.map((c) => c.name).toList();
      }
      if (note != null) data['note'] = note;
      if (activities != null) data['activities'] = activities;

      final response = await _dio.patch('/mood/$moodId', data: data);
      return MoodModel.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> deleteMoodEntry(String moodId) async {
    try {
      await _dio.delete('/mood/$moodId');
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getMoodStats({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) {
        queryParams['start_date'] = startDate.toIso8601String();
      }
      if (endDate != null) queryParams['end_date'] = endDate.toIso8601String();

      final response = await _dio.get(
        '/mood/stats',
        queryParameters: queryParams,
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> getMoodInsights() async {
    try {
      final response = await _dio.get('/mood/insights');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Get all mood entries without filtering (for data export)
  Future<List<MoodModel>> getAllMoodEntries() async {
    return getMoodEntries();
  }

  // Create a temporary mood entry for optimistic UI updates
  MoodModel createTemporaryMoodEntry({
    required MoodLevel level,
    List<MoodCategory>? categories,
    String? note,
    List<String>? activities,
  }) {
    return MoodModel(
      id: _uuid.v4(),
      userId: 'temp',
      level: level,
      categories: categories ?? [],
      note: note,
      activities: activities ?? [],
      timestamp: DateTime.now(),
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
