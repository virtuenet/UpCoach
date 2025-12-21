/// Content Localization Service
///
/// Handles dynamic content localization for user-generated content,
/// coaching content, and AI responses.

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'locale_service.dart';
import 'i18n_provider.dart';

/// Content types that can be localized
enum LocalizableContentType {
  coachingTip,
  habitDescription,
  goalDescription,
  aiResponse,
  notification,
  communityPost,
  forumContent,
  userBio,
}

/// Quality level of translation
enum TranslationQuality {
  machine, // Machine translated, not reviewed
  humanReviewed, // Machine translated, human reviewed
  professional, // Professionally translated
  native, // Created in target language
}

/// Localized content item
class LocalizedContent {
  final String contentId;
  final LocalizableContentType contentType;
  final String sourceLocale;
  final String targetLocale;
  final String sourceText;
  final String translatedText;
  final TranslationQuality quality;
  final DateTime translatedAt;
  final bool isApproved;
  final Map<String, dynamic>? metadata;

  LocalizedContent({
    required this.contentId,
    required this.contentType,
    required this.sourceLocale,
    required this.targetLocale,
    required this.sourceText,
    required this.translatedText,
    required this.quality,
    required this.translatedAt,
    this.isApproved = false,
    this.metadata,
  });

  factory LocalizedContent.fromJson(Map<String, dynamic> json) {
    return LocalizedContent(
      contentId: json['contentId'] ?? '',
      contentType: LocalizableContentType.values.firstWhere(
        (e) => e.name == json['contentType'],
        orElse: () => LocalizableContentType.coachingTip,
      ),
      sourceLocale: json['sourceLocale'] ?? 'en',
      targetLocale: json['targetLocale'] ?? 'en',
      sourceText: json['sourceText'] ?? '',
      translatedText: json['translatedText'] ?? '',
      quality: TranslationQuality.values.firstWhere(
        (e) => e.name == json['quality'],
        orElse: () => TranslationQuality.machine,
      ),
      translatedAt: json['translatedAt'] != null
          ? DateTime.parse(json['translatedAt'])
          : DateTime.now(),
      isApproved: json['isApproved'] ?? false,
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() => {
        'contentId': contentId,
        'contentType': contentType.name,
        'sourceLocale': sourceLocale,
        'targetLocale': targetLocale,
        'sourceText': sourceText,
        'translatedText': translatedText,
        'quality': quality.name,
        'translatedAt': translatedAt.toIso8601String(),
        'isApproved': isApproved,
        'metadata': metadata,
      };

  LocalizedContent copyWith({
    String? translatedText,
    TranslationQuality? quality,
    bool? isApproved,
  }) {
    return LocalizedContent(
      contentId: contentId,
      contentType: contentType,
      sourceLocale: sourceLocale,
      targetLocale: targetLocale,
      sourceText: sourceText,
      translatedText: translatedText ?? this.translatedText,
      quality: quality ?? this.quality,
      translatedAt: translatedAt,
      isApproved: isApproved ?? this.isApproved,
      metadata: metadata,
    );
  }
}

/// Translation request
class TranslationRequest {
  final String contentId;
  final LocalizableContentType contentType;
  final String sourceText;
  final String sourceLocale;
  final List<String> targetLocales;
  final TranslationPriority priority;
  final Map<String, dynamic>? context;

  TranslationRequest({
    required this.contentId,
    required this.contentType,
    required this.sourceText,
    required this.sourceLocale,
    required this.targetLocales,
    this.priority = TranslationPriority.normal,
    this.context,
  });
}

/// Translation priority
enum TranslationPriority { low, normal, high, urgent }

/// Content Localization Service
class ContentLocalizationService {
  static ContentLocalizationService? _instance;

  // Cache for translations
  final Map<String, Map<String, LocalizedContent>> _cache = {};

  // Pending translation requests
  final Map<String, TranslationRequest> _pendingRequests = {};

  // Event stream for translation updates
  final StreamController<LocalizedContent> _translationUpdates =
      StreamController<LocalizedContent>.broadcast();

  ContentLocalizationService._();

  factory ContentLocalizationService() {
    _instance ??= ContentLocalizationService._();
    return _instance!;
  }

  /// Stream of translation updates
  Stream<LocalizedContent> get translationUpdates => _translationUpdates.stream;

  /// Get localized content
  Future<String> getLocalizedContent(
    String contentId,
    LocalizableContentType contentType,
    String sourceText,
    String sourceLocale,
    String targetLocale, {
    bool useCache = true,
    bool requestIfMissing = true,
  }) async {
    // If same locale, return source
    if (sourceLocale == targetLocale) {
      return sourceText;
    }

    // Check cache
    final cacheKey = _getCacheKey(contentId, contentType);
    if (useCache && _cache.containsKey(cacheKey)) {
      final localeCache = _cache[cacheKey]!;
      if (localeCache.containsKey(targetLocale)) {
        return localeCache[targetLocale]!.translatedText;
      }
    }

    // Try to fetch from API
    try {
      final translation = await _fetchTranslation(contentId, targetLocale);
      if (translation != null) {
        _cacheTranslation(cacheKey, translation);
        return translation.translatedText;
      }
    } catch (e) {
      // Fetch failed, try local translation
    }

    // Request translation if enabled
    if (requestIfMissing) {
      await requestTranslation(TranslationRequest(
        contentId: contentId,
        contentType: contentType,
        sourceText: sourceText,
        sourceLocale: sourceLocale,
        targetLocales: [targetLocale],
      ));
    }

    // Fall back to source text
    return sourceText;
  }

  /// Get multiple localized contents
  Future<Map<String, String>> getLocalizedContents(
    Map<String, LocalizableContentType> contents,
    String sourceLocale,
    String targetLocale,
  ) async {
    final results = <String, String>{};

    for (final entry in contents.entries) {
      results[entry.key] = await getLocalizedContent(
        entry.key,
        entry.value,
        entry.key, // Using contentId as source text for simplicity
        sourceLocale,
        targetLocale,
      );
    }

    return results;
  }

  /// Request translation for content
  Future<void> requestTranslation(TranslationRequest request) async {
    // Store pending request
    _pendingRequests[request.contentId] = request;

    // Simulate API call
    await Future.delayed(const Duration(milliseconds: 100));

    // Process translation (simulated)
    for (final targetLocale in request.targetLocales) {
      final translated = await _translateLocally(
        request.sourceText,
        request.sourceLocale,
        targetLocale,
      );

      final content = LocalizedContent(
        contentId: request.contentId,
        contentType: request.contentType,
        sourceLocale: request.sourceLocale,
        targetLocale: targetLocale,
        sourceText: request.sourceText,
        translatedText: translated,
        quality: TranslationQuality.machine,
        translatedAt: DateTime.now(),
      );

      _cacheTranslation(_getCacheKey(request.contentId, request.contentType), content);
      _translationUpdates.add(content);
    }

    // Remove from pending
    _pendingRequests.remove(request.contentId);
  }

  /// Request batch translation
  Future<void> requestBatchTranslation(List<TranslationRequest> requests) async {
    for (final request in requests) {
      await requestTranslation(request);
    }
  }

  /// Check if content is localized
  bool isLocalized(String contentId, LocalizableContentType contentType, String locale) {
    final cacheKey = _getCacheKey(contentId, contentType);
    return _cache.containsKey(cacheKey) && _cache[cacheKey]!.containsKey(locale);
  }

  /// Get cached translation
  LocalizedContent? getCachedTranslation(
    String contentId,
    LocalizableContentType contentType,
    String locale,
  ) {
    final cacheKey = _getCacheKey(contentId, contentType);
    return _cache[cacheKey]?[locale];
  }

  /// Preload translations for content
  Future<void> preloadTranslations(
    List<String> contentIds,
    LocalizableContentType contentType,
    String targetLocale,
  ) async {
    for (final contentId in contentIds) {
      if (!isLocalized(contentId, contentType, targetLocale)) {
        await _fetchTranslation(contentId, targetLocale);
      }
    }
  }

  /// Clear cache
  void clearCache({String? contentId, String? locale}) {
    if (contentId != null && locale != null) {
      // Clear specific translation
      _cache.values.forEach((localeCache) {
        localeCache.remove(locale);
      });
    } else if (contentId != null) {
      // Clear all translations for content
      _cache.removeWhere((key, _) => key.startsWith(contentId));
    } else if (locale != null) {
      // Clear all translations for locale
      _cache.values.forEach((localeCache) {
        localeCache.remove(locale);
      });
    } else {
      // Clear all
      _cache.clear();
    }
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    int totalEntries = 0;
    final localeStats = <String, int>{};

    for (final localeCache in _cache.values) {
      for (final entry in localeCache.entries) {
        totalEntries++;
        localeStats[entry.key] = (localeStats[entry.key] ?? 0) + 1;
      }
    }

    return {
      'totalEntries': totalEntries,
      'contentCount': _cache.length,
      'byLocale': localeStats,
      'pendingRequests': _pendingRequests.length,
    };
  }

  // Private methods

  String _getCacheKey(String contentId, LocalizableContentType contentType) {
    return '${contentType.name}:$contentId';
  }

  void _cacheTranslation(String cacheKey, LocalizedContent content) {
    _cache.putIfAbsent(cacheKey, () => {});
    _cache[cacheKey]![content.targetLocale] = content;
  }

  Future<LocalizedContent?> _fetchTranslation(String contentId, String locale) async {
    // Simulate API fetch
    await Future.delayed(const Duration(milliseconds: 50));

    // Return null to simulate no translation found
    // In real implementation, this would call the API
    return null;
  }

  /// Local translation (simulated machine translation)
  Future<String> _translateLocally(
    String text,
    String sourceLocale,
    String targetLocale,
  ) async {
    // Simulated translations for demo
    final translations = <String, Map<String, String>>{
      'Complete your daily habit': {
        'es': 'Completa tu hábito diario',
        'fr': 'Terminez votre habitude quotidienne',
        'de': 'Beenden Sie Ihre tägliche Gewohnheit',
        'ja': '毎日の習慣を完了してください',
        'zh': '完成你的日常习惯',
        'ar': 'أكمل عادتك اليومية',
      },
      'Great job!': {
        'es': '¡Buen trabajo!',
        'fr': 'Excellent travail!',
        'de': 'Gute Arbeit!',
        'ja': 'よくやった！',
        'zh': '干得好！',
        'ar': 'عمل رائع!',
      },
      'Keep up the streak!': {
        'es': '¡Mantén la racha!',
        'fr': 'Gardez la série!',
        'de': 'Halte die Serie!',
        'ja': '連続記録を維持しよう！',
        'zh': '保持连续记录！',
        'ar': 'حافظ على السلسلة!',
      },
    };

    // Check if we have a pre-defined translation
    if (translations.containsKey(text) &&
        translations[text]!.containsKey(targetLocale)) {
      return translations[text]![targetLocale]!;
    }

    // Simulate machine translation by adding locale prefix
    // In real app, this would call a translation API
    return '[$targetLocale] $text';
  }

  /// Dispose resources
  void dispose() {
    _translationUpdates.close();
  }
}

/// Singleton instance getter
ContentLocalizationService get contentLocalizationService =>
    ContentLocalizationService();

// ============================================================================
// Riverpod Providers
// ============================================================================

/// Content localization service provider
final contentLocalizationServiceProvider =
    Provider<ContentLocalizationService>((ref) {
  return ContentLocalizationService();
});

/// Localized content provider
final localizedContentProvider = FutureProvider.family<String, LocalizedContentParams>(
  (ref, params) async {
    final service = ref.watch(contentLocalizationServiceProvider);
    final currentLocale = ref.watch(currentLocaleProvider);

    return service.getLocalizedContent(
      params.contentId,
      params.contentType,
      params.sourceText,
      params.sourceLocale,
      currentLocale.code,
    );
  },
);

/// Parameters for localized content provider
class LocalizedContentParams {
  final String contentId;
  final LocalizableContentType contentType;
  final String sourceText;
  final String sourceLocale;

  LocalizedContentParams({
    required this.contentId,
    required this.contentType,
    required this.sourceText,
    this.sourceLocale = 'en',
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LocalizedContentParams &&
          runtimeType == other.runtimeType &&
          contentId == other.contentId &&
          contentType == other.contentType &&
          sourceLocale == other.sourceLocale;

  @override
  int get hashCode =>
      contentId.hashCode ^ contentType.hashCode ^ sourceLocale.hashCode;
}

/// Translation updates stream provider
final translationUpdatesProvider = StreamProvider<LocalizedContent>((ref) {
  final service = ref.watch(contentLocalizationServiceProvider);
  return service.translationUpdates;
});

/// Cache stats provider
final contentCacheStatsProvider = Provider<Map<String, dynamic>>((ref) {
  final service = ref.watch(contentLocalizationServiceProvider);
  return service.getCacheStats();
});
