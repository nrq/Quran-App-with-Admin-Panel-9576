# Build Quick Reference

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server

# Production Build
npm run build                  # Standard build
npm run build:prod             # Production build (explicit mode)
npm run build:validate         # Build with env validation

# Testing
npm run test:build             # Test production build
npm run preview                # Preview production build locally

# Validation
npm run validate:env           # Check environment variables
npm run lint                   # Run linting
npm run test                   # Run tests
```

## Pre-Deployment Checklist

```bash
# 1. Validate environment
npm run validate:env

# 2. Run tests
npm run test

# 3. Build and test
npm run test:build

# 4. Preview locally
npm run preview
```

## Environment Variables

Required variables (must be prefixed with `VITE_`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Optional:
- `VITE_FIREBASE_MEASUREMENT_ID`

## Build Output

```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js     # Main bundle
│   ├── firebase-[hash].js  # Firebase SDK
│   └── index-[hash].css    # Styles
├── data/                   # Static data
└── sw.js                   # Service worker
```

## Troubleshooting

### Build fails with missing env vars
```bash
# Check .env file exists
cat .env

# Validate variables
npm run validate:env
```

### Build succeeds but app fails
```bash
# Test the build
npm run test:build

# Check if vars are embedded
npm run preview
# Open browser console
```

### Vercel deployment fails
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure all variables are set for Production, Preview, Development
3. Redeploy after adding variables

## Build Configuration

### Vite Config
- **Output**: `dist/`
- **Source maps**: Enabled
- **Code splitting**: Firebase in separate chunk
- **Env prefix**: `VITE_`

### Vercel Config
- **Build command**: `npm run build:prod`
- **Output directory**: `dist`
- **Framework**: Vite
- **SPA routing**: All routes → index.html

## Performance

### Expected Bundle Sizes
- JavaScript: ~1MB (uncompressed), ~263KB (gzipped)
- CSS: ~22KB (uncompressed), ~5KB (gzipped)
- Total: ~1MB (uncompressed), ~268KB (gzipped)

### Optimization
- ✅ Code splitting (Firebase separate chunk)
- ✅ Tree shaking (unused code removed)
- ✅ Minification (production mode)
- ✅ Long-term caching (content hashes)
- ✅ Gzip/Brotli compression (Vercel)

## Deployment Workflow

```bash
# 1. Test locally
npm run test:build

# 2. Commit changes
git add .
git commit -m "Your message"

# 3. Push to deploy
git push origin main

# 4. Monitor in Vercel Dashboard
```

## Documentation

- `PRODUCTION_BUILD_GUIDE.md` - Comprehensive build guide
- `BUILD_CONFIGURATION.md` - Detailed configuration
- `DEPLOYMENT_README.md` - Deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `VERCEL_DEPLOYMENT.md` - Vercel-specific guide

## Support

For detailed information, see the full documentation files listed above.
