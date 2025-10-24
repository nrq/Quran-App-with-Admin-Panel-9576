# Build and Deployment Configuration

## Overview

This document describes the build and deployment configuration for the Quran App with Firebase integration.

## Build System

### Framework: Vite

The application uses Vite as the build tool, configured in `vite.config.js`:

```javascript
{
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}
```

### Build Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Start development server | Local development |
| `npm run build` | Production build with linting | Standard deployment |
| `npm run build:validate` | Build with env validation | Debugging env issues |
| `npm run build:prod` | Production build with explicit mode | CI/CD pipelines |
| `npm run validate:env` | Check environment variables | Pre-deployment check |
| `npm run test:build` | Comprehensive build test | Pre-deployment verification |
| `npm run preview` | Preview production build | Local testing |
| `npm run lint` | Run ESLint | Code quality check |
| `npm run test` | Run tests once | CI/CD pipeline |

## Environment Variables

### Vite Environment Variable Handling

Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client:

- **Development**: Loaded from `.env` file
- **Production**: Provided by hosting platform (Vercel)
- **Access**: `import.meta.env.VITE_VARIABLE_NAME`

### Required Variables

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id  # Optional
```

### Environment Variable Validation

The Firebase configuration (`src/lib/firebase.js`) includes runtime validation:

```javascript
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(
  varName => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}`
  );
}
```

This ensures the application fails fast with a clear error message if configuration is missing.

## Vercel Configuration

### vercel.json

The project includes `vercel.json` for optimal Vercel deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Configuration Features

1. **SPA Routing**: All routes redirect to `index.html` for client-side routing
2. **Asset Caching**: Static assets cached for 1 year (immutable)
3. **Security Headers**: 
   - `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
   - `X-Frame-Options: DENY` - Prevent clickjacking
   - `X-XSS-Protection: 1; mode=block` - Enable XSS protection

## Build Process

### Local Build

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Build for production
npm run build

# Output: dist/ directory
```

### Vercel Build

When code is pushed to the repository:

1. Vercel detects changes
2. Runs `npm install`
3. Loads environment variables from Vercel settings
4. Runs `npm run build`
5. Deploys `dist/` directory
6. Makes deployment available at URL

### Build Output

```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── index-[hash].js  # Bundled JavaScript
│   └── index-[hash].css # Bundled CSS
├── data/                # Static data files
└── sw.js                # Service worker
```

## Firebase Integration

### Configuration File

`src/lib/firebase.js` initializes Firebase with environment variables:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

### Offline Persistence

Firestore is configured with offline persistence:
- Data cached locally for offline access
- Multi-tab synchronization enabled
- Automatic sync when connection restored

## Security Considerations

### Environment Variables

- ✅ All Firebase config uses environment variables
- ✅ No hardcoded credentials in source code
- ✅ `.env` file excluded from version control
- ✅ Different projects for dev/prod recommended

### Build Security

- ✅ Source maps enabled for debugging
- ✅ Security headers configured
- ✅ Dependencies regularly updated
- ✅ Linting enforced in build process

### Firebase Security

- ✅ Firestore security rules deployed
- ✅ Authentication required for admin operations
- ✅ API keys can be restricted to specific domains
- ✅ Indexes optimized for query performance

## Performance Optimization

### Bundle Size

Current build output:
- JavaScript: ~1MB (gzipped: ~263KB)
- CSS: ~22KB (gzipped: ~5KB)
- Total: ~1MB (gzipped: ~268KB)

### Optimization Strategies

1. **Code Splitting**: Vite automatically splits code
2. **Tree Shaking**: Unused code removed in production
3. **Asset Optimization**: Images and assets optimized
4. **Caching**: Long-term caching for static assets
5. **Compression**: Gzip compression enabled by Vercel

### Future Optimizations

- Consider lazy loading routes
- Implement dynamic imports for large components
- Optimize Firebase SDK imports (tree-shaking)
- Add service worker for offline functionality

## Testing

### Pre-Deployment Testing

```bash
# Run tests
npm run test

# Build and preview locally
npm run build
npm run preview

# Validate environment variables
npm run validate:env
```

### Post-Deployment Testing

1. Visit deployment URL
2. Check browser console for errors
3. Test admin login
4. Verify CRUD operations
5. Test offline functionality
6. Check Firebase Console for activity

## Continuous Deployment

### Automatic Deployment

Vercel automatically deploys when:
- Code pushed to main branch (Production)
- Code pushed to other branches (Preview)
- Pull request created (Preview)

### Deployment Environments

- **Production**: `main` branch → `your-app.vercel.app`
- **Preview**: Other branches → `your-app-git-branch.vercel.app`
- **Development**: Local → `localhost:5173`

## Troubleshooting

### Build Failures

**Symptom**: Build fails with module errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Symptom**: Environment variables not found
**Solution**: 
- Verify variables in Vercel dashboard
- Check variable names have `VITE_` prefix
- Redeploy after adding variables

### Runtime Errors

**Symptom**: Firebase initialization fails
**Solution**: Check Firebase config in browser console

**Symptom**: Authentication not working
**Solution**: Add Vercel domain to Firebase authorized domains

## Monitoring

### Build Logs

- View in Vercel Dashboard → Deployments → [Deployment] → Build Logs
- Check for warnings or errors during build
- Verify environment variables loaded

### Runtime Monitoring

- Browser console for client-side errors
- Firebase Console for backend errors
- Vercel Analytics for performance metrics

## Documentation Files

- `PRODUCTION_BUILD_GUIDE.md` - Production build and testing guide
- `VERCEL_DEPLOYMENT.md` - Comprehensive deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `DEPLOYMENT_README.md` - Quick start guide
- `BUILD_CONFIGURATION.md` - This file
- `.env.example` - Environment variable template

## Production Build Testing

The project includes a comprehensive production build test script:

```bash
npm run test:build
```

This automated test:
1. Validates all required environment variables are present
2. Runs the production build process
3. Verifies build output directory and critical files
4. Confirms Firebase configuration is properly embedded in bundle
5. Validates bundle size is reasonable (< 5MB)
6. Checks ES module configuration
7. Provides detailed pass/fail report

Use this before deploying to catch configuration issues early.

## Summary

The application is configured for seamless deployment to Vercel with:
- ✅ Automated build process with validation
- ✅ Environment variable validation (build-time and runtime)
- ✅ Production build testing script
- ✅ Security headers
- ✅ Optimal caching with content hashes
- ✅ Firebase integration with code splitting
- ✅ Offline support with persistence
- ✅ Production-ready configuration

For deployment, simply:
1. Set environment variables in Vercel
2. Run `npm run test:build` locally to verify
3. Push code to repository
4. Vercel handles the rest
