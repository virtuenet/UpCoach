import AppIntents

/// App Shortcuts provider for UpCoach
///
/// These shortcuts appear in:
/// - Siri Suggestions
/// - Shortcuts app
/// - App Shortcuts menu (long press app icon)
@available(iOS 16.0, *)
struct UpCoachAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CheckInHabitIntent(),
            phrases: [
                "Check in my habit in \(.applicationName)",
                "Log my habit in \(.applicationName)",
                "Record my \(\.$habitName) in \(.applicationName)",
                "Check in \(\.$habitName)",
            ],
            shortTitle: "Check In Habit",
            systemImageName: "checkmark.circle.fill"
        )

        AppShortcut(
            intent: ViewHabitProgressIntent(),
            phrases: [
                "Show my progress in \(.applicationName)",
                "View my habit stats in \(.applicationName)",
                "How am I doing in \(.applicationName)",
                "Show my streak",
            ],
            shortTitle: "View Progress",
            systemImageName: "chart.line.uptrend.xyaxis"
        )

        AppShortcut(
            intent: StartHabitSessionIntent(),
            phrases: [
                "Start a habit session in \(.applicationName)",
                "Begin my \(\.$habitName)",
                "Start tracking \(\.$habitName)",
            ],
            shortTitle: "Start Session",
            systemImageName: "play.circle.fill"
        )
    }
}

/// Intent for starting a timed habit session
@available(iOS 16.0, *)
struct StartHabitSessionIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Habit Session"
    static var description = IntentDescription("Begin a timed habit tracking session")

    static var openAppWhenRun: Bool = false

    @Parameter(title: "Habit Name")
    var habitName: String

    @Parameter(title: "Duration (minutes)", default: 30)
    var duration: Int

    static var parameterSummary: some ParameterSummary {
        Summary("Start \(\.$habitName) for \(\.$duration) minutes")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app") else {
            throw SessionError.storageError
        }

        // Store session start time
        let startTime = Date()
        let sessionKey = "session_\(habitName.replacingOccurrences(of: " ", with: "_"))"
        userDefaults.set(startTime, forKey: sessionKey)
        userDefaults.set(duration, forKey: "\(sessionKey)_duration")
        userDefaults.synchronize()

        // Start Dynamic Island if supported
        if #available(iOS 16.1, *) {
            Task {
                try? await DynamicIslandActivityManager.shared.startTracking(
                    habitId: habitName.replacingOccurrences(of: " ", with: "_"),
                    habitName: habitName,
                    habitIcon: "timer",
                    totalCount: duration
                )
            }
        }

        let dialog = IntentDialog("""
        ✅ Started \(habitName) session for \(duration) minutes. \
        You've got this!
        """)

        return .result(dialog: dialog)
    }

    enum SessionError: Error, CustomLocalizedStringResourceConvertible {
        case storageError

        var localizedStringResource: LocalizedStringResource {
            switch self {
            case .storageError:
                return "Failed to start session. Please try again."
            }
        }
    }
}
