import React, { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { isSameDay, startOfDay } from 'date-fns';
import { UnifiedCalendarEvent } from '../../services/calendarSyncService';
import 'react-day-picker/dist/style.css';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: UnifiedCalendarEvent[];
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onDateSelect,
  events = [],
}) => {
  // Get days with events
  const daysWithEvents = useMemo(() => {
    const days = new Set<string>();
    events.forEach((event) => {
      const dateStr = startOfDay(event.start).toISOString();
      days.add(dateStr);
    });
    return Array.from(days).map((d) => new Date(d));
  }, [events]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        modifiers={{
          hasEvent: daysWithEvents,
        }}
        modifiersClassNames={{
          hasEvent: 'has-event',
          selected: '!bg-primary-500 !text-white !rounded-lg',
          today: '!font-bold !text-primary-600 dark:!text-primary-400',
        }}
        locale={fr}
        showOutsideDays
        fixedWeeks
        className="!font-sans mini-calendar"
        classNames={{
          months: 'flex flex-col',
          month: 'space-y-2',
          caption: 'flex justify-center pt-1 relative items-center mb-2',
          caption_label: 'text-sm font-semibold text-slate-900 dark:text-white capitalize',
          nav: 'space-x-1 flex items-center',
          nav_button:
            'h-7 w-7 bg-transparent p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center text-slate-600 dark:text-slate-400',
          nav_button_previous: 'absolute left-0',
          nav_button_next: 'absolute right-0',
          table: 'w-full border-collapse',
          head_row: 'flex',
          head_cell:
            'text-slate-400 dark:text-slate-500 rounded-md w-8 font-medium text-[10px] uppercase',
          row: 'flex w-full mt-1',
          cell: 'text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
          day: 'h-8 w-8 p-0 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center text-slate-900 dark:text-slate-100',
          day_selected: '!bg-primary-500 !text-white hover:!bg-primary-600',
          day_today: 'ring-1 ring-primary-500 ring-inset',
          day_outside: 'text-slate-300 dark:text-slate-600 opacity-50',
          day_disabled: 'text-slate-300 dark:text-slate-600',
        }}
      />
      
      {/* Legend for mini calendar */}
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          <span className="text-[10px] text-slate-500">Aujourd'hui</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span className="text-[10px] text-slate-500">Événement</span>
        </div>
      </div>
    </div>
  );
};

export default MiniCalendar;
