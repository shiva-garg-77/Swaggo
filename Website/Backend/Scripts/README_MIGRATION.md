# User-Profile ID Sync Migration

## Problem
Users and Profiles were not properly linked, causing chat creation to fail with error:
```
"A chat requires at least 2 participants"
```

The issue was that:
- User model had `id` field
- Profile model had `profileid` field
- No cross-reference between them
- Some users had no corresponding Profile document

## Solution
Added bidirectional references:
- User model now has `profileid` field (references Profile)
- Profile model now has `userid` field (references User)

## Running the Migration

### Step 1: Backup your database
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

### Step 2: Run the sync script
```bash
cd Website/Backend
node Scripts/syncUserProfileIds.js
```

### Step 3: Verify the results
The script will output:
- Number of users processed
- Number of profiles created
- Number of records updated
- Any errors encountered

### What the script does:
1. ✅ Finds all Users and ensures they have a Profile
2. ✅ Creates missing Profile documents
3. ✅ Links User.profileid → Profile.profileid
4. ✅ Links Profile.userid → User.id
5. ✅ Handles orphaned profiles

### Expected Output:
```
🔄 Starting User-Profile ID sync...
✅ Connected to MongoDB
📋 Step 1: Processing Users...
Found 10 users
✅ Created profile for user shivahumaiyaar
✅ Updated user shivahumaiyaar with profileid: 782c0ccd-bae5-4f5a-99a3-c9d73b2e7cb0
📋 Step 2: Processing Profiles...
Found 10 profiles
============================================================
📊 SYNC SUMMARY
============================================================
Users processed:     10
Users updated:       10
Profiles processed:  10
Profiles updated:    10
Profiles created:    1
Errors:              0
============================================================
✅ Sync completed successfully!
```

## After Migration

### Test chat creation:
1. Login as any user
2. Search for another user
3. Try to create a chat
4. Should work without errors

### Verify in database:
```javascript
// Check User has profileid
db.users.findOne({ username: "shivahumaiyaar" })
// Should show: { id: "...", profileid: "...", ... }

// Check Profile has userid
db.profiles.findOne({ username: "shivahumaiyaar" })
// Should show: { profileid: "...", userid: "...", ... }
```

## Troubleshooting

### If migration fails:
1. Check MongoDB connection string in `.env`
2. Ensure MongoDB is running
3. Check error messages in output
4. Restore from backup if needed

### If chat creation still fails:
1. Check browser console for the exact user IDs being sent
2. Verify those IDs exist in Profile collection:
   ```javascript
   db.profiles.find({ $or: [
     { profileid: "user-id-here" },
     { userid: "user-id-here" }
   ]})
   ```
3. Run migration again if needed

## Prevention

The updated models now enforce these references, so:
- New users will automatically get linked profiles
- Chat service checks both `profileid` and `userid` fields
- Frontend standardizes on using `user.profileid` or `user.id`

## Files Modified
- ✅ `Models/User.js` - Added `profileid` field
- ✅ `Models/FeedModels/Profile.js` - Added `userid` field
- ✅ `Services/Chat/ChatService.js` - Updated to check both fields
- ✅ `Scripts/syncUserProfileIds.js` - Migration script
