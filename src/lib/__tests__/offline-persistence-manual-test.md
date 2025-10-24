# Offline Persistence Manual Testing Guide

This document provides steps to manually verify that Firestore offline persistence is working correctly.

## Prerequisites
- Firebase project configured with valid credentials
- Application running in development or production mode

## Test Scenarios

### Test 1: Verify Offline Persistence is Enabled
1. Open the browser console
2. Load the application
3. Look for the console message: "Firestore initialized with offline persistence and multi-tab support"
4. **Expected Result**: Message appears confirming persistence is enabled

### Test 2: Multi-Tab Support
1. Open the application in one browser tab
2. Open the same application in a second tab
3. Both tabs should work without errors
4. **Expected Result**: No "failed-precondition" errors in console, both tabs function normally

### Test 3: Offline Data Access
1. Load the application while online
2. Navigate to admin panel and view some data (custom URLs, audio mappings)
3. Open browser DevTools > Network tab
4. Set network to "Offline" mode
5. Refresh the page or navigate between pages
6. **Expected Result**: 
   - Offline indicator shows "Offline Mode" or "Local Mode"
   - Previously loaded data is still accessible
   - Quran verses load from local cache

### Test 4: Data Synchronization After Reconnection
1. While offline, make changes (add/edit custom URLs or audio mappings)
2. Changes should be queued locally
3. Re-enable network connection
4. **Expected Result**:
   - Offline indicator changes to "Online & Synced"
   - Queued changes sync to Firestore automatically
   - Data is consistent across tabs

### Test 5: Offline Indicator States
1. **Online & Synced**: Normal operation with network connection
   - Green indicator
   - Shows total verses count
   
2. **Offline Mode**: No network connection
   - Orange indicator
   - Shows cached verses count
   
3. **Local Mode**: Network available but Firestore using cache
   - Blue indicator
   - Shows verses count

## Verification Checklist
- [ ] Console shows persistence enabled message
- [ ] Multiple tabs work simultaneously without errors
- [ ] Data accessible when offline
- [ ] Changes sync when connection restored
- [ ] Offline indicator shows correct states
- [ ] No data loss during offline/online transitions
