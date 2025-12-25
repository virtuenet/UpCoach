import AppIntents
import Foundation

/// App Intent for viewing habit progress via Siri
///
/// Usage: "Hey Siri, show my habit progress"
@available(iOS 16.0, *)
struct ViewHabitProgressIntent: AppIntent {
    static var title: LocalizedStringResource = "View Habit Progress"
    static var description = IntentDescription("Check your habit completion status")

    static var openAppWhenRun: Bool = false

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
        // Get user defaults for habit data
        guard let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app") else {
            throw ProgressError.storageError
        }

        // Retrieve progress data
        let todayProgress = userDefaults.double(forKey: "todayProgress")
        let streakCount = userDefaults.integer(forKey: "streakCount")
        let habitName = userDefaults.string(forKey: "habitName") ?? "Your habits"

        let percentComplete = Int(todayProgress * 100)

        let dialog = IntentDialog("""
        You're \(percentComplete)% complete today! \
        Current streak: \(streakCount) days. Keep going!
        """)

        return .result(
            dialog: dialog,
            view: ProgressView(
                habitName: habitName,
                progress: todayProgress,
                streak: streakCount
            )
        )
    }

    enum ProgressError: Error, CustomLocalizedStringResourceConvertible {
        case storageError

        var localizedStringResource: LocalizedStringResource {
            switch self {
            case .storageError:
                return "Failed to load progress. Please try again."
            }
        }
    }
}

/// Progress view shown by Siri
@available(iOS 16.0, *)
struct ProgressView: View {
    let habitName: String
    let progress: Double
    let streak: Int

    var body: some View {
        VStack(spacing: 16) {
            // Progress ring
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 12)
                    .frame(width: 120, height: 120)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))

                VStack {
                    Text("\(Int(progress * 100))%")
                        .font(.system(size: 32, weight: .bold))
                    Text("Complete")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Habit name
            Text(habitName)
                .font(.headline)

            // Streak badge
            HStack(spacing: 4) {
                Text("🔥")
                    .font(.system(size: 24))
                Text("\(streak)")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("days")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.orange.opacity(0.2))
            )
        }
        .padding()
    }
}
