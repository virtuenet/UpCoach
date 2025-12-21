// Test fixtures for UpCoach Mobile App
//
// Provides sample data for testing

/// Sample user data for testing
class UserFixtures {
  static Map<String, dynamic> get sampleUser => {
        'id': 'user-123',
        'email': 'test@upcoach.app',
        'displayName': 'Test User',
        'photoUrl': 'https://example.com/photo.jpg',
        'createdAt': '2025-01-01T00:00:00.000Z',
        'updatedAt': '2025-01-15T10:00:00.000Z',
        'role': 'client',
        'coachId': 'coach-456',
      };

  static Map<String, dynamic> get sampleCoach => {
        'id': 'coach-456',
        'email': 'coach@upcoach.app',
        'displayName': 'Test Coach',
        'photoUrl': 'https://example.com/coach.jpg',
        'createdAt': '2024-06-01T00:00:00.000Z',
        'updatedAt': '2025-01-15T10:00:00.000Z',
        'role': 'coach',
        'specialty': 'Life Coaching',
        'bio': 'Experienced life coach helping clients achieve their goals.',
      };
}

/// Sample goal data for testing
class GoalFixtures {
  static Map<String, dynamic> get sampleGoal => {
        'id': 'goal-123',
        'userId': 'user-123',
        'title': 'Complete marathon training',
        'description': 'Train and complete a full marathon by end of year',
        'category': 'fitness',
        'status': 'active',
        'progress': 35,
        'targetDate': '2025-12-31T00:00:00.000Z',
        'createdAt': '2025-01-01T00:00:00.000Z',
        'updatedAt': '2025-01-15T10:00:00.000Z',
        'milestones': [
          {
            'id': 'milestone-1',
            'title': 'Complete 5K',
            'completed': true,
            'completedAt': '2025-01-10T10:00:00.000Z',
          },
          {
            'id': 'milestone-2',
            'title': 'Complete 10K',
            'completed': false,
          },
          {
            'id': 'milestone-3',
            'title': 'Complete half marathon',
            'completed': false,
          },
        ],
      };

  static List<Map<String, dynamic>> get sampleGoals => [
        sampleGoal,
        {
          'id': 'goal-124',
          'userId': 'user-123',
          'title': 'Learn Spanish',
          'description': 'Achieve conversational fluency in Spanish',
          'category': 'education',
          'status': 'active',
          'progress': 20,
          'targetDate': '2025-06-30T00:00:00.000Z',
          'createdAt': '2025-01-05T00:00:00.000Z',
          'updatedAt': '2025-01-14T10:00:00.000Z',
        },
        {
          'id': 'goal-125',
          'userId': 'user-123',
          'title': 'Read 24 books',
          'description': 'Read 2 books per month throughout the year',
          'category': 'personal',
          'status': 'active',
          'progress': 8,
          'targetDate': '2025-12-31T00:00:00.000Z',
          'createdAt': '2025-01-01T00:00:00.000Z',
          'updatedAt': '2025-01-12T10:00:00.000Z',
        },
      ];
}

/// Sample habit data for testing
class HabitFixtures {
  static Map<String, dynamic> get sampleHabit => {
        'id': 'habit-123',
        'userId': 'user-123',
        'name': 'Morning meditation',
        'description': '10 minutes of mindfulness meditation',
        'frequency': 'daily',
        'targetDays': ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        'reminderTime': '07:00',
        'streak': 12,
        'longestStreak': 21,
        'totalCompletions': 45,
        'createdAt': '2024-12-01T00:00:00.000Z',
        'updatedAt': '2025-01-15T07:15:00.000Z',
        'isActive': true,
      };

  static List<Map<String, dynamic>> get sampleHabits => [
        sampleHabit,
        {
          'id': 'habit-124',
          'userId': 'user-123',
          'name': 'Exercise',
          'description': '30 minutes of physical activity',
          'frequency': 'daily',
          'targetDays': ['mon', 'tue', 'wed', 'thu', 'fri'],
          'reminderTime': '18:00',
          'streak': 5,
          'longestStreak': 14,
          'totalCompletions': 28,
          'createdAt': '2024-12-15T00:00:00.000Z',
          'updatedAt': '2025-01-14T18:30:00.000Z',
          'isActive': true,
        },
        {
          'id': 'habit-125',
          'userId': 'user-123',
          'name': 'Reading',
          'description': 'Read for 20 minutes before bed',
          'frequency': 'daily',
          'targetDays': ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          'reminderTime': '21:30',
          'streak': 8,
          'longestStreak': 30,
          'totalCompletions': 52,
          'createdAt': '2024-11-01T00:00:00.000Z',
          'updatedAt': '2025-01-15T21:45:00.000Z',
          'isActive': true,
        },
      ];
}

/// Sample session data for testing
class SessionFixtures {
  static Map<String, dynamic> get sampleSession => {
        'id': 'session-123',
        'clientId': 'user-123',
        'coachId': 'coach-456',
        'title': 'Weekly check-in',
        'description': 'Review progress and set next week goals',
        'scheduledAt': '2025-01-20T10:00:00.000Z',
        'duration': 60,
        'status': 'scheduled',
        'meetingUrl': 'https://meet.upcoach.app/session-123',
        'notes': null,
        'createdAt': '2025-01-10T00:00:00.000Z',
        'updatedAt': '2025-01-10T00:00:00.000Z',
      };

  static Map<String, dynamic> get completedSession => {
        'id': 'session-122',
        'clientId': 'user-123',
        'coachId': 'coach-456',
        'title': 'Goal setting session',
        'description': 'Set Q1 goals and action items',
        'scheduledAt': '2025-01-13T10:00:00.000Z',
        'duration': 90,
        'status': 'completed',
        'meetingUrl': 'https://meet.upcoach.app/session-122',
        'notes': 'Great session! Client is motivated and has clear goals.',
        'summary': 'Discussed fitness and learning goals. Set up habit tracking.',
        'actionItems': [
          'Start running 3x per week',
          'Download language learning app',
          'Create morning routine',
        ],
        'createdAt': '2025-01-06T00:00:00.000Z',
        'updatedAt': '2025-01-13T11:30:00.000Z',
      };
}

/// Sample subscription data for testing
class SubscriptionFixtures {
  static Map<String, dynamic> get activeSubscription => {
        'id': 'sub-123',
        'userId': 'user-123',
        'planId': 'pro-monthly',
        'status': 'active',
        'currentPeriodStart': '2025-01-01T00:00:00.000Z',
        'currentPeriodEnd': '2025-02-01T00:00:00.000Z',
        'cancelAtPeriodEnd': false,
        'createdAt': '2024-10-01T00:00:00.000Z',
        'features': [
          'unlimited_goals',
          'unlimited_habits',
          'ai_coaching',
          'priority_support',
          'analytics',
        ],
      };

  static Map<String, dynamic> get expiredSubscription => {
        'id': 'sub-122',
        'userId': 'user-123',
        'planId': 'basic-monthly',
        'status': 'expired',
        'currentPeriodStart': '2024-12-01T00:00:00.000Z',
        'currentPeriodEnd': '2025-01-01T00:00:00.000Z',
        'cancelAtPeriodEnd': true,
        'createdAt': '2024-09-01T00:00:00.000Z',
        'features': [
          'limited_goals',
          'limited_habits',
        ],
      };

  static List<Map<String, dynamic>> get availablePlans => [
        {
          'id': 'free',
          'name': 'Free',
          'price': 0,
          'currency': 'USD',
          'interval': 'month',
          'features': ['3 goals', '3 habits', 'Basic progress tracking'],
        },
        {
          'id': 'pro-monthly',
          'name': 'Pro Monthly',
          'price': 9.99,
          'currency': 'USD',
          'interval': 'month',
          'features': [
            'Unlimited goals',
            'Unlimited habits',
            'AI coaching assistant',
            'Advanced analytics',
            'Priority support',
          ],
        },
        {
          'id': 'pro-yearly',
          'name': 'Pro Yearly',
          'price': 99.99,
          'currency': 'USD',
          'interval': 'year',
          'features': [
            'Unlimited goals',
            'Unlimited habits',
            'AI coaching assistant',
            'Advanced analytics',
            'Priority support',
            '2 months free',
          ],
        },
      ];
}

/// Sample sync data for testing
class SyncFixtures {
  static Map<String, dynamic> get syncOperation => {
        'id': 'op-123',
        'type': 'update',
        'entityType': 'goal',
        'entityId': 'goal-123',
        'data': {
          'title': 'Updated goal title',
          'progress': 40,
        },
        'version': 2,
        'timestamp': '2025-01-15T10:00:00.000Z',
        'status': 'pending',
      };

  static Map<String, dynamic> get syncConflict => {
        'entityType': 'goal',
        'entityId': 'goal-123',
        'localVersion': 2,
        'serverVersion': 3,
        'localData': {
          'title': 'Local title',
          'progress': 40,
        },
        'serverData': {
          'title': 'Server title',
          'progress': 45,
        },
        'localTimestamp': '2025-01-15T10:00:00.000Z',
        'serverTimestamp': '2025-01-15T10:05:00.000Z',
      };

  static Map<String, dynamic> get batchSyncResponse => {
        'success': true,
        'results': [
          {
            'operationId': 'op-123',
            'success': true,
            'serverId': 'server-goal-123',
          },
          {
            'operationId': 'op-124',
            'success': true,
            'serverId': 'server-habit-124',
          },
        ],
        'serverChanges': [
          {
            'entityType': 'session',
            'id': 'session-new',
            'data': {'title': 'New session from coach'},
            'version': 1,
            'updatedAt': '2025-01-15T11:00:00.000Z',
          },
        ],
        'nextCursor': 'cursor-xyz',
        'serverTimestamp': '2025-01-15T12:00:00.000Z',
      };
}

/// Sample message data for testing
class MessageFixtures {
  static Map<String, dynamic> get sampleMessage => {
        'id': 'msg-123',
        'conversationId': 'conv-456',
        'senderId': 'user-123',
        'recipientId': 'coach-456',
        'content': 'Hello, I have a question about my goals.',
        'type': 'text',
        'status': 'delivered',
        'createdAt': '2025-01-15T09:00:00.000Z',
        'readAt': null,
      };

  static List<Map<String, dynamic>> get sampleConversation => [
        sampleMessage,
        {
          'id': 'msg-124',
          'conversationId': 'conv-456',
          'senderId': 'coach-456',
          'recipientId': 'user-123',
          'content': 'Of course! What would you like to know?',
          'type': 'text',
          'status': 'delivered',
          'createdAt': '2025-01-15T09:05:00.000Z',
          'readAt': '2025-01-15T09:06:00.000Z',
        },
        {
          'id': 'msg-125',
          'conversationId': 'conv-456',
          'senderId': 'user-123',
          'recipientId': 'coach-456',
          'content': 'How should I adjust my running schedule this week?',
          'type': 'text',
          'status': 'sent',
          'createdAt': '2025-01-15T09:10:00.000Z',
          'readAt': null,
        },
      ];
}
