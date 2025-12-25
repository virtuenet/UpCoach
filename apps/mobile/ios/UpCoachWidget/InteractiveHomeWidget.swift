import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Widget Entry
struct HomeWidgetEntry: TimelineEntry {
    let date: Date
    let habits: [HabitData]
    let overallProgress: Double
}

struct HabitData: Identifiable, Codable {
    let id: String
    let name: String
    let icon: String
    let isCompleted: Bool
    let streak: Int
}

// MARK: - Timeline Provider
struct HomeWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> HomeWidgetEntry {
        HomeWidgetEntry(
            date: Date(),
            habits: [
                HabitData(id: "1", name: "Morning Workout", icon: "figure.run", isCompleted: true, streak: 7),
                HabitData(id: "2", name: "Read 30 min", icon: "book.fill", isCompleted: false, streak: 12),
                HabitData(id: "3", name: "Meditate", icon: "brain.head.profile", isCompleted: false, streak: 5),
            ],
            overallProgress: 0.33
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HomeWidgetEntry) -> Void) {
        let habits = loadHabits()
        let progress = calculateProgress(habits)

        let entry = HomeWidgetEntry(
            date: Date(),
            habits: habits,
            overallProgress: progress
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HomeWidgetEntry>) -> Void) {
        let currentDate = Date()
        let habits = loadHabits()
        let progress = calculateProgress(habits)

        let entry = HomeWidgetEntry(
            date: currentDate,
            habits: habits,
            overallProgress: progress
        )

        // Refresh every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadHabits() -> [HabitData] {
        guard let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app"),
              let data = userDefaults.data(forKey: "todayHabits"),
              let habits = try? JSONDecoder().decode([HabitData].self, from: data) else {
            return []
        }
        return habits
    }

    private func calculateProgress(_ habits: [HabitData]) -> Double {
        guard !habits.isEmpty else { return 0 }
        let completed = habits.filter { $0.isCompleted }.count
        return Double(completed) / Double(habits.count)
    }
}

// MARK: - Check-In Button Intent
@available(iOS 17.0, *)
struct CheckInButtonIntent: AppIntent {
    static var title: LocalizedStringResource = "Check In Habit"

    @Parameter(title: "Habit ID")
    var habitId: String

    @Parameter(title: "Habit Name")
    var habitName: String

    func perform() async throws -> some IntentResult {
        // Update habit status
        guard let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app") else {
            throw IntentError.storageError
        }

        // Mark habit as completed
        let key = "completed_\(habitId)"
        userDefaults.set(true, forKey: key)
        userDefaults.set(Date(), forKey: "\(key)_timestamp")

        // Increment streak
        let streakKey = "streak_\(habitId)"
        let currentStreak = userDefaults.integer(forKey: streakKey)
        userDefaults.set(currentStreak + 1, forKey: streakKey)

        userDefaults.synchronize()

        // Reload widgets
        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }

    enum IntentError: Error {
        case storageError
    }
}

// MARK: - Small Widget View
@available(iOS 17.0, *)
struct SmallHomeWidgetView: View {
    let entry: HomeWidgetEntry

    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.blue)
                Text("Today")
                    .font(.headline)
                Spacer()
            }

            // Progress ring
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 8)

                Circle()
                    .trim(from: 0, to: entry.overallProgress)
                    .stroke(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                VStack {
                    Text("\(Int(entry.overallProgress * 100))%")
                        .font(.system(size: 28, weight: .bold))
                    Text("\(entry.habits.filter { $0.isCompleted }.count)/\(entry.habits.count)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.vertical, 8)

            Spacer()
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }
}

// MARK: - Medium Widget View
@available(iOS 17.0, *)
struct MediumHomeWidgetView: View {
    let entry: HomeWidgetEntry

    var body: some View {
        HStack(spacing: 16) {
            // Progress section
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                        .frame(width: 80, height: 80)

                    Circle()
                        .trim(from: 0, to: entry.overallProgress)
                        .stroke(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))

                    Text("\(Int(entry.overallProgress * 100))%")
                        .font(.title2)
                        .fontWeight(.bold)
                }

                Text("Today's Progress")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            // Habits list with interactive buttons
            VStack(spacing: 4) {
                ForEach(entry.habits.prefix(3)) { habit in
                    HabitRowView(habit: habit)
                }
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }
}

// MARK: - Large Widget View
@available(iOS 17.0, *)
struct LargeHomeWidgetView: View {
    let entry: HomeWidgetEntry

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's Habits")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("\(entry.habits.filter { $0.isCompleted }.count) of \(entry.habits.count) completed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Progress ring
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 6)
                        .frame(width: 50, height: 50)

                    Circle()
                        .trim(from: 0, to: entry.overallProgress)
                        .stroke(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .frame(width: 50, height: 50)
                        .rotationEffect(.degrees(-90))

                    Text("\(Int(entry.overallProgress * 100))%")
                        .font(.caption)
                        .fontWeight(.bold)
                }
            }

            // All habits with interactive buttons
            ForEach(entry.habits) { habit in
                HabitRowView(habit: habit)
                    .padding(.vertical, 2)
            }

            Spacer()
        }
        .padding()
        .containerBackground(for: .widget) {
            Color.clear
        }
    }
}

// MARK: - Habit Row with Interactive Button
@available(iOS 17.0, *)
struct HabitRowView: View {
    let habit: HabitData

    var body: some View {
        HStack(spacing: 12) {
            // Habit icon
            Image(systemName: habit.icon)
                .foregroundColor(habit.isCompleted ? .green : .gray)
                .font(.system(size: 20))
                .frame(width: 24)

            // Habit name
            VStack(alignment: .leading, spacing: 2) {
                Text(habit.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .strikethrough(habit.isCompleted)

                if habit.streak > 0 {
                    HStack(spacing: 2) {
                        Text("🔥")
                            .font(.system(size: 10))
                        Text("\(habit.streak)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            // Interactive check-in button (iOS 17+)
            if habit.isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.system(size: 24))
            } else {
                Button(intent: CheckInButtonIntent(habitId: habit.id, habitName: habit.name)) {
                    Image(systemName: "circle")
                        .foregroundColor(.blue)
                        .font(.system(size: 24))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Widget Configuration
@available(iOS 17.0, *)
@main
struct UpCoachInteractiveWidget: Widget {
    let kind: String = "UpCoachInteractiveWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HomeWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                widgetView(for: entry)
            }
        }
        .configurationDisplayName("UpCoach Habits")
        .description("Track and check in your daily habits directly from your home screen")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }

    @ViewBuilder
    private func widgetView(for entry: HomeWidgetEntry) -> some View {
        if #available(iOS 17.0, *) {
            switch WidgetFamily.self {
            case .systemSmall:
                SmallHomeWidgetView(entry: entry)
            case .systemMedium:
                MediumHomeWidgetView(entry: entry)
            case .systemLarge:
                LargeHomeWidgetView(entry: entry)
            default:
                Text("Unsupported size")
            }
        }
    }
}
