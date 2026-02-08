import React, { useEffect, useRef, useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { format, isSameDay, getHours, getMinutes, differenceInMinutes, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarEvent } from '../../types/calendarTypes';

interface DayViewProps {
    onEventClick?: (event: CalendarEvent) => void;
    onTimeSlotClick?: (date: Date) => void;
}

export const DayView = ({ onEventClick, onTimeSlotClick }: DayViewProps) => {
  const { date, events, updateEvent } = useCalendar();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drag & Resize State
  const [dragState, setDragState] = useState<{
    type: 'resize' | 'move';
    event: CalendarEvent;
    startY: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
        const startHour = 8;
        const minutes = startHour * 60;
        const ratio = minutes / 1440;
        if (scrollContainerRef.current.scrollTop === 0) {
           scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight * ratio;
        }
    }
  }, [date]);

  // Handle Drag & Resize Interactions
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
        const dy = e.clientY - dragState.startY;
        const minutesDelta = Math.round(dy); 

        const snappedDelta = Math.round(minutesDelta / 15) * 15;

        if (dragState.type === 'resize') {
            const newEnd = addMinutes(dragState.originalEnd, snappedDelta);
            if (differenceInMinutes(newEnd, dragState.originalStart) >= 15) {
                 updateEvent({ ...dragState.event, end: newEnd });
            }
        } else if (dragState.type === 'move') {
            const newStart = addMinutes(dragState.originalStart, snappedDelta);
            const newEnd = addMinutes(dragState.originalEnd, snappedDelta);
            updateEvent({ ...dragState.event, start: newStart, end: newEnd });
        }
    };

    const handleMouseUp = () => {
        setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, updateEvent]);

  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
        type: 'resize',
        event,
        startY: e.clientY,
        originalStart: event.start,
        originalEnd: event.end
    });
  };

  const handleMoveStart = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
        type: 'move',
        event,
        startY: e.clientY,
        originalStart: event.start,
        originalEnd: event.end
    });
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startMinutes = getHours(event.start) * 60 + getMinutes(event.start);
    const duration = differenceInMinutes(event.end, event.start);
    return {
      top: `${(startMinutes / 1440) * 100}%`,
      height: `${(duration / 1440) * 100}%`,
      backgroundColor: event.color + '20', 
      borderLeftColor: event.color,
      color: event.color
    };
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (!dragState && onEventClick) {
        onEventClick(event);
    }
  };

  const handleSlotClick = (e: React.MouseEvent) => {
    if (!onTimeSlotClick) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = e.currentTarget.clientHeight;
    
    const ratio = clickY / height;
    const totalMinutes = ratio * 24 * 60;
    
    const roundedMinutes = Math.floor(totalMinutes / 30) * 30;
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, roundedMinutes, 0, 0);
    
    onTimeSlotClick(selectedDate);
  };

  const dayEvents = events.filter(e => isSameDay(e.start, date));

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex border-b border-gray-200 bg-white z-10">
        <div className="w-20 flex-shrink-0 border-r border-gray-100 bg-gray-50"></div>
        <div className="flex-1 text-center py-4">
            <div className={`text-lg font-semibold uppercase ${isSameDay(date, new Date()) ? 'text-rose-700' : 'text-gray-800'}`}>
                {format(date, 'EEEE d MMMM', { locale: fr })}
            </div>
        </div>
        <div className="w-4 flex-shrink-0"></div>
      </div>

      {/* Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-white">
         <div className="flex relative" style={{ height: '1440px' }}>
            {/* Time Labels */}
            <div className="w-20 flex-shrink-0 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 relative select-none h-full">
              {hours.map(hour => (
                <div key={hour} className="absolute w-full text-right pr-3 transform -translate-y-1/2" style={{ top: `${(hour / 24) * 100}%` }}>
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
              ))}
            </div>

            {/* Day Column */}
            <div 
                className="flex-1 relative h-full cursor-pointer hover:bg-gray-50/30 transition-colors"
                onClick={handleSlotClick}
            >
               {/* Horizontal Guidelines */}
               {hours.map(hour => (
                <div key={hour} className="absolute w-full border-t border-gray-100" style={{ top: `${(hour / 24) * 100}%` }}></div>
              ))}

                {/* Current Time Indicator (if today) */}
                {isSameDay(date, new Date()) && (
                    <div 
                        className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none"
                        style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 100}%` }}
                    >
                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                )}

                {dayEvents.map(event => (
                    <div
                        key={event.id}
                        className={`absolute inset-x-2 rounded-md border-l-4 p-2 text-sm overflow-hidden transition-all shadow-sm z-20 ${event.editable !== false ? 'cursor-move hover:brightness-95' : 'cursor-default'}`}
                        style={getEventStyle(event)}
                        onClick={(e) => handleEventClick(e, event)}
                        onMouseDown={(e) => event.editable !== false && handleMoveStart(e, event)}
                        title={`${event.title} (${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')})`}
                    >
                        <div className="font-bold pointer-events-none">{event.title}</div>
                        <div className="opacity-90 pointer-events-none">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>
                        {event.location && <div className="text-xs mt-1 opacity-75 truncate pointer-events-none">{event.location}</div>}
                        
                        {/* Resize Handle */}
                        {event.editable !== false && (
                            <div 
                                className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize z-30 hover:bg-black/10"
                                onMouseDown={(e) => handleResizeStart(e, event)}
                            />
                        )}
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};
