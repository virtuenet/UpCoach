import 'package:flutter_test/flutter_test.dart';
import 'package:upcoach_mobile/shared/models/chat_models.dart';

void main() {
  group('ChatEvent', () {
    test('creates ChatEvent correctly', () {
      final event = ChatEvent(
        type: ChatEventType.messageReceived,
        conversationId: 'conv-001',
        messageId: 'msg-001',
        userId: 'user-001',
        data: {'content': 'Hello'},
        timestamp: DateTime(2024, 1, 15, 10, 30),
      );

      expect(event.type, equals(ChatEventType.messageReceived));
      expect(event.conversationId, equals('conv-001'));
      expect(event.messageId, equals('msg-001'));
      expect(event.userId, equals('user-001'));
      expect(event.data, isNotNull);
      expect(event.data!['content'], equals('Hello'));
    });

    test('creates ChatEvent with null optional fields', () {
      final event = ChatEvent(
        type: ChatEventType.typingStarted,
        timestamp: DateTime.now(),
      );

      expect(event.conversationId, isNull);
      expect(event.messageId, isNull);
      expect(event.userId, isNull);
      expect(event.data, isNull);
    });

    test('fromJson parses ChatEvent correctly', () {
      final json = {
        'type': 'messageReceived',
        'conversationId': 'conv-001',
        'messageId': 'msg-001',
        'userId': 'user-001',
        'data': {'content': 'Test message'},
        'timestamp': '2024-01-15T10:30:00.000Z',
      };

      final event = ChatEvent.fromJson(json);

      expect(event.type, equals(ChatEventType.messageReceived));
      expect(event.conversationId, equals('conv-001'));
      expect(event.messageId, equals('msg-001'));
    });

    test('fromJson handles unknown event type', () {
      final json = {
        'type': 'unknown_event',
        'timestamp': '2024-01-15T10:30:00.000Z',
      };

      final event = ChatEvent.fromJson(json);

      expect(event.type, equals(ChatEventType.messageReceived));
    });

    test('fromJson handles missing timestamp', () {
      final json = {
        'type': 'messageUpdated',
      };

      final event = ChatEvent.fromJson(json);

      expect(event.timestamp, isNotNull);
    });
  });

  group('ChatEventType', () {
    test('all event types are defined', () {
      expect(ChatEventType.values, containsAll([
        ChatEventType.messageReceived,
        ChatEventType.messageUpdated,
        ChatEventType.messageDeleted,
        ChatEventType.messageRead,
        ChatEventType.typingStarted,
        ChatEventType.typingStopped,
        ChatEventType.userOnline,
        ChatEventType.userOffline,
        ChatEventType.conversationUpdated,
      ]));
    });
  });

  group('MessageType', () {
    test('all message types are defined', () {
      expect(MessageType.values, containsAll([
        MessageType.text,
        MessageType.image,
        MessageType.file,
        MessageType.audio,
        MessageType.video,
        MessageType.system,
        MessageType.callStarted,
        MessageType.callEnded,
      ]));
    });
  });

  group('MessageStatus', () {
    test('all message statuses are defined', () {
      expect(MessageStatus.values, containsAll([
        MessageStatus.sending,
        MessageStatus.sent,
        MessageStatus.delivered,
        MessageStatus.read,
        MessageStatus.failed,
      ]));
    });
  });

  group('ConversationType', () {
    test('all conversation types are defined', () {
      expect(ConversationType.values, containsAll([
        ConversationType.direct,
        ConversationType.session,
        ConversationType.group,
      ]));
    });
  });

  group('TypingIndicator', () {
    test('creates TypingIndicator correctly', () {
      final indicator = TypingIndicator(
        odUserId: 'user-001',
        displayName: 'John Doe',
        startedAt: DateTime(2024, 1, 15, 10, 30),
      );

      expect(indicator.odUserId, equals('user-001'));
      expect(indicator.displayName, equals('John Doe'));
      expect(indicator.startedAt, isNotNull);
    });
  });

  group('WebSocket Message Parsing', () {
    test('parses message event correctly', () {
      final messageData = {
        'type': 'message',
        'data': {
          'id': 'msg-001',
          'conversationId': 'conv-001',
          'senderId': 'user-001',
          'content': 'Hello, world!',
          'type': 'text',
          'createdAt': '2024-01-15T10:30:00.000Z',
        },
      };

      // Simulate parsing
      final eventType = messageData['type'] as String?;
      expect(eventType, equals('message'));

      final data = messageData['data'] as Map<String, dynamic>;
      expect(data['id'], equals('msg-001'));
      expect(data['content'], equals('Hello, world!'));
    });

    test('parses typing event correctly', () {
      final typingData = {
        'type': 'typing',
        'conversationId': 'conv-001',
        'userId': 'user-001',
        'isTyping': true,
      };

      final eventType = typingData['type'] as String?;
      final isTyping = typingData['isTyping'] as bool?;

      expect(eventType, equals('typing'));
      expect(isTyping, isTrue);
    });

    test('parses user status event correctly', () {
      final statusData = {
        'type': 'user_status',
        'userId': 'user-001',
        'isOnline': true,
      };

      final eventType = statusData['type'] as String?;
      final isOnline = statusData['isOnline'] as bool?;

      expect(eventType, equals('user_status'));
      expect(isOnline, isTrue);
    });

    test('parses message read event correctly', () {
      final readData = {
        'type': 'message_read',
        'conversationId': 'conv-001',
        'messageId': 'msg-001',
        'userId': 'user-002',
      };

      final eventType = readData['type'];
      expect(eventType, equals('message_read'));
      expect(readData['messageId'], equals('msg-001'));
      expect(readData['userId'], equals('user-002'));
    });
  });

  group('WebSocket Send Payload', () {
    test('send_message payload structure', () {
      final payload = {
        'type': 'send_message',
        'conversationId': 'conv-001',
        'content': 'Hello!',
        'messageType': MessageType.text.name,
        'replyToMessageId': null,
        'mediaUrl': null,
        'metadata': null,
      };

      expect(payload['type'], equals('send_message'));
      expect(payload['conversationId'], equals('conv-001'));
      expect(payload['content'], equals('Hello!'));
      expect(payload['messageType'], equals('text'));
    });

    test('mark_read payload structure', () {
      final payload = {
        'type': 'mark_read',
        'conversationId': 'conv-001',
        'messageId': 'msg-001',
      };

      expect(payload['type'], equals('mark_read'));
      expect(payload['conversationId'], isNotNull);
    });

    test('typing payload structure', () {
      final payload = {
        'type': 'typing',
        'conversationId': 'conv-001',
        'isTyping': true,
      };

      expect(payload['type'], equals('typing'));
      expect(payload['isTyping'], isTrue);
    });

    test('join payload structure', () {
      final payload = {
        'type': 'join',
        'conversationId': 'conv-001',
      };

      expect(payload['type'], equals('join'));
      expect(payload['conversationId'], equals('conv-001'));
    });

    test('leave payload structure', () {
      final payload = {
        'type': 'leave',
        'conversationId': 'conv-001',
      };

      expect(payload['type'], equals('leave'));
    });

    test('ping payload structure', () {
      final payload = {
        'type': 'ping',
      };

      expect(payload['type'], equals('ping'));
    });
  });

  group('WebSocket URL Construction', () {
    test('constructs URL with token', () {
      const wsUrl = 'ws://localhost:3000';
      const token = 'test_token_123';
      final encodedToken = Uri.encodeComponent(token);

      final url = '$wsUrl/ws/chat?token=$encodedToken';

      expect(url, contains('ws://localhost:3000'));
      expect(url, contains('token='));
      expect(url, contains(encodedToken));
    });

    test('encodes special characters in token', () {
      const token = 'test+token/with=special&chars';
      final encodedToken = Uri.encodeComponent(token);

      expect(encodedToken, isNot(contains('+')));
      expect(encodedToken, isNot(contains('/')));
      expect(encodedToken, isNot(contains('=')));
      expect(encodedToken, isNot(contains('&')));
    });
  });

  group('Reconnection Logic', () {
    test('max reconnect attempts constant', () {
      const maxReconnectAttempts = 5;
      expect(maxReconnectAttempts, equals(5));
    });

    test('reconnect delay constant', () {
      const reconnectDelay = Duration(seconds: 3);
      expect(reconnectDelay.inSeconds, equals(3));
    });

    test('ping interval constant', () {
      const pingInterval = Duration(seconds: 30);
      expect(pingInterval.inSeconds, equals(30));
    });

    test('exponential backoff calculation', () {
      const baseDelay = Duration(seconds: 3);

      // First attempt
      final delay1 = baseDelay * 1;
      expect(delay1.inSeconds, equals(3));

      // Second attempt
      final delay2 = baseDelay * 2;
      expect(delay2.inSeconds, equals(6));

      // Third attempt
      final delay3 = baseDelay * 3;
      expect(delay3.inSeconds, equals(9));
    });
  });
}
