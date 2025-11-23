/**
 * Service pour interagir avec l'API Google Calendar
 * Documentation: https://developers.google.com/calendar/api/v3/reference
 */

import { GoogleCalendarEvent, AvailabilityHours } from '../types';

const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

/**
 * Fonction simple de chiffrement/déchiffrement (basique, à améliorer en production)
 * En production, utilisez une bibliothèque de chiffrement robuste
 */
const encryptToken = (token: string): string => {
  // TODO: Implémenter un vrai chiffrement (ex: crypto-js, Web Crypto API)
  // Pour l'instant, on retourne le token tel quel (NON SÉCURISÉ - À AMÉLIORER)
  return btoa(token); // Base64 encoding (pas sécurisé, juste pour la structure)
};

const decryptToken = (encryptedToken: string): string => {
  // TODO: Implémenter un vrai déchiffrement
  return atob(encryptedToken); // Base64 decoding
};

/**
 * Récupère la liste de tous les calendriers de l'utilisateur
 */
export const getGoogleCalendarList = async (
  accessToken: string
): Promise<Array<{ id: string; summary: string }>> => {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/users/me/calendarList`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Si erreur 401 (token expiré), on retourne juste le calendrier principal
      if (response.status === 401) {
        console.warn('⚠️ Token expired, using primary calendar only');
        return [{ id: 'primary', summary: 'Primary Calendar' }];
      }
      throw new Error(error.error?.message || 'Failed to fetch calendar list');
    }

    const data = await response.json();
    const calendars = (data.items || []).filter((cal: any) => {
      // Inclure tous les calendriers sauf ceux marqués comme "hidden" ou "deleted"
      return cal.accessRole !== 'none' && !cal.deleted;
    });
    
    console.log(`📅 Found ${calendars.length} Google Calendars:`, calendars.map((c: any) => c.summary));
    return calendars.map((cal: any) => ({
      id: cal.id,
      summary: cal.summary || cal.id,
    }));
  } catch (error) {
    console.error('❌ Error fetching calendar list:', error);
    // En cas d'erreur, retourner au moins le calendrier principal
    return [{ id: 'primary', summary: 'Primary Calendar' }];
  }
};

/**
 * Récupère les événements (créneaux occupés) depuis un calendrier spécifique
 */
const getEventsFromCalendar = async (
  accessToken: string,
  calendarId: string,
  startDate: string,
  endDate: string
): Promise<GoogleCalendarEvent[]> => {
  try {
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate).toISOString();
    
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      // Ne pas bloquer si un calendrier échoue, juste logger
      console.warn(`⚠️ Failed to fetch events from calendar ${calendarId}:`, error.error?.message || 'Unknown error');
      return [];
    }

    const data = await response.json();
    const events = data.items || [];
    console.log(`📅 Calendar ${calendarId.substring(0, 20)}...: ${events.length} events`);
    return events;
  } catch (error: any) {
    // Gérer spécifiquement l'erreur ERR_INSUFFICIENT_RESOURCES
    if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES') || error.name === 'TypeError') {
      console.warn(`⚠️ Resource limit reached for calendar ${calendarId.substring(0, 20)}..., skipping`);
      return [];
    }
    console.warn(`⚠️ Error fetching events from calendar ${calendarId}:`, error);
    return [];
  }
};

/**
 * Récupère les événements (créneaux occupés) depuis TOUS les calendriers Google
 */
export const getGoogleCalendarEvents = async (
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GoogleCalendarEvent[]> => {
  try {
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate).toISOString();
    
    console.log('📅 Fetching Google Calendar events from', timeMin, 'to', timeMax);
    
    // Récupérer la liste de tous les calendriers
    let calendars: Array<{ id: string; summary: string }>;
    try {
      calendars = await getGoogleCalendarList(accessToken);
    } catch (error: any) {
      // Si la liste des calendriers échoue (token expiré), utiliser seulement le calendrier principal
      console.warn('⚠️ Could not fetch calendar list, using primary calendar only');
      calendars = [{ id: 'primary', summary: 'Primary Calendar' }];
    }
    
    // Récupérer les événements de chaque calendrier avec un délai pour éviter ERR_INSUFFICIENT_RESOURCES
    // On traite les calendriers par batch de 3 pour éviter de surcharger
    const eventsArrays: GoogleCalendarEvent[][] = [];
    const batchSize = 3;
    
    console.log(`📋 Processing ${calendars.length} calendars in batches of ${batchSize}`);
    
    for (let i = 0; i < calendars.length; i += batchSize) {
      const batch = calendars.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.map(c => c.summary).join(', ')}`);
      
      const batchPromises = batch.map(calendar => 
        getEventsFromCalendar(accessToken, calendar.id, startDate, endDate)
      );
      
      const batchResults = await Promise.all(batchPromises);
      eventsArrays.push(...batchResults);
      
      // Log des résultats du batch
      batchResults.forEach((events, idx) => {
        console.log(`  ✅ ${batch[idx].summary}: ${events.length} events`);
      });
      
      // Petit délai entre les batches pour éviter de surcharger
      if (i + batchSize < calendars.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms de délai
      }
    }
    
    // Combiner tous les événements
    const allEvents = eventsArrays.flat();
    
    // Dédupliquer les événements (au cas où un événement serait dans plusieurs calendriers)
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );
    
    console.log(`✅ Found ${uniqueEvents.length} total events across ${calendars.length} calendars:`, 
      uniqueEvents.map(e => ({
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date
      }))
    );
    
    return uniqueEvents;
  } catch (error) {
    console.error('❌ Error fetching Google Calendar events:', error);
    throw error;
  }
};

/**
 * Vérifie si un créneau est dans les heures de disponibilité de l'avocat
 */
export const isSlotInAvailabilityHours = (
  slotDate: Date,
  availabilityHours?: AvailabilityHours
): boolean => {
  if (!availabilityHours) {
    // Si pas d'heures définies, accepter tous les créneaux (comportement par défaut)
    return true;
  }

  const dayOfWeek = slotDate.getDay(); // 0 = dimanche, 1 = lundi, etc.
  const dayNames: (keyof AvailabilityHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const dayAvailability = availabilityHours[dayName];

  if (!dayAvailability.enabled || dayAvailability.timeSlots.length === 0) {
    return false;
  }

  const slotHour = slotDate.getHours();
  const slotMinute = slotDate.getMinutes();
  const slotTime = slotHour * 60 + slotMinute; // Convertir en minutes depuis minuit

  // Vérifier si le créneau est dans une des tranches horaires
  return dayAvailability.timeSlots.some(slot => {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return slotTime >= startTime && slotTime < endTime;
  });
};

/**
 * Récupère les créneaux disponibles en excluant les créneaux occupés
 */
export const getAvailableSlots = async (
  accessToken: string,
  startDate: string,
  endDate: string,
  slotDuration: number = 60, // Durée des créneaux en minutes
  slotInterval: number = 15, // Intervalle entre les créneaux en minutes
  availabilityHours?: AvailabilityHours // Heures de disponibilité de l'avocat
): Promise<string[]> => {
  try {
    // Récupérer les événements occupés
    const events = await getGoogleCalendarEvents(accessToken, startDate, endDate);
    
    // Convertir les événements en plages de temps occupées
    const busySlots = events
      .filter(event => event.start?.dateTime) // Ignorer les événements toute la journée
      .map(event => {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        console.log(`🚫 Busy slot: ${start.toISOString()} to ${end.toISOString()}`);
        return { start, end };
      });

    console.log(`📊 Total busy slots: ${busySlots.length}`);

    // Générer les créneaux disponibles
    const availableSlots: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Générer des créneaux de 8h à 19h pour chaque jour
    const now = new Date();
    const minTime = new Date(now.getTime() + 15 * 60 * 1000); // Minimum 15 minutes à l'avance
    
    // Pour chaque jour dans la plage
    for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
      const targetDay = new Date(start);
      targetDay.setDate(start.getDate() + dayOffset);
      targetDay.setHours(8, 0, 0, 0); // Commencer à 8h
      
      // Générer des créneaux toutes les slotInterval minutes de 8h à 19h
      let currentTime = new Date(targetDay);
      const dayEnd = new Date(targetDay);
      dayEnd.setHours(19, 0, 0, 0); // Jusqu'à 19h
      
      while (currentTime < dayEnd && currentTime < end) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
        
        // Vérifier si ce créneau chevauche un événement existant
        const isBusy = busySlots.some(busy => 
          currentTime < busy.end && slotEnd > busy.start
        );
        
        // Vérifier si le créneau est dans les heures de disponibilité
        const isInAvailability = isSlotInAvailabilityHours(currentTime, availabilityHours);
        
        // Vérifier que le créneau n'est pas dans le passé
        if (!isBusy && isInAvailability && currentTime >= minTime && slotEnd <= end && slotEnd <= dayEnd) {
          availableSlots.push(currentTime.toISOString());
        }
        
        // Passer au créneau suivant
        currentTime = new Date(currentTime.getTime() + slotInterval * 60 * 1000);
      }
    }

    console.log(`✅ Generated ${availableSlots.length} available slots`);
    return availableSlots;
  } catch (error) {
    console.error('❌ Error getting available slots:', error);
    throw error;
  }
};

/**
 * Crée un événement dans Google Calendar
 */
export const createGoogleCalendarEvent = async (
  accessToken: string,
  summary: string,
  startTime: string, // ISO string
  endTime: string, // ISO string
  description?: string,
  location?: string
): Promise<GoogleCalendarEvent> => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eventData = {
      summary,
      description: description || '',
      start: {
        dateTime: startTime,
        timeZone: timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone,
      },
      location: location || '',
    };
    
    console.log('📅 Creating Google Calendar event:', {
      summary,
      startTime,
      endTime,
      timeZone,
    });
    
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Google Calendar API error:', error);
      throw new Error(error.error?.message || 'Failed to create Google Calendar event');
    }

    const data = await response.json();
    console.log('✅ Google Calendar event created:', {
      id: data.id,
      summary: data.summary,
      start: data.start?.dateTime,
      end: data.end?.dateTime,
    });
    return data;
  } catch (error) {
    console.error('❌ Error creating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Met à jour un événement dans Google Calendar
 */
export const updateGoogleCalendarEvent = async (
  accessToken: string,
  eventId: string,
  updates: {
    summary?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
  }
): Promise<GoogleCalendarEvent> => {
  try {
    // D'abord récupérer l'événement existant
    const getResponse = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error('Failed to fetch event for update');
    }

    const existingEvent = await getResponse.json();

    // Préparer les mises à jour
    const updatedEvent = {
      ...existingEvent,
      summary: updates.summary || existingEvent.summary,
      description: updates.description !== undefined ? updates.description : existingEvent.description,
      location: updates.location !== undefined ? updates.location : existingEvent.location,
      start: updates.startTime ? {
        dateTime: updates.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : existingEvent.start,
      end: updates.endTime ? {
        dateTime: updates.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : existingEvent.end,
    };

    const response = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update Google Calendar event');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error updating Google Calendar event:', error);
    throw error;
  }
};

/**
 * Supprime un événement dans Google Calendar
 */
export const deleteGoogleCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_URL}/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete Google Calendar event');
    }
  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error);
    throw error;
  }
};

/**
 * Rafraîchit un access token Google expiré
 * Note: Firebase Auth gère automatiquement le rafraîchissement, mais on peut aussi le faire manuellement
 */
export const refreshGoogleAccessToken = async (
  refreshToken: string
): Promise<string> => {
  try {
    // Note: Pour utiliser cette fonction, vous devez avoir configuré un OAuth 2.0 Client ID dans Google Cloud Console
    // et avoir obtenu un refresh token. Firebase Auth gère généralement cela automatiquement.
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Google access token:', error);
    throw error;
  }
};

// Export des fonctions de chiffrement pour utilisation dans firebaseService
export { encryptToken, decryptToken };

