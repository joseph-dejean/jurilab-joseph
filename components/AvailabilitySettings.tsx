import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from './Button';
import { AvailabilityHours, DayAvailability, TimeSlot } from '../types';
import { saveAvailabilityHours, getAvailabilityHours } from '../services/firebaseService';

interface AvailabilitySettingsProps {
  lawyerId: string;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const;

const DEFAULT_AVAILABILITY: AvailabilityHours = {
  monday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  tuesday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  wednesday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  thursday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  friday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  saturday: { enabled: false, timeSlots: [] },
  sunday: { enabled: false, timeSlots: [] },
};

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({ lawyerId }) => {
  const [availability, setAvailability] = useState<AvailabilityHours>(DEFAULT_AVAILABILITY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setIsLoading(true);
        const saved = await getAvailabilityHours(lawyerId);
        if (saved) {
          // Merge saved data with defaults to ensure all days have proper structure
          const mergedAvailability: AvailabilityHours = { ...DEFAULT_AVAILABILITY };
          for (const day of Object.keys(DEFAULT_AVAILABILITY) as (keyof AvailabilityHours)[]) {
            if (saved[day]) {
              mergedAvailability[day] = {
                enabled: saved[day].enabled ?? DEFAULT_AVAILABILITY[day].enabled,
                timeSlots: Array.isArray(saved[day].timeSlots) ? saved[day].timeSlots : DEFAULT_AVAILABILITY[day].timeSlots,
              };
            }
          }
          setAvailability(mergedAvailability);
        }
      } catch (error) {
        console.error('❌ Error loading availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [lawyerId]);

  const handleDayToggle = (day: keyof AvailabilityHours) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleAddTimeSlot = (day: keyof AvailabilityHours) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { start: '09:00', end: '17:00' }],
      },
    }));
  };

  const handleRemoveTimeSlot = (day: keyof AvailabilityHours, index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index),
      },
    }));
  };

  const handleTimeSlotChange = (
    day: keyof AvailabilityHours,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveAvailabilityHours(lawyerId, availability);
      alert('✅ Heures de disponibilité sauvegardées avec succès !');
      setIsExpanded(false);
    } catch (error) {
      console.error('❌ Error saving availability:', error);
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500">
          <Clock className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => {
          console.log('🖱️ AvailabilitySettings clicked, isExpanded:', !isExpanded);
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand" />
          <span className="font-medium text-slate-900 dark:text-slate-100">Disponibilité</span>
        </div>
        {isExpanded ? (
          <X className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 mt-4">
            Définissez vos heures de disponibilité. Les clients ne pourront réserver que pendant ces créneaux.
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {DAYS.map(({ key, label }) => {
              const dayAvailability = availability[key] || { enabled: false, timeSlots: [] };
              const timeSlots = Array.isArray(dayAvailability.timeSlots) ? dayAvailability.timeSlots : [];
              return (
                <div
                  key={key}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayAvailability.enabled}
                        onChange={() => handleDayToggle(key)}
                        className="w-4 h-4 text-brand rounded focus:ring-brand"
                      />
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {label}
                      </span>
                    </label>
                  </div>

                  {dayAvailability.enabled && (
                    <div className="space-y-2 ml-6">
                      {timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                        >
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              handleTimeSlotChange(key, index, 'start', e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <span className="text-slate-500">-</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              handleTimeSlotChange(key, index, 'end', e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={() => handleRemoveTimeSlot(key, index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            disabled={timeSlots.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddTimeSlot(key)}
                        className="ml-0 flex items-center gap-1 text-xs text-brand hover:text-brand-dark transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter une tranche
                      </button>
                    </div>
                  )}

                  {dayAvailability.enabled && timeSlots.length === 0 && (
                    <div className="ml-6">
                      <button
                        onClick={() => handleAddTimeSlot(key)}
                        className="text-xs text-brand hover:text-brand-dark flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter une tranche horaire
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsExpanded(false)}
              className="flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

import { ChevronRight } from 'lucide-react';

