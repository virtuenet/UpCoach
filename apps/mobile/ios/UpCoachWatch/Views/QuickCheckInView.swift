import SwiftUI

/// Quick check-in view for fast habit completion
struct QuickCheckInView: View {
    @EnvironmentObject var dataStore: HabitDataStore
    @EnvironmentObject var connectivity: WatchConnectivityManager

    @Environment(\.dismiss) private var dismiss
    @State private var completedHabits: Set<String> = []

    var pendingHabits: [HabitSummary] {
        dataStore.habits.filter { !$0.isCompletedToday && !completedHabits.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            if pendingHabits.isEmpty {
                // All done state
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.green)

                    Text("All Done!")
                        .font(.headline)

                    Text("You've completed all your habits for today")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    Button("Close") {
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .onAppear {
                    HapticService.shared.celebrateGoal()
                }
            } else {
                // Quick check-in list
                ScrollView {
                    VStack(spacing: 8) {
                        Text("\(pendingHabits.count) remaining")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        ForEach(pendingHabits) { habit in
                            QuickCheckInRow(habit: habit) {
                                completeHabit(habit)
                            }
                        }

                        // Complete all button
                        if pendingHabits.count > 1 {
                            Button(action: completeAll) {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("Complete All")
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.green)
                            .padding(.top, 8)
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .navigationTitle("Quick Check-In")
            }
        }
    }

    private func completeHabit(_ habit: HabitSummary) {
        withAnimation {
            completedHabits.insert(habit.id)
        }
        connectivity.completeHabit(habit.id)
    }

    private func completeAll() {
        for habit in pendingHabits {
            completeHabit(habit)
        }
        HapticService.shared.celebrateGoal()
    }
}

/// Quick check-in row with large tap target
struct QuickCheckInRow: View {
    let habit: HabitSummary
    let onComplete: () -> Void

    @State private var isPressed = false
    @State private var isCompleting = false

    var body: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                isCompleting = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                onComplete()
            }
        }) {
            HStack(spacing: 12) {
                // Emoji
                Text(habit.displayEmoji)
                    .font(.title2)

                // Habit name
                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.name)
                        .font(.caption)
                        .lineLimit(2)

                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 8))
                            .foregroundColor(.orange)
                        Text("\(habit.currentStreak) day streak")
                            .font(.system(size: 9))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Check button
                ZStack {
                    Circle()
                        .fill(isCompleting ? Color.green : Color.gray.opacity(0.3))
                        .frame(width: 36, height: 36)

                    if isCompleting {
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    } else {
                        Image(systemName: "circle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .scaleEffect(isCompleting ? 1.2 : 1.0)
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.gray.opacity(isPressed ? 0.2 : 0.1))
            )
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
        .disabled(isCompleting)
    }
}

#Preview {
    QuickCheckInView()
        .environmentObject(HabitDataStore.shared)
        .environmentObject(WatchConnectivityManager.shared)
}
