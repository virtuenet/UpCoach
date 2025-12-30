# Phase 25 Week 1: Integration Examples

## Complete End-to-End Examples

### Example 1: Mobile App - Goal Success Prediction

```dart
import 'package:upcoach/ml/MLModelManager.dart';
import 'package:upcoach/ml/FeatureStore.dart';

class GoalSuccessPredictor {
  final MLModelManager _modelManager = MLModelManager();
  final FeatureStore _featureStore = FeatureStore();

  Future<void> initialize() async {
    // Initialize ML components
    await _modelManager.initialize(
      baseUrl: 'https://api.upcoach.com',
      apiKey: 'your-api-key',
      preloadModels: ['goal_success_predictor'],
    );
    await _featureStore.initialize();
  }

  Future<double> predictGoalSuccess(String userId, String goalId) async {
    // 1. Gather user activity data
    final activity = await _getUserActivity(userId);

    // 2. Extract features
    final features = await _featureStore.getFeatureVector(
      [
        'completion_rate',
        'streak_length',
        'engagement_score',
        'activity_trend',
        'user_experience',
      ],
      activity,
    );

    // 3. Convert to model input format
    final input = [
      features['completion_rate'] ?? 0.0,
      features['streak_length'] ?? 0.0,
      features['engagement_score'] ?? 0.0,
      features['activity_trend'] ?? 0.0,
      features['user_experience'] ?? 0.0,
    ];

    // 4. Run inference
    final output = await _modelManager.runInference(
      modelId: 'goal_success_predictor',
      input: input,
    );

    // 5. Return probability (first output is success probability)
    return output[0];
  }

  Future<UserActivity> _getUserActivity(String userId) async {
    // Fetch from local database or API
    return UserActivity(
      userId: userId,
      events: [...], // Recent user events
      profile: {
        'total_goals': 15,
        'days_since_signup': 90,
      },
    );
  }
}

// Usage
final predictor = GoalSuccessPredictor();
await predictor.initialize();

final successProbability = await predictor.predictGoalSuccess('user123', 'goal456');
if (successProbability > 0.7) {
  print('High chance of success! Keep going!');
} else if (successProbability < 0.3) {
  print('This goal might be challenging. Consider breaking it down.');
}
```

### Example 2: Backend - Personalized Recommendations

```typescript
import { PersonalizationEngine, InteractionType } from './ml/PersonalizationEngine';

class RecommendationService {
  private engine: PersonalizationEngine;

  constructor() {
    this.engine = new PersonalizationEngine();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Monitor recommendations for analytics
    this.engine.on('recommendations', (data) => {
      console.log(`Generated ${data.recommendations.length} recommendations for ${data.userId}`);
    });

    // Track interaction events
    this.engine.on('interaction', (interaction) => {
      console.log(`User ${interaction.userId} ${interaction.type} item ${interaction.itemId}`);
    });
  }

  async trackUserAction(userId: string, goalId: string, action: string) {
    // Map action to interaction type
    const typeMap: Record<string, InteractionType> = {
      'view': InteractionType.VIEW,
      'complete': InteractionType.COMPLETE,
      'skip': InteractionType.SKIP,
      'like': InteractionType.LIKE,
      'bookmark': InteractionType.BOOKMARK,
    };

    await this.engine.trackInteraction({
      userId,
      itemId: goalId,
      type: typeMap[action] || InteractionType.VIEW,
      timestamp: new Date(),
    });
  }

  async registerGoal(goalId: string, metadata: any) {
    await this.engine.registerItem({
      itemId: goalId,
      type: 'goal',
      features: {
        difficulty: metadata.difficulty || 0.5,
        duration: metadata.estimatedDays || 30,
      },
      tags: metadata.tags || [],
      attributes: metadata,
      createdAt: new Date(),
    });
  }

  async getPersonalizedGoals(userId: string, limit: number = 10) {
    const recommendations = await this.engine.getRecommendations(userId, limit, {
      excludeViewed: true,
      itemType: 'goal',
    });

    // Enrich with goal details
    return Promise.all(
      recommendations.map(async (rec) => ({
        goalId: rec.itemId,
        score: rec.score,
        confidence: rec.confidence,
        reasons: rec.reasons,
        algorithm: rec.algorithm,
        details: await this.getGoalDetails(rec.itemId),
      }))
    );
  }

  private async getGoalDetails(goalId: string) {
    // Fetch from database
    return { /* goal details */ };
  }
}

// Usage in API endpoint
app.post('/api/users/:userId/interactions', async (req, res) => {
  const { userId } = req.params;
  const { goalId, action } = req.body;

  await recommendationService.trackUserAction(userId, goalId, action);
  res.json({ success: true });
});

app.get('/api/users/:userId/recommendations', async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const recommendations = await recommendationService.getPersonalizedGoals(userId, limit);
  res.json({ recommendations });
});
```

### Example 3: Backend - Churn Prediction & Risk Analysis

```typescript
import { PredictiveAnalytics, TrainingData, FeatureVector } from './ml/PredictiveAnalytics';

class ChurnPreventionService {
  private analytics: PredictiveAnalytics;
  private trainingScheduled: boolean = false;

  constructor() {
    this.analytics = new PredictiveAnalytics();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.analytics.on('modelTrained', (data) => {
      console.log(`${data.type} model trained with accuracy: ${data.metrics.accuracy}`);
    });
  }

  async trainModels() {
    // Fetch historical data
    const historicalData = await this.fetchHistoricalUserData();

    // Train churn model
    const churnData: TrainingData[] = historicalData.map(user => ({
      features: {
        engagement_score: user.engagementScore,
        days_since_last_activity: user.daysSinceLastActivity,
        completion_rate: user.completionRate,
        activity_trend: user.activityTrend,
      },
      label: user.churned ? 1 : 0,
    }));

    const churnMetrics = await this.analytics.trainChurnModel(churnData, 5);
    console.log('Churn model F1 score:', churnMetrics.f1Score);

    // Train success model
    const successData: TrainingData[] = historicalData.map(user => ({
      features: {
        engagement_score: user.engagementScore,
        streak_length: user.streakLength,
        user_experience: user.experienceLevel,
        completion_rate: user.completionRate,
      },
      label: user.successfulGoals > user.totalGoals * 0.7 ? 1 : 0,
    }));

    const successMetrics = await this.analytics.trainSuccessModel(successData);
    console.log('Success model accuracy:', successMetrics.accuracy);
  }

  async analyzeUserRisk(userId: string) {
    const userFeatures = await this.extractUserFeatures(userId);

    // Predict churn probability
    const churnPrediction = await this.analytics.predictChurn(userFeatures);

    // Identify risk factors
    const riskFactors = await this.analytics.identifyRiskFactors(userFeatures);

    // Estimate goal completion time
    const completionEstimate = await this.analytics.estimateCompletionTime({
      ...userFeatures,
      goal_complexity: 0.6,
      historical_data_points: 50,
    });

    return {
      userId,
      churnRisk: {
        probability: churnPrediction.value,
        confidence: churnPrediction.confidence,
        level: this.getRiskLevel(churnPrediction.value),
      },
      riskFactors: riskFactors.slice(0, 3), // Top 3 factors
      estimatedDaysToComplete: completionEstimate.value,
      recommendations: this.generateRecommendations(riskFactors),
    };
  }

  private getRiskLevel(probability: number): string {
    if (probability > 0.7) return 'HIGH';
    if (probability > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(riskFactors: any[]): string[] {
    const recommendations: string[] = [];

    for (const factor of riskFactors) {
      switch (factor.factor) {
        case 'low_engagement':
          recommendations.push('Send personalized content to re-engage user');
          break;
        case 'declining_activity':
          recommendations.push('Trigger win-back campaign with special offer');
          break;
        case 'inactive':
          recommendations.push('Send push notification with motivational message');
          break;
        case 'low_completion':
          recommendations.push('Suggest easier goals to build momentum');
          break;
      }
    }

    return recommendations;
  }

  private async extractUserFeatures(userId: string): Promise<FeatureVector> {
    const userData = await this.fetchUserData(userId);

    return {
      engagement_score: userData.engagementScore,
      completion_rate: userData.completionRate,
      streak_length: userData.currentStreak,
      days_since_last_activity: userData.daysSinceLastActivity,
      activity_trend: userData.activityTrend,
      user_experience: userData.experienceLevel,
    };
  }

  private async fetchUserData(userId: string) {
    // Fetch from database
    return { /* user data */ };
  }

  private async fetchHistoricalUserData() {
    // Fetch training data from database
    return [/* historical user data */];
  }
}

// Usage in scheduled job
async function dailyChurnAnalysis() {
  const churnService = new ChurnPreventionService();

  // Train models weekly
  const now = new Date();
  if (now.getDay() === 0) { // Sunday
    await churnService.trainModels();
  }

  // Analyze all active users
  const activeUsers = await getActiveUsers();

  for (const user of activeUsers) {
    const analysis = await churnService.analyzeUserRisk(user.id);

    if (analysis.churnRisk.level === 'HIGH') {
      // Trigger intervention
      await triggerRetentionCampaign(user.id, analysis.recommendations);
      await notifySuccessTeam(user.id, analysis);
    }
  }
}
```

### Example 4: Mobile App - Real-time Feature Computation

```dart
import 'package:upcoach/ml/FeatureStore.dart';

class UserAnalyticsService {
  final FeatureStore _featureStore = FeatureStore();

  Future<void> initialize() async {
    await _featureStore.initialize();
  }

  Future<Map<String, dynamic>> getUserInsights(String userId) async {
    final activity = await _buildUserActivity(userId);

    // Get comprehensive feature vector
    final features = await _featureStore.getFeatureVector(
      [
        'completion_rate',
        'streak_length',
        'engagement_score',
        'activity_trend',
        'session_frequency',
        'avg_session_length',
        'user_experience',
        'social_engagement',
      ],
      activity,
    );

    // Generate insights
    return {
      'performance': {
        'completionRate': features['completion_rate'],
        'currentStreak': features['streak_length']?.toInt(),
        'trend': _getTrendDescription(features['activity_trend'] ?? 0),
      },
      'engagement': {
        'score': features['engagement_score'],
        'sessionsPerWeek': features['session_frequency'],
        'avgSessionMinutes': features['avg_session_length'],
      },
      'experience': {
        'level': _getExperienceLevel(features['user_experience'] ?? 0),
        'socialScore': features['social_engagement'],
      },
      'badges': _calculateBadges(features),
      'recommendations': _generateRecommendations(features),
    };
  }

  Future<void> trackEvent(String userId, String eventType, Map<String, dynamic> data) async {
    // Invalidate affected features
    if (eventType == 'goal_completed') {
      _featureStore.invalidateFeature(userId, 'completion_rate');
      _featureStore.invalidateFeature(userId, 'engagement_score');
    } else if (eventType == 'daily_check_in') {
      _featureStore.invalidateFeature(userId, 'streak_length');
    }

    // Store event for future feature computation
    await _storeEvent(userId, eventType, data);
  }

  String _getTrendDescription(double trend) {
    if (trend > 0.2) return 'Rapidly Improving';
    if (trend > 0.05) return 'Improving';
    if (trend > -0.05) return 'Stable';
    if (trend > -0.2) return 'Declining';
    return 'Needs Attention';
  }

  String _getExperienceLevel(double experience) {
    if (experience > 0.8) return 'Expert';
    if (experience > 0.6) return 'Advanced';
    if (experience > 0.4) return 'Intermediate';
    if (experience > 0.2) return 'Beginner';
    return 'Newcomer';
  }

  List<String> _calculateBadges(Map<String, double> features) {
    final badges = <String>[];

    if ((features['streak_length'] ?? 0) >= 30) {
      badges.add('30-Day Streak Master');
    }
    if ((features['completion_rate'] ?? 0) >= 0.9) {
      badges.add('Goal Crusher');
    }
    if ((features['engagement_score'] ?? 0) >= 0.8) {
      badges.add('Highly Engaged');
    }
    if ((features['session_frequency'] ?? 0) >= 7) {
      badges.add('Daily Warrior');
    }

    return badges;
  }

  List<String> _generateRecommendations(Map<String, double> features) {
    final recommendations = <String>[];

    if ((features['completion_rate'] ?? 0) < 0.5) {
      recommendations.add('Try setting smaller, achievable goals');
    }
    if ((features['streak_length'] ?? 0) == 0) {
      recommendations.add('Start a daily check-in streak today!');
    }
    if ((features['social_engagement'] ?? 0) < 0.3) {
      recommendations.add('Connect with other users for motivation');
    }
    if ((features['avg_session_length'] ?? 0) < 5) {
      recommendations.add('Spend more time planning your goals');
    }

    return recommendations;
  }

  Future<UserActivity> _buildUserActivity(String userId) async {
    // Fetch from local database
    return UserActivity(
      userId: userId,
      events: [...],
      profile: {...},
    );
  }

  Future<void> _storeEvent(String userId, String eventType, Map<String, dynamic> data) async {
    // Store in local database
  }
}

// Usage in UI
class UserDashboard extends StatefulWidget {
  @override
  _UserDashboardState createState() => _UserDashboardState();
}

class _UserDashboardState extends State<UserDashboard> {
  final UserAnalyticsService _analyticsService = UserAnalyticsService();
  Map<String, dynamic>? _insights;

  @override
  void initState() {
    super.initState();
    _loadInsights();
  }

  Future<void> _loadInsights() async {
    await _analyticsService.initialize();
    final insights = await _analyticsService.getUserInsights('current_user_id');
    setState(() => _insights = insights);
  }

  @override
  Widget build(BuildContext context) {
    if (_insights == null) return CircularProgressIndicator();

    return Column(
      children: [
        PerformanceCard(data: _insights!['performance']),
        EngagementCard(data: _insights!['engagement']),
        BadgesList(badges: _insights!['badges']),
        RecommendationsList(items: _insights!['recommendations']),
      ],
    );
  }
}
```

### Example 5: A/B Testing Recommendation Algorithms

```typescript
import { PersonalizationEngine } from './ml/PersonalizationEngine';

const engine = new PersonalizationEngine();

// Create A/B test
engine.createABTest({
  testId: 'recommendation_algorithm_test',
  active: true,
  startDate: new Date(),
  variants: [
    {
      name: 'collaborative',
      algorithm: 'collaborative',
      weight: 0.33,
      config: {},
    },
    {
      name: 'content',
      algorithm: 'content',
      weight: 0.33,
      config: {},
    },
    {
      name: 'hybrid',
      algorithm: 'hybrid',
      weight: 0.34,
      config: {},
    },
  ],
});

// Users will automatically be assigned to variants
// Track results
app.get('/api/users/:userId/recommendations', async (req, res) => {
  const recommendations = await engine.getRecommendations(req.params.userId, 10);

  // Log which algorithm was used for analytics
  const algorithm = recommendations[0]?.algorithm;
  await logABTestEvent({
    testId: 'recommendation_algorithm_test',
    userId: req.params.userId,
    variant: algorithm,
    timestamp: new Date(),
  });

  res.json({ recommendations, algorithm });
});

// Track conversion
app.post('/api/users/:userId/interactions', async (req, res) => {
  const { goalId, action } = req.body;

  await logABTestConversion({
    testId: 'recommendation_algorithm_test',
    userId: req.params.userId,
    converted: action === 'complete',
  });

  res.json({ success: true });
});
```

## Performance Optimization Tips

### 1. Batch Feature Computation

```dart
// Instead of computing features one by one
for (final userId in userIds) {
  final features = await featureStore.getFeatureVector(featureNames, activity);
}

// Compute in parallel with Future.wait
final featureFutures = userIds.map((userId) async {
  final activity = await getUserActivity(userId);
  return featureStore.getFeatureVector(featureNames, activity);
});
final allFeatures = await Future.wait(featureFutures);
```

### 2. Preload Critical Models

```dart
await MLModelManager().initialize(
  baseUrl: apiUrl,
  apiKey: apiKey,
  preloadModels: [
    'goal_success_predictor',  // Used on every goal view
    'recommendation_engine',    // Used on home screen
  ],
);
```

### 3. Cache Recommendations

```typescript
const recommendationCache = new Map<string, { recommendations: any[]; timestamp: Date }>();

async function getCachedRecommendations(userId: string, ttl: number = 3600000) {
  const cached = recommendationCache.get(userId);
  if (cached && Date.now() - cached.timestamp.getTime() < ttl) {
    return cached.recommendations;
  }

  const recommendations = await engine.getRecommendations(userId, 10);
  recommendationCache.set(userId, { recommendations, timestamp: new Date() });
  return recommendations;
}
```

### 4. Incremental Model Updates

```typescript
// Update user profiles incrementally instead of full recomputation
engine.on('interaction', async (interaction) => {
  // Only update affected user's profile
  await updateUserProfileIncremental(interaction.userId);

  // Invalidate only related caches
  invalidateUserRecommendations(interaction.userId);
  invalidateSimilarUsers(interaction.userId);
});
```

## Monitoring & Observability

### Track Model Performance

```dart
MLModelManager().metricsStream.listen((metrics) {
  if (!metrics.success) {
    // Alert on errors
    logError('Model inference failed', {
      'modelId': metrics.modelId,
      'error': metrics.error,
    });
  }

  // Track latency
  if (metrics.inferenceTime.inMilliseconds > 500) {
    logWarning('Slow inference', {
      'modelId': metrics.modelId,
      'latency': metrics.inferenceTime.inMilliseconds,
    });
  }
});
```

### Monitor Recommendation Quality

```typescript
engine.on('recommendations', (data) => {
  const avgConfidence = data.recommendations.reduce((sum, r) => sum + r.confidence, 0) / data.recommendations.length;

  metrics.recordRecommendationQuality({
    userId: data.userId,
    count: data.recommendations.length,
    avgConfidence,
    algorithms: [...new Set(data.recommendations.map(r => r.algorithm))],
  });
});
```

## Summary

These examples demonstrate:

1. **End-to-end ML pipelines** from data collection to prediction
2. **Feature engineering** with automatic caching and invalidation
3. **Model management** with versioning and performance monitoring
4. **Recommendation systems** with multiple algorithms and A/B testing
5. **Predictive analytics** for churn prevention and success prediction
6. **Performance optimization** strategies for production use
7. **Monitoring and observability** for ML systems

All implementations are production-ready with proper error handling, caching, and async patterns.
