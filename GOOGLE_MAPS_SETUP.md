# Quick Setup: Google Maps API Key

## Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - **Maps JavaScript API** (required)
   - **Places API** (optional, for future features)

4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > API Key**
6. Copy your API key

## Step 2: Restrict Your API Key (Important for Security)

### Application Restrictions
- Select **HTTP referrers (websites)**
- Add your domains:
  ```
  localhost:*/*
  your-domain.com/*
  *.your-domain.com/*
  ```

### API Restrictions
- Select **Restrict key**
- Check only:
  - Maps JavaScript API
  - Places API (if needed)

## Step 3: Add to Your Project

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your key:
   ```bash
   VITE_GOOGLE_DEVELOPER_KEY=YOUR_ACTUAL_API_KEY_HERE
   ```

3. Save and restart your dev server:
   ```bash
   npm run dev
   ```

## Step 4: Verify It Works

1. Go to the search page (with the map)
2. You should see:
   - ✅ Google Maps loads in French
   - ✅ Lawyer markers appear
   - ✅ Clicking markers selects lawyers
   - ✅ Smooth zoom animations

## Troubleshooting

### Map shows "For development purposes only" watermark
**Cause:** API key restrictions are too strict or billing not enabled  
**Fix:** Check your API key restrictions and enable billing in Google Cloud

### Map doesn't load / shows error
**Cause:** Invalid API key or API not enabled  
**Fix:** 
1. Check `.env` file has correct key
2. Verify Maps JavaScript API is enabled in Google Cloud
3. Check browser console for specific error

### Map loads but in English
**Cause:** Language parameter not working  
**Fix:** Already set to French in code - should work automatically

### Markers don't appear
**Cause:** Lawyer coordinates might be invalid  
**Fix:** Check console for coordinate validation errors

## Cost Estimate

Google Maps offers **$200 free credit per month**, which covers:
- ~28,000 map loads per month
- Dynamic Maps: $7 per 1,000 loads
- For most applications, you'll stay within free tier

**Enable billing** to avoid watermarks, but you won't be charged until you exceed $200/month.

## Current Implementation

The map is configured for:
- 🇫🇷 French language (`language=fr`)
- 🗺️ France region (`region=FR`)
- 📍 France bounds (lat: 41.2-51.2, lng: -5.5-10.0)
- 🎯 Custom purple markers for lawyers
- 💬 Info windows on selection
- 📱 Mobile responsive
- 🌙 Dark mode support

## Need Help?

Check the full documentation: `GOOGLE_MAPS_IMPLEMENTATION.md`
