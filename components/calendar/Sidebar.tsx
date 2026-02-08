import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, Plus, Loader2, Clock } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    closeSidebar: () => void;
    onOpenCreateModal: () => void;
}

export const Sidebar = ({ isOpen, closeSidebar, onOpenCreateModal }: SidebarProps) => {
  const { date, setDate, integrations, toggleIntegration, isLoading, availabilityMode, toggleAvailabilityMode } = useCalendar();
  const [miniDate, setMiniDate] = React.useState(new Date());

  const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const monthStart = startOfMonth(miniDate);
  const monthEnd = endOfMonth(miniDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
    `}>
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Create Button */}
        <button 
            className="w-full bg-white border border-gray-200 shadow-sm text-gray-700 font-medium py-3 px-4 rounded-full flex items-center justify-center gap-2 hover:shadow-md transition-shadow mb-8"
            onClick={onOpenCreateModal}
        >
            <Plus className="w-6 h-6 text-rose-700" />
            <span className="text-lg">Créer</span>
        </button>

        {/* Mini Calendar */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-sm font-semibold text-gray-700 capitalize">
                    {format(miniDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => setMiniDate(subMonths(miniDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map(d => <span key={d} className="text-xs font-medium text-gray-400">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => setDate(d)}
                        className={`
                            h-7 w-7 rounded-full text-xs flex items-center justify-center transition-colors
                            ${!isSameMonth(d, miniDate) ? 'text-gray-300' : 'text-gray-700'}
                            ${isSameDay(d, date) ? 'bg-rose-700 text-white font-bold' : 'hover:bg-gray-100'}
                        `}
                    >
                        {format(d, 'd')}
                    </button>
                ))}
            </div>
        </div>

        {/* My Calendars */}
        <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Mes Agendas</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer">
                    <div className="w-4 h-4 rounded border border-emerald-500 bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700">Personnel</span>
                </div>
            </div>
        </div>

        {/* Availability Mode */}
        <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Paramètres</h3>
            <div 
                onClick={toggleAvailabilityMode}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer group"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${availabilityMode ? 'bg-rose-600' : 'bg-gray-300'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${availabilityMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-rose-700 transition-colors flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Mode Disponibilité
                    </span>
                </div>
            </div>
        </div>

        {/* Integrations */}
        <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Intégrations</h3>
            <div className="space-y-2">
                <div 
                    onClick={() => toggleIntegration('google')}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${integrations.google ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                            {integrations.google && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">Google Agenda</span>
                    </div>
                    {isLoading && !integrations.google && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                </div>

                <div 
                    onClick={() => toggleIntegration('outlook')}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${integrations.outlook ? 'bg-sky-600 border-sky-600' : 'border-gray-300'}`}>
                            {integrations.outlook && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-sky-600 transition-colors">Outlook</span>
                    </div>
                    {isLoading && !integrations.outlook && <Loader2 className="w-3 h-3 text-sky-600 animate-spin" />}
                </div>
            </div>
        </div>
      </div>
      
      {/* Mobile close overlay */}
      <button onClick={closeSidebar} className="lg:hidden absolute top-4 right-4 p-2 text-gray-500">
        <ChevronLeft className="w-6 h-6" />
      </button>
    </aside>
  );
};
