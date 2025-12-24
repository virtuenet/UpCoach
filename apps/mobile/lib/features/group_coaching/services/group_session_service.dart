import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/group_session_models.dart';

/// Group session service for API communication
class GroupSessionService {
  final String baseUrl;
  final String Function() getToken;

  GroupSessionService({
    required this.baseUrl,
    required this.getToken,
  });

  // ==================== Session Discovery ====================

  /// Get active/upcoming sessions for discovery
  Future<List<GroupSession>> discoverSessions({
    String? category,
    SessionType? sessionType,
    bool? isFree,
    int limit = 10,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    if (category != null) queryParams['category'] = category;
    if (sessionType != null) queryParams['sessionType'] = sessionType.name;
    if (isFree != null) queryParams['isFree'] = isFree.toString();

    final uri = Uri.parse('$baseUrl/group-sessions/discover')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => GroupSession.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load sessions: ${response.body}');
    }
  }

  /// Get session by ID
  Future<GroupSession> getSession(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      return GroupSession.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load session: ${response.body}');
    }
  }

  /// List sessions with filters
  Future<List<GroupSession>> listSessions({
    String? coachId,
    SessionStatus? status,
    SessionType? sessionType,
    String? category,
    bool? isFree,
    DateTime? fromDate,
    DateTime? toDate,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (coachId != null) queryParams['coachId'] = coachId;
    if (status != null) queryParams['status'] = status.name;
    if (sessionType != null) queryParams['sessionType'] = sessionType.name;
    if (category != null) queryParams['category'] = category;
    if (isFree != null) queryParams['isFree'] = isFree.toString();
    if (fromDate != null) queryParams['fromDate'] = fromDate.toIso8601String();
    if (toDate != null) queryParams['toDate'] = toDate.toIso8601String();
    if (search != null) queryParams['search'] = search;

    final uri = Uri.parse('$baseUrl/group-sessions')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> sessions = data['sessions'];
      return sessions.map((json) => GroupSession.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load sessions: ${response.body}');
    }
  }

  // ==================== Registration ====================

  /// Register for a session
  Future<RegistrationResult> registerForSession(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/register');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return RegistrationResult.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to register: ${response.body}');
    }
  }

  /// Cancel registration
  Future<bool> cancelRegistration(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/cancel');

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
      throw Exception('Failed to cancel registration: ${response.body}');
    }
  }

  /// Check if user is registered for session
  Future<bool> isRegistered(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/is-registered');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['isRegistered'] == true;
    } else {
      return false;
    }
  }

  // ==================== Participants ====================

  /// Get session participants
  Future<List<GroupSessionParticipant>> getParticipants(
    String sessionId, {
    ParticipantStatus? status,
    bool includeWaitlist = false,
  }) async {
    final queryParams = <String, String>{
      'includeWaitlist': includeWaitlist.toString(),
    };
    if (status != null) queryParams['status'] = status.name;

    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/participants')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => GroupSessionParticipant.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load participants: ${response.body}');
    }
  }

  // ==================== Live Session ====================

  /// Join live session (records attendance)
  Future<void> joinLiveSession(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/join');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to join session: ${response.body}');
    }
  }

  /// Leave live session
  Future<void> leaveLiveSession(String sessionId) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/leave');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to leave session: ${response.body}');
    }
  }

  // ==================== Chat ====================

  /// Send chat message
  Future<ChatMessage> sendMessage({
    required String sessionId,
    required String content,
    ChatMessageType type = ChatMessageType.text,
    String? replyToId,
  }) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/chat/messages');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'content': content,
        'messageType': type.name,
        if (replyToId != null) 'replyToId': replyToId,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return ChatMessage.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to send message: ${response.body}');
    }
  }

  /// Get chat messages
  Future<List<ChatMessage>> getChatMessages(
    String sessionId, {
    int limit = 50,
    String? before,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    if (before != null) queryParams['before'] = before;

    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/chat/messages')
        .replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => ChatMessage.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load messages: ${response.body}');
    }
  }

  /// React to message
  Future<void> reactToMessage({
    required String sessionId,
    required String messageId,
    required String emoji,
  }) async {
    final uri = Uri.parse(
        '$baseUrl/group-sessions/$sessionId/chat/messages/$messageId/react');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({'emoji': emoji}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to react to message: ${response.body}');
    }
  }

  /// Upvote message (for Q&A)
  Future<void> upvoteMessage({
    required String sessionId,
    required String messageId,
  }) async {
    final uri = Uri.parse(
        '$baseUrl/group-sessions/$sessionId/chat/messages/$messageId/upvote');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to upvote message: ${response.body}');
    }
  }

  // ==================== Polls ====================

  /// Vote on poll
  Future<void> votePoll({
    required String sessionId,
    required String messageId,
    required List<String> optionIds,
  }) async {
    final uri = Uri.parse(
        '$baseUrl/group-sessions/$sessionId/chat/messages/$messageId/vote');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({'optionIds': optionIds}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to vote: ${response.body}');
    }
  }

  // ==================== Ratings ====================

  /// Submit session rating
  Future<void> submitRating({
    required String sessionId,
    required int rating,
    String? feedback,
  }) async {
    final uri = Uri.parse('$baseUrl/group-sessions/$sessionId/rate');

    final response = await http.post(
      uri,
      headers: {
        'Authorization': 'Bearer ${getToken()}',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'rating': rating,
        if (feedback != null) 'feedback': feedback,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to submit rating: ${response.body}');
    }
  }

  // ==================== User's Sessions ====================

  /// Get user's upcoming sessions
  Future<List<GroupSession>> getMyUpcomingSessions() async {
    final uri = Uri.parse('$baseUrl/group-sessions/my-sessions/upcoming');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => GroupSession.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load sessions: ${response.body}');
    }
  }

  /// Get user's session history
  Future<List<GroupSession>> getMySessionHistory() async {
    final uri = Uri.parse('$baseUrl/group-sessions/my-sessions/history');

    final response = await http.get(
      uri,
      headers: {'Authorization': 'Bearer ${getToken()}'},
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => GroupSession.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load sessions: ${response.body}');
    }
  }
}
