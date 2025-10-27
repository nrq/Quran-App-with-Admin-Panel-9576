# Deployment Guide

## Overview

This comprehensive guide covers the complete deployment process for the Quran App to both Google Play Store (Android) and Apple App Store (iOS). Follow these step-by-step instructions to successfully submit your app to both platforms.

## Pre-Deployment Checklist

Before starting the deployment process, ensure:

- [ ] App is fully tested on both platforms
- [ ] All features work correctly
- [ ] No critical bugs or crashes
- [ ] Performance is acceptable
- [ ] All assets are prepared (icons, splash screens, screenshots)
- [ ] Privacy policy is published and accessible
- [ ] Terms of service are prepared (if applicable)
- [ ] Version numbers are updated
- [ ] Build numbers are incremented
- [ ] Environment variables are configured for production
- [ ] Firebase project is set up for production
- [ ] App store developer accounts are active

## Google Play Store Deployment (Android)

### Prerequisites

1. **Google Play Console Account**
   - Sign up at: https://play.google.com/console
   - One-time registration fee: $25 USD
   - Verify your identity

2. **Required Assets**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (minimum 2, up to 8)
   - Privacy policy URL
   - Signed AAB file

### Step 1: Build Release AAB

```bash
# Build production web app
npm run build:prod

# Sync with Android
npx cap sync android

# Build signed AAB
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 2: Create App in Play Console

1. Go to Google Play Console
2. Click "Create app"
3. Fill in app details:
   - **App name:** Quran App
   - **Default language:** English (or your primary language)
   - **App or game:** App
   - **Free or paid:** Free (or Paid)
4. Accept declarations
5. Click "Create app"

### Step 3: Set Up Store Listing

Navigate to "Store presence" > "Main store listing":

#### App Details

**App name:** Quran App

**Short description** (80 characters max):
```
Read and listen to the Holy Quran with translations and audio recitations
```

**Full description** (4000 characters max):
```
Quran App provides a beautiful and intuitive way to read, listen to, and study the Holy Quran.

FEATURES:
• Complete Quran text in Arabic
• Multiple translations
• High-quality audio recitations
• Verse-by-verse playback
• Advanced search functionality
• Bookmarks and favorites
• Offline reading support
• Beautiful, easy-to-use interface
• Dark mode support

PERFECT FOR:
• Daily Quran reading
• Memorization (Hifz)
• Learning and study
• Listening during commute
• Spiritual growth

OFFLINE SUPPORT:
Download surahs for offline reading and listening. Access the Quran anytime, anywhere, even without internet connection.

AUDIO RECITATIONS:
Listen to beautiful recitations by renowned Qaris. Follow along with synchronized highlighting.

SEARCH & NAVIGATION:
Quickly find any verse with powerful search. Navigate by Surah, Juz, or page number.

FREE & AD-FREE:
Completely free with no advertisements. Focus on your spiritual journey without distractions.

We continuously improve the app based on user feedback. Please rate and review to help us serve you better.
```

#### Graphics

1. **App icon** (512x512 PNG)
   - Upload your app icon
   - Must be square with no transparency

2. **Feature graphic** (1024x500 PNG)
   - Upload feature graphic
   - Displayed at top of store listing

3. **Phone screenshots** (minimum 2, maximum 8)
   - Recommended size: 1080x1920 or 1080x2340
   - Show key features
   - Upload in order of importance

4. **Tablet screenshots** (optional but recommended)
   - 7-inch: 1024x600 or 600x1024
   - 10-inch: 1920x1200 or 1200x1920

#### Categorization

- **App category:** Books & Reference
- **Tags:** Quran, Islam, Religion, Holy Book, Islamic, Muslim

#### Contact Details

- **Email:** your-support-email@example.com
- **Phone:** (optional)
- **Website:** https://your-website.com
- **Privacy policy URL:** https://your-website.com/privacy-policy

### Step 4: Content Rating

1. Navigate to "Policy" > "App content"
2. Click "Start questionnaire"
3. Select app category: "Reference"
4. Answer all questions honestly
5. Submit for rating

Common questions:
- Violence: No
- Sexual content: No
- Profanity: No
- Controlled substances: No
- User-generated content: No (unless you have comments/forums)

### Step 5: Set Up App Access

Navigate to "Policy" > "App access":

1. If app has no login: Select "All functionality is available without special access"
2. If app has login: Provide test credentials

### Step 6: Ads Declaration

Navigate to "Policy" > "App content" > "Ads":

- Select "No, my app does not contain ads" (if applicable)

### Step 7: Target Audience and Content

Navigate to "Policy" > "Target audience and content":

1. **Target age groups:** Select "Ages 5 and under" through "Ages 18 and over"
2. **Store presence:** Select "Designed for families" (optional)

### Step 8: Data Safety

Navigate to "Policy" > "Data safety":

1. **Data collection:** Specify what data you collect
   - User account info (if using authentication)
   - App activity (if using analytics)

2. **Data usage:** Explain how data is used
   - App functionality
   - Analytics
   - Personalization

3. **Data sharing:** Specify if data is shared with third parties

4. **Security practices:**
   - Data is encrypted in transit
   - Users can request data deletion
   - Committed to Google Play Families Policy

### Step 9: Upload AAB

1. Navigate to "Release" > "Production"
2. Click "Create new release"
3. Upload your AAB file
4. Review any warnings or errors
5. Add release notes:

```
Version 1.0.0 - Initial Release

• Complete Quran text in Arabic
• Multiple translations
• High-quality audio recitations
• Advanced search functionality
• Offline reading support
• Beautiful, intuitive interface

Thank you for downloading Quran App!
```

### Step 10: Review and Rollout

1. Review all sections for completeness
2. Fix any issues flagged by Play Console
3. Click "Review release"
4. Review summary
5. Click "Start rollout to Production"

### Step 11: Wait for Review

- Review typically takes 1-3 days
- You'll receive email notifications
- Monitor status in Play Console
- Respond promptly to any requests

## Apple App Store Deployment (iOS)

### Prerequisites

1. **Apple Developer Account**
   - Sign up at: https://developer.apple.com/
   - Annual fee: $99 USD
   - Verify your identity

2. **Required Assets**
   - App icon (1024x1024 PNG)
   - Screenshots for multiple device sizes
   - Privacy policy URL
   - Signed IPA file

### Step 1: Build Release IPA

```bash
# Build production web app
npm run build:prod

# Sync with iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select "Any iOS Device" as target
2. Product > Archive
3. Wait for archive to complete

### Step 2: Create App in App Store Connect

1. Go to App Store Connect: https://appstoreconnect.apple.com/
2. Click "My Apps"
3. Click "+" > "New App"
4. Fill in app information:
   - **Platform:** iOS
   - **Name:** Quran App
   - **Primary Language:** English
   - **Bundle ID:** com.nurulquran.dq
   - **SKU:** quran-app-001 (unique identifier)
   - **User Access:** Full Access

### Step 3: App Information

Navigate to "App Information":

#### General Information

- **Name:** Quran App
- **Subtitle** (30 characters): Read and Listen to Quran
- **Category:** 
  - Primary: Reference
  - Secondary: Books

#### Age Rating

Click "Edit" and answer questionnaire:
- Unrestricted Web Access: No
- Gambling: No
- Contests: No
- Mature/Suggestive Themes: No
- Violence: None
- Profanity or Crude Humor: None

Result should be: **4+**

### Step 4: Pricing and Availability

Navigate to "Pricing and Availability":

1. **Price:** Free (or set your price)
2. **Availability:** All territories (or select specific countries)
3. **Pre-orders:** No (for initial release)

### Step 5: Prepare for Submission

Navigate to version (e.g., "1.0 Prepare for Submission"):

#### App Preview and Screenshots

Upload screenshots for required device sizes:

**iPhone 6.7" Display** (1290 x 2796 pixels) - Required
- iPhone 15 Pro Max, iPhone 14 Pro Max, iPhone 13 Pro Max

**iPhone 6.5" Display** (1242 x 2688 pixels) - Required
- iPhone 11 Pro Max, iPhone XS Max

**iPhone 5.5" Display** (1242 x 2208 pixels) - Optional
- iPhone 8 Plus, iPhone 7 Plus

**iPad Pro (6th Gen) 12.9" Display** (2048 x 2732 pixels) - Optional
- iPad Pro 12.9-inch

**Tip:** Take screenshots on simulators or devices, then use tools like [Fastlane Frameit](https://fastlane.tools/frameit) to add device frames.

#### Promotional Text (Optional)

```
Experience the Holy Quran like never before. Read, listen, and study with our beautiful and intuitive app.
```

#### Description

```
Quran App provides a beautiful and intuitive way to read, listen to, and study the Holy Quran.

FEATURES:
• Complete Quran text in Arabic
• Multiple translations in various languages
• High-quality audio recitations by renowned Qaris
• Verse-by-verse audio playback with synchronized highlighting
• Advanced search functionality to find any verse instantly
• Bookmarks and favorites for easy access
• Offline reading and listening support
• Beautiful, easy-to-use interface
• Dark mode for comfortable reading
• Adjustable text size and font

PERFECT FOR:
• Daily Quran reading and reflection
• Memorization (Hifz) with audio support
• Learning and in-depth study
• Listening during commute or travel
• Spiritual growth and connection

OFFLINE SUPPORT:
Download surahs for offline reading and listening. Access the Quran anytime, anywhere, even without an internet connection.

AUDIO RECITATIONS:
Listen to beautiful recitations by world-renowned Qaris. Follow along with synchronized verse highlighting for better understanding and memorization.

SEARCH & NAVIGATION:
Quickly find any verse with our powerful search feature. Navigate easily by Surah, Juz, or page number.

FREE & AD-FREE:
Completely free with no advertisements. Focus on your spiritual journey without any distractions.

We continuously improve the app based on user feedback. Please rate and review to help us serve the Muslim community better.

May Allah accept your efforts in reading and understanding His words.
```

#### Keywords (100 characters max)

```
quran,islam,muslim,holy,koran,arabic,recitation,surah,ayah,islamic
```

#### Support URL

```
https://your-website.com/support
```

#### Marketing URL (Optional)

```
https://your-website.com
```

#### Privacy Policy URL

```
https://your-website.com/privacy-policy
```

### Step 6: Build Information

#### General App Information

- **App Icon:** Upload 1024x1024 PNG (no transparency, no rounded corners)
- **Version:** 1.0.0
- **Copyright:** © 2024 Your Company Name
- **Routing App Coverage File:** Not applicable

#### App Review Information

**Contact Information:**
- First Name: Your Name
- Last Name: Your Last Name
- Phone: +1-xxx-xxx-xxxx
- Email: your-email@example.com

**Sign-in Information:**
- If app requires login, provide test credentials
- If no login required, select "Sign-in required: No"

**Notes:**
```
Thank you for reviewing Quran App.

This app provides access to the Holy Quran with translations and audio recitations. All content is religious in nature and appropriate for all ages.

Key features to test:
1. Browse and read Quran text
2. Play audio recitations
3. Search for verses
4. Test offline functionality (download a surah first)
5. Bookmark verses

No special configuration is needed. The app works immediately after installation.

Please feel free to contact us if you have any questions.
```

**Attachment:** (Optional) Add demo video or additional screenshots

### Step 7: Version Information

**What's New in This Version:**
```
Initial release of Quran App!

• Complete Quran text in Arabic
• Multiple translations
• High-quality audio recitations
• Advanced search functionality
• Offline reading support
• Beautiful, intuitive interface
• Dark mode support

Thank you for downloading Quran App. May it benefit you in your spiritual journey.
```

### Step 8: Upload Build

1. In Xcode Organizer, select your archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload"
5. Follow the wizard
6. Wait for processing (5-30 minutes)

Once processed:
1. Return to App Store Connect
2. Refresh the page
3. Under "Build", click "+" to select build
4. Select your uploaded build
5. Click "Done"

### Step 9: Submit for Review

1. Review all sections for completeness
2. Ensure all required fields are filled
3. Click "Add for Review" (top right)
4. Review submission summary
5. Click "Submit to App Review"

### Step 10: Wait for Review

- Review typically takes 24-48 hours
- You'll receive email notifications
- Monitor status in App Store Connect
- Respond promptly to any requests

## Post-Submission

### Monitor Review Status

**Google Play Console:**
- Check "Release" > "Production" for status
- Statuses: Under review → Approved → Published

**App Store Connect:**
- Check app status in "My Apps"
- Statuses: Waiting for Review → In Review → Pending Developer Release → Ready for Sale

### Respond to Review Feedback

If rejected:
1. Read rejection reason carefully
2. Fix the issues
3. Increment build number
4. Resubmit

Common rejection reasons:
- Missing privacy policy
- Incomplete app information
- Crashes or bugs
- Guideline violations
- Misleading content

### Release Management

#### Google Play Store

**Staged Rollout (Recommended):**
1. Start with 20% of users
2. Monitor for crashes and issues
3. Gradually increase to 50%, then 100%

**Full Rollout:**
- App goes live to all users immediately

#### Apple App Store

**Manual Release:**
1. After approval, status changes to "Pending Developer Release"
2. Click "Release this version" when ready

**Automatic Release:**
- App goes live automatically after approval

## Post-Launch Checklist

- [ ] Verify app is live in both stores
- [ ] Test download and installation
- [ ] Monitor crash reports
- [ ] Monitor user reviews
- [ ] Respond to user feedback
- [ ] Track analytics and metrics
- [ ] Plan for updates and improvements

## Updating the App

### Version Updates

**Semantic Versioning:**
- **Major (X.0.0):** Breaking changes, major new features
- **Minor (1.X.0):** New features, backward compatible
- **Patch (1.0.X):** Bug fixes, minor improvements

**Update Process:**
1. Increment version in `package.json`
2. Update version in `capacitor.config.ts`
3. Update Android `versionCode` and `versionName`
4. Update iOS `CFBundleVersion` and `CFBundleShortVersionString`
5. Build new release
6. Submit to stores

### Update Submission

**Google Play:**
1. Create new release in Production track
2. Upload new AAB
3. Add release notes
4. Roll out

**Apple:**
1. Create new version in App Store Connect
2. Upload new build
3. Update "What's New"
4. Submit for review

## Monitoring and Analytics

### Firebase Analytics

Monitor key metrics:
- Daily/Monthly Active Users (DAU/MAU)
- Session duration
- Screen views
- User retention
- Crash-free users

### Store Analytics

**Google Play Console:**
- Installs and uninstalls
- Ratings and reviews
- User acquisition
- Revenue (if paid)

**App Store Connect:**
- App Units
- Sales and Trends
- Ratings and Reviews
- App Analytics

### Crash Reporting

**Firebase Crashlytics:**
- Monitor crash-free users percentage
- Investigate crash reports
- Fix critical issues promptly
- Release updates

## Best Practices

### Before Each Release

1. Test thoroughly on multiple devices
2. Run all automated tests
3. Perform manual testing
4. Check for memory leaks
5. Verify offline functionality
6. Test on slow networks
7. Review privacy compliance
8. Update documentation

### Store Optimization (ASO)

1. **Keywords:** Research and optimize
2. **Screenshots:** Show best features first
3. **Description:** Clear, compelling, keyword-rich
4. **Icon:** Professional, recognizable
5. **Reviews:** Encourage positive reviews
6. **Updates:** Regular updates show active development

### User Engagement

1. Respond to reviews (both positive and negative)
2. Fix reported bugs quickly
3. Implement requested features
4. Communicate updates clearly
5. Build a community

## Troubleshooting Deployment Issues

See [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) for detailed solutions.

## Additional Resources

### Official Documentation

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Capacitor Deployment Guide](https://capacitorjs.com/docs/deployment)

### Useful Tools

- [Fastlane](https://fastlane.tools/) - Automate deployments
- [App Store Screenshot Generator](https://www.appscreenshot.com/)
- [Google Play Screenshot Generator](https://www.appstorescreenshot.com/)
- [ASO Tools](https://www.apptweak.com/) - App Store Optimization

## Support

For deployment assistance:
- Review this guide thoroughly
- Check troubleshooting section
- Consult official platform documentation
- Contact development team

Good luck with your app launch! 🚀
