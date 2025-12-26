import SwiftUI
import WidgetKit
import AppIntents

/// Interactive Home Screen Widget (iOS 17+)
///
/// Allows users to check in habits directly from the widget
/// without opening the app
@available(iOS 17.0, *)
struct InteractiveHabitWidget: Widget {
    let kind: String = "InteractiveHabitWidget"
    
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: SelectHabitIntent.self,
            provider: InteractiveHabitProvider()
        ) { entry in
            InteractiveHabitWidgetView(entry: entry)
        }
        .configurationDisplayName("Interactive Habit Tracker")
        .description("Check in your habits with a single tap")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// Intent for selecting which habit to display in widget
@available(iOS 17.0, *)
struct SelectHabitIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select Habit"
    static var description = IntentDescription("Choose which habit to track")
    
    @Parameter(title: "Habit")
    var habit: HabitEntity?
}

/// Habit Entity for widget configuration
@available(iOS 17.0, *)
struct HabitEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Habit"
    
    let id: String
    let name: String
    let icon: String
    let streak: Int
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(
            title: "\(name)",
            subtitle: "\(streak) day streak",
            image: .init(systemName: icon)
        )
    }
    
    static var defaultQuery = HabitEntityQuery()
}

/// Query for available habits
@available(iOS 17.0, *)
struct HabitEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [HabitEntity] {
        let allHabits = fetchHabitsFromAppGroup()
        return allHabits.filter { identifiers.contains($0.id) }
    }
    
    func suggestedEntities() async throws -> [HabitEntity] {
        fetchHabitsFromAppGroup()
    }
    
    private func fetchHabitsFromAppGroup() -> [HabitEntity] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile"),
              let habitsData = sharedDefaults.array(forKey: "active_habits") as? [[String: Any]] else {
            return []
        }
        
        return habitsData.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let name = dict["name"] as? String else {
                return nil
            }
            
            return HabitEntity(
                id: id,
                name: name,
                icon: dict["icon"] as? String ?? "star.fill",
                streak: dict["streak"] as? Int ?? 0
            )
        }
    }
}

/// Timeline Provider for Interactive Widgets
@available(iOS 17.0, *)
struct InteractiveHabitProvider: AppIntentTimelineProvider {
    typealias Entry = InteractiveHabitEntry
    typealias Intent = SelectHabitIntent
    
    func placeholder(in context: Context) -> InteractiveHabitEntry {
        InteractiveHabitEntry(
            date: Date(),
            habitId: "placeholder",
            habitName: "Morning Meditation",
            habitIcon: "flame.fill",
            currentStreak: 7,
            completedToday: false,
            configuration: SelectHabitIntent()
        )
    }
    
    func snapshot(for configuration: SelectHabitIntent, in context: Context) async -> InteractiveHabitEntry {
        let habit = configuration.habit ?? HabitEntity(
            id: "default",
            name: "Habit",
            icon: "star.fill",
            streak: 0
        )
        
        return InteractiveHabitEntry(
            date: Date(),
            habitId: habit.id,
            habitName: habit.name,
            habitIcon: habit.icon,
            currentStreak: habit.streak,
            completedToday: false,
            configuration: configuration
        )
    }
    
    func timeline(for configuration: SelectHabitIntent, in context: Context) async -> Timeline<InteractiveHabitEntry> {
        let habit = configuration.habit ?? fetchPrimaryHabit()
        
        let entry = InteractiveHabitEntry(
            date: Date(),
            habitId: habit.id,
            habitName: habit.name,
            habitIcon: habit.icon,
            currentStreak: habit.streak,
            completedToday: checkIfCompletedToday(habitId: habit.id),
            configuration: configuration
        )
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
    
    private func fetchPrimaryHabit() -> HabitEntity {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return HabitEntity(id: "default", name: "Habit", icon: "star.fill", streak: 0)
        }
        
        return HabitEntity(
            id: sharedDefaults.string(forKey: "primary_habit_id") ?? "default",
            name: sharedDefaults.string(forKey: "primary_habit_name") ?? "Habit",
            icon: sharedDefaults.string(forKey: "primary_habit_icon") ?? "star.fill",
            streak: sharedDefaults.integer(forKey: "primary_habit_streak")
        )
    }
    
    private func checkIfCompletedToday(habitId: String) -> Bool {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return false
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())
        
        let completedHabits = sharedDefaults.dictionary(forKey: "completed_habits_today") as? [String: Bool] ?? [:]
        return completedHabits[habitId] ?? false
    }
}

/// Timeline Entry for Interactive Widget
@available(iOS 17.0, *)
struct InteractiveHabitEntry: TimelineEntry {
    let date: Date
    let habitId: String
    let habitName: String
    let habitIcon: String
    let currentStreak: Int
    let completedToday: Bool
    let configuration: SelectHabitIntent
}

/// Interactive Widget View
@available(iOS 17.0, *)
struct InteractiveHabitWidgetView: View {
    var entry: InteractiveHabitEntry
    @Environment(\.widgetFamily) var widgetFamily
    
    var body: some View {
        switch widgetFamily {
        case .systemSmall:
            SmallInteractiveView(entry: entry)
        case .systemMedium:
            MediumInteractiveView(entry: entry)
        default:
            SmallInteractiveView(entry: entry)
        }
    }
}

/// Small Widget with Check-In Button
@available(iOS 17.0, *)
struct SmallInteractiveView: View {
    var entry: InteractiveHabitEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: entry.completedToday ? [Color.green.opacity(0.3), Color.green.opacity(0.1)] : [Color.blue.opacity(0.3), Color.purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            VStack(spacing: 8) {
                Image(systemName: entry.habitIcon)
                    .font(.system(size: 32))
                    .foregroundColor(entry.completedToday ? .green : .blue)
                
                Text(entry.habitName)
                    .font(.system(size: 14, weight: .semibold))
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                
                Text("\(entry.currentStreak) day streak")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Interactive Check-In Button
                Button(intent: CheckInHabitButtonIntent(habitId: entry.habitId, habitName: entry.habitName)) {
                    HStack {
                        Image(systemName: entry.completedToday ? "checkmark.circle.fill" : "circle")
                        Text(entry.completedToday ? "Done" : "Check In")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(entry.completedToday ? Color.green : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(20)
                }
                .buttonStyle(.plain)
            }
            .padding()
        }
    }
}

/// Medium Widget with Progress and Button
@available(iOS 17.0, *)
struct MediumInteractiveView: View {
    var entry: InteractiveHabitEntry
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: entry.completedToday ? [Color.green.opacity(0.2), Color.green.opacity(0.05)] : [Color.blue.opacity(0.2), Color.purple.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            HStack(spacing: 16) {
                // Left: Icon and Streak
                VStack {
                    Image(systemName: entry.habitIcon)
                        .font(.system(size: 40))
                        .foregroundColor(entry.completedToday ? .green : .blue)
                    
                    Text("\(entry.currentStreak)")
                        .font(.system(size: 28, weight: .bold))
                    
                    Text("day streak")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
                .frame(width: 80)
                
                // Right: Habit Info and Button
                VStack(alignment: .leading, spacing: 8) {
                    Text(entry.habitName)
                        .font(.system(size: 16, weight: .bold))
                        .lineLimit(2)
                    
                    if entry.completedToday {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                            Text("Completed Today")
                                .font(.system(size: 12))
                                .foregroundColor(.green)
                        }
                    }
                    
                    Spacer()
                    
                    // Interactive Check-In Button
                    Button(intent: CheckInHabitButtonIntent(habitId: entry.habitId, habitName: entry.habitName)) {
                        HStack {
                            Image(systemName: entry.completedToday ? "checkmark.circle.fill" : "plus.circle.fill")
                            Text(entry.completedToday ? "Checked In" : "Check In Now")
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(entry.completedToday ? Color.green : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(20)
                    }
                    .buttonStyle(.plain)
                    .disabled(entry.completedToday)
                }
                
                Spacer()
            }
            .padding()
        }
    }
}

/// Button Intent for Check-In Action
@available(iOS 17.0, *)
struct CheckInHabitButtonIntent: AppIntent {
    static var title: LocalizedStringResource = "Check In Habit"
    static var description = IntentDescription("Mark habit as completed")
    
    @Parameter(title: "Habit ID")
    var habitId: String
    
    @Parameter(title: "Habit Name")
    var habitName: String
    
    init() {
        self.habitId = ""
        self.habitName = ""
    }
    
    init(habitId: String, habitName: String) {
        self.habitId = habitId
        self.habitName = habitName
    }
    
    func perform() async throws -> some IntentResult {
        // Record check-in
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return .result()
        }
        
        // Mark habit as completed today
        var completedHabits = sharedDefaults.dictionary(forKey: "completed_habits_today") as? [String: Bool] ?? [:]
        completedHabits[habitId] = true
        sharedDefaults.set(completedHabits, forKey: "completed_habits_today")
        
        // Increment streak
        let currentStreak = sharedDefaults.integer(forKey: "primary_habit_streak")
        sharedDefaults.set(currentStreak + 1, forKey: "primary_habit_streak")
        sharedDefaults.set(true, forKey: "primary_habit_completed_today")
        
        sharedDefaults.synchronize()
        
        // Reload widgets
        WidgetCenter.shared.reloadAllTimelines()
        
        print("✅ Widget: Checked in '\(habitName)' from interactive widget")
        
        return .result()
    }
}
