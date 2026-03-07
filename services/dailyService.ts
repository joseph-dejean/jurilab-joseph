/**
 * Daily.co Service
 * All Daily.co API calls are proxied through the FastAPI backend at /api/v1/daily/
 * The Daily.co API key is stored server-side only — never in the browser bundle.
 */

const BASE = '/api/v1/daily';

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  config: {
    max_participants?: number;
    nbf?: number;
    exp?: number;
    enable_recording?: boolean;
    enable_transcription?: boolean;
  };
  created_at: string;
}

/**
 * Creates a Daily.co video conference room
 */
export const createRoom = async (
  appointmentId: string,
  lawyerName: string,
  clientName: string,
  durationMinutes: number = 60,
  maxParticipants: number = 10
): Promise<{ roomUrl: string; roomId: string }> => {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointmentId, lawyerName, clientName, durationMinutes, maxParticipants }),
  });

  if (!res.ok) throw new Error(`Failed to create room: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log(`✅ Daily.co room created: ${data.roomId}`);
  return { roomUrl: data.roomUrl, roomId: data.roomId };
};

/**
 * Generates an access token for an authenticated user
 */
export const generateToken = async (
  roomId: string,
  userId: string,
  userName: string,
  isOwner: boolean = false
): Promise<string> => {
  const res = await fetch(`${BASE}/meeting-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, userId, userName, isOwner }),
  });

  if (!res.ok) throw new Error(`Failed to generate token: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log(`✅ Daily.co token generated for user: ${userName}`);
  return data.token;
};

/**
 * Generates a guest token for external participants
 */
export const generateGuestToken = async (
  roomId: string,
  guestName: string = 'Invité'
): Promise<string> => {
  const res = await fetch(`${BASE}/meeting-tokens/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, guestName }),
  });

  if (!res.ok) throw new Error(`Failed to generate guest token: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  console.log(`✅ Daily.co guest token generated for: ${guestName}`);
  return data.token;
};

/**
 * Fetches the transcript for a completed Daily.co meeting.
 * Returns an empty string if the transcript is not yet available.
 */
export const getRoomTranscript = async (
  roomId: string,
  appointmentDate?: string,
  durationMinutes?: number
): Promise<string> => {
  const params = new URLSearchParams({ room_id: roomId });
  if (appointmentDate) params.set('appointment_date', appointmentDate);
  if (durationMinutes !== undefined) params.set('duration_minutes', String(durationMinutes));

  console.log(`📝 Fetching transcript for room: ${roomId}`);

  const res = await fetch(`${BASE}/transcript?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    console.warn(`⚠️ Transcript fetch returned ${res.status}`);
    return '';
  }

  const data = await res.json();
  if (!data.ready || !data.transcript) {
    console.warn(`⏳ Transcript not ready yet for room: ${roomId}`);
    return '';
  }

  console.log(`✅ Transcript received (${data.transcript.length} chars)`);
  return data.transcript;
};

/**
 * Checks room info (used before deleting a room)
 */
export const getRoomInfo = async (roomId: string): Promise<DailyRoom | null> => {
  const res = await fetch(`${BASE}/rooms/${roomId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.room ?? null;
};

/**
 * Deletes a Daily.co room
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  const res = await fetch(`${BASE}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete room: ${res.status}`);
  }

  console.log(`✅ Daily.co room deleted: ${roomId}`);
};
