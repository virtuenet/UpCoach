## Screenshot Templates for App Stores

Templates and guidelines for creating consistent, high-quality screenshots for iOS App Store and
Google Play Store.

---

## Screenshot Order & Content

### Screenshot 1: Home Dashboard

**Title:** "Your Personal Growth Dashboard"

**Content:**

- Home screen showing stats summary
- Active goals (2-3 visible)
- Today's habits (3-4 visible)
- Greeting with user name
- Current streak badge

**Key Elements to Highlight:**

- Clean, organized interface
- Key metrics at a glance
- Visual progress indicators

**Text Overlay:**

```
Your Personal Growth Dashboard
Track goals, build habits, and achieve more
```

---

### Screenshot 2: Habit Tracking

**Title:** "Build Lasting Habits"

**Content:**

- Habit list with various streaks
- Mix of completed and pending habits
- Streak badges (7-day, 30-day milestones)
- Different habit frequencies (daily, weekly)
- Add habit button visible

**Key Elements to Highlight:**

- Streak tracking
- Visual completion status
- Easy habit creation

**Text Overlay:**

```
Build Lasting Habits
Track daily routines and celebrate streaks
```

---

### Screenshot 3: Goal Progress

**Title:** "Achieve Your Goals"

**Content:**

- Goal detail page or goal creation screen
- Progress bar showing 60-70% completion
- Milestones with checkmarks
- Target date visible
- Notes/description

**Key Elements to Highlight:**

- Visual progress tracking
- Milestone achievements
- Goal categories

**Text Overlay:**

```
Achieve Your Goals
Set targets, track progress, celebrate wins
```

---

### Screenshot 4: AI Coaching

**Title:** "AI-Powered Insights"

**Content:**

- AI coach interface with conversation
- 2-3 personalized insights
- Motivational message
- Suggested action items
- Coach avatar/icon

**Key Elements to Highlight:**

- Personalized recommendations
- Conversational interface
- Actionable insights

**Text Overlay:**

```
AI-Powered Insights
Get personalized coaching tailored to you
```

---

### Screenshot 5: Analytics & Reports

**Title:** "Track Your Progress"

**Content:**

- Weekly/monthly analytics dashboard
- Chart showing progress over time
- Habit completion heatmap
- Goal completion stats
- Export button visible

**Key Elements to Highlight:**

- Beautiful visualizations
- Detailed analytics
- Progress trends

**Text Overlay:**

```
Track Your Progress
Beautiful insights into your growth journey
```

---

## Design Specifications

### Background

**Option 1: Gradient**

```
Top: #667eea (Purple)
Bottom: #764ba2 (Darker Purple)
Opacity: 100%
```

**Option 2: Solid Color**

```
Background: #FFFFFF (White)
Use for light, clean look
```

**Option 3: Brand Gradient**

```
Top: Brand Primary Color
Bottom: Brand Secondary Color
```

### Text Styling

**Title Text:**

- Font: SF Pro Display (iOS) / Roboto (Android)
- Size: 48px
- Weight: Bold (700)
- Color: #FFFFFF (if dark background) or #1a1a1a (if light)
- Letter Spacing: -0.5px

**Subtitle Text:**

- Font: SF Pro Text (iOS) / Roboto (Android)
- Size: 24px
- Weight: Medium (500)
- Color: rgba(255,255,255,0.9) or rgba(26,26,26,0.8)
- Letter Spacing: 0px

### Device Frame

**Recommended:**

- Use clean, minimal device frame
- Match target device (iPhone 14 Pro, Pixel 7, etc.)
- Shadow: 0px 20px 40px rgba(0,0,0,0.2)

**Frame Color:**

- Black device frame for dark UI screenshots
- White device frame for light UI screenshots
- Or: Use frameless (screenshot only)

### Layout

```
┌────────────────────────────────┐
│  50px padding                  │
│                                │
│  ┌──────────────────────┐      │
│  │  TITLE TEXT          │      │ 80px from top
│  └──────────────────────┘      │
│                                │
│  ┌──────────────────────┐      │
│  │  Subtitle text       │      │ 20px below title
│  └──────────────────────┘      │
│                                │
│      60px spacing              │
│                                │
│  ┌──────────────────────┐      │
│  │                      │      │
│  │                      │      │
│  │   DEVICE FRAME       │      │ Centered
│  │   with Screenshot    │      │
│  │                      │      │
│  │                      │      │
│  └──────────────────────┘      │
│                                │
│  100px padding                 │
└────────────────────────────────┘
```

---

## Export Settings

### For iOS

**iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max):**

- Resolution: 1290 x 2796 pixels
- Format: PNG
- Color Profile: sRGB
- DPI: 72

**iPhone 6.5" (iPhone 11 Pro Max, XS Max):**

- Resolution: 1242 x 2688 pixels
- Format: PNG
- Color Profile: sRGB
- DPI: 72

**iPhone 5.5" (iPhone 8 Plus):**

- Resolution: 1242 x 2208 pixels
- Format: PNG
- Color Profile: sRGB
- DPI: 72

**iPad Pro 12.9":**

- Resolution: 2048 x 2732 pixels
- Format: PNG
- Color Profile: sRGB
- DPI: 72

### For Android

**Phone (Standard):**

- Resolution: 1080 x 1920 pixels (minimum)
- Recommended: 1440 x 2560 pixels
- Format: PNG or JPEG
- Quality: 90% (if JPEG)

**7" Tablet:**

- Resolution: 1200 x 1920 pixels (minimum)
- Format: PNG or JPEG
- Quality: 90% (if JPEG)

**10" Tablet:**

- Resolution: 1600 x 2560 pixels (minimum)
- Format: PNG or JPEG
- Quality: 90% (if JPEG)

---

## Figma Template Structure

### Frames Setup

```
UpCoach Screenshots
├── iOS
│   ├── iPhone 6.7"
│   │   ├── 01 Home Dashboard
│   │   ├── 02 Habit Tracking
│   │   ├── 03 Goal Progress
│   │   ├── 04 AI Coaching
│   │   └── 05 Analytics
│   ├── iPhone 6.5"
│   │   └── [Same as above]
│   └── iPad Pro 12.9"
│       └── [3 screenshots]
└── Android
    ├── Phone
    │   ├── 01 Home Dashboard
    │   ├── 02 Habit Tracking
    │   ├── 03 Goal Progress
    │   ├── 04 AI Coaching
    │   └── 05 Analytics
    └── Tablet
        └── [Optional]
```

### Components

Create reusable components for:

- Background gradient
- Text styles (Title, Subtitle)
- Device frames
- Shadow effects

---

## Screenshot Capture Workflow

### Option 1: Design in Figma (Recommended)

1. **Setup:**
   - Import actual app screenshots
   - Place in device mockups
   - Add background and text overlays

2. **Design:**
   - Apply consistent styling
   - Ensure text is readable
   - Check contrast ratios

3. **Export:**
   - Use Figma export feature
   - Export at correct resolutions
   - Organize files by platform

### Option 2: Automated Flutter Screenshots

```dart
// integration_test/screenshots_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Capture screenshots', (tester) async {
    // Load app
    await tester.pumpWidget(MyApp());
    await tester.pumpAndSettle();

    // 1. Home Dashboard
    await binding.takeScreenshot('01-home-dashboard');

    // 2. Navigate to habits
    await tester.tap(find.text('Habits'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('02-habit-tracking');

    // 3. Navigate to goals
    await tester.tap(find.text('Goals'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('03-goal-progress');

    // 4. AI Coaching
    await tester.tap(find.text('AI Coach'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('04-ai-coaching');

    // 5. Analytics
    await tester.tap(find.text('Analytics'));
    await tester.pumpAndSettle();
    await binding.takeScreenshot('05-analytics');
  });
}
```

**Run:**

```bash
flutter drive \
  --driver=test_driver/integration_test.dart \
  --target=integration_test/screenshots_test.dart \
  --screenshot-path=screenshots/
```

### Option 3: Manual Capture + Framing

1. **Capture:**
   - Use device/simulator screenshots
   - Capture at highest resolution
   - Ensure consistent UI state

2. **Frame:**
   - Use online tools:
     - https://screenshots.pro/
     - https://www.appstorescreenshot.com/
     - https://shotbot.io/
   - Or use Figma/Sketch templates

3. **Add Text:**
   - Import framed screenshots
   - Add title and subtitle overlays
   - Export final versions

---

## Quality Checklist

Before uploading screenshots:

- [ ] All text is readable (no blurry fonts)
- [ ] Screenshots show actual app UI (no mockups/placeholders)
- [ ] No personal/sensitive information visible
- [ ] Consistent styling across all screenshots
- [ ] Correct resolutions for each platform
- [ ] File names are descriptive and ordered
- [ ] Screenshots exported in correct format (PNG for iOS)
- [ ] All required sizes created
- [ ] Screenshots reviewed on actual devices
- [ ] Text overlays don't obscure important UI
- [ ] Color contrast meets accessibility standards
- [ ] Screenshots show key features clearly
- [ ] No copyrighted content (music, photos, etc.)

---

## A/B Testing

After initial launch, consider testing:

**Variation 1: Feature-Focused**

- Emphasize specific features in each screenshot
- Use detailed descriptions
- Show UI in context

**Variation 2: Benefit-Focused**

- Lead with user benefits
- Use testimonial quotes
- Show results/outcomes

**Variation 3: Minimal**

- Clean, simple designs
- Less text overlay
- Focus on beautiful UI

**Track Metrics:**

- App page views
- Install conversion rate
- Screenshot scroll-through rate
- Which screenshots users view most

**Tools:**

- App Store Connect Analytics
- Google Play Console Experiments
- Third-party ASO tools

---

## Maintenance Schedule

**Monthly:**

- [ ] Review screenshot performance
- [ ] Check for outdated UI (after app updates)
- [ ] Update seasonal promotions

**Quarterly:**

- [ ] A/B test new screenshot variations
- [ ] Update feature callouts based on user feedback
- [ ] Refresh testimonials

**Per Major Release:**

- [ ] Update screenshots to reflect new UI
- [ ] Add screenshots for new features
- [ ] Re-capture all sizes
- [ ] Test on new devices

---

**Template Files:**

- Figma: [Link to Figma template]
- PSD: [Link to Photoshop template]
- Sketch: [Link to Sketch template]

**Contact:** design@upcoach.app
