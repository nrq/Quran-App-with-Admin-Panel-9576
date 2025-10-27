# App Icon Generation Guide

This guide explains how to generate app icons for both Android and iOS platforms using Capacitor Assets.

## Overview

The `@capacitor/assets` package has been installed to automate the generation of platform-specific app icons from a single master icon file.

## Prerequisites

✅ **Completed:**
- @capacitor/assets package installed
- resources/ directory created
- Icon generation script created
- Documentation added

⚠️ **Required:**
- Master icon file (1024x1024 PNG) needs to be created

## Quick Start

### Step 1: Create Your Master Icon

Create a 1024x1024 pixel PNG image with your app icon design and save it as:

```
resources/icon.png
```

**Design Requirements:**
- Size: 1024x1024 pixels
- Format: PNG
- Color Mode: RGBA (supports transparency)
- Safe Zone: Keep important elements in center 80%
- Simple Design: Should be recognizable at 48x48 pixels

### Step 2: Generate Icons

Run the icon generation script:

```bash
npm run generate:icons
```

Or use the Capacitor Assets command directly:

```bash
npx capacitor-assets generate --iconBackgroundColor '#ffffff'
```

### Step 3: Verify Generated Icons

The script will automatically verify that icons were generated in:

**Android:**
```
android/app/src/main/res/mipmap-mdpi/
android/app/src/main/res/mipmap-hdpi/
android/app/src/main/res/mipmap-xhdpi/
android/app/src/main/res/mipmap-xxhdpi/
android/app/src/main/res/mipmap-xxxhdpi/
```

**iOS:**
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

### Step 4: Sync and Test

```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

## Generated Icon Sizes

### Android Icons

| Density | Size | Usage |
|---------|------|-------|
| mdpi | 48x48 | Low density screens |
| hdpi | 72x72 | Medium density screens |
| xhdpi | 96x96 | High density screens |
| xxhdpi | 144x144 | Extra high density screens |
| xxxhdpi | 192x192 | Extra extra high density screens |

### iOS Icons

| Size | Scale | Usage |
|------|-------|-------|
| 20x20 | 1x, 2x, 3x | Notification icon |
| 29x29 | 1x, 2x, 3x | Settings icon |
| 40x40 | 1x, 2x, 3x | Spotlight icon |
| 60x60 | 2x, 3x | App icon (iPhone) |
| 76x76 | 1x, 2x | App icon (iPad) |
| 83.5x83.5 | 2x | App icon (iPad Pro) |
| 1024x1024 | 1x | App Store |

## Icon Design Best Practices

### Do's ✅
- Use simple, bold designs
- Ensure good contrast
- Test at small sizes (48x48)
- Use your brand colors
- Keep important elements centered
- Use vector graphics when possible
- Export at highest quality

### Don'ts ❌
- Don't use small text
- Don't use fine details
- Don't use photos (usually)
- Don't fill entire canvas (leave padding)
- Don't use gradients excessively
- Don't use drop shadows

## Design Tools

### Professional Tools
- **Adobe Illustrator**: Vector design
- **Adobe Photoshop**: Raster design
- **Sketch**: macOS design tool
- **Figma**: Online collaborative design

### Free Tools
- **Figma** (Free tier): https://figma.com
- **Canva**: https://canva.com
- **GIMP**: Free Photoshop alternative
- **Inkscape**: Free vector editor
- **Photopea**: Online Photoshop alternative

### Icon Templates
- **Figma Icon Templates**: Search "app icon template"
- **Canva App Icon Templates**: Built-in templates
- **iOS Design Resources**: https://developer.apple.com/design/resources/
- **Material Design Icons**: https://material.io/design/iconography

## Troubleshooting

### Icon Not Found Error

If you see "Master icon not found":
1. Ensure file is named exactly `icon.png`
2. Ensure file is in `resources/` directory
3. Check file is 1024x1024 pixels
4. Verify file format is PNG

### Generation Fails

If icon generation fails:
1. Check that @capacitor/assets is installed
2. Verify icon.png is valid PNG format
3. Try running with verbose output:
   ```bash
   npx capacitor-assets generate --iconBackgroundColor '#ffffff' --verbose
   ```

### Icons Not Appearing

If icons don't appear after generation:
1. Run `npx cap sync` to sync changes
2. Clean and rebuild the native projects
3. Uninstall and reinstall the app on device
4. Check that icon files exist in native directories

### Android Studio Issues

If icons don't show in Android Studio:
1. File > Invalidate Caches / Restart
2. Clean Project (Build > Clean Project)
3. Rebuild Project (Build > Rebuild Project)

### Xcode Issues

If icons don't show in Xcode:
1. Clean Build Folder (Product > Clean Build Folder)
2. Delete DerivedData folder
3. Close and reopen Xcode

## Testing Your Icons

### Android Testing
1. Open Android Studio: `npx cap open android`
2. Run on emulator or device
3. Check home screen icon
4. Check app switcher icon
5. Test on different Android versions
6. Test on different screen densities

### iOS Testing
1. Open Xcode: `npx cap open ios`
2. Run on simulator or device
3. Check home screen icon
4. Check app switcher icon
5. Test on different iOS versions
6. Test on different device sizes (iPhone, iPad)

## Updating Icons

To update your app icons:

1. Replace `resources/icon.png` with new design
2. Run `npm run generate:icons`
3. Run `npx cap sync`
4. Rebuild and test on both platforms

## Additional Resources

- **Capacitor Assets Documentation**: https://github.com/ionic-team/capacitor-assets
- **Android Icon Guidelines**: https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher
- **iOS Icon Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Material Design Icons**: https://material.io/design/iconography/product-icons.html

## Current Status

### ✅ Completed
- [x] Installed @capacitor/assets package
- [x] Created resources/ directory structure
- [x] Created icon generation script
- [x] Added npm script command
- [x] Created documentation

### ⚠️ Pending
- [ ] Create master icon (resources/icon.png)
- [ ] Run icon generation
- [ ] Verify icons on Android
- [ ] Verify icons on iOS
- [ ] Test on physical devices

## Next Steps

1. **Create your master icon** (1024x1024 PNG)
2. **Place it in** `resources/icon.png`
3. **Run** `npm run generate:icons`
4. **Sync platforms** with `npx cap sync`
5. **Test on devices** to verify appearance

---

For more information, see:
- `resources/README.md` - Detailed icon requirements
- `resources/ICON_PLACEHOLDER.md` - Design guidelines
- `scripts/generate-icons.js` - Generation script
