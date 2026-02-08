import { CalendarEvent, EventSource } from "../types/calendarTypes";

// Types for the Google Global Objects
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// Initialize the gapi client (API Key)
export const initializeGapiClient = async (apiKey: string) => {
  await new Promise<void>((resolve, reject) => {
    window.gapi.load('client', { callback: resolve, onerror: reject });
  });
  
  await window.gapi.client.init({
    apiKey: apiKey,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
};

// Initialize the GIS client (OAuth2)
export const initializeGisClient = (clientId: string) => {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: '', // defined at request time
  });
  gisInited = true;
};

// Trigger the login flow and return the access token
export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error("Google Identity Service not initialized."));
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      }
      resolve(resp);
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// Fetch events from the primary calendar
export const listUpcomingEvents = async (): Promise<CalendarEvent[]> => {
  if (!gapiInited) throw new Error("GAPI not initialized");

  try {
    const request = {
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 50,
      'orderBy': 'startTime',
    };
    const response = await window.gapi.client.calendar.events.list(request);
    const googleEvents = response.result.items;

    if (!googleEvents || googleEvents.length === 0) {
      return [];
    }

    return googleEvents.map((event: any) => {
      // Handle all-day events vs time-based events
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;
      const isAllDay = !event.start.dateTime;

      return {
        id: event.id || Math.random().toString(),
        title: event.summary || '(No Title)',
        description: event.description || '',
        location: event.location,
        start: new Date(start),
        end: new Date(end),
        isAllDay: isAllDay,
        source: EventSource.GOOGLE,
        color: '#4285F4', // Google Blue
        meetingLink: event.hangoutLink || event.htmlLink // Prefer hangout/meet link, fallback to event link
      };
    });
  } catch (err) {
    console.error("Error fetching Google Events", err);
    throw err;
  }
};
