import AppIntents
import Foundation

/// Siri Intent for checking in a habit via voice command
///
/// Usage:
/// - "Hey Siri, check in my habit"
/// - "Hey Siri, log my morning meditation"
/// - "Hey Siri, track my water intake"
@available(iOS 16.0, *)
struct CheckInHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Check In Habit"
    static var description = IntentDescription("Mark a habit as completed for today")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Habit Name", description: "The name of the habit to check in")
    var habitName: String?
    
    @Parameter(title: "Notes", description: "Optional notes about this check-in")
    var notes: String?
    
    static var parameterSummary: some ParameterSummary {
        Summary("Check in \(\.$habitName)")
    }
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Get habit name from parameter or prompt user
        let selectedHabit: String
        
        if let habitName = habitName {
            selectedHabit = habitName
        } else {
            // Fetch user's active habits from App Group
            let habits = fetchActiveHabits()
            
            if habits.isEmpty {
                return .result(dialog: "You don't have any active habits. Open UpCoach to create one.")
            }
            
            // Use first habit as default (in real implementation, would show picker)
            selectedHabit = habits[0]
        }
        
        // Record habit check-in
        let success = recordHabitCheckIn(habitName: selectedHabit, notes: notes)
        
        if success {
            // Fetch updated streak
            let streak = getHabitStreak(habitName: selectedHabit)
            
            // Update widgets
            updateWidgets()
            
            // Provide success feedback
            if streak > 0 {
                if streak % 7 == 0 {
                    return .result(dialog: "🎉 Great job! You've completed \(selectedHabit) and reached a \(streak)-day streak!")
                } else {
                    return .result(dialog: "✅ \(selectedHabit) checked in! Your streak is now \(streak) days.")
                }
            } else {
                return .result(dialog: "✅ \(selectedHabit) checked in!")
            }
        } else {
            return .result(dialog: "❌ Failed to check in \(selectedHabit). Please try again.")
        }
    }
    
    // MARK: - Helper Methods
    
    private func fetchActiveHabits() -> [String] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return []
        }
        
        // Fetch active habits array from shared defaults
        if let habitsData = sharedDefaults.array(forKey: "active_habits") as? [String] {
            return habitsData
        }
        
        // Fallback: return primary habit if available
        if let primaryHabit = sharedDefaults.string(forKey: "primary_habit_name") {
            return [primaryHabit]
        }
        
        return []
    }
    
    private func recordHabitCheckIn(habitName: String, notes: String?) -> Bool {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return false
        }
        
        // Get current date string
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())
        
        // Create check-in record
        var checkIns = sharedDefaults.dictionary(forKey: "habit_check_ins") as? [String: [String: Any]] ?? [:]
        
        let checkInKey = "\(habitName)_\(today)"
        checkIns[checkInKey] = [
            "habitName": habitName,
            "date": today,
            "timestamp": Date().timeIntervalSince1970,
            "notes": notes ?? "",
            "source": "siri_shortcut"
        ]
        
        sharedDefaults.set(checkIns, forKey: "habit_check_ins")
        
        // Update streak
        let currentStreak = sharedDefaults.integer(forKey: "primary_habit_streak")
        sharedDefaults.set(currentStreak + 1, forKey: "primary_habit_streak")
        sharedDefaults.set(true, forKey: "primary_habit_completed_today")
        
        // Update daily progress
        let totalHabits = fetchActiveHabits().count
        let completedHabits = sharedDefaults.integer(forKey: "habits_completed_today") + 1
        let progress = totalHabits > 0 ? Double(completedHabits) / Double(totalHabits) : 0.0
        
        sharedDefaults.set(completedHabits, forKey: "habits_completed_today")
        sharedDefaults.set(progress, forKey: "daily_habits_progress")
        
        sharedDefaults.synchronize()
        
        print("✅ Siri: Checked in '\(habitName)' via Siri Shortcut")
        return true
    }
    
    private func getHabitStreak(habitName: String) -> Int {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return 0
        }
        
        return sharedDefaults.integer(forKey: "primary_habit_streak")
    }
    
    private func updateWidgets() {
        // Reload all WidgetKit widgets
        #if canImport(WidgetKit)
        import WidgetKit
        WidgetCenter.shared.reloadAllTimelines()
        #endif
    }
}

/// App Shortcuts Provider - Enables "Hey Siri" voice commands
@available(iOS 16.0, *)
struct CheckInHabitShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CheckInHabitIntent(),
            phrases: [
                "Check in my habit in \(.applicationName)",
                "Log my habit in \(.applicationName)",
                "Track my habit in \(.applicationName)",
                "Mark habit complete in \(.applicationName)",
                "Check in \(\.$habitName) in \(.applicationName)"
            ],
            shortTitle: "Check In Habit",
            systemImageName: "checkmark.circle.fill"
        )
    }
}
