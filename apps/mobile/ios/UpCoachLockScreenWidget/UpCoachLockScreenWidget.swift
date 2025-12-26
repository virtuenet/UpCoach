//
//  UpCoachLockScreenWidget.swift
//  UpCoach Lock Screen Widget (Phase 10)
//
//  Displays habit progress and streaks on iOS lock screen
//
//  Widget Types:
//  - Circular: Habit streak counter
//  - Rectangular: Daily goal progress bar
//  - Inline: Compact habit checklist
//

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct HabitProvider: TimelineProvider {
    func placeholder(in context: Context) -> HabitEntry {
        HabitEntry(
            date: Date(),
            habitName: "Morning Workout",
            currentStreak: 7,
            targetStreak: 30,
            completedToday: true,
            dailyProgress: 0.65
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (HabitEntry) -> Void) {
        let entry = HabitEntry(
            date: Date(),
            habitName: "Morning Workout",
            currentStreak: 7,
            targetStreak: 30,
            completedToday: true,
            dailyProgress: 0.65
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HabitEntry>) -> Void) {
        // Fetch data from App Group shared container
        let habitData = fetchHabitData()

        let currentDate = Date()
        let entry = HabitEntry(
            date: currentDate,
            habitName: habitData.name,
            currentStreak: habitData.streak,
            targetStreak: habitData.target,
            completedToday: habitData.completedToday,
            dailyProgress: habitData.progress
        )

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }

    private func fetchHabitData() -> (name: String, streak: Int, target: Int, completedToday: Bool, progress: Double) {
        // Read from App Group shared container
        if let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") {
            let name = sharedDefaults.string(forKey: "primary_habit_name") ?? "Habit"
            let streak = sharedDefaults.integer(forKey: "primary_habit_streak")
            let target = sharedDefaults.integer(forKey: "primary_habit_target")
            let completedToday = sharedDefaults.bool(forKey: "primary_habit_completed_today")
            let progress = sharedDefaults.double(forKey: "daily_habits_progress")

            return (name, streak, target > 0 ? target : 30, completedToday, progress)
        }

        return ("Habit", 0, 30, false, 0.0)
    }
}

// MARK: - Timeline Entry

struct HabitEntry: TimelineEntry {
    let date: Date
    let habitName: String
    let currentStreak: Int
    let targetStreak: Int
    let completedToday: Bool
    let dailyProgress: Double
}

// MARK: - Widget Views

// Circular Widget - Lock Screen Accessory
struct CircularHabitView: View {
    var entry: HabitEntry

    var body: some View {
        ZStack {
            // Background progress ring
            Circle()
                .stroke(
                    Color.gray.opacity(0.3),
                    lineWidth: 4
                )

            // Progress ring
            Circle()
                .trim(from: 0, to: Double(entry.currentStreak) / Double(entry.targetStreak))
                .stroke(
                    entry.completedToday ? Color.green : Color.orange,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut, value: entry.currentStreak)

            // Streak number
            VStack(spacing: 2) {
                Text("\(entry.currentStreak)")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(entry.completedToday ? .green : .orange)

                if entry.completedToday {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 8))
                        .foregroundColor(.green)
                }
            }
        }
        .widgetAccentable()
    }
}

// Rectangular Widget - Lock Screen Accessory
struct RectangularHabitView: View {
    var entry: HabitEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Header
            HStack {
                Image(systemName: entry.completedToday ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(entry.completedToday ? .green : .gray)
                    .font(.system(size: 12))

                Text(entry.habitName)
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(1)

                Spacer()

                Text("\(entry.currentStreak) day\(entry.currentStreak == 1 ? "" : "s")")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    // Background
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)

                    // Progress
                    RoundedRectangle(cornerRadius: 2)
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [.green, .blue]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * entry.dailyProgress, height: 6)
                        .animation(.easeInOut, value: entry.dailyProgress)
                }
            }
            .frame(height: 6)

            // Footer
            HStack {
                Text("\(Int(entry.dailyProgress * 100))% complete")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)

                Spacer()

                Text("Goal: \(entry.targetStreak)")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
        .widgetAccentable()
    }
}

// Inline Widget - Lock Screen Accessory
struct InlineHabitView: View {
    var entry: HabitEntry

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: entry.completedToday ? "checkmark.circle.fill" : "circle")
                .foregroundColor(entry.completedToday ? .green : .gray)

            Text(entry.habitName)
                .font(.system(size: 12, weight: .medium))

            Text("•")
                .foregroundColor(.secondary)

            Text("\(entry.currentStreak) days")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(entry.completedToday ? .green : .orange)
        }
        .widgetAccentable()
    }
}

// MARK: - Widget Entry View

struct UpCoachLockScreenWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: HabitEntry

    var body: some View {
        switch widgetFamily {
        case .accessoryCircular:
            CircularHabitView(entry: entry)
        case .accessoryRectangular:
            RectangularHabitView(entry: entry)
        case .accessoryInline:
            InlineHabitView(entry: entry)
        default:
            // Fallback for other widget families
            CircularHabitView(entry: entry)
        }
    }
}

// MARK: - Widget Configuration

@main
struct UpCoachLockScreenWidget: Widget {
    let kind: String = "UpCoachLockScreenWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HabitProvider()) { entry in
            UpCoachLockScreenWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Habit Streak")
        .description("Track your current habit streak on your lock screen")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

// MARK: - Preview

struct UpCoachLockScreenWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Circular preview
            UpCoachLockScreenWidgetEntryView(
                entry: HabitEntry(
                    date: Date(),
                    habitName: "Morning Workout",
                    currentStreak: 7,
                    targetStreak: 30,
                    completedToday: true,
                    dailyProgress: 0.65
                )
            )
            .previewContext(WidgetPreviewContext(family: .accessoryCircular))
            .previewDisplayName("Circular - Completed")

            // Rectangular preview
            UpCoachLockScreenWidgetEntryView(
                entry: HabitEntry(
                    date: Date(),
                    habitName: "Read 30 Minutes",
                    currentStreak: 14,
                    targetStreak: 30,
                    completedToday: false,
                    dailyProgress: 0.45
                )
            )
            .previewContext(WidgetPreviewContext(family: .accessoryRectangular))
            .previewDisplayName("Rectangular - Pending")

            // Inline preview
            UpCoachLockScreenWidgetEntryView(
                entry: HabitEntry(
                    date: Date(),
                    habitName: "Meditation",
                    currentStreak: 21,
                    targetStreak: 30,
                    completedToday: true,
                    dailyProgress: 0.80
                )
            )
            .previewContext(WidgetPreviewContext(family: .accessoryInline))
            .previewDisplayName("Inline - Completed")
        }
    }
}
