import React from 'react';
import { X, Clock, MapPin, AlignLeft, Video, Trash2, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent, EventSource } from '../../types/calendarTypes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

export const EventDetailsModal = ({ isOpen, onClose, event }: EventDetailsModalProps) => {
  const { deleteEvent } = useCalendar();

  if (!isOpen || !event) return null;

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  const isGoogle = event.source === EventSource.GOOGLE;
  const isOutlook = event.source === EventSource.OUTLOOK;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header with Color Banner */}
        <div className="relative">
             <div className="h-24 w-full" style={{ backgroundColor: event.color || '#be123c' }}></div>
             <div className="absolute top-4 right-4 flex gap-2">
                 <button onClick={handleDelete} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-sm" title="Supprimer">
                    <Trash2 className="w-5 h-5" />
                 </button>
                 <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-sm">
                    <X className="w-5 h-5" />
                 </button>
             </div>
             <div className="px-6 -mt-10 mb-2 relative">
                 <div className="bg-white p-2 rounded-xl shadow-sm inline-block">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${event.color}20` }}>
                        <CalendarIcon className="w-7 h-7" style={{ color: event.color }} />
                    </div>
                 </div>
             </div>
        </div>

        <div className="px-6 pb-8 pt-2 space-y-5">
            {/* Title & Source */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${isGoogle ? 'bg-blue-100 text-blue-700' : isOutlook ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {event.source === EventSource.LOCAL ? 'Mon Agenda' : event.source === EventSource.GOOGLE ? 'Google Agenda' : 'Outlook'}
                    </span>
                </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                    <div className="text-gray-900 font-medium capitalize">
                        {format(event.start, 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                    <div className="text-gray-500 text-sm">
                        {event.isAllDay ? 'Toute la journée' : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
                    </div>
                </div>
            </div>

            {/* Location */}
            {event.location && (
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="text-gray-900">{event.location}</div>
                </div>
            )}

            {/* Meeting Link */}
            {event.meetingLink && (
                <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                        <a 
                            href={event.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 text-white text-sm font-medium rounded-lg hover:bg-rose-800 transition-colors"
                        >
                            Rejoindre la réunion
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[300px]">{event.meetingLink}</div>
                    </div>
                </div>
            )}

            {/* Description */}
            {event.description && (
                <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                    <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5" />
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {event.description}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
