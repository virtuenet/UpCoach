import Foundation
import Combine

/// Local data store for habit data on watch
final class HabitDataStore: ObservableObject {
    static let shared = HabitDataStore()

    // MARK: - Published Properties

    @Published var habits: [HabitSummary] = []
    @Published var currentStreak: Int = 0
    @Published var bestStreak: Int = 0
    @Published var todayProgress: Double = 0
    @Published var todayCompletedCount: Int = 0
    @Published var todayTotalCount: Int = 0
    @Published var weeklyProgress: Double = 0
    @Published var totalPoints: Int = 0
    @Published var currentLevel: Int = 1
    @Published var lastUpdated: Date?

    // MARK: - Computed Properties

    /// Pending (incomplete) habits for today
    var pendingHabits: [HabitSummary] {
        habits.filter { !$0.isCompletedToday }
    }

    /// Completed habits for today
    var completedHabits: [HabitSummary] {
        habits.filter { $0.isCompletedToday }
    }

    /// Progress text for display
    var progressText: String {
        "\(todayCompletedCount)/\(todayTotalCount)"
    }

    /// Level text for display
    var levelText: String {
        "Level \(currentLevel)"
    }

    /// Points text for display
    var pointsText: String {
        "\(totalPoints) pts"
    }

    // MARK: - Initialization

    private init() {
        loadCachedData()
    }

    // MARK: - Public Methods

    /// Update store from companion data received from phone
    func updateFromCompanionData(_ data: CompanionData) {
        DispatchQueue.main.async {
            self.habits = data.habits
            self.currentStreak = data.currentStreak
            self.bestStreak = data.bestStreak
            self.todayProgress = data.todayProgress
            self.todayCompletedCount = data.todayCompletedHabits
            self.todayTotalCount = data.todayTotalHabits
            self.weeklyProgress = data.weeklyProgress
            self.totalPoints = data.totalPoints
            self.currentLevel = data.currentLevel
            self.lastUpdated = data.lastUpdated

            self.cacheData()
        }
    }

    /// Optimistically mark a habit as completed
    func markHabitCompleted(_ habitId: String) {
        guard let index = habits.firstIndex(where: { $0.id == habitId }) else { return }

        DispatchQueue.main.async {
            var updatedHabit = self.habits[index]
            // Create new habit with updated completion status
            updatedHabit = HabitSummary(
                id: updatedHabit.id,
                name: updatedHabit.name,
                emoji: updatedHabit.emoji,
                isCompletedToday: true,
                currentStreak: updatedHabit.currentStreak + 1,
                targetFrequency: updatedHabit.targetFrequency,
                completedThisWeek: updatedHabit.completedThisWeek + 1,
                category: updatedHabit.category,
                color: updatedHabit.color
            )
            self.habits[index] = updatedHabit

            self.todayCompletedCount += 1
            self.todayProgress = Double(self.todayCompletedCount) / max(Double(self.todayTotalCount), 1)
        }
    }

    /// Optimistically mark a habit as uncompleted
    func markHabitUncompleted(_ habitId: String) {
        guard let index = habits.firstIndex(where: { $0.id == habitId }) else { return }

        DispatchQueue.main.async {
            var updatedHabit = self.habits[index]
            updatedHabit = HabitSummary(
                id: updatedHabit.id,
                name: updatedHabit.name,
                emoji: updatedHabit.emoji,
                isCompletedToday: false,
                currentStreak: max(0, updatedHabit.currentStreak - 1),
                targetFrequency: updatedHabit.targetFrequency,
                completedThisWeek: max(0, updatedHabit.completedThisWeek - 1),
                category: updatedHabit.category,
                color: updatedHabit.color
            )
            self.habits[index] = updatedHabit

            self.todayCompletedCount = max(0, self.todayCompletedCount - 1)
            self.todayProgress = Double(self.todayCompletedCount) / max(Double(self.todayTotalCount), 1)
        }
    }

    // MARK: - Private Methods

    private func cacheData() {
        let defaults = UserDefaults.standard

        let data = CachedHabitData(
            habits: habits,
            currentStreak: currentStreak,
            bestStreak: bestStreak,
            todayProgress: todayProgress,
            todayCompletedCount: todayCompletedCount,
            todayTotalCount: todayTotalCount,
            weeklyProgress: weeklyProgress,
            totalPoints: totalPoints,
            currentLevel: currentLevel,
            lastUpdated: lastUpdated
        )

        if let encoded = try? JSONEncoder().encode(data) {
            defaults.set(encoded, forKey: "cached_habit_data")
        }
    }

    private func loadCachedData() {
        guard let data = UserDefaults.standard.data(forKey: "cached_habit_data"),
              let cached = try? JSONDecoder().decode(CachedHabitData.self, from: data) else {
            return
        }

        habits = cached.habits
        currentStreak = cached.currentStreak
        bestStreak = cached.bestStreak
        todayProgress = cached.todayProgress
        todayCompletedCount = cached.todayCompletedCount
        todayTotalCount = cached.todayTotalCount
        weeklyProgress = cached.weeklyProgress
        totalPoints = cached.totalPoints
        currentLevel = cached.currentLevel
        lastUpdated = cached.lastUpdated
    }
}

/// Cached data structure for local storage
private struct CachedHabitData: Codable {
    let habits: [HabitSummary]
    let currentStreak: Int
    let bestStreak: Int
    let todayProgress: Double
    let todayCompletedCount: Int
    let todayTotalCount: Int
    let weeklyProgress: Double
    let totalPoints: Int
    let currentLevel: Int
    let lastUpdated: Date?
}
