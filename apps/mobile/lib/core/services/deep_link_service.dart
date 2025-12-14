import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'goal_service.dart';
import 'task_service.dart';

/// Supported deep link types
enum DeepLinkType {
  // Authentication
  passwordReset,
  emailVerification,
  magicLink,

  // Content
  article,
  coach,
  session,

  // Social
  profile,
  invite,
  share,

  // App screens
  home,
  chat,
  messages,
  conversation,
  goals,
  tasks,
  habits,
  mood,
  gamification,
  marketplace,
  aiCoach,
  settings,
  onboarding,

  // Video/Audio calls
  videoCall,
  audioCall,

  // Payments
  checkout,
  paymentSuccess,
  paymentCancel,

  // Unknown
  unknown,
}

/// Parsed deep link data
class DeepLinkData {
  final DeepLinkType type;
  final String? entityId;
  final Map<String, String> queryParams;
  final String rawUri;

  const DeepLinkData({
    required this.type,
    this.entityId,
    this.queryParams = const {},
    required this.rawUri,
  });

  @override
  String toString() =>
      'DeepLinkData(type: $type, entityId: $entityId, params: $queryParams)';
}

/// Service for handling deep links and universal links
class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  final AppLinks _appLinks = AppLinks();
  GoRouter? _router;
  StreamSubscription<Uri>? _linkSubscription;

  // Pending link to process after router is set
  DeepLinkData? _pendingDeepLink;

  // Stream controller for deep link events
  final _deepLinkController = StreamController<DeepLinkData>.broadcast();
  Stream<DeepLinkData> get deepLinkStream => _deepLinkController.stream;

  /// Initialize the deep link service
  Future<void> initialize() async {
    debugPrint('Initializing DeepLinkService...');

    // Handle initial link (app opened via deep link when terminated)
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        debugPrint('Initial deep link: $initialUri');
        _handleUri(initialUri);
      }
    } catch (e) {
      debugPrint('Error getting initial deep link: $e');
    }

    // Listen for incoming deep links (app in foreground/background)
    _linkSubscription = _appLinks.uriLinkStream.listen(
      (uri) {
        debugPrint('Incoming deep link: $uri');
        _handleUri(uri);
      },
      onError: (e) {
        debugPrint('Deep link stream error: $e');
      },
    );
  }

  /// Set the router instance for navigation
  void setRouter(GoRouter router) {
    _router = router;

    // Process pending deep link if exists
    if (_pendingDeepLink != null) {
      debugPrint('Processing pending deep link: ${_pendingDeepLink!.type}');
      _navigateToDeepLink(_pendingDeepLink!);
      _pendingDeepLink = null;
    }
  }

  /// Dispose resources
  void dispose() {
    _linkSubscription?.cancel();
    _deepLinkController.close();
  }

  /// Handle incoming URI
  void _handleUri(Uri uri) {
    final deepLinkData = parseUri(uri);
    debugPrint('Parsed deep link: $deepLinkData');

    _deepLinkController.add(deepLinkData);
    _navigateToDeepLink(deepLinkData);
  }

  /// Parse URI into DeepLinkData
  DeepLinkData parseUri(Uri uri) {
    final pathSegments = uri.pathSegments;
    final queryParams = uri.queryParameters;
    final host = uri.host;
    final scheme = uri.scheme;

    debugPrint('Parsing URI - scheme: $scheme, host: $host, path: ${uri.path}');

    // Handle custom scheme (upcoach://)
    if (scheme == 'upcoach') {
      return _parseCustomSchemeUri(pathSegments, queryParams, uri.toString());
    }

    // Handle universal links (https://upcoach.com/...)
    if (host == 'upcoach.com' || host == 'www.upcoach.com') {
      return _parseUniversalLinkUri(pathSegments, queryParams, uri.toString());
    }

    return DeepLinkData(type: DeepLinkType.unknown, rawUri: uri.toString());
  }

  /// Parse custom scheme URIs (upcoach://...)
  DeepLinkData _parseCustomSchemeUri(
    List<String> segments,
    Map<String, String> params,
    String rawUri,
  ) {
    if (segments.isEmpty) {
      return DeepLinkData(type: DeepLinkType.home, rawUri: rawUri);
    }

    final firstSegment = segments.first;

    switch (firstSegment) {
      // Authentication
      case 'password-reset':
      case 'reset-password':
        return DeepLinkData(
          type: DeepLinkType.passwordReset,
          queryParams: params,
          rawUri: rawUri,
        );
      case 'verify-email':
        return DeepLinkData(
          type: DeepLinkType.emailVerification,
          queryParams: params,
          rawUri: rawUri,
        );
      case 'magic-link':
        return DeepLinkData(
          type: DeepLinkType.magicLink,
          queryParams: params,
          rawUri: rawUri,
        );

      // Content
      case 'article':
        return DeepLinkData(
          type: DeepLinkType.article,
          entityId: segments.length > 1 ? segments[1] : params['id'],
          queryParams: params,
          rawUri: rawUri,
        );
      case 'coach':
        return DeepLinkData(
          type: DeepLinkType.coach,
          entityId: segments.length > 1 ? segments[1] : params['id'],
          queryParams: params,
          rawUri: rawUri,
        );
      case 'session':
        return DeepLinkData(
          type: DeepLinkType.session,
          entityId: segments.length > 1 ? segments[1] : params['id'],
          queryParams: params,
          rawUri: rawUri,
        );

      // Video/Audio calls
      case 'call':
        final callType = segments.length > 1 ? segments[1] : 'video';
        final sessionId =
            segments.length > 2 ? segments[2] : params['sessionId'];
        return DeepLinkData(
          type: callType == 'audio'
              ? DeepLinkType.audioCall
              : DeepLinkType.videoCall,
          entityId: sessionId,
          queryParams: params,
          rawUri: rawUri,
        );

      // Social
      case 'profile':
        return DeepLinkData(
          type: DeepLinkType.profile,
          entityId: segments.length > 1 ? segments[1] : params['id'],
          queryParams: params,
          rawUri: rawUri,
        );
      case 'invite':
        return DeepLinkData(
          type: DeepLinkType.invite,
          queryParams: params,
          rawUri: rawUri,
        );
      case 'share':
        return DeepLinkData(
          type: DeepLinkType.share,
          queryParams: params,
          rawUri: rawUri,
        );

      // App screens
      case 'home':
        return DeepLinkData(type: DeepLinkType.home, rawUri: rawUri);
      case 'chat':
        return DeepLinkData(type: DeepLinkType.chat, rawUri: rawUri);
      case 'messages':
        return DeepLinkData(type: DeepLinkType.messages, rawUri: rawUri);
      case 'conversation':
        return DeepLinkData(
          type: DeepLinkType.conversation,
          entityId: segments.length > 1 ? segments[1] : params['id'],
          queryParams: params,
          rawUri: rawUri,
        );
      case 'goals':
        return DeepLinkData(
          type: DeepLinkType.goals,
          entityId: segments.length > 1 ? segments[1] : null,
          rawUri: rawUri,
        );
      case 'tasks':
        return DeepLinkData(
          type: DeepLinkType.tasks,
          entityId: segments.length > 1 ? segments[1] : null,
          rawUri: rawUri,
        );
      case 'habits':
        return DeepLinkData(type: DeepLinkType.habits, rawUri: rawUri);
      case 'mood':
        return DeepLinkData(type: DeepLinkType.mood, rawUri: rawUri);
      case 'gamification':
        return DeepLinkData(type: DeepLinkType.gamification, rawUri: rawUri);
      case 'marketplace':
        return DeepLinkData(type: DeepLinkType.marketplace, rawUri: rawUri);
      case 'ai-coach':
        return DeepLinkData(type: DeepLinkType.aiCoach, rawUri: rawUri);
      case 'settings':
        return DeepLinkData(type: DeepLinkType.settings, rawUri: rawUri);
      case 'onboarding':
        return DeepLinkData(type: DeepLinkType.onboarding, rawUri: rawUri);

      // Payments
      case 'checkout':
        return DeepLinkData(
          type: DeepLinkType.checkout,
          queryParams: params,
          rawUri: rawUri,
        );
      case 'payment-success':
        return DeepLinkData(
          type: DeepLinkType.paymentSuccess,
          queryParams: params,
          rawUri: rawUri,
        );
      case 'payment-cancel':
        return DeepLinkData(
          type: DeepLinkType.paymentCancel,
          queryParams: params,
          rawUri: rawUri,
        );

      default:
        return DeepLinkData(type: DeepLinkType.unknown, rawUri: rawUri);
    }
  }

  /// Parse universal link URIs (https://upcoach.com/...)
  DeepLinkData _parseUniversalLinkUri(
    List<String> segments,
    Map<String, String> params,
    String rawUri,
  ) {
    // Universal links follow similar patterns to custom scheme
    return _parseCustomSchemeUri(segments, params, rawUri);
  }

  /// Navigate to the appropriate screen based on deep link
  void _navigateToDeepLink(DeepLinkData data) {
    if (_router == null) {
      debugPrint('Router not set, storing pending deep link');
      _pendingDeepLink = data;
      return;
    }

    debugPrint('Navigating to deep link: ${data.type}');

    switch (data.type) {
      // Authentication
      case DeepLinkType.passwordReset:
        final token = data.queryParams['token'];
        if (token != null) {
          _router!.go('/forgot-password?token=$token');
        } else {
          _router!.go('/forgot-password');
        }
        break;

      case DeepLinkType.emailVerification:
        // Email verification tokens are handled via query params
        // The auth service will process the token from the URL
        _router!.go('/home');
        break;

      case DeepLinkType.magicLink:
        // Magic link tokens are handled via query params
        // The auth service will process the token from the URL
        _router!.go('/home');
        break;

      // Content
      case DeepLinkType.article:
        if (data.entityId != null) {
          _router!.go('/content/article/${data.entityId}');
        } else {
          _router!.go('/content');
        }
        break;

      case DeepLinkType.coach:
        if (data.entityId != null) {
          _router!.go('/marketplace/coach/${data.entityId}');
        } else {
          _router!.go('/marketplace');
        }
        break;

      case DeepLinkType.session:
        if (data.entityId != null) {
          _router!.go('/marketplace/my-sessions');
        } else {
          _router!.go('/marketplace/my-sessions');
        }
        break;

      // Video/Audio calls
      case DeepLinkType.videoCall:
        if (data.entityId != null) {
          final coachName = data.queryParams['coachName'] ?? '';
          _router!.go('/call/video/${data.entityId}?coachName=$coachName');
        }
        break;

      case DeepLinkType.audioCall:
        if (data.entityId != null) {
          final coachName = data.queryParams['coachName'] ?? '';
          final coachImageUrl = data.queryParams['coachImageUrl'] ?? '';
          _router!.go(
              '/call/audio/${data.entityId}?coachName=$coachName&coachImageUrl=$coachImageUrl');
        }
        break;

      // Social
      case DeepLinkType.profile:
        if (data.entityId != null) {
          // Navigate to specific user profile
          // For now, just go to own profile - public profiles would need a dedicated route
          _router!.go('/profile');
        } else {
          _router!.go('/profile');
        }
        break;

      case DeepLinkType.invite:
        // Invite codes are passed to home where they can be processed
        // by the invite handling logic in the app
        _router!.go('/home');
        break;

      case DeepLinkType.share:
        // Handle shared content
        _router!.go('/home');
        break;

      // App screens
      case DeepLinkType.home:
        _router!.go('/home');
        break;

      case DeepLinkType.chat:
        _router!.go('/chat');
        break;

      case DeepLinkType.messages:
        _router!.go('/messages');
        break;

      case DeepLinkType.conversation:
        if (data.entityId != null) {
          _router!.go('/messaging/${data.entityId}');
        } else {
          _router!.go('/messages');
        }
        break;

      case DeepLinkType.goals:
        if (data.entityId != null) {
          // Navigate to specific goal - fetch goal data first
          _navigateToGoal(data.entityId!);
        } else {
          _router!.go('/goals');
        }
        break;

      case DeepLinkType.tasks:
        if (data.entityId != null) {
          // Navigate to specific task - fetch task data first
          _navigateToTask(data.entityId!);
        } else {
          _router!.go('/tasks');
        }
        break;

      case DeepLinkType.habits:
        _router!.go('/habits');
        break;

      case DeepLinkType.mood:
        _router!.go('/mood');
        break;

      case DeepLinkType.gamification:
        _router!.go('/gamification');
        break;

      case DeepLinkType.marketplace:
        _router!.go('/marketplace');
        break;

      case DeepLinkType.aiCoach:
        _router!.go('/ai-coach');
        break;

      case DeepLinkType.settings:
        _router!.go('/profile/settings');
        break;

      case DeepLinkType.onboarding:
        _router!.go('/onboarding');
        break;

      // Payments
      case DeepLinkType.checkout:
        // Checkout requires extra data, navigate to home
        _router!.go('/home');
        break;

      case DeepLinkType.paymentSuccess:
        // Show success message and navigate to appropriate screen
        _router!.go('/payments/history');
        break;

      case DeepLinkType.paymentCancel:
        // Handle cancelled payment
        _router!.go('/home');
        break;

      case DeepLinkType.unknown:
        debugPrint('Unknown deep link type, navigating to home');
        _router!.go('/home');
        break;
    }
  }

  /// Navigate to a specific goal by fetching its data first
  Future<void> _navigateToGoal(String goalId) async {
    if (_router == null) return;

    try {
      final goalService = GoalService();
      final goal = await goalService.getGoalById(goalId);

      if (goal != null) {
        _router!.go('/goals/$goalId', extra: goal);
      } else {
        debugPrint('Goal not found: $goalId');
        _router!.go('/goals');
      }
    } catch (e) {
      debugPrint('Error fetching goal for deep link: $e');
      _router!.go('/goals');
    }
  }

  /// Navigate to a specific task by fetching its data first
  Future<void> _navigateToTask(String taskId) async {
    if (_router == null) return;

    try {
      final taskService = TaskService();
      final task = await taskService.getTaskById(taskId);

      if (task != null) {
        _router!.go('/tasks/$taskId', extra: task);
      } else {
        debugPrint('Task not found: $taskId');
        _router!.go('/tasks');
      }
    } catch (e) {
      debugPrint('Error fetching task for deep link: $e');
      _router!.go('/tasks');
    }
  }

  /// Generate a deep link URL for sharing
  String generateDeepLink(DeepLinkType type,
      {String? entityId, Map<String, String>? params}) {
    final base = 'https://upcoach.com';
    String path;

    switch (type) {
      case DeepLinkType.article:
        path = entityId != null ? '/article/$entityId' : '/content';
        break;
      case DeepLinkType.coach:
        path = entityId != null ? '/coach/$entityId' : '/marketplace';
        break;
      case DeepLinkType.session:
        path = entityId != null
            ? '/session/$entityId'
            : '/marketplace/my-sessions';
        break;
      case DeepLinkType.profile:
        path = entityId != null ? '/profile/$entityId' : '/profile';
        break;
      case DeepLinkType.conversation:
        path = entityId != null ? '/conversation/$entityId' : '/messages';
        break;
      case DeepLinkType.invite:
        path = '/invite';
        break;
      case DeepLinkType.videoCall:
        path = entityId != null ? '/call/video/$entityId' : '/home';
        break;
      case DeepLinkType.audioCall:
        path = entityId != null ? '/call/audio/$entityId' : '/home';
        break;
      default:
        path =
            '/${type.name.replaceAll(RegExp(r'([A-Z])'), '-\$1').toLowerCase()}';
    }

    final uri = Uri.parse('$base$path');
    if (params != null && params.isNotEmpty) {
      return uri.replace(queryParameters: params).toString();
    }
    return uri.toString();
  }

  /// Generate a custom scheme deep link
  String generateCustomSchemeLink(DeepLinkType type,
      {String? entityId, Map<String, String>? params}) {
    final universalLink =
        generateDeepLink(type, entityId: entityId, params: params);
    return universalLink.replaceFirst('https://upcoach.com', 'upcoach://');
  }
}

/// Provider for DeepLinkService
final deepLinkServiceProvider = Provider<DeepLinkService>((ref) {
  return DeepLinkService();
});

/// Stream provider for deep link events
final deepLinkStreamProvider = StreamProvider<DeepLinkData>((ref) {
  final service = ref.watch(deepLinkServiceProvider);
  return service.deepLinkStream;
});
