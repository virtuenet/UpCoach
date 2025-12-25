import AppIntents
import Foundation

/// App Intent for checking in a habit via Siri
///
/// Usage: "Hey Siri, check in my morning workout"
@available(iOS 16.0, *)
struct CheckInHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Check In Habit"
    static var description = IntentDescription("Record a habit check-in")

    static var openAppWhenRun: Bool = false

    @Parameter(title: "Habit Name", description: "Name of the habit to check in")
    var habitName: String

    @Parameter(title: "Notes", description: "Optional notes for this check-in")
    var notes: String?

    static var parameterSummary: some ParameterSummary {
        Summary("Check in \(\.$habitName)") {
            \.$notes
        }
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        // Get user defaults for habit data
        guard let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app") else {
            throw CheckInError.storageError
        }

        // Record check-in timestamp
        let timestamp = Date()
        let key = "lastCheckIn_\(habitName.replacingOccurrences(of: " ", with: "_"))"
        userDefaults.set(timestamp, forKey: key)

        // Increment streak if applicable
        let streakKey = "streak_\(habitName.replacingOccurrences(of: " ", with: "_"))"
        let currentStreak = userDefaults.integer(forKey: streakKey)
        userDefaults.set(currentStreak + 1, forKey: streakKey)

        // Store notes if provided
        if let notes = notes, !notes.isEmpty {
            let notesKey = "notes_\(habitName.replacingOccurrences(of: " ", with: "_"))"
            userDefaults.set(notes, forKey: notesKey)
        }

        userDefaults.synchronize()

        // Update widgets
        WidgetCenter.shared.reloadAllTimelines()

        // Prepare response
        let dialog = IntentDialog("✅ Checked in \(habitName)! Keep up the great work!")

        return .result(
            dialog: dialog,
            view: CheckInResultView(
                habitName: habitName,
                timestamp: timestamp,
                streak: currentStreak + 1
            )
        )
    }

    enum CheckInError: Error, CustomLocalizedStringResourceConvertible {
        case storageError

        var localizedStringResource: LocalizedStringResource {
            switch self {
            case .storageError:
                return "Failed to save check-in. Please try again."
            }
        }
    }
}

/// Result view shown after check-in
@available(iOS 16.0, *)
struct CheckInResultView: View {
    let habitName: String
    let timestamp: Date
    let streak: Int

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
                .font(.system(size: 48))

            Text(habitName)
                .font(.title2)
                .fontWeight(.bold)

            Text("Checked in at \(timestamp, formatter: Self.timeFormatter)")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 4) {
                Text("🔥")
                    .font(.system(size: 20))
                Text("\(streak) day streak")
                    .font(.headline)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.orange.opacity(0.2))
            .cornerRadius(8)
        }
        .padding()
    }

    static var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter
    }
}
