import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, Event as CalendarEvent, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addDays, startOfDay, addMinutes, setHours, setMinutes, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { AvailabilityHours, DayAvailability, TimeSlot } from '../types';
import { saveAvailabilityHours, getAvailabilityHours, getGoogleCalendarEvents } from '../services/firebaseService';
import { Button } from './Button';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../store/store';

// Setup the localizer for date-fns
const locales = {
    'fr': fr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarAvailabilityProps {
    lawyerId: string;
}

// Custom event type to distinguish between availability and external events
interface CustomEvent extends CalendarEvent {
    id?: string;
    type: 'AVAILABILITY' | 'EXTERNAL';
    isDraggable?: boolean;
}

const DEFAULT_AVAILABILITY: AvailabilityHours = {
    monday: { enabled: false, timeSlots: [] },
    tuesday: { enabled: false, timeSlots: [] },
    wednesday: { enabled: false, timeSlots: [] },
    thursday: { enabled: false, timeSlots: [] },
    friday: { enabled: false, timeSlots: [] },
    saturday: { enabled: false, timeSlots: [] },
    sunday: { enabled: false, timeSlots: [] },
};

const DAY_KEY_MAP: { [key: number]: keyof AvailabilityHours } = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
};

const DnDCalendar = withDragAndDrop(Calendar);

export const CalendarAvailability: React.FC<CalendarAvailabilityProps> = ({ lawyerId }) => {
    const [events, setEvents] = useState<CustomEvent[]>([]);
    const [availability, setAvailability] = useState<AvailabilityHours>(DEFAULT_AVAILABILITY);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingExternal, setIsFetchingExternal] = useState(false);
    const { currentUser } = useApp();
    const isLawyer = currentUser?.role === 'LAWYER';
    const googleCalendarConnected = isLawyer ? (currentUser as any).googleCalendarConnected : false;

    // Helper to convert availability object to calendar events
    const availabilityToEvents = useCallback((avail: AvailabilityHours): CustomEvent[] => {
        const newEvents: CustomEvent[] = [];
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

        Object.entries(avail).forEach(([dayKey, dayData]) => {
            // Find the day index for this key
            let dayIndex = 1; // Default Monday
            switch (dayKey) {
                case 'monday': dayIndex = 1; break;
                case 'tuesday': dayIndex = 2; break;
                case 'wednesday': dayIndex = 3; break;
                case 'thursday': dayIndex = 4; break;
                case 'friday': dayIndex = 5; break;
                case 'saturday': dayIndex = 6; break;
                case 'sunday': dayIndex = 0; break;
            }

            // Calculate the date for this day in the current week
            // We want to project the availability onto the *current week* for visualization
            // Note: In a real recurring model, we might want to show this for *any* week.
            // Here we just use the current week as a canvas.
            const targetDate = addDays(startOfCurrentWeek, (dayIndex - 1 + 7) % 7);

            if (dayData.enabled && dayData.timeSlots) {
                dayData.timeSlots.forEach((slot, index) => {
                    const [startHour, startMinute] = slot.start.split(':').map(Number);
                    const [endHour, endMinute] = slot.end.split(':').map(Number);

                    const startDate = setMinutes(setHours(targetDate, startHour), startMinute);
                    const endDate = setMinutes(setHours(targetDate, endHour), endMinute);

                    newEvents.push({
                        id: `avail-${dayKey}-${index}`,
                        title: 'Disponible',
                        start: startDate,
                        end: endDate,
                        type: 'AVAILABILITY',
                        isDraggable: true,
                    });
                });
            }
        });
        return newEvents;
    }, []);

    // Helper to convert calendar events back to availability object
    const eventsToAvailability = useCallback((currentEvents: CustomEvent[]): AvailabilityHours => {
        const newAvailability: AvailabilityHours = JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY));

        currentEvents.forEach(event => {
            if (event.type === 'AVAILABILITY' && event.start && event.end) {
                const dayIndex = getDay(event.start);
                const dayKey = DAY_KEY_MAP[dayIndex];

                if (dayKey) {
                    const startStr = format(event.start, 'HH:mm');
                    const endStr = format(event.end, 'HH:mm');

                    newAvailability[dayKey].enabled = true;
                    newAvailability[dayKey].timeSlots.push({
                        start: startStr,
                        end: endStr
                    });
                }
            }
        });

        // Sort slots by start time
        Object.keys(newAvailability).forEach(k => {
            const key = k as keyof AvailabilityHours;
            newAvailability[key].timeSlots.sort((a, b) => a.start.localeCompare(b.start));
        });

        return newAvailability;
    }, []);


    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                // Load stored availability
                const saved = await getAvailabilityHours(lawyerId);

                // Merge with defaults
                const mergedAvailability: AvailabilityHours = { ...DEFAULT_AVAILABILITY };
                if (saved) {
                    for (const day of Object.keys(DEFAULT_AVAILABILITY) as (keyof AvailabilityHours)[]) {
                        if (saved[day]) {
                            mergedAvailability[day] = {
                                enabled: saved[day].enabled ?? DEFAULT_AVAILABILITY[day].enabled,
                                timeSlots: Array.isArray(saved[day].timeSlots) ? saved[day].timeSlots : DEFAULT_AVAILABILITY[day].timeSlots,
                            };
                        }
                    }
                }

                setAvailability(mergedAvailability);
                const availEvents = availabilityToEvents(mergedAvailability);

                // Load external events (Google Calendar)
                let externalEvents: CustomEvent[] = [];
                if (googleCalendarConnected) {
                    console.log("Fetching Google Calendar events for overlay...");
                    setIsFetchingExternal(true);
                    try {
                        // Fetch for the current week
                        const now = new Date();
                        const start = startOfWeek(now, { weekStartsOn: 1 });
                        const end = addDays(start, 7);

                        // Note: we're using a service that might fetch more, but we filter for display if needed.
                        // Ideally getGoogleCalendarEvents should accept a range, but the current implementation 
                        // (checked in README) fetches for "upcoming". We might need to adjust or just use what it returns.
                        // Looking at services/googleCalendarService.ts (from memory/context), it fetches a default range.
                        // Let's rely on what it returns and map it.

                        const gEvents = await getGoogleCalendarEvents(lawyerId);
                        if (gEvents) {
                            externalEvents = gEvents.map((ge: any) => ({
                                id: ge.id,
                                title: 'Occupé (Google Agenda)',
                                start: new Date(ge.start.dateTime || ge.start.date),
                                end: new Date(ge.end.dateTime || ge.end.date),
                                type: 'EXTERNAL',
                                allDay: !ge.start.dateTime, // if no time, it's all day
                            }));
                        }
                    } catch (err) {
                        console.error("Error fetching Google events:", err);
                    } finally {
                        setIsFetchingExternal(false);
                    }
                }

                setEvents([...availEvents, ...externalEvents]);

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [lawyerId, currentUser, availabilityToEvents]);

    const handleSelectSlot = ({ start, end }: SlotInfo) => {
        // Create new availability slot
        const newEvent: CustomEvent = {
            title: 'Disponible',
            start: start as Date,
            end: end as Date,
            type: 'AVAILABILITY'
        };

        // Optimistically update events
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);

        // Update availability state
        // Note: We reconstruct 'availability' from 'events' because 'events' is the source of truth for the UI
        const newAvail = eventsToAvailability(updatedEvents.filter(e => e.type === 'AVAILABILITY'));
        setAvailability(newAvail);
    };

    const handleSelectEvent = (event: CustomEvent) => {
        if (event.type === 'AVAILABILITY') {
            const confirmDelete = window.confirm('Supprimer ce créneau de disponibilité ?');
            if (confirmDelete) {
                const updatedEvents = events.filter(e => e.id !== event.id);
                setEvents(updatedEvents);
                const newAvail = eventsToAvailability(updatedEvents.filter(e => e.type === 'AVAILABILITY'));
                setAvailability(newAvail);
            }
        } else {
            alert('Ceci est un événement externe (Google Agenda). Vous ne pouvez pas le modifier ici.');
        }
    };

    const moveEvent = useCallback(({ event, start, end }: { event: CustomEvent; start: any; end: any }) => {
        if (event.type === 'EXTERNAL') return;

        setEvents((prev) => {
            const existing = prev.find((ev) => ev.id === event.id) ?? event;
            const filtered = prev.filter((ev) => ev.id !== event.id);
            const updated = [...filtered, { ...existing, start, end }];

            // Sync with availability
            const newAvail = eventsToAvailability(updated.filter(e => e.type === 'AVAILABILITY'));
            setAvailability(newAvail);

            return updated;
        });
    }, [eventsToAvailability]);

    const resizeEvent = useCallback(({ event, start, end }: { event: CustomEvent; start: any; end: any }) => {
        if (event.type === 'EXTERNAL') return;

        setEvents((prev) => {
            const existing = prev.find((ev) => ev.id === event.id) ?? event;
            const filtered = prev.filter((ev) => ev.id !== event.id);
            const updated = [...filtered, { ...existing, start, end }];

            // Sync with availability
            const newAvail = eventsToAvailability(updated.filter(e => e.type === 'AVAILABILITY'));
            setAvailability(newAvail);

            return updated;
        });
    }, [eventsToAvailability]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await saveAvailabilityHours(lawyerId, availability);
            alert('✅ Disponibilités mises à jour avec succès !');
        } catch (error) {
            console.error('Error saving:', error);
            alert('❌ Erreur lors de la sauvegarde.');
        } finally {
            setIsSaving(false);
        }
    };

    const eventStyleGetter = (event: CustomEvent) => {
        let style = {
            backgroundColor: '#3b82f6', // blue-500
            borderRadius: '4px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block'
        };

        if (event.type === 'EXTERNAL') {
            style.backgroundColor = '#ef4444'; // red-500 for busy
            style.opacity = 0.6;
        }

        return { style };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                <span className="ml-2 text-slate-500">Chargement du calendrier...</span>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gérer mes disponibilités</h3>
                    <p className="text-sm text-slate-500">
                        Cliquez et glissez pour ajouter des créneaux. Cliquez sur un créneau pour le supprimer.
                        {googleCalendarConnected && (
                            <span className="ml-1 text-red-500 font-medium">• Les événements rouges proviennent de Google Agenda.</span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </div>

            <div className="h-[600px]">
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    // @ts-ignore - react-big-calendar types are strict about accessors
                    startAccessor="start"
                    // @ts-ignore
                    endAccessor="end"
                    style={{ height: '100%' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    resizable
                    defaultView={Views.WEEK}
                    views={['week', 'day']}
                    step={30}
                    timeslots={2}
                    eventPropGetter={eventStyleGetter}
                    messages={{
                        next: "Suivant",
                        previous: "Précédent",
                        today: "Aujourd'hui",
                        month: "Mois",
                        week: "Semaine",
                        day: "Jour",
                        agenda: "Agenda",
                        date: "Date",
                        time: "Heure",
                        event: "Événement",
                        noEventsInRange: "Aucun événement dans cette période.",
                    }}
                    min={new Date(0, 0, 0, 7, 0, 0)} // Start at 7am
                    max={new Date(0, 0, 0, 21, 0, 0)} // End at 9pm
                />
            </div>

            <div className="text-xs text-slate-400 mt-2">
                * Ces disponibilités sont récurrentes (se répètent chaque semaine).
            </div>
        </div>
    );
};
