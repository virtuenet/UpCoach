import SwiftUI

/// Progress overview with habit breakdown
struct ProgressView: View {
    @EnvironmentObject var dataStore: HabitDataStore
    @EnvironmentObject var connectivity: WatchConnectivityManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    // Today's ring
                    TodayProgressRing(progress: dataStore.todayProgress)

                    // Weekly progress bar
                    WeeklyProgressBar(progress: dataStore.weeklyProgress)

                    // Habit breakdown by category
                    HabitBreakdownView(habits: dataStore.habits)

                    // Connection status
                    ConnectionStatusView(
                        isConnected: connectivity.isConnected,
                        isReachable: connectivity.isReachable
                    )
                }
                .padding(.horizontal, 4)
            }
            .navigationTitle("Progress")
        }
    }
}

/// Today's progress as a ring
struct TodayProgressRing: View {
    let progress: Double

    private var progressColor: Color {
        switch progress {
        case 0: return .gray
        case 0..<0.5: return .red
        case 0.5..<0.75: return .yellow
        case 0.75..<1: return .blue
        default: return .green
        }
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 8)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        progressColor,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.5, dampingFraction: 0.7), value: progress)

                VStack(spacing: 0) {
                    Text("\(Int(progress * 100))")
                        .font(.system(size: 32, weight: .bold, design: .rounded))

                    Text("%")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 80, height: 80)

            Text("Today")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

/// Weekly progress bar
struct WeeklyProgressBar: View {
    let progress: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("This Week")
                    .font(.caption)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))

                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.blue)
                        .frame(width: geo.size.width * progress)
                        .animation(.spring(response: 0.5), value: progress)
                }
            }
            .frame(height: 8)
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

/// Habit breakdown by category
struct HabitBreakdownView: View {
    let habits: [HabitSummary]

    private var categoryCounts: [(String, Int, Int)] {
        var categories: [String: (completed: Int, total: Int)] = [:]

        for habit in habits {
            let category = habit.category ?? "Other"
            var current = categories[category] ?? (0, 0)
            current.total += 1
            if habit.isCompletedToday {
                current.completed += 1
            }
            categories[category] = current
        }

        return categories.map { ($0.key, $0.value.completed, $0.value.total) }
            .sorted { $0.0 < $1.0 }
    }

    var body: some View {
        if !categoryCounts.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text("By Category")
                    .font(.caption)
                    .foregroundColor(.secondary)

                ForEach(categoryCounts, id: \.0) { category, completed, total in
                    HStack {
                        Text(category)
                            .font(.caption)
                            .lineLimit(1)

                        Spacer()

                        Text("\(completed)/\(total)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.1))
            )
        }
    }
}

/// Connection status indicator
struct ConnectionStatusView: View {
    let isConnected: Bool
    let isReachable: Bool

    private var statusColor: Color {
        if isReachable { return .green }
        if isConnected { return .yellow }
        return .red
    }

    private var statusText: String {
        if isReachable { return "Connected" }
        if isConnected { return "Background" }
        return "Offline"
    }

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)

            Text(statusText)
                .font(.system(size: 9))
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    ProgressView()
        .environmentObject(HabitDataStore.shared)
        .environmentObject(WatchConnectivityManager.shared)
}
