import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../store/store';

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
  
  const footer = selectedDay ? (
    <p className="text-sm mt-2">{t.booking.youSelected} {format(selectedDay, 'PPP', { locale: fr })}.</p>
  ) : (
    <p className="text-sm mt-2">{t.booking.selectDay}</p>
  );

  return (
    <div>
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay as any}
        onDayClick={handleDayClick}
        modifiers={{ available: availableDays }}
        modifiersClassNames={{
          available: 'bg-green-100 dark:bg-green-900 rounded-full',
          selected: 'bg-primary-500 text-white',
        }}
        footer={footer}
        locale={fr}
        showOutsideDays
        fixedWeeks
        className="bg-slate-50 dark:bg-navy p-2 rounded-md"
      />
      
      {selectedDay && (
        <div className="mt-4">
          <h4 className="font-semibold text-navy dark:text-white mb-2">
            {t.booking.availableSlotsFor} {format(selectedDay, 'PPP', { locale: fr })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {slotsForSelectedDay.length > 0 ? (
              slotsForSelectedDay.map(slot => (
                <button
                  key={slot.toISOString()}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-2 rounded-md text-sm text-center transition-colors
                    ${selectedSlot && selectedSlot.getTime() === slot.getTime() 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-200 dark:bg-navy-light text-slate-800 dark:text-slate-200 hover:bg-primary-100'
                    }`
                  }
                >
                  {format(slot, 'HH:mm')}
                </button>
              ))
            ) : (
              <p className="col-span-3 text-sm text-slate-500">{t.booking.noSlots}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};