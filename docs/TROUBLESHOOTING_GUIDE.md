# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered during development, building, and deployment of the Quran App. Issues are organized by category for easy reference.

## Table of Contents

1. [Development Environment Issues](#development-environment-issues)
2. [Build Issues](#build-issues)
3. [Android-Specific Issues](#android-specific-issues)
4. [iOS-Specific Issues](#ios-specific-issues)
5. [Capacitor Issues](#capacitor-issues)
6. [Firebase Issues](#firebase-issues)
7. [Runtime Issues](#runtime-issues)
8. [Deployment Issues](#deployment-issues)
9. [Performance Issues](#performance-issues)

---

## Development Environment Issues

### Node.js and npm Issues

#### Problem: `npm install` fails with permission errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**

**Option 1: Fix npm permissions (Recommended)**
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Option 2: Use nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 18
nvm use 18
```

#### Problem: `npm install` fails with network errors

**Symptoms:**
```
Error: network timeout
Error: ETIMEDOUT
```

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm config set registry https://registry.npmjs.org/

# Increase timeout
npm config set fetch-timeout 60000

# Try again
npm install
```

#### Problem: Module not found errors after installation

**Symptoms:**
```
Error: Cannot find module 'xyz'
```

**Solutions:**

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Environment Variable Issues

#### Problem: Environment variables not loading

**Symptoms:**
- Firebase not connecting
- `undefined` values in console
- Build fails with missing variables

**Solutions:**

1. **Verify .env file exists:**
```bash
ls -la .env
```

2. **Check .env format:**
```env
# Correct format (no spaces around =)
VITE_FIREBASE_API_KEY=your_key_here

# Incorrect format
VITE_FIREBASE_API_KEY = your_key_here
```

3. **Verify variable names start with VITE_:**
```env
# Correct
VITE_FIREBASE_API_KEY=xxx

# Incorrect (won't be loaded by Vite)
FIREBASE_API_KEY=xxx
```

4. **Restart development server:**
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

5. **Validate environment:**
```bash
npm run validate:env
```

---

## Build Issues

### Web Build Issues

#### Problem: Build fails with "out of memory" error

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Then build
npm run build:prod
```

**Permanent fix (package.json):**
```json
{
  "scripts": {
    "build:prod": "NODE_OPTIONS='--max-old-space-size=4096' npm run validate:env && npm run lint && vite build --mode production"
  }
}
```

#### Problem: Build succeeds but app doesn't work

**Symptoms:**
- White screen after deployment
- Console errors about missing modules
- Assets not loading

**Solutions:**

1. **Check base path in vite.config.js:**
```javascript
export default defineConfig({
  base: '/', // or '/your-subdirectory/' if deployed to subdirectory
});
```

2. **Verify dist folder contents:**
```bash
ls -la dist/
# Should contain index.html, assets/, etc.
```

3. **Test production build locally:**
```bash
npm run test:build
```

4. **Check browser console for errors**

#### Problem: ESLint errors blocking build

**Symptoms:**
```
Build failed due to ESLint errors
```

**Solutions:**

1. **Fix the errors:**
```bash
npm run lint
# Fix reported issues
```

2. **Temporary: Build without linting (not recommended):**
```bash
vite build
```

### Capacitor Sync Issues

#### Problem: `npx cap sync` fails

**Symptoms:**
```
Error: capacitor.config.ts not found
Error: webDir does not exist
```

**Solutions:**

1. **Verify capacitor.config.ts exists:**
```bash
ls capacitor.config.ts
```

2. **Build web app first:**
```bash
npm run build
```

3. **Verify dist folder exists:**
```bash
ls -la dist/
```

4. **Try sync again:**
```bash
npx cap sync
```

---

## Android-Specific Issues

### Gradle Issues

#### Problem: Gradle sync fails

**Symptoms:**
```
Could not resolve all dependencies
Gradle sync failed
```

**Solutions:**

1. **Clean Gradle cache:**
```bash
cd android
./gradlew clean
./gradlew --stop
rm -rf .gradle
```

2. **Invalidate Android Studio caches:**
- File > Invalidate Caches / Restart
- Select "Invalidate and Restart"

3. **Update Gradle wrapper:**
```bash
cd android
./gradlew wrapper --gradle-version=8.0
```

4. **Check internet connection and proxy settings**

#### Problem: Build fails with "SDK not found"

**Symptoms:**
```
SDK location not found
ANDROID_HOME not set
```

**Solutions:**

1. **Set ANDROID_HOME:**
```bash
# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Windows
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
```

2. **Create local.properties:**
```bash
cd android
echo "sdk.dir=/path/to/your/Android/sdk" > local.properties
```

3. **Verify SDK installation in Android Studio:**
- Preferences > Appearance & Behavior > System Settings > Android SDK
- Install required SDK versions (22-35)

#### Problem: Build fails with Java version error

**Symptoms:**
```
Unsupported Java version
Java 17 is required
```

**Solutions:**

1. **Check Java version:**
```bash
java -version
```

2. **Install JDK 17:**
- Download from https://adoptium.net/
- Install and set JAVA_HOME

3. **Set JAVA_HOME:**
```bash
# macOS/Linux
export JAVA_HOME=/path/to/jdk-17

# Windows
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

4. **Configure in Android Studio:**
- File > Project Structure > SDK Location
- Set JDK location to JDK 17

### APK/AAB Issues

#### Problem: Signed build fails

**Symptoms:**
```
Keystore not found
Invalid keystore format
```

**Solutions:**

1. **Verify keystore file exists:**
```bash
ls -la /path/to/keystore.keystore
```

2. **Check keystore.properties:**
```properties
storeFile=/absolute/path/to/keystore.keystore
storePassword=your_password
keyAlias=your_alias
keyPassword=your_password
```

3. **Test keystore:**
```bash
keytool -list -v -keystore /path/to/keystore.keystore
```

4. **Regenerate keystore if corrupted:**
```bash
keytool -genkey -v -keystore new-keystore.keystore \
  -alias app-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### Problem: ProGuard errors

**Symptoms:**
```
ProGuard: can't find referenced class
Missing classes warning
```

**Solutions:**

1. **Update proguard-rules.pro:**
```proguard
# Keep Capacitor
-keep class com.getcapacitor.** { *; }

# Keep Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

2. **Disable minification temporarily to test:**
```gradle
buildTypes {
    release {
        minifyEnabled false
        shrinkResources false
    }
}
```

### Device/Emulator Issues

#### Problem: App not installing on device

**Symptoms:**
```
INSTALL_FAILED_INSUFFICIENT_STORAGE
INSTALL_FAILED_UPDATE_INCOMPATIBLE
```

**Solutions:**

1. **Check device storage:**
```bash
adb shell df
```

2. **Uninstall existing version:**
```bash
adb uninstall com.nurulquran.dq
```

3. **Clear app data:**
```bash
adb shell pm clear com.nurulquran.dq
```

4. **Reinstall:**
```bash
adb install app-debug.apk
```

#### Problem: App crashes on startup

**Symptoms:**
- App opens then immediately closes
- Black screen then crash

**Solutions:**

1. **Check logcat:**
```bash
adb logcat | grep -i "nurulquran"
```

2. **Common causes:**
- Missing permissions in AndroidManifest.xml
- Firebase configuration error
- Native library incompatibility

3. **Verify AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## iOS-Specific Issues

### CocoaPods Issues

#### Problem: `pod install` fails

**Symptoms:**
```
Unable to find a specification for...
Pod install failed
```

**Solutions:**

1. **Update CocoaPods:**
```bash
sudo gem install cocoapods
```

2. **Update pod repo:**
```bash
pod repo update
```

3. **Clean and reinstall:**
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
```

4. **Check Ruby version:**
```bash
ruby --version
# Should be 2.6 or higher
```

### Xcode Issues

#### Problem: Build fails with signing error

**Symptoms:**
```
Code signing error
No signing certificate found
Provisioning profile not found
```

**Solutions:**

1. **Configure signing in Xcode:**
- Select project > Target > Signing & Capabilities
- Select your Team
- Enable "Automatically manage signing"

2. **For manual signing:**
- Download certificates from Apple Developer portal
- Install in Keychain
- Download provisioning profiles
- Select in Xcode

3. **Clean build folder:**
- Product > Clean Build Folder (Cmd+Shift+K)

#### Problem: Archive fails

**Symptoms:**
```
Archive failed with errors
Generic Xcode error
```

**Solutions:**

1. **Clean derived data:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

2. **Update CocoaPods:**
```bash
cd ios/App
pod update
```

3. **Check scheme settings:**
- Product > Scheme > Edit Scheme
- Ensure "Archive" is set to "Release"

4. **Verify build settings:**
- Build Settings > Code Signing Identity
- Should be "iOS Distribution" for release

#### Problem: Simulator not working

**Symptoms:**
```
Unable to boot simulator
Simulator not found
```

**Solutions:**

1. **Reset simulator:**
- Device > Erase All Content and Settings

2. **Delete and recreate:**
```bash
xcrun simctl delete unavailable
xcrun simctl create "iPhone 15" "iPhone 15"
```

3. **Restart Xcode and simulator**

### Device Issues

#### Problem: App not installing on device

**Symptoms:**
```
Installation failed
Could not install app
```

**Solutions:**

1. **Trust computer on device:**
- Unlock device
- Tap "Trust" when prompted

2. **Trust developer certificate:**
- Settings > General > VPN & Device Management
- Trust your developer certificate

3. **Check device compatibility:**
- Minimum iOS version: 13.0
- Verify in Xcode: General > Deployment Info

4. **Clean and rebuild:**
- Product > Clean Build Folder
- Product > Build

---

## Capacitor Issues

### Plugin Issues

#### Problem: Capacitor plugin not working

**Symptoms:**
```
Plugin not implemented
Plugin method not available
```

**Solutions:**

1. **Verify plugin installation:**
```bash
npm list @capacitor/plugin-name
```

2. **Reinstall plugin:**
```bash
npm uninstall @capacitor/plugin-name
npm install @capacitor/plugin-name
npx cap sync
```

3. **Check plugin registration (Android):**
```java
// android/app/src/main/java/.../MainActivity.java
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Plugins are auto-registered
    }
}
```

4. **Check plugin registration (iOS):**
- Plugins should be auto-registered
- Verify in Podfile

### WebView Issues

#### Problem: White screen in mobile app

**Symptoms:**
- App opens but shows white screen
- No content visible

**Solutions:**

1. **Check web build:**
```bash
npm run build
ls -la dist/
```

2. **Sync with Capacitor:**
```bash
npx cap sync
```

3. **Check capacitor.config.ts:**
```typescript
const config: CapacitorConfig = {
  webDir: 'dist', // Verify this matches your build output
};
```

4. **Enable WebView debugging:**

**Android:**
```java
// MainActivity.java
if (BuildConfig.DEBUG) {
    WebView.setWebContentsDebuggingEnabled(true);
}
```

**iOS:**
- Settings > Safari > Advanced > Web Inspector

5. **Check console for errors:**
- Chrome DevTools (Android)
- Safari Web Inspector (iOS)

---

## Firebase Issues

### Connection Issues

#### Problem: Firebase not connecting

**Symptoms:**
```
Firebase: Error (auth/network-request-failed)
Firestore: PERMISSION_DENIED
```

**Solutions:**

1. **Verify environment variables:**
```bash
npm run validate:env
```

2. **Check Firebase config:**
```javascript
// src/lib/firebase.js
console.log('Firebase config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... other config
});
```

3. **Verify Firebase project settings:**
- Firebase Console > Project Settings
- Ensure API key is correct
- Check authorized domains

4. **Test Firebase connection:**
```bash
npm run test:firestore
```

### Authentication Issues

#### Problem: Firebase Auth not working

**Symptoms:**
```
auth/operation-not-allowed
auth/invalid-api-key
```

**Solutions:**

1. **Enable authentication method:**
- Firebase Console > Authentication > Sign-in method
- Enable Email/Password or other methods

2. **Check API key restrictions:**
- Google Cloud Console > Credentials
- Verify API key restrictions

3. **Add authorized domains:**
- Firebase Console > Authentication > Settings
- Add your domain to authorized domains

### Firestore Issues

#### Problem: Firestore permission denied

**Symptoms:**
```
FirebaseError: Missing or insufficient permissions
```

**Solutions:**

1. **Check Firestore rules:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For testing only!
    }
  }
}
```

2. **Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

3. **Verify user authentication:**
```javascript
const user = auth.currentUser;
console.log('Current user:', user);
```

---

## Runtime Issues

### Performance Issues

#### Problem: App is slow or laggy

**Solutions:**

1. **Enable React DevTools Profiler:**
- Identify slow components
- Optimize re-renders

2. **Optimize images:**
```bash
# Use optimized formats (WebP, AVIF)
# Compress images
# Use appropriate sizes
```

3. **Implement code splitting:**
```javascript
// Use React.lazy for route-based splitting
const Surah = React.lazy(() => import('./pages/Surah'));
```

4. **Check bundle size:**
```bash
npm run build
# Check dist/assets/ file sizes
```

5. **Profile with Chrome DevTools:**
- Performance tab
- Identify bottlenecks

### Memory Issues

#### Problem: App crashes due to memory

**Symptoms:**
- App closes unexpectedly
- "Out of memory" errors in logs

**Solutions:**

1. **Optimize audio caching:**
```javascript
// Limit cache size
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
```

2. **Clean up event listeners:**
```javascript
useEffect(() => {
  const handler = () => {};
  window.addEventListener('event', handler);
  
  return () => {
    window.removeEventListener('event', handler);
  };
}, []);
```

3. **Optimize images:**
- Use appropriate resolutions
- Lazy load images
- Implement virtual scrolling for long lists

### Network Issues

#### Problem: Offline mode not working

**Symptoms:**
- App doesn't work without internet
- Cached data not loading

**Solutions:**

1. **Verify offline persistence:**
```javascript
// src/lib/firebase.js
enableIndexedDbPersistence(db)
  .catch((err) => {
    console.error('Persistence error:', err);
  });
```

2. **Check service worker:**
```bash
# Verify sw.js exists
ls public/sw.js

# Check registration in browser DevTools
# Application > Service Workers
```

3. **Test offline functionality:**
- Open DevTools
- Network tab > Offline
- Test app functionality

---

## Deployment Issues

### Google Play Store Issues

#### Problem: App rejected for policy violation

**Common reasons:**
- Missing privacy policy
- Inappropriate content
- Misleading information
- Broken functionality

**Solutions:**

1. **Review rejection email carefully**
2. **Fix the specific issues mentioned**
3. **Update app listing if needed**
4. **Increment version/build number**
5. **Resubmit**

#### Problem: Upload fails

**Symptoms:**
```
Upload failed
Invalid APK/AAB
```

**Solutions:**

1. **Verify file integrity:**
```bash
ls -lh app-release.aab
# Should be reasonable size (not 0 bytes)
```

2. **Check signing:**
```bash
jarsigner -verify -verbose -certs app-release.aab
```

3. **Increment version code:**
```gradle
versionCode 2 // Must be higher than previous
```

### Apple App Store Issues

#### Problem: App rejected during review

**Common reasons:**
- Crashes during review
- Missing functionality
- Guideline violations
- Incomplete information

**Solutions:**

1. **Review rejection details in Resolution Center**
2. **Fix reported issues**
3. **Test thoroughly**
4. **Respond to reviewer or resubmit**

#### Problem: Upload fails

**Symptoms:**
```
Invalid binary
Missing compliance
```

**Solutions:**

1. **Validate archive before upload:**
- Xcode > Organizer > Validate App

2. **Check export compliance:**
- App Store Connect > App Information
- Complete export compliance questionnaire

3. **Verify bundle ID matches:**
- Xcode project settings
- App Store Connect app settings

---

## Performance Issues

### App Launch Time

#### Problem: App takes too long to start

**Solutions:**

1. **Optimize splash screen duration:**
```typescript
// capacitor.config.ts
plugins: {
  SplashScreen: {
    launchShowDuration: 2000, // Reduce if needed
  }
}
```

2. **Lazy load components:**
```javascript
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
```

3. **Defer non-critical initialization:**
```javascript
useEffect(() => {
  // Critical initialization
  initializeApp();
  
  // Defer analytics
  setTimeout(() => {
    initializeAnalytics();
  }, 1000);
}, []);
```

### Bundle Size

#### Problem: App size is too large

**Solutions:**

1. **Analyze bundle:**
```bash
npm run build
# Check dist/assets/ sizes
```

2. **Enable tree shaking:**
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        firebase: ['firebase/app', 'firebase/auth'],
      },
    },
  },
}
```

3. **Optimize images:**
- Use WebP format
- Compress images
- Remove unused assets

4. **Remove unused dependencies:**
```bash
npm uninstall unused-package
```

---

## Getting Additional Help

### Resources

1. **Official Documentation:**
   - [Capacitor Docs](https://capacitorjs.com/docs)
   - [React Docs](https://react.dev/)
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Android Developer Docs](https://developer.android.com/)
   - [iOS Developer Docs](https://developer.apple.com/documentation/)

2. **Community Support:**
   - Stack Overflow
   - GitHub Issues
   - Discord/Slack communities
   - Reddit (r/reactjs, r/androiddev, r/iOSProgramming)

3. **Debugging Tools:**
   - Chrome DevTools
   - React DevTools
   - Android Studio Profiler
   - Xcode Instruments
   - Firebase Console

### Reporting Issues

When reporting issues, include:

1. **Environment:**
   - OS and version
   - Node.js version
   - npm version
   - Capacitor version
   - Platform (Android/iOS)

2. **Steps to reproduce:**
   - Detailed steps
   - Expected behavior
   - Actual behavior

3. **Error messages:**
   - Full error text
   - Stack traces
   - Console logs

4. **Code samples:**
   - Relevant code snippets
   - Configuration files

### Emergency Fixes

If you need to quickly fix a critical issue:

1. **Revert to last working version:**
```bash
git log --oneline
git revert <commit-hash>
```

2. **Hotfix branch:**
```bash
git checkout -b hotfix/critical-bug
# Fix the bug
git commit -m "Fix critical bug"
```

3. **Emergency deployment:**
- Build and test quickly
- Deploy to stores
- Monitor closely

---

## Preventive Measures

### Best Practices

1. **Version Control:**
   - Commit frequently
   - Use meaningful commit messages
   - Tag releases

2. **Testing:**
   - Write tests for critical features
   - Test on multiple devices
   - Test offline functionality

3. **Monitoring:**
   - Set up crash reporting
   - Monitor analytics
   - Track performance metrics

4. **Documentation:**
   - Document configuration changes
   - Keep README updated
   - Maintain changelog

5. **Backups:**
   - Backup keystores securely
   - Backup environment variables
   - Backup Firebase configuration

---

This troubleshooting guide covers the most common issues. For issues not covered here, consult the official documentation or seek community support.
