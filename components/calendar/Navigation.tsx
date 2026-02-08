import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarViewType } from '../../types/calendarTypes';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export const Navigation = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { date, setDate, view, setView } = useCalendar();

  const handlePrev = () => {
    if (view === CalendarViewType.MONTH) setDate(subMonths(date, 1));
    else if (view === CalendarViewType.WEEK) setDate(subWeeks(date, 1));
    else setDate(subDays(date, 1));
  };

  const handleNext = () => {
    if (view === CalendarViewType.MONTH) setDate(addMonths(date, 1));
    else if (view === CalendarViewType.WEEK) setDate(addWeeks(date, 1));
    else setDate(addDays(date, 1));
  };

  const handleToday = () => setDate(new Date());

  const dateFormat = view === CalendarViewType.MONTH ? 'MMMM yyyy' : 'MMMM yyyy';

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 justify-between flex-shrink-0 z-20 relative">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-full lg:hidden">
            <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2 text-rose-700">
          <span className="text-2xl font-bold tracking-tight">Calendrier</span>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-8">
            <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
              Aujourd'hui
            </button>
            <div className="flex items-center rounded-md border border-gray-200 shadow-sm bg-white">
                <button onClick={handlePrev} className="p-1.5 hover:bg-gray-50 text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={handleNext} className="p-1.5 hover:bg-gray-50 text-gray-500"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 ml-2 w-48 capitalize">
              {format(date, dateFormat, { locale: fr })}
            </h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setView(CalendarViewType.MONTH)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${view === CalendarViewType.MONTH ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Mois
            </button>
            <button
                onClick={() => setView(CalendarViewType.WEEK)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${view === CalendarViewType.WEEK ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Semaine
            </button>
            <button
                onClick={() => setView(CalendarViewType.DAY)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${view === CalendarViewType.DAY ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Jour
            </button>
        </div>
      </div>
    </header>
  );
};
