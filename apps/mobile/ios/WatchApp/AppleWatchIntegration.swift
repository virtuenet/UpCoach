import WatchKit
import WatchConnectivity
import HealthKit
import Foundation
import Combine

// MARK: - Data Models

/// Watch app data model
struct WatchHabit: Codable {
    let id: String
    let name: String
    let icon: String
    let color: String
    let streak: Int
    let completedToday: Bool
}

struct WatchGoal: Codable {
    let id: String
    let title: String
    let progress: Double
    let target: Double
    let dueDate: Date?
}

struct WatchStatistics: Codable {
    let totalGoals: Int
    let completedGoals: Int
    let activeStreaks: Int
    let longestStreak: Int
}

// MARK: - Watch Connectivity Manager

class AppleWatchIntegration: NSObject, ObservableObject {
    static let shared = AppleWatchIntegration()
    
    @Published var habits: [WatchHabit] = []
    @Published var goals: [WatchGoal] = []
    @Published var statistics: WatchStatistics?
    @Published var isReachable: Bool = false
    @Published var lastSyncDate: Date?
    
    private let session: WCSession
    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    override init() {
        self.session = WCSession.default
        super.init()
        
        if WCSession.isSupported() {
            session.delegate = self
            session.activate()
        }
    }
    
    // MARK: - Watch Connectivity
    
    func activateSession() {
        guard WCSession.isSupported() else {
            print("WCSession not supported")
            return
        }
        
        session.delegate = self
        session.activate()
    }
    
    func sendDataToWatch(_ data: [String: Any]) {
        guard session.isReachable else {
            print("Watch not reachable")
            return
        }
        
        session.sendMessage(data, replyHandler: { reply in
            print("Watch replied: \(reply)")
        }, errorHandler: { error in
            print("Error sending to watch: \(error.localizedDescription)")
        })
    }
    
    func transferUserInfo(_ userInfo: [String: Any]) {
        session.transferUserInfo(userInfo)
    }
    
    func updateApplicationContext(_ context: [String: Any]) throws {
        try session.updateApplicationContext(context)
    }
    
    // MARK: - Data Sync
    
    func syncHabitsToWatch(_ habits: [WatchHabit]) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(habits)
            
            try session.updateApplicationContext([
                "type": "habits",
                "data": data,
                "timestamp": Date().timeIntervalSince1970
            ])
            
            self.habits = habits
            self.lastSyncDate = Date()
        } catch {
            print("Error syncing habits: \(error)")
        }
    }
    
    func syncGoalsToWatch(_ goals: [WatchGoal]) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(goals)
            
            try session.updateApplicationContext([
                "type": "goals",
                "data": data,
                "timestamp": Date().timeIntervalSince1970
            ])
            
            self.goals = goals
            self.lastSyncDate = Date()
        } catch {
            print("Error syncing goals: \(error)")
        }
    }
    
    func syncStatisticsToWatch(_ stats: WatchStatistics) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(stats)
            
            try session.updateApplicationContext([
                "type": "statistics",
                "data": data,
                "timestamp": Date().timeIntervalSince1970
            ])
            
            self.statistics = stats
        } catch {
            print("Error syncing statistics: \(error)")
        }
    }
    
    // MARK: - Habit Actions
    
    func completeHabit(habitId: String, completion: @escaping (Bool) -> Void) {
        let data: [String: Any] = [
            "action": "complete_habit",
            "habitId": habitId,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        session.sendMessage(data, replyHandler: { reply in
            let success = reply["success"] as? Bool ?? false
            completion(success)
        }, errorHandler: { error in
            print("Error completing habit: \(error)")
            completion(false)
        })
    }
    
    // MARK: - Complications
    
    func getCurrentComplicationData() -> [String: Any] {
        return [
            "activeStreaks": statistics?.activeStreaks ?? 0,
            "completedToday": habits.filter { $0.completedToday }.count,
            "totalHabits": habits.count,
            "timestamp": Date().timeIntervalSince1970
        ]
    }
    
    func updateComplication() {
        let data = getCurrentComplicationData()
        transferUserInfo(["complication": data])
    }
    
    // MARK: - Health Integration
    
    func requestHealthAuthorization(completion: @escaping (Bool) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(false)
            return
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
            HKObjectType.workoutType()
        ]
        
        let typesToWrite: Set<HKSampleType> = [
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.workoutType()
        ]
        
        healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead) { success, error in
            if let error = error {
                print("Health authorization error: \(error)")
            }
            completion(success)
        }
    }
    
    func fetchTodaysSteps(completion: @escaping (Double?) -> Void) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            completion(nil)
            return
        }
        
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                completion(nil)
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            completion(steps)
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Standalone Mode
    
    var isStandaloneModeSupported: Bool {
        return session.isPaired && session.isWatchAppInstalled
    }
    
    func enableStandaloneMode() {
        // Configure watch app to work without phone
        let config: [String: Any] = [
            "standaloneMode": true,
            "offlineDataSync": true,
            "cacheSize": "50MB"
        ]
        
        transferUserInfo(["config": config])
    }
}

// MARK: - WCSession Delegate

extension AppleWatchIntegration: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            
            if let error = error {
                print("Session activation error: \(error)")
            } else {
                print("Session activated: \(activationState.rawValue)")
            }
        }
    }
    
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("Session became inactive")
    }
    
    func sessionDidDeactivate(_ session: WCSession) {
        print("Session deactivated")
        session.activate()
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            print("Watch reachability changed: \(session.isReachable)")
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
        print("Received message from watch: \(message)")
        
        // Handle different message types
        if let action = message["action"] as? String {
            switch action {
            case "complete_habit":
                handleCompleteHabit(message: message, replyHandler: replyHandler)
            case "fetch_data":
                handleFetchData(replyHandler: replyHandler)
            case "sync_request":
                handleSyncRequest(replyHandler: replyHandler)
            default:
                replyHandler(["error": "Unknown action"])
            }
        }
    }
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
        print("Received application context: \(applicationContext)")
        
        DispatchQueue.main.async {
            self.processApplicationContext(applicationContext)
        }
    }
    
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
        print("Received user info: \(userInfo)")
        
        DispatchQueue.main.async {
            self.processUserInfo(userInfo)
        }
    }
    
    // MARK: - Message Handlers
    
    private func handleCompleteHabit(message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        guard let habitId = message["habitId"] as? String else {
            replyHandler(["success": false, "error": "Missing habitId"])
            return
        }
        
        // Update habit completion status
        if let index = habits.firstIndex(where: { $0.id == habitId }) {
            var habit = habits[index]
            // In production, this would update the actual data model
            replyHandler(["success": true, "streak": habit.streak + 1])
        } else {
            replyHandler(["success": false, "error": "Habit not found"])
        }
    }
    
    private func handleFetchData(replyHandler: @escaping ([String: Any]) -> Void) {
        do {
            let encoder = JSONEncoder()
            let habitsData = try encoder.encode(habits)
            let goalsData = try encoder.encode(goals)
            
            replyHandler([
                "habits": habitsData,
                "goals": goalsData,
                "timestamp": Date().timeIntervalSince1970
            ])
        } catch {
            replyHandler(["error": error.localizedDescription])
        }
    }
    
    private func handleSyncRequest(replyHandler: @escaping ([String: Any]) -> Void) {
        // Trigger full sync
        replyHandler([
            "success": true,
            "message": "Sync started"
        ])
    }
    
    private func processApplicationContext(_ context: [String: Any]) {
        guard let type = context["type"] as? String else { return }
        
        let decoder = JSONDecoder()
        
        switch type {
        case "habits":
            if let data = context["data"] as? Data {
                do {
                    habits = try decoder.decode([WatchHabit].self, from: data)
                } catch {
                    print("Error decoding habits: \(error)")
                }
            }
        case "goals":
            if let data = context["data"] as? Data {
                do {
                    goals = try decoder.decode([WatchGoal].self, from: data)
                } catch {
                    print("Error decoding goals: \(error)")
                }
            }
        case "statistics":
            if let data = context["data"] as? Data {
                do {
                    statistics = try decoder.decode(WatchStatistics.self, from: data)
                } catch {
                    print("Error decoding statistics: \(error)")
                }
            }
        default:
            break
        }
    }
    
    private func processUserInfo(_ userInfo: [String: Any]) {
        // Process background data transfers
        if let complicationData = userInfo["complication"] as? [String: Any] {
            // Update complications
            updateComplication()
        }
    }
}

// MARK: - Watch App View Controller (for WatchKit)

#if os(watchOS)
import SwiftUI

struct HabitListView: View {
    @ObservedObject var watchManager = AppleWatchIntegration.shared
    
    var body: some View {
        List(watchManager.habits, id: \.id) { habit in
            HabitRow(habit: habit) {
                watchManager.completeHabit(habitId: habit.id) { success in
                    if success {
                        // Update UI
                    }
                }
            }
        }
        .navigationTitle("Habits")
    }
}

struct HabitRow: View {
    let habit: WatchHabit
    let onComplete: () -> Void
    
    var body: some View {
        HStack {
            Text(habit.icon)
                .font(.title)
            
            VStack(alignment: .leading) {
                Text(habit.name)
                    .font(.headline)
                
                Text("\(habit.streak) day streak")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            if habit.completedToday {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            } else {
                Button(action: onComplete) {
                    Image(systemName: "circle")
                }
            }
        }
    }
}

struct ComplicationView: View {
    @ObservedObject var watchManager = AppleWatchIntegration.shared
    
    var body: some View {
        VStack {
            if let stats = watchManager.statistics {
                Text("\(stats.activeStreaks)")
                    .font(.title)
                Text("Streaks")
                    .font(.caption)
            } else {
                Text("--")
                    .font(.title)
            }
        }
    }
}
#endif

// MARK: - Extension Support

extension AppleWatchIntegration {
    func scheduleBackgroundRefresh(at date: Date) {
        #if os(watchOS)
        WKExtension.shared().scheduleBackgroundRefresh(withPreferredDate: date, userInfo: nil) { error in
            if let error = error {
                print("Background refresh scheduling error: \(error)")
            }
        }
        #endif
    }
    
    func handleBackgroundTasks() {
        #if os(watchOS)
        // Handle background refresh
        #endif
    }
}
