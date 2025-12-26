import AppIntents
import Foundation

/// Siri Intent for logging mood via voice command
///
/// Usage:
/// - "Hey Siri, log my mood"
/// - "Hey Siri, I'm feeling great"
/// - "Hey Siri, track my mood in UpCoach"
@available(iOS 16.0, *)
struct LogMoodIntent: AppIntent {
    static var title: LocalizedStringResource = "Log My Mood"
    static var description = IntentDescription("Track your current mood and energy level")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Mood", description: "How are you feeling?")
    var mood: MoodEntity?
    
    @Parameter(title: "Energy Level", description: "Your current energy level (1-10)")
    var energyLevel: Int?
    
    @Parameter(title: "Notes", description: "Optional notes about your mood")
    var notes: String?
    
    static var parameterSummary: some ParameterSummary {
        Summary("Log mood as \(\.$mood)")
    }
    
    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Get mood from parameter or prompt user
        let selectedMood: MoodEntity
        
        if let mood = mood {
            selectedMood = mood
        } else {
            // Default to neutral if not specified
            selectedMood = MoodEntity(id: "neutral", emoji: "😐", label: "Neutral", score: 5)
        }
        
        // Get energy level or default to mood score
        let energy = energyLevel ?? selectedMood.score
        
        // Record mood entry
        let success = recordMoodEntry(
            mood: selectedMood,
            energyLevel: energy,
            notes: notes
        )
        
        if success {
            // Provide contextual feedback
            var dialog = "\(selectedMood.emoji) Mood logged as \(selectedMood.label)"
            
            if let notes = notes, !notes.isEmpty {
                dialog += " with note: '\(notes)'"
            }
            
            // Add motivational message based on mood
            if selectedMood.score >= 8 {
                dialog += ". Keep up the great energy!"
            } else if selectedMood.score <= 3 {
                dialog += ". Remember to take care of yourself today."
            }
            
            return .result(dialog: dialog)
        } else {
            return .result(dialog: "❌ Failed to log mood. Please try again.")
        }
    }
    
    // MARK: - Helper Methods
    
    private func recordMoodEntry(mood: MoodEntity, energyLevel: Int, notes: String?) -> Bool {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return false
        }
        
        // Get current timestamp
        let timestamp = Date().timeIntervalSince1970
        
        // Create mood entry
        var moodEntries = sharedDefaults.array(forKey: "mood_entries") as? [[String: Any]] ?? []
        
        let entry: [String: Any] = [
            "id": UUID().uuidString,
            "timestamp": timestamp,
            "mood": mood.label,
            "moodScore": mood.score,
            "emoji": mood.emoji,
            "energyLevel": energyLevel,
            "notes": notes ?? "",
            "source": "siri_shortcut"
        ]
        
        moodEntries.append(entry)
        
        // Keep only last 100 entries to avoid storage bloat
        if moodEntries.count > 100 {
            moodEntries = Array(moodEntries.suffix(100))
        }
        
        sharedDefaults.set(moodEntries, forKey: "mood_entries")
        
        // Update today's average mood
        let todayEntries = getTodayMoodEntries(from: moodEntries)
        let averageMood = todayEntries.reduce(0.0) { $0 + (($1["moodScore"] as? Int) ?? 0) } / Double(todayEntries.count)
        
        sharedDefaults.set(averageMood, forKey: "today_average_mood")
        sharedDefaults.set(todayEntries.count, forKey: "today_mood_entries_count")
        
        sharedDefaults.synchronize()
        
        print("✅ Siri: Logged mood '\(mood.label)' (score: \(mood.score), energy: \(energyLevel))")
        return true
    }
    
    private func getTodayMoodEntries(from allEntries: [[String: Any]]) -> [[String: Any]] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        return allEntries.filter { entry in
            guard let timestamp = entry["timestamp"] as? TimeInterval else { return false }
            let entryDate = Date(timeIntervalSince1970: timestamp)
            return calendar.isDate(entryDate, inSameDayAs: today)
        }
    }
}

/// Mood Entity for parameter selection
@available(iOS 16.0, *)
struct MoodEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Mood"
    
    let id: String
    let emoji: String
    let label: String
    let score: Int // 1-10 scale
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(emoji) \(label)")
    }
    
    static var defaultQuery = MoodEntityQuery()
}

/// Query for available moods
@available(iOS 16.0, *)
struct MoodEntityQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [MoodEntity] {
        allMoods().filter { identifiers.contains($0.id) }
    }
    
    func suggestedEntities() async throws -> [MoodEntity] {
        allMoods()
    }
    
    private func allMoods() -> [MoodEntity] {
        [
            MoodEntity(id: "amazing", emoji: "🤩", label: "Amazing", score: 10),
            MoodEntity(id: "great", emoji: "😄", label: "Great", score: 8),
            MoodEntity(id: "good", emoji: "🙂", label: "Good", score: 7),
            MoodEntity(id: "okay", emoji: "😐", label: "Okay", score: 5),
            MoodEntity(id: "meh", emoji: "😕", label: "Meh", score: 4),
            MoodEntity(id: "bad", emoji: "😞", label: "Bad", score: 3),
            MoodEntity(id: "terrible", emoji: "😢", label: "Terrible", score: 1)
        ]
    }
}

/// App Shortcuts Provider for Log Mood
@available(iOS 16.0, *)
struct LogMoodShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LogMoodIntent(),
            phrases: [
                "Log my mood in \(.applicationName)",
                "Track my mood in \(.applicationName)",
                "I'm feeling \(\.$mood) in \(.applicationName)",
                "Record my mood in \(.applicationName)",
                "How am I feeling in \(.applicationName)"
            ],
            shortTitle: "Log Mood",
            systemImageName: "face.smiling"
        )
    }
}
