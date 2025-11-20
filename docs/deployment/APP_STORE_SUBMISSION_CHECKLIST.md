# App Store Submission Checklist

**Purpose:** Complete checklist for submitting UpCoach to Apple App Store and Google Play Store
**Timeline:** Week 4 of Phase 5
**Goal:** Get both apps approved and published

---

## Overview

This checklist ensures you've completed all requirements before submitting to app stores. Both Apple and Google have strict review processes that can take 1-7 days.

### Timeline Expectations

| Store | Initial Review | Updates | Approval Rate |
|-------|---------------|---------|---------------|
| Apple App Store | 24-48 hours | 24 hours | ~80% first try |
| Google Play Store | 1-7 days | 1-3 days | ~90% first try |

---

## Pre-Submission Requirements (Both Platforms)

### ✅ App Completeness
- [ ] All features implemented and tested
- [ ] No placeholder content or "Lorem ipsum"
- [ ] No "Coming soon" features
- [ ] All buttons and links functional
- [ ] No broken features or dead ends

### ✅ Testing Complete
- [ ] Beta testing complete (2-3 weeks minimum)
- [ ] Crash rate <1%
- [ ] All critical bugs fixed
- [ ] Performance benchmarks met
- [ ] Tested on 10+ real devices

### ✅ Legal & Compliance
- [ ] Privacy policy published and accessible
- [ ] Terms of service published
- [ ] GDPR compliance (if serving EU users)
- [ ] CCPA compliance (if serving CA users)
- [ ] COPPA compliance (if app for children <13)
- [ ] Age rating obtained

### ✅ Content & Assets
- [ ] App icon (all required sizes)
- [ ] Screenshots (all required sizes/devices)
- [ ] App preview videos (optional but recommended)
- [ ] Feature graphic (Google Play)
- [ ] Promotional images
- [ ] App description written
- [ ] Keywords researched (iOS)

### ✅ Monetization (if applicable)
- [ ] In-app purchases tested
- [ ] Subscription flows tested
- [ ] Payment processing works
- [ ] Receipt validation implemented
- [ ] Refund policy defined

---

## iOS App Store Submission

### Step 1: Prepare Build

#### 1.1 Version & Build Number

**File:** `ios/Runner/Info.plist`

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

**Checklist:**
- [ ] Version follows semantic versioning (1.0.0)
- [ ] Build number incremented from last TestFlight build
- [ ] No beta indicators in version name

#### 1.2 App Icon

**Required sizes:**
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 120x120 (iPhone)
- 87x87 (iPhone)
- 80x80 (iPad)
- 76x76 (iPad)
- 60x60 (iPhone)
- 58x58 (iPhone)
- 40x40 (All)
- 29x29 (All)
- 20x20 (All)

**Checklist:**
- [ ] All sizes provided
- [ ] No alpha channel
- [ ] No rounded corners (iOS adds automatically)
- [ ] High resolution, no pixelation

#### 1.3 Screenshots

**Required:**
- 6.7" iPhone (1290 x 2796) - iPhone 14 Pro Max, 15 Pro Max
- 6.5" iPhone (1242 x 2688) - iPhone 11 Pro Max, XS Max
- 5.5" iPhone (1242 x 2208) - iPhone 8 Plus

**Optional but recommended:**
- iPad Pro 12.9" (2048 x 2732)
- iPad Pro 11" (1668 x 2388)

**Checklist:**
- [ ] 2-10 screenshots per size
- [ ] Show key features
- [ ] No text overlay obscuring UI (if possible)
- [ ] Actual app screenshots (no mockups)
- [ ] Consistent design across all screenshots
- [ ] From Phase 2 assets: `docs/mobile/metadata/screenshot-templates.md`

#### 1.4 App Preview Video (Optional)

**Specs:**
- Format: .mov, .mp4, or .m4v
- Length: 15-30 seconds
- Resolution: Same as screenshot sizes
- File size: <500 MB

**Checklist:**
- [ ] Shows app in action
- [ ] No narration required
- [ ] Captures actual app (no mockups)
- [ ] Demonstrates key features

### Step 2: App Information

#### 2.1 Basic Information

**App Name:** UpCoach: Goal & Habit Tracker
(Max 30 characters, shows in App Store)

**Subtitle:** Build Better Habits & Achieve Goals
(Max 30 characters, shows below name)

**Promotional Text:** (Max 170 characters, can update anytime)
```
🎉 NEW: AI-powered coaching insights! Get personalized recommendations
based on your habits and goals. Download now!
```

**Checklist:**
- [ ] Name is unique and searchable
- [ ] Subtitle describes value proposition
- [ ] Promotional text highlights latest feature

#### 2.2 Description

**Max:** 4,000 characters

Use from Phase 2 metadata: `docs/mobile/metadata/ios-metadata.json`

**Checklist:**
- [ ] Engaging opening paragraph
- [ ] Clear feature list
- [ ] Benefits highlighted
- [ ] Keywords included naturally
- [ ] Call to action at end
- [ ] No mentions of other platforms (Android)
- [ ] No price or promotion details (use promotional text)

#### 2.3 Keywords

**Max:** 100 characters (comma-separated)

From Phase 2 metadata:
```
goal tracker,habit tracker,life coach,personal growth,productivity,
self improvement,habits,goals,coaching,mindfulness,journaling,
motivation,wellness,fitness tracker,routine builder
```

**Checklist:**
- [ ] Researched with App Store search
- [ ] No app name repetition
- [ ] No competitor names
- [ ] No special characters
- [ ] Relevant to app functionality

#### 2.4 Support & Marketing URLs

- **Support URL:** https://upcoach.app/support
- **Marketing URL:** https://upcoach.app
- **Privacy Policy URL:** https://upcoach.app/privacy

**Checklist:**
- [ ] All URLs accessible
- [ ] HTTPS enabled
- [ ] Content is relevant
- [ ] Privacy policy comprehensive

#### 2.5 Categories

- **Primary:** Health & Fitness
- **Secondary:** Productivity (optional)

**Checklist:**
- [ ] Category matches app purpose
- [ ] Helps discoverability

#### 2.6 Age Rating

Answer questionnaire honestly:
- Unrestricted Web Access: No
- Gambling: No
- Violence: No
- Sexual Content: No
- Profanity: No
- Medical/Treatment Info: No

**Expected Rating:** 4+

**Checklist:**
- [ ] Questionnaire completed
- [ ] Rating appropriate
- [ ] Matches Google Play rating

### Step 3: Pricing & Availability

**Checklist:**
- [ ] Price: Free (with optional in-app purchases)
- [ ] Availability: All countries (or select specific)
- [ ] Pre-order: No (for 1.0 launch)

### Step 4: App Review Information

**Contact Information:**
- First name: [Your name]
- Last name: [Your name]
- Phone: +1-555-0123
- Email: support@upcoach.app

**Demo Account (if app requires login):**
- Username: demo@upcoach.app
- Password: [provide test password]

**Notes for Reviewer:**
```
Thank you for reviewing UpCoach!

This is a personal growth app that helps users build habits,
track goals, and receive AI-powered coaching insights.

Key features to test:
1. Create a habit and mark it complete
2. Set a goal and update progress
3. Try voice journaling (microphone permission required)
4. View AI coaching insights

All features work without signup, but demo account provided
for testing cloud sync.

Please let us know if you have any questions!
```

**Checklist:**
- [ ] Contact info current
- [ ] Demo account works
- [ ] Notes are helpful and concise
- [ ] Mentions any special permissions

### Step 5: Version Release

**Release Options:**
1. **Manually release this version** (Recommended for 1.0)
   - You control exact release time
   - Can do final checks
   - Coordinate with marketing

2. **Automatically release this version**
   - Releases immediately after approval
   - Less control

**Checklist:**
- [ ] Release option selected
- [ ] Team notified of expected release time

### Step 6: Submit for Review

**Final Checks:**
- [ ] All required fields completed
- [ ] Screenshots uploaded
- [ ] App icon uploaded
- [ ] Build selected
- [ ] Export compliance answered
- [ ] Content rights confirmed

**Submit:**
1. Click "Add for Review"
2. Click "Submit to App Review"
3. Confirm submission

**Post-Submission:**
- [ ] Confirmation email received
- [ ] Status: "Waiting for Review"
- [ ] Monitor status daily
- [ ] Prepare to respond to feedback within 24h

---

## Google Play Store Submission

### Step 1: Prepare Build

#### 1.1 Version Code & Name

**File:** `android/app/build.gradle`

```gradle
versionCode 1  // Integer, increment each release
versionName "1.0.0"  // User-facing version
```

**Checklist:**
- [ ] versionCode higher than any previous upload
- [ ] versionName follows semantic versioning
- [ ] No beta indicators

#### 1.2 App Icon

**Required:**
- High-res icon: 512 x 512 PNG
- Adaptive icon (if targeting Android 8+):
  - Foreground: 432 x 432 PNG
  - Background: Color or 432 x 432 PNG

**Checklist:**
- [ ] 512x512 icon provided
- [ ] Adaptive icon layers provided
- [ ] No transparency in high-res icon
- [ ] Clear and recognizable

#### 1.3 Feature Graphic

**Required:**
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- No transparency

**Checklist:**
- [ ] Feature graphic created
- [ ] Shows app name/logo
- [ ] Visually appealing
- [ ] From Phase 2 assets

#### 1.4 Screenshots

**Phone (Required):**
- Minimum: 2
- Recommended: 4-8
- Size: 1080 x 1920 (minimum)

**Tablet 7" (Optional):**
- Size: 1200 x 1920 (minimum)

**Tablet 10" (Optional):**
- Size: 1600 x 2560 (minimum)

**Checklist:**
- [ ] All required screenshots uploaded
- [ ] Show key features
- [ ] Actual app screenshots
- [ ] From Phase 2 assets: `docs/mobile/metadata/android-metadata.json`

#### 1.5 Promo Video (Optional)

**Checklist:**
- [ ] YouTube video URL
- [ ] 30-120 seconds
- [ ] Shows app features
- [ ] Professional quality

### Step 2: Store Listing

#### 2.1 App Details

**App name:** UpCoach: Goal & Habit Tracker
(Max 50 characters)

**Short description:** (Max 80 characters)
```
Build better habits, achieve goals with AI-powered coaching & tracking
```

**Full description:** (Max 4,000 characters)

Use from Phase 2 metadata: `docs/mobile/metadata/android-metadata.json`

**Checklist:**
- [ ] Name optimized for search
- [ ] Short description compelling
- [ ] Full description comprehensive
- [ ] Keywords included naturally
- [ ] Formatted with bullet points/emojis

#### 2.2 Categorization

**Category:** Health & Fitness
**Tags:** (Select up to 5)
- Habits
- Goals
- Productivity
- Self-improvement
- Coaching

**Checklist:**
- [ ] Category matches app purpose
- [ ] Tags relevant
- [ ] Helps discoverability

#### 2.3 Contact Details

- **Website:** https://upcoach.app
- **Email:** support@upcoach.app
- **Phone:** +1-555-0123 (optional)
- **Privacy Policy:** https://upcoach.app/privacy

**Checklist:**
- [ ] All URLs accessible
- [ ] Email monitored
- [ ] Privacy policy published

### Step 3: Content Rating

Complete IARC questionnaire:

**Checklist:**
- [ ] Violence: None or mild
- [ ] Sexual content: None
- [ ] Profanity: None
- [ ] Controlled substances: None
- [ ] Gambling: None
- [ ] User interaction: Yes (if voice journaling shared)
- [ ] Personal info: Yes (if syncing data)

**Expected Rating:** Everyone or E10+

### Step 4: Data Safety

**Data Collection:**
- [ ] Personal info (name, email)
- [ ] App activity (interactions, generated content)
- [ ] App info (crash logs, diagnostics)

**Data Usage:**
- [ ] App functionality
- [ ] Analytics
- [ ] Personalization

**Data Sharing:**
- [ ] Not shared with third parties (or specify if using analytics)

**Security:**
- [ ] Data encrypted in transit
- [ ] Data encrypted at rest
- [ ] Users can request deletion
- [ ] Users can opt out

**Checklist:**
- [ ] All data types disclosed
- [ ] Usage purposes clear
- [ ] Security practices accurate
- [ ] Deletion policy implemented

### Step 5: Pricing & Distribution

**Pricing:**
- [ ] Free
- [ ] Contains ads: No (unless you have ads)
- [ ] In-app purchases: Yes (if applicable)

**Countries:**
- [ ] All countries (or select specific)
- [ ] Exclude countries if needed

**Device Categories:**
- [ ] Phone
- [ ] Tablet
- [ ] Wear OS (if supported)
- [ ] TV (if supported)

**Checklist:**
- [ ] Pricing correct
- [ ] Distribution countries selected
- [ ] Device compatibility set

### Step 6: App Content

**Target Audience:**
- [ ] Age group: 13 years and older (or adjust)
- [ ] Not designed for children

**Ads Declaration:**
- [ ] Contains ads: No (unless applicable)

**News App:**
- [ ] Is a news app: No

**COVID-19:**
- [ ] COVID-19 contact tracing/status app: No

**Checklist:**
- [ ] All declarations accurate
- [ ] Complies with policies

### Step 7: Release

#### 7.1 Select Release Track

**Production:**
- Full release to all users
- Requires review

**Checklist:**
- [ ] Production track selected
- [ ] Release name entered
- [ ] Release notes written

#### 7.2 Release Notes

```
🎉 Welcome to UpCoach!

What's New:
• Goal tracking with beautiful visualizations
• Habit builder with streak tracking
• AI-powered coaching insights
• Voice journaling with transcription
• Community features
• Comprehensive analytics
• Dark mode support
• Offline sync

We're excited to help you achieve your goals! If you love UpCoach,
please leave us a review.

Questions? support@upcoach.app
```

**Checklist:**
- [ ] Release notes engaging
- [ ] Features highlighted
- [ ] Contact info included

#### 7.3 Upload App Bundle

**Checklist:**
- [ ] AAB file uploaded
- [ ] Processing complete
- [ ] No errors or warnings

#### 7.4 Review and Rollout

**Checklist:**
- [ ] All sections complete (green checkmarks)
- [ ] No policy warnings
- [ ] Ready to publish

**Submit:**
1. Click "Review release"
2. Review all details
3. Click "Start rollout to Production"
4. Confirm rollout

**Post-Submission:**
- [ ] Confirmation shown
- [ ] Status: "Pending publication"
- [ ] Review typically 1-7 days
- [ ] Monitor Play Console daily

---

## Common Rejection Reasons & How to Avoid

### iOS Rejections

**1. Crashes or Bugs**
- **Avoid:** Test thoroughly, fix all known bugs
- **Response:** If rejected, fix and resubmit within 24h

**2. Missing Functionality**
- **Avoid:** All features working, no placeholders
- **Response:** Complete features and resubmit

**3. Privacy Violations**
- **Avoid:** Clear privacy policy, proper permissions
- **Response:** Update privacy policy, explain data usage

**4. Design Issues**
- **Avoid:** Follow iOS Human Interface Guidelines
- **Response:** Update UI to match guidelines

**5. Performance Issues**
- **Avoid:** Optimize performance, <3s launch time
- **Response:** Optimize and resubmit

### Google Play Rejections

**1. Policy Violations**
- **Avoid:** Read and follow all Google Play policies
- **Response:** Fix violation, provide explanation

**2. Misleading Content**
- **Avoid:** Accurate description, no false claims
- **Response:** Update description, be truthful

**3. Permissions Abuse**
- **Avoid:** Only request necessary permissions
- **Response:** Remove unnecessary permissions

**4. Intellectual Property**
- **Avoid:** No copyrighted content without permission
- **Response:** Remove infringing content

**5. Security Vulnerabilities**
- **Avoid:** Security audit, no known vulnerabilities
- **Response:** Fix security issues, resubmit

---

## Post-Submission Monitoring

### iOS App Review Status

**Statuses:**
1. **Waiting for Review** - In queue
2. **In Review** - Being reviewed (24-48 hours)
3. **Pending Developer Release** - Approved, waiting for your release
4. **Ready for Sale** - Live in App Store
5. **Rejected** - Not approved, review feedback

**Monitor:**
- App Store Connect daily
- Email for status updates
- Respond to questions within 24h

### Google Play Review Status

**Statuses:**
1. **Pending publication** - In review queue
2. **In review** - Being reviewed (1-7 days)
3. **Approved** - Can be released
4. **Published** - Live on Google Play
5. **Rejected** - Not approved, review reason provided

**Monitor:**
- Google Play Console daily
- Email for status updates
- Address issues promptly

---

## Launch Day Checklist

### Pre-Launch (Day Before)

- [ ] Marketing materials ready
- [ ] Social media posts scheduled
- [ ] Blog post written
- [ ] Email newsletter prepared
- [ ] Press release (if applicable)
- [ ] Support team briefed
- [ ] Monitoring dashboards active

### Launch Day

**Morning:**
- [ ] Verify apps are live
- [ ] Test download links
- [ ] Check app store listings
- [ ] Monitor initial downloads

**Announce:**
- [ ] Send email newsletter
- [ ] Post on social media
- [ ] Publish blog post
- [ ] Update website
- [ ] Notify beta testers

**Monitor:**
- [ ] Watch crash reports (target: <1%)
- [ ] Monitor reviews
- [ ] Track downloads
- [ ] Check analytics
- [ ] Respond to support requests

### Post-Launch (First Week)

**Daily:**
- [ ] Check crash rate (<1% target)
- [ ] Read and respond to reviews
- [ ] Monitor support emails
- [ ] Track key metrics
- [ ] Fix critical bugs immediately

**Weekly:**
- [ ] Analyze user feedback
- [ ] Plan updates
- [ ] Review metrics
- [ ] Prepare marketing campaigns
- [ ] Celebrate success! 🎉

---

## Success Metrics

**Week 1 Targets:**
- 1,000+ downloads
- 4.0+ star rating
- <1% crash rate
- 70%+ Day 1 retention
- 50+ reviews

**Month 1 Targets:**
- 10,000+ downloads
- 4.5+ star rating
- <0.5% crash rate
- 40%+ Day 7 retention
- 20%+ Day 30 retention

---

## Resources

**iOS:**
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

**Android:**
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

**Ready to Submit!** 🚀

Follow this checklist carefully and you'll have the best chance of approval on the first try. Good luck! 🎉
