import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { CalendarEvent, EventSource, IntegrationsStatus, CalendarViewType } from '../types/calendarTypes';
import { fetchMockOutlookEvents } from '../services/mockSyncService';
import { initializeGapiClient, initializeGisClient, handleAuthClick, listUpcomingEvents } from '../services/googleCalendarService_new';
// import { useApp } from '../store/store'; // REMOVED
import { 
  createPersonalEvent, 
  getPersonalEvents, 
  deletePersonalEvent, 
  updatePersonalEvent,
  getGoogleCalendarCredentials,
  getGoogleCalendarEvents,
  syncPersonalEventToGoogleCalendar,
  updatePersonalEventGoogleCalendar,
  deletePersonalEventGoogleCalendar
} from '../services/firebaseService';
import { User, GoogleCalendarEvent } from '../types';

interface CalendarContextType {
  date: Date;
  setDate: (d: Date) => void;
  view: CalendarViewType;
  setView: (v: CalendarViewType) => void;
  events: CalendarEvent[];
  addEvent: (e: CalendarEvent) => void;
  updateEvent: (e: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  integrations: IntegrationsStatus;
  toggleIntegration: (source: 'google' | 'outlook') => Promise<void>;
  isLoading: boolean;
  // Auth Modal Controls
  isGoogleAuthModalOpen: boolean;
  closeGoogleAuthModal: () => void;
  saveGoogleConfig: (apiKey: string, clientId: string) => void;
  // Exposed API Key for AI
  apiKey?: string;
  availabilityMode: boolean;
  toggleAvailabilityMode: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children, currentUser }: PropsWithChildren<{ currentUser: User | null }>) => {
  // const { currentUser } = useApp(); // Removed to avoid context issues
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>(CalendarViewType.WEEK);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationsStatus>({
    google: false,
    outlook: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Google Auth Config State
  const [googleConfig, setGoogleConfig] = useState<{apiKey: string, clientId: string} | null>(() => {
    const stored = localStorage.getItem('google_calendar_config');
    return stored ? JSON.parse(stored) : null;
  });
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false);
  
  // Availability Mode
  const [availabilityMode, setAvailabilityMode] = useState(false);
  const toggleAvailabilityMode = () => setAvailabilityMode(prev => !prev);

  // Use Gemini API key for AI parsing (not Google Calendar API key)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Initial load
  useEffect(() => {
    const loadEvents = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        // Load Personal Events from Firebase
        const personalEvents = await getPersonalEvents(currentUser.id);
        
        // Convert PersonalEvent to CalendarEvent
        const mappedEvents: CalendarEvent[] = personalEvents.map(pe => ({
          id: pe.id,
          title: pe.title,
          start: new Date(pe.start),
          end: new Date(pe.end),
          description: pe.description,
          location: pe.location,
          color: pe.color,
          isAllDay: pe.allDay,
          source: EventSource.LOCAL,
          type: pe.type === 'AVAILABILITY' ? 'availability' : 'event',
          sourceEventId: pe.googleCalendarEventId // Store Google ID here for syncing
        }));

        // Check if Google Calendar is connected in Firebase
        try {
          const googleCreds = await getGoogleCalendarCredentials(currentUser.id);
          if (googleCreds && googleCreds.googleCalendarConnected) {
             console.log("✅ Found Google Calendar credentials in Firebase, syncing...");
             // Automatically sync Google Events if connected
             const googleEvents = await getGoogleCalendarEvents(currentUser.id);
             
             const mappedGoogleEvents: CalendarEvent[] = googleEvents.map((e: GoogleCalendarEvent) => ({
                id: e.id,
                title: e.summary || '(No Title)',
                description: e.description,
                start: new Date(e.start.dateTime || e.start.date || new Date().toISOString()),
                end: new Date(e.end.dateTime || e.end.date || new Date().toISOString()),
                isAllDay: !e.start.dateTime,
                location: e.location,
                source: EventSource.GOOGLE,
                color: '#4285F4',
                editable: false
             }));
             
             mappedEvents.push(...mappedGoogleEvents);
             setIntegrations(prev => ({ ...prev, google: true }));
          }
        } catch (err) {
            console.error("Error auto-syncing Google Calendar:", err);
        }

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [currentUser]);

  const addEvent = async (event: CalendarEvent) => {
    if (!currentUser) return;
    
    // Generate a temporary ID for optimistic update if not present
    const tempId = event.id || Math.random().toString(36).substr(2, 9);
    const eventWithId = { ...event, id: tempId };

    try {
      // Optimistic update
      setEvents((prev) => [...prev, eventWithId]);

      if (event.source === EventSource.LOCAL) {
          // Save to Firebase
          const created = await createPersonalEvent(currentUser.id, {
            title: event.title,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            description: event.description,
            location: event.location,
            color: event.color,
            allDay: event.isAllDay,
            type: event.type === 'availability' ? 'AVAILABILITY' : 'EVENT'
          });
          
          // Update ID with real ID from Firebase
          setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: created.id } : e));

          // Sync to Google Calendar if enabled
          if (integrations.google) {
              await syncPersonalEventToGoogleCalendar(created);
          }
      }

    } catch (e) {
      console.error("Failed to create event", e);
      // Rollback
      setEvents(prev => prev.filter(e => e.id !== tempId));
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (!currentUser) return;
    
    const originalEvents = [...events];
    
    try {
        setEvents((prev) => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        
        if (updatedEvent.source === EventSource.LOCAL) {
            await updatePersonalEvent(currentUser.id, updatedEvent.id, {
                title: updatedEvent.title,
                start: updatedEvent.start.toISOString(),
                end: updatedEvent.end.toISOString(),
                description: updatedEvent.description,
                location: updatedEvent.location,
                color: updatedEvent.color,
                allDay: updatedEvent.isAllDay,
                type: updatedEvent.type === 'availability' ? 'AVAILABILITY' : 'EVENT'
            });

            // Sync Update to Google Calendar if needed
            if (integrations.google && updatedEvent.sourceEventId) {
                await updatePersonalEventGoogleCalendar({
                    id: updatedEvent.id,
                    userId: currentUser.id,
                    title: updatedEvent.title,
                    start: updatedEvent.start.toISOString(),
                    end: updatedEvent.end.toISOString(),
                    description: updatedEvent.description,
                    location: updatedEvent.location,
                    createdAt: '', // Not needed for update
                    updatedAt: '', // Not needed for update
                    googleCalendarEventId: updatedEvent.sourceEventId
                });
            }
        }
    } catch (e) {
        console.error("Failed to update event", e);
        setEvents(originalEvents);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!currentUser) return;
    const eventToDelete = events.find(e => e.id === id);
    if (!eventToDelete) return;

    try {
      setEvents((prev) => prev.filter(e => e.id !== id));

      if (eventToDelete.source === EventSource.LOCAL) {
         // Check for Google ID before deleting
         if (integrations.google && eventToDelete.sourceEventId) {
             await deletePersonalEventGoogleCalendar(currentUser.id, eventToDelete.sourceEventId);
         }
         await deletePersonalEvent(currentUser.id, id);
      }
    } catch (e) {
        console.error("Failed to delete", e);
        setEvents(prev => [...prev, eventToDelete]);
    }
  };

  const closeGoogleAuthModal = () => setIsGoogleAuthModalOpen(false);

  const saveGoogleConfig = (newApiKey: string, clientId: string) => {
    const config = { apiKey: newApiKey, clientId };
    setGoogleConfig(config);
    localStorage.setItem('google_calendar_config', JSON.stringify(config));
    setIsGoogleAuthModalOpen(false);
    // Trigger sync immediately with new config
    toggleIntegration('google', config);
  };

  const toggleIntegration = async (source: 'google' | 'outlook', specificConfig?: {apiKey: string, clientId: string}) => {
    // If currently on, turn off and remove events
    if (integrations[source] && !specificConfig) {
      setIntegrations(prev => ({ ...prev, [source]: false }));
      const sourceType = source === 'google' ? EventSource.GOOGLE : EventSource.OUTLOOK;
      setEvents(prev => prev.filter(e => e.source !== sourceType));
      return;
    }

    // Turn ON
    setIsLoading(true);
    try {
      let newEvents: CalendarEvent[] = [];
      
      if (source === 'google') {
        // First check if we have Firebase credentials
        if (currentUser) {
            const googleCreds = await getGoogleCalendarCredentials(currentUser.id);
            if (googleCreds && googleCreds.googleCalendarConnected) {
                console.log("✅ Using Firebase credentials for Google Sync");
                const googleEvents = await getGoogleCalendarEvents(currentUser.id);
                newEvents = googleEvents.map((e: GoogleCalendarEvent) => ({
                    id: e.id,
                    title: e.summary || '(No Title)',
                    description: e.description,
                    start: new Date(e.start.dateTime || e.start.date || new Date().toISOString()),
                    end: new Date(e.end.dateTime || e.end.date || new Date().toISOString()),
                    isAllDay: !e.start.dateTime,
                    location: e.location,
                    source: EventSource.GOOGLE,
                    color: '#4285F4',
                    editable: false
                }));
                
                setEvents(prev => {
                    const filtered = prev.filter(e => e.source !== EventSource.GOOGLE);
                    return [...filtered, ...newEvents];
                });
                setIntegrations(prev => ({ ...prev, [source]: true }));
                setIsLoading(false);
                return;
            }
        }

        const configToUse = specificConfig || googleConfig;

        if (!configToUse) {
           setIsGoogleAuthModalOpen(true);
           setIsLoading(false);
           return;
        }

        try {
            await initializeGapiClient(configToUse.apiKey);
            await initializeGisClient(configToUse.clientId);
            await handleAuthClick(); // Opens Google Popup
            newEvents = await listUpcomingEvents();
        } catch (err: any) {
            console.error("Google Sync Error:", err);
            
            // Format friendly error
            let msg = "Échec de la synchronisation Google.";
            if (err.error === 'popup_closed_by_user') {
                msg = "Connexion annulée.";
            } else if (err.details) {
                msg += " " + err.details;
            } else if (err.message) {
                msg += " " + err.message;
            }

            // Only alert if it's not a user cancellation (which is common)
            if (err.error !== 'popup_closed_by_user') {
                 alert(msg + "\n\nVeuillez vérifier votre ID Client et votre Clé API.");
                 // If credentials seem wrong, clear them so user can re-enter
                 setGoogleConfig(null);
                 localStorage.removeItem('google_calendar_config');
            }
            
            setIsLoading(false);
            return; // Do not enable integration checkmark
        }

      } else {
        // Mock Outlook logic
        newEvents = await fetchMockOutlookEvents();
      }

      setEvents(prev => {
        // Remove existing events of this source to avoid duplicates if re-toggling
        const sourceType = source === 'google' ? EventSource.GOOGLE : EventSource.OUTLOOK;
        const filtered = prev.filter(e => e.source !== sourceType);
        return [...filtered, ...newEvents];
      });
      setIntegrations(prev => ({ ...prev, [source]: true }));
    } catch (e) {
      console.error("Failed to sync", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CalendarContext.Provider value={{
      date,
      setDate,
      view,
      setView,
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      integrations,
      toggleIntegration,
      isLoading,
      isGoogleAuthModalOpen,
      closeGoogleAuthModal,
      saveGoogleConfig,
      apiKey,
      availabilityMode,
      toggleAvailabilityMode
    }}>
      {children}
    </CalendarContext.Provider>
  );
};
