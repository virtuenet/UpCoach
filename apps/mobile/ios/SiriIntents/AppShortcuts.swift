import AppIntents
import Foundation

/// Main App Shortcuts Provider
///
/// Registers all available Siri Shortcuts for UpCoach
/// Appears in Settings → Siri & Search → App Shortcuts
@available(iOS 16.0, *)
struct UpCoachAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        [
            // Habit Check-In
            AppShortcut(
                intent: CheckInHabitIntent(),
                phrases: [
                    "Check in my habit in \(.applicationName)",
                    "Log my habit in \(.applicationName)",
                    "Track my habit in \(.applicationName)",
                    "Mark habit complete in \(.applicationName)"
                ],
                shortTitle: "Check In Habit",
                systemImageName: "checkmark.circle.fill"
            ),
            
            // View Goals
            AppShortcut(
                intent: ViewGoalsIntent(),
                phrases: [
                    "Show my goals in \(.applicationName)",
                    "View my goals in \(.applicationName)",
                    "What are my goals in \(.applicationName)",
                    "Check my progress in \(.applicationName)"
                ],
                shortTitle: "View Goals",
                systemImageName: "target"
            ),
            
            // Log Mood
            AppShortcut(
                intent: LogMoodIntent(),
                phrases: [
                    "Log my mood in \(.applicationName)",
                    "Track my mood in \(.applicationName)",
                    "Record my mood in \(.applicationName)",
                    "How am I feeling in \(.applicationName)"
                ],
                shortTitle: "Log Mood",
                systemImageName: "face.smiling"
            )
        ]
    }
    
    static var shortcutTileColor: ShortcutTileColor = .teal
}

/// OpenURLIntent for deep linking
@available(iOS 16.0, *)
struct OpenURLIntent: OpenIntent {
    var target: URL
    
    init(url: URL) {
        self.target = url
    }
}
