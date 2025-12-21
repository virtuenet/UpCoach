import SwiftUI

/// Main habit list view for quick check-ins
struct HabitListView: View {
    @EnvironmentObject var dataStore: HabitDataStore
    @EnvironmentObject var connectivity: WatchConnectivityManager

    @State private var showingCompletedHabits = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    // Today's progress header
                    ProgressHeaderView(
                        completed: dataStore.todayCompletedCount,
                        total: dataStore.todayTotalCount,
                        progress: dataStore.todayProgress
                    )

                    // Pending habits section
                    if !dataStore.pendingHabits.isEmpty {
                        ForEach(dataStore.pendingHabits) { habit in
                            HabitRowView(habit: habit, isCompleted: false) {
                                connectivity.completeHabit(habit.id)
                            }
                        }
                    } else if dataStore.habits.isEmpty {
                        EmptyStateView()
                    } else {
                        AllDoneView()
                    }

                    // Show completed toggle
                    if !dataStore.completedHabits.isEmpty {
                        Button(action: {
                            withAnimation {
                                showingCompletedHabits.toggle()
                            }
                            HapticService.shared.click()
                        }) {
                            HStack {
                                Image(systemName: showingCompletedHabits ? "chevron.down" : "chevron.right")
                                    .font(.caption)
                                Text("Completed (\(dataStore.completedHabits.count))")
                                    .font(.caption)
                                Spacer()
                            }
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 4)
                        }
                        .buttonStyle(.plain)

                        if showingCompletedHabits {
                            ForEach(dataStore.completedHabits) { habit in
                                HabitRowView(habit: habit, isCompleted: true) {
                                    connectivity.uncompleteHabit(habit.id)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 4)
            }
            .navigationTitle("Habits")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        connectivity.requestSync()
                        HapticService.shared.click()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
    }
}

/// Progress header showing today's completion status
struct ProgressHeaderView: View {
    let completed: Int
    let total: Int
    let progress: Double

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 4)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        progress == 1 ? Color.green : Color.blue,
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut, value: progress)

                VStack(spacing: 0) {
                    Text("\(completed)")
                        .font(.title2.bold())
                    Text("of \(total)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 60, height: 60)

            if progress == 1 {
                Text("All Done!")
                    .font(.caption)
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 4)
    }
}

/// Single habit row with tap to complete
struct HabitRowView: View {
    let habit: HabitSummary
    let isCompleted: Bool
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                // Emoji or checkmark
                ZStack {
                    Circle()
                        .fill(isCompleted ? Color.green : Color.gray.opacity(0.3))
                        .frame(width: 32, height: 32)

                    if isCompleted {
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    } else {
                        Text(habit.displayEmoji)
                            .font(.caption)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.caption)
                        .foregroundColor(isCompleted ? .secondary : .primary)
                        .lineLimit(1)

                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 8))
                            .foregroundColor(.orange)
                        Text("\(habit.currentStreak)")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Streak indicator
                if habit.currentStreak >= 7 {
                    Image(systemName: "star.fill")
                        .font(.caption2)
                        .foregroundColor(.yellow)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(isPressed ? 0.2 : 0.1))
            )
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

/// Empty state when no habits exist
struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "list.bullet.clipboard")
                .font(.largeTitle)
                .foregroundColor(.secondary)

            Text("No Habits")
                .font(.headline)

            Text("Add habits in the app")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 20)
    }
}

/// All done celebration view
struct AllDoneView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 40))
                .foregroundColor(.green)

            Text("All Done!")
                .font(.headline)

            Text("Great job today!")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 20)
        .onAppear {
            HapticService.shared.celebrateGoal()
        }
    }
}

#Preview {
    HabitListView()
        .environmentObject(HabitDataStore.shared)
        .environmentObject(WatchConnectivityManager.shared)
}
