# 🧪 Testing Mode - Instant Video Call Join

## ⚠️ IMPORTANT: This is for TESTING ONLY

I've temporarily modified the `canJoinVideo` function to allow **immediate joining** of video calls after acceptance.

## 📝 What Changed

### Modified Files:
1. `pages/DashboardPage.tsx`
2. `pages/MyAppointmentsPage.tsx`

### Change:
```typescript
// BEFORE (Production logic):
const canJoinVideo = (appointment: Appointment) => {
  // Could only join 5 minutes before → 1 hour after
  const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
  const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
  return now >= canJoinBefore && now <= canJoinAfter;
};

// AFTER (Testing mode):
const canJoinVideo = (appointment: Appointment) => {
  if (appointment.status !== 'CONFIRMED') return false;
  return true; // Can join immediately!
};
```

## 🧪 How to Test

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Create a test appointment**:
   - Go to a lawyer profile
   - Book a VIDEO consultation (any future date)
   - Accept the appointment (as lawyer)

3. **Join immediately**:
   - Click "Rejoindre la visio" button
   - Should appear right away (no waiting!)
   - Test the new Daily.js video system

## ✅ Testing Checklist

- [ ] Book appointment
- [ ] Accept appointment
- [ ] See "Rejoindre la visio" button immediately
- [ ] Click and join the call
- [ ] Test microphone toggle
- [ ] Test camera toggle
- [ ] Test screen share
- [ ] Verify French transcription (lawyers only)
- [ ] Leave call successfully
- [ ] Check meeting processed after leaving

## 🔄 Reverting to Production Mode

When you're done testing and want the **5-minute window** back:

### Option 1: Quick Revert
In both files, change:
```typescript
// FOR TESTING: Allow immediate join after acceptance
// Remove this in production and uncomment the time-based logic below
return true;
```

To:
```typescript
return false; // Disable testing mode
```

Then uncomment the production logic:
```typescript
// PRODUCTION VERSION (uncomment when ready):
const aptDate = parseISO(appointment.date);
const now = new Date();
const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
return now >= canJoinBefore && now <= canJoinAfter;
```

### Option 2: Replace Entire Function

#### DashboardPage.tsx (line ~117):
```typescript
const canJoinVideo = (appointment: Appointment) => {
  if (appointment.type !== "VIDEO") return false;
  if (appointment.status === "CANCELLED") return false;
  const aptDate = parseISO(appointment.date);
  const now = new Date();
  const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
  const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
  return now >= canJoinBefore && now <= canJoinAfter;
};
```

#### MyAppointmentsPage.tsx (line ~161):
```typescript
const canJoinVideo = (appointment: Appointment) => {
  if (appointment.type !== 'VIDEO') return false;
  if (appointment.status === 'CANCELLED') return false;
  const aptDate = parseISO(appointment.date);
  const now = new Date();
  const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
  const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
  return now >= canJoinBefore && now <= canJoinAfter;
};
```

## 📊 Production vs Testing

| Mode | When Can Join | Use Case |
|------|---------------|----------|
| **Testing** | Immediately after acceptance | Testing video system |
| **Production** | 5 min before → 1h after | Real appointments |

## 🎯 Current Status

- ✅ **Testing Mode Active**
- ✅ Can join immediately after acceptance
- ✅ Perfect for testing the new Daily.js system

## 🚀 What to Test

### Core Functionality
- [ ] Video connection works
- [ ] Audio works (mute/unmute)
- [ ] Video works (camera on/off)
- [ ] Screen share works
- [ ] Custom UI looks good
- [ ] Brand colors match

### French Transcription
- [ ] Lawyer sees transcription indicator
- [ ] Red pulsing badge appears
- [ ] "Transcription en cours (FR)" text shows
- [ ] After call, transcript saved to Firebase

### UI/UX
- [ ] Controls are responsive
- [ ] Tooltips show on hover
- [ ] Grid layout adjusts for participants
- [ ] Screen share layout switches correctly
- [ ] Leave button works
- [ ] Redirect to appointments after leaving

### Mobile
- [ ] Responsive on mobile
- [ ] Touch controls work
- [ ] Portrait/landscape modes work

## 💡 Tips

1. **Use two browsers** to test as lawyer + client
2. **Check console** (F12) for logs
3. **Verify transcription** in Firebase after call
4. **Test screen share** (desktop only)

## ⏰ Remember

**Before going to production**, revert to the time-based logic so users can only join:
- **5 minutes before** appointment time
- **Up to 1 hour after** appointment time

This prevents premature joining and server costs for meetings far in the future.

---

**Testing Mode Enabled**: ✅  
**Status**: Ready to test!  
**Revert Instructions**: See above ⬆️
