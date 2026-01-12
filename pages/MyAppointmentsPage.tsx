import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/store';
import { Appointment, UserRole } from '../types';
import { format, parseISO, isPast, isToday, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { MeetingSummary } from '../components/MeetingSummary';
import { UserHistoryModal } from '../components/UserHistoryModal';
import { Button } from '../components/Button';

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';
type AppointmentTypeFilter = 'all' | 'VIDEO' | 'IN_PERSON' | 'PHONE';

export const MyAppointmentsPage: React.FC = () => {
  const { currentUser, appointments, lawyers, t, acceptAppointment, cancelAppointment, deleteAppointment } = useApp();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>('upcoming');
  const [typeFilter, setTypeFilter] = useState<AppointmentTypeFilter>('all');
  const [selectedAppointmentForSummary, setSelectedAppointmentForSummary] = useState<string | null>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  // Filter appointments for this user
  const myAppointments = useMemo(() => {
    return appointments.filter((apt) =>
      currentUser.role === UserRole.LAWYER
        ? apt.lawyerId === currentUser.id
        : apt.clientId === currentUser.id
    );
  }, [appointments, currentUser]);

  // Filter by status
  const filteredByStatus = useMemo(() => {
    const now = new Date();
    return myAppointments.filter((apt) => {
      const aptDate = parseISO(apt.date);

      if (filterType === 'cancelled') {
        return apt.status === 'CANCELLED';
      }
      if (filterType === 'upcoming') {
        return apt.status !== 'CANCELLED' && (isFuture(aptDate) || isToday(aptDate));
      }
      if (filterType === 'past') {
        return apt.status !== 'CANCELLED' && isPast(aptDate) && !isToday(aptDate);
      }
      return true;
    });
  }, [myAppointments, filterType]);

  // Filter by consultation type
  const filteredAppointments = useMemo(() => {
    if (typeFilter === 'all') return filteredByStatus;
    return filteredByStatus.filter((apt) => apt.type === typeFilter);
  }, [filteredByStatus, typeFilter]);

  // Sort by date
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();

      if (filterType === 'past' || filterType === 'all') {
        return dateB - dateA;
      }
      return dateA - dateB;
    });
  }, [filteredAppointments, filterType]);

  // Get other party name
  const getOtherPartyName = (appointment: Appointment): string => {
    if (currentUser.role === UserRole.LAWYER) {
      return appointment.clientName || 'Client';
    } else {
      return appointment.lawyerName || 'Avocat';
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Appointment['status'] }) => {
    const config = {
      CONFIRMED: {
        icon: CheckCircle2,
        label: 'Confirmé',
        className: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
      },
      PENDING: {
        icon: AlertCircle,
        label: 'En attente',
        className: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300'
      },
      CANCELLED: {
        icon: XCircle,
        label: 'Annulé',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      },
      COMPLETED: {
        icon: CheckCircle2,
        label: 'Terminé',
        className: 'bg-surface-200 dark:bg-deep-800 text-deep-600 dark:text-surface-400'
      },
    };

    const { icon: Icon, label, className } = config[status] || config.PENDING;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  // Type icon
  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'VIDEO': return Video;
      case 'PHONE': return Phone;
      case 'IN_PERSON': return MapPin;
      default: return Video;
    }
  };

  // Type label
  const getTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'VIDEO': return 'Visioconférence';
      case 'PHONE': return 'Téléphone';
      case 'IN_PERSON': return 'En personne';
      default: return type;
    }
  };

  // Check if can join video
  const canJoinVideo = (appointment: Appointment) => {
    if (appointment.type !== 'VIDEO') return false;
    if (appointment.status === 'CANCELLED') return false;
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
    const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
    return now >= canJoinBefore && now <= canJoinAfter;
  };

  // Check if can cancel
  const canCancelAppointment = (appointment: Appointment) => {
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24;
  };

  const handleJoinVideo = (appointment: Appointment) => {
    if (appointment.dailyRoomUrl) {
      navigate(`/video-call?roomUrl=${encodeURIComponent(appointment.dailyRoomUrl)}&appointmentId=${appointment.id}`);
    } else {
      alert('URL de la salle de visioconférence non disponible');
    }
  };

  const handleSendMessage = async (appointment: Appointment) => {
    if (!currentUser) return;

    try {
      let channelId = appointment.channelId;

      if (!channelId) {
        const { initializeStreamClient, createOrGetChatChannel, getStreamClient } = await import('../services/streamService');

        let streamClient = getStreamClient();
        if (!streamClient || !streamClient.userID) {
          await initializeStreamClient(currentUser.id, currentUser.name, currentUser.role);
          streamClient = getStreamClient();

          if (!streamClient || !streamClient.userID) {
            throw new Error('Failed to connect to Stream. Please try again.');
          }
        }

        const channel = await createOrGetChatChannel(appointment.lawyerId, appointment.clientId, appointment.id);
        channelId = channel.id;

        const { ref, update } = await import('firebase/database');
        const { database } = await import('../firebaseConfig');
        const apptRef = ref(database, `appointments/${appointment.id}`);
        await update(apptRef, { channelId: channel.id });
      }

      navigate(`/messages?channel=${channelId}`);
    } catch (error: any) {
      console.error('Error opening chat:', error);
      alert(`Erreur lors de l'ouverture de la conversation: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'Tous' },
    { type: 'upcoming', label: 'À venir' },
    { type: 'past', label: 'Passés' },
    { type: 'cancelled', label: 'Annulés' },
  ];

  const typeButtons: { type: AppointmentTypeFilter; icon: any; label: string }[] = [
    { type: 'all', icon: null, label: 'Tous' },
    { type: 'VIDEO', icon: Video, label: 'Visio' },
    { type: 'IN_PERSON', icon: MapPin, label: 'Présentiel' },
    { type: 'PHONE', icon: Phone, label: 'Téléphone' },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-50 dark:bg-deep-950 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-deep-500 hover:text-deep-700 dark:hover:text-surface-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>
          <h1 className="text-display-sm font-serif text-deep-900 dark:text-surface-100 mb-2">
            Mes rendez-vous
          </h1>
          <p className="text-deep-600 dark:text-surface-400">
            Gérez toutes vos consultations juridiques
          </p>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-deep-400" />
              <div className="flex gap-1.5">
                {filterButtons.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${filterType === type
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-deep-700'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex gap-1.5 md:ml-auto">
              {typeButtons.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${typeFilter === type
                      ? 'bg-deep-900 dark:bg-surface-100 text-white dark:text-deep-900'
                      : 'bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-deep-700'
                    }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {sortedAppointments.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-100 dark:bg-deep-800 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-deep-300 dark:text-deep-600" />
            </div>
            <h3 className="text-lg font-semibold text-deep-700 dark:text-surface-300 mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-deep-500 dark:text-surface-500 mb-6">
              {filterType === 'upcoming'
                ? "Vous n'avez aucun rendez-vous à venir"
                : filterType === 'past'
                  ? "Vous n'avez aucun rendez-vous passé"
                  : filterType === 'cancelled'
                    ? "Vous n'avez aucun rendez-vous annulé"
                    : "Aucun rendez-vous ne correspond à vos filtres"}
            </p>
            {currentUser.role === UserRole.CLIENT && (
              <Button variant="primary" onClick={() => navigate('/search')}>
                Trouver un avocat
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAppointments.map((appointment) => {
              const otherPartyName = getOtherPartyName(appointment);
              const aptDate = parseISO(appointment.date);
              const TypeIcon = getTypeIcon(appointment.type);

              return (
                <div
                  key={appointment.id}
                  className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-card-hover"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {otherPartyName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg text-deep-900 dark:text-surface-100">
                              {otherPartyName}
                            </h3>
                            <StatusBadge status={appointment.status} />
                          </div>
                          <p className="text-sm text-deep-500 dark:text-surface-500 mb-2">
                            {currentUser.role === UserRole.LAWYER ? 'Client' : 'Avocat'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-deep-600 dark:text-surface-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {format(aptDate, 'EEEE d MMMM yyyy', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {format(aptDate, 'HH:mm')}
                            </span>
                            {appointment.duration && (
                              <span className="text-deep-400 dark:text-surface-600">
                                • {appointment.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Type & Actions */}
                      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400 text-sm font-medium">
                          <TypeIcon className="w-4 h-4" />
                          {getTypeLabel(appointment.type)}
                        </span>

                        {/* Join Video Button */}
                        {canJoinVideo(appointment) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinVideo(appointment)}
                          >
                            <Video className="w-4 h-4 mr-1.5" />
                            Rejoindre
                          </Button>
                        )}

                        {/* Message Button */}
                        {appointment.status !== 'CANCELLED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendMessage(appointment)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Accept Button (Lawyer only) */}
                        {appointment.status === 'PENDING' && currentUser.role === UserRole.LAWYER && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Voulez-vous accepter ce rendez-vous ?')) {
                                try {
                                  await acceptAppointment(appointment.id);
                                  alert('✅ Rendez-vous accepté avec succès');
                                } catch (error: any) { }
                              }
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Accepter
                          </Button>
                        )}

                        {/* Cancel Button */}
                        {appointment.status !== 'CANCELLED' &&
                          appointment.status !== 'COMPLETED' &&
                          canCancelAppointment(appointment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={async () => {
                                if (confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
                                  try {
                                    await cancelAppointment(appointment.id);
                                    alert('✅ Rendez-vous annulé');
                                  } catch (error: any) { }
                                }
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}

                        {/* Delete Button (Lawyer only) */}
                        {currentUser.role === UserRole.LAWYER && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={async () => {
                              if (window.confirm("Supprimer définitivement ce rendez-vous ?")) {
                                try {
                                  await deleteAppointment(appointment.id);
                                  alert('✅ Rendez-vous supprimé');
                                } catch (error: any) { }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}

                        {/* View Summary Button */}
                        {appointment.status === 'COMPLETED' &&
                          currentUser.role === UserRole.LAWYER &&
                          (appointment.summary || appointment.transcript) && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => setSelectedAppointmentForSummary(
                                selectedAppointmentForSummary === appointment.id ? null : appointment.id
                              )}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              {selectedAppointmentForSummary === appointment.id ? 'Masquer' : 'Résumé'}
                            </Button>
                          )}

                        {/* Details Toggle */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedAppointmentForSummary(
                            selectedAppointmentForSummary === appointment.id ? null : appointment.id
                          )}
                        >
                          {selectedAppointmentForSummary === appointment.id ? 'Masquer' : 'Détails'}
                          <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${selectedAppointmentForSummary === appointment.id ? 'rotate-90' : ''
                            }`} />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedAppointmentForSummary === appointment.id && (
                      <div className="mt-6 pt-6 border-t border-surface-100 dark:border-deep-800 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800">
                            <p className="text-xs text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-1">Type</p>
                            <p className="text-sm font-medium text-deep-700 dark:text-surface-300">
                              {getTypeLabel(appointment.type)}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800">
                            <p className="text-xs text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-1">Durée</p>
                            <p className="text-sm font-medium text-deep-700 dark:text-surface-300">
                              {appointment.duration || 60} minutes
                            </p>
                          </div>
                          {appointment.dailyRoomUrl && (
                            <div className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800 col-span-2 md:col-span-1">
                              <p className="text-xs text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-1">Salle</p>
                              <p className="text-sm font-mono text-deep-600 dark:text-surface-400 truncate">
                                {appointment.dailyRoomId || 'N/A'}
                              </p>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800">
                            <p className="text-xs text-deep-400 dark:text-surface-600 uppercase tracking-wider mb-2">Notes</p>
                            <p className="text-sm text-deep-600 dark:text-surface-400">
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Meeting Summary */}
                        {currentUser.role === UserRole.LAWYER &&
                          appointment.status === 'COMPLETED' &&
                          (appointment.summary || appointment.transcript) && (
                            <MeetingSummary
                              appointment={appointment}
                              lawyerName={appointment.lawyerName || 'Avocat'}
                              clientName={appointment.clientName || 'Client'}
                              onSummaryShared={() => window.location.reload()}
                              onSummaryRegenerated={() => window.location.reload()}
                            />
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User History Modal */}
      {selectedUserForHistory && (
        <UserHistoryModal
          user={selectedUserForHistory}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
          onClose={() => setSelectedUserForHistory(null)}
        />
      )}
    </div>
  );
};
