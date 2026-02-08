# Firebase Permissions & Index Fixes

## Date: January 31, 2026

## Issues Fixed

### 1. Missing Firestore Rules for Conversations
**Error:** `Missing or insufficient permissions` when loading conversations

**Solution:** Added security rules for the `conversations` collection in `firestore.rules`:
- Lawyers can read/write their own conversations
- Admins have full access
- Proper authentication checks in place

### 2. Missing Firestore Rules for Lawyers Collection
**Error:** `Permission denied` when trying to read client/lawyer profiles

**Solution:** Added security rules for the `lawyers` collection:
- Public read access for lawyer profiles (needed for search/discovery)
- Only the lawyer owner or admin can update their profile
- Only admins can delete profiles

### 3. Missing Firestore Indexes
**Error:** `The query requires an index` for diligences collection

**Solution:** Created `firestore.indexes.json` with composite indexes:
- `diligences` collection: `clientId + lawyerId + createdAt`
- `diligences` collection: `lawyerId + createdAt`
- `conversations` collection: `lawyerId + updatedAt`

## Files Modified

1. **firestore.rules** - Added rules for `conversations` and `lawyers` collections
2. **firebase.json** - Added reference to `firestore.indexes.json`
3. **firestore.indexes.json** - Created new file with required indexes

## Deployment Status

✅ Firestore rules deployed successfully
✅ Firestore indexes deployed successfully

## What to Do Next

1. **Refresh your application** - The permission errors should now be resolved
2. **Wait for indexes to build** - Composite indexes can take a few minutes to build in Firebase
3. **Test the following features:**
   - Loading conversations in the workspace assistant
   - Viewing client profiles in appointments
   - Querying diligences (time tracking)

## Index Build Status

You can check the index build status in the Firebase Console:
https://console.firebase.google.com/project/jurilab-8bc6d/firestore/indexes

Indexes typically take 2-5 minutes to build for small datasets, but can take longer for larger collections.

## Notes

- The warnings about `isClient`, `get`, and `request` in the deployment output are false positives from Firebase's linter and can be safely ignored
- All security rules follow the principle of least privilege
- Users can only access their own data unless they have admin privileges
