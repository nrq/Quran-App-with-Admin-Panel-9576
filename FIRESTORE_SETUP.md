# Firestore Security Rules and Indexes Setup

This document explains how to deploy and test the Firestore security rules and indexes for the Quran App.

## Files Overview

- `firestore.rules` - Security rules for all Firestore collections
- `firestore.indexes.json` - Index configurations for optimal query performance
- `firebase.json` - Firebase project configuration
- `src/lib/__tests__/firestore-rules.test.js` - Security rules validation tests

## Security Rules Summary

### Authentication Requirements
All collections require authentication (`request.auth != null`):
- `admin_users` - Admin user credentials
- `custom_urls` - Custom audio URLs
- `audio_mappings` - Verse-to-audio mappings
- `tafseer_entries` - Verse interpretations

### Data Validation
The rules enforce:
- **custom_urls**: Required fields (url, title, timestamps), string type validation
- **audio_mappings**: Required fields (surah_number, ayah_number, custom_url_id, timestamps), integer validation, surah range (1-114), ayah minimum (1)
- **tafseer_entries**: Required fields (surah_number, ayah_number, tafseer_text, timestamps), integer and string validation, surah range (1-114), ayah minimum (1)

## Indexes Summary

### Composite Indexes
These indexes optimize queries that filter on multiple fields:

1. **audio_mappings**: `surah_number` (ASC) + `ayah_number` (ASC)
   - Optimizes queries for finding audio by verse reference
   - Used in: `QuranContext.fetchUpdatedAudioMapping()`, `QuranContext.saveAudioMapping()`, `QuranContext.deleteAudioMapping()`
   
2. **tafseer_entries**: `surah_number` (ASC) + `ayah_number` (ASC)
   - Optimizes queries for finding tafseer by verse reference
   - Used in: `QuranContext.saveTafseerMapping()`, `QuranContext.deleteTafseerMapping()`

3. **custom_urls**: `created_at` (DESC)
   - Optimizes queries for listing URLs by creation date
   - Used for displaying custom URLs in chronological order

### Single-Field Indexes (Field Overrides)
These indexes optimize queries that filter on a single field:

1. **audio_mappings.custom_url_id** (ASC)
   - Optimizes queries for finding all audio mappings using a specific custom URL
   - Used in: `QuranContext.updateAudioMappingsWithUrl()`, `AdminPanel.handleDeleteUrl()`

2. **audio_mappings.surah_number** (ASC)
   - Optimizes queries for finding all audio mappings for a specific surah
   - Used for displaying mappings by surah in the admin panel

3. **tafseer_entries.surah_number** (ASC)
   - Optimizes queries for finding all tafseer entries for a specific surah
   - Used for displaying tafseer entries by surah in the admin panel

4. **custom_urls.url** (ASC)
   - Optimizes queries for checking if a URL already exists
   - Used in: `QuranContext.saveCustomUrl()` to prevent duplicate URLs

## Deployment Instructions

### Option 1: Firebase Console (Recommended for Production)

#### Deploy Security Rules:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click "Publish"

#### Deploy Indexes:
1. In Firebase Console, navigate to Firestore Database → Indexes
2. Click "Add Index" for each composite index in `firestore.indexes.json`:
   - **audio_mappings**: Add fields `surah_number` (Ascending), `ayah_number` (Ascending)
   - **tafseer_entries**: Add fields `surah_number` (Ascending), `ayah_number` (Ascending)
   - **custom_urls**: Add field `created_at` (Descending)
3. For single-field indexes, Firestore will automatically create them when needed, or you can manually add them:
   - **audio_mappings**: `custom_url_id` (Ascending), `surah_number` (Ascending)
   - **tafseer_entries**: `surah_number` (Ascending)
   - **custom_urls**: `url` (Ascending)
4. Wait for indexes to build (can take a few minutes for large datasets)

### Option 2: Firebase CLI (Recommended for Development)

#### Prerequisites:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init
```

#### Deploy Rules and Indexes:
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Deploy both at once
firebase deploy --only firestore
```

## Testing with Firebase Emulator

### Setup Emulator:
```bash
# Initialize emulators (select Firestore)
firebase init emulators

# Start emulator
firebase emulators:start
```

### Run Tests:
```bash
# Run security rules tests
npm test -- firestore-rules.test.js
```

### Manual Testing:
1. Start the emulator: `firebase emulators:start`
2. Access Emulator UI: http://localhost:4000
3. Test operations in Firestore tab
4. Verify rules are enforced

## Verification Checklist

After deployment, verify:

- [ ] Security rules are active in Firebase Console
- [ ] Unauthenticated requests are denied
- [ ] Authenticated users can read/write to all collections
- [ ] Data validation rules reject invalid data
- [ ] All indexes show "Enabled" status in Firebase Console
- [ ] Queries using indexed fields perform efficiently
- [ ] No "missing index" errors in application logs

## Troubleshooting

### Rules Not Working
- Check Firebase Console → Firestore → Rules to ensure rules are published
- Verify authentication is working correctly
- Check browser console for permission errors

### Index Errors
- Look for "The query requires an index" errors in console
- Create missing indexes via the error message link or Firebase Console
- Wait for indexes to finish building (check status in Console)

### Performance Issues
- Monitor query performance in Firebase Console
- Add additional indexes for frequently used query patterns
- Consider denormalization for complex queries

## Security Best Practices

1. **Never disable authentication requirements** in production
2. **Test rules thoroughly** before deploying to production
3. **Monitor Firestore usage** in Firebase Console
4. **Review rules regularly** as application evolves
5. **Use separate Firebase projects** for development and production
6. **Keep rules version controlled** in this repository

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
