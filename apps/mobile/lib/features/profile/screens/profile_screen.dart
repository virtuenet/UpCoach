import 'package:flutter/material.dart';
import '../../../shared/constants/ui_constants.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../services/profile_service.dart';
import '../../../core/providers/connectivity_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(profileProvider);
    final user = profileState.user;

    if (user == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Profile',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              context.push('/profile/settings');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh profile data
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 80),
          children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(UIConstants.spacingLG),
              child: Column(
                children: [
                  // Avatar
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 60,
                        backgroundImage: user.avatarUrl != null
                            ? NetworkImage(user.avatarUrl!)
                            : null,
                        backgroundColor: AppTheme.primaryColor,
                        child: user.avatarUrl == null
                            ? Text(
                                user.name.isNotEmpty
                                    ? user.name[0].toUpperCase()
                                    : user.email[0].toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 40,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Theme.of(context).scaffoldBackgroundColor,
                              width: 3,
                            ),
                          ),
                          child: IconButton(
                            icon: const Icon(
                              Icons.camera_alt,
                              color: Colors.white,
                              size: 20,
                            ),
                            onPressed: () {
                              _showImagePickerOptions(context, ref);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: UIConstants.spacingMD),

                  // Name
                  Text(
                    user.name.isNotEmpty ? user.name : 'No name set',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),

                  // Email
                  Text(
                    user.email,
                    style: TextStyle(
                      fontSize: 16,
                      color: AppTheme.textSecondary,
                    ),
                  ),

                  // Bio
                  if (user.bio != null && user.bio!.isNotEmpty) ...[
                    const SizedBox(height: UIConstants.spacingMD),
                    Text(
                      user.bio!,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                  ],

                  const SizedBox(height: UIConstants.spacingLG),

                  // Edit Profile Button
                  OutlinedButton.icon(
                    onPressed: () {
                      context.push('/profile/edit');
                    },
                    icon: const Icon(Icons.edit),
                    label: const Text('Edit Profile'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(200, 45),
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Stats Section
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem(
                    context,
                    'Tasks',
                    '12',
                    Icons.task_alt,
                  ),
                  _buildStatItem(
                    context,
                    'Goals',
                    '5',
                    Icons.flag,
                  ),
                  _buildStatItem(
                    context,
                    'Streak',
                    '7',
                    Icons.local_fire_department,
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Menu Items
            _buildMenuSection(
              context,
              'Account',
              [
                _MenuItem(
                  icon: Icons.person_outline,
                  title: 'Personal Information',
                  onTap: () {
                    context.push('/profile/edit');
                  },
                ),
                _MenuItem(
                  icon: Icons.lock_outline,
                  title: 'Security',
                  onTap: () {
                    context.push('/profile/settings', extra: {'initialTab': 1});
                  },
                ),
                _MenuItem(
                  icon: Icons.notifications_outlined,
                  title: 'Notifications',
                  onTap: () {
                    context.push('/profile/settings', extra: {'initialTab': 2});
                  },
                ),
              ],
            ),

            // Data & Sync Section
            _buildDataSyncSection(context),

            _buildMenuSection(
              context,
              'Support',
              [
                _MenuItem(
                  icon: Icons.help_outline,
                  title: 'Help Center',
                  onTap: () {
                    context.push('/profile/help');
                  },
                ),
                _MenuItem(
                  icon: Icons.feedback_outlined,
                  title: 'Send Feedback',
                  onTap: () {
                    context.push('/feedback');
                  },
                ),
                _MenuItem(
                  icon: Icons.info_outline,
                  title: 'About',
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'UpCoach',
                      applicationVersion: '1.0.0',
                      applicationIcon: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor,
                          borderRadius:
                              BorderRadius.circular(UIConstants.radiusLG),
                        ),
                        child: const Icon(
                          Icons.psychology,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                      children: [
                        const Text(
                          'UpCoach is your personal AI-powered life coach, helping you achieve your goals and live your best life.',
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // Sign Out Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: OutlinedButton.icon(
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.errorColor,
                          ),
                          child: const Text('Sign Out'),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true) {
                    await ref.read(authProvider.notifier).signOut();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.errorColor,
                  side: const BorderSide(color: AppTheme.errorColor),
                  minimumSize: const Size.fromHeight(50),
                ),
              ),
            ),

            const SizedBox(height: UIConstants.spacingLG),

            // App Version
            Center(
              child: Text(
                'Version 1.0.0',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Column(
      children: [
        Icon(
          icon,
          size: 32,
          color: AppTheme.primaryColor,
        ),
        const SizedBox(height: UIConstants.spacingSM),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        Text(
          label,
          style: TextStyle(
            color: AppTheme.textSecondary,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildMenuSection(
    BuildContext context,
    String title,
    List<_MenuItem> items,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
        ),
        ...items.map((item) => ListTile(
              leading: Icon(item.icon),
              title: Text(item.title),
              trailing: const Icon(Icons.chevron_right),
              onTap: item.onTap,
            )),
      ],
    );
  }

  Widget _buildDataSyncSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Text(
            'Data & Sync',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
        ),
        _OfflineSyncMenuItem(),
      ],
    );
  }

  void _showImagePickerOptions(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(UIConstants.spacingLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Change Profile Photo',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: UIConstants.spacingLG),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                context.pop();
                _pickImage(ImageSource.camera, ref);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                context.pop();
                _pickImage(ImageSource.gallery, ref);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: const Text('Remove Photo',
                  style: TextStyle(color: Colors.red)),
              onTap: () {
                context.pop();
                _removePhoto(ref);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source, WidgetRef ref) async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );

    if (image != null) {
      try {
        final profileService = ref.read(profileServiceProvider);
        await profileService.updateProfilePhoto(File(image.path));

        // Refresh profile data
        ref.invalidate(profileProvider);
      } catch (e) {
        // Handle error - logged but can't show UI since this is a stateless method
        debugPrint('Failed to update profile photo: $e');
      }
    }
  }

  Future<void> _removePhoto(WidgetRef ref) async {
    try {
      final profileService = ref.read(profileServiceProvider);
      await profileService.removeProfilePhoto();

      // Refresh profile data
      ref.invalidate(profileProvider);
    } catch (e) {
      // Handle error - logged but can't show UI since this is a stateless method
      debugPrint('Failed to remove profile photo: $e');
    }
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });
}

/// Special menu item for offline/sync status that shows connectivity state
class _OfflineSyncMenuItem extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectivityProvider);

    return ListTile(
      leading: Icon(
        state.isOnline ? Icons.cloud_done : Icons.cloud_off,
        color: state.isOnline
            ? (state.hasPendingChanges ? AppColors.warning : AppColors.success)
            : AppColors.textSecondary,
      ),
      title: const Text('Offline & Sync'),
      subtitle: Text(
        _getSubtitle(state),
        style: TextStyle(
          color:
              state.needsAttention ? AppColors.error : AppColors.textSecondary,
          fontSize: 12,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (state.hasPendingChanges || state.hasConflicts)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: state.hasConflicts
                    ? AppColors.error.withValues(alpha: 0.1)
                    : AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                state.hasConflicts
                    ? '${state.pendingConflictsCount}'
                    : '${state.pendingOperationsCount}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color:
                      state.hasConflicts ? AppColors.error : AppColors.warning,
                ),
              ),
            ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right),
        ],
      ),
      onTap: () => context.push('/profile/offline-settings'),
    );
  }

  String _getSubtitle(ConnectivityState state) {
    if (!state.isOnline) return 'You\'re offline';
    if (state.hasConflicts) return 'Conflicts need attention';
    if (state.isSyncing) return 'Syncing...';
    if (state.hasPendingChanges) {
      return '${state.pendingOperationsCount} changes pending';
    }
    return 'All data synced';
  }
}
