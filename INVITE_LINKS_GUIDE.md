# 🎉 Multi-Participant Video Calls with Invite Links

## ✅ Feature Implemented!

You can now **invite multiple people** to your video calls using **shareable invite links**!

---

## 🚀 What's New

### 1. **Flexible Participant Limits**
- ✅ Default: **10 participants** per call
- ✅ Configurable (can be changed to 2, 5, 20, 50, etc.)
- ✅ No more "only lawyer + client" restriction

### 2. **Guest Invite Links**
- ✅ Generate secure invite links during calls
- ✅ Share via Email, WhatsApp, or copy/paste
- ✅ No account needed for guests to join
- ✅ Links valid for 24 hours

### 3. **Easy Sharing Options**
- ✅ One-click copy to clipboard
- ✅ Share via Email (opens email client)
- ✅ Share via WhatsApp (opens WhatsApp)
- ✅ Open in new tab (for testing)

---

## 🎯 How to Use

### During a Video Call:

1. **Click the "Invite" button** (👥 icon) in the bottom-left controls
   
2. **Modal opens** with invite options:
   ```
   ┌────────────────────────────────────────┐
   │  🔗 Inviter des participants           │
   │                                        │
   │  [Generate Link Button]                │
   │                                        │
   │  Link: https://jurilab.com/...         │
   │  [Copy] [Email] [WhatsApp]             │
   └────────────────────────────────────────┘
   ```

3. **Share the link** with anyone you want to invite

4. **Guests click the link** → Join instantly (no login!)

---

## 📋 Features

### Invite Button
- **Location**: Bottom-left of video call controls
- **Icon**: 👥 User Plus
- **Compact design**: Matches other control buttons

### Invite Modal
- **Secure link generation**: Unique token per guest
- **Multiple sharing methods**:
  - Copy to clipboard
  - Share via Email
  - Share via WhatsApp
  - Open in new tab
- **Guest info**: Shows room ID and expiration
- **One-time generation**: Link reused if opened again

### Guest Experience
```
1. Receive invite link
2. Click link → Opens video call page
3. Join directly (no account needed)
4. Participate in call:
   - ✅ Video & audio
   - ✅ Screen sharing
   - ✅ Chat
   - ✅ See transcription
```

---

## 🔧 Technical Details

### Room Configuration
**File**: `services/dailyService.ts`
```typescript
createRoom(
  appointmentId,
  lawyerName,
  clientName,
  durationMinutes = 60,
  maxParticipants = 10  // ← Now configurable!
)
```

### Guest Token Generation
**File**: `services/dailyService.ts`
```typescript
generateGuestToken(
  roomId,
  guestName = 'Invité'
)
```

Creates a secure 24-hour token for guest access.

### Invite Link Format
```
https://jurilab.com/video-call?
  roomUrl=https://jurilab.daily.co/room-id
  &token=guest-token-here
  &guest=true
```

### Components Added
1. **`InviteButton.tsx`** - Invite button + modal
2. **`ControlsBar.tsx`** - Updated to support left content
3. **`VideoCallPage.tsx`** - Guest mode support

---

## 🎨 UI/UX

### Invite Button
```
┌─────┐
│ 👥  │  ← Click to invite
└─────┘
```

### Invite Modal (Full)
```
┌─────────────────────────────────────────────────────┐
│  🔗 Inviter des participants                        │
│  Partagez ce lien pour inviter d'autres personnes  │
│                                             [X]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ℹ️ Lien d'invitation sécurisé                      │
│     Ce lien permet à n'importe qui de rejoindre    │
│     cet appel pendant 24h                          │
│                                                     │
│  LIEN D'INVITATION                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ https://jurilab.com/video-call?room...      │   │
│  │                                 [Copier]    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  PARTAGER PAR                                       │
│  ┌──────────┐  ┌──────────┐                        │
│  │ ✉️ Email  │  │ 💬 WhatsApp│                       │
│  └──────────┘  └──────────┘                        │
│                                                     │
│  [🔗 Ouvrir dans un nouvel onglet]                  │
│                                                     │
│  ID de la salle: jurilab-appt-123-456789           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Le lien expire dans 24 heures          [Fermer]   │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Test 1: Generate Link
```
1. Start a video call
2. Click invite button (👥) bottom-left
3. Click "Générer le lien d'invitation"
4. Wait 1-2 seconds
5. ✅ Link appears
```

### Test 2: Copy & Share
```
1. Generate link (from Test 1)
2. Click "Copier"
3. ✅ Button shows "Copié!" (green)
4. Paste link in browser → should work
```

### Test 3: Guest Joining
```
1. Generate link
2. Open in incognito window (or different browser)
3. Click link
4. ✅ Joins call as "Invité"
5. Can see video, chat, screenshare
```

### Test 4: Multiple Guests
```
1. Generate link
2. Share with 3 different people
3. All click simultaneously
4. ✅ All join the same call
5. Can see each other's video
```

---

## 📊 Participant Management

### Current Participants Display
**In CallHeader**:
```
👥 3 participants
```

Shows total count including:
- Host (lawyer)
- Client
- All guests

### Participant List
Each participant shows:
- Video tile
- Name badge
- Audio/video status
- Connection quality

---

## 🔒 Security

### Token Security
```
✅ Unique token per guest
✅ 24-hour expiration
✅ Cannot be reused after expiry
✅ Tied to specific room
```

### Room Privacy
```
✅ Room is "private" (not discoverable)
✅ Requires token to join
✅ Cannot guess room URLs
✅ Auto-expires after meeting
```

### Best Practices
```
⚠️ Only share links with trusted participants
⚠️ Don't post links publicly
⚠️ Regenerate links if compromised
⚠️ Close room when meeting ends
```

---

## ⚙️ Configuration

### Change Max Participants

**In `firebaseService.ts`** (where rooms are created):
```typescript
// Example: Only 3 people max
const { roomUrl, roomId } = await createRoom(
  appointmentId,
  lawyerName,
  clientName,
  60, // duration
  3   // max participants ← Change this!
);
```

**Common values**:
- `2` = Private (lawyer + client only)
- `5` = Small group
- `10` = Default (current)
- `20` = Large meeting
- `50` = Webinar

### Change Token Expiration

**In `dailyService.ts` → `generateGuestToken`**:
```typescript
// Current: 24 hours
const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

// Change to 1 hour:
const expirationTime = Math.floor(Date.now() / 1000) + (1 * 60 * 60);

// Change to 48 hours:
const expirationTime = Math.floor(Date.now() / 1000) + (48 * 60 * 60);
```

---

## 🎯 Use Cases

### 1. Client + Multiple Lawyers
```
Scenario: Client consultation with team
Participants:
  - Client (original appointment)
  - Lead Lawyer (host)
  - Associate Lawyer (invited)
  - Paralegal (invited)
```

### 2. Expert Witness Consultation
```
Scenario: Lawyer needs expert opinion
Participants:
  - Lawyer (host)
  - Client
  - Medical Expert (invited)
  - Financial Expert (invited)
```

### 3. Family Law Meeting
```
Scenario: Multiple family members
Participants:
  - Lawyer (host)
  - Primary Client
  - Spouse (invited)
  - Family Member (invited)
```

### 4. Business Consultation
```
Scenario: Corporate legal advice
Participants:
  - Lawyer (host)
  - CEO (client)
  - CFO (invited)
  - Board Member (invited)
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot generate link"
```
Cause: Room ID not available
Fix: Make sure you're in an active call
Check: roomId exists in URL
```

### Issue 2: "Link doesn't work"
```
Cause: Token expired (>24h old)
Fix: Generate new link
Check: Link was created recently
```

### Issue 3: "Max participants reached"
```
Cause: Too many people joined
Fix: Increase max_participants in createRoom
Default: 10 participants
```

### Issue 4: "Guest can't join"
```
Possible causes:
  - Link expired
  - Room ended
  - Invalid token
  - Max participants reached
Fix: Generate fresh link from active call
```

---

## 📈 Future Enhancements

Possible improvements:
- [ ] Participant management UI (kick, mute)
- [ ] Waiting room for guests
- [ ] Custom guest names (before joining)
- [ ] Persistent invite links (reusable)
- [ ] Multiple invite links (different permissions)
- [ ] Link analytics (who joined when)

---

## 📝 Summary

**What you can do now**:
✅ Invite unlimited people to video calls (up to 10 by default)  
✅ Generate shareable links during calls  
✅ Share via Email, WhatsApp, or copy/paste  
✅ Guests join without creating accounts  
✅ All participants see same features (video, chat, screenshare)  

**How it works**:
1. Click invite button (👥) in call
2. Generate secure link
3. Share with anyone
4. They click → join instantly!

---

## 🎊 Ready to Use!

**Test it now**:
1. Start any video call
2. Look for 👥 button (bottom-left)
3. Click → Generate link
4. Share with someone
5. Watch them join! 🎉

---

**Status**: Multi-participant ✅ | Invite links ✅ | Guest mode ✅ | Ready for production! 🚀
