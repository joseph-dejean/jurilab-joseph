import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../store/store';
import { Calendar, Clock } from 'lucide-react';

interface BookingCalendarProps {
  availableSlots: string[]; // ISO date strings
  onSlotSelect: (slot: Date | null) => void;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ availableSlots, onSlotSelect }) => {
  const { t } = useApp();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const availableDays = useMemo(() => {
    return availableSlots.map(slot => startOfDay(parseISO(slot)));
  }, [availableSlots]);

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return availableSlots
      .map(slot => parseISO(slot))
      .filter(date => isSameDay(date, selectedDay))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [selectedDay, availableSlots]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSelectedSlot(null);
    onSlotSelect(null);
  };

  const handleSlotClick = (slot: Date) => {
    setSelectedSlot(slot);
    onSlotSelect(slot);
  };

  // Group slots by morning/afternoon
  const morningSlots = slotsForSelectedDay.filter(s => s.getHours() < 12);
  const afternoonSlots = slotsForSelectedDay.filter(s => s.getHours() >= 12);

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-surface-50 dark:bg-deep-800 rounded-2xl p-4 border border-surface-100 dark:border-deep-700">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay as any}
          onDayClick={handleDayClick}
          modifiers={{ available: availableDays }}
          modifiersClassNames={{
            available: '!bg-primary-100 dark:!bg-primary-900/30 !rounded-xl font-semibold',
            selected: '!bg-primary-500 !text-white !rounded-xl',
          }}
          locale={fr}
          showOutsideDays
          fixedWeeks
          className="!font-sans"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center mb-4',
            caption_label: 'text-base font-semibold text-deep-900 dark:text-surface-100',
            nav: 'space-x-1 flex items-center',
            nav_button: 'h-8 w-8 bg-transparent p-0 hover:bg-surface-100 dark:hover:bg-deep-700 rounded-lg transition-colors inline-flex items-center justify-center',
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'text-deep-400 dark:text-surface-600 rounded-md w-10 font-medium text-xs uppercase',
            row: 'flex w-full mt-1',
            cell: 'text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
            day: 'h-10 w-10 p-0 font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-deep-700 transition-colors inline-flex items-center justify-center',
            day_selected: '!bg-primary-500 !text-white hover:!bg-primary-600',
            day_today: 'ring-2 ring-primary-500 ring-inset',
            day_outside: 'text-deep-300 dark:text-deep-600 opacity-50',
            day_disabled: 'text-deep-300 dark:text-deep-600',
          }}
        />
      </div>
      
      {/* Time Slots */}
      {selectedDay && (
        <div className="bg-surface-50 dark:bg-deep-800 rounded-2xl p-4 border border-surface-100 dark:border-deep-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary-500" />
            <h4 className="font-semibold text-deep-900 dark:text-surface-100">
              {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
            </h4>
          </div>

          {slotsForSelectedDay.length > 0 ? (
            <div className="space-y-4">
              {/* Morning Slots */}
              {morningSlots.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-2">
                    Matin
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {morningSlots.map(slot => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          selectedSlot && selectedSlot.getTime() === slot.getTime() 
                            ? 'bg-primary-500 text-white shadow-glow' 
                            : 'bg-white dark:bg-deep-900 text-deep-700 dark:text-surface-300 border border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                        }`}
                      >
                        {format(slot, 'HH:mm')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Slots */}
              {afternoonSlots.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-2">
                    Après-midi
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {afternoonSlots.map(slot => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          selectedSlot && selectedSlot.getTime() === slot.getTime() 
                            ? 'bg-primary-500 text-white shadow-glow' 
                            : 'bg-white dark:bg-deep-900 text-deep-700 dark:text-surface-300 border border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                        }`}
                      >
                        {format(slot, 'HH:mm')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 mx-auto text-deep-300 dark:text-deep-600 mb-2" />
              <p className="text-sm text-deep-500 dark:text-surface-500">
                {t.booking.noSlots}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selection indicator */}
      {!selectedDay && (
        <div className="text-center py-4 text-sm text-deep-500 dark:text-surface-500">
          <Calendar className="w-5 h-5 mx-auto mb-2" />
          {t.booking.selectDay}
        </div>
      )}
    </div>
  );
};
