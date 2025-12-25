import WidgetKit
import SwiftUI

// MARK: - Widget Entry
struct LockScreenEntry: TimelineEntry {
    let date: Date
    let streakCount: Int
    let todayProgress: Double
    let habitName: String
    let nextHabitTime: String?
}

// MARK: - Timeline Provider
struct LockScreenProvider: TimelineProvider {
    func placeholder(in context: Context) -> LockScreenEntry {
        LockScreenEntry(
            date: Date(),
            streakCount: 7,
            todayProgress: 0.6,
            habitName: "Morning Workout",
            nextHabitTime: "8:00 AM"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (LockScreenEntry) -> Void) {
        let entry = LockScreenEntry(
            date: Date(),
            streakCount: getUserDefaults().integer(forKey: "streakCount"),
            todayProgress: getUserDefaults().double(forKey: "todayProgress"),
            habitName: getUserDefaults().string(forKey: "habitName") ?? "Habit",
            nextHabitTime: getUserDefaults().string(forKey: "nextHabitTime")
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LockScreenEntry>) -> Void) {
        let currentDate = Date()
        let entry = LockScreenEntry(
            date: currentDate,
            streakCount: getUserDefaults().integer(forKey: "streakCount"),
            todayProgress: getUserDefaults().double(forKey: "todayProgress"),
            habitName: getUserDefaults().string(forKey: "habitName") ?? "Habit",
            nextHabitTime: getUserDefaults().string(forKey: "nextHabitTime")
        )

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func getUserDefaults() -> UserDefaults {
        return UserDefaults(suiteName: "group.com.upcoach.app") ?? UserDefaults.standard
    }
}

// MARK: - Circular Widget View
struct CircularLockScreenView: View {
    let entry: LockScreenEntry

    var body: some View {
        ZStack {
            // Progress ring
            Circle()
                .stroke(Color.gray.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: entry.todayProgress)
                .stroke(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            // Streak count
            VStack(spacing: 0) {
                Text("\(entry.streakCount)")
                    .font(.system(size: 20, weight: .bold))
                Text("🔥")
                    .font(.system(size: 12))
            }
        }
        .widgetAccentable()
    }
}

// MARK: - Rectangular Widget View
struct RectangularLockScreenView: View {
    let entry: LockScreenEntry

    var body: some View {
        HStack(spacing: 8) {
            // Progress indicator
            VStack(alignment: .leading, spacing: 2) {
                Text("\(Int(entry.todayProgress * 100))%")
                    .font(.system(size: 18, weight: .bold))

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 4)
                            .cornerRadius(2)

                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.blue, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * entry.todayProgress, height: 4)
                            .cornerRadius(2)
                    }
                }
                .frame(height: 4)
            }

            Spacer()

            // Streak counter
            HStack(spacing: 2) {
                Text("🔥")
                    .font(.system(size: 14))
                Text("\(entry.streakCount)")
                    .font(.system(size: 16, weight: .semibold))
            }
        }
        .widgetAccentable()
    }
}

// MARK: - Inline Widget View
struct InlineLockScreenView: View {
    let entry: LockScreenEntry

    var body: some View {
        HStack(spacing: 4) {
            Text("🔥 \(entry.streakCount)")
            Text("•")
            Text("\(Int(entry.todayProgress * 100))% done")
        }
        .font(.system(size: 14))
        .widgetAccentable()
    }
}

// MARK: - Widget Entry View
struct LockScreenWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: LockScreenEntry

    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularLockScreenView(entry: entry)
        case .accessoryRectangular:
            RectangularLockScreenView(entry: entry)
        case .accessoryInline:
            InlineLockScreenView(entry: entry)
        default:
            Text("Unsupported")
        }
    }
}

// MARK: - Widget Configuration
@main
struct UpCoachLockScreenWidget: Widget {
    let kind: String = "UpCoachLockScreenWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LockScreenProvider()) { entry in
            LockScreenWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("UpCoach Habits")
        .description("Track your daily habit progress and streaks")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Preview
struct LockScreenWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LockScreenWidgetEntryView(entry: LockScreenEntry(
                date: Date(),
                streakCount: 14,
                todayProgress: 0.75,
                habitName: "Morning Workout",
                nextHabitTime: "8:00 AM"
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))

            LockScreenWidgetEntryView(entry: LockScreenEntry(
                date: Date(),
                streakCount: 14,
                todayProgress: 0.75,
                habitName: "Morning Workout",
                nextHabitTime: "8:00 AM"
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))

            LockScreenWidgetEntryView(entry: LockScreenEntry(
                date: Date(),
                streakCount: 14,
                todayProgress: 0.75,
                habitName: "Morning Workout",
                nextHabitTime: "8:00 AM"
            ))
            .previewContext(WidgetPreviewContext(family: .accessoryInline))
        }
    }
}
