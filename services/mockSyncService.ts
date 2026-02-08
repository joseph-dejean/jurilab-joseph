import { CalendarEvent, EventSource } from "../types/calendarTypes";

// Empty - now using real Google Calendar API
export const fetchMockGoogleEvents = (): Promise<CalendarEvent[]> => {
  return Promise.resolve([]); 
};

export const fetchMockOutlookEvents = (): Promise<CalendarEvent[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const events: CalendarEvent[] = [
        {
          id: 'o-1',
          title: 'Outlook: Board Meeting',
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
          end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0),
          source: EventSource.OUTLOOK,
          description: 'Synced from Outlook 365. Quarterly review.',
          color: '#0078D4', // Outlook Blue
          meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_...'
        }
      ];
      resolve(events);
    }, 1200);
  });
};
