# Build Process Guide

## Overview

This guide covers the complete build process for the Quran App on both Android and iOS platforms. It includes development builds, production builds, and release builds for app store submission.

## Build Types

### Development Build
- Used for local testing and debugging
- Includes source maps and debugging symbols
- Not optimized for performance
- Uses debug signing certificates

### Production Build
- Optimized for performance
- Minified and tree-shaken code
- No source maps (smaller bundle size)
- Uses release signing certificates

### Release Build
- Production build + app store signing
- Code obfuscation enabled
- Ready for app store submission

## Web Build Process

### Development Build

```bash
# Start development server (no build needed)
npm run dev
```

This starts Vite's development server with:
- Hot Module Replacement (HMR)
- Fast refresh
- Source maps
- Development mode React

### Production Build

```bash
# Build with environment validation and linting
npm run build:prod
```

This command:
1. Validates environment variables (`validate:env`)
2. Runs ESLint to check for errors
3. Builds optimized production bundle
4. Outputs to `dist/` directory

**Build Output:**
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Main JavaScript bundle
│   ├── index-[hash].css     # Compiled CSS
│   └── [other-assets]       # Images, fonts, etc.
└── sw.js                    # Service worker (web only)
```

### Testing Production Build

```bash
# Test the production build locally
npm run test:build
```

This script:
- Builds the production bundle
- Starts a local server
- Validates the build output

## Android Build Process

### Prerequisites

- Android Studio installed
- Android SDK (API 22-35)
- JDK 17
- Gradle 8.0+

### Development Build

#### Step 1: Build Web Assets

```bash
npm run build
```

#### Step 2: Sync with Capacitor

```bash
npx cap sync android
```

This command:
- Copies web assets from `dist/` to `android/app/src/main/assets/public/`
- Updates Capacitor plugins
- Syncs configuration from `capacitor.config.ts`

#### Step 3: Open in Android Studio

```bash
npx cap open android
```

#### Step 4: Build and Run

**Option A: Using Android Studio**
1. Click "Run" button (▶️) or press Shift+F10
2. Select target device/emulator
3. Wait for build and installation

**Option B: Using Command Line**
```bash
cd android
./gradlew assembleDebug

# Install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Production Build (Unsigned)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Release Build (Signed)

#### Step 1: Create Keystore (First Time Only)

```bash
keytool -genkey -v -keystore quran-app-release.keystore \
  -alias quran-app -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Store the keystore file and passwords securely!

#### Step 2: Configure Signing

Create `android/keystore.properties`:

```properties
storeFile=/path/to/quran-app-release.keystore
storePassword=your_store_password
keyAlias=quran-app
keyPassword=your_key_password
```

**Important:** Add `keystore.properties` to `.gitignore`!

Update `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Step 3: Build Signed AAB

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### Step 4: Verify the Build

```bash
# Check AAB contents
bundletool build-apks --bundle=app-release.aab \
  --output=app-release.apks \
  --mode=universal

# Extract and install
unzip app-release.apks -d apks
adb install apks/universal.apk
```

### Build Configuration

**File: `android/app/build.gradle`**

Key configurations:
```gradle
android {
    namespace "com.nurulquran.dq"
    compileSdk 35
    
    defaultConfig {
        applicationId "com.nurulquran.dq"
        minSdkVersion 22
        targetSdkVersion 35
        versionCode 1              // Increment for each release
        versionName "1.0.0"        // Semantic version
    }
    
    buildTypes {
        release {
            minifyEnabled true          // Enable code shrinking
            shrinkResources true        // Remove unused resources
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 
                          'proguard-rules.pro'
        }
    }
}
```

**File: `android/variables.gradle`**

```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 35
    targetSdkVersion = 35
    // ... other versions
}
```

### ProGuard Configuration

**File: `android/app/proguard-rules.pro`**

```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
```

## iOS Build Process

### Prerequisites

- macOS with Xcode installed
- CocoaPods installed
- Apple Developer account (for device testing and release)

### Development Build

#### Step 1: Build Web Assets

```bash
npm run build
```

#### Step 2: Sync with Capacitor

```bash
npx cap sync ios
```

This command:
- Copies web assets to `ios/App/App/public/`
- Updates Capacitor plugins
- Runs `pod install` to update dependencies

#### Step 3: Open in Xcode

```bash
npx cap open ios
```

#### Step 4: Configure Signing

1. Select the project in Xcode
2. Select the "App" target
3. Go to "Signing & Capabilities" tab
4. Select your development team
5. Enable "Automatically manage signing"

#### Step 5: Build and Run

**Option A: Using Xcode**
1. Select target device/simulator
2. Click "Run" button (▶️) or press Cmd+R
3. Wait for build and installation

**Option B: Using Command Line**
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

### Production Build (Archive)

#### Step 1: Prepare for Archive

1. Select "Any iOS Device" as the build target
2. Ensure signing is configured correctly
3. Set build configuration to "Release"

#### Step 2: Create Archive

**Option A: Using Xcode**
1. Product > Archive
2. Wait for archive to complete
3. Organizer window will open automatically

**Option B: Using Command Line**
```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ./build/App.xcarchive \
  archive
```

#### Step 3: Validate Archive

In Xcode Organizer:
1. Select your archive
2. Click "Validate App"
3. Select distribution method (App Store Connect)
4. Follow validation steps
5. Fix any issues reported

#### Step 4: Export IPA

**Option A: Using Xcode**
1. In Organizer, select your archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload" or "Export"
5. Follow the wizard

**Option B: Using Command Line**
```bash
xcodebuild -exportArchive \
  -archivePath ./build/App.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist exportOptions.plist
```

**exportOptions.plist:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

### Build Configuration

**File: `ios/App/App/Info.plist`**

Key configurations:
```xml
<key>CFBundleDisplayName</key>
<string>Quran App</string>

<key>CFBundleIdentifier</key>
<string>com.nurulquran.dq</string>

<key>CFBundleVersion</key>
<string>1</string>

<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

**File: `ios/App/Podfile`**

```ruby
platform :ios, '13.0'

target 'App' do
  capacitor_pods
  # Add your Pods here
end
```

## Build Optimization

### Web Bundle Optimization

**vite.config.js:**
```javascript
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Android Optimization

**build.gradle optimizations:**
```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            
            // Enable R8 full mode
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
    
    // Enable build cache
    buildCache {
        local {
            enabled = true
        }
    }
}
```

### iOS Optimization

**Xcode Build Settings:**
- Enable "Optimize for Speed" (-O3)
- Enable "Link-Time Optimization"
- Set "Strip Debug Symbols During Copy" to Yes
- Set "Strip Linked Product" to Yes (Release only)

## Build Scripts

### Custom Build Scripts

**package.json:**
```json
{
  "scripts": {
    "build:web": "vite build",
    "build:android": "npm run build:web && npx cap sync android",
    "build:ios": "npm run build:web && npx cap sync ios",
    "build:all": "npm run build:web && npx cap sync",
    "release:android": "cd android && ./gradlew bundleRelease",
    "release:ios": "cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive"
  }
}
```

## Build Verification

### Pre-Build Checklist

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint:error`)
- [ ] Environment variables validated (`npm run validate:env`)
- [ ] Version numbers updated
- [ ] Build numbers incremented
- [ ] Changelog updated

### Post-Build Verification

#### Android
```bash
# Check APK/AAB size
ls -lh android/app/build/outputs/bundle/release/

# Verify signing
jarsigner -verify -verbose -certs app-release.aab

# Test installation
adb install app-release.apk
```

#### iOS
```bash
# Check IPA size
ls -lh build/App.ipa

# Verify archive
xcodebuild -exportArchive -archivePath ./build/App.xcarchive -exportPath ./build -exportOptionsPlist exportOptions.plist
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build Mobile Apps

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web app
        run: npm run build:prod
      
      - name: Build Android
        run: |
          npx cap sync android
          cd android
          ./gradlew assembleRelease

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install CocoaPods
        run: sudo gem install cocoapods
      
      - name: Build web app
        run: npm run build:prod
      
      - name: Build iOS
        run: |
          npx cap sync ios
          cd ios/App
          xcodebuild -workspace App.xcworkspace -scheme App -configuration Release build
```

## Troubleshooting Build Issues

See [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) for detailed solutions to common build problems.

## Next Steps

After successful builds:
1. Test the app thoroughly on devices
2. Review the [Deployment Guide](./DEPLOYMENT_GUIDE.md)
3. Prepare store listings and assets
4. Submit to app stores

## Additional Resources

- [Capacitor Build Documentation](https://capacitorjs.com/docs/basics/building-your-app)
- [Android Build Documentation](https://developer.android.com/studio/build)
- [iOS Build Documentation](https://developer.apple.com/documentation/xcode/building-your-app)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
