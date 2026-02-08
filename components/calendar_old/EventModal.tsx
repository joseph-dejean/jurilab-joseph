import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Palette, Trash2, Save, Globe } from 'lucide-react';
import { Button } from '../Button';
import { UnifiedCalendarEvent, EVENT_COLORS } from '../../services/calendarSyncService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
    color?: string;
    allDay?: boolean;
    syncToGoogle?: boolean;
    syncToOutlook?: boolean;
  }) => void;
  onDelete?: () => void;
  event?: UnifiedCalendarEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
  googleConnected?: boolean;
  outlookConnected?: boolean;
}

const colorOptions = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultStart,
  defaultEnd,
  googleConnected = false,
  outlookConnected = false,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [allDay, setAllDay] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(false);
  const [syncToOutlook, setSyncToOutlook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!event;
  const isExternal = event?.source === 'GOOGLE' || event?.source === 'OUTLOOK';

  // Initialize form
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setStartDate(format(event.start, 'yyyy-MM-dd'));
      setStartTime(format(event.start, 'HH:mm'));
      setEndDate(format(event.end, 'yyyy-MM-dd'));
      setEndTime(format(event.end, 'HH:mm'));
      setDescription(event.description || '');
      setLocation(event.location || '');
      setColor(event.color || '#8b5cf6');
      setAllDay(event.allDay || false);
    } else if (defaultStart && defaultEnd) {
      setStartDate(format(defaultStart, 'yyyy-MM-dd'));
      setStartTime(format(defaultStart, 'HH:mm'));
      setEndDate(format(defaultEnd, 'yyyy-MM-dd'));
      setEndTime(format(defaultEnd, 'HH:mm'));
      setTitle('');
      setDescription('');
      setLocation('');
      setColor('#8b5cf6');
      setAllDay(false);
      setSyncToGoogle(googleConnected);
      setSyncToOutlook(outlookConnected);
    }
  }, [event, defaultStart, defaultEnd, googleConnected, outlookConnected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Veuillez entrer un titre pour l\'événement');
      return;
    }

    setIsSaving(true);

    try {
      const start = allDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}`);
      const end = allDay
        ? new Date(`${endDate}T23:59:59`)
        : new Date(`${endDate}T${endTime}`);

      if (end <= start) {
        alert('La date de fin doit être après la date de début');
        setIsSaving(false);
        return;
      }

      await onSave({
        title: title.trim(),
        start,
        end,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        color,
        allDay,
        syncToGoogle: !isEditing && syncToGoogle,
        syncToOutlook: !isEditing && syncToOutlook,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ajouter un titre"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-lg"
              required
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="allDay" className="text-sm text-slate-700 dark:text-slate-300">
              Toute la journée
            </label>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Heure
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            {!allDay && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Heure
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Lieu
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ajouter un lieu"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajouter une description"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === opt.value
                      ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: opt.value }}
                  title={opt.name}
                />
              ))}
            </div>
          </div>

          {/* Sync Options (only for new events) */}
          {!isEditing && (googleConnected || outlookConnected) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                <Globe className="w-4 h-4 inline mr-1" />
                Synchroniser avec
              </label>
              
              {googleConnected && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncGoogle"
                    checked={syncToGoogle}
                    onChange={(e) => setSyncToGoogle(e.target.checked)}
                    className="w-4 h-4 text-green-500 border-slate-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="syncGoogle" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Google Calendar
                  </label>
                </div>
              )}

              {outlookConnected && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncOutlook"
                    checked={syncToOutlook}
                    onChange={(e) => setSyncToOutlook(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="syncOutlook" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    Outlook Calendar
                  </label>
                </div>
              )}
            </div>
          )}

          {/* External event info */}
          {isExternal && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Cet événement provient de {event?.source === 'GOOGLE' ? 'Google Calendar' : 'Outlook'}.
                Les modifications seront synchronisées.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
