import SwiftUI

/// Streak display view showing current and best streaks
struct StreakView: View {
    @EnvironmentObject var dataStore: HabitDataStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Current streak (hero)
                    CurrentStreakCard(streak: dataStore.currentStreak)

                    // Stats grid
                    HStack(spacing: 8) {
                        StatCard(
                            title: "Best",
                            value: "\(dataStore.bestStreak)",
                            icon: "trophy.fill",
                            color: .yellow
                        )

                        StatCard(
                            title: "Week",
                            value: "\(Int(dataStore.weeklyProgress * 100))%",
                            icon: "calendar",
                            color: .blue
                        )
                    }

                    // Level and points
                    HStack(spacing: 8) {
                        StatCard(
                            title: "Level",
                            value: "\(dataStore.currentLevel)",
                            icon: "star.fill",
                            color: .purple
                        )

                        StatCard(
                            title: "Points",
                            value: formatPoints(dataStore.totalPoints),
                            icon: "bolt.fill",
                            color: .orange
                        )
                    }

                    // Last sync time
                    if let lastUpdated = dataStore.lastUpdated {
                        Text("Synced \(lastUpdated, style: .relative) ago")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal, 4)
            }
            .navigationTitle("Streak")
        }
    }

    private func formatPoints(_ points: Int) -> String {
        if points >= 1000 {
            return "\(points / 1000)k"
        }
        return "\(points)"
    }
}

/// Hero card for current streak
struct CurrentStreakCard: View {
    let streak: Int

    private var streakEmoji: String {
        switch streak {
        case 0: return "🌱"
        case 1...6: return "🔥"
        case 7...29: return "🔥🔥"
        case 30...99: return "🔥🔥🔥"
        default: return "⭐️"
        }
    }

    private var streakMessage: String {
        switch streak {
        case 0: return "Start your streak!"
        case 1: return "First day!"
        case 2...6: return "Keep it up!"
        case 7: return "One week!"
        case 8...13: return "Going strong!"
        case 14: return "Two weeks!"
        case 15...29: return "Incredible!"
        case 30: return "One month!"
        default: return "Amazing streak!"
        }
    }

    var body: some View {
        VStack(spacing: 4) {
            Text(streakEmoji)
                .font(.largeTitle)

            Text("\(streak)")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundColor(.orange)

            Text(streak == 1 ? "day" : "days")
                .font(.caption)
                .foregroundColor(.secondary)

            Text(streakMessage)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.orange.opacity(0.15))
        )
    }
}

/// Small stat card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(color)

            Text(value)
                .font(.headline)

            Text(title)
                .font(.system(size: 9))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.15))
        )
    }
}

#Preview {
    StreakView()
        .environmentObject(HabitDataStore.shared)
}
