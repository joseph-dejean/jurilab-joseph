/**
 * Service pour interagir avec l'API Microsoft Graph (Outlook Calendar)
 * Documentation: https://learn.microsoft.com/en-us/graph/api/resources/calendar
 */

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  body?: { contentType: string; content: string };
  location?: { displayName: string };
  isAllDay?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
}

const GRAPH_API_URL = 'https://graph.microsoft.com/v1.0';

/**
 * Récupère la liste des calendriers Outlook de l'utilisateur
 */
export const getOutlookCalendarList = async (
  accessToken: string
): Promise<Array<{ id: string; name: string; color?: string }>> => {
  try {
    const response = await fetch(`${GRAPH_API_URL}/me/calendars`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        console.warn('⚠️ Outlook token expired');
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(error.error?.message || 'Failed to fetch Outlook calendar list');
    }

    const data = await response.json();
    const calendars = (data.value || []).map((cal: any) => ({
      id: cal.id,
      name: cal.name,
      color: cal.hexColor,
    }));

    console.log(`📅 Found ${calendars.length} Outlook Calendars:`, calendars.map((c: any) => c.name));
    return calendars;
  } catch (error) {
    console.error('❌ Error fetching Outlook calendar list:', error);
    throw error;
  }
};

/**
 * Récupère les événements d'un calendrier Outlook spécifique
 */
const getEventsFromOutlookCalendar = async (
  accessToken: string,
  calendarId: string,
  startDate: string,
  endDate: string
): Promise<OutlookCalendarEvent[]> => {
  try {
    const startDateTime = new Date(startDate).toISOString();
    const endDateTime = new Date(endDate).toISOString();

    const url = calendarId === 'primary'
      ? `${GRAPH_API_URL}/me/calendar/calendarView?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$orderby=start/dateTime`
      : `${GRAPH_API_URL}/me/calendars/${calendarId}/calendarView?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$orderby=start/dateTime`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'outlook.timezone="Europe/Paris"',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.warn(`⚠️ Failed to fetch events from Outlook calendar ${calendarId}:`, error.error?.message);
      return [];
    }

    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.warn(`⚠️ Error fetching events from Outlook calendar ${calendarId}:`, error);
    return [];
  }
};

/**
 * Récupère les événements de TOUS les calendriers Outlook
 */
export const getOutlookCalendarEvents = async (
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OutlookCalendarEvent[]> => {
  try {
    console.log('📅 Fetching Outlook Calendar events from', startDate, 'to', endDate);

    // Récupérer la liste de tous les calendriers
    let calendars: Array<{ id: string; name: string }>;
    try {
      calendars = await getOutlookCalendarList(accessToken);
    } catch (error: any) {
      if (error.message === 'TOKEN_EXPIRED') throw error;
      console.warn('⚠️ Could not fetch calendar list, using primary calendar only');
      calendars = [{ id: 'primary', name: 'Primary Calendar' }];
    }

    // Récupérer les événements de chaque calendrier
    const eventsArrays: OutlookCalendarEvent[][] = [];
    const batchSize = 3;

    for (let i = 0; i < calendars.length; i += batchSize) {
      const batch = calendars.slice(i, i + batchSize);
      const batchPromises = batch.map((calendar) =>
        getEventsFromOutlookCalendar(accessToken, calendar.id, startDate, endDate)
      );

      const batchResults = await Promise.all(batchPromises);
      eventsArrays.push(...batchResults);

      // Délai entre les batches
      if (i + batchSize < calendars.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Combiner et dédupliquer les événements
    const allEvents = eventsArrays.flat();
    const uniqueEvents = allEvents.filter(
      (event, index, self) => index === self.findIndex((e) => e.id === event.id)
    );

    console.log(`✅ Found ${uniqueEvents.length} Outlook events across ${calendars.length} calendars`);
    return uniqueEvents;
  } catch (error) {
    console.error('❌ Error fetching Outlook Calendar events:', error);
    throw error;
  }
};

/**
 * Crée un événement dans le calendrier Outlook principal
 */
export const createOutlookCalendarEvent = async (
  accessToken: string,
  summary: string,
  startTime: string,
  endTime: string,
  description?: string,
  location?: string
): Promise<OutlookCalendarEvent> => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const eventData = {
      subject: summary,
      body: {
        contentType: 'HTML',
        content: description || '',
      },
      start: {
        dateTime: new Date(startTime).toISOString().replace('Z', ''),
        timeZone: timeZone,
      },
      end: {
        dateTime: new Date(endTime).toISOString().replace('Z', ''),
        timeZone: timeZone,
      },
      location: location ? { displayName: location } : undefined,
    };

    console.log('📅 Creating Outlook Calendar event:', { summary, startTime, endTime });

    const response = await fetch(`${GRAPH_API_URL}/me/calendar/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Outlook Calendar API error:', error);
      throw new Error(error.error?.message || 'Failed to create Outlook Calendar event');
    }

    const data = await response.json();
    console.log('✅ Outlook Calendar event created:', { id: data.id, subject: data.subject });
    return data;
  } catch (error) {
    console.error('❌ Error creating Outlook Calendar event:', error);
    throw error;
  }
};

/**
 * Met à jour un événement dans Outlook Calendar
 */
export const updateOutlookCalendarEvent = async (
  accessToken: string,
  eventId: string,
  updates: {
    summary?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
  }
): Promise<OutlookCalendarEvent> => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const updateData: any = {};

    if (updates.summary) {
      updateData.subject = updates.summary;
    }
    if (updates.description !== undefined) {
      updateData.body = { contentType: 'HTML', content: updates.description };
    }
    if (updates.startTime) {
      updateData.start = {
        dateTime: new Date(updates.startTime).toISOString().replace('Z', ''),
        timeZone: timeZone,
      };
    }
    if (updates.endTime) {
      updateData.end = {
        dateTime: new Date(updates.endTime).toISOString().replace('Z', ''),
        timeZone: timeZone,
      };
    }
    if (updates.location !== undefined) {
      updateData.location = { displayName: updates.location };
    }

    const response = await fetch(`${GRAPH_API_URL}/me/calendar/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update Outlook Calendar event');
    }

    const data = await response.json();
    console.log('✅ Outlook Calendar event updated:', { id: data.id, subject: data.subject });
    return data;
  } catch (error) {
    console.error('❌ Error updating Outlook Calendar event:', error);
    throw error;
  }
};

/**
 * Supprime un événement dans Outlook Calendar
 */
export const deleteOutlookCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<void> => {
  try {
    const response = await fetch(`${GRAPH_API_URL}/me/calendar/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete Outlook Calendar event');
    }

    console.log('✅ Outlook Calendar event deleted:', eventId);
  } catch (error) {
    console.error('❌ Error deleting Outlook Calendar event:', error);
    throw error;
  }
};

/**
 * Rafraîchit un access token Outlook expiré
 */
export const refreshOutlookAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
    
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh Outlook access token');
    }

    const data = await response.json();
    console.log('✅ Outlook access token refreshed');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Outlook access token:', error);
    throw error;
  }
};

/**
 * Convertit un événement Outlook au format unifié CalendarEvent
 */
export const convertOutlookEventToCalendarEvent = (event: OutlookCalendarEvent) => {
  return {
    id: `outlook-${event.id}`,
    title: event.subject || 'Sans titre',
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
    allDay: event.isAllDay || false,
    description: event.body?.content,
    location: event.location?.displayName,
    type: 'OUTLOOK' as const,
    source: 'OUTLOOK' as const,
    sourceEventId: event.id,
    color: '#f59e0b', // Orange pour Outlook
  };
};
