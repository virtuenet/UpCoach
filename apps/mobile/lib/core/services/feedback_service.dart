import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'dart:io';
import '../providers/dio_provider.dart';
import '../utils/api_exception.dart';
import '../utils/logger.dart';

part 'feedback_service.g.dart';

@riverpod
FeedbackService feedbackService(Ref ref) {
  final dio = ref.watch(dioProvider);
  return FeedbackService(dio);
}

class FeedbackService {
  final Dio _dio;
  static const String _baseEndpoint = '/feedback';

  FeedbackService(this._dio);

  Future<void> submitFeedback({
    required String type,
    required String priority,
    required String subject,
    required String message,
    List<File>? attachments,
  }) async {
    try {
      final formData = FormData.fromMap({
        'type': type,
        'priority': priority,
        'subject': subject,
        'message': message,
        'platform': Platform.operatingSystem,
        'platformVersion': Platform.operatingSystemVersion,
        'appVersion': '1.0.0',
        'buildNumber': '100',
      });

      // Add attachments if any
      if (attachments != null && attachments.isNotEmpty) {
        for (int i = 0; i < attachments.length; i++) {
          final file = attachments[i];
          final fileName =
              'attachment_${i + 1}_${DateTime.now().millisecondsSinceEpoch}.jpg';

          formData.files.add(
            MapEntry(
              'attachments',
              await MultipartFile.fromFile(
                file.path,
                filename: fileName,
              ),
            ),
          );
        }
      }

      await _dio.post(
        _baseEndpoint,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      logger.i('Feedback submitted successfully: type=$type, subject=$subject');
    } on DioException catch (e) {
      logger.e('Failed to submit feedback', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<FeedbackItem>> getUserFeedback() async {
    try {
      final response = await _dio.get('$_baseEndpoint/my-feedback');

      final items = (response.data['data'] as List)
          .map((json) => FeedbackItem.fromJson(json))
          .toList();

      return items;
    } on DioException catch (e) {
      logger.e('Failed to fetch user feedback', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<FeedbackItem> getFeedbackById(int id) async {
    try {
      final response = await _dio.get('$_baseEndpoint/$id');
      return FeedbackItem.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to fetch feedback details', error: e);
      throw ApiException.fromDioError(e);
    }
  }
}

class FeedbackItem {
  final int id;
  final String type;
  final String priority;
  final String subject;
  final String message;
  final String status;
  final DateTime createdAt;
  final DateTime? resolvedAt;
  final String? response;
  final List<String>? attachmentUrls;

  FeedbackItem({
    required this.id,
    required this.type,
    required this.priority,
    required this.subject,
    required this.message,
    required this.status,
    required this.createdAt,
    this.resolvedAt,
    this.response,
    this.attachmentUrls,
  });

  factory FeedbackItem.fromJson(Map<String, dynamic> json) {
    return FeedbackItem(
      id: json['id'],
      type: json['type'],
      priority: json['priority'],
      subject: json['subject'],
      message: json['message'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'])
          : null,
      response: json['response'],
      attachmentUrls: json['attachmentUrls'] != null
          ? List<String>.from(json['attachmentUrls'])
          : null,
    );
  }
}
