/// Auth Feature Module
///
/// Provides authentication functionality including login, registration,
/// password recovery, and two-factor authentication.
library auth;

// Providers
export 'providers/auth_provider.dart';

// Screens
export 'screens/login_screen.dart';
export 'screens/register_screen.dart';
export 'screens/forgot_password_screen.dart';
export 'screens/two_factor_setup_screen.dart';
export 'screens/disable_two_factor_screen.dart';

// Presentation Screens
export 'presentation/screens/biometric_lock_screen.dart';
