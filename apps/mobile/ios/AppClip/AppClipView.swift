import SwiftUI
import StoreKit

/// App Clip entry view
///
/// Lightweight version of the app for quick habit tracking via QR code
@main
struct AppClipApp: App {
    @StateObject private var appClipManager = AppClipManager()

    var body: some Scene {
        WindowGroup {
            AppClipContentView()
                .environmentObject(appClipManager)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { userActivity in
                    guard let incomingURL = userActivity.webpageURL else { return }
                    appClipManager.handleIncomingURL(incomingURL)
                }
        }
    }
}

/// Main App Clip view
struct AppClipContentView: View {
    @EnvironmentObject var manager: AppClipManager
    @State private var showSuccessAnimation = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [.blue, .purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            if manager.isLoading {
                LoadingView()
            } else if let habit = manager.habitToTrack {
                HabitCheckInView(habit: habit, onCheckIn: {
                    Task {
                        await manager.checkInHabit()
                        showSuccessAnimation = true
                    }
                })
            } else {
                ErrorView(message: "Invalid QR code")
            }

            if showSuccessAnimation {
                SuccessAnimationView()
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .overlay(alignment: .bottom) {
            AppStoreOverlayView()
        }
    }
}

/// Habit check-in view
struct HabitCheckInView: View {
    let habit: HabitInfo
    let onCheckIn: () -> Void

    @State private var notes: String = ""

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Habit icon
            Image(systemName: habit.icon)
                .font(.system(size: 72))
                .foregroundColor(.white)
                .padding(.bottom, 8)

            // Habit name
            Text(habit.name)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)

            Text("Quick Check-In")
                .font(.headline)
                .foregroundColor(.white.opacity(0.8))

            // Optional notes
            TextField("Add a note (optional)", text: $notes)
                .padding()
                .background(Color.white.opacity(0.2))
                .cornerRadius(12)
                .foregroundColor(.white)
                .padding(.horizontal, 32)

            // Check-in button
            Button(action: onCheckIn) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 24))
                    Text("Check In")
                        .font(.system(size: 20, weight: .semibold))
                }
                .foregroundColor(.blue)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.white)
                .cornerRadius(16)
            }
            .padding(.horizontal, 32)

            Spacer()

            // Streak info
            if habit.currentStreak > 0 {
                HStack(spacing: 4) {
                    Text("🔥")
                        .font(.system(size: 20))
                    Text("\(habit.currentStreak) day streak")
                        .font(.headline)
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.2))
                .cornerRadius(12)
            }

            Spacer()
        }
    }
}

/// Success animation overlay
struct SuccessAnimationView: View {
    @State private var scale: CGFloat = 0.5
    @State private var opacity: Double = 0

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 100))
                .foregroundColor(.green)
                .scaleEffect(scale)
                .opacity(opacity)

            Text("Checked In!")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .opacity(opacity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.3))
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                scale = 1.0
                opacity = 1.0
            }
        }
    }
}

/// Loading view
struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.white)

            Text("Loading...")
                .foregroundColor(.white)
        }
    }
}

/// Error view
struct ErrorView: View {
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 64))
                .foregroundColor(.yellow)

            Text(message)
                .font(.headline)
                .foregroundColor(.white)
        }
    }
}

/// App Store overlay (encourages full app download)
struct AppStoreOverlayView: View {
    @State private var showOverlay = false

    var body: some View {
        VStack {
            if showOverlay {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Get the full app")
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text("Track all your habits and more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button("Download") {
                        // SKOverlay will be triggered
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(16)
                .shadow(radius: 10)
                .padding()
            }
        }
        .onAppear {
            // Show overlay after 2 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                showOverlay = true
                presentAppStoreOverlay()
            }
        }
    }

    private func presentAppStoreOverlay() {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            return
        }

        let configuration = SKOverlay.AppClipConfiguration(position: .bottom)
        let overlay = SKOverlay(configuration: configuration)
        overlay.present(in: scene)
    }
}

/// App Clip manager
class AppClipManager: ObservableObject {
    @Published var isLoading = true
    @Published var habitToTrack: HabitInfo?

    func handleIncomingURL(_ url: URL) {
        // Parse URL like: https://upcoach.app/clips/habits/morning-workout
        let pathComponents = url.pathComponents

        guard pathComponents.count >= 4,
              pathComponents[1] == "clips",
              pathComponents[2] == "habits" else {
            isLoading = false
            return
        }

        let habitId = pathComponents[3]

        // Fetch habit info from API or local storage
        Task {
            await fetchHabitInfo(habitId: habitId)
        }
    }

    func fetchHabitInfo(habitId: String) async {
        // Simulate API call
        try? await Task.sleep(nanoseconds: 1_000_000_000)

        // In production, fetch from API
        habitToTrack = HabitInfo(
            id: habitId,
            name: habitId.replacingOccurrences(of: "-", with: " ").capitalized,
            icon: "figure.run",
            currentStreak: 7
        )

        isLoading = false
    }

    func checkInHabit() async {
        // Save to shared app group for main app to sync
        if let userDefaults = UserDefaults(suiteName: "group.com.upcoach.app"),
           let habit = habitToTrack {
            let key = "appclip_checkin_\(habit.id)"
            userDefaults.set(Date(), forKey: key)
            userDefaults.synchronize()
        }

        // In production, also call API
        try? await Task.sleep(nanoseconds: 500_000_000)
    }
}

/// Habit information
struct HabitInfo: Identifiable {
    let id: String
    let name: String
    let icon: String
    let currentStreak: Int
}
