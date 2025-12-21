import ClockKit
import SwiftUI

/// Complication data source for Apple Watch face complications
class ComplicationController: NSObject, CLKComplicationDataSource {

    // MARK: - Data Source

    private var dataStore: HabitDataStore {
        HabitDataStore.shared
    }

    // MARK: - Complication Configuration

    func getComplicationDescriptors(handler: @escaping ([CLKComplicationDescriptor]) -> Void) {
        let descriptors = [
            CLKComplicationDescriptor(
                identifier: "streak",
                displayName: "Streak",
                supportedFamilies: [
                    .circularSmall,
                    .graphicCircular,
                    .graphicCorner,
                    .modularSmall,
                    .utilitarianSmall
                ]
            ),
            CLKComplicationDescriptor(
                identifier: "progress",
                displayName: "Today's Progress",
                supportedFamilies: [
                    .circularSmall,
                    .graphicCircular,
                    .graphicCorner,
                    .modularSmall,
                    .modularLarge,
                    .graphicRectangular
                ]
            ),
            CLKComplicationDescriptor(
                identifier: "habits",
                displayName: "Habits",
                supportedFamilies: [
                    .graphicRectangular,
                    .modularLarge
                ]
            )
        ]

        handler(descriptors)
    }

    // MARK: - Timeline Configuration

    func getTimelineEndDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
        // Complications are valid until end of day
        let endOfDay = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        handler(endOfDay)
    }

    func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
        handler(.showOnLockScreen)
    }

    // MARK: - Timeline Population

    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        let entry = createTimelineEntry(for: complication, date: Date())
        handler(entry)
    }

    func getTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Provide entries at each hour
        var entries: [CLKComplicationTimelineEntry] = []
        var currentDate = date

        for _ in 0..<min(limit, 24) {
            currentDate = currentDate.addingTimeInterval(3600)
            if let entry = createTimelineEntry(for: complication, date: currentDate) {
                entries.append(entry)
            }
        }

        handler(entries)
    }

    // MARK: - Timeline Entry Creation

    private func createTimelineEntry(for complication: CLKComplication, date: Date) -> CLKComplicationTimelineEntry? {
        guard let template = createTemplate(for: complication) else {
            return nil
        }
        return CLKComplicationTimelineEntry(date: date, complicationTemplate: template)
    }

    private func createTemplate(for complication: CLKComplication) -> CLKComplicationTemplate? {
        switch complication.identifier {
        case "streak":
            return createStreakTemplate(for: complication.family)
        case "progress":
            return createProgressTemplate(for: complication.family)
        case "habits":
            return createHabitsTemplate(for: complication.family)
        default:
            return nil
        }
    }

    // MARK: - Streak Templates

    private func createStreakTemplate(for family: CLKComplicationFamily) -> CLKComplicationTemplate? {
        let streak = dataStore.currentStreak

        switch family {
        case .circularSmall:
            return CLKComplicationTemplateCircularSmallSimpleText(
                textProvider: CLKSimpleTextProvider(text: "\(streak)🔥")
            )

        case .graphicCircular:
            return CLKComplicationTemplateGraphicCircularView(
                StreakComplicationView(streak: streak)
            )

        case .graphicCorner:
            return CLKComplicationTemplateGraphicCornerTextView(
                textProvider: CLKSimpleTextProvider(text: "\(streak) day streak"),
                label: StreakCornerView(streak: streak)
            )

        case .modularSmall:
            return CLKComplicationTemplateModularSmallSimpleText(
                textProvider: CLKSimpleTextProvider(text: "\(streak)🔥")
            )

        case .utilitarianSmall:
            return CLKComplicationTemplateUtilitarianSmallFlat(
                textProvider: CLKSimpleTextProvider(text: "\(streak)🔥")
            )

        default:
            return nil
        }
    }

    // MARK: - Progress Templates

    private func createProgressTemplate(for family: CLKComplicationFamily) -> CLKComplicationTemplate? {
        let progress = dataStore.todayProgress
        let completed = dataStore.todayCompletedCount
        let total = dataStore.todayTotalCount

        switch family {
        case .circularSmall:
            return CLKComplicationTemplateCircularSmallRingText(
                textProvider: CLKSimpleTextProvider(text: "\(completed)"),
                fillFraction: Float(progress),
                ringStyle: .closed
            )

        case .graphicCircular:
            return CLKComplicationTemplateGraphicCircularView(
                ProgressComplicationView(progress: progress, completed: completed, total: total)
            )

        case .graphicCorner:
            return CLKComplicationTemplateGraphicCornerGaugeText(
                gaugeProvider: CLKSimpleGaugeProvider(
                    style: .fill,
                    gaugeColor: progress >= 1 ? .green : .blue,
                    fillFraction: Float(progress)
                ),
                outerTextProvider: CLKSimpleTextProvider(text: "\(completed)/\(total)")
            )

        case .modularSmall:
            return CLKComplicationTemplateModularSmallRingText(
                textProvider: CLKSimpleTextProvider(text: "\(completed)"),
                fillFraction: Float(progress),
                ringStyle: .closed
            )

        case .modularLarge:
            return CLKComplicationTemplateModularLargeStandardBody(
                headerTextProvider: CLKSimpleTextProvider(text: "Habits"),
                body1TextProvider: CLKSimpleTextProvider(text: "\(completed) of \(total) complete"),
                body2TextProvider: CLKSimpleTextProvider(text: "\(Int(progress * 100))% done")
            )

        case .graphicRectangular:
            return CLKComplicationTemplateGraphicRectangularFullView(
                ProgressRectangularView(progress: progress, completed: completed, total: total)
            )

        default:
            return nil
        }
    }

    // MARK: - Habits Templates

    private func createHabitsTemplate(for family: CLKComplicationFamily) -> CLKComplicationTemplate? {
        let pending = dataStore.pendingHabits.prefix(3)

        switch family {
        case .graphicRectangular:
            return CLKComplicationTemplateGraphicRectangularFullView(
                HabitsRectangularView(habits: Array(pending))
            )

        case .modularLarge:
            if let firstHabit = pending.first {
                return CLKComplicationTemplateModularLargeStandardBody(
                    headerTextProvider: CLKSimpleTextProvider(text: "Next Habit"),
                    body1TextProvider: CLKSimpleTextProvider(text: firstHabit.name),
                    body2TextProvider: CLKSimpleTextProvider(text: "\(pending.count) pending")
                )
            }
            return nil

        default:
            return nil
        }
    }

    // MARK: - Placeholder Templates

    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        let template = createTemplate(for: complication)
        handler(template)
    }
}

// MARK: - SwiftUI Complication Views

/// Circular streak complication view
struct StreakComplicationView: View {
    let streak: Int

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.orange.opacity(0.2))

            VStack(spacing: 0) {
                Text("🔥")
                    .font(.caption)
                Text("\(streak)")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
            }
        }
    }
}

/// Corner streak view
struct StreakCornerView: View {
    let streak: Int

    var body: some View {
        Image(systemName: "flame.fill")
            .foregroundColor(.orange)
    }
}

/// Circular progress complication view
struct ProgressComplicationView: View {
    let progress: Double
    let completed: Int
    let total: Int

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.gray.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(progress >= 1 ? Color.green : Color.blue, lineWidth: 4)
                .rotationEffect(.degrees(-90))

            VStack(spacing: 0) {
                Text("\(completed)")
                    .font(.system(size: 16, weight: .bold))
                Text("/\(total)")
                    .font(.system(size: 8))
                    .foregroundColor(.secondary)
            }
        }
    }
}

/// Rectangular progress view
struct ProgressRectangularView: View {
    let progress: Double
    let completed: Int
    let total: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Habits")
                    .font(.caption.bold())
                Spacer()
                Text("\(completed)/\(total)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.3))

                    RoundedRectangle(cornerRadius: 4)
                        .fill(progress >= 1 ? Color.green : Color.blue)
                        .frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 8)

            Text(progress >= 1 ? "All done!" : "\(Int(progress * 100))% complete")
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(8)
    }
}

/// Rectangular habits list view
struct HabitsRectangularView: View {
    let habits: [HabitSummary]

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Pending Habits")
                .font(.caption.bold())

            if habits.isEmpty {
                Text("All done!")
                    .font(.caption)
                    .foregroundColor(.green)
            } else {
                ForEach(habits.prefix(3)) { habit in
                    HStack(spacing: 4) {
                        Text(habit.displayEmoji)
                            .font(.caption2)
                        Text(habit.name)
                            .font(.caption2)
                            .lineLimit(1)
                    }
                }
            }
        }
        .padding(8)
    }
}
