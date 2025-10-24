#!/usr/bin/env node

/**
 * Production Build Test Script
 * 
 * This script tests that the production build works correctly with Firebase
 * environment variables. It performs the following checks:
 * 
 * 1. Validates environment variables are present
 * 2. Runs the production build
 * 3. Checks that Firebase configuration is properly bundled
 * 4. Verifies critical files exist in the build output
 * 5. Validates that environment variables are embedded in the bundle
 * 
 * Usage:
 *   npm run test:build          - Run production build test
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file for local testing
// In Vercel, environment variables are already available in process.env
config();

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('🧪 Testing Production Build with Firebase Configuration\n');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

function logSuccess(message) {
  console.log(`✅ ${message}`);
  testsPassed++;
}

function logError(message) {
  console.error(`❌ ${message}`);
  testsFailed++;
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Test 1: Validate environment variables
console.log('\n📋 Test 1: Environment Variables Validation');
console.log('-'.repeat(60));

const missingVars = [];
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    logSuccess(`${varName} is set`);
  } else {
    logError(`${varName} is missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error('\n❌ Cannot proceed with build test - missing environment variables');
  console.error('Please set the following variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
}

// Test 2: Run production build
console.log('\n🔨 Test 2: Production Build');
console.log('-'.repeat(60));

try {
  logInfo('Running: npm run build');
  execSync('npm run build', { stdio: 'inherit' });
  logSuccess('Production build completed successfully');
} catch (error) {
  logError('Production build failed');
  console.error(error.message);
  process.exit(1);
}

// Test 3: Verify build output directory
console.log('\n📁 Test 3: Build Output Verification');
console.log('-'.repeat(60));

const distDir = 'dist';
if (existsSync(distDir)) {
  logSuccess('dist/ directory exists');
} else {
  logError('dist/ directory not found');
  process.exit(1);
}

// Test 4: Check critical files
console.log('\n📄 Test 4: Critical Files Check');
console.log('-'.repeat(60));

const criticalFiles = [
  'index.html',
  'sw.js'
];

criticalFiles.forEach(file => {
  const filePath = join(distDir, file);
  if (existsSync(filePath)) {
    logSuccess(`${file} exists`);
  } else {
    logError(`${file} is missing`);
  }
});

// Test 5: Check assets directory
const assetsDir = join(distDir, 'assets');
if (existsSync(assetsDir)) {
  logSuccess('assets/ directory exists');
  
  const assets = readdirSync(assetsDir);
  const jsFiles = assets.filter(f => f.endsWith('.js'));
  const cssFiles = assets.filter(f => f.endsWith('.css'));
  
  logInfo(`Found ${jsFiles.length} JavaScript files`);
  logInfo(`Found ${cssFiles.length} CSS files`);
  
  if (jsFiles.length > 0) {
    logSuccess('JavaScript bundle generated');
  } else {
    logError('No JavaScript files found in assets/');
  }
  
  if (cssFiles.length > 0) {
    logSuccess('CSS bundle generated');
  } else {
    logError('No CSS files found in assets/');
  }
} else {
  logError('assets/ directory not found');
}

// Test 6: Verify Firebase configuration in bundle
console.log('\n🔥 Test 5: Firebase Configuration in Bundle');
console.log('-'.repeat(60));

try {
  const assetsDir = join(distDir, 'assets');
  const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
  
  let firebaseConfigFound = false;
  let envVarsEmbedded = 0;
  
  for (const jsFile of jsFiles) {
    const content = readFileSync(join(assetsDir, jsFile), 'utf-8');
    
    // Check if Firebase is initialized
    if (content.includes('initializeApp') || content.includes('firebase')) {
      firebaseConfigFound = true;
    }
    
    // Check if environment variables are embedded (they should be replaced with actual values)
    // We check for the actual values, not the variable names
    if (content.includes(process.env.VITE_FIREBASE_PROJECT_ID)) {
      envVarsEmbedded++;
    }
  }
  
  if (firebaseConfigFound) {
    logSuccess('Firebase initialization code found in bundle');
  } else {
    logError('Firebase initialization code not found in bundle');
  }
  
  if (envVarsEmbedded > 0) {
    logSuccess('Environment variables properly embedded in bundle');
  } else {
    logError('Environment variables not embedded - check Vite configuration');
  }
} catch (error) {
  logError(`Failed to verify Firebase configuration: ${error.message}`);
}

// Test 7: Check index.html
console.log('\n📝 Test 6: Index.html Validation');
console.log('-'.repeat(60));

try {
  const indexPath = join(distDir, 'index.html');
  const indexContent = readFileSync(indexPath, 'utf-8');
  
  if (indexContent.includes('<script')) {
    logSuccess('Script tags found in index.html');
  } else {
    logError('No script tags in index.html');
  }
  
  if (indexContent.includes('type="module"')) {
    logSuccess('ES modules properly configured');
  } else {
    logError('ES module configuration missing');
  }
  
  // Check for asset references
  if (indexContent.includes('/assets/')) {
    logSuccess('Asset references found in index.html');
  } else {
    logError('No asset references in index.html');
  }
} catch (error) {
  logError(`Failed to validate index.html: ${error.message}`);
}

// Test 8: Build size check
console.log('\n📊 Test 7: Build Size Analysis');
console.log('-'.repeat(60));

try {
  const assetsDir = join(distDir, 'assets');
  const files = readdirSync(assetsDir);
  
  let totalSize = 0;
  files.forEach(file => {
    const stats = statSync(join(assetsDir, file));
    totalSize += stats.size;
  });
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  logInfo(`Total bundle size: ${sizeMB} MB`);
  
  if (totalSize < 5 * 1024 * 1024) { // Less than 5MB
    logSuccess('Bundle size is reasonable (< 5MB)');
  } else {
    logError('Bundle size is large (> 5MB) - consider optimization');
  }
} catch (error) {
  logError(`Failed to analyze build size: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed! Production build is ready for deployment.');
  console.log('\nNext steps:');
  console.log('  1. Test locally: npm run preview');
  console.log('  2. Deploy to Vercel: git push origin main');
  console.log('  3. Verify deployment at your Vercel URL');
  console.log('\n✨ Firebase configuration is properly embedded in the build.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
  console.log('Common issues:');
  console.log('  - Missing environment variables');
  console.log('  - Build configuration errors');
  console.log('  - Firebase SDK not properly imported');
  console.log('\nSee BUILD_CONFIGURATION.md for troubleshooting.\n');
  process.exit(1);
}
