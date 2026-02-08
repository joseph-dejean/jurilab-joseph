import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UnifiedCalendarEvent } from '../../services/calendarSyncService';
import { CalendarToolbar } from './CalendarToolbar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface ProfessionalCalendarProps {
  events: UnifiedCalendarEvent[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  onSelectEvent: (event: UnifiedCalendarEvent) => void;
  onEventDrop: (event: UnifiedCalendarEvent, start: Date, end: Date) => void;
  onEventResize: (event: UnifiedCalendarEvent, start: Date, end: Date) => void;
}

export const ProfessionalCalendar: React.FC<ProfessionalCalendarProps> = ({
  events,
  currentDate,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
}) => {
  // Convert events to calendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end),
    }));
  }, [events]);

  // Event style getter
  const eventStyleGetter = useCallback((event: UnifiedCalendarEvent) => {
    const baseStyle = {
      backgroundColor: event.color || '#3b82f6',
      borderRadius: '6px',
      opacity: 1,
      color: 'white',
      border: 'none',
      display: 'block',
      fontSize: '13px',
      fontWeight: 500,
      padding: '2px 6px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    };

    // Add visual indicator for non-editable events
    if (!event.editable) {
      return {
        style: {
          ...baseStyle,
          opacity: 0.85,
          cursor: 'pointer',
        },
      };
    }

    return { style: baseStyle };
  }, []);

  // Day prop getter (for highlighting today)
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return {
        className: 'rbc-today-custom',
        style: {
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
        },
      };
    }
    return {};
  }, []);

  // Handle event drop
  const handleEventDrop = useCallback(
    ({ event, start, end }: { event: any; start: any; end: any }) => {
      if (!event.editable) return;
      onEventDrop(event as UnifiedCalendarEvent, start as Date, end as Date);
    },
    [onEventDrop]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    ({ event, start, end }: { event: any; start: any; end: any }) => {
      if (!event.editable) return;
      onEventResize(event as UnifiedCalendarEvent, start as Date, end as Date);
    },
    [onEventResize]
  );

  // Handle select slot
  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      onSelectSlot({ start: slotInfo.start as Date, end: slotInfo.end as Date });
    },
    [onSelectSlot]
  );

  // Handle select event
  const handleSelectEvent = useCallback(
    (event: any) => {
      onSelectEvent(event as UnifiedCalendarEvent);
    },
    [onSelectEvent]
  );

  // Custom event component
  const EventComponent = useCallback(({ event }: { event: UnifiedCalendarEvent }) => {
    const typeIcons: Record<string, string> = {
      APPOINTMENT: '📅',
      GOOGLE: '🟢',
      OUTLOOK: '🟠',
      PERSONAL: '🟣',
    };

    return (
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="text-xs">{typeIcons[event.type] || '📌'}</span>
        <span className="truncate">{event.title}</span>
      </div>
    );
  }, []);

  // Custom agenda event component
  const AgendaEventComponent = useCallback(({ event }: { event: UnifiedCalendarEvent }) => {
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color || '#3b82f6' }}
        />
        <span className="font-medium">{event.title}</span>
        {event.location && (
          <span className="text-slate-500 text-sm">• {event.location}</span>
        )}
      </div>
    );
  }, []);

  // Messages in French
  const messages = useMemo(
    () => ({
      allDay: 'Journée',
      previous: 'Précédent',
      next: 'Suivant',
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      agenda: 'Agenda',
      date: 'Date',
      time: 'Heure',
      event: 'Événement',
      noEventsInRange: 'Aucun événement dans cette période.',
      showMore: (total: number) => `+${total} de plus`,
    }),
    []
  );

  return (
    <div className="h-full professional-calendar">
      <DnDCalendar
        localizer={localizer}
        events={calendarEvents}
        date={currentDate}
        onNavigate={onNavigate}
        defaultView={Views.WEEK}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        step={30}
        timeslots={2}
        selectable
        resizable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={{
          toolbar: CalendarToolbar,
          event: EventComponent,
          agenda: {
            event: AgendaEventComponent,
          },
        }}
        messages={messages}
        culture="fr"
        min={new Date(0, 0, 0, 6, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        popup
        popupOffset={10}
        showMultiDayTimes
        scrollToTime={new Date(0, 0, 0, 8, 0, 0)}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default ProfessionalCalendar;
