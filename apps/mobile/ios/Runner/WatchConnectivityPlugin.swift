import Flutter
import WatchConnectivity

/// Flutter plugin for Watch Connectivity
/// Enables communication between the iOS app and Apple Watch companion app
@objc public class WatchConnectivityPlugin: NSObject, FlutterPlugin, WCSessionDelegate {

    // MARK: - Properties

    private var methodChannel: FlutterMethodChannel?
    private var eventChannel: FlutterEventChannel?
    private var eventSink: FlutterEventSink?
    private var session: WCSession?

    /// App group identifier for shared data
    private let appGroupId = "group.com.upcoach.app"

    // MARK: - FlutterPlugin Registration

    public static func register(with registrar: FlutterPluginRegistrar) {
        let instance = WatchConnectivityPlugin()

        // Method channel for bidirectional communication
        let methodChannel = FlutterMethodChannel(
            name: "com.upcoach/watch_connectivity",
            binaryMessenger: registrar.messenger()
        )
        instance.methodChannel = methodChannel
        registrar.addMethodCallDelegate(instance, channel: methodChannel)

        // Event channel for streaming watch events to Flutter
        let eventChannel = FlutterEventChannel(
            name: "com.upcoach/watch_events",
            binaryMessenger: registrar.messenger()
        )
        instance.eventChannel = eventChannel
        eventChannel.setStreamHandler(instance)

        // Initialize WatchConnectivity session
        instance.setupWatchConnectivity()
    }

    // MARK: - WatchConnectivity Setup

    private func setupWatchConnectivity() {
        guard WCSession.isSupported() else {
            print("WatchConnectivity is not supported on this device")
            return
        }

        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }

    // MARK: - FlutterPlugin Method Call Handler

    public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
        switch call.method {
        case "activateSession":
            activateSession(result: result)

        case "isWatchAppInstalled":
            isWatchAppInstalled(result: result)

        case "isReachable":
            isReachable(result: result)

        case "sendMessage":
            if let args = call.arguments as? [String: Any],
               let message = args["message"] as? String {
                sendMessage(message, result: result)
            } else {
                result(FlutterError(code: "INVALID_ARGS", message: "Message is required", details: nil))
            }

        case "syncData":
            if let args = call.arguments as? [String: Any],
               let data = args["data"] as? String {
                syncData(data, result: result)
            } else {
                result(FlutterError(code: "INVALID_ARGS", message: "Data is required", details: nil))
            }

        case "updateApplicationContext":
            if let args = call.arguments as? [String: Any],
               let context = args["context"] as? String {
                updateApplicationContext(context, result: result)
            } else {
                result(FlutterError(code: "INVALID_ARGS", message: "Context is required", details: nil))
            }

        case "getApplicationContext":
            getApplicationContext(result: result)

        case "transferUserInfo":
            if let args = call.arguments as? [String: Any],
               let userInfo = args["userInfo"] as? String {
                transferUserInfo(userInfo, result: result)
            } else {
                result(FlutterError(code: "INVALID_ARGS", message: "UserInfo is required", details: nil))
            }

        case "transferFile":
            if let args = call.arguments as? [String: Any],
               let filePath = args["filePath"] as? String {
                let metadata = args["metadata"] as? String
                transferFile(filePath, metadata: metadata, result: result)
            } else {
                result(FlutterError(code: "INVALID_ARGS", message: "FilePath is required", details: nil))
            }

        case "getPairedWatch":
            getPairedWatch(result: result)

        case "getConnectedDevices":
            getConnectedDevices(result: result)

        default:
            result(FlutterMethodNotImplemented)
        }
    }

    // MARK: - Method Implementations

    private func activateSession(result: @escaping FlutterResult) {
        guard let session = session else {
            result(false)
            return
        }

        if session.activationState == .activated {
            result(true)
        } else {
            session.activate()
            result(true)
        }
    }

    private func isWatchAppInstalled(result: @escaping FlutterResult) {
        guard let session = session else {
            result(false)
            return
        }
        result(session.isWatchAppInstalled)
    }

    private func isReachable(result: @escaping FlutterResult) {
        guard let session = session else {
            result(false)
            return
        }
        result(session.isReachable)
    }

    private func sendMessage(_ message: String, result: @escaping FlutterResult) {
        guard let session = session, session.isReachable else {
            result(FlutterError(code: "NOT_REACHABLE", message: "Watch is not reachable", details: nil))
            return
        }

        session.sendMessage(
            ["message": message],
            replyHandler: { reply in
                result(true)
            },
            errorHandler: { error in
                result(FlutterError(code: "SEND_ERROR", message: error.localizedDescription, details: nil))
            }
        )
    }

    private func syncData(_ data: String, result: @escaping FlutterResult) {
        // Save to app group for widget access
        if let userDefaults = UserDefaults(suiteName: appGroupId) {
            userDefaults.set(data, forKey: "companion_data")
            userDefaults.set(Date().timeIntervalSince1970, forKey: "companion_last_sync")
            userDefaults.synchronize()
        }

        // Also update application context for watch
        guard let session = session else {
            result(true) // Still success - widget data is saved
            return
        }

        do {
            if let jsonData = data.data(using: .utf8),
               let context = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                try session.updateApplicationContext(context)
            }
            result(true)
        } catch {
            // Log error but don't fail - widget data is still saved
            print("Error updating watch context: \(error)")
            result(true)
        }
    }

    private func updateApplicationContext(_ contextJson: String, result: @escaping FlutterResult) {
        guard let session = session else {
            result(FlutterError(code: "NO_SESSION", message: "WatchConnectivity session not available", details: nil))
            return
        }

        do {
            if let jsonData = contextJson.data(using: .utf8),
               let context = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                try session.updateApplicationContext(context)
                result(true)
            } else {
                result(FlutterError(code: "INVALID_JSON", message: "Could not parse context JSON", details: nil))
            }
        } catch {
            result(FlutterError(code: "UPDATE_ERROR", message: error.localizedDescription, details: nil))
        }
    }

    private func getApplicationContext(result: @escaping FlutterResult) {
        guard let session = session else {
            result(nil)
            return
        }

        do {
            let data = try JSONSerialization.data(withJSONObject: session.applicationContext)
            result(String(data: data, encoding: .utf8))
        } catch {
            result(nil)
        }
    }

    private func transferUserInfo(_ userInfoJson: String, result: @escaping FlutterResult) {
        guard let session = session else {
            result(FlutterError(code: "NO_SESSION", message: "WatchConnectivity session not available", details: nil))
            return
        }

        do {
            if let jsonData = userInfoJson.data(using: .utf8),
               let userInfo = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any] {
                session.transferUserInfo(userInfo)
                result(true)
            } else {
                result(FlutterError(code: "INVALID_JSON", message: "Could not parse userInfo JSON", details: nil))
            }
        } catch {
            result(FlutterError(code: "TRANSFER_ERROR", message: error.localizedDescription, details: nil))
        }
    }

    private func transferFile(_ filePath: String, metadata: String?, result: @escaping FlutterResult) {
        guard let session = session else {
            result(FlutterError(code: "NO_SESSION", message: "WatchConnectivity session not available", details: nil))
            return
        }

        let fileURL = URL(fileURLWithPath: filePath)
        var metadataDict: [String: Any]? = nil

        if let metadataJson = metadata,
           let jsonData = metadataJson.data(using: .utf8) {
            metadataDict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any]
        }

        session.transferFile(fileURL, metadata: metadataDict)
        result(true)
    }

    private func getPairedWatch(result: @escaping FlutterResult) {
        guard let session = session else {
            result(nil)
            return
        }

        #if os(iOS)
        if session.isPaired {
            result([
                "name": "Apple Watch",
                "model": "Apple Watch",
                "osVersion": "Unknown",
                "isWatchAppInstalled": session.isWatchAppInstalled
            ])
        } else {
            result(nil)
        }
        #else
        result(nil)
        #endif
    }

    private func getConnectedDevices(result: @escaping FlutterResult) {
        guard let session = session, session.isPaired else {
            result([])
            return
        }

        let device: [String: Any] = [
            "id": "apple_watch",
            "type": "appleWatch",
            "name": "Apple Watch",
            "isReachable": session.isReachable,
            "osVersion": ""
        ]

        result([device])
    }

    // MARK: - WCSessionDelegate

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("WCSession activation failed: \(error.localizedDescription)")
            return
        }

        switch activationState {
        case .activated:
            sendConnectionEvent("connected")
        case .inactive:
            sendConnectionEvent("disconnected")
        case .notActivated:
            sendConnectionEvent("disconnected")
        @unknown default:
            break
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        sendConnectionEvent("disconnected")
    }

    public func sessionDidDeactivate(_ session: WCSession) {
        // Reactivate session after switching watches
        session.activate()
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        if session.isReachable {
            sendConnectionEvent("connected")
        } else {
            sendConnectionEvent("notReachable")
        }
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleReceivedMessage(message)
    }

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        handleReceivedMessage(message)
        replyHandler(["status": "received"])
    }

    public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        // Forward application context update to Flutter
        do {
            let data = try JSONSerialization.data(withJSONObject: applicationContext)
            if let jsonString = String(data: data, encoding: .utf8) {
                DispatchQueue.main.async {
                    self.eventSink?(jsonString)
                }
            }
        } catch {
            print("Error forwarding application context: \(error)")
        }
    }

    public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        // Forward user info to Flutter
        do {
            let data = try JSONSerialization.data(withJSONObject: userInfo)
            if let jsonString = String(data: data, encoding: .utf8) {
                DispatchQueue.main.async {
                    self.eventSink?(jsonString)
                }
            }
        } catch {
            print("Error forwarding user info: \(error)")
        }
    }

    // MARK: - Helper Methods

    private func handleReceivedMessage(_ message: [String: Any]) {
        // Forward message to Flutter via event channel
        do {
            let data = try JSONSerialization.data(withJSONObject: message)
            if let jsonString = String(data: data, encoding: .utf8) {
                DispatchQueue.main.async {
                    self.eventSink?(jsonString)
                }
            }
        } catch {
            print("Error forwarding message: \(error)")
        }
    }

    private func sendConnectionEvent(_ state: String) {
        DispatchQueue.main.async {
            self.eventSink?("connection:\(state)")
        }
    }
}

// MARK: - FlutterStreamHandler

extension WatchConnectivityPlugin: FlutterStreamHandler {
    public func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
        eventSink = events
        return nil
    }

    public func onCancel(withArguments arguments: Any?) -> FlutterError? {
        eventSink = nil
        return nil
    }
}
