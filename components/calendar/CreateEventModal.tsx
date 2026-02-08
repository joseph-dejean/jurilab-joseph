import React, { useState } from 'react';
import { X, Clock, MapPin, AlignLeft } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { EventSource, CalendarEvent } from '../../types/calendarTypes';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStart?: Date;
  initialEnd?: Date;
}

export const CreateEventModal = ({ isOpen, onClose, initialStart, initialEnd }: CreateEventModalProps) => {
  const { addEvent, availabilityMode } = useCalendar();
  
  const defaultStart = new Date();
  defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const formatDateForInput = (d: Date) => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Update state when modal opens or initial props change
  React.useEffect(() => {
    if (isOpen) {
        const s = initialStart || defaultStart;
        const e = initialEnd || defaultEnd;
        setStart(formatDateForInput(s));
        setEnd(formatDateForInput(e));
    }
  }, [isOpen, initialStart, initialEnd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(start);
    const endDate = new Date(end);

    const newEvent: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: availabilityMode ? (title || 'Disponible') : (title || '(Sans titre)'),
      start: startDate,
      end: endDate,
      description,
      location,
      source: EventSource.LOCAL,
      color: availabilityMode ? '#10B981' : '#be123c', 
      isAllDay: false,
      type: availabilityMode ? 'AVAILABILITY' : 'EVENT'
    };

    addEvent(newEvent);
    
    setTitle('');
    setDescription('');
    setLocation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">
            {availabilityMode ? 'Ajouter une disponibilité' : 'Nouvel événement'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              autoFocus
              type="text"
              placeholder="Ajouter un titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-semibold placeholder-gray-400 border-none focus:ring-0 p-0 text-gray-800"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Début</label>
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-400 transition-all">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="bg-transparent border-none text-sm w-full focus:ring-0 p-0 text-gray-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Fin</label>
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-400 transition-all">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="bg-transparent border-none text-sm w-full focus:ring-0 p-0 text-gray-700"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5" />
            <textarea
              placeholder="Ajouter une description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-lg focus:ring-rose-500 focus:border-rose-500 min-h-[80px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ajouter un lieu"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-lg focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
