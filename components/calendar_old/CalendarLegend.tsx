import React from 'react';
import { EVENT_COLORS } from '../../services/calendarSyncService';

type FilterType = 'all' | 'APPOINTMENT' | 'GOOGLE' | 'OUTLOOK' | 'PERSONAL';

interface CalendarLegendProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const legendItems: { type: FilterType; label: string; color: string; description: string }[] = [
  {
    type: 'APPOINTMENT',
    label: 'Rendez-vous',
    color: EVENT_COLORS.APPOINTMENT,
    description: 'Consultations Jurilab',
  },
  {
    type: 'GOOGLE',
    label: 'Google Calendar',
    color: EVENT_COLORS.GOOGLE,
    description: 'Événements Google',
  },
  {
    type: 'OUTLOOK',
    label: 'Outlook',
    color: EVENT_COLORS.OUTLOOK,
    description: 'Événements Microsoft',
  },
  {
    type: 'PERSONAL',
    label: 'Personnel',
    color: EVENT_COLORS.PERSONAL,
    description: 'Événements personnels',
  },
];

export const CalendarLegend: React.FC<CalendarLegendProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
        Types d'événements
      </h3>

      <div className="space-y-2">
        {/* All option */}
        <button
          onClick={() => onFilterChange('all')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-100 dark:bg-slate-800'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-orange-500" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Tous les événements
            </p>
          </div>
          {activeFilter === 'all' && (
            <div className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>

        {/* Individual filters */}
        {legendItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onFilterChange(item.type)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeFilter === item.type
                ? 'bg-slate-100 dark:bg-slate-800'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {item.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </div>
            {activeFilter === item.type && (
              <div className="w-2 h-2 rounded-full bg-primary-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarLegend;
