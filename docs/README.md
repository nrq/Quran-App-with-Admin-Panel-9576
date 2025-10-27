# Quran App - Developer Documentation

## Welcome

Welcome to the Quran App developer documentation! This comprehensive guide will help you set up, build, deploy, and maintain the mobile application.

## Documentation Overview

This documentation is organized into four main guides:

### 📚 [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)
**Start here if you're new to the project**

Learn how to:
- Install required software and tools
- Set up your development environment
- Configure the project
- Run the app locally
- Set up your IDE

**Time to complete:** 30-60 minutes

---

### 🔨 [Build Process Guide](./BUILD_PROCESS_GUIDE.md)
**Essential for understanding how to build the app**

Learn how to:
- Build for web, Android, and iOS
- Create development and production builds
- Generate signed release builds
- Optimize bundle size
- Configure build settings

**Time to complete:** 20-30 minutes to read, varies for builds

---

### 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
**Follow this when you're ready to publish**

Learn how to:
- Prepare for app store submission
- Submit to Google Play Store
- Submit to Apple App Store
- Create store listings
- Handle app reviews
- Update published apps

**Time to complete:** 2-4 hours for first submission

---

### 🔧 [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
**Reference this when you encounter issues**

Find solutions for:
- Development environment problems
- Build errors
- Platform-specific issues
- Runtime problems
- Deployment issues
- Performance optimization

**Use as needed:** Quick reference guide

---

## Quick Start

### For New Developers

1. **Read the [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)**
   - Install prerequisites
   - Clone and configure the project
   - Run the app locally

2. **Familiarize yourself with the codebase**
   - Explore the project structure
   - Review key components
   - Run tests

3. **Make your first change**
   - Create a feature branch
   - Make a small change
   - Test locally
   - Submit a pull request

### For Building the App

1. **Read the [Build Process Guide](./BUILD_PROCESS_GUIDE.md)**
   - Understand build types
   - Learn platform-specific builds
   - Configure signing

2. **Build for your target platform**
   ```bash
   # Web
   npm run build:prod
   
   # Android
   npm run build:prod
   npx cap sync android
   cd android && ./gradlew bundleRelease
   
   # iOS
   npm run build:prod
   npx cap sync ios
   npx cap open ios
   # Then archive in Xcode
   ```

### For Deploying the App

1. **Complete the pre-deployment checklist**
   - Test thoroughly
   - Prepare assets
   - Update version numbers

2. **Follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md)**
   - Google Play Store submission
   - Apple App Store submission
   - Monitor review status

### When You Encounter Issues

1. **Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)**
   - Find your issue category
   - Follow the solutions
   - Try multiple approaches if needed

2. **Search existing resources**
   - GitHub issues
   - Stack Overflow
   - Official documentation

3. **Ask for help**
   - Provide detailed information
   - Include error messages
   - Share relevant code

---

## Project Overview

### Technology Stack

**Frontend:**
- React 18.3
- Vite 5.4
- Tailwind CSS 3.4
- React Router 7.1

**Mobile:**
- Capacitor 7.4
- Native iOS and Android projects

**Backend Services:**
- Firebase Authentication
- Cloud Firestore
- Firebase Analytics
- Firebase Crashlytics

**Development Tools:**
- ESLint for code quality
- Vitest for testing
- npm scripts for automation

### Project Structure

```
quran-app/
├── android/                    # Android native project
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── build.gradle
│
├── ios/                        # iOS native project
│   └── App/
│       ├── App/
│       └── App.xcodeproj
│
├── src/                        # React source code
│   ├── components/             # Reusable components
│   ├── contexts/               # React contexts (Auth, Quran)
│   ├── pages/                  # Page components
│   ├── utils/                  # Utility functions
│   ├── lib/                    # Third-party integrations
│   ├── mobile-init.js          # Mobile initialization
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
│
├── public/                     # Static assets
│   ├── data/                   # Quran data files
│   └── sw.js                   # Service worker
│
├── docs/                       # Documentation (you are here!)
│   ├── README.md
│   ├── DEVELOPER_SETUP_GUIDE.md
│   ├── BUILD_PROCESS_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── TROUBLESHOOTING_GUIDE.md
│
├── scripts/                    # Build and utility scripts
│   ├── generate-icons.js
│   ├── test-firestore.js
│   ├── test-production-build.js
│   └── validate-env.js
│
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (not in git)
└── .env.example                # Environment template
```

### Key Features

1. **Quran Reading**
   - Complete Quran text in Arabic
   - Multiple translations
   - Verse-by-verse display
   - Adjustable text size

2. **Audio Playback**
   - High-quality recitations
   - Verse-by-verse playback
   - Synchronized highlighting
   - Offline audio support

3. **Search**
   - Full-text search
   - Search by Surah, Juz, or verse
   - Quick navigation

4. **Offline Support**
   - Offline reading
   - Cached audio
   - Firebase offline persistence
   - Service worker caching

5. **User Features**
   - Bookmarks
   - Reading history
   - Favorites
   - User preferences

6. **Mobile-Specific**
   - Native app experience
   - Status bar styling
   - Splash screen
   - Network detection
   - App lifecycle management

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Start development server
npm run dev

# 4. Make changes and test

# 5. Run tests
npm test

# 6. Commit changes
git add .
git commit -m "Description of changes"
git push
```

### Testing on Mobile

**Android:**
```bash
npm run build
npx cap sync android
npx cap open android
# Run in Android Studio
```

**iOS:**
```bash
npm run build
npx cap sync ios
npx cap open ios
# Run in Xcode
```

### Creating a Release

```bash
# 1. Update version numbers
# - package.json
# - capacitor.config.ts
# - android/app/build.gradle (versionCode, versionName)
# - ios/App/App/Info.plist (CFBundleVersion, CFBundleShortVersionString)

# 2. Update changelog
# Add release notes

# 3. Build and test
npm run build:prod
npm run test

# 4. Build for platforms
# Android
cd android && ./gradlew bundleRelease

# iOS
# Archive in Xcode

# 5. Submit to stores
# Follow Deployment Guide
```

---

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest src/components/__tests__/MyComponent.test.jsx --run
```

### Linting

```bash
# Check for errors
npm run lint

# Check for errors only (no warnings)
npm run lint:error
```

### Environment Validation

```bash
# Validate all required environment variables
npm run validate:env
```

### Icon Generation

```bash
# Generate app icons for all platforms
npm run generate:icons
```

### Firebase Testing

```bash
# Test Firestore connection and rules
npm run test:firestore
```

### Production Build Testing

```bash
# Build and test production bundle locally
npm run test:build
```

---

## Environment Variables

Required environment variables (create `.env` file):

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
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

**Important:** Never commit `.env` to version control!

---

## Useful Commands

### npm Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run build:prod             # Build with validation
npm run preview                # Preview production build

# Testing
npm test                       # Run tests once
npm run test:watch             # Run tests in watch mode
npm run test:build             # Test production build
npm run test:firestore         # Test Firebase connection

# Code Quality
npm run lint                   # Run ESLint
npm run lint:error             # Show errors only

# Utilities
npm run validate:env           # Validate environment variables
npm run generate:icons         # Generate app icons
```

### Capacitor Commands

```bash
# Sync web assets to native projects
npx cap sync                   # Sync all platforms
npx cap sync android           # Sync Android only
npx cap sync ios               # Sync iOS only

# Open native IDEs
npx cap open android           # Open Android Studio
npx cap open ios               # Open Xcode

# Add/remove platforms
npx cap add android            # Add Android platform
npx cap add ios                # Add iOS platform
npx cap remove android         # Remove Android platform
npx cap remove ios             # Remove iOS platform

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync
```

### Android Commands

```bash
# Build
cd android
./gradlew assembleDebug        # Debug APK
./gradlew assembleRelease      # Release APK
./gradlew bundleRelease        # Release AAB

# Clean
./gradlew clean                # Clean build

# Install
adb install app-debug.apk      # Install APK
adb uninstall com.nurulquran.dq # Uninstall app

# Logs
adb logcat                     # View logs
adb logcat | grep nurulquran   # Filter logs
```

### iOS Commands

```bash
# Build (in ios/App directory)
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug build
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release build

# Archive
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive

# Simulators
xcrun simctl list              # List simulators
xcrun simctl boot "iPhone 15"  # Boot simulator
```

---

## Best Practices

### Code Quality

1. **Follow React best practices**
   - Use functional components and hooks
   - Keep components small and focused
   - Use proper prop types
   - Avoid unnecessary re-renders

2. **Write clean code**
   - Use meaningful variable names
   - Add comments for complex logic
   - Keep functions small
   - Follow DRY principle

3. **Test your code**
   - Write unit tests for utilities
   - Test critical user flows
   - Test on multiple devices

### Git Workflow

1. **Use feature branches**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Write good commit messages**
   ```bash
   git commit -m "Add audio playback feature"
   ```

3. **Keep commits focused**
   - One feature/fix per commit
   - Commit frequently

4. **Pull before push**
   ```bash
   git pull origin main
   git push origin feature/new-feature
   ```

### Mobile Development

1. **Test on real devices**
   - Emulators are good, but not perfect
   - Test on various screen sizes
   - Test on different OS versions

2. **Optimize for mobile**
   - Minimize bundle size
   - Optimize images
   - Implement lazy loading
   - Cache appropriately

3. **Handle offline scenarios**
   - Test without internet
   - Provide offline indicators
   - Cache critical data

4. **Consider battery and data**
   - Minimize network requests
   - Optimize animations
   - Use efficient algorithms

---

## Resources

### Official Documentation

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools

- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)

### Community

- [Capacitor Community](https://capacitorjs.com/community)
- [React Community](https://react.dev/community)
- [Stack Overflow](https://stackoverflow.com/)
- [GitHub Discussions](https://github.com/)

---

## Support

### Getting Help

1. **Check the documentation**
   - Start with this README
   - Review relevant guides
   - Check troubleshooting guide

2. **Search for existing solutions**
   - GitHub issues
   - Stack Overflow
   - Official documentation

3. **Ask the team**
   - Provide detailed information
   - Include error messages
   - Share relevant code

### Reporting Issues

When reporting issues, include:

- **Environment details** (OS, Node version, etc.)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages and logs**
- **Screenshots if applicable**

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## Changelog

### Version 1.0.0 (Initial Release)

**Features:**
- Complete Quran text in Arabic
- Multiple translations
- Audio recitations
- Search functionality
- Offline support
- User authentication
- Bookmarks and favorites

**Platforms:**
- Web (PWA)
- Android (API 22+)
- iOS (13.0+)

---

## License

[Your License Here]

---

## Contact

- **Email:** your-email@example.com
- **Website:** https://your-website.com
- **GitHub:** https://github.com/your-repo

---

**Happy coding! 🚀**

May this app benefit the Muslim community worldwide.
