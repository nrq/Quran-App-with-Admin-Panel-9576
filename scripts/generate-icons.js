#!/usr/bin/env node

/**
 * Icon Generation Helper Script
 * 
 * This script checks for the master icon file and runs the Capacitor assets
 * generation command to create all platform-specific icon sizes.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkMasterIcon() {
  const iconPath = join(projectRoot, 'resources', 'icon.png');
  
  log('\n🔍 Checking for master icon...', 'cyan');
  
  if (!existsSync(iconPath)) {
    log('\n❌ ERROR: Master icon not found!', 'red');
    log('\nExpected location: resources/icon.png', 'yellow');
    log('\nPlease create a 1024x1024 PNG icon and place it at:', 'yellow');
    log('  resources/icon.png\n', 'yellow');
    log('See resources/ICON_PLACEHOLDER.md for detailed instructions.\n', 'blue');
    return false;
  }
  
  log('✅ Master icon found: resources/icon.png', 'green');
  return true;
}

function generateIcons() {
  log('\n🎨 Generating platform-specific icons...', 'cyan');
  
  try {
    // Run capacitor-assets generate command
    execSync('npx capacitor-assets generate --iconBackgroundColor "#ffffff"', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    
    log('\n✅ Icons generated successfully!', 'green');
    return true;
  } catch (error) {
    log('\n❌ Error generating icons:', 'red');
    log(error.message, 'red');
    return false;
  }
}

function verifyGeneratedIcons() {
  log('\n🔍 Verifying generated icons...', 'cyan');
  
  const androidIconPath = join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png');
  const iosIconPath = join(projectRoot, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  let success = true;
  
  if (existsSync(androidIconPath)) {
    log('✅ Android icons verified', 'green');
  } else {
    log('⚠️  Android icons not found', 'yellow');
    success = false;
  }
  
  if (existsSync(iosIconPath)) {
    log('✅ iOS icons verified', 'green');
  } else {
    log('⚠️  iOS icons not found', 'yellow');
    success = false;
  }
  
  return success;
}

function printNextSteps() {
  log('\n📋 Next Steps:', 'cyan');
  log('1. Build your app: npm run build', 'blue');
  log('2. Sync with platforms: npx cap sync', 'blue');
  log('3. Open Android Studio: npx cap open android', 'blue');
  log('4. Open Xcode: npx cap open ios', 'blue');
  log('5. Test the new icons on devices/emulators\n', 'blue');
}

// Main execution
function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Capacitor Icon Generation Script    ║', 'cyan');
  log('╚════════════════════════════════════════╝\n', 'cyan');
  
  // Check if master icon exists
  if (!checkMasterIcon()) {
    process.exit(1);
  }
  
  // Generate icons
  if (!generateIcons()) {
    process.exit(1);
  }
  
  // Verify generated icons
  verifyGeneratedIcons();
  
  // Print next steps
  printNextSteps();
  
  log('✨ Icon generation complete!\n', 'green');
}

main();
