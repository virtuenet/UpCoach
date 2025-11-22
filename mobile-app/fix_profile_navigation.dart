// Script to identify all Navigator.push patterns for manual fixing
// Run: dart fix_profile_navigation.dart

import 'dart:io';

void main() {
  // Profile screen navigation mappings
  final navMappings = {
    'SettingsScreen': '/profile/settings',
    'EditProfileScreen': '/profile/edit',  
    'PrivacySecurityScreen': '/profile/privacy',
    'NotificationsScreen': '/profile/notifications',
    'HelpCenterScreen': '/profile/help',
    'AboutScreen': '/profile/about',
    'ProgressPhotosScreen': '/progress-photos',
  };
  
  print('Navigation route mappings for profile screen:');
  navMappings.forEach((screen, route) {
    print('$screen -> context.push(\'$route\')');
  });
}