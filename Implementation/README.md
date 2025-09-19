# UpCoach Mobile App – README

## 📱 Overview
The UpCoach Mobile App is a Flutter-based coaching assistant designed to deliver AI-powered guidance, mood tracking, and personalized coaching experiences. This app supports Android, iOS, and tablet platforms with full offline capabilities and native integrations. It connects seamlessly with Supabase (Auth, Realtime, Storage) and RevenueCat for billing.

---

## 🚀 Features
- 🎯 Role-based onboarding & mood tracking
- 🤖 AI Coach with text/voice/video interaction
- ✅ Task extraction from uploads (PDF, voice, whiteboard)
- 🔄 Google & Native Calendar sync
- 🧘 Wellness tools and burnout detection
- 📊 Weekly progress reports (Docs/Sheets)
- 📚 Learning Library with offline access
- 🎭 Role-play with feedback modal (voice/text scoring)
- 🎤 Live Coaching Now: instant session with avatar

---

## 📂 Folder Structure (`/lib`)
```
lib/
├── main.dart
├── app.dart                      # Routing, Theme, AppWidget
├── core/                         # Shared resources
│   ├── constants/
│   ├── utils/
│   ├── theme/
│   └── extensions/
├── features/                     # Modular features
│   ├── splash/
│   ├── onboarding/
│   ├── auth/
│   ├── home/
│   ├── coach_chat/
│   │   ├── role_play/
│   │   └── feedback/
│   ├── tasks/
│   ├── mood_tracker/
│   ├── weekly_progress/
│   ├── learning_library/
│   ├── upload_notes/
│   └── settings/
├── models/                      # Shared domain models
├── services/                    # Supabase, RevenueCat, Calendar, etc.
├── repositories/                # Data abstraction layer
├── usecases/                    # Business logic
├── widgets/                     # Reusable global widgets

project_root/
├── assets/
│   ├── images/
│   ├── fonts/
├── .env.example                 # For flutter_dotenv
├── pubspec.yaml
├── test/
│   ├── onboarding/
│   ├── coach_chat/
│   ├── mood_tracker/
│   ├── tasks/
│   ├── weekly_progress/
│   ├── learning_library/
│   ├── upload_notes/
│   └── settings/
├── android/
│   └── fastlane/
├── ios/
│   └── fastlane/
├── .github/
│   └── workflows/
│       ├── build.yml
│       └── lint.yml
```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   ├── utils/
│   ├── theme/
│   └── extensions/
├── features/
│   ├── splash/
│   ├── onboarding/
│   ├── auth/
│   ├── home/
│   ├── coach_chat/
│   │   ├── role_play/
│   │   └── feedback/
│   ├── tasks/
│   ├── mood_tracker/
│   ├── weekly_progress/
│   ├── learning_library/
│   ├── upload_notes/
│   └── settings/
├── models/
├── services/
├── repositories/
├── usecases/
├── widgets/
```

---

## 🧪 Testing Structure
```
test/
├── onboarding/
├── coach_chat/
├── mood_tracker/
├── tasks/
├── weekly_progress/
├── learning_library/
├── upload_notes/
└── settings/
```

---

## 🧩 Native Integrations
- Device Calendar (EventKit / CalendarContract)
- File Picker for documents/images/audio
- Notes import (Share Extension)
- Camera + OCR
- FaceID/TouchID for journal security
- Local notifications
- HealthKit / Google Fit (optional)

---

## 🔐 Google Integrations
- Google Sign-In (OAuth2)
- Google Calendar API
- Google Docs / Sheets export
- Google Drive upload
- Google Speech-to-Text
- Google NLP (Mood analysis)

---

## 📲 Installation
```bash
git clone https://github.com/upcoach/mobile-app.git
cd mobile-app
flutter pub get
cp .env.example .env
flutter run
```

---

## ⚙️ Environment Variables (`.env`)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
REVENUECAT_API_KEY=
```

---

## 🛠 CI/CD
- GitHub Actions: Test + Build
- Fastlane: Deploy to App Store & Play Store

---

## 🛡 Security
- Role-based access
- Biometric auth
- Data encryption
- GDPR / HIPAA readiness
- Manual & automated deletion flows

---

## 📦 Distribution
- ✅ iOS App Store (via Fastlane/TestFlight)
- ✅ Google Play Store (via Fastlane/Console)
- Optional: Generate QR code links and App Store badges for marketing pages (via Fastlane/Console)

---

## 🤝 Contributors
This app is built and maintained by the UpCoach team.

---

## 📧 Support
Email: support@upcoach.ai  
Website: [www.upcoach.ai](https://www.upcoach.ai)
