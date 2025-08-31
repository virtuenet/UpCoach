import WidgetKit
import SwiftUI
import Intents

struct UpCoachData {
    let widgetType: String
    let lastUpdated: Date
    
    // Goals data
    let completedCount: Int?
    let totalCount: Int?
    let goals: [Goal]?
    
    // Tasks data
    let completedToday: Int?
    let pendingToday: Int?
    let tasks: [Task]?
    
    // Streak data
    let currentStreak: Int?
    let bestStreak: Int?
    let lastActivity: String?
    
    // Progress data
    let weeklyProgress: Double?
    let sessionsCompleted: Int?
    let pointsEarned: Int?
    let nextMilestone: String?
}

struct Goal {
    let title: String
    let status: String
    let progress: Double
}

struct Task {
    let title: String
    let priority: String
    let dueDate: Date?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> UpCoachEntry {
        UpCoachEntry(date: Date(), data: sampleData())
    }

    func getSnapshot(in context: Context, completion: @escaping (UpCoachEntry) -> ()) {
        let entry = UpCoachEntry(date: Date(), data: loadData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [UpCoachEntry] = []
        
        let currentDate = Date()
        let data = loadData()
        
        // Create entries for the next 5 hours
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = UpCoachEntry(date: entryDate, data: data)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
    
    func loadData() -> UpCoachData {
        let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app")!
        
        let widgetType = userDefaults.string(forKey: "widget_type") ?? "goals"
        let lastUpdatedString = userDefaults.string(forKey: "last_updated") ?? ""
        let lastUpdated = ISO8601DateFormatter().date(from: lastUpdatedString) ?? Date()
        
        var data = UpCoachData(
            widgetType: widgetType,
            lastUpdated: lastUpdated,
            completedCount: nil,
            totalCount: nil,
            goals: nil,
            completedToday: nil,
            pendingToday: nil,
            tasks: nil,
            currentStreak: nil,
            bestStreak: nil,
            lastActivity: nil,
            weeklyProgress: nil,
            sessionsCompleted: nil,
            pointsEarned: nil,
            nextMilestone: nil
        )
        
        switch widgetType {
        case "goals":
            data = UpCoachData(
                widgetType: widgetType,
                lastUpdated: lastUpdated,
                completedCount: userDefaults.integer(forKey: "completed_count"),
                totalCount: userDefaults.integer(forKey: "total_count"),
                goals: loadGoals(userDefaults),
                completedToday: nil,
                pendingToday: nil,
                tasks: nil,
                currentStreak: nil,
                bestStreak: nil,
                lastActivity: nil,
                weeklyProgress: nil,
                sessionsCompleted: nil,
                pointsEarned: nil,
                nextMilestone: nil
            )
        case "tasks":
            data = UpCoachData(
                widgetType: widgetType,
                lastUpdated: lastUpdated,
                completedCount: nil,
                totalCount: nil,
                goals: nil,
                completedToday: userDefaults.integer(forKey: "completed_today"),
                pendingToday: userDefaults.integer(forKey: "pending_today"),
                tasks: loadTasks(userDefaults),
                currentStreak: nil,
                bestStreak: nil,
                lastActivity: nil,
                weeklyProgress: nil,
                sessionsCompleted: nil,
                pointsEarned: nil,
                nextMilestone: nil
            )
        case "streak":
            data = UpCoachData(
                widgetType: widgetType,
                lastUpdated: lastUpdated,
                completedCount: nil,
                totalCount: nil,
                goals: nil,
                completedToday: nil,
                pendingToday: nil,
                tasks: nil,
                currentStreak: userDefaults.integer(forKey: "current_streak"),
                bestStreak: userDefaults.integer(forKey: "best_streak"),
                lastActivity: userDefaults.string(forKey: "last_activity"),
                weeklyProgress: nil,
                sessionsCompleted: nil,
                pointsEarned: nil,
                nextMilestone: nil
            )
        case "progress":
            data = UpCoachData(
                widgetType: widgetType,
                lastUpdated: lastUpdated,
                completedCount: nil,
                totalCount: nil,
                goals: nil,
                completedToday: nil,
                pendingToday: nil,
                tasks: nil,
                currentStreak: nil,
                bestStreak: nil,
                lastActivity: nil,
                weeklyProgress: userDefaults.double(forKey: "weekly_progress"),
                sessionsCompleted: userDefaults.integer(forKey: "sessions_completed"),
                pointsEarned: userDefaults.integer(forKey: "points_earned"),
                nextMilestone: userDefaults.string(forKey: "next_milestone")
            )
        default:
            break
        }
        
        return data
    }
    
    func loadGoals(_ userDefaults: UserDefaults) -> [Goal] {
        var goals: [Goal] = []
        for i in 0..<3 {
            if let title = userDefaults.string(forKey: "goal_\(i)_title") {
                let status = userDefaults.string(forKey: "goal_\(i)_status") ?? "pending"
                let progress = userDefaults.double(forKey: "goal_\(i)_progress")
                goals.append(Goal(title: title, status: status, progress: progress))
            }
        }
        return goals
    }
    
    func loadTasks(_ userDefaults: UserDefaults) -> [Task] {
        var tasks: [Task] = []
        for i in 0..<3 {
            if let title = userDefaults.string(forKey: "task_\(i)_title") {
                let priority = userDefaults.string(forKey: "task_\(i)_priority") ?? "medium"
                let dueDateString = userDefaults.string(forKey: "task_\(i)_due")
                let dueDate = ISO8601DateFormatter().date(from: dueDateString ?? "")
                tasks.append(Task(title: title, priority: priority, dueDate: dueDate))
            }
        }
        return tasks
    }
    
    func sampleData() -> UpCoachData {
        return UpCoachData(
            widgetType: "goals",
            lastUpdated: Date(),
            completedCount: 3,
            totalCount: 5,
            goals: [
                Goal(title: "Complete fitness assessment", status: "in_progress", progress: 0.8),
                Goal(title: "Read 10 books this year", status: "in_progress", progress: 0.5),
                Goal(title: "Learn Spanish basics", status: "completed", progress: 1.0)
            ],
            completedToday: nil,
            pendingToday: nil,
            tasks: nil,
            currentStreak: nil,
            bestStreak: nil,
            lastActivity: nil,
            weeklyProgress: nil,
            sessionsCompleted: nil,
            pointsEarned: nil,
            nextMilestone: nil
        )
    }
}

struct UpCoachEntry: TimelineEntry {
    let date: Date
    let data: UpCoachData
}

struct UpCoachWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch entry.data.widgetType {
        case "goals":
            GoalsWidgetView(data: entry.data, family: family)
        case "tasks":
            TasksWidgetView(data: entry.data, family: family)
        case "streak":
            StreakWidgetView(data: entry.data, family: family)
        case "progress":
            ProgressWidgetView(data: entry.data, family: family)
        default:
            GoalsWidgetView(data: entry.data, family: family)
        }
    }
}

// Goals Widget View
struct GoalsWidgetView: View {
    let data: UpCoachData
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "flag.fill")
                    .foregroundColor(.blue)
                Text("Goals Progress")
                    .font(.headline)
                Spacer()
                if let completed = data.completedCount, let total = data.totalCount {
                    Text("\(completed)/\(total)")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
            
            if family != .systemSmall {
                Divider()
                
                if let goals = data.goals {
                    ForEach(goals.prefix(family == .systemMedium ? 2 : 3), id: \.title) { goal in
                        GoalRowView(goal: goal)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .widgetURL(URL(string: "upcoach://open?tab=goals"))
    }
}

struct GoalRowView: View {
    let goal: Goal
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: goal.status == "completed" ? "checkmark.circle.fill" : "circle")
                .foregroundColor(goal.status == "completed" ? .green : .gray)
                .font(.caption)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(goal.title)
                    .font(.caption)
                    .lineLimit(1)
                
                ProgressView(value: goal.progress)
                    .progressViewStyle(LinearProgressViewStyle(tint: goal.status == "completed" ? .green : .blue))
                    .scaleEffect(x: 1, y: 0.5, anchor: .center)
            }
        }
    }
}

// Tasks Widget View
struct TasksWidgetView: View {
    let data: UpCoachData
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "checklist")
                    .foregroundColor(.orange)
                Text("Today's Tasks")
                    .font(.headline)
                Spacer()
                HStack(spacing: 8) {
                    if let completed = data.completedToday {
                        Label("\(completed)", systemImage: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                    if let pending = data.pendingToday {
                        Label("\(pending)", systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
            }
            
            if family != .systemSmall {
                Divider()
                
                if let tasks = data.tasks {
                    ForEach(tasks.prefix(family == .systemMedium ? 2 : 3), id: \.title) { task in
                        TaskRowView(task: task)
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .widgetURL(URL(string: "upcoach://open?tab=tasks"))
    }
}

struct TaskRowView: View {
    let task: Task
    
    var priorityColor: Color {
        switch task.priority {
        case "high": return .red
        case "medium": return .orange
        default: return .green
        }
    }
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "square")
                .foregroundColor(.gray)
                .font(.caption)
            
            Rectangle()
                .fill(priorityColor)
                .frame(width: 3)
            
            Text(task.title)
                .font(.caption)
                .lineLimit(1)
            
            Spacer()
        }
    }
}

// Streak Widget View
struct StreakWidgetView: View {
    let data: UpCoachData
    let family: WidgetFamily
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "flame.fill")
                .font(.system(size: family == .systemSmall ? 40 : 60))
                .foregroundColor(.orange)
            
            if let streak = data.currentStreak {
                Text("\(streak) Day Streak!")
                    .font(.headline)
                    .bold()
            }
            
            Text("Keep it up!")
                .font(.caption)
                .foregroundColor(.secondary)
            
            if family != .systemSmall {
                HStack(spacing: 4) {
                    ForEach(0..<7) { day in
                        Circle()
                            .fill(day < (data.currentStreak ?? 0) % 7 ? Color.orange : Color.gray.opacity(0.3))
                            .frame(width: 20, height: 20)
                            .overlay(
                                Text(["M", "T", "W", "T", "F", "S", "S"][day])
                                    .font(.system(size: 8))
                                    .foregroundColor(day < (data.currentStreak ?? 0) % 7 ? .white : .gray)
                            )
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .widgetURL(URL(string: "upcoach://open"))
    }
}

// Progress Widget View
struct ProgressWidgetView: View {
    let data: UpCoachData
    let family: WidgetFamily
    
    var body: some View {
        VStack(spacing: 12) {
            Text("Weekly Progress")
                .font(.headline)
            
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 8)
                
                Circle()
                    .trim(from: 0, to: data.weeklyProgress ?? 0)
                    .stroke(Color.blue, lineWidth: 8)
                    .rotationEffect(.degrees(-90))
                
                Text("\(Int((data.weeklyProgress ?? 0) * 100))%")
                    .font(.title2)
                    .bold()
            }
            .frame(width: family == .systemSmall ? 60 : 80, height: family == .systemSmall ? 60 : 80)
            
            if family != .systemSmall {
                HStack(spacing: 16) {
                    VStack {
                        Text("\(data.sessionsCompleted ?? 0)")
                            .font(.headline)
                        Text("Sessions")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    VStack {
                        Text("\(data.pointsEarned ?? 0)")
                            .font(.headline)
                        Text("Points")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    
                    if family == .systemLarge {
                        VStack {
                            Text(data.nextMilestone ?? "50 pts")
                                .font(.headline)
                            Text("Next Level")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding()
        .widgetURL(URL(string: "upcoach://open?tab=progress"))
    }
}

@main
struct UpCoachWidget: Widget {
    let kind: String = "UpCoachWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            UpCoachWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("UpCoach")
        .description("Track your goals, tasks, and progress")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}