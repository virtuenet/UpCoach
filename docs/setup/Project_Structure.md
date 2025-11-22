# Coach Up – AI Coach at Work

**Structured Project Architecture (Updated for Native & Google Integrations Only)**

---

## 🧠 1. Product Architecture Overview

### 1.1 Platforms & Deployment Targets

| Platform        | Description                                             |
| --------------- | ------------------------------------------------------- |
| **Mobile App**  | Flutter-based (iOS, Android, Tablets)                   |
| **Web Client**  | Responsive PWA + Public Website (landing page)          |
| **Admin Panel** | Internal dashboard for clients, plans, users, analytics |
| **CMS Panel**   | Controls content: microlearning, blogs, SEO, avatars    |

**Web Client Note:** The public website serves as a landing page to:

- Promote the UpCoach mobile apps with compelling visuals and brand messaging
- Showcase features, coaching experience, testimonials, and product highlights
- Embed demo videos of app interactions and onboarding experience
- Provide links to download UpCoach from the iOS App Store and Google Play Store

### Sample Wireframe and Content Block Structure for Landing Page

```
LandingPage
├── HeroSection
│   └── Headline, tagline, App Store + Play Store buttons, product image
├── FeaturesSection
│   └── 3–6 columns with icons + feature descriptions (e.g., AI Chat, Mood Tracker)
├── DemoSection
│   └── Embedded demo video carousel (chat, tasks, reports)
├── TestimonialsSection
│   └── Quotes from real users with avatar/image
├── HowItWorksSection
│   └── Step-by-step visual of onboarding → coaching → progress tracking
├── PricingSection
│   └── Free vs Pro vs Team (link to app for upgrade)
├── FAQSection
│   └── Expandable Q&A
├── Footer
│   └── App download links, contact, legal, social media
```

---

## 📲 2. Frontend Structure (Flutter – Mobile & Web)

### 2.1 Folder Structure

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

---

### 2.2 Navigation Flow

```
SplashScreen → Onboarding → HomeScreen
                         ├── CoachChatScreen
                         │    └── RolePlayScenario + FeedbackModal
                         ├── LiveCoachingNowScreen
                         ├── MyTasksScreen
                         ├── MoodTrackerScreen
                         ├── WeeklyProgressScreen
                         ├── LearningLibraryScreen
                         ├── UploadMeetingNotesScreen
                         └── AccountSettingsScreen
```

---

## 🤖 3. Core Functional Modules

| Module                           | Key Features                                                          |
| -------------------------------- | --------------------------------------------------------------------- |
| **Onboarding & Personalization** | Role/mood/goal-based setup, Google Sign-In                            |
| **AI Coach Interaction**         | Chat + voice/video + smart nudges, avatar tone                        |
| **Smart Input Uploader**         | Import from Drive, Device Notes, Photos, Audio                        |
| **Task & Goal Management**       | GPT task breakdown, milestone + calendar sync                         |
| **Self-Coaching Tools**          | Journaling, voice memos, mood trends                                  |
| **Progress & Reports**           | Weekly report to Google Docs/Sheets or PDF                            |
| **Microlearning Content**        | Video/audio/tip library with narration                                |
| **Wellness Tools**               | Burnout detection, mental health suggestions                          |
| **Live Coaching Now**            | Instantly start session, guided by AI coach (chat/voice hybrid)       |
| **Role-Play & Feedback**         | Scenario-based practice with post-feedback modal (voice + text score) |

### Optional UX Enhancements

- Tooltip “ℹ️ Why this?” explainers for each AI suggestion
- Coach Memory: stores past coaching references for context

---

## 🔗 4. Native Mobile Integrations

| Integration                  | Use Case                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| **Device Calendar**          | Sync sessions, nudges, milestones with offline support                |
| **Device Files**             | Upload MoM docs, images, PDFs                                         |
| **Voice Recorder**           | Record reflections, transcribe via Google Speech-to-Text              |
| **Notes App**                | Import thoughts from Apple Notes or Google Keep (via Share Extension) |
| **Camera Access**            | Whiteboard/photo upload + OCR                                         |
| **FaceID/TouchID**           | Secure app access and data deletion                                   |
| **Local Notifications**      | Nudges and reflection prompts without internet                        |
| **HealthKit/Fit (optional)** | Contextual awareness from sleep/stress data                           |

---

## 🔗 5. Google Workspace Integrations

| Google Feature           | Functionality                                           |
| ------------------------ | ------------------------------------------------------- |
| **Google Sign-In**       | OAuth2 login, profile import                            |
| **Google Calendar**      | Coaching sessions, task reminders, milestone sync       |
| **Google Docs**          | Export coaching plans, summaries, weekly reports        |
| **Google Sheets**        | Progress charts, task tables                            |
| **Google Drive**         | Import/upload MoMs, voice notes, journaling screenshots |
| **Speech-to-Text**       | Voice memo transcription                                |
| **Natural Language API** | Mood journaling analysis                                |

---

## 🛠️ 6. Admin & CMS Panel Design

| Panel           | Purpose                                                   |
| --------------- | --------------------------------------------------------- |
| **Admin Panel** | Manage users, tasks, plans, AI settings, escalation flags |
| **CMS Panel**   | Control website content, microlearning, avatars, SEO      |

---

## 🔐 7. Backend Infrastructure

| Backend Component      | Technology Used                | Features                                       |
| ---------------------- | ------------------------------ | ---------------------------------------------- |
| **Authentication**     | Supabase Auth + Google OAuth   | Email/password and Google login                |
| **Database & Storage** | Supabase Realtime + Storage    | Tasks, mood logs, voice notes, journal entries |
| **File Access**        | Supabase + Flutter File Picker | Offline/online support for uploads             |
| **Payment System**     | RevenueCat                     | Freemium, paywall, and plan management         |
| **Env Management**     | flutter_dotenv                 | Store API keys securely                        |

---

## ⚙️ 8. DevOps & CI/CD

| Tool               | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| **GitHub Actions** | Flutter test + deploy                              |
| **Fastlane**       | iOS/Android distribution via TestFlight/Play Store |
| **Secrets Mgmt**   | Google/Apple API keys, OAuth scopes                |

---

## 🔐 9. Security & Privacy

- GDPR & HIPAA readiness
- Role-based access control
- Encrypted cloud and local data
- Biometric authentication (optional)
- Google permission revocation panel
- Manual and automated data deletion flows
