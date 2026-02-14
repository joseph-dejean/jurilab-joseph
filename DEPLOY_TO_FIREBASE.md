# How to Deploy to Firebase with Your API Keys

## ✅ Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase**
   ```bash
   firebase login
   ```

3. **Your `.env` file is ready** (already created in the project root)

## 🚀 Deployment Steps

### Step 1: Make sure your `.env` file has all keys

Your `.env` file should be in the project root with all your API keys:
- `VITE_GEMINI_API_KEY`
- `VITE_DAILY_API_KEY`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_DEVELOPER_KEY`
- `VITE_GOOGLE_APP_ID`
- `VITE_GOOGLE_CLIENT_SECRET`

### Step 2: Build your app with environment variables

The build process will read your `.env` file and embed the `VITE_*` variables into the production build:

```bash
npm run build
```

This creates a `dist/` folder with your production-ready app.

### Step 3: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or deploy everything (hosting, functions, etc.):
```bash
firebase deploy
```

## 📝 Quick Deploy Script

You can add this to your `package.json`:

```json
"scripts": {
  "deploy": "npm run build && firebase deploy --only hosting"
}
```

Then just run:
```bash
npm run deploy
```

## ⚠️ Important Notes

### Security Warning
- **`VITE_*` variables are embedded in your build** - they will be visible in the browser's JavaScript bundle
- This is **OK for public keys** like OAuth Client IDs
- **NOT OK for truly secret keys** - use Firebase Functions for those

### What Gets Deployed
- Your `.env` file is **NOT uploaded** to Firebase (it's in `.gitignore`)
- Only the **built files in `dist/`** are deployed
- The environment variables are **baked into the JavaScript** during build

### Environment-Specific Builds

If you need different keys for development vs production:

1. **Create `.env.production`** for production keys
2. **Keep `.env`** for local development
3. Build with: `npm run build -- --mode production`

Vite will automatically use `.env.production` when building for production.

## 🔍 Verify Deployment

After deployment, check:
1. Visit your Firebase Hosting URL: `https://jurilab-8bc6d.web.app`
2. Open browser DevTools → Console
3. Check if `import.meta.env.VITE_GEMINI_API_KEY` is accessible (it will be in the code)

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
```bash
npm install
```

### Firebase not logged in
```bash
firebase login
```

### Wrong Firebase project
```bash
firebase use --add
# Select your project: jurilab-8bc6d
```

### Environment variables not working
- Make sure `.env` file is in the **project root** (same level as `package.json`)
- Make sure variable names start with `VITE_`
- Rebuild: `npm run build`

## 📚 Next Steps (Optional - Better Security)

For truly secret keys (like API keys that shouldn't be exposed), consider:
1. Create Firebase Functions
2. Store secrets in Firebase Functions config
3. Have frontend call Functions instead of external APIs directly

See `SETUP_FIREBASE_SECRETS.md` for details.
