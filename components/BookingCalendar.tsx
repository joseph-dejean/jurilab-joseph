import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO, startOfDay, isSameDay, addDays, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../store/store';
import { Calendar, Clock, ChevronLeft, ChevronRight, Sun, Moon, AlertCircle } from 'lucide-react';
import { AvailabilityHours } from '../types';

interface BookingCalendarProps {
  availableSlots: string[]; // ISO date strings
  onSlotSelect: (slot: Date | null) => void;
  availabilityHours?: AvailabilityHours;
}

// Map day index (0-6, Sunday-Saturday) to availability key
const DAY_INDEX_TO_KEY: Record<number, keyof AvailabilityHours> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
  availableSlots, 
  onSlotSelect,
  availabilityHours 
}) => {
  const { t } = useApp();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Calculate which days have availability based on availabilityHours
  const availableDays = useMemo(() => {
    const days: Date[] = [];
    const today = startOfDay(new Date());
    
    // Check next 60 days
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      const dayIndex = getDay(date);
      const dayKey = DAY_INDEX_TO_KEY[dayIndex];
      
      if (availabilityHours && availabilityHours[dayKey]?.enabled && 
          availabilityHours[dayKey]?.timeSlots?.length > 0) {
        days.push(date);
      }
    }
    
    // Also add days from availableSlots for backwards compatibility
    availableSlots.forEach(slot => {
      const slotDate = startOfDay(parseISO(slot));
      if (!days.some(d => isSameDay(d, slotDate))) {
        days.push(slotDate);
      }
    });
    
    return days;
  }, [availableSlots, availabilityHours]);

  // Get slots for the selected day
  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    
    // First try to get slots from availableSlots array
    const slotsFromArray = availableSlots
      .map(slot => parseISO(slot))
      .filter(date => isSameDay(date, selectedDay))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (slotsFromArray.length > 0) {
      return slotsFromArray;
    }
    
    // If no slots in array, generate from availabilityHours
    if (availabilityHours) {
      const dayIndex = getDay(selectedDay);
      const dayKey = DAY_INDEX_TO_KEY[dayIndex];
      const dayAvailability = availabilityHours[dayKey];
      
      if (dayAvailability?.enabled && dayAvailability.timeSlots?.length > 0) {
        const slots: Date[] = [];
        const now = new Date();
        
        dayAvailability.timeSlots.forEach(timeSlot => {
          const [startHour, startMinute] = timeSlot.start.split(':').map(Number);
          const [endHour, endMinute] = timeSlot.end.split(':').map(Number);
          
          // Generate 30-minute slots within this time range
          let currentHour = startHour;
          let currentMinute = startMinute;
          
          while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const slotDate = new Date(selectedDay);
            slotDate.setHours(currentHour, currentMinute, 0, 0);
            
            // Only add future slots
            if (slotDate > now) {
              slots.push(slotDate);
            }
            
            // Advance by 30 minutes
            currentMinute += 30;
            if (currentMinute >= 60) {
              currentMinute = 0;
              currentHour++;
            }
          }
        });
        
        return slots.sort((a, b) => a.getTime() - b.getTime());
      }
    }
    
    return [];
  }, [selectedDay, availableSlots, availabilityHours]);

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
  const afternoonSlots = slotsForSelectedDay.filter(s => s.getHours() >= 12 && s.getHours() < 18);
  const eveningSlots = slotsForSelectedDay.filter(s => s.getHours() >= 18);

  // Check if lawyer has set up availability
  const hasAvailability = availableDays.length > 0;

  // Format the month/year for display
  const monthYearLabel = format(currentMonth, 'MMMM yyyy', { locale: fr });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold text-deep-900 dark:text-surface-100 capitalize">
          {monthYearLabel}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-deep-500" />
          </button>
          <button
            onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-deep-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-deep-500" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-deep-900 rounded-xl p-3 border border-surface-200 dark:border-deep-700">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay as any}
          onDayClick={handleDayClick}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={{ 
            available: availableDays,
            disabled: (date) => !availableDays.some(d => isSameDay(d, date))
          }}
          modifiersClassNames={{
            available: 'booking-available-day',
            selected: 'booking-selected-day',
          }}
          disabled={(date) => date < startOfDay(new Date()) || !availableDays.some(d => isSameDay(d, date))}
          locale={fr}
          showOutsideDays={false}
          className="!font-sans booking-calendar"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-2',
            caption: 'hidden',
            nav: 'hidden',
            table: 'w-full border-collapse',
            head_row: 'flex justify-between mb-1',
            head_cell: 'text-deep-400 dark:text-surface-600 w-9 font-medium text-[10px] uppercase text-center',
            row: 'flex justify-between mt-0.5',
            cell: 'text-center text-sm p-0 relative',
            day: 'h-9 w-9 p-0 font-medium rounded-lg transition-all duration-150 inline-flex items-center justify-center text-sm',
            day_selected: '!bg-primary-600 !text-white hover:!bg-primary-700 !font-bold',
            day_today: 'ring-2 ring-primary-400 ring-inset',
            day_outside: 'hidden',
            day_disabled: 'text-deep-200 dark:text-deep-700 cursor-not-allowed opacity-40',
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-deep-500 dark:text-surface-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary-100 dark:bg-primary-900/40 border border-primary-300 dark:border-primary-700" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary-600" />
          <span>Sélectionné</span>
        </div>
      </div>
      
      {/* Time Slots */}
      {selectedDay && (
        <div className="bg-white dark:bg-deep-900 rounded-xl p-4 border border-surface-200 dark:border-deep-700 animate-fade-in">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-100 dark:border-deep-800">
            <Clock className="w-4 h-4 text-primary-500" />
            <h4 className="font-semibold text-deep-900 dark:text-surface-100 capitalize">
              {format(selectedDay, 'EEEE d MMMM', { locale: fr })}
            </h4>
          </div>

          {slotsForSelectedDay.length > 0 ? (
            <div className="space-y-4">
              {/* Morning Slots */}
              {morningSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-medium text-deep-500 dark:text-surface-500">
                      Matin
                    </p>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {morningSlots.map(slot => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          selectedSlot && selectedSlot.getTime() === slot.getTime() 
                            ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-300' 
                            : 'bg-surface-50 dark:bg-deep-800 text-deep-700 dark:text-surface-300 border border-surface-200 dark:border-deep-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
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
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                    <p className="text-xs font-medium text-deep-500 dark:text-surface-500">
                      Après-midi
                    </p>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {afternoonSlots.map(slot => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          selectedSlot && selectedSlot.getTime() === slot.getTime() 
                            ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-300' 
                            : 'bg-surface-50 dark:bg-deep-800 text-deep-700 dark:text-surface-300 border border-surface-200 dark:border-deep-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
                        }`}
                      >
                        {format(slot, 'HH:mm')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evening Slots */}
              {eveningSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-xs font-medium text-deep-500 dark:text-surface-500">
                      Soir
                    </p>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                    {eveningSlots.map(slot => (
                      <button
                        key={slot.toISOString()}
                        onClick={() => handleSlotClick(slot)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          selectedSlot && selectedSlot.getTime() === slot.getTime() 
                            ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-300' 
                            : 'bg-surface-50 dark:bg-deep-800 text-deep-700 dark:text-surface-300 border border-surface-200 dark:border-deep-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30'
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
            <div className="text-center py-4">
              <Calendar className="w-8 h-8 mx-auto text-deep-200 dark:text-deep-700 mb-2" />
              <p className="text-sm text-deep-400 dark:text-surface-600">
                Aucun créneau disponible ce jour
              </p>
            </div>
          )}
        </div>
      )}

      {/* No availability message */}
      {!hasAvailability && (
        <div className="text-center py-6 px-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Cet avocat n'a pas encore configuré ses disponibilités
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            Vous pouvez lui envoyer un message pour convenir d'un rendez-vous
          </p>
        </div>
      )}

      {/* Prompt to select day */}
      {hasAvailability && !selectedDay && (
        <div className="text-center py-3 text-xs text-deep-400 dark:text-surface-600">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Sélectionnez une date disponible
          </span>
        </div>
      )}
    </div>
  );
};
