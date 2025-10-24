# Vercel Deployment Guide for Firebase Migration

## Overview

This guide provides step-by-step instructions for deploying the Quran App to Vercel with Firebase integration. Follow these instructions carefully to ensure proper environment variable configuration and successful deployment.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Firebase project with Authentication and Firestore enabled
- Git repository connected to Vercel
- Firebase configuration values from your Firebase project

## Required Environment Variables

The following environment variables must be configured in Vercel for the application to function properly:

### Firebase Configuration Variables

| Variable Name | Description | Example Value | Required |
|--------------|-------------|---------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key for web app | `AIzaSyC...` | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | `your-project.firebaseapp.com` | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project identifier | `your-project-id` | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket URL | `your-project.appspot.com` | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app identifier | `1:123:web:abc` | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID | `G-XXXXXXXXXX` | Optional |

### Getting Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Select your web app or create a new one
7. Copy the configuration values from the `firebaseConfig` object

## Vercel Environment Variable Configuration

### Method 1: Using Vercel Dashboard (Recommended)

1. **Navigate to Project Settings**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Click "Settings" tab
   - Click "Environment Variables" in the left sidebar

2. **Add Each Environment Variable**
   - Click "Add New" button
   - Enter the variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter the variable value
   - Select environments where the variable should be available:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click "Save"

3. **Repeat for All Variables**
   - Add all 7 required Firebase environment variables
   - Double-check each value for accuracy
   - Ensure no trailing spaces or quotes

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID

# Pull environment variables for local development
vercel env pull .env.local
```

### Method 3: Using .env File Import

1. Create a `.env.production` file locally with all variables
2. In Vercel Dashboard → Settings → Environment Variables
3. Click "Add New" → "Import .env"
4. Upload your `.env.production` file
5. Select target environments (Production, Preview, Development)
6. Click "Import"

**⚠️ Important:** Delete the `.env.production` file after import and never commit it to version control.

## Deployment Checklist

### Pre-Deployment Checklist

- [ ] **Firebase Project Setup**
  - [ ] Firebase project created
  - [ ] Authentication enabled (Email/Password provider)
  - [ ] Firestore Database created in production mode
  - [ ] Firestore security rules deployed
  - [ ] Firestore indexes deployed
  - [ ] Admin user created in `admin_users` collection

- [ ] **Environment Variables**
  - [ ] All 7 Firebase environment variables obtained
  - [ ] Variables added to Vercel project settings
  - [ ] Variables configured for Production environment
  - [ ] Variables configured for Preview environment
  - [ ] Variables verified for accuracy (no typos)

- [ ] **Code Preparation**
  - [ ] All Supabase references removed
  - [ ] Firebase configuration file (`src/lib/firebase.js`) created
  - [ ] AuthContext updated to use Firebase Authentication
  - [ ] QuranContext updated to use Firestore
  - [ ] Error handling implemented for Firebase operations
  - [ ] Offline persistence configured

- [ ] **Build Verification**
  - [ ] Local build successful (`npm run build`)
  - [ ] No build errors or warnings
  - [ ] Production build tested locally (`npm run preview`)
  - [ ] Environment variables loaded correctly in build

### Deployment Steps

1. **Initial Deployment**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Complete Firebase migration"
   git push origin main
   ```

2. **Trigger Vercel Deployment**
   - Vercel will automatically deploy when you push to your main branch
   - Or manually trigger deployment from Vercel Dashboard
   - Or use CLI: `vercel --prod`

3. **Monitor Deployment**
   - Watch deployment logs in Vercel Dashboard
   - Check for build errors
   - Verify environment variables are loaded
   - Wait for deployment to complete

4. **Post-Deployment Verification**
   - Visit deployed URL
   - Test admin login functionality
   - Verify Firestore connection
   - Test CRUD operations
   - Check browser console for errors
   - Test offline functionality

### Post-Deployment Checklist

- [ ] **Functionality Testing**
  - [ ] Application loads without errors
  - [ ] Admin login works correctly
  - [ ] Custom URL management functional
  - [ ] Audio mappings can be created/updated
  - [ ] Tafseer entries can be managed
  - [ ] Offline indicator works properly
  - [ ] Data persists correctly in Firestore

- [ ] **Security Verification**
  - [ ] Firestore security rules active
  - [ ] Unauthorized access blocked
  - [ ] Environment variables not exposed in client
  - [ ] Firebase API keys properly restricted

- [ ] **Performance Testing**
  - [ ] Page load times acceptable
  - [ ] Firestore queries performant
  - [ ] No console errors or warnings
  - [ ] Offline functionality works

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution:** 
- Verify `VITE_FIREBASE_API_KEY` is correct
- Check for extra spaces or quotes in the value
- Ensure the API key is enabled in Firebase Console

#### Issue: "Firebase: Error (auth/project-not-found)"
**Solution:**
- Verify `VITE_FIREBASE_PROJECT_ID` matches your Firebase project
- Check that the project exists in Firebase Console

#### Issue: Environment variables not loading
**Solution:**
- Ensure all variable names start with `VITE_` prefix
- Redeploy after adding environment variables
- Check that variables are set for the correct environment (Production/Preview)

#### Issue: Build fails with "Cannot find module 'firebase'"
**Solution:**
- Ensure Firebase is installed: `npm install firebase`
- Check that `package.json` includes Firebase dependency
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

#### Issue: Firestore permission denied errors
**Solution:**
- Verify Firestore security rules are deployed
- Check that user is authenticated before accessing Firestore
- Review security rules in Firebase Console

#### Issue: Application works locally but fails in production
**Solution:**
- Verify all environment variables are set in Vercel
- Check production build locally: `npm run build && npm run preview`
- Review Vercel deployment logs for specific errors
- Ensure Firebase project allows requests from Vercel domain

## Environment Variable Security Best Practices

1. **Never Commit Secrets**
   - Add `.env` to `.gitignore`
   - Never commit `.env.local`, `.env.production`, or similar files
   - Use `.env.example` for documentation only

2. **Use Different Projects for Environments**
   - Create separate Firebase projects for development and production
   - Use different environment variables for each environment
   - This prevents accidental data corruption

3. **Restrict API Keys**
   - In Firebase Console → Project Settings → API Keys
   - Restrict API keys to specific domains (your Vercel domain)
   - Enable only necessary APIs

4. **Rotate Keys Regularly**
   - Periodically rotate Firebase API keys
   - Update environment variables in Vercel after rotation
   - Monitor Firebase usage for suspicious activity

5. **Monitor Access**
   - Review Firestore security rules regularly
   - Check Firebase Authentication logs
   - Monitor for unauthorized access attempts

## Vercel-Specific Configuration

### Build Settings

Vercel should automatically detect Vite configuration. Verify these settings:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Domain Configuration

1. Add custom domain in Vercel Dashboard → Settings → Domains
2. Update Firebase Authentication authorized domains:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)
   - Add any custom domains

### Deployment Branches

Configure which branches trigger deployments:

- **Production Branch:** `main` or `master`
- **Preview Branches:** All other branches
- Configure in Vercel Dashboard → Settings → Git

## Rollback Procedure

If deployment fails or issues arise:

1. **Immediate Rollback**
   - Go to Vercel Dashboard → Deployments
   - Find the last working deployment
   - Click "..." menu → "Promote to Production"

2. **Fix and Redeploy**
   - Identify the issue from deployment logs
   - Fix the issue locally
   - Test thoroughly
   - Commit and push to trigger new deployment

3. **Emergency Rollback to Supabase**
   - Revert Firebase changes in Git
   - Restore Supabase configuration
   - Update environment variables back to Supabase
   - Redeploy

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Support

If you encounter issues not covered in this guide:

1. Check Vercel deployment logs for specific errors
2. Review Firebase Console for service status
3. Consult Firebase documentation for error codes
4. Check Vercel community forums
5. Review project-specific documentation in repository
