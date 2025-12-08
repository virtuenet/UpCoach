import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'deep_link_service.dart';

/// Storage key for pending deep link
const String _kPendingDeepLinkKey = 'pending_deferred_deep_link';
const String _kDeferredLinkTimestampKey = 'deferred_link_timestamp';

/// Maximum age for a deferred deep link (24 hours)
const Duration _kMaxDeferredLinkAge = Duration(hours: 24);

/// Data class for deferred deep link information
class DeferredDeepLinkData {
  final DeepLinkData linkData;
  final DateTime timestamp;
  final String? campaignId;
  final String? source;
  final String? medium;
  final Map<String, String> utmParams;

  const DeferredDeepLinkData({
    required this.linkData,
    required this.timestamp,
    this.campaignId,
    this.source,
    this.medium,
    this.utmParams = const {},
  });

  /// Check if the deferred link is still valid
  bool get isValid =>
      DateTime.now().difference(timestamp) < _kMaxDeferredLinkAge;

  /// Convert to JSON for storage
  Map<String, dynamic> toJson() => {
        'type': linkData.type.name,
        'entityId': linkData.entityId,
        'queryParams': linkData.queryParams,
        'rawUri': linkData.rawUri,
        'timestamp': timestamp.toIso8601String(),
        'campaignId': campaignId,
        'source': source,
        'medium': medium,
        'utmParams': utmParams,
      };

  /// Create from JSON
  factory DeferredDeepLinkData.fromJson(Map<String, dynamic> json) {
    final type = DeepLinkType.values.firstWhere(
      (t) => t.name == json['type'],
      orElse: () => DeepLinkType.unknown,
    );

    return DeferredDeepLinkData(
      linkData: DeepLinkData(
        type: type,
        entityId: json['entityId'] as String?,
        queryParams: Map<String, String>.from(json['queryParams'] ?? {}),
        rawUri: json['rawUri'] as String,
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      campaignId: json['campaignId'] as String?,
      source: json['source'] as String?,
      medium: json['medium'] as String?,
      utmParams: Map<String, String>.from(json['utmParams'] ?? {}),
    );
  }
}

/// Service for handling deferred deep links
///
/// Deferred deep linking allows users who don't have the app installed
/// to be taken to the correct content after installing the app.
class DeferredDeepLinkService {
  static final DeferredDeepLinkService _instance =
      DeferredDeepLinkService._internal();
  factory DeferredDeepLinkService() => _instance;
  DeferredDeepLinkService._internal();

  SharedPreferences? _prefs;
  final _deferredLinkController =
      StreamController<DeferredDeepLinkData>.broadcast();

  Stream<DeferredDeepLinkData> get deferredLinkStream =>
      _deferredLinkController.stream;

  /// Initialize the service
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Save a deferred deep link for processing after install
  Future<void> saveDeferredLink(Uri uri) async {
    if (_prefs == null) await initialize();

    final deepLinkService = DeepLinkService();
    final linkData = deepLinkService.parseUri(uri);

    // Extract UTM parameters
    final utmParams = <String, String>{};
    uri.queryParameters.forEach((key, value) {
      if (key.startsWith('utm_')) {
        utmParams[key] = value;
      }
    });

    final deferredData = DeferredDeepLinkData(
      linkData: linkData,
      timestamp: DateTime.now(),
      campaignId: uri.queryParameters['campaign_id'],
      source: uri.queryParameters['utm_source'],
      medium: uri.queryParameters['utm_medium'],
      utmParams: utmParams,
    );

    await _prefs!
        .setString(_kPendingDeepLinkKey, jsonEncode(deferredData.toJson()));
    await _prefs!.setString(
        _kDeferredLinkTimestampKey, DateTime.now().toIso8601String());

    debugPrint('Saved deferred deep link: ${linkData.type}');
  }

  /// Check for and retrieve a pending deferred deep link
  Future<DeferredDeepLinkData?> getPendingDeferredLink() async {
    if (_prefs == null) await initialize();

    final jsonStr = _prefs!.getString(_kPendingDeepLinkKey);
    if (jsonStr == null) return null;

    try {
      final data = DeferredDeepLinkData.fromJson(jsonDecode(jsonStr));

      if (!data.isValid) {
        debugPrint('Deferred deep link expired, clearing...');
        await clearPendingLink();
        return null;
      }

      return data;
    } catch (e) {
      debugPrint('Error parsing deferred deep link: $e');
      await clearPendingLink();
      return null;
    }
  }

  /// Process and clear the pending deferred deep link
  Future<DeferredDeepLinkData?> processPendingLink() async {
    final pendingLink = await getPendingDeferredLink();

    if (pendingLink != null) {
      debugPrint('Processing deferred deep link: ${pendingLink.linkData.type}');
      _deferredLinkController.add(pendingLink);
      await clearPendingLink();
    }

    return pendingLink;
  }

  /// Clear the pending deferred deep link
  Future<void> clearPendingLink() async {
    if (_prefs == null) await initialize();
    await _prefs!.remove(_kPendingDeepLinkKey);
    await _prefs!.remove(_kDeferredLinkTimestampKey);
  }

  /// Check if there's a pending deferred link
  Future<bool> hasPendingLink() async {
    if (_prefs == null) await initialize();
    return _prefs!.containsKey(_kPendingDeepLinkKey);
  }

  /// Track attribution for analytics
  Future<void> trackAttribution(DeferredDeepLinkData data) async {
    // This would integrate with your analytics service
    debugPrint('Tracking deferred link attribution:');
    debugPrint('  - Type: ${data.linkData.type}');
    debugPrint('  - Campaign: ${data.campaignId}');
    debugPrint('  - Source: ${data.source}');
    debugPrint('  - Medium: ${data.medium}');
    debugPrint('  - UTM Params: ${data.utmParams}');

    // TODO: Send to analytics service
    // analyticsService.trackEvent('deferred_deep_link_processed', {
    //   'link_type': data.linkData.type.name,
    //   'campaign_id': data.campaignId,
    //   'source': data.source,
    //   'medium': data.medium,
    //   ...data.utmParams,
    // });
  }

  void dispose() {
    _deferredLinkController.close();
  }
}

/// Provider for DeferredDeepLinkService
final deferredDeepLinkServiceProvider =
    Provider<DeferredDeepLinkService>((ref) {
  return DeferredDeepLinkService();
});

/// Stream provider for deferred deep link events
final deferredDeepLinkStreamProvider =
    StreamProvider<DeferredDeepLinkData>((ref) {
  final service = ref.watch(deferredDeepLinkServiceProvider);
  return service.deferredLinkStream;
});

/// Provider for checking pending deferred links
final pendingDeferredLinkProvider =
    FutureProvider<DeferredDeepLinkData?>((ref) async {
  final service = ref.watch(deferredDeepLinkServiceProvider);
  return service.getPendingDeferredLink();
});
