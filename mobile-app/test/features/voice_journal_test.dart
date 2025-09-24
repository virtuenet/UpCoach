import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:upcoach_mobile/features/journal/presentation/screens/voice_journal_screen.dart';
import 'package:upcoach_mobile/features/journal/providers/voice_journal_provider.dart';
import 'package:upcoach_mobile/core/services/voice_journal_storage_service.dart';
import 'package:upcoach_mobile/core/services/audio_service.dart';

import 'voice_journal_test.mocks.dart';

@GenerateMocks([
  VoiceJournalStorageService,
  AudioService,
  AudioRecorder,
  AudioPlayer,
])
void main() {
  group('Voice Journal Tests', () {
    late MockVoiceJournalStorageService mockStorageService;
    late MockAudioService mockAudioService;
    late MockAudioRecorder mockRecorder;
    late MockAudioPlayer mockPlayer;

    setUp(() {
      mockStorageService = MockVoiceJournalStorageService();
      mockAudioService = MockAudioService();
      mockRecorder = MockAudioRecorder();
      mockPlayer = MockAudioPlayer();
    });

    testWidgets('should display empty state when no recordings exist', (tester) async {
      // Arrange
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => []);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Assert
      expect(find.text('No voice journals yet'), findsOneWidget);
      expect(find.text('Tap the microphone to start recording'), findsOneWidget);
      expect(find.byIcon(Icons.mic), findsOneWidget);
    });

    testWidgets('should start recording when microphone is tapped', (tester) async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => true);
      when(mockAudioService.startRecording()).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            audioServiceProvider.overrideWithValue(mockAudioService),
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Assert
      verify(mockAudioService.startRecording()).called(1);
      expect(find.byIcon(Icons.stop), findsOneWidget);
    });

    testWidgets('should stop recording and save when stop button is tapped', (tester) async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => true);
      when(mockAudioService.startRecording()).thenAnswer((_) async => true);
      when(mockAudioService.stopRecording()).thenAnswer((_) async => 'recorded_audio.m4a');
      when(mockStorageService.saveVoiceJournal(any)).thenAnswer((_) async => 'journal_id');

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            audioServiceProvider.overrideWithValue(mockAudioService),
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.stop));
      await tester.pumpAndSettle();

      // Assert
      verify(mockAudioService.stopRecording()).called(1);
      verify(mockStorageService.saveVoiceJournal(any)).called(1);
    });

    testWidgets('should request permission if not granted', (tester) async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => false);
      when(mockAudioService.requestPermission()).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            audioServiceProvider.overrideWithValue(mockAudioService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Assert
      verify(mockAudioService.requestPermission()).called(1);
    });

    testWidgets('should display recording duration during recording', (tester) async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => true);
      when(mockAudioService.startRecording()).thenAnswer((_) async => true);
      when(mockAudioService.getRecordingDuration()).thenAnswer((_) => Duration(seconds: 30));

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            audioServiceProvider.overrideWithValue(mockAudioService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.mic));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('00:30'), findsOneWidget);
    });

    testWidgets('should display voice journal list when recordings exist', (tester) async {
      // Arrange
      final mockJournals = [
        VoiceJournal(
          id: '1',
          filePath: 'journal1.m4a',
          title: 'My thoughts today',
          duration: Duration(minutes: 2, seconds: 30),
          createdAt: DateTime.now(),
        ),
        VoiceJournal(
          id: '2',
          filePath: 'journal2.m4a',
          title: 'Evening reflection',
          duration: Duration(minutes: 1, seconds: 45),
          createdAt: DateTime.now().subtract(Duration(days: 1)),
        ),
      ];
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => mockJournals);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Assert
      expect(find.byType(ListView), findsOneWidget);
      expect(find.text('My thoughts today'), findsOneWidget);
      expect(find.text('Evening reflection'), findsOneWidget);
      expect(find.text('02:30'), findsOneWidget);
      expect(find.text('01:45'), findsOneWidget);
    });

    testWidgets('should play journal when play button is tapped', (tester) async {
      // Arrange
      final mockJournal = VoiceJournal(
        id: '1',
        filePath: 'journal1.m4a',
        title: 'My thoughts today',
        duration: Duration(minutes: 2, seconds: 30),
        createdAt: DateTime.now(),
      );
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => [mockJournal]);
      when(mockAudioService.playAudio('journal1.m4a')).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
            audioServiceProvider.overrideWithValue(mockAudioService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.play_arrow).first);
      await tester.pumpAndSettle();

      // Assert
      verify(mockAudioService.playAudio('journal1.m4a')).called(1);
    });

    testWidgets('should pause playback when pause button is tapped', (tester) async {
      // Arrange
      final mockJournal = VoiceJournal(
        id: '1',
        filePath: 'journal1.m4a',
        title: 'My thoughts today',
        duration: Duration(minutes: 2, seconds: 30),
        createdAt: DateTime.now(),
      );
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => [mockJournal]);
      when(mockAudioService.playAudio('journal1.m4a')).thenAnswer((_) async => true);
      when(mockAudioService.pauseAudio()).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
            audioServiceProvider.overrideWithValue(mockAudioService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.play_arrow).first);
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.pause).first);
      await tester.pumpAndSettle();

      // Assert
      verify(mockAudioService.pauseAudio()).called(1);
    });

    testWidgets('should delete journal when delete is confirmed', (tester) async {
      // Arrange
      final mockJournal = VoiceJournal(
        id: '1',
        filePath: 'journal1.m4a',
        title: 'My thoughts today',
        duration: Duration(minutes: 2, seconds: 30),
        createdAt: DateTime.now(),
      );
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => [mockJournal]);
      when(mockStorageService.deleteVoiceJournal('1')).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: VoiceJournalScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.longPress(find.text('My thoughts today'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle();

      // Assert
      verify(mockStorageService.deleteVoiceJournal('1')).called(1);
    });

    group('Voice Journal Transcription', () {
      testWidgets('should show transcription when available', (tester) async {
        // Arrange
        final mockJournal = VoiceJournal(
          id: '1',
          filePath: 'journal1.m4a',
          title: 'My thoughts today',
          transcription: 'Today was a great day. I accomplished many things.',
          duration: Duration(minutes: 2, seconds: 30),
          createdAt: DateTime.now(),
        );
        when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => [mockJournal]);

        // Act
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
            ],
            child: MaterialApp(
              home: VoiceJournalScreen(),
            ),
          ),
        );

        await tester.pumpAndSettle();
        await tester.tap(find.text('My thoughts today'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Today was a great day. I accomplished many things.'), findsOneWidget);
      });

      testWidgets('should request transcription when not available', (tester) async {
        // Arrange
        final mockJournal = VoiceJournal(
          id: '1',
          filePath: 'journal1.m4a',
          title: 'My thoughts today',
          duration: Duration(minutes: 2, seconds: 30),
          createdAt: DateTime.now(),
        );
        when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => [mockJournal]);
        when(mockAudioService.transcribeAudio('journal1.m4a'))
            .thenAnswer((_) async => 'Generated transcription');

        // Act
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
              audioServiceProvider.overrideWithValue(mockAudioService),
            ],
            child: MaterialApp(
              home: VoiceJournalScreen(),
            ),
          ),
        );

        await tester.pumpAndSettle();
        await tester.tap(find.text('My thoughts today'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Generate Transcription'));
        await tester.pumpAndSettle();

        // Assert
        verify(mockAudioService.transcribeAudio('journal1.m4a')).called(1);
      });
    });
  });

  group('Voice Journal Provider Tests', () {
    late MockVoiceJournalStorageService mockStorageService;
    late MockAudioService mockAudioService;
    late ProviderContainer container;

    setUp(() {
      mockStorageService = MockVoiceJournalStorageService();
      mockAudioService = MockAudioService();
      container = ProviderContainer(
        overrides: [
          voiceJournalStorageServiceProvider.overrideWithValue(mockStorageService),
          audioServiceProvider.overrideWithValue(mockAudioService),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('should load voice journals on initialization', () async {
      // Arrange
      final mockJournals = [
        VoiceJournal(
          id: '1',
          filePath: 'journal1.m4a',
          title: 'Test Journal',
          duration: Duration(minutes: 1),
          createdAt: DateTime.now(),
        ),
      ];
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => mockJournals);

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      await provider.loadJournals();

      // Assert
      final state = container.read(voiceJournalProvider);
      expect(state.journals.length, equals(1));
      expect(state.journals.first.id, equals('1'));
    });

    test('should start recording successfully', () async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => true);
      when(mockAudioService.startRecording()).thenAnswer((_) async => true);

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      await provider.startRecording();

      // Assert
      final state = container.read(voiceJournalProvider);
      expect(state.isRecording, isTrue);
      verify(mockAudioService.startRecording()).called(1);
    });

    test('should stop recording and save journal', () async {
      // Arrange
      when(mockAudioService.stopRecording()).thenAnswer((_) async => 'recorded.m4a');
      when(mockStorageService.saveVoiceJournal(any)).thenAnswer((_) async => 'journal_id');

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      // First start recording
      container.read(voiceJournalProvider.notifier).state =
          container.read(voiceJournalProvider).copyWith(isRecording: true);

      await provider.stopRecording();

      // Assert
      final state = container.read(voiceJournalProvider);
      expect(state.isRecording, isFalse);
      verify(mockAudioService.stopRecording()).called(1);
      verify(mockStorageService.saveVoiceJournal(any)).called(1);
    });

    test('should handle permission denied gracefully', () async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => false);
      when(mockAudioService.requestPermission()).thenAnswer((_) async => false);

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      await provider.startRecording();

      // Assert
      final state = container.read(voiceJournalProvider);
      expect(state.isRecording, isFalse);
      expect(state.errorMessage, contains('permission'));
    });

    test('should delete journal successfully', () async {
      // Arrange
      final mockJournals = [
        VoiceJournal(
          id: '1',
          filePath: 'journal1.m4a',
          title: 'Test Journal',
          duration: Duration(minutes: 1),
          createdAt: DateTime.now(),
        ),
      ];
      when(mockStorageService.getVoiceJournals()).thenAnswer((_) async => mockJournals);
      when(mockStorageService.deleteVoiceJournal('1')).thenAnswer((_) async => true);

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      await provider.loadJournals();
      await provider.deleteJournal('1');

      // Assert
      verify(mockStorageService.deleteVoiceJournal('1')).called(1);
    });

    test('should handle recording errors', () async {
      // Arrange
      when(mockAudioService.hasPermission()).thenAnswer((_) async => true);
      when(mockAudioService.startRecording()).thenThrow(Exception('Recording failed'));

      // Act
      final provider = container.read(voiceJournalProvider.notifier);
      await provider.startRecording();

      // Assert
      final state = container.read(voiceJournalProvider);
      expect(state.hasError, isTrue);
      expect(state.errorMessage, contains('Recording failed'));
    });
  });
}