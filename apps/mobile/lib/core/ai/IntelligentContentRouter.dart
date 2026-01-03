import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:crypto/crypto.dart';

/// Content types
enum ContentType { article, video, audio, image, course, live, other }

/// Streaming quality levels
enum StreamingQuality { low, medium, high, auto }

/// Cache eviction strategies
enum CacheStrategy { lru, lfu, fifo, lfuDecay }

/// Content priority levels
enum ContentPriority { low, normal, high, urgent }

/// Content item metadata
class ContentItem {
  final String contentId;
  final String title;
  final ContentType type;
  final String url;
  final int sizeBytes;
  final int durationSeconds;
  final Map<String, dynamic> metadata;
  final List<String> tags;
  final double popularityScore;
  final DateTime publishedAt;
  final DateTime? expiresAt;

  ContentItem({
    required this.contentId,
    required this.title,
    required this.type,
    required this.url,
    required this.sizeBytes,
    this.durationSeconds = 0,
    required this.metadata,
    required this.tags,
    this.popularityScore = 0.0,
    required this.publishedAt,
    this.expiresAt,
  });

  Map<String, dynamic> toJson() => {
        'contentId': contentId,
        'title': title,
        'type': type.toString(),
        'url': url,
        'sizeBytes': sizeBytes,
        'durationSeconds': durationSeconds,
        'metadata': metadata,
        'tags': tags,
        'popularityScore': popularityScore,
        'publishedAt': publishedAt.toIso8601String(),
        'expiresAt': expiresAt?.toIso8601String(),
      };

  factory ContentItem.fromJson(Map<String, dynamic> json) => ContentItem(
        contentId: json['contentId'] as String,
        title: json['title'] as String,
        type: ContentType.values.firstWhere(
          (e) => e.toString() == json['type'],
          orElse: () => ContentType.other,
        ),
        url: json['url'] as String,
        sizeBytes: json['sizeBytes'] as int,
        durationSeconds: json['durationSeconds'] as int? ?? 0,
        metadata: json['metadata'] as Map<String, dynamic>,
        tags: List<String>.from(json['tags'] as List),
        popularityScore: (json['popularityScore'] as num?)?.toDouble() ?? 0.0,
        publishedAt: DateTime.parse(json['publishedAt'] as String),
        expiresAt: json['expiresAt'] != null
            ? DateTime.parse(json['expiresAt'] as String)
            : null,
      );
}

/// Content relevance score
class ContentScore {
  final String contentId;
  final double relevanceScore;
  final double freshnessScore;
  final double engagementScore;
  final double totalScore;
  final Map<String, double> featureScores;
  final String explanation;

  ContentScore({
    required this.contentId,
    required this.relevanceScore,
    required this.freshnessScore,
    required this.engagementScore,
    required this.totalScore,
    required this.featureScores,
    required this.explanation,
  });
}

/// Cache entry
class CacheEntry {
  final String contentId;
  final String cacheKey;
  final int sizeBytes;
  final DateTime cachedAt;
  final DateTime lastAccessedAt;
  final int accessCount;
  final double priority;
  final DateTime? expiresAt;
  final Map<String, dynamic> metadata;

  CacheEntry({
    required this.contentId,
    required this.cacheKey,
    required this.sizeBytes,
    required this.cachedAt,
    required this.lastAccessedAt,
    required this.accessCount,
    required this.priority,
    this.expiresAt,
    required this.metadata,
  });

  Map<String, dynamic> toJson() => {
        'contentId': contentId,
        'cacheKey': cacheKey,
        'sizeBytes': sizeBytes,
        'cachedAt': cachedAt.toIso8601String(),
        'lastAccessedAt': lastAccessedAt.toIso8601String(),
        'accessCount': accessCount,
        'priority': priority,
        'expiresAt': expiresAt?.toIso8601String(),
        'metadata': metadata,
      };

  factory CacheEntry.fromJson(Map<String, dynamic> json) => CacheEntry(
        contentId: json['contentId'] as String,
        cacheKey: json['cacheKey'] as String,
        sizeBytes: json['sizeBytes'] as int,
        cachedAt: DateTime.parse(json['cachedAt'] as String),
        lastAccessedAt: DateTime.parse(json['lastAccessedAt'] as String),
        accessCount: json['accessCount'] as int,
        priority: (json['priority'] as num).toDouble(),
        expiresAt: json['expiresAt'] != null
            ? DateTime.parse(json['expiresAt'] as String)
            : null,
        metadata: json['metadata'] as Map<String, dynamic>,
      );

  /// Calculate LFU with time decay score
  double calculateLFUDecayScore({
    required DateTime now,
    double decayHalfLifeHours = 24.0,
  }) {
    final hoursSinceAccess =
        now.difference(lastAccessedAt).inMinutes / 60.0;
    final decayFactor = exp(-0.693 * hoursSinceAccess / decayHalfLifeHours);
    return accessCount * decayFactor;
  }
}

/// Network conditions
class NetworkConditions {
  final ConnectivityResult connectionType;
  final double bandwidthMbps;
  final int latencyMs;
  final double packetLoss;
  final bool isMetered;
  final bool isRoaming;

  NetworkConditions({
    required this.connectionType,
    required this.bandwidthMbps,
    required this.latencyMs,
    this.packetLoss = 0.0,
    required this.isMetered,
    required this.isRoaming,
  });

  bool get isHighSpeed =>
      connectionType == ConnectivityResult.wifi ||
      connectionType == ConnectivityResult.ethernet;

  bool get isLowBandwidth => bandwidthMbps < 1.0 || isMetered || isRoaming;
}

/// Thompson sampling arm
class ThompsonArm {
  final String variantId;
  int successes;
  int failures;

  ThompsonArm({
    required this.variantId,
    this.successes = 1,
    this.failures = 1,
  });

  /// Sample from Beta distribution
  double sample(Random random) {
    // Beta distribution approximation using Gamma
    return _sampleBeta(random, successes.toDouble(), failures.toDouble());
  }

  double _sampleBeta(Random random, double alpha, double beta) {
    final x = _sampleGamma(random, alpha);
    final y = _sampleGamma(random, beta);
    return x / (x + y);
  }

  double _sampleGamma(Random random, double shape) {
    // Marsaglia and Tsang's method
    if (shape < 1.0) {
      return _sampleGamma(random, shape + 1.0) *
          pow(random.nextDouble(), 1.0 / shape).toDouble();
    }

    final d = shape - 1.0 / 3.0;
    final c = 1.0 / sqrt(9.0 * d);

    while (true) {
      double x, v;
      do {
        x = _sampleNormal(random);
        v = 1.0 + c * x;
      } while (v <= 0.0);

      v = v * v * v;
      final u = random.nextDouble();

      if (u < 1.0 - 0.0331 * x * x * x * x) {
        return d * v;
      }

      if (log(u) < 0.5 * x * x + d * (1.0 - v + log(v))) {
        return d * v;
      }
    }
  }

  double _sampleNormal(Random random) {
    // Box-Muller transform
    final u1 = random.nextDouble();
    final u2 = random.nextDouble();
    return sqrt(-2.0 * log(u1)) * cos(2.0 * pi * u2);
  }

  Map<String, dynamic> toJson() => {
        'variantId': variantId,
        'successes': successes,
        'failures': failures,
      };

  factory ThompsonArm.fromJson(Map<String, dynamic> json) => ThompsonArm(
        variantId: json['variantId'] as String,
        successes: json['successes'] as int,
        failures: json['failures'] as int,
      );
}

/// Intelligent content routing and delivery optimization
class IntelligentContentRouter {
  static const String _dbName = 'content_router.db';
  static const int _dbVersion = 1;
  static const int _maxCacheSizeMB = 500;

  Database? _database;
  SharedPreferences? _prefs;
  Dio? _dio;
  final Connectivity _connectivity = Connectivity();

  // Cache management
  final Map<String, CacheEntry> _memoryCache = {};
  int _currentCacheSizeBytes = 0;

  // Network monitoring
  NetworkConditions? _networkConditions;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  // Thompson sampling for A/B testing
  final Map<String, List<ThompsonArm>> _thompsonTests = {};
  final Random _random = Random();

  // User interaction history
  final List<Map<String, dynamic>> _userHistory = [];
  final Map<String, double> _userPreferences = {};

  // Callbacks
  Function(ContentItem, double)? onContentPrefetched;
  Function(String, StreamingQuality)? onQualityChanged;
  Function(String)? onError;

  /// Initialize content router
  Future<void> initialize() async {
    try {
      debugPrint('[IntelligentContentRouter] Initializing...');

      // Initialize shared preferences
      _prefs = await SharedPreferences.getInstance();

      // Initialize database
      await _initializeDatabase();

      // Initialize HTTP client
      _initializeHttpClient();

      // Monitor network conditions
      await _initializeNetworkMonitoring();

      // Load cache metadata
      await _loadCacheMetadata();

      // Load user preferences
      await _loadUserPreferences();

      // Load Thompson sampling tests
      await _loadThompsonTests();

      debugPrint('[IntelligentContentRouter] Initialized successfully');
    } catch (e) {
      debugPrint('[IntelligentContentRouter] Initialization error: $e');
      onError?.call('Failed to initialize router: $e');
      rethrow;
    }
  }

  /// Initialize database
  Future<void> _initializeDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    _database = await openDatabase(
      path,
      version: _dbVersion,
      onCreate: (db, version) async {
        // Cache metadata table
        await db.execute('''
          CREATE TABLE cache_metadata (
            cache_key TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            cached_at INTEGER NOT NULL,
            last_accessed_at INTEGER NOT NULL,
            access_count INTEGER NOT NULL,
            priority REAL NOT NULL,
            expires_at INTEGER,
            metadata TEXT NOT NULL
          )
        ''');

        // User interaction history
        await db.execute('''
          CREATE TABLE interaction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            context TEXT NOT NULL
          )
        ''');

        // Prefetch queue
        await db.execute('''
          CREATE TABLE prefetch_queue (
            content_id TEXT PRIMARY KEY,
            priority REAL NOT NULL,
            predicted_score REAL NOT NULL,
            scheduled_at INTEGER NOT NULL,
            metadata TEXT NOT NULL
          )
        ''');

        // Thompson sampling tests
        await db.execute('''
          CREATE TABLE thompson_tests (
            test_id TEXT NOT NULL,
            variant_id TEXT NOT NULL,
            successes INTEGER NOT NULL,
            failures INTEGER NOT NULL,
            PRIMARY KEY (test_id, variant_id)
          )
        ''');

        // Indexes
        await db.execute('''
          CREATE INDEX idx_cache_accessed
          ON cache_metadata(last_accessed_at DESC)
        ''');

        await db.execute('''
          CREATE INDEX idx_interactions_content
          ON interaction_history(content_id, timestamp DESC)
        ''');

        debugPrint('[IntelligentContentRouter] Database created');
      },
    );
  }

  /// Initialize HTTP client
  void _initializeHttpClient() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 60),
      sendTimeout: const Duration(seconds: 30),
    ));

    // Add interceptors
    _dio!.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        // Add bandwidth optimization headers
        if (_networkConditions?.isLowBandwidth ?? false) {
          options.headers['Accept-Encoding'] = 'gzip, deflate, br';
          options.headers['Save-Data'] = 'on';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        // Track successful downloads
        debugPrint('[ContentRouter] Downloaded: ${response.requestOptions.uri}');
        return handler.next(response);
      },
      onError: (error, handler) {
        debugPrint('[ContentRouter] Error: ${error.message}');
        return handler.next(error);
      },
    ));
  }

  /// Initialize network monitoring
  Future<void> _initializeNetworkMonitoring() async {
    // Get initial network state
    await _updateNetworkConditions();

    // Listen to connectivity changes
    _connectivitySubscription =
        _connectivity.onConnectivityChanged.listen((results) async {
      await _updateNetworkConditions();
    });
  }

  /// Update network conditions
  Future<void> _updateNetworkConditions() async {
    try {
      final results = await _connectivity.checkConnectivity();
      final connectionType = results.isNotEmpty ? results.first : ConnectivityResult.none;

      // Estimate bandwidth based on connection type
      double bandwidthMbps = 0.0;
      int latencyMs = 1000;

      switch (connectionType) {
        case ConnectivityResult.wifi:
          bandwidthMbps = 50.0;
          latencyMs = 20;
          break;
        case ConnectivityResult.ethernet:
          bandwidthMbps = 100.0;
          latencyMs = 10;
          break;
        case ConnectivityResult.mobile:
          bandwidthMbps = 10.0;
          latencyMs = 50;
          break;
        case ConnectivityResult.vpn:
          bandwidthMbps = 25.0;
          latencyMs = 30;
          break;
        default:
          bandwidthMbps = 0.0;
          latencyMs = 1000;
      }

      _networkConditions = NetworkConditions(
        connectionType: connectionType,
        bandwidthMbps: bandwidthMbps,
        latencyMs: latencyMs,
        isMetered: false, // Would need platform-specific code
        isRoaming: false,
      );

      debugPrint(
          '[ContentRouter] Network: $connectionType (${bandwidthMbps}Mbps)');
    } catch (e) {
      debugPrint('[ContentRouter] Error updating network: $e');
    }
  }

  /// Load cache metadata
  Future<void> _loadCacheMetadata() async {
    try {
      final List<Map<String, dynamic>> results =
          await _database!.query('cache_metadata');

      _memoryCache.clear();
      _currentCacheSizeBytes = 0;

      for (final row in results) {
        final entry = CacheEntry(
          contentId: row['content_id'] as String,
          cacheKey: row['cache_key'] as String,
          sizeBytes: row['size_bytes'] as int,
          cachedAt:
              DateTime.fromMillisecondsSinceEpoch(row['cached_at'] as int),
          lastAccessedAt: DateTime.fromMillisecondsSinceEpoch(
              row['last_accessed_at'] as int),
          accessCount: row['access_count'] as int,
          priority: (row['priority'] as num).toDouble(),
          expiresAt: row['expires_at'] != null
              ? DateTime.fromMillisecondsSinceEpoch(row['expires_at'] as int)
              : null,
          metadata: jsonDecode(row['metadata'] as String) as Map<String, dynamic>,
        );

        _memoryCache[entry.cacheKey] = entry;
        _currentCacheSizeBytes += entry.sizeBytes;
      }

      debugPrint(
          '[ContentRouter] Loaded ${_memoryCache.length} cache entries (${(_currentCacheSizeBytes / 1024 / 1024).toStringAsFixed(1)} MB)');
    } catch (e) {
      debugPrint('[ContentRouter] Error loading cache: $e');
    }
  }

  /// Load user preferences
  Future<void> _loadUserPreferences() async {
    try {
      final prefsJson = _prefs?.getString('user_preferences');
      if (prefsJson != null) {
        final prefs = jsonDecode(prefsJson) as Map<String, dynamic>;
        _userPreferences.clear();
        prefs.forEach((key, value) {
          _userPreferences[key] = (value as num).toDouble();
        });
      }

      // Load recent interactions
      final interactions = await _database!.query(
        'interaction_history',
        orderBy: 'timestamp DESC',
        limit: 100,
      );

      _userHistory.clear();
      for (final row in interactions) {
        _userHistory.add({
          'content_id': row['content_id'],
          'action': row['action_type'],
          'timestamp': DateTime.fromMillisecondsSinceEpoch(row['timestamp'] as int),
          'context': jsonDecode(row['context'] as String),
        });
      }

      debugPrint(
          '[ContentRouter] Loaded ${_userHistory.length} interactions');
    } catch (e) {
      debugPrint('[ContentRouter] Error loading preferences: $e');
    }
  }

  /// Load Thompson sampling tests
  Future<void> _loadThompsonTests() async {
    try {
      final results = await _database!.query('thompson_tests');

      _thompsonTests.clear();

      for (final row in results) {
        final testId = row['test_id'] as String;
        final arm = ThompsonArm(
          variantId: row['variant_id'] as String,
          successes: row['successes'] as int,
          failures: row['failures'] as int,
        );

        _thompsonTests.putIfAbsent(testId, () => []).add(arm);
      }

      debugPrint('[ContentRouter] Loaded ${_thompsonTests.length} A/B tests');
    } catch (e) {
      debugPrint('[ContentRouter] Error loading tests: $e');
    }
  }

  /// BM25 scoring for content relevance
  double scoreContentBM25({
    required ContentItem content,
    required List<String> queryTerms,
    required Map<String, double> userProfile,
    double k1 = 1.2,
    double b = 0.75,
  }) {
    if (queryTerms.isEmpty) return 0.0;

    // Document (content) terms from title and tags
    final docTerms = [
      ...content.title.toLowerCase().split(' '),
      ...content.tags.map((t) => t.toLowerCase()),
    ];

    // Average document length (assume 20 terms)
    const avgDocLength = 20.0;
    final docLength = docTerms.length.toDouble();

    double score = 0.0;

    for (final term in queryTerms) {
      // Term frequency in document
      final tf = docTerms.where((t) => t.contains(term)).length.toDouble();

      // Inverse document frequency (simplified)
      const idf = 1.5; // Would calculate from corpus in production

      // BM25 formula
      final numerator = tf * (k1 + 1);
      final denominator =
          tf + k1 * (1 - b + b * (docLength / avgDocLength));

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /// Score content with multiple factors
  Future<ContentScore> scoreContent({
    required ContentItem content,
    required Map<String, double> userProfile,
    required Map<String, dynamic> context,
  }) async {
    // Extract user interests as query terms
    final queryTerms = userProfile.keys.toList();

    // BM25 relevance score
    final relevanceScore = scoreContentBM25(
      content: content,
      queryTerms: queryTerms,
      userProfile: userProfile,
    );

    // Freshness score (exponential decay)
    final ageHours = DateTime.now().difference(content.publishedAt).inHours;
    final freshnessScore = exp(-ageHours / 168.0); // 7-day half-life

    // Engagement score based on popularity
    final engagementScore = content.popularityScore / 100.0;

    // Collaborative filtering score
    final collaborativeScore =
        await _calculateCollaborativeScore(content.contentId);

    // Combine scores with weights
    final weights = {
      'relevance': 0.35,
      'freshness': 0.25,
      'engagement': 0.20,
      'collaborative': 0.20,
    };

    final totalScore = relevanceScore * weights['relevance']! +
        freshnessScore * weights['freshness']! +
        engagementScore * weights['engagement']! +
        collaborativeScore * weights['collaborative']!;

    return ContentScore(
      contentId: content.contentId,
      relevanceScore: relevanceScore,
      freshnessScore: freshnessScore,
      engagementScore: engagementScore,
      totalScore: totalScore,
      featureScores: {
        'relevance': relevanceScore,
        'freshness': freshnessScore,
        'engagement': engagementScore,
        'collaborative': collaborativeScore,
      },
      explanation: _generateScoreExplanation(
        relevanceScore,
        freshnessScore,
        engagementScore,
        collaborativeScore,
      ),
    );
  }

  /// Calculate collaborative filtering score
  Future<double> _calculateCollaborativeScore(String contentId) async {
    try {
      // Find similar users based on interaction history
      // Simplified: use content popularity as proxy
      final interactions = await _database!.query(
        'interaction_history',
        where: 'content_id = ? AND action_type = ?',
        whereArgs: [contentId, 'like'],
      );

      return min(1.0, interactions.length / 10.0);
    } catch (e) {
      return 0.0;
    }
  }

  /// Generate explanation for score
  String _generateScoreExplanation(
    double relevance,
    double freshness,
    double engagement,
    double collaborative,
  ) {
    final reasons = <String>[];

    if (relevance > 0.7) reasons.add('highly relevant to your interests');
    if (freshness > 0.8) reasons.add('recently published');
    if (engagement > 0.6) reasons.add('popular with other users');
    if (collaborative > 0.5) reasons.add('liked by similar users');

    if (reasons.isEmpty) return 'Recommended content';
    return 'Recommended: ${reasons.join(', ')}';
  }

  /// Predict next content items
  Future<List<ContentItem>> predictNextContent({
    required List<ContentItem> availableContent,
    required int count,
  }) async {
    try {
      // Score all content
      final scoredContent = <ContentScore>[];

      for (final content in availableContent) {
        final score = await scoreContent(
          content: content,
          userProfile: _userPreferences,
          context: {'current_time': DateTime.now().toIso8601String()},
        );
        scoredContent.add(score);
      }

      // Sort by total score
      scoredContent.sort((a, b) => b.totalScore.compareTo(a.totalScore));

      // Map back to content items
      final topScores = scoredContent.take(count);
      final predicted = <ContentItem>[];

      for (final score in topScores) {
        final content = availableContent.firstWhere(
          (c) => c.contentId == score.contentId,
        );
        predicted.add(content);
      }

      return predicted;
    } catch (e) {
      debugPrint('[ContentRouter] Error predicting content: $e');
      return [];
    }
  }

  /// Select adaptive streaming bitrate
  StreamingQuality selectBitrate({
    required ContentItem content,
    NetworkConditions? network,
  }) {
    final conditions = network ?? _networkConditions;

    if (conditions == null ||
        conditions.connectionType == ConnectivityResult.none) {
      return StreamingQuality.low;
    }

    // Check if low bandwidth mode
    if (conditions.isLowBandwidth) {
      return StreamingQuality.low;
    }

    // Select based on bandwidth
    if (conditions.bandwidthMbps >= 25.0) {
      return StreamingQuality.high;
    } else if (conditions.bandwidthMbps >= 10.0) {
      return StreamingQuality.medium;
    } else if (conditions.bandwidthMbps >= 3.0) {
      return StreamingQuality.low;
    } else {
      return StreamingQuality.auto;
    }
  }

  /// LFU cache eviction with time decay
  Future<List<CacheEntry>> selectEvictionCandidates({
    required int requiredSpaceBytes,
  }) async {
    if (_memoryCache.isEmpty) return [];

    final now = DateTime.now();
    final entries = _memoryCache.values.toList();

    // Calculate LFU decay scores
    final scoredEntries = entries.map((entry) {
      final score = entry.calculateLFUDecayScore(now: now);
      return {'entry': entry, 'score': score};
    }).toList();

    // Sort by score (lowest first = evict first)
    scoredEntries.sort((a, b) =>
        (a['score'] as double).compareTo(b['score'] as double));

    // Select entries to evict
    final toEvict = <CacheEntry>[];
    int freedSpace = 0;

    for (final scored in scoredEntries) {
      if (freedSpace >= requiredSpaceBytes) break;

      final entry = scored['entry'] as CacheEntry;
      toEvict.add(entry);
      freedSpace += entry.sizeBytes;
    }

    return toEvict;
  }

  /// Evict cache entries
  Future<void> evictCacheEntries(List<CacheEntry> entries) async {
    try {
      for (final entry in entries) {
        // Remove from database
        await _database!.delete(
          'cache_metadata',
          where: 'cache_key = ?',
          whereArgs: [entry.cacheKey],
        );

        // Remove from memory
        _memoryCache.remove(entry.cacheKey);
        _currentCacheSizeBytes -= entry.sizeBytes;

        debugPrint('[ContentRouter] Evicted: ${entry.cacheKey}');
      }
    } catch (e) {
      debugPrint('[ContentRouter] Error evicting cache: $e');
    }
  }

  /// Add to cache
  Future<void> addToCache({
    required ContentItem content,
    required String cacheKey,
    required double priority,
  }) async {
    try {
      // Check if space available
      final maxCacheBytes = _maxCacheSizeMB * 1024 * 1024;
      final requiredSpace =
          _currentCacheSizeBytes + content.sizeBytes - maxCacheBytes;

      if (requiredSpace > 0) {
        // Evict entries
        final toEvict =
            await selectEvictionCandidates(requiredSpaceBytes: requiredSpace);
        await evictCacheEntries(toEvict);
      }

      // Create cache entry
      final entry = CacheEntry(
        contentId: content.contentId,
        cacheKey: cacheKey,
        sizeBytes: content.sizeBytes,
        cachedAt: DateTime.now(),
        lastAccessedAt: DateTime.now(),
        accessCount: 0,
        priority: priority,
        expiresAt: content.expiresAt,
        metadata: content.metadata,
      );

      // Save to database
      await _database!.insert(
        'cache_metadata',
        {
          'cache_key': entry.cacheKey,
          'content_id': entry.contentId,
          'size_bytes': entry.sizeBytes,
          'cached_at': entry.cachedAt.millisecondsSinceEpoch,
          'last_accessed_at': entry.lastAccessedAt.millisecondsSinceEpoch,
          'access_count': entry.accessCount,
          'priority': entry.priority,
          'expires_at': entry.expiresAt?.millisecondsSinceEpoch,
          'metadata': jsonEncode(entry.metadata),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // Add to memory
      _memoryCache[cacheKey] = entry;
      _currentCacheSizeBytes += entry.sizeBytes;

      debugPrint('[ContentRouter] Cached: $cacheKey');
    } catch (e) {
      debugPrint('[ContentRouter] Error caching: $e');
    }
  }

  /// Thompson sampling: select variant
  String selectVariant(String testId, List<String> variants) {
    // Get or create arms
    if (!_thompsonTests.containsKey(testId)) {
      _thompsonTests[testId] =
          variants.map((v) => ThompsonArm(variantId: v)).toList();
    }

    final arms = _thompsonTests[testId]!;

    // Sample from each arm
    double bestSample = 0.0;
    ThompsonArm? bestArm;

    for (final arm in arms) {
      final sample = arm.sample(_random);
      if (sample > bestSample) {
        bestSample = sample;
        bestArm = arm;
      }
    }

    return bestArm?.variantId ?? variants.first;
  }

  /// Update Thompson sampling with result
  Future<void> updateThompsonTest({
    required String testId,
    required String variantId,
    required bool success,
  }) async {
    try {
      final arms = _thompsonTests[testId];
      if (arms == null) return;

      final arm = arms.firstWhere((a) => a.variantId == variantId);

      if (success) {
        arm.successes++;
      } else {
        arm.failures++;
      }

      // Save to database
      await _database!.insert(
        'thompson_tests',
        {
          'test_id': testId,
          'variant_id': variantId,
          'successes': arm.successes,
          'failures': arm.failures,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      debugPrint(
          '[ContentRouter] Updated test $testId: $variantId (${arm.successes}/${arm.failures})');
    } catch (e) {
      debugPrint('[ContentRouter] Error updating test: $e');
    }
  }

  /// Record user interaction
  Future<void> recordInteraction({
    required String contentId,
    required String actionType,
    Map<String, dynamic>? context,
  }) async {
    try {
      await _database!.insert('interaction_history', {
        'content_id': contentId,
        'action_type': actionType,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'context': jsonEncode(context ?? {}),
      });

      // Update user history
      _userHistory.insert(0, {
        'content_id': contentId,
        'action': actionType,
        'timestamp': DateTime.now(),
        'context': context ?? {},
      });

      // Keep only recent 100
      if (_userHistory.length > 100) {
        _userHistory.removeLast();
      }

      // Update cache access if cached
      final cacheKey = _generateCacheKey(contentId);
      final entry = _memoryCache[cacheKey];
      if (entry != null) {
        final updated = CacheEntry(
          contentId: entry.contentId,
          cacheKey: entry.cacheKey,
          sizeBytes: entry.sizeBytes,
          cachedAt: entry.cachedAt,
          lastAccessedAt: DateTime.now(),
          accessCount: entry.accessCount + 1,
          priority: entry.priority,
          expiresAt: entry.expiresAt,
          metadata: entry.metadata,
        );

        _memoryCache[cacheKey] = updated;

        await _database!.update(
          'cache_metadata',
          {
            'last_accessed_at': updated.lastAccessedAt.millisecondsSinceEpoch,
            'access_count': updated.accessCount,
          },
          where: 'cache_key = ?',
          whereArgs: [cacheKey],
        );
      }
    } catch (e) {
      debugPrint('[ContentRouter] Error recording interaction: $e');
    }
  }

  /// Generate cache key
  String _generateCacheKey(String contentId) {
    final bytes = utf8.encode(contentId);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Get current cache size
  double get cacheSizeMB => _currentCacheSizeBytes / 1024 / 1024;

  /// Get network conditions
  NetworkConditions? get networkConditions => _networkConditions;

  /// Get cache hit rate
  Future<double> getCacheHitRate() async {
    try {
      final total = await _database!.rawQuery(
        'SELECT COUNT(*) as count FROM interaction_history WHERE action_type = ?',
        ['access'],
      );
      final hits = await _database!.rawQuery(
        'SELECT COUNT(*) as count FROM interaction_history WHERE action_type = ?',
        ['cache_hit'],
      );

      final totalCount = total.first['count'] as int;
      final hitCount = hits.first['count'] as int;

      if (totalCount == 0) return 0.0;
      return hitCount / totalCount;
    } catch (e) {
      return 0.0;
    }
  }

  /// Dispose resources
  Future<void> dispose() async {
    await _connectivitySubscription?.cancel();
    await _database?.close();
    _dio?.close();

    _memoryCache.clear();
    _thompsonTests.clear();
    _userHistory.clear();
    _userPreferences.clear();
  }
}
