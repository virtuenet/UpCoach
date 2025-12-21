import SwiftUI
import WatchConnectivity

/// Main entry point for the UpCoach Apple Watch App
@main
struct UpCoachWatchApp: App {
    @StateObject private var connectivityManager = WatchConnectivityManager.shared
    @StateObject private var dataStore = HabitDataStore.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(connectivityManager)
                .environmentObject(dataStore)
        }
    }
}

/// Main content view with tab navigation
struct ContentView: View {
    @EnvironmentObject var dataStore: HabitDataStore

    var body: some View {
        TabView {
            HabitListView()
                .tag(0)

            StreakView()
                .tag(1)

            ProgressView()
                .tag(2)
        }
        .tabViewStyle(.page)
    }
}
