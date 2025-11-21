/**
 * Meeting Processor Service
 * Traite les réunions terminées : extrait le transcript et génère le résumé
 */

import { getRoomTranscript, getRoomInfo, deleteRoom } from './dailyService';
import { generateMeetingSummary } from './geminiService';
import { updateAppointmentTranscript } from './firebaseService';
import { Appointment } from '../types';
import { format, parseISO, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Traite une réunion terminée :
 * 1. Récupère le transcript depuis Daily.co
 * 2. Génère un résumé avec Gemini
 * 3. Met à jour l'Appointment dans Firebase
 */
export const processCompletedMeeting = async (
  appointment: Appointment,
  lawyerName: string,
  clientName: string,
  lawyerId?: string,
  clientId?: string
): Promise<{ transcript: string; summary: string }> => {
  console.log(`🔄 Processing completed meeting: ${appointment.id}`);

  if (!appointment.dailyRoomId) {
    throw new Error('No Daily.co room ID found for this appointment');
  }

  let transcript = '';
  let summary = '';

  try {
    // 1. Récupérer le transcript depuis Daily.co
    // On passe la date et la durée pour filtrer uniquement les sessions avec les deux participants
    console.log(`📝 Fetching transcript for room: ${appointment.dailyRoomId}`);
    transcript = await getRoomTranscript(
      appointment.dailyRoomId,
      appointment.date, // Date du RDV pour filtrer
      appointment.duration // Durée pour calculer la fenêtre
    );

    if (!transcript || transcript.trim().length === 0) {
      console.warn('⚠️ No transcript available yet, will retry later');
      // Le transcript peut ne pas être disponible immédiatement après la fin
      // On retourne vide et on pourra réessayer plus tard
      return { transcript: '', summary: '' };
    }

    console.log(`✅ Transcript retrieved (${transcript.length} characters)`);

    // 2. Générer le résumé avec Gemini
    console.log(`🤖 Generating summary with Gemini...`);
    const appointmentDate = format(new Date(appointment.date), 'PPP', { locale: fr });
    
    summary = await generateMeetingSummary(
      transcript,
      lawyerName,
      clientName,
      appointmentDate
    );

    console.log(`✅ Summary generated (${summary.length} characters)`);

    // 3. Mettre à jour l'Appointment dans Firebase
    console.log(`💾 Saving transcript and summary to Firebase...`);
    await updateAppointmentTranscript(
      appointment.id,
      transcript,
      summary,
      new Date().toISOString() // meetingEndedAt
    );

    console.log(`✅ Meeting processing completed successfully`);

    // 4. Vérifier si on peut fermer la salle (si les deux participants sont sortis)
    // Attendre un peu pour laisser le temps aux participants de quitter
    setTimeout(async () => {
      try {
        await checkAndCloseRoomIfEmpty(appointment.dailyRoomId, appointment.date, appointment.duration);
      } catch (error) {
        console.error('❌ Error checking room status:', error);
        // Ne pas bloquer si la vérification échoue
      }
    }, 30000); // Attendre 30 secondes après la fin du traitement

    return { transcript, summary };
  } catch (error: any) {
    console.error('❌ Error processing meeting:', error);
    
    // Si le transcript n'est pas encore disponible, on ne considère pas ça comme une erreur fatale
    if (error.message?.includes('No transcript') || 
        error.message?.includes('No recordings') || 
        error.message?.includes('No transcripts found')) {
      console.log('ℹ️ Transcript not available yet, will be processed later');
      return { transcript: '', summary: '' };
    }
    
    throw error;
  }
};

/**
 * Vérifie et traite les réunions terminées qui n'ont pas encore de transcript
 * À appeler périodiquement (polling) ou via webhook
 */
export const checkAndProcessCompletedMeetings = async (
  appointments: Appointment[],
  getLawyerName: (lawyerId: string) => Promise<string>,
  getClientName: (clientId: string) => Promise<string>
): Promise<void> => {
  const now = new Date();
  
  // Filtrer les rendez-vous VIDEO terminés sans transcript
  const meetingsToProcess = appointments.filter((apt) => {
    if (apt.type !== 'VIDEO') return false;
    if (!apt.dailyRoomId) return false;
    if (apt.transcript) return false; // Déjà traité
    if (apt.status === 'CANCELLED') return false;
    
    const aptDate = new Date(apt.date);
    // Considérer comme terminé si la date est passée de plus de 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return aptDate < fiveMinutesAgo;
  });

  console.log(`🔍 Found ${meetingsToProcess.length} meetings to process`);

  for (const appointment of meetingsToProcess) {
    try {
      const lawyerName = await getLawyerName(appointment.lawyerId);
      const clientName = await getClientName(appointment.clientId);
      
      await processCompletedMeeting(appointment, lawyerName, clientName);
      
      // Attendre un peu entre chaque traitement pour éviter de surcharger les APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error processing appointment ${appointment.id}:`, error);
      // Continue avec les autres même si une échoue
    }
  }
};

/**
 * Vérifie si la salle Daily.co est vide et la ferme si c'est le cas
 * La salle est fermée si :
 * - La date du RDV est passée
 * - Les deux participants sont sortis (ou la salle est vide)
 */
export const checkAndCloseRoomIfEmpty = async (
  roomId: string,
  appointmentDate: string,
  durationMinutes: number
): Promise<void> => {
  try {
    console.log(`🔍 Checking if room ${roomId} can be closed...`);
    
    const appointmentEnd = addMinutes(parseISO(appointmentDate), durationMinutes);
    const now = new Date();
    
    // Ne fermer que si le RDV est terminé depuis au moins 5 minutes
    const fiveMinutesAfterEnd = addMinutes(appointmentEnd, 5);
    if (now < fiveMinutesAfterEnd) {
      console.log(`⏳ Appointment just ended, waiting before closing room...`);
      return;
    }
    
    // Vérifier l'état de la salle
    const roomInfo = await getRoomInfo(roomId);
    
    if (!roomInfo) {
      console.log(`ℹ️ Room ${roomId} already deleted or doesn't exist`);
      return;
    }
    
    // Vérifier si la salle a expiré (via la propriété exp)
    if (roomInfo.config?.exp) {
      const expirationTime = new Date(roomInfo.config.exp * 1000);
      if (now > expirationTime) {
        console.log(`⏰ Room ${roomId} has expired, deleting...`);
        await deleteRoom(roomId);
        return;
      }
    }
    
    // Si la salle existe encore et n'a pas expiré, on la laisse ouverte
    // Elle sera fermée automatiquement à l'expiration ou quand les participants quitteront
    console.log(`ℹ️ Room ${roomId} is still active, will be closed at expiration or when empty`);
    
  } catch (error) {
    console.error('❌ Error checking room status:', error);
    // Ne pas throw pour ne pas bloquer le processus
  }
};

