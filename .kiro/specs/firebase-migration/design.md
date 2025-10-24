# Firebase Migration Design Document

## Overview

This design outlines the migration from Supabase to Firebase for the Quran App, focusing on maintaining existing functionality while leveraging Firebase's ecosystem. The migration includes Firebase Authentication for admin users, Firestore for data persistence, and proper environment variable configuration for Vercel deployment.

## Architecture

### Current Architecture (Supabase)
```
React App → Supabase Client → Supabase Auth + Database
```

### New Architecture (Firebase)
```
React App → Firebase SDK → Firebase Auth + Firestore Database
```

### Environment Configuration
- **Development**: Local `.env` file with Firebase config
- **Production**: Vercel environment variables for secure credential storage
- **Firebase Config**: Project ID, API Key, Auth Domain, Storage Bucket, etc.

## Components and Interfaces

### 1. Firebase Configuration (`src/lib/firebase.js`)
```javascript
// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 2. Authentication Service (`src/contexts/AuthContext.jsx`)
**Migration Strategy:**
- Replace Supabase auth with Firebase Authentication
- Maintain custom admin user validation using Firestore
- Keep the same authentication flow and session management
- Use Firebase's `onAuthStateChanged` for session persistence

**Key Changes:**
- `supabase.auth.signInWithPassword()` → `signInWithEmailAndPassword()`
- `supabase.auth.getSession()` → `onAuthStateChanged()` listener
- Admin user validation via Firestore query instead of Supabase table

### 3. Database Service (`src/contexts/QuranContext.jsx`)
**Migration Strategy:**
- Replace Supabase client calls with Firestore operations
- Maintain the same data structure and relationships
- Use Firestore collections instead of Supabase tables
- Implement proper error handling for Firestore operations

## Data Models

### Firestore Collections Structure

#### 1. `admin_users` Collection
```javascript
{
  id: "auto-generated-id",
  username: "admin",
  password_hash: "hashed_password",
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 2. `custom_urls` Collection
```javascript
{
  id: "auto-generated-id", 
  url: "https://example.com/audio.mp3",
  title: "Custom Audio Title",
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 3. `audio_mappings` Collection
```javascript
{
  id: "auto-generated-id",
  surah_number: 1,
  ayah_number: 1,
  custom_url_id: "reference-to-custom-url-doc",
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 4. `tafseer_entries` Collection
```javascript
{
  id: "auto-generated-id",
  surah_number: 1,
  ayah_number: 1,
  tafseer_text: "Interpretation text",
  created_at: timestamp,
  updated_at: timestamp
}
```

### Data Migration Strategy
1. **No automatic migration**: Since this is a development/admin app, data can be re-entered
2. **Manual data export/import**: If existing data needs preservation
3. **Fresh start**: Clean slate with new Firebase collections

## Error Handling

### Firebase-Specific Error Handling
```javascript
// Authentication errors
catch (error) {
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      toast.error('Invalid credentials');
      break;
    case 'auth/too-many-requests':
      toast.error('Too many failed attempts. Please try again later.');
      break;
    default:
      toast.error('Authentication failed');
  }
}

// Firestore errors
catch (error) {
  switch (error.code) {
    case 'permission-denied':
      toast.error('Access denied');
      break;
    case 'unavailable':
      toast.error('Service temporarily unavailable');
      break;
    default:
      toast.error('Database operation failed');
  }
}
```

### Offline Handling
- Firestore provides built-in offline support
- Enable offline persistence for better user experience
- Maintain existing offline indicator functionality

## Testing Strategy

### Unit Testing
- Test Firebase configuration initialization
- Test authentication flow with mock Firebase methods
- Test Firestore CRUD operations with Firebase emulator
- Test error handling scenarios

### Integration Testing
- Test complete authentication flow
- Test data persistence and retrieval
- Test offline functionality
- Test environment variable configuration

### Manual Testing
- Verify admin login functionality
- Test custom URL management
- Test audio mapping creation and updates
- Test tafseer entry management
- Verify Vercel deployment with environment variables

## Security Considerations

### Firebase Security Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin users collection - only authenticated users can read
    match /admin_users/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Custom URLs - authenticated users can manage
    match /custom_urls/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Audio mappings - authenticated users can manage
    match /audio_mappings/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Tafseer entries - authenticated users can manage
    match /tafseer_entries/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables Security
- Use Vercel's environment variable encryption
- Prefix all Firebase config with `VITE_` for Vite access
- Never commit Firebase config to version control
- Use different Firebase projects for development and production

## Performance Considerations

### Firestore Optimization
- Use compound indexes for complex queries
- Implement pagination for large datasets
- Use Firestore's real-time listeners efficiently
- Cache frequently accessed data

### Bundle Size
- Import only needed Firebase services
- Use tree-shaking to reduce bundle size
- Consider lazy loading Firebase modules

## Migration Steps Overview

1. **Setup Firebase Project**: Create new Firebase project with Authentication and Firestore
2. **Install Dependencies**: Replace Supabase with Firebase SDK
3. **Environment Configuration**: Set up environment variables for Firebase config
4. **Authentication Migration**: Replace Supabase auth with Firebase Authentication
5. **Database Migration**: Replace Supabase queries with Firestore operations
6. **Testing**: Comprehensive testing of all functionality
7. **Deployment**: Configure Vercel environment variables and deploy

## Rollback Strategy

- Keep Supabase configuration commented out for quick rollback
- Maintain feature flags for gradual migration if needed
- Document all changes for easy reversal
- Test rollback procedure in development environment