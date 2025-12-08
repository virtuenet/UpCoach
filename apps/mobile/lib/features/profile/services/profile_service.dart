import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'dart:io';
import '../../../core/providers/dio_provider.dart';
import '../../../core/utils/api_exception.dart';
import '../../../core/utils/logger.dart';
import '../../../shared/models/user.dart';

part 'profile_service.g.dart';

@riverpod
ProfileService profileService(Ref ref) {
  final dio = ref.watch(dioProvider);
  return ProfileService(dio);
}

class ProfileService {
  final Dio _dio;
  static const String _baseEndpoint = '/profile';

  ProfileService(this._dio);

  Future<User> getProfile() async {
    try {
      final response = await _dio.get(_baseEndpoint);
      return User.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to fetch profile', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<User> updateProfile({
    String? name,
    String? bio,
    String? phone,
    DateTime? dateOfBirth,
    String? gender,
    Map<String, dynamic>? preferences,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (bio != null) data['bio'] = bio;
      if (phone != null) data['phone'] = phone;
      if (dateOfBirth != null) {
        data['dateOfBirth'] = dateOfBirth.toIso8601String();
      }
      if (gender != null) data['gender'] = gender;
      if (preferences != null) data['preferences'] = preferences;

      final response = await _dio.put(_baseEndpoint, data: data);
      return User.fromJson(response.data['data']);
    } on DioException catch (e) {
      logger.e('Failed to update profile', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<String> updateProfilePhoto(File photo) async {
    try {
      final formData = FormData.fromMap({
        'photo': await MultipartFile.fromFile(
          photo.path,
          filename:
              'profile_photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      });

      final response = await _dio.post(
        '$_baseEndpoint/photo',
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      return response.data['data']['avatarUrl'];
    } on DioException catch (e) {
      logger.e('Failed to update profile photo', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> removeProfilePhoto() async {
    try {
      await _dio.delete('$_baseEndpoint/photo');
    } on DioException catch (e) {
      logger.e('Failed to remove profile photo', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        '$_baseEndpoint/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );
    } on DioException catch (e) {
      logger.e('Failed to update password', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> deleteAccount(String password) async {
    try {
      await _dio.delete(
        '$_baseEndpoint/delete-account',
        data: {'password': password},
      );
    } on DioException catch (e) {
      logger.e('Failed to delete account', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getPrivacySettings() async {
    try {
      final response = await _dio.get('$_baseEndpoint/privacy');
      return response.data['data'];
    } on DioException catch (e) {
      logger.e('Failed to fetch privacy settings', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updatePrivacySettings(Map<String, dynamic> settings) async {
    try {
      await _dio.put('$_baseEndpoint/privacy', data: settings);
    } on DioException catch (e) {
      logger.e('Failed to update privacy settings', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getNotificationSettings() async {
    try {
      final response = await _dio.get('$_baseEndpoint/notifications');
      return response.data['data'];
    } on DioException catch (e) {
      logger.e('Failed to fetch notification settings', error: e);
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> updateNotificationSettings(Map<String, dynamic> settings) async {
    try {
      await _dio.put('$_baseEndpoint/notifications', data: settings);
    } on DioException catch (e) {
      logger.e('Failed to update notification settings', error: e);
      throw ApiException.fromDioError(e);
    }
  }
}
