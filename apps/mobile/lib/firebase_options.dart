// File generated based on GoogleService-Info.plist configuration
// Firebase project: upcoach-app

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web - '
        'you can reconfigure this by running the FlutterFire CLI again.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyB3IO4XLVAQCOEbSftlk1jBULVpyIVMea8',
    appId: '1:124884344902:ios:659bd43ee31ba12c25aa47',
    messagingSenderId: '124884344902',
    projectId: 'upcoach-app',
    storageBucket: 'upcoach-app.firebasestorage.app',
    iosBundleId: 'com.upcoach.upcoachMobile',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDsMXIvXsUTKQW1L_FMqbKnDyMfx1hjqrw',
    appId: '1:124884344902:android:e4ff4ea24d62345b25aa47',
    messagingSenderId: '124884344902',
    projectId: 'upcoach-app',
    storageBucket: 'upcoach-app.firebasestorage.app',
  );

  // TODO: Add Android configuration when google-services.json is available
}