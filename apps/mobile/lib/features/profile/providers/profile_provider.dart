import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/user_model.dart';

// Profile State
class ProfileState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isEditing;

  const ProfileState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isEditing = false,
  });

  ProfileState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool? isEditing,
  }) {
    return ProfileState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isEditing: isEditing ?? this.isEditing,
    );
  }
}

// Profile Provider
class ProfileNotifier extends Notifier<ProfileState> {
  @override
  ProfileState build() {
    _loadUserProfile();
    return const ProfileState();
  }

  void _loadUserProfile() {
    final authState = ref.read(authProvider);
    if (authState.user != null) {
      state = state.copyWith(user: authState.user);
    }
  }

  Future<void> updateProfile({
    String? name,
    String? email,
    String? bio,
    String? avatarUrl,
    Map<String, dynamic>? preferences,
  }) async {
    if (state.user == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      // In a real app, this would call an API
      // For now, we'll just update locally
      final updatedUser = state.user!.copyWith(
        name: name ?? state.user!.name,
        email: email ?? state.user!.email,
        bio: bio ?? state.user!.bio,
        avatarUrl: avatarUrl ?? state.user!.avatarUrl,
        preferences: preferences ?? state.user!.preferences,
        updatedAt: DateTime.now(),
      );

      state = state.copyWith(
        user: updatedUser,
        isLoading: false,
        isEditing: false,
      );

      // Update auth state as well
      ref.read(authProvider.notifier).updateUser(updatedUser);
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // In a real app, this would call an API
      await Future.delayed(const Duration(seconds: 1));

      state = state.copyWith(
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  Future<void> deleteAccount() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // In a real app, this would call an API
      await Future.delayed(const Duration(seconds: 1));

      // Sign out after account deletion
      await ref.read(authProvider.notifier).signOut();
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  void setEditing(bool isEditing) {
    state = state.copyWith(isEditing: isEditing);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final profileProvider =
    NotifierProvider<ProfileNotifier, ProfileState>(ProfileNotifier.new);
