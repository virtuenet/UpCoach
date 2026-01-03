import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as encrypt_pkg;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

/// User preference categories
enum PreferenceCategory {
  content,
  communication,
  ui,
  privacy,
  notifications,
  features,
}

/// Recommendation explanation types
enum ExplanationType {
  contentBased,
  collaborative,
  contextual,
  popular,
  trending,
  personalized,
}

/// Privacy levels
enum PrivacyLevel { minimal, balanced, strict, custom }

/// Cold start strategies
enum ColdStartStrategy { demographic, popular, explore, hybrid }

/// Multi-dimensional user profile
class UserProfile {
  final String userId;
  final Map<String, double> preferences; // Feature → score
  final Map<String, double> behaviorPatterns; // Behavior → frequency
  final Map<String, dynamic> context; // Context features
  final Map<String, String> demographics; // Demographic attributes
  final DateTime createdAt;
  final DateTime lastUpdated;
  final int interactionCount;
  final bool isColdStart;

  UserProfile({
    required this.userId,
    required this.preferences,
    required this.behaviorPatterns,
    required this.context,
    required this.demographics,
    required this.createdAt,
    required this.lastUpdated,
    required this.interactionCount,
    required this.isColdStart,
  });

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'preferences': preferences,
        'behaviorPatterns': behaviorPatterns,
        'context': context,
        'demographics': demographics,
        'createdAt': createdAt.toIso8601String(),
        'lastUpdated': lastUpdated.toIso8601String(),
        'interactionCount': interactionCount,
        'isColdStart': isColdStart,
      };

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        userId: json['userId'] as String,
        preferences: Map<String, double>.from(json['preferences'] as Map),
        behaviorPatterns:
            Map<String, double>.from(json['behaviorPatterns'] as Map),
        context: json['context'] as Map<String, dynamic>,
        demographics: Map<String, String>.from(json['demographics'] as Map),
        createdAt: DateTime.parse(json['createdAt'] as String),
        lastUpdated: DateTime.parse(json['lastUpdated'] as String),
        interactionCount: json['interactionCount'] as int,
        isColdStart: json['isColdStart'] as bool,
      );

  /// Create empty profile
  factory UserProfile.empty(String userId) => UserProfile(
        userId: userId,
        preferences: {},
        behaviorPatterns: {},
        context: {},
        demographics: {},
        createdAt: DateTime.now(),
        lastUpdated: DateTime.now(),
        interactionCount: 0,
        isColdStart: true,
      );
}

/// Contextual bandit arm
class BanditArm {
  final String armId;
  final String itemId;
  final Map<String, double> features;
  final double reward;
  final int pulls;

  BanditArm({
    required this.armId,
    required this.itemId,
    required this.features,
    this.reward = 0.0,
    this.pulls = 0,
  });

  Map<String, dynamic> toJson() => {
        'armId': armId,
        'itemId': itemId,
        'features': features,
        'reward': reward,
        'pulls': pulls,
      };

  factory BanditArm.fromJson(Map<String, dynamic> json) => BanditArm(
        armId: json['armId'] as String,
        itemId: json['itemId'] as String,
        features: Map<String, double>.from(json['features'] as Map),
        reward: (json['reward'] as num).toDouble(),
        pulls: json['pulls'] as int,
      );
}

/// LinUCB model for contextual bandits
class LinUCBModel {
  final int dimension;
  final double alpha;
  List<List<double>> A; // A matrix (d x d)
  List<double> b; // b vector (d x 1)

  LinUCBModel({
    required this.dimension,
    this.alpha = 0.5,
  })  : A = List.generate(
            dimension, (_) => List.filled(dimension, 0.0, growable: false),
            growable: false),
        b = List.filled(dimension, 0.0, growable: false) {
    // Initialize A as identity matrix
    for (int i = 0; i < dimension; i++) {
      A[i][i] = 1.0;
    }
  }

  Map<String, dynamic> toJson() => {
        'dimension': dimension,
        'alpha': alpha,
        'A': A,
        'b': b,
      };

  factory LinUCBModel.fromJson(Map<String, dynamic> json) {
    final model = LinUCBModel(
      dimension: json['dimension'] as int,
      alpha: (json['alpha'] as num).toDouble(),
    );
    model.A = (json['A'] as List)
        .map((row) => (row as List).map((v) => (v as num).toDouble()).toList())
        .toList();
    model.b =
        (json['b'] as List).map((v) => (v as num).toDouble()).toList();
    return model;
  }
}

/// Recommendation with explanation
class Recommendation {
  final String itemId;
  final String itemType;
  final double score;
  final double confidence;
  final Map<String, double> featureContributions;
  final ExplanationType explanationType;
  final String explanation;
  final Map<String, dynamic> metadata;
  final DateTime generatedAt;

  Recommendation({
    required this.itemId,
    required this.itemType,
    required this.score,
    required this.confidence,
    required this.featureContributions,
    required this.explanationType,
    required this.explanation,
    required this.metadata,
    required this.generatedAt,
  });

  Map<String, dynamic> toJson() => {
        'itemId': itemId,
        'itemType': itemType,
        'score': score,
        'confidence': confidence,
        'featureContributions': featureContributions,
        'explanationType': explanationType.toString(),
        'explanation': explanation,
        'metadata': metadata,
        'generatedAt': generatedAt.toIso8601String(),
      };

  factory Recommendation.fromJson(Map<String, dynamic> json) => Recommendation(
        itemId: json['itemId'] as String,
        itemType: json['itemType'] as String,
        score: (json['score'] as num).toDouble(),
        confidence: (json['confidence'] as num).toDouble(),
        featureContributions:
            Map<String, double>.from(json['featureContributions'] as Map),
        explanationType: ExplanationType.values.firstWhere(
          (e) => e.toString() == json['explanationType'],
          orElse: () => ExplanationType.personalized,
        ),
        explanation: json['explanation'] as String,
        metadata: json['metadata'] as Map<String, dynamic>,
        generatedAt: DateTime.parse(json['generatedAt'] as String),
      );
}

/// Interaction history record
class InteractionRecord {
  final String userId;
  final String itemId;
  final String itemType;
  final String actionType; // view, like, share, skip, etc.
  final double reward; // 1.0 for positive, -1.0 for negative, 0.0 for neutral
  final Map<String, double> contextFeatures;
  final DateTime timestamp;

  InteractionRecord({
    required this.userId,
    required this.itemId,
    required this.itemType,
    required this.actionType,
    required this.reward,
    required this.contextFeatures,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'itemId': itemId,
        'itemType': itemType,
        'actionType': actionType,
        'reward': reward,
        'contextFeatures': contextFeatures,
        'timestamp': timestamp.toIso8601String(),
      };

  factory InteractionRecord.fromJson(Map<String, dynamic> json) =>
      InteractionRecord(
        userId: json['userId'] as String,
        itemId: json['itemId'] as String,
        itemType: json['itemType'] as String,
        actionType: json['actionType'] as String,
        reward: (json['reward'] as num).toDouble(),
        contextFeatures:
            Map<String, double>.from(json['contextFeatures'] as Map),
        timestamp: DateTime.parse(json['timestamp'] as String),
      );
}

/// Privacy settings
class PrivacySettings {
  final PrivacyLevel level;
  final bool allowDataCollection;
  final bool allowPersonalization;
  final bool allowCrossDev iceMerge;
  final bool allowFederatedLearning;
  final int dataRetentionDays;
  final bool encryptLocalData;
  final Set<PreferenceCategory> disabledCategories;

  PrivacySettings({
    this.level = PrivacyLevel.balanced,
    this.allowDataCollection = true,
    this.allowPersonalization = true,
    this.allowCrossDeviceMerge = true,
    this.allowFederatedLearning = false,
    this.dataRetentionDays = 90,
    this.encryptLocalData = true,
    this.disabledCategories = const {},
  });

  Map<String, dynamic> toJson() => {
        'level': level.toString(),
        'allowDataCollection': allowDataCollection,
        'allowPersonalization': allowPersonalization,
        'allowCrossDeviceMerge': allowCrossDeviceMerge,
        'allowFederatedLearning': allowFederatedLearning,
        'dataRetentionDays': dataRetentionDays,
        'encryptLocalData': encryptLocalData,
        'disabledCategories':
            disabledCategories.map((c) => c.toString()).toList(),
      };

  factory PrivacySettings.fromJson(Map<String, dynamic> json) =>
      PrivacySettings(
        level: PrivacyLevel.values.firstWhere(
          (e) => e.toString() == json['level'],
          orElse: () => PrivacyLevel.balanced,
        ),
        allowDataCollection: json['allowDataCollection'] as bool,
        allowPersonalization: json['allowPersonalization'] as bool,
        allowCrossDeviceMerge: json['allowCrossDeviceMerge'] as bool,
        allowFederatedLearning: json['allowFederatedLearning'] as bool,
        dataRetentionDays: json['dataRetentionDays'] as int,
        encryptLocalData: json['encryptLocalData'] as bool,
        disabledCategories: (json['disabledCategories'] as List)
            .map((s) => PreferenceCategory.values
                .firstWhere((e) => e.toString() == s))
            .toSet(),
      );

  /// Create privacy settings for each level
  factory PrivacySettings.minimal() => PrivacySettings(
        level: PrivacyLevel.minimal,
        allowDataCollection: true,
        allowPersonalization: true,
        allowCrossDeviceMerge: true,
        allowFederatedLearning: true,
        dataRetentionDays: 365,
        encryptLocalData: false,
      );

  factory PrivacySettings.strict() => PrivacySettings(
        level: PrivacyLevel.strict,
        allowDataCollection: false,
        allowPersonalization: false,
        allowCrossDeviceMerge: false,
        allowFederatedLearning: false,
        dataRetentionDays: 7,
        encryptLocalData: true,
      );
}

/// Universal personalization engine with federated learning
class UniversalPersonalization {
  static const String _dbName = 'universal_personalization.db';
  static const int _dbVersion = 1;

  Database? _database;
  SharedPreferences? _prefs;

  // User profile
  UserProfile? _userProfile;

  // LinUCB models for contextual bandits
  final Map<String, LinUCBModel> _banditModels = {};

  // Privacy settings
  PrivacySettings _privacySettings = PrivacySettings();

  // Encryption
  encrypt_pkg.Key? _encryptionKey;
  encrypt_pkg.Encrypter? _encrypter;

  // Callbacks
  Function(UserProfile)? onProfileUpdated;
  Function(Recommendation)? onRecommendationGenerated;
  Function(String)? onError;

  /// Initialize personalization engine
  Future<void> initialize() async {
    try {
      debugPrint('[UniversalPersonalization] Initializing...');

      // Initialize shared preferences
      _prefs = await SharedPreferences.getInstance();

      // Initialize database
      await _initializeDatabase();

      // Load privacy settings
      await _loadPrivacySettings();

      // Initialize encryption if enabled
      if (_privacySettings.encryptLocalData) {
        await _initializeEncryption();
      }

      // Load or create user profile
      await _loadUserProfile();

      // Load bandit models
      await _loadBanditModels();

      // Clean up old data based on retention policy
      await _cleanupOldData();

      debugPrint('[UniversalPersonalization] Initialized successfully');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Initialization error: $e');
      onError?.call('Failed to initialize personalization: $e');
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
        // User profiles table
        await db.execute('''
          CREATE TABLE user_profiles (
            user_id TEXT PRIMARY KEY,
            profile_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            last_updated INTEGER NOT NULL
          )
        ''');

        // Interaction history table
        await db.execute('''
          CREATE TABLE interaction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            item_type TEXT NOT NULL,
            action_type TEXT NOT NULL,
            reward REAL NOT NULL,
            context_features TEXT NOT NULL,
            timestamp INTEGER NOT NULL
          )
        ''');

        // Create index for faster queries
        await db.execute('''
          CREATE INDEX idx_interactions_user_time
          ON interaction_history(user_id, timestamp DESC)
        ''');

        // Bandit models table
        await db.execute('''
          CREATE TABLE bandit_models (
            model_id TEXT PRIMARY KEY,
            model_data TEXT NOT NULL,
            last_updated INTEGER NOT NULL
          )
        ''');

        // Device profiles for cross-device merging
        await db.execute('''
          CREATE TABLE device_profiles (
            device_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            profile_data TEXT NOT NULL,
            last_synced INTEGER NOT NULL
          )
        ''');

        debugPrint('[UniversalPersonalization] Database created');
      },
    );
  }

  /// Initialize encryption
  Future<void> _initializeEncryption() async {
    try {
      // Try to load existing key
      final keyString = _prefs?.getString('encryption_key');

      if (keyString != null) {
        _encryptionKey = encrypt_pkg.Key.fromBase64(keyString);
      } else {
        // Generate new key
        final random = Random.secure();
        final keyBytes = List<int>.generate(32, (_) => random.nextInt(256));
        _encryptionKey = encrypt_pkg.Key(Uint8List.fromList(keyBytes));

        // Save key
        await _prefs?.setString(
          'encryption_key',
          _encryptionKey!.base64,
        );
      }

      _encrypter = encrypt_pkg.Encrypter(
        encrypt_pkg.AES(_encryptionKey!, mode: encrypt_pkg.AESMode.gcm),
      );

      debugPrint('[UniversalPersonalization] Encryption initialized');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Encryption init error: $e');
      rethrow;
    }
  }

  /// Load privacy settings
  Future<void> _loadPrivacySettings() async {
    try {
      final settingsJson = _prefs?.getString('privacy_settings');
      if (settingsJson != null) {
        _privacySettings =
            PrivacySettings.fromJson(jsonDecode(settingsJson) as Map<String, dynamic>);
      }
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error loading privacy settings: $e');
    }
  }

  /// Save privacy settings
  Future<void> updatePrivacySettings(PrivacySettings settings) async {
    try {
      _privacySettings = settings;
      await _prefs?.setString(
        'privacy_settings',
        jsonEncode(settings.toJson()),
      );

      // Re-initialize encryption if setting changed
      if (settings.encryptLocalData && _encrypter == null) {
        await _initializeEncryption();
      }

      // Clean up if retention period changed
      await _cleanupOldData();

      debugPrint('[UniversalPersonalization] Privacy settings updated');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error updating privacy: $e');
      onError?.call('Failed to update privacy settings: $e');
    }
  }

  /// Load user profile
  Future<void> _loadUserProfile() async {
    try {
      final userId = _prefs?.getString('current_user_id') ?? 'anonymous';

      final List<Map<String, dynamic>> results = await _database!.query(
        'user_profiles',
        where: 'user_id = ?',
        whereArgs: [userId],
      );

      if (results.isNotEmpty) {
        final profileData = results.first['profile_data'] as String;
        final decrypted = _decrypt(profileData);
        _userProfile = UserProfile.fromJson(jsonDecode(decrypted) as Map<String, dynamic>);

        // Update cold start status based on interaction count
        if (_userProfile!.interactionCount >= 20) {
          _userProfile = UserProfile(
            userId: _userProfile!.userId,
            preferences: _userProfile!.preferences,
            behaviorPatterns: _userProfile!.behaviorPatterns,
            context: _userProfile!.context,
            demographics: _userProfile!.demographics,
            createdAt: _userProfile!.createdAt,
            lastUpdated: _userProfile!.lastUpdated,
            interactionCount: _userProfile!.interactionCount,
            isColdStart: false,
          );
        }
      } else {
        // Create new profile
        _userProfile = UserProfile.empty(userId);
        await _saveUserProfile();
      }

      debugPrint(
          '[UniversalPersonalization] User profile loaded (coldStart: ${_userProfile!.isColdStart})');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error loading profile: $e');
      // Create fallback profile
      _userProfile =
          UserProfile.empty(_prefs?.getString('current_user_id') ?? 'anonymous');
    }
  }

  /// Save user profile
  Future<void> _saveUserProfile() async {
    if (_userProfile == null || !_privacySettings.allowDataCollection) return;

    try {
      final profileJson = jsonEncode(_userProfile!.toJson());
      final encrypted = _encrypt(profileJson);

      await _database!.insert(
        'user_profiles',
        {
          'user_id': _userProfile!.userId,
          'profile_data': encrypted,
          'created_at': _userProfile!.createdAt.millisecondsSinceEpoch,
          'last_updated': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      onProfileUpdated?.call(_userProfile!);
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error saving profile: $e');
    }
  }

  /// Load bandit models
  Future<void> _loadBanditModels() async {
    try {
      final List<Map<String, dynamic>> results =
          await _database!.query('bandit_models');

      for (final row in results) {
        final modelId = row['model_id'] as String;
        final modelData = row['model_data'] as String;
        final decrypted = _decrypt(modelData);
        final model = LinUCBModel.fromJson(jsonDecode(decrypted) as Map<String, dynamic>);
        _banditModels[modelId] = model;
      }

      debugPrint(
          '[UniversalPersonalization] Loaded ${_banditModels.length} bandit models');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error loading models: $e');
    }
  }

  /// Save bandit model
  Future<void> _saveBanditModel(String modelId, LinUCBModel model) async {
    try {
      final modelJson = jsonEncode(model.toJson());
      final encrypted = _encrypt(modelJson);

      await _database!.insert(
        'bandit_models',
        {
          'model_id': modelId,
          'model_data': encrypted,
          'last_updated': DateTime.now().millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error saving model: $e');
    }
  }

  /// LinUCB: Select best arm given context
  Future<Recommendation> selectArm({
    required List<BanditArm> arms,
    required Map<String, double> contextFeatures,
    String modelId = 'default',
  }) async {
    try {
      // Get or create model
      LinUCBModel model = _banditModels[modelId] ??
          LinUCBModel(dimension: contextFeatures.length);

      double bestUCB = double.negativeInfinity;
      BanditArm? bestArm;

      for (final arm in arms) {
        // Combine context and arm features
        final features = _combineFeatures(contextFeatures, arm.features);
        final featureVector = _featureMapToVector(features, model.dimension);

        // Calculate UCB score
        final ucb = _calculateLinUCB(model, featureVector);

        if (ucb > bestUCB) {
          bestUCB = ucb;
          bestArm = arm;
        }
      }

      if (bestArm == null) {
        throw Exception('No arm selected');
      }

      // Generate explanation
      final explanation = _generateExplanation(
        bestArm,
        contextFeatures,
        bestUCB,
      );

      final recommendation = Recommendation(
        itemId: bestArm.itemId,
        itemType: 'content',
        score: bestUCB,
        confidence: _calculateConfidence(bestArm.pulls),
        featureContributions: bestArm.features,
        explanationType: ExplanationType.contextual,
        explanation: explanation,
        metadata: {
          'armId': bestArm.armId,
          'modelId': modelId,
          'contextFeatures': contextFeatures,
        },
        generatedAt: DateTime.now(),
      );

      onRecommendationGenerated?.call(recommendation);
      return recommendation;
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error selecting arm: $e');
      rethrow;
    }
  }

  /// Calculate LinUCB score with ridge regression
  double _calculateLinUCB(LinUCBModel model, List<double> x) {
    try {
      // Compute A^-1 using Gaussian elimination
      final AInv = _invertMatrix(model.A);

      // Compute theta = A^-1 * b
      final theta = _matrixVectorMultiply(AInv, model.b);

      // Compute prediction: x^T * theta
      final prediction = _dotProduct(x, theta);

      // Compute confidence bonus: alpha * sqrt(x^T * A^-1 * x)
      final AInvX = _matrixVectorMultiply(AInv, x);
      final xAInvX = _dotProduct(x, AInvX);
      final confidenceBonus = model.alpha * sqrt(max(0, xAInvX));

      // UCB = prediction + confidence bonus
      return prediction + confidenceBonus;
    } catch (e) {
      debugPrint('[UniversalPersonalization] LinUCB calculation error: $e');
      return 0.0;
    }
  }

  /// Update LinUCB model with observed reward
  Future<void> updateModel({
    required String modelId,
    required BanditArm arm,
    required Map<String, double> contextFeatures,
    required double reward,
  }) async {
    try {
      // Get or create model
      LinUCBModel model = _banditModels[modelId] ??
          LinUCBModel(dimension: contextFeatures.length);

      // Combine features
      final features = _combineFeatures(contextFeatures, arm.features);
      final x = _featureMapToVector(features, model.dimension);

      // Update A = A + x * x^T
      for (int i = 0; i < model.dimension; i++) {
        for (int j = 0; j < model.dimension; j++) {
          model.A[i][j] += x[i] * x[j];
        }
      }

      // Update b = b + reward * x
      for (int i = 0; i < model.dimension; i++) {
        model.b[i] += reward * x[i];
      }

      // Save updated model
      _banditModels[modelId] = model;
      await _saveBanditModel(modelId, model);

      // Record interaction
      await _recordInteraction(
        arm.itemId,
        'bandit_selection',
        reward,
        contextFeatures,
      );

      debugPrint(
          '[UniversalPersonalization] Model updated (reward: $reward)');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error updating model: $e');
    }
  }

  /// Record user interaction
  Future<void> _recordInteraction(
    String itemId,
    String actionType,
    double reward,
    Map<String, double> contextFeatures,
  ) async {
    if (!_privacySettings.allowDataCollection) return;

    try {
      await _database!.insert('interaction_history', {
        'user_id': _userProfile!.userId,
        'item_id': itemId,
        'item_type': 'content',
        'action_type': actionType,
        'reward': reward,
        'context_features': jsonEncode(contextFeatures),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });

      // Update profile interaction count
      _userProfile = UserProfile(
        userId: _userProfile!.userId,
        preferences: _userProfile!.preferences,
        behaviorPatterns: _userProfile!.behaviorPatterns,
        context: _userProfile!.context,
        demographics: _userProfile!.demographics,
        createdAt: _userProfile!.createdAt,
        lastUpdated: DateTime.now(),
        interactionCount: _userProfile!.interactionCount + 1,
        isColdStart: _userProfile!.interactionCount + 1 < 20,
      );

      await _saveUserProfile();
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error recording interaction: $e');
    }
  }

  /// Extract features for cold start users
  Map<String, double> extractColdStartFeatures({
    required Map<String, String> demographics,
    required Map<String, double> initialInteractions,
  }) {
    final features = <String, double>{};

    // Demographic features
    if (demographics.containsKey('age')) {
      final age = double.tryParse(demographics['age']!) ?? 25.0;
      features['age_normalized'] = age / 100.0; // Normalize to 0-1
    }

    if (demographics.containsKey('gender')) {
      features['gender_male'] = demographics['gender'] == 'male' ? 1.0 : 0.0;
      features['gender_female'] = demographics['gender'] == 'female' ? 1.0 : 0.0;
    }

    if (demographics.containsKey('location')) {
      // Simple location encoding (could be expanded)
      features['has_location'] = 1.0;
    }

    // Initial interaction features
    features.addAll(initialInteractions);

    // Popularity bias for cold start
    features['cold_start_bonus'] = 0.5;

    return features;
  }

  /// Merge profiles from multiple devices
  Future<UserProfile> mergeDeviceProfiles(
    List<Map<String, dynamic>> deviceProfilesData,
  ) async {
    if (!_privacySettings.allowCrossDeviceMerge) {
      return _userProfile ?? UserProfile.empty('anonymous');
    }

    try {
      final mergedPreferences = <String, double>{};
      final mergedBehaviors = <String, double>{};
      final mergedContext = <String, dynamic>{};
      final mergedDemographics = <String, String>{};

      int totalInteractions = 0;
      DateTime? earliestCreated;
      DateTime? latestUpdated;

      for (final profileData in deviceProfilesData) {
        final profile = UserProfile.fromJson(profileData);

        // Merge preferences (weighted average)
        for (final entry in profile.preferences.entries) {
          mergedPreferences[entry.key] =
              (mergedPreferences[entry.key] ?? 0.0) + entry.value;
        }

        // Merge behaviors (sum frequencies)
        for (final entry in profile.behaviorPatterns.entries) {
          mergedBehaviors[entry.key] =
              (mergedBehaviors[entry.key] ?? 0.0) + entry.value;
        }

        // Merge context (keep most recent)
        mergedContext.addAll(profile.context);

        // Merge demographics (keep non-null values)
        mergedDemographics.addAll(profile.demographics);

        totalInteractions += profile.interactionCount;

        if (earliestCreated == null ||
            profile.createdAt.isBefore(earliestCreated)) {
          earliestCreated = profile.createdAt;
        }

        if (latestUpdated == null ||
            profile.lastUpdated.isAfter(latestUpdated)) {
          latestUpdated = profile.lastUpdated;
        }
      }

      // Average preferences
      final profileCount = deviceProfilesData.length.toDouble();
      mergedPreferences.updateAll((key, value) => value / profileCount);

      return UserProfile(
        userId: _userProfile?.userId ?? 'anonymous',
        preferences: mergedPreferences,
        behaviorPatterns: mergedBehaviors,
        context: mergedContext,
        demographics: mergedDemographics,
        createdAt: earliestCreated ?? DateTime.now(),
        lastUpdated: latestUpdated ?? DateTime.now(),
        interactionCount: totalInteractions,
        isColdStart: totalInteractions < 20,
      );
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error merging profiles: $e');
      return _userProfile ?? UserProfile.empty('anonymous');
    }
  }

  /// Generate explanation for recommendation
  String _generateExplanation(
    BanditArm arm,
    Map<String, double> contextFeatures,
    double score,
  ) {
    final reasons = <String>[];

    // Find top contributing features
    final sortedFeatures = arm.features.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final topFeatures = sortedFeatures.take(3);

    for (final feature in topFeatures) {
      final featureName = feature.key.replaceAll('_', ' ');
      final contribution = (feature.value * 100).toStringAsFixed(0);
      reasons.add('$featureName ($contribution%)');
    }

    if (reasons.isEmpty) {
      return 'Recommended based on your profile';
    }

    return 'Recommended because of: ${reasons.join(', ')}';
  }

  /// Calculate confidence based on number of observations
  double _calculateConfidence(int pulls) {
    // Use sigmoid function to map pulls to confidence
    // Confidence approaches 1.0 as pulls increase
    return 1.0 - exp(-pulls / 10.0);
  }

  /// Combine context and arm features
  Map<String, double> _combineFeatures(
    Map<String, double> context,
    Map<String, double> armFeatures,
  ) {
    final combined = <String, double>{};
    combined.addAll(context);

    for (final entry in armFeatures.entries) {
      combined['arm_${entry.key}'] = entry.value;
    }

    return combined;
  }

  /// Convert feature map to vector
  List<double> _featureMapToVector(
    Map<String, double> features,
    int dimension,
  ) {
    final vector = List<double>.filled(dimension, 0.0, growable: false);
    final keys = features.keys.toList()..sort();

    for (int i = 0; i < min(dimension, keys.length); i++) {
      vector[i] = features[keys[i]] ?? 0.0;
    }

    return vector;
  }

  /// Matrix inversion using Gaussian elimination
  List<List<double>> _invertMatrix(List<List<double>> matrix) {
    final n = matrix.length;
    final augmented = List.generate(
      n,
      (i) => [...matrix[i], ...List.filled(n, 0.0, growable: false)],
      growable: false,
    );

    // Create identity matrix on the right side
    for (int i = 0; i < n; i++) {
      augmented[i][n + i] = 1.0;
    }

    // Forward elimination
    for (int i = 0; i < n; i++) {
      // Find pivot
      double maxVal = augmented[i][i].abs();
      int maxRow = i;
      for (int k = i + 1; k < n; k++) {
        if (augmented[k][i].abs() > maxVal) {
          maxVal = augmented[k][i].abs();
          maxRow = k;
        }
      }

      // Swap rows
      if (maxRow != i) {
        final temp = augmented[i];
        augmented[i] = augmented[maxRow];
        augmented[maxRow] = temp;
      }

      // Make diagonal 1
      final diagonal = augmented[i][i];
      if (diagonal.abs() < 1e-10) continue;

      for (int j = 0; j < 2 * n; j++) {
        augmented[i][j] /= diagonal;
      }

      // Eliminate column
      for (int k = 0; k < n; k++) {
        if (k != i) {
          final factor = augmented[k][i];
          for (int j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    // Extract inverse from right side
    return List.generate(
      n,
      (i) => augmented[i].sublist(n),
      growable: false,
    );
  }

  /// Matrix-vector multiplication
  List<double> _matrixVectorMultiply(
    List<List<double>> matrix,
    List<double> vector,
  ) {
    final result = List<double>.filled(matrix.length, 0.0, growable: false);

    for (int i = 0; i < matrix.length; i++) {
      for (int j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }

    return result;
  }

  /// Dot product
  double _dotProduct(List<double> a, List<double> b) {
    double sum = 0.0;
    for (int i = 0; i < min(a.length, b.length); i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /// Encrypt data
  String _encrypt(String data) {
    if (!_privacySettings.encryptLocalData || _encrypter == null) {
      return data;
    }

    try {
      final iv = encrypt_pkg.IV.fromSecureRandom(16);
      final encrypted = _encrypter!.encrypt(data, iv: iv);
      return '${iv.base64}:${encrypted.base64}';
    } catch (e) {
      debugPrint('[UniversalPersonalization] Encryption error: $e');
      return data;
    }
  }

  /// Decrypt data
  String _decrypt(String data) {
    if (!_privacySettings.encryptLocalData || _encrypter == null) {
      return data;
    }

    try {
      final parts = data.split(':');
      if (parts.length != 2) return data;

      final iv = encrypt_pkg.IV.fromBase64(parts[0]);
      final encrypted = encrypt_pkg.Encrypted.fromBase64(parts[1]);
      return _encrypter!.decrypt(encrypted, iv: iv);
    } catch (e) {
      debugPrint('[UniversalPersonalization] Decryption error: $e');
      return data;
    }
  }

  /// Clean up old data based on retention policy
  Future<void> _cleanupOldData() async {
    try {
      final cutoffDate = DateTime.now()
          .subtract(Duration(days: _privacySettings.dataRetentionDays));

      final deleted = await _database!.delete(
        'interaction_history',
        where: 'timestamp < ?',
        whereArgs: [cutoffDate.millisecondsSinceEpoch],
      );

      if (deleted > 0) {
        debugPrint(
            '[UniversalPersonalization] Cleaned up $deleted old interactions');
      }
    } catch (e) {
      debugPrint('[UniversalPersonalization] Cleanup error: $e');
    }
  }

  /// Get user profile
  UserProfile? get userProfile => _userProfile;

  /// Get privacy settings
  PrivacySettings get privacySettings => _privacySettings;

  /// Get interaction count
  Future<int> getInteractionCount() async {
    try {
      final result = await _database!.rawQuery(
        'SELECT COUNT(*) as count FROM interaction_history WHERE user_id = ?',
        [_userProfile?.userId ?? 'anonymous'],
      );
      return result.first['count'] as int;
    } catch (e) {
      return 0;
    }
  }

  /// Delete all user data
  Future<void> deleteAllUserData() async {
    try {
      if (_userProfile == null) return;

      await _database!.delete(
        'user_profiles',
        where: 'user_id = ?',
        whereArgs: [_userProfile!.userId],
      );

      await _database!.delete(
        'interaction_history',
        where: 'user_id = ?',
        whereArgs: [_userProfile!.userId],
      );

      await _database!.delete(
        'device_profiles',
        where: 'user_id = ?',
        whereArgs: [_userProfile!.userId],
      );

      _userProfile = UserProfile.empty(_userProfile!.userId);
      _banditModels.clear();

      debugPrint('[UniversalPersonalization] All user data deleted');
    } catch (e) {
      debugPrint('[UniversalPersonalization] Error deleting data: $e');
      onError?.call('Failed to delete user data: $e');
    }
  }

  /// Dispose resources
  Future<void> dispose() async {
    await _database?.close();
    _database = null;
    _prefs = null;
    _userProfile = null;
    _banditModels.clear();
  }
}
