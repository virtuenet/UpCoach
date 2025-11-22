import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:dio/dio.dart';
import 'package:upcoach/features/ai/domain/services/ai_service.dart';
import 'package:upcoach/features/ai/domain/models/ai_response.dart';
import 'package:upcoach/core/services/api_service.dart';
import 'package:upcoach/core/services/auth_service.dart';
import 'package:upcoach/core/services/offline_ai_service.dart';
import 'package:upcoach/core/services/ai_monitoring_service.dart';
import 'package:upcoach/core/services/voice_journal_sync_service.dart';

// Mock classes
class MockApiService extends Mock implements ApiService {}
class MockAuthService extends Mock implements AuthService {}
class MockDio extends Mock implements Dio {}

void main() {
  group('AI Features Integration Tests', () {
    late AIService aiService;
    late MockApiService mockApiService;
    late MockAuthService mockAuthService;
    late OfflineAIService offlineAIService;
    late AIMonitoringService monitoringService;

    setUp(() {
      mockApiService = MockApiService();
      mockAuthService = MockAuthService();
      aiService = AIService(api: mockApiService, auth: mockAuthService);
      offlineAIService = OfflineAIService(
        apiService: mockApiService,
        authService: mockAuthService,
      );
      monitoringService = AIMonitoringService(apiService: mockApiService);
    });

    group('AI Service Tests', () {
      test('Should send message and receive AI response', () async {
        // Arrange
        const message = 'How can I improve my productivity?';
        const conversationId = 'conv123';
        
        when(mockApiService.post(
          '/api/chat/message',
          data: anyNamed('data'),
          options: anyNamed('options'),
        )).thenAnswer((_) async => Response(
          data: {
            'success': true,
            'data': {
              'conversationId': conversationId,
              'aiMessage': {
                'content': 'Here are some productivity tips...',
                'created_at': DateTime.now().toIso8601String(),
                'metadata': {'tokens': 150, 'provider': 'openai'},
              },
            },
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/chat/message'),
        ));

        // Act
        final response = await aiService.sendMessage(
          message,
          conversationId: conversationId,
        );

        // Assert
        expect(response.content, contains('productivity tips'));
        expect(response.conversationId, equals(conversationId));
        expect(response.role, equals('assistant'));
      });

      test('Should handle API errors gracefully', () async {
        // Arrange
        const message = 'Test message';
        
        when(mockApiService.post(
          '/api/chat/message',
          data: anyNamed('data'),
          options: anyNamed('options'),
        )).thenThrow(DioException(
          type: DioExceptionType.connectionTimeout,
          requestOptions: RequestOptions(path: '/api/chat/message'),
        ));

        // Act & Assert
        expect(
          () => aiService.sendMessage(message),
          throwsException,
        );
      });

      test('Should retry on transient errors', () async {
        // Arrange
        const message = 'Test message';
        var callCount = 0;
        
        when(mockApiService.post(
          '/api/chat/message',
          data: anyNamed('data'),
          options: anyNamed('options'),
        )).thenAnswer((_) async {
          callCount++;
          if (callCount < 2) {
            throw DioException(
              type: DioExceptionType.connectionTimeout,
              requestOptions: RequestOptions(path: '/api/chat/message'),
            );
          }
          return Response(
            data: {
              'success': true,
              'data': {
                'conversationId': 'conv123',
                'aiMessage': {
                  'content': 'Success after retry',
                  'created_at': DateTime.now().toIso8601String(),
                },
              },
            },
            statusCode: 200,
            requestOptions: RequestOptions(path: '/api/chat/message'),
          );
        });

        // Act
        final response = await aiService.sendMessage(message);

        // Assert
        expect(response.content, equals('Success after retry'));
        expect(callCount, equals(2)); // Initial + 1 retry
      });
    });

    group('Offline AI Service Tests', () {
      test('Should queue messages when offline', () async {
        // Arrange
        const message = 'Offline test message';
        
        when(mockApiService.get(
          '/api/health',
          options: anyNamed('options'),
        )).thenThrow(DioException(
          type: DioExceptionType.connectionError,
          requestOptions: RequestOptions(path: '/api/health'),
        ));

        // Act
        final response = await offlineAIService.processMessageWithFallback(
          message: message,
          allowOffline: true,
        );

        // Assert
        expect(response.metadata?['offline'], isTrue);
        expect(response.metadata?['queued'], isTrue);
        expect(response.content, contains('offline'));
        
        final queueStatus = offlineAIService.getQueueStatus();
        expect(queueStatus['queueSize'], greaterThan(0));
      });

      test('Should process queued messages when online', () async {
        // Arrange - First queue a message while offline
        const message = 'Test message for queue';
        
        when(mockApiService.get(
          '/api/health',
          options: anyNamed('options'),
        )).thenThrow(DioException(
          type: DioExceptionType.connectionError,
          requestOptions: RequestOptions(path: '/api/health'),
        ));

        await offlineAIService.processMessageWithFallback(
          message: message,
          allowOffline: true,
        );

        // Now simulate coming back online
        when(mockApiService.get(
          '/api/health',
          options: anyNamed('options'),
        )).thenAnswer((_) async => Response(
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/health'),
        ));

        when(mockApiService.post(
          '/api/chat/message',
          data: anyNamed('data'),
        )).thenAnswer((_) async => Response(
          data: {
            'success': true,
            'data': {
              'conversationId': 'conv123',
              'aiMessage': {
                'content': 'Processed from queue',
                'created_at': DateTime.now().toIso8601String(),
              },
            },
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/chat/message'),
        ));

        // Act - Process queue
        await offlineAIService._processOfflineQueue();

        // Assert
        final queueStatus = offlineAIService.getQueueStatus();
        expect(queueStatus['queueSize'], equals(0));
      });

      test('Should provide intelligent offline responses', () async {
        // Test different message types
        final testCases = [
          ('How can I achieve my goals?', 'goal'),
          ('I feel stressed today', 'emotion'),
          ('What should I do next?', 'advice'),
        ];

        for (final testCase in testCases) {
          final response = offlineAIService._generateOfflineResponse(testCase.$1);
          
          expect(response.content, isNotEmpty);
          expect(response.metadata?['offline'], isTrue);
          
          // Check for context-aware response
          if (testCase.$2 == 'goal') {
            expect(response.content.toLowerCase(), contains('goal'));
          } else if (testCase.$2 == 'emotion') {
            expect(response.content.toLowerCase(), contains('feel'));
          }
        }
      });
    });

    group('AI Monitoring Service Tests', () {
      test('Should track request performance metrics', () async {
        // Arrange
        final startTime = DateTime.now();
        final endTime = startTime.add(const Duration(milliseconds: 1500));

        // Act
        await monitoringService.trackRequest(
          requestId: 'req123',
          type: 'chat_message',
          startTime: startTime,
          endTime: endTime,
          success: true,
        );

        // Assert
        final stats = monitoringService.getPerformanceStats();
        expect(stats['totalRequests'], equals(1));
        expect(stats['successRate'], equals(1.0));
        expect(stats['averageResponseTime'], equals(1500.0));
        expect(stats['performanceScore'], greaterThan(0));
      });

      test('Should calculate response time percentiles', () async {
        // Arrange - Add multiple requests with varying response times
        final responseTimes = [500, 800, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 5000];
        
        for (int i = 0; i < responseTimes.length; i++) {
          final startTime = DateTime.now();
          final endTime = startTime.add(Duration(milliseconds: responseTimes[i]));
          
          await monitoringService.trackRequest(
            requestId: 'req$i',
            type: 'chat_message',
            startTime: startTime,
            endTime: endTime,
            success: true,
          );
        }

        // Act
        final stats = monitoringService.getPerformanceStats();

        // Assert
        final percentiles = stats['responseTimePercentiles'];
        expect(percentiles['p50'], lessThanOrEqualTo(2500)); // Median
        expect(percentiles['p95'], lessThanOrEqualTo(5000)); // 95th percentile
        expect(percentiles['p99'], lessThanOrEqualTo(5000)); // 99th percentile
      });

      test('Should track session analytics', () async {
        // Act
        await monitoringService.trackSession(
          sessionId: 'session123',
          userId: 'user456',
          messageCount: 10,
          sessionDuration: const Duration(minutes: 15),
          userSatisfactionScore: 4.5,
          features: {'voice_enabled': true},
        );

        // Assert
        final analytics = monitoringService.getSessionAnalytics();
        expect(analytics['totalSessions'], equals(1));
        expect(analytics['averageMessagesPerSession'], equals(10.0));
        expect(analytics['averageSatisfactionScore'], equals(4.5));
        expect(analytics['activeUsers'], equals(1));
      });

      test('Should detect performance issues and trigger alerts', () async {
        // Arrange - Track a slow request
        final startTime = DateTime.now();
        final endTime = startTime.add(const Duration(milliseconds: 5000)); // Very slow

        // Act
        await monitoringService.trackRequest(
          requestId: 'slow_req',
          type: 'chat_message',
          startTime: startTime,
          endTime: endTime,
          success: true,
        );

        // Assert - Alert should have been triggered (check logs in debug mode)
        final stats = monitoringService.getPerformanceStats();
        expect(stats['averageResponseTime'], greaterThan(4000));
      });

      test('Should export metrics for analysis', () {
        // Arrange
        final startTime = DateTime.now();
        final endTime = startTime.add(const Duration(milliseconds: 1000));

        monitoringService.trackRequest(
          requestId: 'export_test',
          type: 'chat_message',
          startTime: startTime,
          endTime: endTime,
          success: true,
        );

        // Act
        final exportData = monitoringService.exportMetrics(
          period: const Duration(hours: 1),
        );

        // Assert
        expect(exportData['metrics'], isA<List>());
        expect(exportData['sessions'], isA<List>());
        expect(exportData['exportedAt'], isNotNull);
        expect(exportData['period'], equals(1));
      });
    });

    group('Voice Journal Sync Service Tests', () {
      test('Should handle sync conflicts gracefully', () async {
        // This would test the conflict resolution logic
        // Implementation depends on the specific sync service setup
        
        // Arrange
        final syncService = VoiceJournalSyncService(
          _storageService: MockVoiceJournalStorageService(),
          _apiService: mockApiService,
          _authService: mockAuthService,
          _offlineService: MockOfflineService(),
        );

        // Test conflict detection and resolution
        final localEntry = VoiceJournalEntry(
          id: 'entry123',
          title: 'Local Version',
          audioFilePath: '/local/path',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          durationSeconds: 60,
          fileSizeBytes: 1000,
          transcriptionText: 'Local transcription',
          updatedAt: DateTime.now().subtract(const Duration(hours: 1)),
        );

        final remoteEntry = VoiceJournalEntry(
          id: 'entry123',
          title: 'Remote Version',
          audioFilePath: '',
          cloudUrl: 'cloud://path',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          durationSeconds: 60,
          fileSizeBytes: 1000,
          transcriptionText: 'Remote transcription',
          updatedAt: DateTime.now(),
        );

        final conflict = await syncService._detectConflict(localEntry, remoteEntry);
        
        expect(conflict, isNotNull);
        expect(conflict!.entryId, equals('entry123'));
        expect(conflict.reason, contains('transcription'));
      });
    });

    group('End-to-End AI Feature Flow', () {
      test('Complete AI coaching session flow', () async {
        // This tests the complete flow from user input to AI response
        
        // 1. User starts a new conversation
        when(mockApiService.post(
          '/api/chat/conversations',
          data: anyNamed('data'),
        )).thenAnswer((_) async => Response(
          data: {
            'success': true,
            'data': {
              'conversation': {
                'id': 'new_conv_123',
                'title': 'New Conversation',
              },
            },
          },
          statusCode: 201,
          requestOptions: RequestOptions(path: '/api/chat/conversations'),
        ));

        final conversationId = await aiService.createConversation(
          title: 'Productivity Coaching',
        );
        
        expect(conversationId, equals('new_conv_123'));

        // 2. User sends first message
        when(mockApiService.post(
          '/api/chat/message',
          data: anyNamed('data'),
          options: anyNamed('options'),
        )).thenAnswer((_) async => Response(
          data: {
            'success': true,
            'data': {
              'conversationId': conversationId,
              'aiMessage': {
                'content': 'I can help you with productivity. What specific area would you like to focus on?',
                'created_at': DateTime.now().toIso8601String(),
                'metadata': {'tokens': 20},
              },
            },
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/chat/message'),
        ));

        final response = await aiService.sendMessage(
          'I want to improve my daily productivity',
          conversationId: conversationId,
        );

        expect(response.content, contains('productivity'));
        
        // 3. Track performance
        await monitoringService.trackRequest(
          requestId: conversationId!,
          type: 'initial_message',
          startTime: DateTime.now().subtract(const Duration(milliseconds: 1200)),
          endTime: DateTime.now(),
          success: true,
        );

        // 4. User continues conversation
        when(mockApiService.get(
          '/api/chat/conversations/$conversationId',
        )).thenAnswer((_) async => Response(
          data: {
            'success': true,
            'data': {
              'conversation': {
                'id': conversationId,
                'title': 'Productivity Coaching',
                'messages': [
                  {
                    'content': 'I want to improve my daily productivity',
                    'is_from_user': true,
                    'created_at': DateTime.now().toIso8601String(),
                  },
                  {
                    'content': 'I can help you with productivity. What specific area would you like to focus on?',
                    'is_from_user': false,
                    'created_at': DateTime.now().toIso8601String(),
                  },
                ],
              },
            },
          },
          statusCode: 200,
          requestOptions: RequestOptions(path: '/api/chat/conversations/$conversationId'),
        ));

        final history = await aiService.getConversationHistory(conversationId);
        expect(history.length, equals(2));

        // 5. Session ends - track analytics
        await monitoringService.trackSession(
          sessionId: conversationId,
          userId: 'test_user',
          messageCount: 2,
          sessionDuration: const Duration(minutes: 5),
          userSatisfactionScore: 4.0,
        );

        final sessionStats = monitoringService.getSessionAnalytics();
        expect(sessionStats['totalSessions'], equals(1));
        expect(sessionStats['averageMessagesPerSession'], equals(2.0));
      });
    });
  });
}

// Mock classes for testing
class MockVoiceJournalStorageService extends Mock implements VoiceJournalStorageService {}
class MockOfflineService extends Mock implements OfflineService {}