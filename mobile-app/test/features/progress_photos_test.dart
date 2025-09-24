import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:image_picker/image_picker.dart';
import 'package:upcoach_mobile/features/progress/presentation/screens/progress_photos_screen.dart';
import 'package:upcoach_mobile/features/progress/providers/progress_provider.dart';
import 'package:upcoach_mobile/core/services/camera_service.dart';
import 'package:upcoach_mobile/core/services/storage_service.dart';

import 'progress_photos_test.mocks.dart';

@GenerateMocks([
  CameraService,
  StorageService,
  ImagePicker,
])
void main() {
  group('Progress Photos Tests', () {
    late MockCameraService mockCameraService;
    late MockStorageService mockStorageService;
    late MockImagePicker mockImagePicker;

    setUp(() {
      mockCameraService = MockCameraService();
      mockStorageService = MockStorageService();
      mockImagePicker = MockImagePicker();
    });

    testWidgets('should display empty state when no photos exist', (tester) async {
      // Arrange
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => []);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            storageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Assert
      expect(find.text('No progress photos yet'), findsOneWidget);
      expect(find.byIcon(Icons.add_a_photo), findsOneWidget);
    });

    testWidgets('should capture photo when camera button is pressed', (tester) async {
      // Arrange
      final mockXFile = XFile('test_path.jpg');
      when(mockCameraService.capturePhoto()).thenAnswer((_) async => mockXFile);
      when(mockStorageService.saveProgressPhoto(any)).thenAnswer((_) async => 'saved_path.jpg');

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            cameraServiceProvider.overrideWithValue(mockCameraService),
            storageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.camera_alt));
      await tester.pumpAndSettle();

      // Assert
      verify(mockCameraService.capturePhoto()).called(1);
      verify(mockStorageService.saveProgressPhoto(any)).called(1);
    });

    testWidgets('should select photo from gallery', (tester) async {
      // Arrange
      final mockXFile = XFile('gallery_path.jpg');
      when(mockImagePicker.pickImage(source: ImageSource.gallery))
          .thenAnswer((_) async => mockXFile);
      when(mockStorageService.saveProgressPhoto(any)).thenAnswer((_) async => 'saved_path.jpg');

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            imagePickerProvider.overrideWithValue(mockImagePicker),
            storageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.photo_library));
      await tester.pumpAndSettle();

      // Assert
      verify(mockImagePicker.pickImage(source: ImageSource.gallery)).called(1);
      verify(mockStorageService.saveProgressPhoto(any)).called(1);
    });

    testWidgets('should display error when photo capture fails', (tester) async {
      // Arrange
      when(mockCameraService.capturePhoto()).thenThrow(Exception('Camera error'));

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            cameraServiceProvider.overrideWithValue(mockCameraService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.camera_alt));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Failed to capture photo'), findsOneWidget);
    });

    testWidgets('should show progress photos grid when photos exist', (tester) async {
      // Arrange
      final mockPhotos = [
        ProgressPhoto(id: '1', path: 'photo1.jpg', timestamp: DateTime.now()),
        ProgressPhoto(id: '2', path: 'photo2.jpg', timestamp: DateTime.now()),
      ];
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => mockPhotos);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            storageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Assert
      expect(find.byType(GridView), findsOneWidget);
      expect(find.byType(Image), findsNWidgets(2));
    });

    testWidgets('should delete photo when delete button is pressed', (tester) async {
      // Arrange
      final mockPhotos = [
        ProgressPhoto(id: '1', path: 'photo1.jpg', timestamp: DateTime.now()),
      ];
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => mockPhotos);
      when(mockStorageService.deleteProgressPhoto('1')).thenAnswer((_) async => true);

      // Act
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            storageServiceProvider.overrideWithValue(mockStorageService),
          ],
          child: MaterialApp(
            home: ProgressPhotosScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();
      await tester.longPress(find.byType(Image).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();

      // Assert
      verify(mockStorageService.deleteProgressPhoto('1')).called(1);
    });

    group('Progress Photo Comparison', () {
      testWidgets('should show before/after comparison view', (tester) async {
        // Arrange
        final beforePhoto = ProgressPhoto(id: '1', path: 'before.jpg', timestamp: DateTime.now().subtract(Duration(days: 30)));
        final afterPhoto = ProgressPhoto(id: '2', path: 'after.jpg', timestamp: DateTime.now());

        when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => [beforePhoto, afterPhoto]);

        // Act
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              storageServiceProvider.overrideWithValue(mockStorageService),
            ],
            child: MaterialApp(
              home: ProgressPhotosScreen(),
            ),
          ),
        );

        await tester.pumpAndSettle();
        await tester.tap(find.text('Compare'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Before'), findsOneWidget);
        expect(find.text('After'), findsOneWidget);
        expect(find.byType(Image), findsNWidgets(2));
      });
    });

    group('Photo Metadata', () {
      testWidgets('should display photo timestamp', (tester) async {
        // Arrange
        final photoTime = DateTime(2024, 1, 15, 10, 30);
        final mockPhoto = ProgressPhoto(id: '1', path: 'photo1.jpg', timestamp: photoTime);
        when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => [mockPhoto]);

        // Act
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              storageServiceProvider.overrideWithValue(mockStorageService),
            ],
            child: MaterialApp(
              home: ProgressPhotosScreen(),
            ),
          ),
        );

        await tester.pumpAndSettle();
        await tester.tap(find.byType(Image).first);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Jan 15, 2024'), findsOneWidget);
      });
    });
  });

  group('Progress Photo Provider Tests', () {
    late MockStorageService mockStorageService;
    late ProviderContainer container;

    setUp(() {
      mockStorageService = MockStorageService();
      container = ProviderContainer(
        overrides: [
          storageServiceProvider.overrideWithValue(mockStorageService),
        ],
      );
    });

    tearDown(() {
      container.dispose();
    });

    test('should load progress photos on initialization', () async {
      // Arrange
      final mockPhotos = [
        ProgressPhoto(id: '1', path: 'photo1.jpg', timestamp: DateTime.now()),
      ];
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => mockPhotos);

      // Act
      final progressProvider = container.read(progressPhotosProvider.notifier);
      await progressProvider.loadPhotos();

      // Assert
      final state = container.read(progressPhotosProvider);
      expect(state.photos.length, equals(1));
      expect(state.photos.first.id, equals('1'));
    });

    test('should add new photo to the list', () async {
      // Arrange
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => []);
      when(mockStorageService.saveProgressPhoto(any)).thenAnswer((_) async => 'new_photo.jpg');

      // Act
      final progressProvider = container.read(progressPhotosProvider.notifier);
      await progressProvider.addPhoto(XFile('test.jpg'));

      // Assert
      verify(mockStorageService.saveProgressPhoto(any)).called(1);
    });

    test('should handle photo deletion', () async {
      // Arrange
      final mockPhotos = [
        ProgressPhoto(id: '1', path: 'photo1.jpg', timestamp: DateTime.now()),
      ];
      when(mockStorageService.getProgressPhotos()).thenAnswer((_) async => mockPhotos);
      when(mockStorageService.deleteProgressPhoto('1')).thenAnswer((_) async => true);

      // Act
      final progressProvider = container.read(progressPhotosProvider.notifier);
      await progressProvider.loadPhotos();
      await progressProvider.deletePhoto('1');

      // Assert
      verify(mockStorageService.deleteProgressPhoto('1')).called(1);
    });

    test('should handle storage errors gracefully', () async {
      // Arrange
      when(mockStorageService.getProgressPhotos()).thenThrow(Exception('Storage error'));

      // Act
      final progressProvider = container.read(progressPhotosProvider.notifier);
      await progressProvider.loadPhotos();

      // Assert
      final state = container.read(progressPhotosProvider);
      expect(state.hasError, isTrue);
      expect(state.errorMessage, contains('Storage error'));
    });
  });
}