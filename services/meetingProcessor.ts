/**
 * Meeting Processor Service
 * Traite les réunions terminées : extrait le transcript et génère le résumé
 * 
 * NOUVEAU: Système de retry intelligent
 * - Essaye immédiatement après l'appel
 * - Réessaye toutes les 2 minutes pendant 20 minutes
 * - Affiche la progression à l'utilisateur
 */

import { getRoomTranscript, getRoomInfo, deleteRoom } from './dailyService';
import { generateMeetingSummary } from './geminiService';
import { updateAppointmentTranscript } from './firebaseService';
import { Appointment } from '../types';
import { format, parseISO, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour le callback de progression
export interface TranscriptFetchProgress {
  attempt: number;
  maxAttempts: number;
  nextRetryIn?: number; // secondes
  estimatedReadyTime?: string; // "~5 minutes", "~10 minutes"
  status: 'fetching' | 'processing' | 'ready' | 'unavailable';
}

/**
 * Traite une réunion terminée AVEC RETRY AUTOMATIQUE
 * 
 * @param appointment - Rendez-vous à traiter
 * @param lawyerName - Nom de l'avocat
 * @param clientName - Nom du client
 * @param lawyerId - ID de l'avocat (optionnel)
 * @param clientId - ID du client (optionnel)
 * @param onProgress - Callback pour afficher la progression
 * @param maxAttempts - Nombre maximum de tentatives (défaut: 10 = 20 minutes)
 * @param retryIntervalMs - Délai entre les tentatives (défaut: 2 minutes)
 */
export const processCompletedMeeting = async (
  appointment: Appointment,
  lawyerName: string,
  clientName: string,
  lawyerId?: string,
  clientId?: string,
  onProgress?: (progress: TranscriptFetchProgress) => void,
  maxAttempts: number = 10, // 10 tentatives = 20 minutes
  retryIntervalMs: number = 120000 // 2 minutes entre les tentatives
): Promise<{ transcript: string; summary: string }> => {
  console.log(`🔄 Processing completed meeting: ${appointment.id}`);

  if (!appointment.dailyRoomId) {
    throw new Error('No Daily.co room ID found for this appointment');
  }

  let transcript = '';
  let summary = '';
  let attempt = 1;

  // Boucle de retry
  while (attempt <= maxAttempts) {
    try {
      // Notifier la progression
      if (onProgress) {
        const minutesElapsed = (attempt - 1) * (retryIntervalMs / 60000);
        const estimatedMinutes = Math.max(5, 15 - minutesElapsed); // Daily.co dit 15 min max
        
        onProgress({
          attempt,
          maxAttempts,
          nextRetryIn: attempt < maxAttempts ? retryIntervalMs / 1000 : undefined,
          estimatedReadyTime: estimatedMinutes > 1 ? `~${Math.ceil(estimatedMinutes)} minutes` : '~1 minute',
          status: 'fetching'
        });
      }

      console.log(`📝 Fetching transcript (attempt ${attempt}/${maxAttempts}) for room: ${appointment.dailyRoomId}`);
      
      // 1. Récupérer le transcript depuis Daily.co
      transcript = await getRoomTranscript(
        appointment.dailyRoomId,
        appointment.date,
        appointment.duration
      );

      // Transcript trouvé !
      if (transcript && transcript.trim().length > 0) {
        console.log(`✅ Transcript retrieved (${transcript.length} characters)`);
        
        // Notifier: en cours de traitement
        if (onProgress) {
          onProgress({
            attempt,
            maxAttempts,
            status: 'processing'
          });
        }

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
          new Date().toISOString()
        );

        // Notifier: prêt !
        if (onProgress) {
          onProgress({
            attempt,
            maxAttempts,
            status: 'ready'
          });
        }

        console.log(`✅ Meeting processing completed successfully`);

        // 4. Fermer la salle après un délai
        setTimeout(async () => {
          try {
            await checkAndCloseRoomIfEmpty(appointment.dailyRoomId, appointment.date, appointment.duration);
          } catch (error) {
            console.error('❌ Error checking room status:', error);
          }
        }, 30000);

        return { transcript, summary };
      }

      // Transcript pas encore disponible
      console.warn(`⏳ Transcript not ready yet (attempt ${attempt}/${maxAttempts})`);

      // Si c'est la dernière tentative, arrêter
      if (attempt >= maxAttempts) {
        console.warn(`⚠️ Transcript not available after ${maxAttempts} attempts`);
        if (onProgress) {
          onProgress({
            attempt,
            maxAttempts,
            status: 'unavailable'
          });
        }
        return { transcript: '', summary: '' };
      }

      // Attendre avant de réessayer
      console.log(`⏰ Waiting ${retryIntervalMs / 1000}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
      attempt++;

    } catch (error: any) {
      console.error(`❌ Error processing meeting (attempt ${attempt}/${maxAttempts}):`, error);
      
      // Si le transcript n'est pas encore disponible, continuer à réessayer
      if (error.message?.includes('No transcript') || 
          error.message?.includes('No recordings') || 
          error.message?.includes('No transcripts found')) {
        
        if (attempt >= maxAttempts) {
          console.log('ℹ️ Transcript not available after all attempts');
          if (onProgress) {
            onProgress({
              attempt,
              maxAttempts,
              status: 'unavailable'
            });
          }
          return { transcript: '', summary: '' };
        }

        console.log(`⏰ Waiting ${retryIntervalMs / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        attempt++;
        continue;
      }
      
      // Autre erreur: arrêter
      throw error;
    }
  }
  
  return { transcript: '', summary: '' };
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

