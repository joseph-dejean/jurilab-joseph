# How to Store Secrets in Firebase (Not GitHub)

## âš ï¸ IMPORTANT: Security Best Practices

**Never commit secrets to GitHub!** Use Firebase Functions config for production secrets.

## Current Setup

Your `.env` file is created and is in `.gitignore` - safe for local development.

## For Production: Firebase Functions Config

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Set Secrets in Firebase Functions Config

Run these commands to store your secrets securely:

```bash
# Set Gemini API Key
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Set Daily.co API Key (replace with your actual key)
firebase functions:config:set daily.api_key="YOUR_DAILY_API_KEY"

# Set Google OAuth Client Secret
firebase functions:config:set google.client_secret="YOUR_GOOGLE_CLIENT_SECRET"

# Set Google Developer Key (if needed server-side)
firebase functions:config:set google.developer_key="YOUR_GOOGLE_DEVELOPER_KEY"
```

### Step 4: Verify Secrets Are Set
```bash
firebase functions:config:get
```

### Step 5: Use Secrets in Firebase Functions

If you create Firebase Functions, access secrets like this:

```javascript
const functions = require('firebase-functions');
const config = functions.config();

// Access secrets
const geminiApiKey = config.gemini.api_key;
const dailyApiKey = config.daily.api_key;
```

## Alternative: Environment Variables in Firebase Functions (Newer Method)

Firebase also supports `.env` files for Functions (Firebase Functions v2+):

1. Create `functions/.env` (already in .gitignore)
2. Use `functions.config()` or `process.env` in your functions

## For Frontend (Vite) - What's Safe?

### âœ… Safe to use VITE_ prefix (public):
- `VITE_GOOGLE_CLIENT_ID` - OAuth client IDs are meant to be public
- `VITE_FIREBASE_*` - Firebase config is public
- `VITE_GOOGLE_APP_ID` - Public identifier

### âŒ NOT safe (use Firebase Functions instead):
- `VITE_GEMINI_API_KEY` - Should be server-side only
- `VITE_GOOGLE_CLIENT_SECRET` - Must be secret
- `VITE_DAILY_API_KEY` - Depends on your Daily.co account settings

## Recommended Architecture

1. **Frontend (Vite)**: Only public config (OAuth client IDs, Firebase config)
2. **Firebase Functions**: All secret API keys
3. **Frontend calls Functions**: Frontend makes API calls to your Functions, Functions call external APIs with secrets

Example:
```
Frontend â†’ Firebase Function â†’ Gemini API (with secret key)
```

## Next Steps

1. âœ… `.env` file created (for local dev)
2. â­ï¸ Set up Firebase Functions config (commands above)
3. â­ï¸ Create Firebase Functions to proxy API calls with secrets
4. â­ï¸ Update frontend to call Functions instead of external APIs directly

