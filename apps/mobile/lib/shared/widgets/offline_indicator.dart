import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/connectivity_provider.dart';
import '../../core/theme/app_colors.dart';
import '../constants/ui_constants.dart';

/// A banner that shows when the device is offline
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectivityProvider);

    if (state.isOnline && !state.hasPendingChanges && !state.hasConflicts) {
      return const SizedBox.shrink();
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      height: state.isOnline && !state.needsAttention ? 0 : null,
      child: Material(
        color: _getBannerColor(state),
        child: SafeArea(
          bottom: false,
          child: InkWell(
            onTap: () => context.push('/profile/offline-settings'),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: UIConstants.spacingMD,
                vertical: UIConstants.spacingSM,
              ),
              child: Row(
                children: [
                  Icon(
                    _getBannerIcon(state),
                    color: Colors.white,
                    size: 18,
                  ),
                  const SizedBox(width: UIConstants.spacingSM),
                  Expanded(
                    child: Text(
                      _getBannerText(state),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (state.isSyncing)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  else
                    const Icon(
                      Icons.chevron_right,
                      color: Colors.white70,
                      size: 18,
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getBannerColor(ConnectivityState state) {
    if (!state.isOnline) return AppColors.warning;
    if (state.hasConflicts) return AppColors.error;
    if (state.hasPendingChanges) return AppColors.info;
    if (state.isSyncing) return AppColors.primary;
    return AppColors.warning;
  }

  IconData _getBannerIcon(ConnectivityState state) {
    if (!state.isOnline) return Icons.wifi_off;
    if (state.hasConflicts) return Icons.warning_amber;
    if (state.isSyncing) return Icons.sync;
    if (state.hasPendingChanges) return Icons.pending_actions;
    return Icons.wifi_off;
  }

  String _getBannerText(ConnectivityState state) {
    if (!state.isOnline) {
      return state.hasPendingChanges
          ? 'Offline - ${state.pendingOperationsCount} changes pending'
          : 'You\'re offline - changes will sync when connected';
    }
    if (state.hasConflicts) {
      return '${state.pendingConflictsCount} sync conflicts need attention';
    }
    if (state.isSyncing) return 'Syncing...';
    if (state.hasPendingChanges) {
      return '${state.pendingOperationsCount} changes waiting to sync';
    }
    return 'Offline';
  }
}

/// A compact status indicator for app bars or navigation
class OfflineStatusIndicator extends ConsumerWidget {
  final bool showWhenOnline;
  final VoidCallback? onTap;

  const OfflineStatusIndicator({
    super.key,
    this.showWhenOnline = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectivityProvider);

    // Don't show if online and no issues
    if (state.isOnline &&
        !state.hasPendingChanges &&
        !state.hasConflicts &&
        !showWhenOnline) {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: onTap ?? () => context.push('/profile/offline-settings'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: _getStatusColor(state).withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _getStatusColor(state).withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (state.isSyncing)
              SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  strokeWidth: 1.5,
                  color: _getStatusColor(state),
                ),
              )
            else
              Icon(
                _getStatusIcon(state),
                size: 14,
                color: _getStatusColor(state),
              ),
            const SizedBox(width: 4),
            Text(
              _getStatusText(state),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: _getStatusColor(state),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(ConnectivityState state) {
    if (!state.isOnline) return AppColors.warning;
    if (state.hasConflicts) return AppColors.error;
    if (state.hasPendingChanges) return AppColors.info;
    if (state.isSyncing) return AppColors.primary;
    return AppColors.success;
  }

  IconData _getStatusIcon(ConnectivityState state) {
    if (!state.isOnline) return Icons.wifi_off;
    if (state.hasConflicts) return Icons.warning_amber;
    if (state.hasPendingChanges) return Icons.pending;
    return Icons.check_circle;
  }

  String _getStatusText(ConnectivityState state) {
    if (!state.isOnline) return 'Offline';
    if (state.hasConflicts) return '${state.pendingConflictsCount}!';
    if (state.isSyncing) return 'Syncing';
    if (state.hasPendingChanges) return '${state.pendingOperationsCount}';
    return 'Synced';
  }
}

/// A floating action button style sync button
class SyncFloatingButton extends ConsumerWidget {
  const SyncFloatingButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectivityProvider);

    if (state.isOnline && !state.hasPendingChanges && !state.hasConflicts) {
      return const SizedBox.shrink();
    }

    return FloatingActionButton.small(
      onPressed: state.isOnline && !state.isSyncing
          ? () => ref.read(connectivityProvider.notifier).syncNow()
          : null,
      backgroundColor: _getButtonColor(state),
      child: state.isSyncing
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Icon(
              _getButtonIcon(state),
              color: Colors.white,
            ),
    );
  }

  Color _getButtonColor(ConnectivityState state) {
    if (!state.isOnline) return AppColors.textSecondary;
    if (state.hasConflicts) return AppColors.error;
    if (state.hasPendingChanges) return AppColors.primary;
    return AppColors.primary;
  }

  IconData _getButtonIcon(ConnectivityState state) {
    if (!state.isOnline) return Icons.wifi_off;
    if (state.hasConflicts) return Icons.sync_problem;
    return Icons.sync;
  }
}

/// A simple dot indicator for compact spaces
class OfflineDot extends ConsumerWidget {
  final double size;

  const OfflineDot({super.key, this.size = 8});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(connectivityProvider);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: _getDotColor(state),
        boxShadow: [
          BoxShadow(
            color: _getDotColor(state).withValues(alpha: 0.5),
            blurRadius: 4,
            spreadRadius: 1,
          ),
        ],
      ),
    );
  }

  Color _getDotColor(ConnectivityState state) {
    if (!state.isOnline) return AppColors.warning;
    if (state.hasConflicts) return AppColors.error;
    if (state.isSyncing) return AppColors.info;
    if (state.hasPendingChanges) return AppColors.warning;
    return AppColors.success;
  }
}

/// Wrap any widget to show an offline overlay when disconnected
class OfflineAwareWidget extends ConsumerWidget {
  final Widget child;
  final Widget? offlineChild;
  final bool showOverlay;

  const OfflineAwareWidget({
    super.key,
    required this.child,
    this.offlineChild,
    this.showOverlay = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(connectivityProvider).isOnline;

    if (isOnline) return child;

    if (offlineChild != null) return offlineChild!;

    if (!showOverlay) return child;

    return Stack(
      children: [
        child,
        Positioned.fill(
          child: Container(
            color: Colors.black.withValues(alpha: 0.1),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(UIConstants.spacingMD),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(UIConstants.radiusMD),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.wifi_off, size: 48, color: AppColors.warning),
                    SizedBox(height: UIConstants.spacingSM),
                    Text(
                      'You\'re offline',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'This feature requires an internet connection',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
