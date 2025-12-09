import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/progress_photo.dart';
import '../../../core/services/progress_photos_service.dart';

class ProgressPhotosNotifier extends Notifier<ProgressPhotosState> {
  late final ProgressPhotosService _progressPhotosService;

  @override
  ProgressPhotosState build() {
    _progressPhotosService = ref.read(progressPhotosServiceProvider);
    loadPhotos();
    return const ProgressPhotosState();
  }

  Future<void> loadPhotos() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final photos = await _progressPhotosService.getAllPhotos();
      state = state.copyWith(
        photos: photos,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> addPhoto({
    required String imagePath,
    String? title,
    required String category,
    String? notes,
  }) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      final photo = ProgressPhoto(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        imagePath: imagePath,
        title: title,
        category: category,
        notes: notes,
        takenAt: DateTime.now(),
        createdAt: DateTime.now(),
      );

      await _progressPhotosService.addPhoto(photo);
      final updatedPhotos = [...state.photos, photo];

      state = state.copyWith(
        photos: updatedPhotos,
        isSaving: false,
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> deletePhoto(String photoId) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      await _progressPhotosService.deletePhoto(photoId);
      final updatedPhotos = state.photos.where((p) => p.id != photoId).toList();

      state = state.copyWith(
        photos: updatedPhotos,
        isSaving: false,
      );

      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  Future<bool> updatePhoto(ProgressPhoto photo) async {
    state = state.copyWith(isSaving: true, error: null);

    try {
      await _progressPhotosService.updatePhoto(photo);
      final photoIndex = state.photos.indexWhere((p) => p.id == photo.id);

      if (photoIndex != -1) {
        final updatedPhotos = [...state.photos];
        updatedPhotos[photoIndex] = photo;

        state = state.copyWith(
          photos: updatedPhotos,
          isSaving: false,
        );
      }

      return true;
    } catch (e) {
      state = state.copyWith(
        isSaving: false,
        error: e.toString(),
      );
      return false;
    }
  }

  void toggleFavorite(String photoId) {
    final photoIndex = state.photos.indexWhere((p) => p.id == photoId);
    if (photoIndex == -1) return;

    final photo = state.photos[photoIndex];
    final updatedPhoto = photo.copyWith(
      isFavorite: !photo.isFavorite,
      updatedAt: DateTime.now(),
    );

    final updatedPhotos = [...state.photos];
    updatedPhotos[photoIndex] = updatedPhoto;

    state = state.copyWith(photos: updatedPhotos);

    // Update in storage
    _progressPhotosService.updatePhoto(updatedPhoto);
  }

  List<ProgressPhoto> getPhotosByCategory(String category) {
    return state.photos.where((photo) => photo.category == category).toList();
  }

  List<ProgressPhoto> getFavoritePhotos() {
    return state.photos.where((photo) => photo.isFavorite).toList();
  }

  Map<String, dynamic> getStatistics() {
    final totalPhotos = state.photos.length;
    final categories = state.photos.map((p) => p.category).toSet().length;
    final favoritePhotos = state.photos.where((p) => p.isFavorite).length;

    final now = DateTime.now();
    final thisMonthPhotos = state.photos.where((p) {
      return p.takenAt.year == now.year && p.takenAt.month == now.month;
    }).length;

    return {
      'totalPhotos': totalPhotos,
      'categories': categories,
      'favoritePhotos': favoritePhotos,
      'thisMonthPhotos': thisMonthPhotos,
    };
  }
}

// Provider
final progressPhotosProvider =
    NotifierProvider<ProgressPhotosNotifier, ProgressPhotosState>(ProgressPhotosNotifier.new);
