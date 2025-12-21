import Foundation
import WatchConnectivity
import Combine

/// Manages Watch Connectivity session and data sync with phone
final class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()

    // MARK: - Published Properties

    @Published var isConnected: Bool = false
    @Published var isReachable: Bool = false
    @Published var lastSyncTime: Date?
    @Published var syncError: String?

    // MARK: - Private Properties

    private var session: WCSession?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - App Group

    private let appGroupId = "group.com.upcoach.app"
    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }

    // MARK: - Initialization

    private override init() {
        super.init()
        setupSession()
    }

    private func setupSession() {
        guard WCSession.isSupported() else {
            print("WatchConnectivity not supported")
            return
        }

        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }

    // MARK: - Public Methods

    /// Request data sync from phone
    func requestSync() {
        guard let session = session, session.isReachable else {
            // Load from cached data if phone not reachable
            loadCachedData()
            return
        }

        let message = WatchMessage(type: .syncRequest)
        sendMessage(message)
    }

    /// Send habit completion to phone
    func completeHabit(_ habitId: String) {
        let request = HabitCompletionRequest(habitId: habitId)

        guard let payload = encodeToJSON(request) else { return }

        let message = WatchMessage(type: .habitCompleted, payload: payload)
        sendMessage(message)

        // Optimistically update local state
        HabitDataStore.shared.markHabitCompleted(habitId)

        // Trigger haptic feedback
        HapticService.shared.success()
    }

    /// Send habit un-completion to phone
    func uncompleteHabit(_ habitId: String) {
        let request = HabitCompletionRequest(habitId: habitId)

        guard let payload = encodeToJSON(request) else { return }

        let message = WatchMessage(type: .habitUncompleted, payload: payload)
        sendMessage(message)

        // Optimistically update local state
        HabitDataStore.shared.markHabitUncompleted(habitId)
    }

    // MARK: - Private Methods

    private func sendMessage(_ message: WatchMessage) {
        guard let session = session else { return }
        guard let data = encodeToJSON(message) else { return }

        if session.isReachable {
            // Real-time message
            session.sendMessage(["message": data], replyHandler: { reply in
                print("Message sent successfully")
            }, errorHandler: { error in
                print("Error sending message: \(error)")
                self.syncError = error.localizedDescription
            })
        } else {
            // Background transfer
            do {
                try session.updateApplicationContext(["message": data])
            } catch {
                print("Error updating context: \(error)")
                self.syncError = error.localizedDescription
            }
        }
    }

    private func loadCachedData() {
        guard let defaults = sharedDefaults,
              let jsonString = defaults.string(forKey: "companion_data"),
              let data = jsonString.data(using: .utf8) else {
            return
        }

        do {
            let companionData = try JSONDecoder().decode(CompanionData.self, from: data)
            HabitDataStore.shared.updateFromCompanionData(companionData)
            lastSyncTime = companionData.lastUpdated
        } catch {
            print("Error decoding cached data: \(error)")
        }
    }

    private func handleReceivedData(_ data: [String: Any]) {
        // Handle connection events
        if let connectionEvent = data["message"] as? String,
           connectionEvent.starts(with: "connection:") {
            let state = connectionEvent.replacingOccurrences(of: "connection:", with: "")
            isConnected = state == "connected"
            return
        }

        // Handle companion data
        if let jsonString = data["message"] as? String ?? data["data"] as? String,
           let jsonData = jsonString.data(using: .utf8) {
            do {
                let companionData = try JSONDecoder().decode(CompanionData.self, from: jsonData)
                DispatchQueue.main.async {
                    HabitDataStore.shared.updateFromCompanionData(companionData)
                    self.lastSyncTime = companionData.lastUpdated
                    self.syncError = nil
                }

                // Cache the data
                sharedDefaults?.set(jsonString, forKey: "companion_data")
            } catch {
                print("Error decoding companion data: \(error)")
            }
        }
    }

    private func encodeToJSON<T: Encodable>(_ value: T) -> String? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601

        guard let data = try? encoder.encode(value) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}

// MARK: - WCSessionDelegate

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            switch activationState {
            case .activated:
                self.isConnected = true
                self.requestSync()
            case .inactive, .notActivated:
                self.isConnected = false
            @unknown default:
                break
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
            if session.isReachable {
                self.requestSync()
            }
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleReceivedData(message)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleReceivedData(message)
        replyHandler(["status": "received"])
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        handleReceivedData(applicationContext)
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        handleReceivedData(userInfo)
    }
}
