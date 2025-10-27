# Icon Placeholder

## Required: Create Your Master Icon

You need to create a master icon file named `icon.png` in this directory.

### Specifications
- **Filename**: `icon.png` (exactly this name)
- **Dimensions**: 1024x1024 pixels
- **Format**: PNG
- **Color Mode**: RGBA (with transparency support)
- **Background**: Transparent or solid color

### Design Tips

1. **Keep it Simple**: The icon should be recognizable at small sizes (48x48px)
2. **Safe Zone**: Keep important elements within the center 80% of the canvas
3. **No Text**: Avoid small text that won't be readable at small sizes
4. **High Contrast**: Ensure good visibility on both light and dark backgrounds
5. **Brand Colors**: Use your app's primary brand colors

### Recommended Tools

- **Adobe Illustrator/Photoshop**: Professional design tools
- **Figma**: Free online design tool
- **Canva**: Easy-to-use online tool with templates
- **GIMP**: Free open-source image editor
- **Inkscape**: Free vector graphics editor

### Example Icon Ideas for Quran App

- Stylized Quran book icon
- Arabic calligraphy element
- Crescent moon symbol
- Geometric Islamic pattern
- Combination of book and crescent

### Quick Start with Placeholder

If you need to test the icon generation process, you can:

1. Create a simple 1024x1024 PNG with your app name or logo
2. Save it as `icon.png` in this directory
3. Run: `npx capacitor-assets generate --iconBackgroundColor '#ffffff'`
4. Replace with your final design later

### After Creating Your Icon

Once you have your `icon.png` file ready:

1. Place it in this `resources/` directory
2. Run the generation command (see README.md)
3. Verify the generated icons in Android and iOS directories
4. Test on actual devices to ensure it looks good

## Current Status

❌ **Missing**: `icon.png` file not found in this directory

Please create and add your master icon file to proceed with icon generation.
