import React from 'react';
import { ToolbarProps, Navigate, View } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange, List } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomToolbarProps extends ToolbarProps {
  localizer?: { messages: any };
}

export const CalendarToolbar: React.FC<CustomToolbarProps> = ({
  date,
  view,
  views,
  onNavigate,
  onView,
  label,
}) => {
  const viewOptions: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'month', label: 'Mois', icon: <Calendar className="w-4 h-4" /> },
    { key: 'week', label: 'Semaine', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'day', label: 'Jour', icon: <CalendarRange className="w-4 h-4" /> },
    { key: 'agenda', label: 'Agenda', icon: <List className="w-4 h-4" /> },
  ];

  const availableViews = Array.isArray(views) ? views : Object.keys(views || {});

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(Navigate.TODAY)}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Aujourd'hui
        </button>
        
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => onNavigate(Navigate.PREVIOUS)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l-lg transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => onNavigate(Navigate.NEXT)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-r-lg transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Current Date Label */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
        {format(date, view === 'day' ? 'EEEE d MMMM yyyy' : 'MMMM yyyy', { locale: fr })}
      </h2>

      {/* View Switcher */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {viewOptions
          .filter((v) => availableViews.includes(v.key))
          .map((v) => (
            <button
              key={v.key}
              onClick={() => onView(v.key)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                view === v.key
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
      </div>
    </div>
  );
};

export default CalendarToolbar;
