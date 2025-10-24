# Production Build Guide

## Overview

This guide explains how to build and test the Quran App for production deployment with Firebase configuration. The build process ensures that all Firebase environment variables are properly embedded in the production bundle.

## Build Scripts

### Available Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run build` | Standard production build with linting | Regular deployment |
| `npm run build:validate` | Build with environment variable validation | Debugging env issues |
| `npm run build:prod` | Production build with explicit mode flag | CI/CD pipelines |
| `npm run test:build` | Comprehensive production build test | Pre-deployment verification |
| `npm run preview` | Preview production build locally | Local testing |

## Pre-Build Checklist

Before building for production, ensure:

- [ ] All Firebase environment variables are set
- [ ] `.env` file exists for local builds (copy from `.env.example`)
- [ ] Dependencies are installed (`npm install`)
- [ ] Code passes linting (`npm run lint`)
- [ ] Tests pass (`npm run test`)

## Building for Production

### Local Production Build

```bash
# 1. Validate environment variables
npm run validate:env

# 2. Build for production
npm run build

# 3. Test the production build
npm run test:build

# 4. Preview locally
npm run preview
```

### Vercel Production Build

Vercel automatically runs the build process when you push to your repository:

```bash
# Vercel runs this automatically:
npm install
npm run build
```

Environment variables are loaded from Vercel Dashboard settings.

## Environment Variables in Production

### How Vite Handles Environment Variables

Vite embeds environment variables at **build time**, not runtime. This means:

1. **Build Time**: Environment variables prefixed with `VITE_` are replaced with their actual values in the bundle
2. **Runtime**: The bundled code contains the actual values, not variable references
3. **Security**: Variables are embedded in the client-side bundle (visible to users)

### Example

**Before Build** (source code):
```javascript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

**After Build** (bundled code):
```javascript
const apiKey = "AIzaSyC1234567890abcdefghijklmnop";
```

### Vercel Environment Variables

In Vercel, environment variables are:
1. Set in Vercel Dashboard → Settings → Environment Variables
2. Available during build process as `process.env.VITE_*`
3. Embedded into the bundle by Vite
4. Deployed with the static files

## Build Configuration

### Vite Configuration

The `vite.config.js` includes production optimizations:

```javascript
{
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Firebase into its own chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  envPrefix: 'VITE_'
}
```

**Benefits:**
- Firebase SDK in separate chunk for better caching
- Source maps for debugging production issues
- Explicit environment variable prefix

### Vercel Configuration

The `vercel.json` configures deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Testing Production Builds

### Automated Testing

Run the comprehensive build test:

```bash
npm run test:build
```

This script:
1. ✅ Validates environment variables are present
2. ✅ Runs production build
3. ✅ Verifies build output directory exists
4. ✅ Checks critical files (index.html, assets, etc.)
5. ✅ Confirms Firebase configuration is embedded
6. ✅ Validates bundle size is reasonable
7. ✅ Checks for proper ES module configuration

### Manual Testing

After building, test locally:

```bash
# Build
npm run build

# Preview (serves from dist/)
npm run preview

# Open browser to http://localhost:4173
# Test all functionality:
# - Admin login
# - CRUD operations
# - Offline functionality
# - Firebase connection
```

## Build Output

### Directory Structure

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-[hash].js     # Main JavaScript bundle
│   ├── firebase-[hash].js  # Firebase SDK chunk
│   ├── index-[hash].css    # Bundled CSS
│   └── *.js.map            # Source maps
├── data/                   # Static data files
│   └── quran-data.json
└── sw.js                   # Service worker
```

### File Hashing

Vite automatically adds content hashes to filenames:
- Enables long-term caching
- Cache invalidation on file changes
- Optimal performance

## Troubleshooting

### Build Fails with "Missing environment variables"

**Cause**: Required Firebase environment variables not set

**Solution**:
```bash
# Local: Check .env file
cat .env

# Vercel: Check dashboard
# Settings → Environment Variables
```

### Build Succeeds but App Fails at Runtime

**Cause**: Environment variables not properly embedded

**Solution**:
```bash
# 1. Check if variables are in bundle
npm run test:build

# 2. Verify variable names have VITE_ prefix
grep "VITE_FIREBASE" .env

# 3. Rebuild
npm run build
```

### "Firebase: Error (auth/invalid-api-key)"

**Cause**: Wrong API key or not embedded in build

**Solution**:
```bash
# 1. Verify API key in .env
echo $VITE_FIREBASE_API_KEY

# 2. Rebuild with validation
npm run build:validate

# 3. Check Vercel environment variables
```

### Large Bundle Size Warning

**Cause**: Firebase SDK is large (~1MB)

**Solution**: This is expected. Optimizations:
- Firebase SDK is code-split into separate chunk
- Gzip compression reduces size by ~70%
- Consider lazy loading routes if needed

### Environment Variables Not Working in Vercel

**Cause**: Variables not set or wrong environment selected

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure variables are set for: Production, Preview, Development
3. Redeploy after adding variables
4. Check deployment logs for errors

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build:prod
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      
      - name: Test build
        run: npm run test:build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

## Security Considerations

### Environment Variables in Client Bundle

⚠️ **Important**: All `VITE_*` environment variables are embedded in the client-side bundle and are **publicly visible**.

**Safe to expose:**
- ✅ Firebase API Key (designed to be public)
- ✅ Firebase Auth Domain
- ✅ Firebase Project ID
- ✅ Firebase App ID

**Additional security:**
- Use Firebase Security Rules to protect data
- Restrict Firebase API keys to specific domains
- Enable Firebase App Check for additional protection
- Never put secrets in `VITE_*` variables

### Restricting Firebase API Keys

1. Go to Google Cloud Console
2. Navigate to APIs & Services → Credentials
3. Select your Firebase API key
4. Under "Application restrictions", select "HTTP referrers"
5. Add your domains:
   - `your-app.vercel.app`
   - `*.vercel.app` (for preview deployments)
   - `localhost:5173` (for development)

## Performance Optimization

### Bundle Analysis

Check bundle size:
```bash
npm run build
npm run test:build
```

### Optimization Strategies

1. **Code Splitting**: Firebase SDK in separate chunk
2. **Tree Shaking**: Unused code removed automatically
3. **Minification**: Code minified in production
4. **Compression**: Gzip/Brotli by Vercel
5. **Caching**: Long-term caching with content hashes

### Expected Bundle Sizes

- **JavaScript**: ~1MB uncompressed, ~263KB gzipped
- **CSS**: ~22KB uncompressed, ~5KB gzipped
- **Total**: ~1MB uncompressed, ~268KB gzipped

## Deployment Workflow

### Standard Deployment

```bash
# 1. Ensure all changes are committed
git add .
git commit -m "Your commit message"

# 2. Test locally
npm run build
npm run test:build
npm run preview

# 3. Push to trigger Vercel deployment
git push origin main

# 4. Monitor deployment in Vercel Dashboard

# 5. Verify production deployment
# - Visit your Vercel URL
# - Test all functionality
# - Check browser console for errors
```

### Rollback Procedure

If deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Investigate issue locally
5. Fix and redeploy

## Monitoring

### Build Logs

Check Vercel deployment logs:
1. Go to Vercel Dashboard → Deployments
2. Click on deployment
3. View "Build Logs" tab
4. Look for errors or warnings

### Runtime Monitoring

Monitor production app:
- Browser console for client errors
- Firebase Console for backend errors
- Vercel Analytics for performance
- Firebase Usage for quota monitoring

## Best Practices

1. **Always test builds locally** before deploying
2. **Run `npm run test:build`** to verify configuration
3. **Use `npm run preview`** to test production build
4. **Monitor Vercel deployment logs** for issues
5. **Check Firebase Console** after deployment
6. **Set up alerts** for Firebase quota limits
7. **Keep dependencies updated** for security
8. **Use different Firebase projects** for dev/prod

## Related Documentation

- `BUILD_CONFIGURATION.md` - Detailed build configuration
- `DEPLOYMENT_README.md` - Quick deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `VERCEL_DEPLOYMENT.md` - Comprehensive Vercel guide
- `.env.example` - Environment variable template

## Summary

✅ Production builds embed Firebase configuration at build time
✅ Environment variables must be prefixed with `VITE_`
✅ Vercel automatically builds and deploys on push
✅ Use `npm run test:build` to verify builds
✅ Firebase SDK is code-split for optimal caching
✅ All configuration is properly validated

For questions or issues, refer to the troubleshooting section or check deployment logs.
