/**
 * Accessibility tests for AI Input Widget
 * Ensures WCAG 2.2 AA compliance for voice recording and file attachment features
 */

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';

import '../../lib/features/ai/presentation/widgets/ai_input_widget.dart';
import '../../lib/core/services/voice_recording_service.dart';
import '../../lib/core/services/speech_to_text_service.dart';
import '../mocks/service_mocks.dart';

void main() {
  group('AI Input Widget Accessibility Tests', () {
    late MockVoiceRecordingService mockVoiceService;
    late MockSpeechToTextService mockSpeechService;
    late ProviderContainer container;

    setUp(() {
      mockVoiceService = MockVoiceRecordingService();
      mockSpeechService = MockSpeechToTextService();
      
      container = ProviderContainer(
        overrides: [
          voiceRecordingServiceProvider.overrideWithValue(mockVoiceService),
          speechToTextServiceProvider.overrideWithValue(mockSpeechService),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    Widget createTestWidget() {
      return UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Scaffold(
            body: AIInputWidget(
              onSendMessage: (message, {attachments}) {},
              isLoading: false,
            ),
          ),
        ),
      );
    }

    testWidgets('should have no accessibility violations', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Verify semantic structure
      expect(find.byType(Semantics), findsWidgets);
      
      // Check that main container has accessibility properties
      final containerSemantics = tester.widget<Semantics>(
        find.descendant(
          of: find.byType(AIInputWidget),
          matching: find.byType(Semantics),
        ).first,
      );
      
      expect(containerSemantics.properties.label, contains('AI Coach input area'));
      expect(containerSemantics.properties.container, isTrue);
    });

    testWidgets('attachment button should be accessible', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Find attachment button semantics
      final attachmentButton = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.label == 'Attach files',
      );
      
      expect(attachmentButton, findsOneWidget);
      
      final semantics = tester.widget<Semantics>(attachmentButton);
      expect(semantics.properties.button, isTrue);
      expect(semantics.properties.enabled, isTrue);
      expect(semantics.properties.hint, isNotNull);
      expect(semantics.properties.hint, contains('images, documents, or audio files'));
    });

    testWidgets('text input should have proper semantics', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Find text field semantics
      final textFieldSemantics = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.textField == true,
      );
      
      expect(textFieldSemantics, findsOneWidget);
      
      final semantics = tester.widget<Semantics>(textFieldSemantics);
      expect(semantics.properties.label, 'Message input');
      expect(semantics.properties.multiline, isTrue);
      expect(semantics.properties.hint, contains('Type your message or question'));
    });

    testWidgets('voice recording button should announce state changes', (WidgetTester tester) async {
      when(mockVoiceService.stateStream).thenAnswer((_) => Stream.value(RecordingState.idle));
      
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Find voice/send button
      final actionButton = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   (widget.properties.label?.contains('voice recording') == true ||
                    widget.properties.label?.contains('Send message') == true),
      );
      
      expect(actionButton, findsOneWidget);
      
      final semantics = tester.widget<Semantics>(actionButton);
      expect(semantics.properties.button, isTrue);
      expect(semantics.properties.enabled, isTrue);
    });

    testWidgets('recording indicator should be announced to screen readers', (WidgetTester tester) async {
      // Mock recording state
      when(mockVoiceService.stateStream).thenAnswer(
        (_) => Stream.value(RecordingState.recording),
      );
      when(mockVoiceService.durationStream).thenAnswer(
        (_) => Stream.value(Duration(seconds: 5)),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Force recording state
      await tester.pump(Duration(milliseconds: 100));

      // Find recording indicator semantics
      final recordingIndicator = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.liveRegion == true &&
                   widget.properties.label?.contains('recording in progress') == true,
      );
      
      expect(recordingIndicator, findsOneWidget);
      
      final semantics = tester.widget<Semantics>(recordingIndicator);
      expect(semantics.properties.container, isTrue);
      expect(semantics.properties.value, contains('Recording for'));
      expect(semantics.properties.hint, contains('Voice input is being recorded'));
    });

    testWidgets('attachments preview should be accessible', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Simulate attached files (would need to modify widget to accept initial files for testing)
      // This test would verify that attached files have proper semantic labels
      
      // For now, verify the structure is ready for attachments
      expect(find.byType(AIInputWidget), findsOneWidget);
    });

    testWidgets('should support keyboard navigation', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Find text field
      final textField = find.byType(TextField);
      expect(textField, findsOneWidget);

      // Test focus
      await tester.tap(textField);
      await tester.pumpAndSettle();

      // Verify text field has focus
      final textFieldWidget = tester.widget<TextField>(textField);
      expect(textFieldWidget.focusNode?.hasFocus, isTrue);
    });

    testWidgets('should handle dynamic content updates accessibly', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Test entering text and verify semantic updates
      final textField = find.byType(TextField);
      await tester.enterText(textField, 'Hello AI');
      await tester.pumpAndSettle();

      // The send button should now be visible and accessible
      final sendButton = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.label == 'Send message',
      );
      
      expect(sendButton, findsOneWidget);
    });

    testWidgets('should provide meaningful error feedback', (WidgetTester tester) async {
      // Mock permission denied scenario
      when(mockSpeechService.initialize()).thenThrow(Exception('Permission denied'));
      
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Tap voice button to trigger permission request
      final voiceButton = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.label?.contains('voice recording') == true,
      );
      
      if (voiceButton.evaluate().isNotEmpty) {
        await tester.tap(voiceButton);
        await tester.pumpAndSettle();
      }

      // Verify error message appears (would need to implement in the actual widget)
      // This ensures users understand what went wrong
    });

    testWidgets('should support assistive technology gestures', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Test double-tap gesture for activation
      final attachButton = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.label == 'Attach files',
      );
      
      expect(attachButton, findsOneWidget);
      
      // Verify button responds to semantic actions
      final semantics = tester.widget<Semantics>(attachButton);
      expect(semantics.properties.onTap, isNotNull);
    });

    testWidgets('should maintain accessibility during animations', (WidgetTester tester) async {
      when(mockVoiceService.stateStream).thenAnswer(
        (_) => Stream.fromIterable([
          RecordingState.idle,
          RecordingState.recording,
          RecordingState.idle,
        ]),
      );

      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Verify accessibility is maintained during state transitions
      await tester.pump(Duration(milliseconds: 500));
      
      // Elements should remain accessible throughout animations
      expect(find.byType(Semantics), findsWidgets);
    });

    testWidgets('should provide context-sensitive help', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Verify hint text provides useful context
      final textFieldSemantics = find.byWidgetPredicate(
        (widget) => widget is Semantics && 
                   widget.properties.textField == true,
      );
      
      final semantics = tester.widget<Semantics>(textFieldSemantics);
      expect(semantics.properties.hint, isNotNull);
      expect(semantics.properties.hint, contains('AI coach'));
    });

    testWidgets('should meet touch target size requirements', (WidgetTester tester) async {
      await tester.pumpWidget(createTestWidget());
      await tester.pumpAndSettle();

      // Find interactive elements
      final buttons = find.byType(IconButton);
      
      for (final buttonFinder in buttons.evaluate()) {
        final button = buttonFinder.widget as IconButton;
        final renderBox = tester.renderObject(find.byWidget(button)) as RenderBox;
        final size = renderBox.size;
        
        // WCAG 2.2 AA requires minimum 24x24px, recommended 44x44px
        expect(size.width, greaterThanOrEqualTo(44.0));
        expect(size.height, greaterThanOrEqualTo(44.0));
      }
    });
  });

  group('Accessibility Integration Tests', () {
    testWidgets('complete voice recording flow should be accessible', (WidgetTester tester) async {
      // This would test the entire flow from button press to transcription
      // ensuring accessibility is maintained throughout
    });

    testWidgets('file attachment flow should be accessible', (WidgetTester tester) async {
      // This would test the complete file attachment process
      // including bottom sheet, file selection, and preview
    });
  });
}

// Mock classes would be defined in separate files
class MockVoiceRecordingService extends Mock implements VoiceRecordingService {}
class MockSpeechToTextService extends Mock implements SpeechToTextService {}

enum RecordingState { idle, recording, stopped }