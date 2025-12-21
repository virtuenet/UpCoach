import Foundation
import WatchKit

/// Haptic feedback service for watch interactions
final class HapticService {
    static let shared = HapticService()

    private init() {}

    // MARK: - Feedback Types

    /// Success haptic for completed actions
    func success() {
        WKInterfaceDevice.current().play(.success)
    }

    /// Failure haptic for errors
    func failure() {
        WKInterfaceDevice.current().play(.failure)
    }

    /// Click haptic for UI interactions
    func click() {
        WKInterfaceDevice.current().play(.click)
    }

    /// Start haptic for beginning actions
    func start() {
        WKInterfaceDevice.current().play(.start)
    }

    /// Stop haptic for ending actions
    func stop() {
        WKInterfaceDevice.current().play(.stop)
    }

    /// Direction up haptic
    func directionUp() {
        WKInterfaceDevice.current().play(.directionUp)
    }

    /// Direction down haptic
    func directionDown() {
        WKInterfaceDevice.current().play(.directionDown)
    }

    /// Notification haptic for alerts
    func notification() {
        WKInterfaceDevice.current().play(.notification)
    }

    /// Retry haptic for retry actions
    func retry() {
        WKInterfaceDevice.current().play(.retry)
    }

    // MARK: - Custom Patterns

    /// Streak celebration pattern
    func celebrateStreak() {
        DispatchQueue.main.async {
            self.success()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                self.success()
            }
        }
    }

    /// Goal completed celebration
    func celebrateGoal() {
        DispatchQueue.main.async {
            self.success()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                self.directionUp()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.success()
            }
        }
    }

    /// Level up celebration
    func celebrateLevelUp() {
        DispatchQueue.main.async {
            self.notification()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.success()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.success()
            }
        }
    }
}
