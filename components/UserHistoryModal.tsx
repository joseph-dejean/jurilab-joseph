import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, User, Lawyer, UserRole } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Calendar, MessageSquare, FileText, Video, Phone, MapPin, Clock } from 'lucide-react';
import { getAllAppointments } from '../services/firebaseService';

interface UserHistoryModalProps {
  user: User | Lawyer;
  currentUserId: string;
  currentUserRole: UserRole;
  onClose: () => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  user,
  currentUserId,
  currentUserRole,
  onClose,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        const allAppointments = await getAllAppointments();
        
        // Filtrer les rendez-vous entre l'utilisateur actuel et l'utilisateur sélectionné
        const relevantAppointments = allAppointments.filter((apt) => {
          if (currentUserRole === UserRole.LAWYER) {
            return apt.lawyerId === currentUserId && apt.clientId === user.id;
          } else {
            return apt.clientId === currentUserId && apt.lawyerId === user.id;
          }
        });
        
        setAppointments(relevantAppointments.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [user.id, currentUserId, currentUserRole]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => parseISO(apt.date) < now && apt.status !== 'CANCELLED');
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(apt => parseISO(apt.date) >= now && apt.status !== 'CANCELLED');
  }, [appointments]);

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'IN_PERSON':
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'VIDEO':
        return 'Visioconférence';
      case 'PHONE':
        return 'Téléphone';
      case 'IN_PERSON':
        return 'Présentiel';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-DEFAULT to-brand-dark flex items-center justify-center text-white font-bold text-xl">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-navy dark:text-white">
                {user.name}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Rendez-vous passés */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-DEFAULT" />
                  Rendez-vous passés ({pastAppointments.length})
                </h3>
                {pastAppointments.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Aucun rendez-vous passé
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pastAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(apt.type)}
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {getTypeLabel(apt.type)}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(apt.date), 'PPP p', { locale: fr })} ({apt.duration} min)
                              </p>
                            </div>
                          </div>
                          {apt.summary && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                              Résumé disponible
                            </span>
                          )}
                        </div>
                        {apt.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rendez-vous à venir */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-DEFAULT" />
                  Rendez-vous à venir ({upcomingAppointments.length})
                </h3>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Aucun rendez-vous à venir
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(apt.type)}
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {getTypeLabel(apt.type)}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(apt.date), 'PPP p', { locale: fr })} ({apt.duration} min)
                              </p>
                            </div>
                          </div>
                        </div>
                        {apt.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Échanges de messages (placeholder) */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-DEFAULT" />
                  Échanges de messages
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Fonctionnalité à venir
                </p>
              </div>

              {/* Documents partagés (placeholder) */}
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-DEFAULT" />
                  Documents partagés
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Fonctionnalité à venir
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

