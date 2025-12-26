//
//  DynamicIslandController.swift
//  UpCoach (Phase 10)
//
//  Controls Dynamic Island and Live Activities for habit tracking
//

import Foundation
import ActivityKit
import SwiftUI

@available(iOS 16.1, *)
struct HabitTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var habitName: String
        var currentStreak: Int
        var progressPercentage: Double
        var estimatedCompletionTime: Date
        var isCompleted: Bool
    }
    
    var habitId: String
    var habitIcon: String
    var targetStreak: Int
}

@available(iOS 16.1, *)
class DynamicIslandController {
    static let shared = DynamicIslandController()
    private var currentActivity: Activity<HabitTrackingAttributes>?
    
    func startHabitTracking(
        habitId: String,
        habitName: String,
        habitIcon: String,
        currentStreak: Int,
        targetStreak: Int,
        estimatedCompletionTime: Date
    ) async throws {
        await stopHabitTracking()
        
        let attributes = HabitTrackingAttributes(
            habitId: habitId,
            habitIcon: habitIcon,
            targetStreak: targetStreak
        )
        
        let contentState = HabitTrackingAttributes.ContentState(
            habitName: habitName,
            currentStreak: currentStreak,
            progressPercentage: 0.0,
            estimatedCompletionTime: estimatedCompletionTime,
            isCompleted: false
        )
        
        let activity = try Activity<HabitTrackingAttributes>.request(
            attributes: attributes,
            contentState: contentState,
            pushType: nil
        )
        
        currentActivity = activity
    }
    
    func updateProgress(progressPercentage: Double) async {
        guard let activity = currentActivity else { return }
        var newState = activity.contentState
        newState.progressPercentage = progressPercentage
        await activity.update(using: newState)
    }
    
    func markHabitCompleted(newStreak: Int) async {
        guard let activity = currentActivity else { return }
        var newState = activity.contentState
        newState.isCompleted = true
        newState.currentStreak = newStreak
        newState.progressPercentage = 1.0
        await activity.update(using: newState)
    }
    
    func stopHabitTracking() async {
        await currentActivity?.end(dismissalPolicy: .immediate)
        currentActivity = nil
    }
}
