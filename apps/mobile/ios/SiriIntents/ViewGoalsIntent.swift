import AppIntents
import Foundation

/// Siri Intent for viewing current goals via voice command
///
/// Usage:
/// - "Hey Siri, show my goals"
/// - "Hey Siri, what are my goals in UpCoach"
/// - "Hey Siri, view my progress"
@available(iOS 16.0, *)
struct ViewGoalsIntent: AppIntent {
    static var title: LocalizedStringResource = "View My Goals"
    static var description = IntentDescription("View your current goals and progress")
    
    static var openAppWhenRun: Bool = true // Opens app to show full details
    
    @Parameter(title: "Goal Type", description: "Filter by goal type")
    var goalType: GoalTypeEntity?
    
    static var parameterSummary: some ParameterSummary {
        Summary("View my \(\.$goalType) goals")
    }
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog & OpensIntent {
        // Fetch goals from App Group
        let goals = fetchGoals(type: goalType?.type)
        
        if goals.isEmpty {
            return .result(
                dialog: "You don't have any active goals. Open UpCoach to create one.",
                opensIntent: OpenURLIntent(url: URL(string: "upcoach://goals/create")!)
            )
        }
        
        // Build summary dialog
        var dialogText = ""
        
        if let type = goalType?.type {
            dialogText = "You have \(goals.count) \(type) goal\(goals.count > 1 ? "s" : ""): "
        } else {
            dialogText = "You have \(goals.count) active goal\(goals.count > 1 ? "s" : ""): "
        }
        
        // Add top 3 goals with progress
        for (index, goal) in goals.prefix(3).enumerated() {
            let progressPercent = Int(goal.progress * 100)
            dialogText += "\(index + 1). \(goal.name) - \(progressPercent)% complete"
            
            if index < min(2, goals.count - 1) {
                dialogText += ", "
            }
        }
        
        if goals.count > 3 {
            dialogText += " and \(goals.count - 3) more."
        }
        
        return .result(
            dialog: dialogText,
            opensIntent: OpenURLIntent(url: URL(string: "upcoach://goals")!)
        )
    }
    
    // MARK: - Helper Methods
    
    private func fetchGoals(type: String?) -> [Goal] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return []
        }
        
        // Fetch goals array from shared defaults
        guard let goalsData = sharedDefaults.data(forKey: "active_goals"),
              let goals = try? JSONDecoder().decode([Goal].self, from: goalsData) else {
            return []
        }
        
        // Filter by type if specified
        if let type = type {
            return goals.filter { $0.type == type }
        }
        
        return goals
    }
}

/// Goal model for Siri integration
@available(iOS 16.0, *)
struct Goal: Codable {
    let id: String
    let name: String
    let type: String
    let progress: Double
    let targetDate: String?
}

/// Goal Type Entity for parameter selection
@available(iOS 16.0, *)
struct GoalTypeEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Goal Type"
    
    let id: String
    let type: String
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(type.capitalized)")
    }
    
    static var defaultQuery = GoalTypeQuery()
}

/// Query for available goal types
@available(iOS 16.0, *)
struct GoalTypeQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [GoalTypeEntity] {
        identifiers.compactMap { id in
            GoalTypeEntity(id: id, type: id)
        }
    }
    
    func suggestedEntities() async throws -> [GoalTypeEntity] {
        [
            GoalTypeEntity(id: "habit", type: "habit"),
            GoalTypeEntity(id: "fitness", type: "fitness"),
            GoalTypeEntity(id: "career", type: "career"),
            GoalTypeEntity(id: "personal", type: "personal")
        ]
    }
}

/// App Shortcuts Provider for View Goals
@available(iOS 16.0, *)
struct ViewGoalsShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ViewGoalsIntent(),
            phrases: [
                "Show my goals in \(.applicationName)",
                "View my goals in \(.applicationName)",
                "What are my goals in \(.applicationName)",
                "Check my progress in \(.applicationName)",
                "Show my \(\.$goalType) goals in \(.applicationName)"
            ],
            shortTitle: "View Goals",
            systemImageName: "target"
        )
    }
}
