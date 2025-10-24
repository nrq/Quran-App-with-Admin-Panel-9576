# Deployment Guide

## Quick Start

This application is configured for deployment on Vercel with Firebase backend. Follow these steps for a successful deployment.

## Prerequisites

1. **Firebase Project**: Create a Firebase project with Authentication and Firestore enabled
2. **Vercel Account**: Sign up at https://vercel.com
3. **Git Repository**: Code must be in a Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables

### Required Variables

All environment variables must be prefixed with `VITE_` to be accessible in the Vite build:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID (optional)
```

### Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click Settings (⚙️) → Project settings
4. Scroll to "Your apps" → Select your web app
5. Copy the `firebaseConfig` values

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quran-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Firebase configuration values

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production (test locally)**
   ```bash
   npm run build
   npm run preview
   ```

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Vercel will auto-detect Vite configuration

2. **Configure Environment Variables**
   - During import, click "Environment Variables"
   - Add all 7 Firebase variables
   - Select: Production, Preview, and Development
   - Click "Deploy"

3. **Post-Deployment**
   - Wait for deployment to complete
   - Visit your deployment URL
   - Test the application

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   Follow the prompts to configure your project

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   vercel env add VITE_FIREBASE_MEASUREMENT_ID
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Build Configuration

### Automatic Configuration

The project includes `vercel.json` which configures:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing (all routes → index.html)
- Security headers
- Asset caching

### Build Scripts

- `npm run build` - Standard production build with linting
- `npm run build:validate` - Build with environment variable validation
- `npm run validate:env` - Check if environment variables are set
- `npm run preview` - Preview production build locally

### Environment Variable Validation

The project includes a validation script to check environment variables:

```bash
npm run validate:env
```

This is useful for debugging deployment issues. In Vercel, environment variables are automatically available during build.

## Firebase Configuration

### Update Authorized Domains

After deploying to Vercel, add your domain to Firebase:

1. Go to Firebase Console → Authentication → Settings
2. Click "Authorized domains"
3. Add your Vercel domain (e.g., `your-app.vercel.app`)
4. Add any custom domains

### Deploy Firestore Rules and Indexes

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

## Verification Checklist

After deployment, verify:

- [ ] Application loads without errors
- [ ] Admin login works
- [ ] Can create/read/update/delete data
- [ ] Offline functionality works
- [ ] No console errors
- [ ] Firebase connection established

## Troubleshooting

### Build Fails

**Issue**: Build fails with "Cannot find module 'firebase'"
**Solution**: Ensure Firebase is in dependencies, not devDependencies

**Issue**: Environment variables not found
**Solution**: 
- Check variable names start with `VITE_`
- Verify variables are set in Vercel dashboard
- Redeploy after adding variables

### Runtime Errors

**Issue**: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Verify `VITE_FIREBASE_API_KEY` is correct in Vercel

**Issue**: "Missing required Firebase environment variables"
**Solution**: Check all 6 required variables are set in Vercel

**Issue**: Authentication not working
**Solution**: Add Vercel domain to Firebase authorized domains

### Performance Issues

**Issue**: Large bundle size warning
**Solution**: This is expected due to Firebase SDK. Consider:
- Code splitting with dynamic imports
- Lazy loading routes
- Tree shaking optimization

## Monitoring

### Vercel Analytics

Enable Vercel Analytics for performance monitoring:
1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Web Analytics
3. Deploy to activate

### Firebase Monitoring

Monitor Firebase usage:
1. Go to Firebase Console → Usage tab
2. Check authentication requests
3. Monitor Firestore read/write operations
4. Set up budget alerts

## Rollback

If deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Support

For detailed deployment instructions, see:
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `.env.example` - Environment variable template

## Security Best Practices

1. Never commit `.env` files to version control
2. Use different Firebase projects for dev/prod
3. Restrict Firebase API keys to specific domains
4. Enable Firestore security rules
5. Rotate API keys periodically
6. Monitor Firebase usage for anomalies

---

**Need Help?** Check the troubleshooting section or review deployment logs in Vercel Dashboard.
