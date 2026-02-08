# 🎥 Video Call System - Daily.js Integration

## 📋 Overview

Professional video conferencing system built with **Daily.js** for Jurilab's lawyer-client consultations. Features include:

- ✅ **Custom branded UI** matching the webapp theme
- ✅ **French transcription** (automatic, real-time)
- ✅ **Screen sharing** with dedicated layout
- ✅ **Network quality monitoring**
- ✅ **Professional controls** (mute, camera, screen share)
- ✅ **Automatic meeting processing** with AI summaries
- ✅ **Responsive design** (mobile-friendly)
- ✅ **Dark mode** support

## 🏗️ Architecture

### New Implementation (Daily.js SDK)

```
VideoCallPage.tsx (Main Component)
├─ Daily.js Call Object (programmatic control)
├─ CallHeader (meeting info, timer, stats)
├─ VideoTile (custom video rendering)
│  ├─ Video/Audio tracks
│  ├─ Connection quality
│  └─ Participant info
├─ ControlsBar (mic, camera, screen share, leave)
└─ Event Listeners (joined, left, track updates)
```

### Components

#### 1. **VideoCallPage.tsx** (Main)
- Daily.js call object management
- Event handling (join, leave, participants)
- French transcription control
- Meeting lifecycle management
- State management (muted, video, screen share)

#### 2. **VideoTile.tsx**
- Renders individual participant video
- Shows avatar when video is off
- Displays participant name and status
- Audio/video mute indicators
- Connection quality badge

#### 3. **ControlsBar.tsx**
- Mic toggle with visual feedback
- Camera toggle
- Screen share control
- Leave call button (prominent)
- Tooltips on hover
- Responsive layout

#### 4. **CallHeader.tsx**
- Meeting title
- Call duration timer
- Participant count
- Connection quality indicator
- Jurilab branding

## 🚀 Key Features

### 1. French Transcription (Automatic)

```typescript
await callObject.startTranscription({
  language: 'fr',           // French language
  model: 'nova-2-general',  // Best for French
  tier: 'premium'           // High quality
});
```

- Starts automatically when lawyer joins
- Real-time transcription
- Indicator shows when active
- Processed after call ends

### 2. Custom Branded UI

All components use your design system:
- **Colors**: `brand-DEFAULT`, `slate-900`, `slate-700`
- **Typography**: Tailwind font system
- **Animations**: Smooth transitions
- **Dark mode**: Full support

### 3. Screen Share Layout

- **Main view**: Screen share (large)
- **Sidebar**: Participant thumbnails (small)
- **Auto-switch**: Returns to grid when sharing stops

### 4. Network Quality

- Real-time connection monitoring
- Visual indicators (green/yellow/red)
- Quality text labels
- Automatic quality adjustment

### 5. Participant Management

- Local participant (marked "Vous")
- Remote participants
- Screen share participant (separate)
- Dynamic grid layout (1-4 participants)

## 📁 File Structure

```
pages/
└─ VideoCallPage.tsx          # Main call page

components/video-call/
├─ VideoTile.tsx              # Video rendering component
├─ ControlsBar.tsx            # Call controls UI
└─ CallHeader.tsx             # Header with stats

services/
├─ dailyService.ts            # Updated with French transcription
├─ meetingProcessor.ts        # AI summary generation
└─ geminiService.ts           # Gemini AI integration
```

## 🔧 Configuration

### Environment Variables (.env)

```env
VITE_DAILY_API_KEY=8cf8bf6faacf005f7909e680f4e5973e8a97c76fc611f0656cf806391c712e9d
VITE_GEMINI_API_KEY=your_gemini_key
```

### Room Settings (dailyService.ts)

```typescript
properties: {
  enable_transcription: true,    // Enable transcription
  enable_screenshare: true,      // Allow screen sharing
  enable_chat: true,             // Enable chat (future)
  enable_prejoin_ui: false,      // Custom prejoin
  enable_network_ui: true,       // Show network quality
  enable_people_ui: false,       // Custom participant UI
  max_participants: 2,           // Lawyer + Client
  lang: 'fr',                    // French language
}
```

## 🎨 UI Design

### Color Scheme

- **Background**: `bg-slate-900` (dark)
- **Cards**: `bg-slate-800` (slightly lighter)
- **Borders**: `border-slate-700` (subtle)
- **Primary**: `bg-brand-DEFAULT` (your brand color)
- **Danger**: `bg-red-600` (mute, leave)
- **Success**: `bg-green-500` (quality indicators)

### Layout

```
┌─────────────────────────────────────────┐
│ CallHeader (stats, timer, quality)      │
├─────────────────────────────────────────┤
│                                          │
│                                          │
│         Video Grid (1-4 tiles)          │
│         or                               │
│         Screen Share Layout              │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│ ControlsBar (mic, cam, share, leave)    │
└─────────────────────────────────────────┘
```

## 🔄 Call Flow

### 1. Joining

```
User clicks "Rejoindre la visio"
  ↓
Extract roomUrl & appointmentId from URL
  ↓
Generate Daily token (with user info)
  ↓
Create Daily call object
  ↓
Set up event listeners
  ↓
Join call
  ↓
Start French transcription (if lawyer)
  ↓
Show video UI
```

### 2. During Call

- Real-time participant updates
- Track started/stopped events
- Audio/video state management
- Screen share handling
- Connection quality monitoring

### 3. Leaving

```
User clicks "Quitter" or leaves
  ↓
Trigger leave event
  ↓
Process meeting transcript (background)
  ↓
Generate AI summary with Gemini
  ↓
Save to Firebase
  ↓
Redirect to /my-appointments
```

## 📊 State Management

### Call States

- `idle`: Initial state
- `joining`: Connecting to call
- `joined`: Successfully in call
- `left`: Left the call
- `error`: Error occurred

### UI States

- `isMuted`: Microphone muted/unmuted
- `isVideoOff`: Camera on/off
- `isScreenSharing`: Screen sharing active
- `transcriptionActive`: Transcription running

### Participants State

```typescript
{
  [sessionId]: DailyParticipant {
    user_id: string,
    user_name: string,
    local: boolean,
    audio: boolean,
    video: boolean,
    screen: boolean,
    tracks: {
      video: MediaStreamTrack,
      audio: MediaStreamTrack,
      screenVideo: MediaStreamTrack
    }
  }
}
```

## 🎯 Improvements Over Old System

| Feature | Old (Iframe) | New (Daily.js) |
|---------|-------------|----------------|
| **Control** | ❌ Limited | ✅ Full programmatic |
| **UI** | ❌ Basic iframe | ✅ Custom branded |
| **Transcription** | ⚠️ Basic | ✅ French, premium |
| **Events** | ❌ PostMessage | ✅ Native SDK events |
| **Screen Share** | ⚠️ Basic | ✅ Custom layout |
| **Quality** | ❌ No control | ✅ Monitoring & control |
| **Branding** | ❌ Daily branding | ✅ Jurilab branding |
| **Mobile** | ⚠️ Limited | ✅ Responsive |

## 🐛 Troubleshooting

### Camera/Mic not working

1. Check browser permissions
2. Verify HTTPS connection
3. Check Daily.co API key
4. Look for errors in console

### Transcription not starting

- Only starts when lawyer joins
- Check console for "Transcription started"
- Verify `enable_transcription: true` in room config
- Check Daily.co account has transcription enabled

### Video not rendering

1. Check participant has video track
2. Verify `tracks.video.state === 'playable'`
3. Check for WebRTC errors
4. Ensure browser supports WebRTC

### Can't join meeting

1. Verify roomUrl is valid
2. Check token generation
3. Verify Daily API key
4. Check room hasn't expired

## 📱 Mobile Support

- Responsive grid layout
- Touch-friendly controls
- Optimized for portrait/landscape
- Native iOS/Android permissions

## 🔐 Security

- **HTTPS only** (required by WebRTC)
- **Token-based authentication**
- **Private rooms** (not discoverable)
- **Auto-expiration** (rooms expire after meeting)
- **Participant validation**

## 🚀 Performance

- **Lazy loading** (Daily.js loaded on demand)
- **Efficient rendering** (only render visible participants)
- **Network adaptation** (quality adjusts to bandwidth)
- **Cleanup on unmount** (destroy call object)

## 📈 Future Enhancements

- [ ] Pre-call device testing
- [ ] Virtual backgrounds
- [ ] Blur background
- [ ] Waiting room UI
- [ ] In-call chat panel
- [ ] Recording controls
- [ ] Participant hand raising
- [ ] Emoji reactions
- [ ] Network stats display
- [ ] Audio level visualization

## 🧪 Testing

### Manual Testing Checklist

- [ ] Join call successfully
- [ ] See local video
- [ ] See remote participant
- [ ] Toggle microphone works
- [ ] Toggle camera works
- [ ] Screen share works
- [ ] Screen share layout correct
- [ ] Leave call works
- [ ] Transcription starts (lawyer)
- [ ] Meeting processed after end
- [ ] Redirect to appointments

### Test URLs

```
# Local development
http://localhost:5173/video-call?roomUrl=https://jurilab.daily.co/test-room&appointmentId=apt_123

# Production
https://yourdomain.com/video-call?roomUrl=...&appointmentId=...
```

## 📚 Resources

- [Daily.js Documentation](https://docs.daily.co/reference/daily-js)
- [Daily React Hooks](https://docs.daily.co/reference/daily-react)
- [Transcription API](https://docs.daily.co/reference/rest-api/transcription)
- [Daily Dashboard](https://dashboard.daily.co/)

---

**Built with ❤️ for Jurilab**
