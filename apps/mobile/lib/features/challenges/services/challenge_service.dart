import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/challenge_models.dart';

/// Social challenge service for API communication
class ChallengeService {
  final String baseUrl;
  final String Function() getToken;

  ChallengeService({
    required this.baseUrl,
    required this.getToken,
  });

  // ==================== Challenge Discovery ====================

  /// Get all challenges with filters
  Future<List<SocialChallenge>> getChallenges({
    ChallengeType? type,
    ChallengeCategory? category,
    ChallengeStatus? status,
    bool? isPublic,
    bool? isFeatured,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (type != null) queryParams['type'] = type.name;
    if (category != null) queryParams['category'] = category.name;
    if (status != null) queryParams['status'] = status.name;
    if (isPublic != null) queryParams['isPublic'] = isPublic.toString();
    if (isFeatured != null) queryParams['isFeatured'] = isFeatured.toString();
    if (search != null) queryParams['search'] = search;

    final uri = Uri.parse('$baseUrl/challenges')
        .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => SocialChallenge.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load challenges: ${response.body}');
    }
  }

  /// Get active challenges
  Future<List<SocialChallenge>> getActiveChallenges() async {
    final uri = Uri.parse('$baseUrl/challenges/active');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => SocialChallenge.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load challenges: ${response.body}');
    }
  }

  /// Get upcoming challenges
  Future<List<SocialChallenge>> getUpcomingChallenges() async {
    final uri = Uri.parse('$baseUrl/challenges/upcoming');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => SocialChallenge.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load challenges: ${response.body}');
    }
  }

  /// Get challenge by ID
  Future<SocialChallenge> getChallenge(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return SocialChallenge.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load challenge: ${response.body}');
    }
  }

  // ==================== User's Challenges ====================

  /// Get user's challenges
  Future<UserChallenges> getMyChallenges() async {
    final uri = Uri.parse('$baseUrl/challenges/my-challenges');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return UserChallenges.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load challenges: ${response.body}');
    }
  }

  // ==================== Participation ====================

  /// Join challenge as individual
  Future<JoinResult> joinChallenge({
    required String challengeId,
    String? inviteCode,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/join');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        if (inviteCode != null) 'inviteCode': inviteCode,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return JoinResult.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to join challenge: ${response.body}');
    }
  }

  /// Leave challenge
  Future<bool> leaveChallenge(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/leave');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['success'] == true;
    } else {
      throw Exception('Failed to leave challenge: ${response.body}');
    }
  }

  /// Get participation status
  Future<ChallengeParticipant?> getParticipation(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/my-participation');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return ChallengeParticipant.fromJson(json.decode(response.body));
    } else if (response.statusCode == 404) {
      return null;
    } else {
      throw Exception('Failed to load participation: ${response.body}');
    }
  }

  // ==================== Progress ====================

  /// Record progress
  Future<ChallengeParticipant> recordProgress({
    required String challengeId,
    required String requirementId,
    required int value,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/progress');

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
      return ChallengeParticipant.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to record progress: ${response.body}');
    }
  }

  // ==================== Teams ====================

  /// Create team
  Future<ChallengeTeam> createTeam({
    required String challengeId,
    required String teamName,
    String? description,
    bool isPublic = true,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/teams');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'teamName': teamName,
        if (description != null) 'description': description,
        'isPublic': isPublic,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return ChallengeTeam.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create team: ${response.body}');
    }
  }

  /// Join team
  Future<JoinResult> joinTeam({
    required String challengeId,
    required String teamId,
    String? inviteCode,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/teams/$teamId/join');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        if (inviteCode != null) 'inviteCode': inviteCode,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return JoinResult.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to join team: ${response.body}');
    }
  }

  /// Get challenge teams
  Future<List<ChallengeTeam>> getTeams(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/teams');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ChallengeTeam.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load teams: ${response.body}');
    }
  }

  /// Get team details
  Future<ChallengeTeam> getTeam({
    required String challengeId,
    required String teamId,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/teams/$teamId');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return ChallengeTeam.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load team: ${response.body}');
    }
  }

  // ==================== Leaderboard ====================

  /// Get challenge leaderboard
  Future<List<LeaderboardEntry>> getLeaderboard({
    required String challengeId,
    int limit = 50,
    int offset = 0,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };

    final uri = Uri.parse('$baseUrl/challenges/$challengeId/leaderboard')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => LeaderboardEntry.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load leaderboard: ${response.body}');
    }
  }

  /// Get team leaderboard
  Future<List<TeamLeaderboardEntry>> getTeamLeaderboard({
    required String challengeId,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };

    final uri = Uri.parse('$baseUrl/challenges/$challengeId/leaderboard/teams')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => TeamLeaderboardEntry.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load team leaderboard: ${response.body}');
    }
  }

  /// Get user's rank
  Future<Map<String, dynamic>> getMyRank(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/my-rank');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load rank: ${response.body}');
    }
  }

  // ==================== Social Interactions ====================

  /// Send cheer to participant
  Future<void> sendCheer({
    required String challengeId,
    required String toUserId,
  }) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/cheer');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({'toUserId': toUserId}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to send cheer: ${response.body}');
    }
  }

  /// Get challenge participants
  Future<List<ChallengeParticipant>> getParticipants({
    required String challengeId,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };

    final uri = Uri.parse('$baseUrl/challenges/$challengeId/participants')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ChallengeParticipant.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load participants: ${response.body}');
    }
  }

  // ==================== Statistics ====================

  /// Get challenge statistics
  Future<Map<String, dynamic>> getChallengeStats(String challengeId) async {
    final uri = Uri.parse('$baseUrl/challenges/$challengeId/stats');

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
