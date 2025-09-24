import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/progress_photo.dart';
import '../../../core/services/progress_photos_service.dart';

class ProgressPhotosNotifier extends StateNotifier<ProgressPhotosState> {
  ProgressPhotosNotifier(this._progressPhotosService) : super(const ProgressPhotosState()) {
    loadPhotos();
  }

  final ProgressPhotosService _progressPhotosService;

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

  Future<void> exportPhotosAsPDF() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _progressPhotosService.exportAsPDF(state.photos);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> exportPhotosAsZip() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      await _progressPhotosService.exportAsZip(state.photos);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> sharePhotos() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _progressPhotosService.sharePhotos(state.photos);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> sharePhoto(ProgressPhoto photo) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _progressPhotosService.sharePhoto(photo);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  List<ProgressPhoto> getTimelinePhotos({int? limit}) {
    final sortedPhotos = List<ProgressPhoto>.from(state.photos);
    sortedPhotos.sort((a, b) => b.takenAt.compareTo(a.takenAt));
    
    if (limit != null && limit > 0) {
      return sortedPhotos.take(limit).toList();
    }
    
    return sortedPhotos;
  }

  List<ProgressPhoto> getPhotosForDateRange(DateTime startDate, DateTime endDate) {
    return state.photos.where((photo) {
      return photo.takenAt.isAfter(startDate) && 
             photo.takenAt.isBefore(endDate.add(const Duration(days: 1)));
    }).toList();
  }

  Map<String, List<ProgressPhoto>> getPhotosByCategory() {
    final Map<String, List<ProgressPhoto>> categorizedPhotos = {};
    
    for (final photo in state.photos) {
      if (categorizedPhotos[photo.category] == null) {
        categorizedPhotos[photo.category] = [];
      }
      categorizedPhotos[photo.category]!.add(photo);
    }
    
    return categorizedPhotos;
  }
}

// Provider
final progressPhotosProvider = StateNotifierProvider<ProgressPhotosNotifier, ProgressPhotosState>((ref) {
  final progressPhotosService = ref.read(progressPhotosServiceProvider);
  return ProgressPhotosNotifier(progressPhotosService);
}); 