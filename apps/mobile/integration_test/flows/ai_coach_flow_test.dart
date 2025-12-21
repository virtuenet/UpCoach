// AI Coach E2E Flow Tests
//
// Tests the AI coaching experience including:
// - AI chat functionality
// - Voice coaching
// - AI insights
// - Recommendations

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test_config.dart';
import '../helpers/test_helpers.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('AI Coach Chat Tests', () {
    testWidgets('Open AI coach and send message', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Verify AI coach screen loaded
      expect(find.text('AI Coach'), findsOneWidget);

      // Find message input
      final messageInput = find.byKey(const Key('ai_message_input'));
      expect(messageInput, findsOneWidget);

      // Enter a message
      await tester.enterText(messageInput, 'How can I improve my habits?');
      await tester.pumpAndSettle();

      // Send message
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      // Message should appear in chat
      expect(find.text('How can I improve my habits?'), findsOneWidget);

      // Wait for AI response (with timeout)
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Should see loading indicator or response
      final hasResponse = find.byKey(const Key('ai_response')).evaluate().isNotEmpty;
      final hasLoading = find.byType(CircularProgressIndicator).evaluate().isNotEmpty;
      expect(hasResponse || hasLoading, isTrue);
    });

    testWidgets('AI coach shows typing indicator while responding', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Send a message
      final messageInput = find.byKey(const Key('ai_message_input'));
      await tester.enterText(messageInput, 'Give me a tip');
      await tester.tap(find.byIcon(Icons.send));

      // Check for typing indicator
      await tester.pump(const Duration(milliseconds: 500));
      expect(find.byKey(const Key('typing_indicator')), findsOneWidget);
    });

    testWidgets('View chat history', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Open history
      await tester.tap(find.byIcon(Icons.history));
      await tester.pumpAndSettle();

      // Should see history list
      expect(find.text('Chat History'), findsOneWidget);
    });

    testWidgets('Clear chat history', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Open menu
      await tester.tap(find.byIcon(Icons.more_vert));
      await tester.pumpAndSettle();

      // Tap clear history
      await tester.tap(find.text('Clear History'));
      await tester.pumpAndSettle();

      // Confirm dialog
      await tester.tap(find.text('Clear'));
      await tester.pumpAndSettle();

      // Chat should be empty
      expect(find.byKey(const Key('empty_chat')), findsOneWidget);
    });
  });

  group('AI Insights Tests', () {
    testWidgets('View AI insights dashboard', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI insights
      await tester.tap(find.text('Insights'));
      await tester.pumpAndSettle();

      // Verify insights sections
      expect(find.text('AI Insights'), findsOneWidget);
      expect(find.byKey(const Key('weekly_summary')), findsOneWidget);
      expect(find.byKey(const Key('pattern_analysis')), findsOneWidget);
    });

    testWidgets('Drill down into specific insight', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI insights
      await tester.tap(find.text('Insights'));
      await tester.pumpAndSettle();

      // Tap on a specific insight card
      await tester.tap(find.byKey(const Key('insight_card_0')));
      await tester.pumpAndSettle();

      // Should see detailed view
      expect(find.byKey(const Key('insight_detail')), findsOneWidget);
    });

    testWidgets('Share insight', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI insights
      await tester.tap(find.text('Insights'));
      await tester.pumpAndSettle();

      // Long press to share
      await tester.longPress(find.byKey(const Key('insight_card_0')));
      await tester.pumpAndSettle();

      // Share option should appear
      expect(find.text('Share'), findsOneWidget);
    });
  });

  group('AI Recommendations Tests', () {
    testWidgets('View personalized recommendations', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to recommendations
      await tester.tap(find.text('For You'));
      await tester.pumpAndSettle();

      // Verify recommendations loaded
      expect(find.text('Recommendations'), findsOneWidget);
      expect(find.byType(ListView), findsOneWidget);
    });

    testWidgets('Accept recommendation creates habit', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to recommendations
      await tester.tap(find.text('For You'));
      await tester.pumpAndSettle();

      // Tap first recommendation
      await tester.tap(find.byKey(const Key('recommendation_0')));
      await tester.pumpAndSettle();

      // Tap "Add to habits"
      await tester.tap(find.text('Add to habits'));
      await tester.pumpAndSettle();

      // Should see success message
      expect(find.text('Habit added!'), findsOneWidget);
    });

    testWidgets('Dismiss recommendation', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to recommendations
      await tester.tap(find.text('For You'));
      await tester.pumpAndSettle();

      // Swipe to dismiss
      await tester.drag(
        find.byKey(const Key('recommendation_0')),
        const Offset(-300, 0),
      );
      await tester.pumpAndSettle();

      // Should be dismissed
      expect(find.byKey(const Key('recommendation_0')), findsNothing);
    });

    testWidgets('Refresh recommendations', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to recommendations
      await tester.tap(find.text('For You'));
      await tester.pumpAndSettle();

      // Pull to refresh
      await tester.fling(
        find.byType(ListView),
        const Offset(0, 300),
        1000,
      );
      await tester.pumpAndSettle();

      // Should see refresh indicator
      expect(find.byType(RefreshIndicator), findsOneWidget);
    });
  });

  group('Voice Coach Tests', () {
    testWidgets('Open voice coach interface', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to voice coach
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Verify voice coach UI
      expect(find.text('Voice Coach'), findsOneWidget);
      expect(find.byKey(const Key('voice_button')), findsOneWidget);
    });

    testWidgets('Start and stop voice recording', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to voice coach
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Tap voice button to start
      await tester.tap(find.byKey(const Key('voice_button')));
      await tester.pumpAndSettle();

      // Should show recording state
      expect(find.byKey(const Key('recording_indicator')), findsOneWidget);

      // Tap again to stop
      await tester.tap(find.byKey(const Key('voice_button')));
      await tester.pumpAndSettle();

      // Recording should stop
      expect(find.byKey(const Key('recording_indicator')), findsNothing);
    });
  });

  group('AI Coach Error Handling Tests', () {
    testWidgets('Handle network error gracefully', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
        simulateNetworkError: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Send a message
      final messageInput = find.byKey(const Key('ai_message_input'));
      await tester.enterText(messageInput, 'Test message');
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should see error message
      expect(find.text('Unable to connect'), findsOneWidget);

      // Retry button should be visible
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('Handle empty response', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Send empty message (should be prevented)
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle();

      // Send button should be disabled when input is empty
      final sendButton = find.byIcon(Icons.send);
      expect(tester.widget<IconButton>(sendButton.first).onPressed, isNull);
    });
  });

  group('AI Coach Accessibility Tests', () {
    testWidgets('Voice coach has VoiceOver support', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to voice coach
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Check semantic labels
      final voiceButton = find.byKey(const Key('voice_button'));
      expect(
        tester.getSemantics(voiceButton),
        matchesSemantics(
          label: 'Start voice recording',
          hasTapAction: true,
        ),
      );
    });

    testWidgets('Chat messages are announced', (tester) async {
      await tester.pumpWidget(await TestConfig.createTestApp(
        isAuthenticated: true,
      ));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to AI coach
      await tester.tap(find.byIcon(Icons.smart_toy));
      await tester.pumpAndSettle();

      // Messages should have live region semantics for screen readers
      expect(find.bySemanticsLabel(RegExp('AI Coach')), findsWidgets);
    });
  });
}
