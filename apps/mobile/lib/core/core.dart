/// UpCoach Core Module
///
/// This barrel file exports all core functionality for the UpCoach mobile app.
/// Import this single file to access all core services, utilities, and configurations.
library core;

// Configuration
export 'config/app_config.dart';
export 'config/feature_flags.dart';
export 'config/store_metadata.dart';

// Constants
export 'constants/api_constants.dart';
export 'constants/app_constants.dart';

// Theme
export 'theme/app_colors.dart';
export 'theme/app_theme.dart';

// Utils
export 'utils/api_exception.dart';
export 'utils/date_formatter.dart';
export 'utils/input_validator.dart';
export 'utils/logger.dart';
export 'utils/retry_helper.dart';

// Storage
export 'storage/secure_storage.dart';

// Errors
export 'errors/error_boundary.dart';
export 'errors/error_handler.dart';

// Security
export 'security/security.dart';
export 'security/app_integrity.dart';
export 'security/certificate_pinning.dart';
export 'security/database_encryption.dart';
export 'security/network_security.dart';
export 'security/secure_storage_service.dart';

// Sync
export 'sync/sync.dart';
export 'sync/conflict_resolver.dart';
export 'sync/conflict_resolution_dialog.dart';
export 'sync/sync_engine.dart';
export 'sync/sync_manager.dart';
export 'sync/sync_models.dart';
export 'sync/sync_queue.dart';

// Performance
export 'performance/cache_manager.dart';
export 'performance/image_optimizer.dart';
export 'performance/lazy_loader.dart';
export 'performance/pagination.dart';
export 'performance/performance_monitor.dart';
export 'performance/performance_overlay.dart';

// Accessibility
export 'accessibility/accessibility.dart';

// Router
export 'router/app_router.dart';

// Analytics
export 'analytics/analytics_service.dart';

// App Lifecycle
export 'app/app_lifecycle_observer.dart';

// Providers
export 'providers/connectivity_provider.dart';
export 'providers/dio_provider.dart';
export 'providers/entitlements_provider.dart';
export 'providers/locale_provider.dart';
export 'providers/notification_provider.dart';
export 'providers/subscription_tier_provider.dart';
