import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class MainNavigation extends StatelessWidget {
  final Widget child;

  const MainNavigation({
    super.key,
    required this.child,
  });

  int _getCurrentIndex(String location) {
    switch (location) {
      case '/home':
        return 0;
      case '/chat':
        return 1;
      case '/tasks':
        return 2;
      case '/goals':
        return 3;
      case '/mood':
        return 4;
      case '/profile':
        return 5;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final String location = GoRouterState.of(context).uri.toString();
    final int currentIndex = _getCurrentIndex(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
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
                  icon: Icons.chat_bubble_outline,
                  selectedIcon: Icons.chat_bubble,
                  label: 'Chat',
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
              ? AppTheme.primaryColor.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? selectedIcon : icon,
              color: isSelected 
                  ? AppTheme.primaryColor 
                  : AppTheme.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected 
                    ? AppTheme.primaryColor 
                    : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
} 