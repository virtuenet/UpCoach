import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../constants/ui_constants.dart';
import 'responsive_builder.dart';
import 'offline_indicator.dart';

class MainNavigation extends ConsumerWidget {
  final Widget child;

  const MainNavigation({
    super.key,
    required this.child,
  });

  int _getCurrentIndex(String location) {
    // Handle paths that might have trailing segments
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/chat') || location.startsWith('/messages')) {
      return 1;
    }
    if (location.startsWith('/tasks')) return 2;
    if (location.startsWith('/goals')) return 3;
    if (location.startsWith('/mood')) return 4;
    if (location.startsWith('/profile')) return 5;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String location = GoRouterState.of(context).uri.toString();
    final int currentIndex = _getCurrentIndex(location);
    final isTabletOrDesktop = ResponsiveBuilder.isTablet(context) ||
        ResponsiveBuilder.isDesktop(context);

    if (isTabletOrDesktop) {
      // Side navigation for tablets and desktop
      return Scaffold(
        body: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: Row(
                children: [
                  NavigationRail(
                    selectedIndex: currentIndex,
                    onDestinationSelected: (index) {
                      switch (index) {
                        case 0:
                          context.go('/home');
                          break;
                        case 1:
                          context.go('/chat');
                          break;
                        case 2:
                          context.go('/tasks');
                          break;
                        case 3:
                          context.go('/goals');
                          break;
                        case 4:
                          context.go('/mood');
                          break;
                        case 5:
                          context.go('/profile');
                          break;
                      }
                    },
                    extended: ResponsiveBuilder.isDesktop(context),
                    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                    destinations: const [
                      NavigationRailDestination(
                        icon: Icon(Icons.home_outlined),
                        selectedIcon: Icon(Icons.home),
                        label: Text('Home'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.message_outlined),
                        selectedIcon: Icon(Icons.message),
                        label: Text('Messages'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.task_outlined),
                        selectedIcon: Icon(Icons.task),
                        label: Text('Tasks'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.flag_outlined),
                        selectedIcon: Icon(Icons.flag),
                        label: Text('Goals'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.mood_outlined),
                        selectedIcon: Icon(Icons.mood),
                        label: Text('Mood'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.person_outline),
                        selectedIcon: Icon(Icons.person),
                        label: Text('Profile'),
                      ),
                    ],
                  ),
                  const VerticalDivider(thickness: 1, width: 1),
                  Expanded(
                    child: child,
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Bottom navigation for mobile
    return Scaffold(
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _NavItem(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: 'Home',
                  isSelected: currentIndex == 0,
                  onTap: () => context.go('/home'),
                ),
                _NavItem(
                  icon: Icons.message_outlined,
                  selectedIcon: Icons.message,
                  label: 'Messages',
                  isSelected: currentIndex == 1,
                  onTap: () => context.go('/chat'),
                ),
                _NavItem(
                  icon: Icons.task_outlined,
                  selectedIcon: Icons.task,
                  label: 'Tasks',
                  isSelected: currentIndex == 2,
                  onTap: () => context.go('/tasks'),
                ),
                _NavItem(
                  icon: Icons.flag_outlined,
                  selectedIcon: Icons.flag,
                  label: 'Goals',
                  isSelected: currentIndex == 3,
                  onTap: () => context.go('/goals'),
                ),
                _NavItem(
                  icon: Icons.mood_outlined,
                  selectedIcon: Icons.mood,
                  label: 'Mood',
                  isSelected: currentIndex == 4,
                  onTap: () => context.go('/mood'),
                ),
                _NavItem(
                  icon: Icons.person_outline,
                  selectedIcon: Icons.person,
                  label: 'Profile',
                  isSelected: currentIndex == 5,
                  onTap: () => context.go('/profile'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(UIConstants.radiusLG),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? selectedIcon : icon,
              color:
                  isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              size: 24,
            ),
            const SizedBox(height: UIConstants.spacingXS),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color:
                    isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
