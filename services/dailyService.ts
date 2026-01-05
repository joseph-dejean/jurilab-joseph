/**
 * Daily.co Service
 * Gère les interactions avec l'API Daily.co pour les visioconférences
 */

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY || '';
const DAILY_API_BASE_URL = 'https://api.daily.co/v1';

// Debug log (remove in production)
if (typeof window !== 'undefined') {
  console.log('🔧 Daily.co API Key loaded:', DAILY_API_KEY ? '✅ Yes' : '❌ No');
}

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  config: {
    max_participants?: number;
    nbf?: number; // Not before (timestamp)
    exp?: number; // Expiration (timestamp)
    enable_recording?: boolean;
    enable_transcription?: boolean;
  };
  created_at: string;
}

interface DailyToken {
  token: string;
  room: string;
}

interface DailyTranscript {
  transcript: string;
  session_id: string;
}

/**
 * Crée une salle de visioconférence Daily.co
 */
export const createRoom = async (
  appointmentId: string,
  lawyerName: string,
  clientName: string,
  durationMinutes: number = 60
): Promise<{ roomUrl: string; roomId: string }> => {
  if (!DAILY_API_KEY) {
    throw new Error('VITE_DAILY_API_KEY is not configured');
  }

  try {
    const roomName = `jurilab-${appointmentId}-${Date.now()}`;

    // Calculer l'expiration (maintenant + durée du RDV + 1h de marge)
    const expirationTime = Math.floor(Date.now() / 1000) + (durationMinutes * 60) + 3600;

    const response = await fetch(`${DAILY_API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          // Transcription uniquement (pas d'enregistrement vidéo/audio)
          enable_transcription: true, // Transcription en temps réel (pay-as-you-go, 0.0059$/min/participant)
          enable_screenshare: true,
          enable_chat: true,
          exp: expirationTime, // Expiration de la salle
          max_participants: 2, // Avocat + Client
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Daily.co API Error:', error);
      throw new Error(`Failed to create Daily.co room: ${response.status} ${error}`);
    }

    const room: DailyRoom = await response.json();

    console.log(`✅ Daily.co room created: ${room.id}`);

    return {
      roomUrl: room.url,
      roomId: room.id,
    };
  } catch (error) {
    console.error('❌ Error creating Daily.co room:', error);
    throw error;
  }
};

/**
 * Génère un token d'accès pour rejoindre une salle Daily.co
 */
export const generateToken = async (
  roomId: string,
  userId: string,
  userName: string,
  isOwner: boolean = false
): Promise<string> => {
  if (!DAILY_API_KEY) {
    throw new Error('VITE_DAILY_API_KEY is not configured');
  }

  try {
    // Calculer l'expiration du token (24h)
    const expirationTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const response = await fetch(`${DAILY_API_BASE_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomId,
          user_id: userId,
          user_name: userName,
          is_owner: isOwner,
          exp: expirationTime,
          // Auto-start transcription if owner joins
          ...(isOwner ? { start_transcription: true } : {}),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Daily.co Token Error:', error);
      throw new Error(`Failed to generate Daily.co token: ${response.status} ${error}`);
    }

    const tokenData: DailyToken = await response.json();

    console.log(`✅ Daily.co token generated for user: ${userName}`);

    return tokenData.token;
  } catch (error) {
    console.error('❌ Error generating Daily.co token:', error);
    throw error;
  }
};

/**
 * Récupère le transcript d'une réunion Daily.co
 * 
 * IMPORTANT : Cette fonction récupère les transcripts depuis l'API de transcription de Daily.co.
 * L'enregistrement vidéo/audio n'est PAS nécessaire - seule la transcription est activée.
 * 
 * Comportement :
 * - Récupère les transcripts directement depuis l'API de transcription
 * - Filtre ceux qui sont dans la fenêtre du RDV (optionnel)
 * - Combine tous les transcripts pertinents par ordre chronologique
 * - Ne considère que les sessions où les deux participants sont présents
 */
export const getRoomTranscript = async (
  roomId: string,
  appointmentDate?: string, // Date ISO du RDV pour filtrer
  durationMinutes?: number // Durée du RDV en minutes
): Promise<string> => {
  if (!DAILY_API_KEY) {
    throw new Error('VITE_DAILY_API_KEY is not configured');
  }

  try {
    console.log(`📝 Fetching transcript for room: ${roomId} (transcription only, no recording)`);

    // Récupérer les transcripts depuis l'API de transcription de Daily.co
    const transcriptResponse = await fetch(`${DAILY_API_BASE_URL}/transcript?room_name=${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!transcriptResponse.ok) {
      if (transcriptResponse.status === 404) {
        console.warn('⚠️ No transcripts found for room:', roomId);
        console.warn('ℹ️ This might mean the meeting has not ended yet or transcription is still processing');
        return '';
      }
      const error = await transcriptResponse.text();
      console.error('❌ Daily.co Transcript API Error:', error);
      throw new Error(`Failed to get transcript: ${transcriptResponse.status} ${error}`);
    }

    const transcriptData = await transcriptResponse.json();

    if (!transcriptData.data || transcriptData.data.length === 0) {
      console.warn('⚠️ No transcripts found in API response');
      return '';
    }

    console.log(`📝 Found ${transcriptData.data.length} transcript session(s) for room: ${roomId}`);

    // Filtrer les transcripts pertinents si une date de RDV est fournie
    let relevantTranscripts = transcriptData.data;

    if (appointmentDate && durationMinutes) {
      const appointmentStart = new Date(appointmentDate);
      // Fenêtre : 15 minutes avant → durée du RDV + 1h après
      const windowStart = new Date(appointmentStart.getTime() - 15 * 60 * 1000);
      const windowEnd = new Date(appointmentStart.getTime() + (durationMinutes * 60 * 1000) + (60 * 60 * 1000));

      relevantTranscripts = transcriptData.data.filter((transcript: any) => {
        if (!transcript.start_ts) return false;
        const transcriptStart = new Date(transcript.start_ts * 1000);
        return transcriptStart >= windowStart && transcriptStart <= windowEnd;
      });

      console.log(`📅 Filtered to ${relevantTranscripts.length} transcript(s) within appointment window`);
    }

    if (relevantTranscripts.length === 0) {
      console.warn('⚠️ No transcripts found within appointment window');
      return '';
    }

    // Filtrer les transcripts où les DEUX participants sont présents
    // Daily.co stocke généralement le nombre de participants dans les métadonnées
    const transcriptsWithBothParticipants: any[] = [];

    for (const transcript of relevantTranscripts) {
      const participantCount = transcript.participants_count ||
        (transcript.participants && transcript.participants.length) ||
        0;

      const duration = transcript.duration || 0; // en secondes

      // Critères : au moins 2 participants OU durée significative (> 30s)
      const hasMultipleParticipants = participantCount >= 2;
      const hasSignificantDuration = duration > 30;

      if (hasMultipleParticipants || hasSignificantDuration) {
        transcriptsWithBothParticipants.push(transcript);
        console.log(`✅ Transcript ${transcript.id}: ${participantCount} participant(s), ${duration}s duration - INCLUDED`);
      } else {
        console.log(`⚠️ Transcript ${transcript.id}: ${participantCount} participant(s), ${duration}s duration - EXCLUDED (single participant or too short)`);
      }
    }

    if (transcriptsWithBothParticipants.length === 0) {
      console.warn('⚠️ No transcripts found with both participants present');
      return '';
    }

    console.log(`👥 Filtered to ${transcriptsWithBothParticipants.length} transcript(s) with both participants`);

    // Trier par date de début (plus ancien en premier)
    transcriptsWithBothParticipants.sort((a: any, b: any) => {
      const timeA = a.start_ts || 0;
      const timeB = b.start_ts || 0;
      return timeA - timeB;
    });

    // Extraire et combiner tous les transcripts
    const combinedTranscripts: string[] = [];

    for (const transcript of transcriptsWithBothParticipants) {
      // Le transcript peut être dans différents formats selon l'API Daily.co
      let transcriptText = '';

      if (transcript.transcript) {
        // Format texte direct
        transcriptText = transcript.transcript;
      } else if (transcript.text) {
        // Format alternatif
        transcriptText = transcript.text;
      } else if (transcript.vtt_url) {
        // Format WebVTT - on pourrait parser le VTT, mais pour l'instant on note juste l'URL
        console.warn(`⚠️ Transcript ${transcript.id} is in WebVTT format (${transcript.vtt_url}), skipping for now`);
        continue;
      }

      if (transcriptText && transcriptText.trim().length > 0) {
        // Ajouter un séparateur avec timestamp si disponible
        const timestamp = transcript.start_ts
          ? new Date(transcript.start_ts * 1000).toLocaleString('fr-FR')
          : 'Session';

        combinedTranscripts.push(`\n--- ${timestamp} ---\n${transcriptText}`);
      }
    }

    if (combinedTranscripts.length === 0) {
      console.warn('⚠️ No transcript text found in transcripts');
      return '';
    }

    // Combiner tous les transcripts
    const combinedTranscript = combinedTranscripts.join('\n\n');
    console.log(`✅ Combined transcript from ${combinedTranscripts.length} session(s) (${combinedTranscript.length} characters)`);

    return combinedTranscript;
  } catch (error) {
    console.error('❌ Error getting Daily.co transcript:', error);
    throw error;
  }
};

/**
 * Vérifie si une salle existe
 */
export const getRoomInfo = async (roomId: string): Promise<DailyRoom | null> => {
  if (!DAILY_API_KEY) {
    throw new Error('VITE_DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${DAILY_API_BASE_URL}/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get room info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error getting room info:', error);
    throw error;
  }
};

/**
 * Supprime une salle Daily.co (nettoyage)
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
  if (!DAILY_API_KEY) {
    throw new Error('VITE_DAILY_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${DAILY_API_BASE_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete room: ${response.status} ${error}`);
    }

    console.log(`✅ Daily.co room deleted: ${roomId}`);
  } catch (error) {
    console.error('❌ Error deleting Daily.co room:', error);
    throw error;
  }
};

