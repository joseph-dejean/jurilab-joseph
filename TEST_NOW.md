# 🎯 Quick Testing Guide - Video Call System

## ⚡ INSTANT ACCESS ENABLED

You can now join video calls **immediately** after accepting them!

---

## 🚀 How to Test (2 minutes)

### Step 1: Book an Appointment
```
1. Go to: http://localhost:5173
2. Find a lawyer profile
3. Click "Prendre rendez-vous"
4. Select any future date/time
5. Choose "Visioconférence"
6. Confirm booking
```

### Step 2: Accept the Appointment (as Lawyer)
```
1. Go to Dashboard or "Mes rendez-vous"
2. Find your PENDING appointment
3. Click "Accepter"
4. Daily.co room is created automatically
```

### Step 3: Join the Call IMMEDIATELY! 🎉
```
1. After acceptance, "Rejoindre la visio" button appears
2. Click it (no waiting 5 minutes!)
3. You'll join the new Daily.js video system
```

---

## 🎨 What You'll See

### Before Joining
```
┌─────────────────────────────────┐
│ Video Consultation              │
│ Status: ✅ Confirmé             │
│ Date: [future date]             │
│                                  │
│ [🎥 Rejoindre la visio]  ← NEW! │
└─────────────────────────────────┘
```

### After Joining
```
┌────────────────────────────────────┐
│ 🎥 Consultation | ⏱️ 00:12 | 👥 1 │
├────────────────────────────────────┤
│                                     │
│  ┌───────────────────────┐         │
│  │                       │         │
│  │    Your Video         │         │
│  │    (with name)        │         │
│  │                       │         │
│  └───────────────────────┘         │
│                                     │
│  📝 Transcription en cours (FR)    │
├────────────────────────────────────┤
│  🎤  📹  🖥️    [QUITTER]       💬 │
└────────────────────────────────────┘
```

---

## ✅ Test Checklist

### Basic Features
- [ ] Join call successfully
- [ ] See your video
- [ ] See custom Jurilab UI (not Daily Prebuilt)
- [ ] Controls are at the bottom
- [ ] Header shows timer and stats

### Controls
- [ ] Click microphone → mutes/unmutes
- [ ] Click camera → video on/off
- [ ] Click screen share → shares screen (desktop only)
- [ ] Click leave → exits gracefully

### Transcription (Lawyers)
- [ ] Red badge "Transcription en cours (FR)" appears (top right)
- [ ] Badge is pulsing
- [ ] After leaving, transcript saves to Firebase

### UI
- [ ] Brand colors match your app (navy, slate)
- [ ] Controls have hover tooltips
- [ ] Buttons have smooth animations
- [ ] Responsive on mobile

---

## 🧪 Two-Person Test

**Test with 2 browsers** to see both participants:

### Browser 1 (Lawyer)
1. Login as lawyer
2. Accept appointment
3. Join video call
4. Should see transcription indicator

### Browser 2 (Client)  
1. Login as client
2. Go to appointments
3. Join video call
4. Should see lawyer's video

### Both Should See
- Grid layout (2 video tiles)
- Each other's video
- Working controls
- Professional UI

---

## 🎯 What to Look For

### ✅ Good Signs
- Custom UI (not Daily's iframe)
- Controls respond instantly
- Video loads quickly
- Smooth animations
- Brand colors everywhere

### ❌ Problems to Report
- Iframe appears (old system)
- Controls don't work
- Video doesn't load
- Errors in console (F12)

---

## 🐛 If Something Goes Wrong

### Video doesn't load
1. Check browser permissions (camera/mic)
2. Open console (F12) - look for errors
3. Verify HTTPS (or localhost)
4. Try another browser

### Can't join meeting
1. Verify appointment is CONFIRMED (not PENDING)
2. Check `dailyRoomUrl` exists (should be set on acceptance)
3. Look for errors in console
4. Check Daily.co API key in `.env`

### Transcription not showing
1. Only shows for lawyers (not clients)
2. Should appear ~1 second after joining
3. Check console for "✅ French transcription started"

### Controls not working
1. This is the NEW system (not iframe)
2. Should respond instantly
3. Check console for errors
4. Verify Daily.js is loaded

---

## 🔄 After Testing

### To Disable Instant Join (Production Mode)

See `TESTING_MODE.md` for full instructions, or:

**Quick disable** - In both files:
```typescript
// Change this:
return true; // FOR TESTING

// To this:
return false; // Testing disabled
```

**Then uncomment the production logic** below it.

---

## 📊 Key Differences

| Aspect | Old System | New System |
|--------|-----------|------------|
| **UI** | Iframe | Custom components |
| **Control** | Limited | Full SDK access |
| **Transcription** | Basic | French, premium |
| **Branding** | Daily logo | Jurilab colors |
| **Join Access** | 5min window | Immediate (testing) |

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ No iframe visible (custom UI)
2. ✅ Controls at bottom work instantly
3. ✅ Brand colors match your app
4. ✅ French transcription badge (lawyers)
5. ✅ Smooth animations
6. ✅ Professional appearance

---

## 📞 Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check for errors
npm run build
```

---

**Status**: 🧪 TESTING MODE ACTIVE  
**Join Access**: ✅ IMMEDIATE (after acceptance)  
**Time Window**: ⏰ DISABLED (for testing)

**Ready to test your new video system!** 🚀

Open `http://localhost:5173` and start testing!
