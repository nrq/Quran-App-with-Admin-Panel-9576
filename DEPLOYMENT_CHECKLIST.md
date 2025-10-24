# Quick Deployment Checklist

Use this checklist to ensure all steps are completed before and after deploying to Vercel.

## Pre-Deployment

### Firebase Setup
- [ ] Firebase project created at https://console.firebase.google.com/
- [ ] Authentication enabled (Email/Password provider)
- [ ] Firestore Database created
- [ ] Security rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Admin user created in `admin_users` collection

### Environment Variables Ready
- [ ] `VITE_FIREBASE_API_KEY` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_PROJECT_ID` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_APP_ID` - obtained from Firebase Console
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` - obtained from Firebase Console (optional)

### Code Ready
- [ ] All Supabase code removed
- [ ] Firebase configuration implemented
- [ ] AuthContext using Firebase Authentication
- [ ] QuranContext using Firestore
- [ ] Error handling implemented
- [ ] Local build successful (`npm run build`)
- [ ] Production build test passed (`npm run test:build`)
- [ ] Local preview tested (`npm run preview`)

## Vercel Configuration

### Add Environment Variables
- [ ] Navigate to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Add `VITE_FIREBASE_API_KEY` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_AUTH_DOMAIN` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_PROJECT_ID` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_STORAGE_BUCKET` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_MESSAGING_SENDER_ID` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_APP_ID` for Production, Preview, Development
- [ ] Add `VITE_FIREBASE_MEASUREMENT_ID` for Production, Preview, Development (optional)

### Verify Build Settings
- [ ] Framework Preset: Vite
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

## Deployment

### Deploy to Vercel
- [ ] Commit all changes: `git add . && git commit -m "Firebase migration complete"`
- [ ] Push to repository: `git push origin main`
- [ ] Monitor deployment in Vercel Dashboard
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

## Post-Deployment Verification

### Functionality Tests
- [ ] Application loads without errors
- [ ] Admin login page accessible
- [ ] Can log in with admin credentials
- [ ] Dashboard loads after login
- [ ] Can view existing data (if any)
- [ ] Can create custom URLs
- [ ] Can create audio mappings
- [ ] Can create tafseer entries
- [ ] Can update existing records
- [ ] Can delete records
- [ ] Logout works correctly

### Technical Verification
- [ ] No console errors in browser
- [ ] Firebase connection established
- [ ] Firestore queries working
- [ ] Authentication state persists on refresh
- [ ] Offline indicator appears when offline
- [ ] Data syncs when back online

### Security Checks
- [ ] Unauthenticated users cannot access admin panel
- [ ] Firestore security rules blocking unauthorized access
- [ ] Environment variables not exposed in client code
- [ ] Firebase API keys restricted to Vercel domain (optional but recommended)

## Firebase Console Verification

### Update Authorized Domains
- [ ] Go to Firebase Console → Authentication → Settings → Authorized domains
- [ ] Add Vercel deployment domain (e.g., `your-app.vercel.app`)
- [ ] Add any custom domains
- [ ] Save changes

### Monitor Usage
- [ ] Check Firebase Console → Usage tab
- [ ] Verify authentication requests working
- [ ] Verify Firestore read/write operations
- [ ] Check for any error spikes

## Rollback Plan (If Needed)

If deployment fails:
- [ ] Go to Vercel Dashboard → Deployments
- [ ] Find last working deployment
- [ ] Click "..." → "Promote to Production"
- [ ] Investigate issue in deployment logs
- [ ] Fix locally and redeploy

## Documentation Updates

- [ ] Update README.md with Firebase setup instructions
- [ ] Document any environment-specific configurations
- [ ] Update team on deployment status
- [ ] Archive Supabase credentials (if needed for rollback)

## Success Criteria

✅ All checklist items completed
✅ Application fully functional in production
✅ No errors in Vercel deployment logs
✅ No errors in browser console
✅ All CRUD operations working
✅ Authentication working correctly
✅ Data persisting in Firestore

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Production URL:** _____________

**Notes:**
