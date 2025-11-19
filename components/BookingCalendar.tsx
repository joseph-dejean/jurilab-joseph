import React from 'react';

interface BookingCalendarProps {
  availableSlots: string[];
  onSelectSlot: (date: string) => void;
  selectedSlot: string | null;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ availableSlots, onSelectSlot, selectedSlot }) => {
  // Generate next 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const isSlotAvailable = (date: Date) => {
    return availableSlots.some(slot => {
      const slotDate = new Date(slot);
      return slotDate.getDate() === date.getDate() && slotDate.getMonth() === date.getMonth();
    });
  };

  const getSlotTime = (date: Date) => {
    const slot = availableSlots.find(s => {
        const sd = new Date(s);
        return sd.getDate() === date.getDate();
    });
    if (!slot) return null;
    return new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day) => (
          <div key={day.toISOString()} className="text-center">
             <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day).replace('.', '')}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const hasSlot = isSlotAvailable(day);
          const slotDateStr = availableSlots.find(s => new Date(s).getDate() === day.getDate()) || day.toISOString();
          const isSelected = selectedSlot && new Date(selectedSlot).getDate() === day.getDate();
          const isToday = day.getDate() === today.getDate();
          
          return (
            <div key={'slot-' + day.toISOString()} className="flex flex-col items-center gap-2">
               <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1
                  ${isToday ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}
               `}>
                  {day.getDate()}
               </div>

              {hasSlot ? (
                <button
                  onClick={() => onSelectSlot(slotDateStr)}
                  className={`
                    w-full py-1.5 rounded text-[10px] font-bold transition-all shadow-sm
                    ${isSelected 
                      ? 'bg-primary-600 text-white shadow-primary-500/30 ring-2 ring-primary-600 ring-offset-1 dark:ring-offset-slate-800' 
                      : 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900 hover:border-primary-500 hover:text-primary-600'}
                  `}
                >
                  {getSlotTime(day) || '09:00'}
                </button>
              ) : (
                <div className="w-full py-1.5 text-center">
                   <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};