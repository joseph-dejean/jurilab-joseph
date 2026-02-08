/**
 * Service de synchronisation unifiée des calendriers
 * Gère la synchronisation bidirectionnelle entre Jurilab, Google Calendar et Outlook
 */

import { Appointment, GoogleCalendarEvent } from '../types';
import {
  getGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent as updateGoogleEvent,
  deleteGoogleCalendarEvent as deleteGoogleEvent,
} from './googleCalendarService';
import {
  getOutlookCalendarEvents,
  createOutlookCalendarEvent,
  updateOutlookCalendarEvent as updateOutlookEvent,
  deleteOutlookCalendarEvent as deleteOutlookEvent,
  OutlookCalendarEvent,
  convertOutlookEventToCalendarEvent,
} from './outlookCalendarService';
import {
  getGoogleCalendarCredentials,
  getOutlookCalendarCredentials,
  getUserAppointments,
  getPersonalEvents,
  createPersonalEvent,
  updatePersonalEvent,
  deletePersonalEvent,
} from './firebaseService';

// Types pour le calendrier unifié
export interface UnifiedCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color: string;
  type: 'APPOINTMENT' | 'GOOGLE' | 'OUTLOOK' | 'PERSONAL';
  source: 'JURILAB' | 'GOOGLE' | 'OUTLOOK';
  sourceEventId?: string;
  description?: string;
  location?: string;
  appointment?: Appointment;
  editable: boolean;
  deletable: boolean;
}

export interface CalendarSyncStatus {
  google: {
    connected: boolean;
    lastSync: string | null;
    eventCount: number;
  };
  outlook: {
    connected: boolean;
    lastSync: string | null;
    eventCount: number;
  };
  jurilab: {
    appointmentCount: number;
    personalEventCount: number;
  };
}

// Couleurs par type d'événement
export const EVENT_COLORS = {
  APPOINTMENT: '#3b82f6', // Bleu - Rendez-vous Jurilab
  GOOGLE: '#10b981', // Vert - Google Calendar
  OUTLOOK: '#f59e0b', // Orange - Outlook
  PERSONAL: '#8b5cf6', // Violet - Événements personnels
  BUSY: '#ef4444', // Rouge - Occupé/Bloqué
};

/**
 * Récupère tous les événements de toutes les sources
 */
export const fetchAllCalendarEvents = async (
  userId: string,
  userRole: 'LAWYER' | 'CLIENT',
  startDate: Date,
  endDate: Date
): Promise<UnifiedCalendarEvent[]> => {
  const allEvents: UnifiedCalendarEvent[] = [];
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  // 1. Récupérer les rendez-vous Jurilab
  try {
    const appointments = await getUserAppointments(userId, userRole);
    const appointmentEvents = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate >= startDate && aptDate <= endDate && apt.status !== 'CANCELLED';
      })
      .map((apt) => convertAppointmentToEvent(apt));
    allEvents.push(...appointmentEvents);
  } catch (error) {
    console.error('❌ Error fetching Jurilab appointments:', error);
  }

  // 2. Récupérer les événements personnels
  try {
    const personalEvents = await getPersonalEvents(userId, startStr, endStr);
    const personalCalendarEvents = personalEvents.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay || false,
      color: event.color || EVENT_COLORS.PERSONAL,
      type: 'PERSONAL' as const,
      source: 'JURILAB' as const,
      sourceEventId: event.id,
      description: event.description,
      location: event.location,
      editable: true,
      deletable: true,
    }));
    allEvents.push(...personalCalendarEvents);
  } catch (error) {
    console.error('❌ Error fetching personal events:', error);
  }

  // 3. Récupérer les événements Google Calendar (si connecté)
  try {
    const googleCreds = await getGoogleCalendarCredentials(userId);
    if (googleCreds?.googleCalendarConnected && googleCreds.googleCalendarAccessToken) {
      const googleEvents = await getGoogleCalendarEvents(
        googleCreds.googleCalendarAccessToken,
        startStr,
        endStr
      );
      const googleCalendarEvents = googleEvents.map((event) => convertGoogleEventToUnified(event));
      allEvents.push(...googleCalendarEvents);
    }
  } catch (error) {
    console.error('❌ Error fetching Google Calendar events:', error);
  }

  // 4. Récupérer les événements Outlook (si connecté)
  try {
    const outlookCreds = await getOutlookCalendarCredentials(userId);
    if (outlookCreds?.outlookCalendarConnected && outlookCreds.outlookCalendarAccessToken) {
      const outlookEvents = await getOutlookCalendarEvents(
        outlookCreds.outlookCalendarAccessToken,
        startStr,
        endStr
      );
      const outlookCalendarEvents = outlookEvents.map((event) => convertOutlookEventToUnified(event));
      allEvents.push(...outlookCalendarEvents);
    }
  } catch (error) {
    console.error('❌ Error fetching Outlook Calendar events:', error);
  }

  // Trier par date de début
  allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  return allEvents;
};

/**
 * Crée un événement et le synchronise vers les calendriers externes
 */
export const createCalendarEvent = async (
  userId: string,
  eventData: {
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
    color?: string;
    allDay?: boolean;
    syncToGoogle?: boolean;
    syncToOutlook?: boolean;
  }
): Promise<UnifiedCalendarEvent> => {
  // 1. Créer l'événement personnel dans Firebase
  const personalEvent = await createPersonalEvent(userId, {
    title: eventData.title,
    start: eventData.start.toISOString(),
    end: eventData.end.toISOString(),
    description: eventData.description,
    location: eventData.location,
    color: eventData.color || EVENT_COLORS.PERSONAL,
    allDay: eventData.allDay,
  });

  // 2. Synchroniser vers Google Calendar si demandé
  if (eventData.syncToGoogle) {
    try {
      const googleCreds = await getGoogleCalendarCredentials(userId);
      if (googleCreds?.googleCalendarConnected && googleCreds.googleCalendarAccessToken) {
        await createGoogleCalendarEvent(
          googleCreds.googleCalendarAccessToken,
          eventData.title,
          eventData.start.toISOString(),
          eventData.end.toISOString(),
          eventData.description,
          eventData.location
        );
        console.log('✅ Event synced to Google Calendar');
      }
    } catch (error) {
      console.error('⚠️ Failed to sync to Google Calendar:', error);
    }
  }

  // 3. Synchroniser vers Outlook si demandé
  if (eventData.syncToOutlook) {
    try {
      const outlookCreds = await getOutlookCalendarCredentials(userId);
      if (outlookCreds?.outlookCalendarConnected && outlookCreds.outlookCalendarAccessToken) {
        await createOutlookCalendarEvent(
          outlookCreds.outlookCalendarAccessToken,
          eventData.title,
          eventData.start.toISOString(),
          eventData.end.toISOString(),
          eventData.description,
          eventData.location
        );
        console.log('✅ Event synced to Outlook Calendar');
      }
    } catch (error) {
      console.error('⚠️ Failed to sync to Outlook Calendar:', error);
    }
  }

  return {
    id: personalEvent.id,
    title: personalEvent.title,
    start: new Date(personalEvent.start),
    end: new Date(personalEvent.end),
    allDay: personalEvent.allDay,
    color: personalEvent.color || EVENT_COLORS.PERSONAL,
    type: 'PERSONAL',
    source: 'JURILAB',
    sourceEventId: personalEvent.id,
    description: personalEvent.description,
    location: personalEvent.location,
    editable: true,
    deletable: true,
  };
};

/**
 * Met à jour un événement
 */
export const updateCalendarEvent = async (
  userId: string,
  eventId: string,
  eventType: 'PERSONAL' | 'GOOGLE' | 'OUTLOOK',
  updates: {
    title?: string;
    start?: Date;
    end?: Date;
    description?: string;
    location?: string;
    color?: string;
  }
): Promise<void> => {
  if (eventType === 'PERSONAL') {
    await updatePersonalEvent(userId, eventId, {
      title: updates.title,
      start: updates.start?.toISOString(),
      end: updates.end?.toISOString(),
      description: updates.description,
      location: updates.location,
      color: updates.color,
    });
  } else if (eventType === 'GOOGLE') {
    const googleCreds = await getGoogleCalendarCredentials(userId);
    if (googleCreds?.googleCalendarAccessToken) {
      const sourceEventId = eventId.replace('google-', '');
      await updateGoogleEvent(googleCreds.googleCalendarAccessToken, sourceEventId, {
        summary: updates.title,
        startTime: updates.start?.toISOString(),
        endTime: updates.end?.toISOString(),
        description: updates.description,
        location: updates.location,
      });
    }
  } else if (eventType === 'OUTLOOK') {
    const outlookCreds = await getOutlookCalendarCredentials(userId);
    if (outlookCreds?.outlookCalendarAccessToken) {
      const sourceEventId = eventId.replace('outlook-', '');
      await updateOutlookEvent(outlookCreds.outlookCalendarAccessToken, sourceEventId, {
        summary: updates.title,
        startTime: updates.start?.toISOString(),
        endTime: updates.end?.toISOString(),
        description: updates.description,
        location: updates.location,
      });
    }
  }
};

/**
 * Supprime un événement
 */
export const deleteCalendarEvent = async (
  userId: string,
  eventId: string,
  eventType: 'PERSONAL' | 'GOOGLE' | 'OUTLOOK'
): Promise<void> => {
  if (eventType === 'PERSONAL') {
    await deletePersonalEvent(userId, eventId);
  } else if (eventType === 'GOOGLE') {
    const googleCreds = await getGoogleCalendarCredentials(userId);
    if (googleCreds?.googleCalendarAccessToken) {
      const sourceEventId = eventId.replace('google-', '');
      await deleteGoogleEvent(googleCreds.googleCalendarAccessToken, sourceEventId);
    }
  } else if (eventType === 'OUTLOOK') {
    const outlookCreds = await getOutlookCalendarCredentials(userId);
    if (outlookCreds?.outlookCalendarAccessToken) {
      const sourceEventId = eventId.replace('outlook-', '');
      await deleteOutlookEvent(outlookCreds.outlookCalendarAccessToken, sourceEventId);
    }
  }
};

/**
 * Obtient le statut de synchronisation de tous les calendriers
 */
export const getCalendarSyncStatus = async (userId: string): Promise<CalendarSyncStatus> => {
  const status: CalendarSyncStatus = {
    google: { connected: false, lastSync: null, eventCount: 0 },
    outlook: { connected: false, lastSync: null, eventCount: 0 },
    jurilab: { appointmentCount: 0, personalEventCount: 0 },
  };

  // Google Calendar status
  try {
    const googleCreds = await getGoogleCalendarCredentials(userId);
    if (googleCreds?.googleCalendarConnected) {
      status.google.connected = true;
      status.google.lastSync = googleCreds.googleCalendarLastSyncAt || null;
    }
  } catch (error) {
    console.error('Error getting Google Calendar status:', error);
  }

  // Outlook Calendar status
  try {
    const outlookCreds = await getOutlookCalendarCredentials(userId);
    if (outlookCreds?.outlookCalendarConnected) {
      status.outlook.connected = true;
      status.outlook.lastSync = outlookCreds.outlookCalendarLastSyncAt || null;
    }
  } catch (error) {
    console.error('Error getting Outlook Calendar status:', error);
  }

  return status;
};

// Helper functions

function convertAppointmentToEvent(apt: Appointment): UnifiedCalendarEvent {
  const startDate = new Date(apt.date);
  const endDate = new Date(startDate.getTime() + (apt.duration || 60) * 60 * 1000);

  return {
    id: `apt-${apt.id}`,
    title: apt.clientName ? `Consultation - ${apt.clientName}` : 'Consultation',
    start: startDate,
    end: endDate,
    allDay: false,
    color: EVENT_COLORS.APPOINTMENT,
    type: 'APPOINTMENT',
    source: 'JURILAB',
    sourceEventId: apt.id,
    description: apt.notes,
    appointment: apt,
    editable: false, // Les rendez-vous ne sont pas directement éditables depuis le calendrier
    deletable: false,
  };
}

function convertGoogleEventToUnified(event: GoogleCalendarEvent): UnifiedCalendarEvent {
  const start = event.start.dateTime
    ? new Date(event.start.dateTime)
    : new Date(event.start.date as string);
  const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date as string);

  return {
    id: `google-${event.id}`,
    title: event.summary || 'Sans titre',
    start,
    end,
    allDay: !event.start.dateTime,
    color: EVENT_COLORS.GOOGLE,
    type: 'GOOGLE',
    source: 'GOOGLE',
    sourceEventId: event.id,
    description: event.description,
    location: event.location,
    editable: true,
    deletable: true,
  };
}

function convertOutlookEventToUnified(event: OutlookCalendarEvent): UnifiedCalendarEvent {
  return {
    id: `outlook-${event.id}`,
    title: event.subject || 'Sans titre',
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
    allDay: event.isAllDay || false,
    color: EVENT_COLORS.OUTLOOK,
    type: 'OUTLOOK',
    source: 'OUTLOOK',
    sourceEventId: event.id,
    description: event.body?.content,
    location: event.location?.displayName,
    editable: true,
    deletable: true,
  };
}

export { EVENT_COLORS as CALENDAR_EVENT_COLORS };
