import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:provider/provider.dart';
import 'package:audio_waveforms/audio_waveforms.dart';

import 'package:upcoach_mobile/features/voice_journal/presentation/widgets/voice_journal_recorder.dart';
import 'package:upcoach_mobile/features/voice_journal/presentation/widgets/voice_journal_player.dart';
import 'package:upcoach_mobile/features/voice_journal/presentation/pages/voice_journal_page.dart';
import 'package:upcoach_mobile/features/voice_journal/data/models/voice_journal_model.dart';
import 'package:upcoach_mobile/features/voice_journal/domain/repositories/voice_journal_repository.dart';
import 'package:upcoach_mobile/core/services/audio_service.dart';
import 'package:upcoach_mobile/core/services/permission_service.dart';

// Generate mocks
@GenerateMocks([
  VoiceJournalRepository,
  AudioService,
  PermissionService,
  PlayerController,
  RecorderController,
])
import 'voice_journal_widget_test.mocks.dart';

void main() {
  group('Voice Journal Widgets', () {
    late MockVoiceJournalRepository mockRepository;
    late MockAudioService mockAudioService;
    late MockPermissionService mockPermissionService;
    late MockPlayerController mockPlayerController;
    late MockRecorderController mockRecorderController;

    setUp(() {
      mockRepository = MockVoiceJournalRepository();
      mockAudioService = MockAudioService();
      mockPermissionService = MockPermissionService();
      mockPlayerController = MockPlayerController();
      mockRecorderController = MockRecorderController();
    });

    group('VoiceJournalRecorder Widget', () {
      testWidgets('should display record button when not recording', (tester) async {
        // Setup
        when(mockPermissionService.hasMicrophonePermission())
            .thenAnswer((_) async => true);
        when(mockRecorderController.isRecording).thenReturn(false);
        when(mockRecorderController.hasPermission).thenReturn(true);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.byIcon(Icons.mic), findsOneWidget);
        expect(find.text('Tap to record'), findsOneWidget);
        expect(find.byIcon(Icons.stop), findsNothing);
      });

      testWidgets('should show recording state when recording', (tester) async {
        // Setup
        when(mockRecorderController.isRecording).thenReturn(true);
        when(mockRecorderController.hasPermission).thenReturn(true);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.byIcon(Icons.stop), findsOneWidget);
        expect(find.text('Recording...'), findsOneWidget);
        expect(find.byType(LinearProgressIndicator), findsOneWidget);
      });

      testWidgets('should start recording when record button is tapped', (tester) async {
        // Setup
        when(mockPermissionService.hasMicrophonePermission())
            .thenAnswer((_) async => true);
        when(mockRecorderController.isRecording).thenReturn(false);
        when(mockRecorderController.hasPermission).thenReturn(true);
        when(mockRecorderController.record())
            .thenAnswer((_) async {});

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Tap record button
        await tester.tap(find.byIcon(Icons.mic));
        await tester.pump();

        // Verify
        verify(mockRecorderController.record()).called(1);
      });

      testWidgets('should stop recording when stop button is tapped', (tester) async {
        // Setup
        when(mockRecorderController.isRecording).thenReturn(true);
        when(mockRecorderController.hasPermission).thenReturn(true);
        when(mockRecorderController.stop())
            .thenAnswer((_) async => '/path/to/recording.wav');

        String? recordedFilePath;

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {
                  recordedFilePath = filePath;
                },
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Tap stop button
        await tester.tap(find.byIcon(Icons.stop));
        await tester.pump();

        // Verify
        verify(mockRecorderController.stop()).called(1);
        expect(recordedFilePath, equals('/path/to/recording.wav'));
      });

      testWidgets('should show permission denied message when no microphone permission', (tester) async {
        // Setup
        when(mockPermissionService.hasMicrophonePermission())
            .thenAnswer((_) async => false);
        when(mockRecorderController.hasPermission).thenReturn(false);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('Microphone permission required'), findsOneWidget);
        expect(find.text('Grant Permission'), findsOneWidget);
      });

      testWidgets('should request permission when grant permission is tapped', (tester) async {
        // Setup
        when(mockPermissionService.hasMicrophonePermission())
            .thenAnswer((_) async => false);
        when(mockPermissionService.requestMicrophonePermission())
            .thenAnswer((_) async => true);
        when(mockRecorderController.hasPermission).thenReturn(false);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Tap grant permission button
        await tester.tap(find.text('Grant Permission'));
        await tester.pump();

        // Verify
        verify(mockPermissionService.requestMicrophonePermission()).called(1);
      });

      testWidgets('should show recording duration during recording', (tester) async {
        // Setup
        when(mockRecorderController.isRecording).thenReturn(true);
        when(mockRecorderController.hasPermission).thenReturn(true);
        when(mockRecorderController.elapsedDuration)
            .thenReturn(const Duration(seconds: 30));

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('00:30'), findsOneWidget);
      });

      testWidgets('should disable recording when maximum duration is reached', (tester) async {
        // Setup
        when(mockRecorderController.isRecording).thenReturn(true);
        when(mockRecorderController.hasPermission).thenReturn(true);
        when(mockRecorderController.elapsedDuration)
            .thenReturn(const Duration(minutes: 10)); // Max duration
        when(mockRecorderController.stop())
            .thenAnswer((_) async => '/path/to/recording.wav');

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalRecorder(
                onRecordingComplete: (filePath) {},
                recorderController: mockRecorderController,
                maxDuration: const Duration(minutes: 10),
              ),
            ),
          ),
        );

        // Verify auto-stop is triggered
        await tester.pump(const Duration(milliseconds: 100));
        verify(mockRecorderController.stop()).called(1);
      });
    });

    group('VoiceJournalPlayer Widget', () {
      const testJournal = VoiceJournalModel(
        id: 'test-id',
        title: 'Test Journal',
        audioUrl: 'https://example.com/audio.wav',
        transcript: 'Test transcript',
        duration: Duration(minutes: 2, seconds: 30),
        createdAt: '2024-01-01T10:00:00Z',
        sentiment: 'positive',
        emotions: ['joy', 'gratitude'],
        keywords: ['test', 'journal'],
      );

      testWidgets('should display journal information', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.stopped);
        when(mockPlayerController.maxDuration).thenReturn(150000); // 2:30 in ms

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('Test Journal'), findsOneWidget);
        expect(find.text('2:30'), findsOneWidget);
        expect(find.byIcon(Icons.play_arrow), findsOneWidget);
      });

      testWidgets('should play audio when play button is tapped', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.stopped);
        when(mockPlayerController.preparePlayer(path: anyNamed('path')))
            .thenAnswer((_) async {});
        when(mockPlayerController.startPlayer()).thenAnswer((_) async {});

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Tap play button
        await tester.tap(find.byIcon(Icons.play_arrow));
        await tester.pump();

        // Verify
        verify(mockPlayerController.preparePlayer(path: testJournal.audioUrl)).called(1);
        verify(mockPlayerController.startPlayer()).called(1);
      });

      testWidgets('should pause audio when pause button is tapped', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.playing);
        when(mockPlayerController.pausePlayer()).thenAnswer((_) async {});

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Verify pause button is shown
        expect(find.byIcon(Icons.pause), findsOneWidget);

        // Tap pause button
        await tester.tap(find.byIcon(Icons.pause));
        await tester.pump();

        // Verify
        verify(mockPlayerController.pausePlayer()).called(1);
      });

      testWidgets('should show playback progress', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.playing);
        when(mockPlayerController.maxDuration).thenReturn(150000); // 2:30
        when(mockPlayerController.elapsedDuration).thenReturn(30000); // 0:30

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('0:30'), findsOneWidget);
        expect(find.byType(Slider), findsOneWidget);
        
        final slider = tester.widget<Slider>(find.byType(Slider));
        expect(slider.value, equals(0.2)); // 30s / 150s = 0.2
      });

      testWidgets('should seek when slider is moved', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.playing);
        when(mockPlayerController.maxDuration).thenReturn(150000);
        when(mockPlayerController.elapsedDuration).thenReturn(30000);
        when(mockPlayerController.seekTo(any)).thenAnswer((_) async {});

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Find and drag slider
        final slider = find.byType(Slider);
        await tester.drag(slider, const Offset(100, 0)); // Drag to new position
        await tester.pump();

        // Verify seek was called
        verify(mockPlayerController.seekTo(any)).called(1);
      });

      testWidgets('should show loading state when preparing player', (tester) async {
        // Setup
        when(mockPlayerController.playerState).thenReturn(PlayerState.paused);
        when(mockPlayerController.preparePlayer(path: anyNamed('path')))
            .thenAnswer((_) async {
          // Simulate loading delay
          await Future.delayed(const Duration(milliseconds: 100));
        });

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
              ),
            ),
          ),
        );

        // Tap play to start loading
        await tester.tap(find.byIcon(Icons.play_arrow));
        await tester.pump();

        // Verify loading indicator is shown
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
      });

      testWidgets('should display transcript when available', (tester) async {
        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
                showTranscript: true,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('Transcript'), findsOneWidget);
        expect(find.text('Test transcript'), findsOneWidget);
      });

      testWidgets('should display sentiment and emotions', (tester) async {
        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: VoiceJournalPlayer(
                journal: testJournal,
                playerController: mockPlayerController,
                showAnalysis: true,
              ),
            ),
          ),
        );

        // Verify
        expect(find.text('Sentiment: positive'), findsOneWidget);
        expect(find.text('joy'), findsOneWidget);
        expect(find.text('gratitude'), findsOneWidget);
      });
    });

    group('VoiceJournalPage Integration', () {
      testWidgets('should show empty state when no journals exist', (tester) async {
        // Setup
        when(mockRepository.getVoiceJournals())
            .thenAnswer((_) async => []);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        // Wait for data to load
        await tester.pumpAndSettle();

        // Verify
        expect(find.text('No voice journals yet'), findsOneWidget);
        expect(find.text('Start recording your first journal'), findsOneWidget);
        expect(find.byIcon(Icons.add), findsOneWidget);
      });

      testWidgets('should display list of journals', (tester) async {
        // Setup
        final journals = [
          const VoiceJournalModel(
            id: 'journal-1',
            title: 'Morning Thoughts',
            audioUrl: 'https://example.com/audio1.wav',
            duration: Duration(minutes: 3),
            createdAt: '2024-01-01T08:00:00Z',
            sentiment: 'positive',
            emotions: ['joy'],
            keywords: ['morning'],
          ),
          const VoiceJournalModel(
            id: 'journal-2',
            title: 'Evening Reflection',
            audioUrl: 'https://example.com/audio2.wav',
            duration: Duration(minutes: 5),
            createdAt: '2024-01-01T20:00:00Z',
            sentiment: 'neutral',
            emotions: ['calm'],
            keywords: ['reflection'],
          ),
        ];

        when(mockRepository.getVoiceJournals())
            .thenAnswer((_) async => journals);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        // Wait for data to load
        await tester.pumpAndSettle();

        // Verify
        expect(find.text('Morning Thoughts'), findsOneWidget);
        expect(find.text('Evening Reflection'), findsOneWidget);
        expect(find.text('3:00'), findsOneWidget);
        expect(find.text('5:00'), findsOneWidget);
      });

      testWidgets('should navigate to recording screen when FAB is tapped', (tester) async {
        // Setup
        when(mockRepository.getVoiceJournals())
            .thenAnswer((_) async => []);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Tap FAB
        await tester.tap(find.byType(FloatingActionButton));
        await tester.pumpAndSettle();

        // Verify navigation (in real app, would check for new screen)
        // This would typically be tested with navigation mocks
        expect(find.byType(VoiceJournalRecorder), findsOneWidget);
      });

      testWidgets('should filter journals by search query', (tester) async {
        // Setup journals
        final journals = [
          const VoiceJournalModel(
            id: 'journal-1',
            title: 'Morning workout thoughts',
            audioUrl: 'https://example.com/audio1.wav',
            duration: Duration(minutes: 3),
            createdAt: '2024-01-01T08:00:00Z',
            sentiment: 'positive',
            emotions: ['energetic'],
            keywords: ['workout', 'fitness'],
          ),
          const VoiceJournalModel(
            id: 'journal-2',
            title: 'Evening meditation',
            audioUrl: 'https://example.com/audio2.wav',
            duration: Duration(minutes: 5),
            createdAt: '2024-01-01T20:00:00Z',
            sentiment: 'calm',
            emotions: ['peaceful'],
            keywords: ['meditation', 'calm'],
          ),
        ];

        when(mockRepository.getVoiceJournals())
            .thenAnswer((_) async => journals);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Initially both journals should be visible
        expect(find.text('Morning workout thoughts'), findsOneWidget);
        expect(find.text('Evening meditation'), findsOneWidget);

        // Enter search query
        await tester.enterText(find.byType(TextField), 'workout');
        await tester.pump();

        // Only workout journal should be visible
        expect(find.text('Morning workout thoughts'), findsOneWidget);
        expect(find.text('Evening meditation'), findsNothing);
      });

      testWidgets('should show error message when loading fails', (tester) async {
        // Setup
        when(mockRepository.getVoiceJournals())
            .thenThrow(Exception('Failed to load journals'));

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Verify error state
        expect(find.text('Error loading journals'), findsOneWidget);
        expect(find.text('Retry'), findsOneWidget);
      });

      testWidgets('should retry loading when retry button is tapped', (tester) async {
        // Setup - first call fails, second succeeds
        when(mockRepository.getVoiceJournals())
            .thenThrow(Exception('Failed to load journals'))
            .thenAnswer((_) async => []);

        // Build widget
        await tester.pumpWidget(
          MaterialApp(
            home: MultiProvider(
              providers: [
                Provider<VoiceJournalRepository>.value(value: mockRepository),
                Provider<AudioService>.value(value: mockAudioService),
                Provider<PermissionService>.value(value: mockPermissionService),
              ],
              child: const VoiceJournalPage(),
            ),
          ),
        );

        await tester.pumpAndSettle();

        // Tap retry button
        await tester.tap(find.text('Retry'));
        await tester.pumpAndSettle();

        // Verify successful state
        expect(find.text('No voice journals yet'), findsOneWidget);
        expect(find.text('Error loading journals'), findsNothing);
        
        // Verify repository was called twice
        verify(mockRepository.getVoiceJournals()).called(2);
      });
    });
  });
}
