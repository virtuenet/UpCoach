# TestFlight Setup Guide - iOS Beta Testing

**Purpose:** Complete guide to setting up TestFlight for UpCoach iOS beta testing **Timeline:** Week
2 of Phase 5 **Testers:** 50-100 beta users **Platform:** iOS (iPhone & iPad)

---

## Prerequisites

- [ ] Apple Developer Account ($99/year)
- [ ] Xcode installed (latest version)
- [ ] UpCoach iOS app code complete
- [ ] All pre-launch tests passing
- [ ] App Store Connect access

---

## Overview

TestFlight is Apple's beta testing platform that allows you to:

- Distribute pre-release builds to up to 10,000 external testers
- Collect feedback and crash reports
- Test In-App Purchases
- Manage multiple test groups

---

## Step 1: App Store Connect Setup

### 1.1 Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"**
3. Click **"+"** → **"New App"**
4. Fill in app information:

   **Platforms:** iOS **Name:** UpCoach: Goal & Habit Tracker **Primary Language:** English (U.S.)
   **Bundle ID:** com.upcoach.app (select from dropdown) **SKU:** upcoach-ios-001 (unique
   identifier) **User Access:** Full Access

5. Click **"Create"**

### 1.2 App Information

1. Select your newly created app
2. Go to **"App Information"**
3. Fill in:
   - **Category:** Primary: Health & Fitness
   - **Secondary Category:** Productivity (optional)
   - **Content Rights:** Check if you have the rights
   - **Age Rating:** Click "Edit" and answer questionnaire

   **Age Rating Answers:**
   - Unrestricted Web Access: No
   - Simulated Gambling: No
   - Frequent/Intense Mature/Suggestive Themes: No
   - (Answer all honestly based on your app)

   **Result:** Likely 4+ (suitable for all ages)

4. Save changes

---

## Step 2: Prepare iOS Build

### 2.1 Update Version and Build Number

**File:** `ios/Runner/Info.plist` or use Xcode

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

Or in Xcode:

1. Select Runner project
2. Select Runner target
3. General tab → Identity
4. **Version:** 1.0.0
5. **Build:** 1

**Important:** Increment build number for each upload

### 2.2 Configure Signing & Capabilities

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select Runner target → **Signing & Capabilities**
3. **Automatically manage signing:** Checked
4. **Team:** Select your Apple Developer team
5. **Bundle Identifier:** com.upcoach.app
6. Verify provisioning profile is created

### 2.3 Add Required Capabilities

In Xcode → Runner target → **Signing & Capabilities**:

- **Push Notifications** (if using)
- **Sign in with Apple** (if using)
- **Background Modes** (check "Remote notifications" if using push)
- **Associated Domains** (if using universal links)

### 2.4 Update Deployment Target

Ensure minimum iOS version is set:

1. Runner target → **General** → **Deployment Info**
2. **Deployment Target:** iOS 15.0 (or higher)

---

## Step 3: Create Archive

### 3.1 Clean and Build

```bash
cd apps/mobile

# Clean previous builds
flutter clean
rm -rf ios/Pods
rm -rf ios/.symlinks
rm -rf ios/Podfile.lock

# Get dependencies
flutter pub get
cd ios && pod install && cd ..

# Build release version
flutter build ios --release
```

### 3.2 Open in Xcode

```bash
open ios/Runner.xcworkspace
```

### 3.3 Select Destination

In Xcode:

1. Product menu → Destination
2. Select **"Any iOS Device (arm64)"** (NOT a simulator)

### 3.4 Create Archive

1. Product menu → **Archive**
2. Wait for archive process (3-10 minutes)
3. When complete, Organizer window opens automatically

**Troubleshooting:**

- If "Archive" is grayed out, ensure device target is selected (not simulator)
- If build fails, check error messages in Issue Navigator

---

## Step 4: Upload to App Store Connect

### 4.1 Validate Archive

In Xcode Organizer:

1. Select your archive
2. Click **"Validate App"**
3. Select distribution method: **"App Store Connect"**
4. Select distribution options:
   - **Upload symbols:** Yes (for crash reports)
   - **Manage Version and Build Number:** Yes
5. Select signing: **"Automatically manage signing"**
6. Click **"Validate"**
7. Wait for validation (2-5 minutes)

**Common Validation Errors:**

- Missing icons → Add all required icon sizes
- Missing privacy descriptions → Add to Info.plist
- Invalid entitlements → Check capabilities settings

### 4.2 Distribute App

Once validation succeeds:

1. Click **"Distribute App"**
2. Select **"App Store Connect"**
3. Select **"Upload"** (not "Export")
4. Distribution options (same as validation)
5. Click **"Upload"**
6. Wait for upload (5-15 minutes depending on app size)

### 4.3 Confirm Upload

You'll see: "App Store Connect operation was successful"

Close Organizer.

---

## Step 5: Configure TestFlight

### 5.1 Wait for Processing

1. Go to App Store Connect → My Apps → UpCoach
2. Select **"TestFlight"** tab
3. Wait for build to process (typically 10-30 minutes)

**You'll receive an email when ready:** "The build for UpCoach 1.0.0 (1) has completed processing"

### 5.2 Export Compliance

When build appears in TestFlight:

1. Click on the build (e.g., "1.0.0 (1)")
2. Answer **Export Compliance** questions:

   **Does your app use encryption?**
   - If using HTTPS only: **No** (standard encryption)
   - If using custom encryption: **Yes** (requires documentation)

   **Recommended:** Select "No" for most apps (HTTPS is exempt)

3. Click **"Start Internal Testing"** (optional)

---

## Step 6: Create Test Groups

### 6.1 Internal Testing Group (Optional)

**For:** Your team (up to 100 people)

1. TestFlight tab → **Internal Testing**
2. Click **"+"** to add testers
3. Add team members by email
4. Select the build to test
5. Testers receive email instantly

**No App Review required for internal testing**

### 6.2 External Testing Group

**For:** Beta testers (up to 10,000 people)

1. TestFlight tab → **External Testing**
2. Click **"+"** to create a new group
3. **Group Name:** "Public Beta" or "Week 2 Beta"
4. **Public Link:** Enable if you want a public signup link
5. Click **"Create"**

### 6.3 Add Build to External Group

1. Select your external testing group
2. Click **"Builds"** section
3. Click **"+"** to add a build
4. Select version 1.0.0 (1)
5. Click **"Next"**

### 6.4 Beta App Information

**Required for External Testing:**

1. **What to Test:**

   ```
   Welcome to UpCoach Beta!

   We're testing the core features:
   - Habit tracking and streak monitoring
   - Goal setting and progress tracking
   - Voice journaling with AI insights
   - Offline sync capabilities
   - Push notifications

   Please focus on:
   - Overall user experience
   - Any bugs or crashes
   - Feature requests
   - Performance issues

   Thank you for helping us improve!
   ```

2. **Feedback Email:** beta@upcoach.app
3. **Marketing URL:** https://upcoach.app (optional)
4. **Privacy Policy URL:** https://upcoach.app/privacy
5. **Beta App Description:**
   ```
   UpCoach is your personal growth companion,
   helping you build better habits, achieve goals,
   and track your progress with AI-powered insights.
   ```

### 6.5 Submit for Beta App Review

1. Review all information
2. Click **"Submit for Review"**
3. Wait for Apple review (typically 24-48 hours)

**Review Process:**

- Apple reviews first beta build
- Subsequent builds (minor changes) don't require review
- Major changes may trigger another review

---

## Step 7: Invite Beta Testers

### 7.1 Add Testers to Group

**Method 1: Email Invitation**

1. Select external testing group
2. Click **"Testers"** tab
3. Click **"+"** → **"Add New Testers"**
4. Enter email addresses (one per line or comma-separated)
5. Click **"Add"**

**Method 2: Public Link**

1. Enable **"Public Link"** for the group
2. Copy the public link
3. Share link on:
   - Your website
   - Social media
   - Email newsletter
   - Blog post

### 7.2 Tester Limits

- Internal: Up to 100 testers (team only)
- External: Up to 10,000 testers
- Per build: Up to 10,000 installs

### 7.3 Invitation Email

Testers receive an email from Apple:

- **Subject:** "You're invited to test UpCoach"
- **Content:** Instructions to download TestFlight app
- **Action:** "View in TestFlight" button

---

## Step 8: Monitor Beta Testing

### 8.1 TestFlight Metrics

In App Store Connect → TestFlight:

**Installs:**

- Number of testers who installed
- Install rate (% of invites)

**Sessions:**

- Total app launches
- Crashes per session
- Average session duration

**Crashes:**

- Crash rate
- Crash logs
- Device types affected

### 8.2 Crash Reports

1. TestFlight tab → Select build
2. Click **"Crashes"** tab
3. View crash logs
4. Download symbolicated logs

**To symbolicate manually:**

```bash
# If not auto-symbolicated
# Use Xcode Organizer → Crashes
```

### 8.3 Feedback Collection

**TestFlight Built-in Feedback:**

- Testers can shake device to send feedback
- Screenshots attached automatically
- Feedback appears in TestFlight dashboard

**External Feedback:**

- Set up email: beta@upcoach.app
- Create feedback form: Google Forms, Typeform
- Use bug tracking: GitHub Issues, Jira

---

## Step 9: Update Beta Build

### 9.1 Fix Bugs from Beta Feedback

1. Address critical bugs
2. Implement requested features (if time permits)
3. Test changes thoroughly

### 9.2 Increment Build Number

**File:** `ios/Runner/Info.plist`

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>2</string>  <!-- Increment this -->
```

**Important:** Build number must increase for each upload

### 9.3 Create and Upload New Archive

Repeat Steps 3-4:

1. Flutter build ios --release
2. Open Xcode, create archive
3. Upload to App Store Connect
4. Wait for processing

### 9.4 Add New Build to TestFlight

1. TestFlight → External Testing → Your group
2. Click **"+"** next to Builds
3. Select new build (1.0.0 (2))
4. **What to Test:** Describe changes
5. Click **"Submit"**

**Note:** Minor updates usually don't require new review

---

## Step 10: Beta Tester Management

### 10.1 Communication with Testers

**Announcement:** Use TestFlight to notify all testers:

1. Select testing group
2. Click **"Notifications"**
3. Compose message
4. Send

**Example:**

```
🎉 New Beta Build Available!

Version 1.0.0 (2) is now available with:
- Fixed crash on goal creation
- Improved offline sync
- Better performance

Please update and test the new features.
Thank you!
```

### 10.2 Remove Inactive Testers

If testers aren't testing:

1. View tester list
2. Sort by "Last Session"
3. Remove inactive testers
4. Invite new testers

### 10.3 Extend Testing Period

Beta builds expire after 90 days:

- Upload new build before expiry
- Testers auto-update to new build

---

## Step 11: Prepare for Production

### 11.1 Beta Success Criteria

Before submitting to App Store:

- [ ] 70%+ tester engagement
- [ ] <5% crash rate
- [ ] No critical bugs reported
- [ ] Positive overall feedback
- [ ] All major features tested

### 11.2 Incorporate Feedback

- Fix reported bugs
- Improve UX based on feedback
- Add highly-requested features
- Optimize performance

### 11.3 Final Beta Build

- Upload one final beta build
- Test for 3-5 days
- Ensure stability
- This build becomes your production build

---

## Best Practices

### DO ✅

- Test internally before external beta
- Respond to tester feedback quickly
- Keep testers engaged with updates
- Monitor crash reports daily
- Thank beta testers publicly

### DON'T ❌

- Rush to production without sufficient testing
- Ignore feedback from multiple testers
- Upload builds with known critical bugs
- Forget to update release notes
- Neglect crash reports

---

## Troubleshooting

### Build not appearing in TestFlight

- Wait 10-30 minutes for processing
- Check email for rejection notice
- Verify export compliance was answered
- Ensure build uploaded successfully

### Testers can't install app

- Verify they have TestFlight app installed
- Check they accepted invitation
- Ensure iOS version compatible
- Verify build hasn't expired

### High crash rate

- Download crash logs from TestFlight
- Symbolicate logs in Xcode
- Identify common crash patterns
- Fix and upload new build

### Beta review rejection

- Review rejection reasons carefully
- Fix issues mentioned
- Resubmit for review
- Contact Apple if unclear

---

## TestFlight Limits

| Item             | Limit                      |
| ---------------- | -------------------------- |
| Internal testers | 100                        |
| External testers | 10,000                     |
| Builds per day   | Unlimited                  |
| Build expiry     | 90 days                    |
| App size         | 4 GB (recommended <200 MB) |
| Review time      | 24-48 hours (first build)  |

---

## Costs

- **Apple Developer Program:** $99/year
- **TestFlight:** Free (included in developer program)
- **Additional costs:** None

---

## Checklist

Before starting TestFlight:

- [ ] Apple Developer account active
- [ ] App record created in App Store Connect
- [ ] iOS app tested and stable
- [ ] All required icons and assets ready
- [ ] Privacy policy published
- [ ] Support email set up (beta@upcoach.app)

During beta testing:

- [ ] Monitor TestFlight metrics daily
- [ ] Respond to feedback within 24 hours
- [ ] Upload fixes weekly (or as needed)
- [ ] Keep testers informed of progress
- [ ] Document all feedback and bugs

Before production launch:

- [ ] Beta tested for 2-3 weeks minimum
- [ ] Crash rate <1%
- [ ] Major bugs resolved
- [ ] Tester feedback incorporated
- [ ] Final build stable

---

## Timeline

**Week 1:**

- Day 1: Set up App Store Connect
- Day 2: Create and upload first build
- Day 3: Submit for beta review
- Day 4-5: Wait for approval
- Day 6: Invite first batch of testers (25-50)
- Day 7: Monitor initial feedback

**Week 2:**

- Day 8-9: Fix critical bugs
- Day 10: Upload build 2
- Day 11-12: Invite more testers (50+)
- Day 13-14: Collect comprehensive feedback

**Week 3:**

- Day 15-16: Final bug fixes
- Day 17: Upload final beta build
- Day 18-21: Stability testing
- Day 22: Prepare for production submission

---

## Next Steps

After successful beta testing:

1. ✅ Review all feedback and metrics
2. ✅ Fix all critical and high-priority bugs
3. ✅ Prepare production build
4. ✅ Create app store screenshots (Phase 2 assets)
5. ✅ Write app store description
6. ✅ Submit for App Store review

See: [App Store Submission Guide](./APP_STORE_SUBMISSION_GUIDE.md)

---

## Resources

- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Best Practices](https://developer.apple.com/testflight/best-practices/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**TestFlight Setup Complete!** 🚀

Your iOS app is now ready for beta testing. Good luck! 🎉
