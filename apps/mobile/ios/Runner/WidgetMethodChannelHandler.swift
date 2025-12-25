import Flutter
import UIKit
import WidgetKit

/// Handles method channel communication between Flutter and iOS widgets
class WidgetMethodChannelHandler: NSObject {
    static let shared = WidgetMethodChannelHandler()

    private let lockScreenChannelName = "com.upcoach/lock_screen"
    private let dynamicIslandChannelName = "com.upcoach/dynamic_island"

    private var lockScreenChannel: FlutterMethodChannel?
    private var dynamicIslandChannel: FlutterMethodChannel?

    private override init() {
        super.init()
    }

    /// Register method channels with Flutter engine
    func registerChannels(with messenger: FlutterBinaryMessenger) {
        // Lock Screen Widget Channel
        lockScreenChannel = FlutterMethodChannel(
            name: lockScreenChannelName,
            binaryMessenger: messenger
        )
        lockScreenChannel?.setMethodCallHandler(handleLockScreenMethodCall)

        // Dynamic Island Channel
        dynamicIslandChannel = FlutterMethodChannel(
            name: dynamicIslandChannelName,
            binaryMessenger: messenger
        )
        dynamicIslandChannel?.setMethodCallHandler(handleDynamicIslandMethodCall)
    }

    // MARK: - Lock Screen Widget Methods

    private func handleLockScreenMethodCall(
        _ call: FlutterMethodCall,
        result: @escaping FlutterResult
    ) {
        switch call.method {
        case "updateWidget":
            updateLockScreenWidget(call, result: result)
        case "reloadWidgets":
            reloadWidgets(result: result)
        case "isSupported":
            checkLockScreenSupport(result: result)
        case "getConfigurationStatus":
            getConfigurationStatus(result: result)
        default:
            result(FlutterMethodNotImplemented)
        }
    }

    private func updateLockScreenWidget(
        _ call: FlutterMethodCall,
        result: @escaping FlutterResult
    ) {
        guard let args = call.arguments as? [String: Any],
              let streakCount = args["streakCount"] as? Int,
              let todayProgress = args["todayProgress"] as? Double,
              let habitName = args["habitName"] as? String else {
            result(FlutterError(
                code: "INVALID_ARGUMENTS",
                message: "Missing required arguments",
                details: nil
            ))
            return
        }

        let nextHabitTime = args["nextHabitTime"] as? String

        // Store data in App Group for widget access
        if let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app") {
            userDefaults.set(streakCount, forKey: "streakCount")
            userDefaults.set(todayProgress, forKey: "todayProgress")
            userDefaults.set(habitName, forKey: "habitName")
            if let nextTime = nextHabitTime {
                userDefaults.set(nextTime, forKey: "nextHabitTime")
            }
            userDefaults.synchronize()
        }

        // Reload widgets to reflect new data
        WidgetCenter.shared.reloadAllTimelines()

        result(nil)
    }

    private func reloadWidgets(result: @escaping FlutterResult) {
        WidgetCenter.shared.reloadAllTimelines()
        result(nil)
    }

    private func checkLockScreenSupport(result: @escaping FlutterResult) {
        if #available(iOS 16.0, *) {
            result(true)
        } else {
            result(false)
        }
    }

    private func getConfigurationStatus(result: @escaping FlutterResult) {
        if #available(iOS 16.0, *) {
            // Check if user has added widget
            if let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app"),
               userDefaults.bool(forKey: "widgetConfigured") {
                result("configured")
            } else {
                result("notConfigured")
            }
        } else {
            result("notSupported")
        }
    }

    // MARK: - Dynamic Island Methods

    private func handleDynamicIslandMethodCall(
        _ call: FlutterMethodCall,
        result: @escaping FlutterResult
    ) {
        if #available(iOS 16.1, *) {
            switch call.method {
            case "startTracking":
                startDynamicIslandTracking(call, result: result)
            case "updateProgress":
                updateDynamicIslandProgress(call, result: result)
            case "endTracking":
                endDynamicIslandTracking(result: result)
            case "isActive":
                checkDynamicIslandActive(result: result)
            case "isSupported":
                checkDynamicIslandSupport(result: result)
            default:
                result(FlutterMethodNotImplemented)
            }
        } else {
            result(FlutterError(
                code: "NOT_SUPPORTED",
                message: "Dynamic Island requires iOS 16.1+",
                details: nil
            ))
        }
    }

    @available(iOS 16.1, *)
    private func startDynamicIslandTracking(
        _ call: FlutterMethodCall,
        result: @escaping FlutterResult
    ) {
        guard let args = call.arguments as? [String: Any] else {
            result(FlutterError(
                code: "INVALID_ARGUMENTS",
                message: "Missing required arguments",
                details: nil
            ))
            return
        }

        Task {
            do {
                try await DynamicIslandActivityManager.shared.startTrackingFromFlutter(arguments: args)
                result(nil)
            } catch {
                result(FlutterError(
                    code: "START_FAILED",
                    message: error.localizedDescription,
                    details: nil
                ))
            }
        }
    }

    @available(iOS 16.1, *)
    private func updateDynamicIslandProgress(
        _ call: FlutterMethodCall,
        result: @escaping FlutterResult
    ) {
        guard let args = call.arguments as? [String: Any] else {
            result(FlutterError(
                code: "INVALID_ARGUMENTS",
                message: "Missing required arguments",
                details: nil
            ))
            return
        }

        Task {
            await DynamicIslandActivityManager.shared.updateProgressFromFlutter(arguments: args)
            result(nil)
        }
    }

    @available(iOS 16.1, *)
    private func endDynamicIslandTracking(result: @escaping FlutterResult) {
        Task {
            await DynamicIslandActivityManager.shared.endTracking()
            result(nil)
        }
    }

    @available(iOS 16.1, *)
    private func checkDynamicIslandActive(result: @escaping FlutterResult) {
        result(DynamicIslandActivityManager.shared.isActive)
    }

    @available(iOS 16.1, *)
    private func checkDynamicIslandSupport(result: @escaping FlutterResult) {
        // Dynamic Island is available on iPhone 14 Pro and later
        result(ActivityAuthorizationInfo().areActivitiesEnabled)
    }
}
