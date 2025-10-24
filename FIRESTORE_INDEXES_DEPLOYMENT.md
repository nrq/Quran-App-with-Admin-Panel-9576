# Firestore Indexes Deployment Guide

This guide explains how to deploy the optimized Firestore indexes for the Quran App.

## Index Configuration Overview

The `firestore.indexes.json` file contains two types of indexes:

### 1. Composite Indexes (3 indexes)
These optimize queries that filter on multiple fields simultaneously:

- **audio_mappings**: `surah_number` + `ayah_number` (both ascending)
- **tafseer_entries**: `surah_number` + `ayah_number` (both ascending)  
- **custom_urls**: `created_at` (descending)

### 2. Single-Field Indexes (4 field overrides)
These optimize queries that filter on a single field:

- **audio_mappings.custom_url_id**: For finding all audio mappings using a specific URL
- **audio_mappings.surah_number**: For listing all audio mappings by surah
- **tafseer_entries.surah_number**: For listing all tafseer entries by surah
- **custom_urls.url**: For checking URL uniqueness before creating new entries

## Why These Indexes?

Based on the query patterns in the codebase:

1. **Verse lookups** (`surah_number` + `ayah_number`): Most common query pattern for retrieving specific verse data
2. **URL relationship queries** (`custom_url_id`): Used when updating or deleting custom URLs to find affected audio mappings
3. **Surah-level queries** (`surah_number`): Used in admin panel to display all mappings for a specific surah
4. **URL uniqueness checks** (`url`): Prevents duplicate custom URLs in the database

## Deployment Methods

### Method 1: Firebase CLI (Recommended)

#### Prerequisites:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Authenticate with Firebase
firebase login
```

#### Deploy Indexes:
```bash
# Deploy only indexes
firebase deploy --only firestore:indexes

# Or deploy both rules and indexes
firebase deploy --only firestore
```

#### Verify Deployment:
```bash
# Check deployment status
firebase firestore:indexes
```

### Method 2: Firebase Console (Manual)

If you prefer to use the Firebase Console or don't have CLI access:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab

#### Create Composite Indexes:

**Index 1: audio_mappings**
- Click "Create Index"
- Collection ID: `audio_mappings`
- Add field: `surah_number` → Ascending
- Add field: `ayah_number` → Ascending
- Query scope: Collection
- Click "Create"

**Index 2: tafseer_entries**
- Click "Create Index"
- Collection ID: `tafseer_entries`
- Add field: `surah_number` → Ascending
- Add field: `ayah_number` → Ascending
- Query scope: Collection
- Click "Create"

**Index 3: custom_urls**
- Click "Create Index"
- Collection ID: `custom_urls`
- Add field: `created_at` → Descending
- Query scope: Collection
- Click "Create"

#### Create Single-Field Indexes:

Navigate to **Firestore Database** → **Indexes** → **Single field** tab

**Index 4: audio_mappings.custom_url_id**
- Click "Add Exemption"
- Collection ID: `audio_mappings`
- Field path: `custom_url_id`
- Enable "Collection" scope
- Ascending order
- Click "Create"

**Index 5: audio_mappings.surah_number**
- Collection ID: `audio_mappings`
- Field path: `surah_number`
- Enable "Collection" scope
- Ascending order
- Click "Create"

**Index 6: tafseer_entries.surah_number**
- Collection ID: `tafseer_entries`
- Field path: `surah_number`
- Enable "Collection" scope
- Ascending order
- Click "Create"

**Index 7: custom_urls.url**
- Collection ID: `custom_urls`
- Field path: `url`
- Enable "Collection" scope
- Ascending order
- Click "Create"

## Verification

After deployment, verify the indexes are working:

### 1. Check Index Status
In Firebase Console → Firestore → Indexes:
- All indexes should show status: **Enabled** (green)
- If status is "Building", wait a few minutes for completion

### 2. Test Application Queries
Run the application and check browser console:
- No "missing index" errors should appear
- Queries should execute quickly

### 3. Monitor Performance
In Firebase Console → Firestore → Usage:
- Check query performance metrics
- Verify read operations are efficient

## Expected Build Time

- **Empty database**: Indexes build instantly
- **Small dataset** (<1000 documents): 1-2 minutes
- **Medium dataset** (1000-10000 documents): 5-10 minutes
- **Large dataset** (>10000 documents): 15-30 minutes

## Troubleshooting

### "The query requires an index" Error

If you see this error in the console:
1. Click the link in the error message (it will open Firebase Console with pre-filled index configuration)
2. Click "Create Index"
3. Wait for the index to build

### Index Build Stuck

If an index shows "Building" for more than expected:
1. Check Firebase Status page for any incidents
2. Try deleting and recreating the index
3. Contact Firebase support if issue persists

### Authentication Error (CLI)

If you get authentication errors:
```bash
# Re-authenticate
firebase login --reauth

# For CI/CD environments
firebase login:ci
```

## Performance Impact

With these indexes in place, you should see:
- **Faster verse lookups**: ~50-100ms → ~10-20ms
- **Efficient URL management**: No full collection scans
- **Scalable queries**: Performance remains consistent as data grows

## Maintenance

### When to Add New Indexes

Add new indexes when:
1. You see "missing index" errors in production
2. Query performance degrades as data grows
3. You add new query patterns to the application

### Index Monitoring

Regularly check:
- Firebase Console → Firestore → Usage for query patterns
- Application logs for slow queries
- Index usage statistics in Firebase Console

## Cost Considerations

- **Index storage**: Minimal cost for this application size
- **Index writes**: Each document write updates relevant indexes
- **Query reads**: Indexed queries are more efficient and cost-effective

For this application's scale, index costs are negligible compared to the performance benefits.

## Next Steps

After deploying indexes:
1. ✅ Deploy security rules (see `FIRESTORE_SETUP.md`)
2. ✅ Test application functionality
3. ✅ Monitor query performance
4. ✅ Update indexes as application evolves
