import React, { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { AIAssistant } from './AIAssistant';
import { CalendarViewType, CalendarEvent } from '../../types/calendarTypes';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailsModal } from './EventDetailsModal';
import { GoogleSyncModal } from './GoogleSyncModal';

export const CalendarApp = () => {
  const { view } = useCalendar();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [initialDate, setInitialDate] = useState<{ start: Date; end: Date } | undefined>(undefined);

  const handleTimeSlotClick = (date: Date) => {
    const end = new Date(date);
    end.setHours(end.getHours() + 1);
    setInitialDate({ start: date, end });
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setInitialDate(undefined);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <Navigation toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
            isOpen={sidebarOpen} 
            closeSidebar={() => setSidebarOpen(false)} 
            onOpenCreateModal={handleOpenCreateModal}
        />
        
        <main className="flex-1 h-full overflow-hidden relative w-full">
            {/* Overlay when sidebar is open on mobile */}
            {sidebarOpen && (
                <div 
                    className="absolute inset-0 bg-black/20 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {view === CalendarViewType.MONTH && <MonthView onEventClick={setSelectedEvent} />}
            {view === CalendarViewType.WEEK && <WeekView onEventClick={setSelectedEvent} onTimeSlotClick={handleTimeSlotClick} />}
            {view === CalendarViewType.DAY && <DayView onEventClick={setSelectedEvent} onTimeSlotClick={handleTimeSlotClick} />}
        </main>
      </div>
      
      <AIAssistant />
      <CreateEventModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        initialStart={initialDate?.start}
        initialEnd={initialDate?.end}
      />
      <EventDetailsModal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} event={selectedEvent} />
      <GoogleSyncModal />
    </div>
  );
};
