import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../storage/secure_storage.dart';

class TwoFactorAuthService {
  static const String _baseUrl = ApiConstants.baseUrl;
  final SecureStorage _secureStorage = SecureStorage();

  // Get 2FA status
  Future<Map<String, dynamic>> get2FAStatus() async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.get(
        Uri.parse('$_baseUrl/auth/2fa/status'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get 2FA status: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error getting 2FA status: $e');
    }
  }

  // Generate TOTP secret for setup
  Future<Map<String, dynamic>> generateTOTPSecret() async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/totp/generate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to generate TOTP secret: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error generating TOTP secret: $e');
    }
  }

  // Verify and enable TOTP
  Future<Map<String, dynamic>> verifyAndEnableTOTP(String token) async {
    try {
      final accessToken = await _secureStorage.getAccessToken();
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/totp/verify'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: json.encode({'token': token}),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Failed to verify TOTP');
      }
    } catch (e) {
      throw Exception('Error verifying TOTP: $e');
    }
  }

  // Verify 2FA token during login
  Future<bool> verify2FA(String token) async {
    try {
      final accessToken = await _secureStorage.getAccessToken();
      if (accessToken == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/verify'),
        headers: {
          'Authorization': 'Bearer $accessToken',
          'Content-Type': 'application/json',
        },
        body: json.encode({'token': token}),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Disable 2FA
  Future<void> disable2FA() async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/disable'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to disable 2FA: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error disabling 2FA: $e');
    }
  }

  // Generate backup codes
  Future<List<String>> generateBackupCodes() async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/backup-codes/generate'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<String>.from(data['codes']);
      } else {
        throw Exception('Failed to generate backup codes: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error generating backup codes: $e');
    }
  }

  // Add trusted device
  Future<void> addTrustedDevice(String deviceName, String fingerprint) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/trusted-devices'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'name': deviceName,
          'fingerprint': fingerprint,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to add trusted device: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error adding trusted device: $e');
    }
  }

  // Get trusted devices
  Future<List<Map<String, dynamic>>> getTrustedDevices() async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.get(
        Uri.parse('$_baseUrl/auth/2fa/trusted-devices'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['devices']);
      } else {
        throw Exception('Failed to get trusted devices: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error getting trusted devices: $e');
    }
  }

  // Remove trusted device
  Future<void> removeTrustedDevice(String deviceId) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.delete(
        Uri.parse('$_baseUrl/auth/2fa/trusted-devices/$deviceId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to remove trusted device: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error removing trusted device: $e');
    }
  }

  // Enable SMS 2FA
  Future<void> enableSMS2FA(String phoneNumber, String verificationCode) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/sms/enable'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'phoneNumber': phoneNumber,
          'verificationCode': verificationCode,
        }),
      );

      if (response.statusCode != 200) {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Failed to enable SMS 2FA');
      }
    } catch (e) {
      throw Exception('Error enabling SMS 2FA: $e');
    }
  }

  // Send SMS verification code
  Future<void> sendSMSCode(String phoneNumber) async {
    try {
      final token = await _secureStorage.getAccessToken();
      if (token == null) throw Exception('User not authenticated');

      final response = await http.post(
        Uri.parse('$_baseUrl/auth/2fa/sms/send'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'phoneNumber': phoneNumber}),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to send SMS code: ${response.reasonPhrase}');
      }
    } catch (e) {
      throw Exception('Error sending SMS code: $e');
    }
  }

  // Utility function to generate device fingerprint
  String generateDeviceFingerprint() {
    // In a real app, you would collect device-specific information
    // like device ID, platform, model, etc.
    final random = Random();
    final bytes = List<int>.generate(16, (i) => random.nextInt(256));
    return base64Encode(bytes);
  }

  // Validate TOTP token format
  bool isValidTOTPToken(String token) {
    return RegExp(r'^\d{6}$').hasMatch(token);
  }

  // Validate phone number format
  bool isValidPhoneNumber(String phoneNumber) {
    return RegExp(r'^\+?[1-9]\d{1,14}$').hasMatch(phoneNumber);
  }
}