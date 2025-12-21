import Foundation

/// Habit summary model for watch display
struct HabitSummary: Codable, Identifiable {
    let id: String
    let name: String
    let emoji: String?
    let isCompletedToday: Bool
    let currentStreak: Int
    let targetFrequency: Int
    let completedThisWeek: Int
    let category: String?
    let color: String?

    /// Category icon based on habit type
    var categoryIcon: String {
        switch category?.lowercased() {
        case "health": return "heart.fill"
        case "fitness": return "figure.run"
        case "mindfulness": return "brain.head.profile"
        case "productivity": return "checkmark.circle.fill"
        case "learning": return "book.fill"
        case "social": return "person.2.fill"
        default: return "star.fill"
        }
    }

    /// Display emoji or default icon
    var displayEmoji: String {
        emoji ?? "✓"
    }
}

/// Companion data synced from phone
struct CompanionData: Codable {
    let habits: [HabitSummary]
    let currentStreak: Int
    let bestStreak: Int
    let streakLastActivity: Date?
    let todayCompletedHabits: Int
    let todayTotalHabits: Int
    let todayProgress: Double
    let pendingHabitIds: [String]
    let weeklyProgress: Double
    let totalPoints: Int
    let currentLevel: Int
    let lastUpdated: Date
    let syncVersion: Int

    /// Today's completion percentage as string
    var todayProgressText: String {
        return "\(Int(todayProgress * 100))%"
    }

    /// Number of pending habits
    var pendingCount: Int {
        return pendingHabitIds.count
    }

    /// Level display text
    var levelText: String {
        return "Level \(currentLevel)"
    }
}

/// Completion request to send back to phone
struct HabitCompletionRequest: Codable {
    let habitId: String
    let completedAt: Date
    let source: String

    init(habitId: String) {
        self.habitId = habitId
        self.completedAt = Date()
        self.source = "appleWatch"
    }
}

/// Message types for watch-phone communication
enum WatchMessageType: String, Codable {
    case syncRequest = "sync_request"
    case habitCompleted = "habit_completed"
    case habitUncompleted = "habit_uncompleted"
    case refreshData = "refresh_data"
}

/// Watch message wrapper
struct WatchMessage: Codable {
    let type: WatchMessageType
    let payload: String?
    let timestamp: Date

    init(type: WatchMessageType, payload: String? = nil) {
        self.type = type
        self.payload = payload
        self.timestamp = Date()
    }
}
