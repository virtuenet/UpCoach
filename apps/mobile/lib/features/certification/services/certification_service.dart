import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/certification_models.dart';

/// Certification service for API communication
class CertificationService {
  final String baseUrl;
  final String Function() getToken;

  CertificationService({
    required this.baseUrl,
    required this.getToken,
  });

  // ==================== Programs ====================

  /// Get all active certification programs
  Future<List<CertificationProgram>> getPrograms({
    CertificationLevel? level,
    CertificationTier? tier,
    bool? isFree,
  }) async {
    final queryParams = <String, String>{};
    if (level != null) queryParams['level'] = level.name;
    if (tier != null) queryParams['tier'] = tier.name;
    if (isFree != null) queryParams['isFree'] = isFree.toString();

    final uri = Uri.parse('$baseUrl/certifications/programs')
        .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => CertificationProgram.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load programs: ${response.body}');
    }
  }

  /// Get program by ID
  Future<CertificationProgram> getProgram(String programId) async {
    final uri = Uri.parse('$baseUrl/certifications/programs/$programId');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return CertificationProgram.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load program: ${response.body}');
    }
  }

  /// Get program by slug
  Future<CertificationProgram> getProgramBySlug(String slug) async {
    final uri = Uri.parse('$baseUrl/certifications/programs/slug/$slug');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return CertificationProgram.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load program: ${response.body}');
    }
  }

  // ==================== Coach Certifications ====================

  /// Start certification for a program
  Future<CoachCertification> startCertification({
    required String programId,
    String? paymentId,
  }) async {
    final uri = Uri.parse('$baseUrl/certifications/start');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'programId': programId,
        if (paymentId != null) 'paymentId': paymentId,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return CoachCertification.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to start certification: ${response.body}');
    }
  }

  /// Get coach's certification for a program
  Future<CoachCertification?> getCoachCertification(String programId) async {
    final uri = Uri.parse('$baseUrl/certifications/my-certifications/$programId');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return CoachCertification.fromJson(json.decode(response.body));
    } else if (response.statusCode == 404) {
      return null;
    } else {
      throw Exception('Failed to load certification: ${response.body}');
    }
  }

  /// Get all certifications for the coach
  Future<List<CoachCertification>> getMyCertifications() async {
    final uri = Uri.parse('$baseUrl/certifications/my-certifications');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => CoachCertification.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load certifications: ${response.body}');
    }
  }

  /// Update certification progress
  Future<CoachCertification> updateProgress({
    required String programId,
    required String requirementId,
    required int value,
  }) async {
    final uri = Uri.parse('$baseUrl/certifications/$programId/progress');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'requirementId': requirementId,
        'value': value,
      }),
    );

    if (response.statusCode == 200) {
      return CoachCertification.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to update progress: ${response.body}');
    }
  }

  // ==================== Portfolio ====================

  /// Submit portfolio for review
  Future<CoachCertification> submitPortfolio({
    required String programId,
    required String portfolioUrl,
  }) async {
    final uri = Uri.parse('$baseUrl/certifications/$programId/portfolio');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({'portfolioUrl': portfolioUrl}),
    );

    if (response.statusCode == 200) {
      return CoachCertification.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to submit portfolio: ${response.body}');
    }
  }

  // ==================== Quiz ====================

  /// Get quiz for program
  Future<CertificationQuiz> getQuiz(String programId) async {
    final uri = Uri.parse('$baseUrl/certifications/programs/$programId/quiz');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return CertificationQuiz.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load quiz: ${response.body}');
    }
  }

  /// Start quiz attempt
  Future<String> startQuizAttempt(String programId) async {
    final uri = Uri.parse('$baseUrl/certifications/$programId/quiz/start');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = json.decode(response.body);
      return data['attemptId'];
    } else {
      throw Exception('Failed to start quiz: ${response.body}');
    }
  }

  /// Submit quiz answer
  Future<void> submitAnswer({
    required String attemptId,
    required String questionId,
    required dynamic answer, // String or List<String>
  }) async {
    final uri = Uri.parse('$baseUrl/certifications/quiz/attempts/$attemptId/answer');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'questionId': questionId,
        'answer': answer,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to submit answer: ${response.body}');
    }
  }

  /// Submit quiz attempt
  Future<QuizResult> submitQuiz(String attemptId) async {
    final uri = Uri.parse('$baseUrl/certifications/quiz/attempts/$attemptId/submit');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return QuizResult.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to submit quiz: ${response.body}');
    }
  }

  // ==================== Renewal ====================

  /// Renew certification
  Future<CoachCertification> renewCertification({
    required String certificationId,
    String? paymentId,
  }) async {
    final uri = Uri.parse('$baseUrl/certifications/$certificationId/renew');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        if (paymentId != null) 'paymentId': paymentId,
      }),
    );

    if (response.statusCode == 200) {
      return CoachCertification.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to renew certification: ${response.body}');
    }
  }

  // ==================== Verification ====================

  /// Verify certification by code
  Future<Map<String, dynamic>> verifyCertification(String verificationCode) async {
    final uri = Uri.parse('$baseUrl/certifications/verify/$verificationCode');

    final response = await http.get(uri);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to verify certification: ${response.body}');
    }
  }

  // ==================== Statistics ====================

  /// Get program statistics
  Future<Map<String, dynamic>> getProgramStats(String programId) async {
    final uri = Uri.parse('$baseUrl/certifications/programs/$programId/stats');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load stats: ${response.body}');
    }
  }
}
