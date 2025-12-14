// Health & Wearable Integrations Feature
//
// This module provides integration with health platforms and wearable devices:
// - Apple Health (iOS) via HealthKit
// - Google Health Connect (Android)
// - Premium wearables (Fitbit, Garmin, Whoop, Oura, etc.)
// - Fitness apps (Strava, Peloton, Technogym, etc.)
// - Nutrition apps (MyFitnessPal, Cronometer, etc.)
// - Wellness apps (Headspace, Calm, etc.)
//
// Key features:
// - Privacy-first architecture: All data processed on-device by default
// - Local SQLite storage for health data
// - Daily readiness score calculation
// - Background sync support
// - Configurable data retention

// Models
export 'models/health_data_point.dart';
export 'models/health_integration.dart';

// Services
export 'services/health_service.dart';
export 'services/health_data_aggregator.dart';
export 'services/technogym_service.dart';

// Providers
export 'providers/health_provider.dart';

// Screens
export 'presentation/screens/health_integrations_screen.dart';
