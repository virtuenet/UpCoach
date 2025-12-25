import Flutter
import UIKit
import UserNotifications
import CoreML
import WatchConnectivity

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Register for push notifications
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }

    application.registerForRemoteNotifications()

    // Register Flutter plugins
    GeneratedPluginRegistrant.register(with: self)

    // Register widget method channels
    if let controller = window?.rootViewController as? FlutterViewController {
      WidgetMethodChannelHandler.shared.registerChannels(with: controller.binaryMessenger)
    }

    // Register On-Device LLM Plugin if present (optional dependency)
    if let registrar = self.registrar(forPlugin: "OnDeviceLLMPlugin"),
       let pluginClass = NSClassFromString("OnDeviceLLMPlugin") as? FlutterPlugin.Type {
      pluginClass.register(with: registrar)
    }

    // Register Watch Connectivity Plugin for Apple Watch support
    if let registrar = self.registrar(forPlugin: "WatchConnectivityPlugin") {
      WatchConnectivityPlugin.register(with: registrar)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Handle remote notification registration
  override func application(_ application: UIApplication,
                            didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Pass device token to Flutter
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(_ application: UIApplication,
                            didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // Handle background fetch
  override func application(_ application: UIApplication,
                            performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    completionHandler(.newData)
  }
}
