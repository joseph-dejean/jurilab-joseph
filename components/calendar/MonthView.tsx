import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import { CalendarEvent } from '../../types/calendarTypes';

interface MonthViewProps {
    onEventClick?: (event: CalendarEvent) => void;
}

export const MonthView = ({ onEventClick }: MonthViewProps) => {
  const { date, setDate, events } = useCalendar();
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (onEventClick) {
        onEventClick(event);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
            </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-5">
        {days.map((d, i) => {
            const dayEvents = events.filter(e => isSameDay(e.start, d));
            const isToday = isSameDay(d, new Date());
            const isCurrentMonth = isSameMonth(d, monthStart);

            return (
                <div 
                    key={i} 
                    onClick={() => setDate(d)}
                    className={`
                        border-b border-r border-gray-100 p-1 lg:p-2 min-h-[80px] relative transition-colors hover:bg-gray-50 cursor-pointer
                        ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                    `}
                >
                    <div className="flex justify-center lg:justify-start mb-1">
                        <span className={`
                            w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                            ${isToday ? 'bg-rose-700 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                        `}>
                            {format(d, 'd')}
                        </span>
                    </div>

                    <div className="space-y-1 hidden lg:block overflow-y-auto max-h-[100px]">
                        {dayEvents.slice(0, 4).map(event => (
                            <div 
                                key={event.id}
                                onClick={(e) => handleEventClick(e, event)}
                                className="px-1.5 py-0.5 rounded text-xs truncate font-medium border-l-2 shadow-sm hover:brightness-95 transition-all"
                                style={{ 
                                    backgroundColor: event.color + '15', 
                                    borderLeftColor: event.color,
                                    color: event.color
                                }}
                            >
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 4 && (
                            <div className="text-xs text-gray-400 pl-1">+ {dayEvents.length - 4} autres</div>
                        )}
                    </div>
                    
                    {/* Mobile dots for events */}
                    <div className="lg:hidden flex justify-center gap-0.5 mt-1">
                        {dayEvents.slice(0,3).map(e => (
                             <div key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }}></div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
