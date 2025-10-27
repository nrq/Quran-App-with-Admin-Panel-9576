# Developer Setup Guide

## Overview

This guide will help you set up your development environment for the Quran App mobile application. The app is built with React, Vite, and Capacitor, targeting both Android and iOS platforms.

## Prerequisites

### Required Software

#### For All Platforms

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

#### For Android Development

1. **Java Development Kit (JDK) 17**
   - Download from: https://adoptium.net/
   - Set `JAVA_HOME` environment variable
   - Verify: `java -version`

2. **Android Studio** (latest stable version)
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API 22-35)
   - Install Android SDK Build-Tools
   - Install Android Emulator (optional, for testing)

3. **Android SDK Environment Variables**
   ```bash
   # Add to your shell profile (.bashrc, .zshrc, etc.)
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   # export ANDROID_HOME=$HOME/Android/Sdk        # Linux
   # export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
   
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

#### For iOS Development (macOS only)

1. **Xcode** (latest stable version)
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`
   - Verify: `xcode-select -p`

2. **CocoaPods**
   - Install: `sudo gem install cocoapods`
   - Verify: `pod --version`

3. **iOS Simulator** (included with Xcode)

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd quran-app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install iOS dependencies (macOS only)
cd ios/App
pod install
cd ../..
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Supabase Configuration (if used)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Quest Labs Configuration (if used)
VITE_QUEST_APP_ID=your_quest_app_id
VITE_QUEST_API_KEY=your_quest_api_key
VITE_QUEST_ENTITY_ID=your_quest_entity_id
```

**Important:** Never commit the `.env` file to version control!

### 4. Verify Environment Variables

```bash
npm run validate:env
```

This will check that all required environment variables are set.

## Development Workflow

### Web Development

For rapid development and testing of web features:

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

The development server includes:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Source maps for debugging

### Mobile Development

#### Android

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Run on emulator or device:**
   - Click the "Run" button in Android Studio
   - Select your target device/emulator
   - Wait for build and installation

#### iOS (macOS only)

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

4. **Run on simulator or device:**
   - Select your target device/simulator
   - Click the "Run" button (▶️)
   - Wait for build and installation

## Project Structure

```
quran-app/
├── android/                 # Android native project
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── build.gradle
├── ios/                     # iOS native project
│   └── App/
│       ├── App/
│       └── App.xcodeproj
├── src/                     # React source code
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── pages/               # Page components
│   ├── utils/               # Utility functions
│   ├── lib/                 # Third-party integrations
│   ├── mobile-init.js       # Mobile initialization
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── dist/                    # Build output (generated)
├── docs/                    # Documentation
├── scripts/                 # Build and utility scripts
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables (not in git)
```

## Common Development Tasks

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest src/components/__tests__/MyComponent.test.jsx --run
```

### Linting

```bash
# Run ESLint
npm run lint

# Run ESLint (errors only)
npm run lint:error
```

### Building for Production

```bash
# Build with validation
npm run build:prod

# Test production build locally
npm run test:build
```

### Generating Icons

```bash
# Generate app icons for all platforms
npm run generate:icons
```

### Testing Firebase Connection

```bash
# Test Firestore connection and rules
npm run test:firestore
```

## IDE Setup

### Visual Studio Code (Recommended)

**Recommended Extensions:**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Firebase Explorer
- Android iOS Emulator

**Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "javascriptreact"],
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Android Studio

**Recommended Plugins:**
- Capacitor
- Firebase

**Configuration:**
- Enable auto-import
- Set JDK to version 17
- Configure Android SDK path

### Xcode

**Configuration:**
- Enable automatic code signing (for development)
- Set development team
- Configure simulator preferences

## Debugging

### Web Debugging

Use Chrome DevTools:
1. Open app in browser
2. Press F12 or right-click > Inspect
3. Use Console, Network, and React DevTools tabs

### Android Debugging

**Chrome DevTools:**
1. Connect Android device or start emulator
2. Open Chrome and navigate to `chrome://inspect`
3. Click "Inspect" on your app
4. Use DevTools to debug web content

**Android Studio Logcat:**
1. Open Android Studio
2. View > Tool Windows > Logcat
3. Filter by app package name

**ADB Commands:**
```bash
# View connected devices
adb devices

# View logs
adb logcat

# Clear app data
adb shell pm clear com.nurulquran.dq

# Uninstall app
adb uninstall com.nurulquran.dq
```

### iOS Debugging

**Safari Web Inspector:**
1. Enable on device: Settings > Safari > Advanced > Web Inspector
2. Open Safari on Mac
3. Develop > [Your Device] > [Your App]

**Xcode Console:**
1. Open Xcode
2. Window > Devices and Simulators
3. Select your device
4. View console logs

## Troubleshooting Setup Issues

### Node.js Issues

**Problem:** `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Android Studio Issues

**Problem:** Gradle sync fails
**Solution:**
1. File > Invalidate Caches / Restart
2. Check `JAVA_HOME` is set correctly
3. Update Gradle wrapper: `./gradlew wrapper --gradle-version=8.0`

**Problem:** SDK not found
**Solution:**
1. Open Android Studio > Preferences > Appearance & Behavior > System Settings > Android SDK
2. Install required SDK versions (22-35)
3. Set `ANDROID_HOME` environment variable

### iOS Issues

**Problem:** CocoaPods installation fails
**Solution:**
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clear CocoaPods cache
pod cache clean --all

# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

**Problem:** Code signing error
**Solution:**
1. Open Xcode
2. Select project > Signing & Capabilities
3. Select your development team
4. Enable "Automatically manage signing"

### Capacitor Issues

**Problem:** Capacitor sync fails
**Solution:**
```bash
# Clean and rebuild
npm run build
npx cap sync

# If still failing, remove and re-add platforms
npx cap remove android
npx cap remove ios
npx cap add android
npx cap add ios
```

## Getting Help

### Resources

- **Capacitor Documentation:** https://capacitorjs.com/docs
- **React Documentation:** https://react.dev/
- **Vite Documentation:** https://vitejs.dev/
- **Firebase Documentation:** https://firebase.google.com/docs
- **Android Developer Guide:** https://developer.android.com/
- **iOS Developer Guide:** https://developer.apple.com/documentation/

### Support Channels

- Check existing documentation in `docs/` folder
- Review troubleshooting guide
- Check GitHub issues
- Contact development team

## Next Steps

After completing the setup:

1. Review the [Build Process Guide](./BUILD_PROCESS_GUIDE.md)
2. Read the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
3. Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
4. Explore the codebase and run the app locally

Happy coding! 🚀
