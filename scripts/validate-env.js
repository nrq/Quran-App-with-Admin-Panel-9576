#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * This script validates that all required Firebase environment variables
 * are present before building the application. It helps catch configuration
 * issues early in the deployment process.
 * 
 * Note: This script checks Node.js process.env, which in Vercel will contain
 * the environment variables set in the Vercel dashboard. For local development,
 * this script loads variables from .env file.
 * 
 * Usage:
 *   npm run validate:env          - Check if environment variables are set
 *   npm run build:validate        - Validate env vars before building
 */

import { config } from 'dotenv';

// Load environment variables from .env file for local development
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

const optionalEnvVars = [
  'VITE_FIREBASE_MEASUREMENT_ID'
];

console.log('🔍 Validating Firebase environment variables...\n');

let hasErrors = false;
const missingVars = [];
const presentVars = [];

// Check required variables
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    presentVars.push(varName);
    console.log(`✅ ${varName}: Present`);
  } else {
    missingVars.push(varName);
    console.error(`❌ ${varName}: Missing`);
    hasErrors = true;
  }
});

// Check optional variables
console.log('\nOptional variables:');
optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Present`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.error('\n❌ Environment validation failed!');
  console.error(`\nMissing required variables: ${missingVars.join(', ')}`);
  console.error('\nPlease ensure all required Firebase environment variables are set.');
  console.error('\nFor local development:');
  console.error('  1. Copy .env.example to .env');
  console.error('  2. Fill in your Firebase configuration values');
  console.error('\nFor Vercel deployment:');
  console.error('  1. Go to Vercel Dashboard → Settings → Environment Variables');
  console.error('  2. Add all required variables');
  console.error('  3. Redeploy your application');
  console.error('\nSee VERCEL_DEPLOYMENT.md for detailed instructions.\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are present!');
  console.log(`\nValidated ${presentVars.length} required variables.`);
  console.log('Ready to build! 🚀\n');
  process.exit(0);
}
