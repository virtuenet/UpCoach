//
//  AppClip.swift
//  UpCoach App Clip (Phase 10 Week 4)
//
//  Lightweight experience for QR code habit check-ins
//  Size target: <15 MB
//

import SwiftUI
import AVFoundation

@main
struct UpCoachAppClip: App {
    var body: some Scene {
        WindowGroup {
            AppClipContentView()
        }
    }
}

struct AppClipContentView: View {
    @StateObject private var viewModel = AppClipViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)

                    Text("Quick Habit Check-In")
                        .font(.title2)
                        .fontWeight(.bold)

                    Text("Scan QR code or enter habit ID")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)

                Spacer()

                // Main content
                if viewModel.isScanning {
                    QRCodeScannerView(viewModel: viewModel)
                        .frame(height: 300)
                        .cornerRadius(12)
                        .padding(.horizontal)
                } else if viewModel.checkInSuccess {
                    CheckInSuccessView(habitName: viewModel.habitName, streak: viewModel.streak)
                } else {
                    ManualEntryView(viewModel: viewModel)
                }

                Spacer()

                // Action buttons
                VStack(spacing: 12) {
                    if !viewModel.checkInSuccess {
                        Button(action: {
                            viewModel.toggleScanner()
                        }) {
                            HStack {
                                Image(systemName: viewModel.isScanning ? "keyboard" : "qrcode.viewfinder")
                                Text(viewModel.isScanning ? "Enter Manually" : "Scan QR Code")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }

                    // App Store card
                    AppStoreOverlay(habitName: viewModel.habitName)
                }
                .padding(.horizontal)
                .padding(.bottom, 20)
            }
            .navigationBarHidden(true)
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(viewModel.errorMessage)
            }
        }
        .onAppear {
            viewModel.handleInvocationURL()
        }
    }
}

// MARK: - QR Code Scanner View
struct QRCodeScannerView: View {
    @ObservedObject var viewModel: AppClipViewModel

    var body: some View {
        ZStack {
            QRCodeScannerRepresentable(viewModel: viewModel)

            // Scanning overlay
            VStack {
                Spacer()
                Text("Point camera at QR code")
                    .padding()
                    .background(Color.black.opacity(0.7))
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .padding(.bottom, 20)
            }
        }
    }
}

struct QRCodeScannerRepresentable: UIViewControllerRepresentable {
    @ObservedObject var viewModel: AppClipViewModel

    func makeUIViewController(context: Context) -> QRCodeScannerViewController {
        let controller = QRCodeScannerViewController()
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: QRCodeScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel)
    }

    class Coordinator: NSObject, QRCodeScannerDelegate {
        let viewModel: AppClipViewModel

        init(viewModel: AppClipViewModel) {
            self.viewModel = viewModel
        }

        func didScanQRCode(_ code: String) {
            viewModel.processQRCode(code)
        }
    }
}

protocol QRCodeScannerDelegate: AnyObject {
    func didScanQRCode(_ code: String)
}

class QRCodeScannerViewController: UIViewController {
    weak var delegate: QRCodeScannerDelegate?
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }

    private func setupCamera() {
        captureSession = AVCaptureSession()

        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
        let videoInput: AVCaptureDeviceInput

        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            return
        }

        if (captureSession?.canAddInput(videoInput) ?? false) {
            captureSession?.addInput(videoInput)
        }

        let metadataOutput = AVCaptureMetadataOutput()

        if (captureSession?.canAddOutput(metadataOutput) ?? false) {
            captureSession?.addOutput(metadataOutput)

            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        }

        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession!)
        previewLayer!.frame = view.layer.bounds
        previewLayer!.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer!)

        DispatchQueue.global(qos: .userInitiated).async {
            self.captureSession?.startRunning()
        }
    }
}

extension QRCodeScannerViewController: AVCaptureMetadataOutputObjectsDelegate {
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           let stringValue = metadataObject.stringValue {
            captureSession?.stopRunning()
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            delegate?.didScanQRCode(stringValue)
        }
    }
}

// MARK: - Manual Entry View
struct ManualEntryView: View {
    @ObservedObject var viewModel: AppClipViewModel

    var body: some View {
        VStack(spacing: 16) {
            TextField("Habit ID", text: $viewModel.habitIdInput)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .padding(.horizontal)

            Button(action: {
                viewModel.checkInHabit()
            }) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Check In")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.habitIdInput.isEmpty ? Color.gray : Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(viewModel.habitIdInput.isEmpty)
            .padding(.horizontal)
        }
    }
}

// MARK: - Success View
struct CheckInSuccessView: View {
    let habitName: String
    let streak: Int

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)

            Text("✅ Checked In!")
                .font(.title)
                .fontWeight(.bold)

            Text(habitName)
                .font(.title3)
                .foregroundColor(.secondary)

            HStack(spacing: 4) {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                Text("\(streak) day streak")
                    .font(.headline)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .background(Color.orange.opacity(0.2))
            .cornerRadius(20)
        }
    }
}

// MARK: - App Store Overlay
struct AppStoreOverlay: View {
    let habitName: String

    var body: some View {
        VStack(spacing: 12) {
            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Get the full UpCoach app")
                        .font(.headline)
                    Text("Track all your habits and goals")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: {
                    openAppStore()
                }) {
                    Text("Get")
                        .fontWeight(.semibold)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(20)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(radius: 2)
        }
    }

    private func openAppStore() {
        // Open App Store listing
        if let url = URL(string: "https://apps.apple.com/app/upcoach/id1234567890") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - View Model
@MainActor
class AppClipViewModel: ObservableObject {
    @Published var isScanning = false
    @Published var habitIdInput = ""
    @Published var habitName = ""
    @Published var streak = 0
    @Published var checkInSuccess = false
    @Published var showError = false
    @Published var errorMessage = ""

    func handleInvocationURL() {
        // Handle App Clip invocation URL
        // Format: https://upcoach.app/clip?habit=abc123
        guard let url = NSUserActivity.current?.webpageURL,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              let habitId = components.queryItems?.first(where: { $0.name == "habit" })?.value else {
            return
        }

        habitIdInput = habitId
        checkInHabit()
    }

    func toggleScanner() {
        isScanning.toggle()
    }

    func processQRCode(_ code: String) {
        // QR code format: upcoach://habit/abc123
        if let habitId = code.split(separator: "/").last {
            habitIdInput = String(habitId)
            isScanning = false
            checkInHabit()
        }
    }

    func checkInHabit() {
        guard !habitIdInput.isEmpty else { return }

        // Simulate API call (in production, this would call the backend)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let success = self.recordCheckIn(habitId: self.habitIdInput)

            if success {
                self.checkInSuccess = true
                // Haptic feedback
                let generator = UINotificationFeedbackGenerator()
                generator.notificationOccurred(.success)
            } else {
                self.showError = true
                self.errorMessage = "Failed to check in. Please try again."
            }
        }
    }

    private func recordCheckIn(habitId: String) -> Bool {
        // Record check-in to UserDefaults (shared with main app via App Group)
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.upcoach.mobile") else {
            return false
        }

        let timestamp = Date()
        let checkInData: [String: Any] = [
            "habitId": habitId,
            "timestamp": timestamp.timeIntervalSince1970,
            "source": "app_clip"
        ]

        // Store check-in
        var checkIns = sharedDefaults.array(forKey: "app_clip_check_ins") as? [[String: Any]] ?? []
        checkIns.append(checkInData)
        sharedDefaults.set(checkIns, forKey: "app_clip_check_ins")

        // Update UI data
        self.habitName = sharedDefaults.string(forKey: "habit_\(habitId)_name") ?? "Daily Habit"
        self.streak = sharedDefaults.integer(forKey: "habit_\(habitId)_streak") + 1

        // Update streak
        sharedDefaults.set(self.streak, forKey: "habit_\(habitId)_streak")
        sharedDefaults.synchronize()

        return true
    }
}
