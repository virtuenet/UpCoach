import ActivityKit
import SwiftUI

// MARK: - Activity Attributes
@available(iOS 16.1, *)
struct HabitTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var habitName: String
        var progress: Double
        var completedCount: Int
        var totalCount: Int
        var timeRemaining: String
        var isCompleted: Bool
    }

    var habitId: String
    var habitIcon: String
    var startTime: Date
}

// MARK: - Dynamic Island Views
@available(iOS 16.2, *)
struct HabitTrackingActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: HabitTrackingAttributes.self) { context in
            // Lock screen/banner UI
            HStack {
                Image(systemName: context.attributes.habitIcon)
                    .foregroundColor(.blue)
                    .font(.system(size: 24))

                VStack(alignment: .leading, spacing: 4) {
                    Text(context.state.habitName)
                        .font(.headline)
                        .foregroundColor(.primary)

                    HStack(spacing: 8) {
                        ProgressView(value: context.state.progress)
                            .tint(.blue)
                            .frame(width: 100)

                        Text("\(Int(context.state.progress * 100))%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if !context.state.isCompleted {
                        Text("\(context.state.timeRemaining) remaining")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                if context.state.isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.system(size: 32))
                } else {
                    Text("\(context.state.completedCount)/\(context.state.totalCount)")
                        .font(.title2)
                        .fontWeight(.bold)
                }
            }
            .padding()
            .activityBackgroundTint(Color.cyan.opacity(0.25))
            .activitySystemActionForegroundColor(Color.blue)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Image(systemName: context.attributes.habitIcon)
                            .foregroundColor(.blue)
                            .font(.system(size: 28))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(context.state.habitName)
                                .font(.headline)
                            Text("\(context.state.completedCount) of \(context.state.totalCount)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isCompleted {
                        VStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.system(size: 36))
                            Text("Done!")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    } else {
                        VStack(alignment: .trailing, spacing: 4) {
                            Text("\(Int(context.state.progress * 100))%")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text(context.state.timeRemaining)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    // Empty center region
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        // Progress bar
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(height: 8)
                                    .cornerRadius(4)

                                Rectangle()
                                    .fill(
                                        LinearGradient(
                                            colors: [.blue, .purple],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: geometry.size.width * context.state.progress, height: 8)
                                    .cornerRadius(4)
                            }
                        }
                        .frame(height: 8)

                        // Action buttons
                        if !context.state.isCompleted {
                            HStack(spacing: 12) {
                                Link(destination: URL(string: "upcoach://habits/\(context.attributes.habitId)/checkin")!) {
                                    Label("Check In", systemImage: "checkmark.circle")
                                        .font(.caption)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(Color.blue)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                }

                                Link(destination: URL(string: "upcoach://habits/\(context.attributes.habitId)")!) {
                                    Label("View Details", systemImage: "info.circle")
                                        .font(.caption)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(Color.gray.opacity(0.2))
                                        .foregroundColor(.blue)
                                        .cornerRadius(8)
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
            } compactLeading: {
                // Compact leading (left side of notch)
                Image(systemName: context.attributes.habitIcon)
                    .foregroundColor(.blue)
            } compactTrailing: {
                // Compact trailing (right side of notch)
                if context.state.isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
            } minimal: {
                // Minimal (when multiple activities)
                if context.state.isCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Image(systemName: context.attributes.habitIcon)
                        .foregroundColor(.blue)
                }
            }
            .widgetURL(URL(string: "upcoach://habits/\(context.attributes.habitId)"))
            .keylineTint(Color.blue)
        }
    }
}

// MARK: - Activity Manager
@available(iOS 16.1, *)
class DynamicIslandActivityManager {
    static let shared = DynamicIslandActivityManager()

    private var currentActivity: Activity<HabitTrackingAttributes>?

    private init() {}

    /// Start tracking a habit in Dynamic Island
    func startTracking(
        habitId: String,
        habitName: String,
        habitIcon: String,
        totalCount: Int
    ) async throws {
        // End existing activity if any
        await endTracking()

        let attributes = HabitTrackingAttributes(
            habitId: habitId,
            habitIcon: habitIcon,
            startTime: Date()
        )

        let initialState = HabitTrackingAttributes.ContentState(
            habitName: habitName,
            progress: 0.0,
            completedCount: 0,
            totalCount: totalCount,
            timeRemaining: "Just started",
            isCompleted: false
        )

        let activity = try Activity.request(
            attributes: attributes,
            contentState: initialState,
            pushType: nil
        )

        currentActivity = activity
    }

    /// Update progress in Dynamic Island
    func updateProgress(
        completedCount: Int,
        totalCount: Int,
        timeRemaining: String
    ) async {
        guard let activity = currentActivity else { return }

        let progress = Double(completedCount) / Double(totalCount)
        let isCompleted = completedCount >= totalCount

        let updatedState = HabitTrackingAttributes.ContentState(
            habitName: activity.contentState.habitName,
            progress: progress,
            completedCount: completedCount,
            totalCount: totalCount,
            timeRemaining: timeRemaining,
            isCompleted: isCompleted
        )

        await activity.update(using: updatedState)

        // Auto-dismiss after completion
        if isCompleted {
            DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                Task {
                    await self.endTracking()
                }
            }
        }
    }

    /// End tracking (dismiss Dynamic Island)
    func endTracking() async {
        guard let activity = currentActivity else { return }

        await activity.end(
            using: activity.contentState,
            dismissalPolicy: .immediate
        )

        currentActivity = nil
    }

    /// Check if Live Activity is active
    var isActive: Bool {
        return currentActivity != nil
    }
}

// MARK: - Flutter Bridge Extension
extension DynamicIslandActivityManager {
    /// Start tracking from Flutter
    func startTrackingFromFlutter(arguments: [String: Any]) async throws {
        guard let habitId = arguments["habitId"] as? String,
              let habitName = arguments["habitName"] as? String,
              let habitIcon = arguments["habitIcon"] as? String,
              let totalCount = arguments["totalCount"] as? Int else {
            throw NSError(domain: "DynamicIsland", code: 400, userInfo: [
                NSLocalizedDescriptionKey: "Missing required parameters"
            ])
        }

        try await startTracking(
            habitId: habitId,
            habitName: habitName,
            habitIcon: habitIcon,
            totalCount: totalCount
        )
    }

    /// Update progress from Flutter
    func updateProgressFromFlutter(arguments: [String: Any]) async {
        guard let completedCount = arguments["completedCount"] as? Int,
              let totalCount = arguments["totalCount"] as? Int,
              let timeRemaining = arguments["timeRemaining"] as? String else {
            return
        }

        await updateProgress(
            completedCount: completedCount,
            totalCount: totalCount,
            timeRemaining: timeRemaining
        )
    }
}
