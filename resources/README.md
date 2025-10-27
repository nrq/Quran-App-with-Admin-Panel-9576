# App Icon Resources

This directory contains the master icon files used to generate platform-specific app icons.

## Master Icon Requirements

### Icon File
- **Filename**: `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Location**: Place in this `resources/` directory

### Design Guidelines
- Use a simple, recognizable design
- Ensure the icon looks good at small sizes (48x48)
- Avoid text or fine details that won't be visible at small sizes
- Use appropriate padding (safe zone) to prevent clipping
- Consider both light and dark backgrounds

## Generating Icons

Once you have placed your `icon.png` file in this directory, run:

```bash
npx capacitor-assets generate --iconBackgroundColor '#ffffff'
```

This will automatically generate all required icon sizes for:
- **Android**: All density variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **iOS**: All required sizes for iPhone and iPad

## Generated Icon Locations

### Android
Icons will be generated in:
- `android/app/src/main/res/mipmap-*/`

### iOS
Icons will be generated in:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

## Current Status

⚠️ **Action Required**: Please add your custom `icon.png` (1024x1024) to this directory.

Until a custom icon is provided, the default Capacitor icons will be used.

## Icon Sizes Generated

### Android
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192
- Play Store: 512x512

### iOS
- 20x20 (1x, 2x, 3x)
- 29x29 (1x, 2x, 3x)
- 40x40 (1x, 2x, 3x)
- 60x60 (2x, 3x)
- 76x76 (1x, 2x)
- 83.5x83.5 (2x)
- 1024x1024 (App Store)

## Verification

After generating icons, verify:
1. Check that all mipmap directories in Android contain the new icons
2. Check that iOS Assets.xcassets/AppIcon.appiconset contains all sizes
3. Build and run the app on both platforms to see the new icon
4. Test on different device sizes and OS versions
