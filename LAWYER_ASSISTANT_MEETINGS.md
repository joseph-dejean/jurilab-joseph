# Lawyer Workspace Assistant - Meetings Context Feature

## Overview

The Lawyer's Workspace Assistant (in the dashboard) has been enhanced to provide intelligent information about the lawyer's meetings and appointments. The assistant now acts as both a legal expert AND a personal executive assistant.

## Where is it?

**Location**: Dashboard → Lawyer Workstation (right side panel)

This is NOT the public chatbot (floating button on homepage). This is the **lawyer's private assistant** in their dashboard.

## Features

### Intelligent Meeting Awareness

The assistant now has access to:
- **Lawyer's name and current date/time**
- **Upcoming meetings** (next 10 appointments):
  - Date and time (formatted in French)
  - Client name
  - Meeting type (Video, Phone, In-person)
  - Status (Confirmed, Pending, etc.)
  - Duration
  - Notes
- **Recent meeting history** (last 5 appointments)

### Dual-Purpose Capabilities

1. **Executive Assistant**
   - "Quel est mon prochain rendez-vous ?"
   - "Quels sont mes rendez-vous cette semaine ?"
   - "Avec qui ai-je rendez-vous demain ?"
   - "Est-ce que j'ai des rendez-vous aujourd'hui ?"
   - "Résume mes prochains rendez-vous"

2. **Legal Expert** (still works!)
   - "Qu'est-ce qu'un contrat de travail ?"
   - "Expliquez-moi le droit de la propriété"
   - Legal research with Légifrance references

## Implementation Details

### Frontend Changes

#### 1. WorkspaceAssistantV2.tsx

**Added:**
- `useMemo` hook to prepare meetings context
- Filters appointments for the logged-in lawyer
- Separates upcoming meetings from historical meetings
- Formats dates in French
- Passes appointments data to backend via `contextData`

```typescript
const meetingsContext = useMemo(() => {
  // Filter appointments for the lawyer
  const lawyerAppointments = appointments.filter((apt) => 
    apt.lawyerId === currentUser.id
  );

  // Get upcoming meetings
  const upcomingMeetings = lawyerAppointments
    .filter((apt) => {
      const aptDate = parseISO(apt.date);
      return apt.status !== 'CANCELLED' && (isFuture(aptDate) || isToday(aptDate));
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 10);

  return {
    userName: currentUser.name,
    currentTime: new Date().toISOString(),
    upcomingMeetings: [...],
    allMeetings: [...]
  };
}, [currentUser, appointments]);
```

#### 2. backendService.ts

**Updated:**
- `sendMessageStream` function signature to accept appointments in `contextData`

### Backend Changes

#### 1. backend/src/routes/chat.ts

**Updated:**
- `SendMessageSchema` validation to accept appointments in contextData

```typescript
contextData: z.object({
  userName: z.string().optional(),
  currentTime: z.string().optional(),
  appointments: z.object({
    upcoming: z.array(z.any()).optional(),
    recent: z.array(z.any()).optional(),
  }).optional(),
}).optional(),
```

#### 2. backend/src/services/geminiService.ts

**Enhanced:**
- `streamChat` function to build rich context with meetings
- System instruction now includes meeting information
- Formats meetings in a clear structure for AI

```typescript
CONTEXTE ADMINISTRATIF (Données Réelles du Cabinet) :
- Avocat connecté : ${contextData.userName}
- Date et Heure actuelles : ${contextData.currentTime}
  
AGENDA (Prochains Rendez-vous) :
1. lundi 3 février 2026 à 14:00
   - Client : Marie Dupont
   - Type : Visioconférence
   - Durée : 60 minutes
   - Statut : Confirmé
   - Notes : Consultation droit commercial
...

INSTRUCTIONS SPÉCIFIQUES "ASSISTANT EXÉCUTIF" :
- Tu as accès à l'agenda réel de l'avocat ci-dessus.
- Si l'utilisateur demande "mon prochain rdv", utilise les données pour répondre.
- Tu restes AUSSI un expert juridique avec références Légifrance.
```

## Files Modified

1. ✅ `components/WorkspaceAssistantV2.tsx` - Added meetings context
2. ✅ `services/backendService.ts` - Updated to send appointments
3. ✅ `backend/src/routes/chat.ts` - Updated validation schema
4. ✅ `backend/src/services/geminiService.ts` - Enhanced AI context

## Files Reverted

1. ✅ `components/LegalChatbot.tsx` - Reverted to original (no meetings)
2. ✅ `services/geminiService.ts` - Reverted to original (no meetings)

## Testing

### Start Both Servers

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev
```

### Test Steps

1. **Log in as a lawyer** with appointments
2. **Go to Dashboard**
3. **Look at the right panel** (Lawyer Workstation)
4. **Ask about meetings:**
   - "Quel est mon prochain rendez-vous ?"
   - "Résume mes rendez-vous de la semaine"
   - "Ai-je des rendez-vous aujourd'hui ?"
5. **Test legal queries:**
   - "Qu'est-ce qu'un contrat de travail ?"
6. **Verify responses** include accurate meeting information

### Expected Response Example

**Query:** "Quel est mon prochain rendez-vous ?"

**Response:**
```
Votre prochain rendez-vous est prévu le lundi 3 février 2026 à 14:00.

📅 Détails :
- Client : Marie Dupont
- Type : Visioconférence
- Durée : 60 minutes
- Statut : Confirmé
- Objet : Consultation concernant un litige commercial

Je vous rappelle que vous avez également d'autres rendez-vous prévus cette semaine...
```

## Key Features

### Performance
- ✅ `useMemo` for optimized context calculation
- ✅ Limited to 10 upcoming + 5 recent meetings
- ✅ No impact on conversation history

### Data Privacy
- ⚠️ Meeting notes are included (be mindful of sensitive info)
- ⚠️ Data is sent to Gemini AI backend
- ✅ Only lawyer can see their own appointments

### Backward Compatibility
- ✅ Public chatbot unchanged
- ✅ Legal queries work as before
- ✅ Conversations still persist in backend

## Architecture

```
Lawyer Dashboard
    ↓
LawyerWorkstation Component
    ↓
WorkspaceAssistantV2
    ↓ (prepares meetingsContext)
    ↓
Backend API (POST /api/chat/send)
    ↓ (with appointments in contextData)
    ↓
Gemini AI Service
    ↓ (with enhanced system instruction)
    ↓
Streams response back to frontend
```

## Troubleshooting

### Assistant doesn't show meetings

1. **Check backend is running**: `http://localhost:3001/health`
2. **Check user is logged in** as a lawyer
3. **Check appointments exist** in Firebase
4. **Check browser console** for errors
5. **Verify `contextData`** is being sent (Network tab)

### Backend errors

1. **Check backend logs** in terminal
2. **Verify Gemini API key** in backend `.env`
3. **Check validation errors** in response

### Dates not formatted correctly

1. **Verify appointment dates** are valid ISO strings in Firebase
2. **Check date-fns** is installed in frontend

## Future Enhancements

Potential improvements:
- Meeting reminders before appointments
- Ability to create/reschedule meetings via chat
- Integration with meeting transcripts
- Smart suggestions based on meeting history
- Conflict detection for scheduling

## Dependencies

No new dependencies added. Uses existing:
- `date-fns` (already in project)
- `date-fns/locale` for French formatting
- Backend API communication

---

**Status**: ✅ Ready for testing  
**Build**: ✅ Verified  
**Backend**: ⚠️ Requires backend server running  
**Location**: Dashboard → Lawyer Workstation (right panel)
