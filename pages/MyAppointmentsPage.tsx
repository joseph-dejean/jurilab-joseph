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
  User,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { MeetingSummary } from '../components/MeetingSummary';
import { UserHistoryModal } from '../components/UserHistoryModal';

type FilterType = 'all' | 'upcoming' | 'past' | 'cancelled';
type AppointmentTypeFilter = 'all' | 'VIDEO' | 'IN_PERSON' | 'PHONE';

export const MyAppointmentsPage: React.FC = () => {
  const { currentUser, appointments, lawyers, t, acceptAppointment, cancelAppointment } = useApp();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>('upcoming');
  const [typeFilter, setTypeFilter] = useState<AppointmentTypeFilter>('all');
  const [selectedAppointmentForSummary, setSelectedAppointmentForSummary] = useState<string | null>(null);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | Lawyer | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  // Filtrer les rendez-vous de l'utilisateur
  const myAppointments = useMemo(() => {
    return appointments.filter((apt) =>
      currentUser.role === UserRole.LAWYER
        ? apt.lawyerId === currentUser.id
        : apt.clientId === currentUser.id
    );
  }, [appointments, currentUser]);

  // Filtrer par type (à venir, passés, annulés)
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
      return true; // 'all'
    });
  }, [myAppointments, filterType]);

  // Filtrer par type de consultation
  const filteredAppointments = useMemo(() => {
    if (typeFilter === 'all') return filteredByStatus;
    return filteredByStatus.filter((apt) => apt.type === typeFilter);
  }, [filteredByStatus, typeFilter]);

  // Trier par date (plus récent en premier pour passés, plus proche en premier pour à venir)
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      
      if (filterType === 'past' || filterType === 'all') {
        return dateB - dateA; // Plus récent en premier
      }
      return dateA - dateB; // Plus proche en premier
    });
  }, [filteredAppointments, filterType]);

  // Obtenir le nom de l'autre partie (avocat ou client) depuis l'appointment
  const getOtherPartyName = (appointment: Appointment): string => {
    if (currentUser.role === UserRole.LAWYER) {
      // Pour l'avocat, retourner le nom du client depuis l'appointment
      return appointment.clientName || 'Client';
    } else {
      // Pour le client, retourner le nom de l'avocat depuis l'appointment
      return appointment.lawyerName || 'Avocat';
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" />
            Confirmé
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <AlertCircle className="w-3 h-3" />
            En attente
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <XCircle className="w-3 h-3" />
            Annulé
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <CheckCircle2 className="w-3 h-3" />
            Terminé
          </span>
        );
      default:
        return null;
    }
  };

  // Obtenir l'icône du type de consultation
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

  // Obtenir le label du type
  const getTypeLabel = (type: Appointment['type']) => {
    switch (type) {
      case 'VIDEO':
        return 'Visioconférence';
      case 'PHONE':
        return 'Téléphone';
      case 'IN_PERSON':
        return 'En personne';
    }
  };

  // Vérifier si on peut rejoindre la visio
  const canJoinVideo = (appointment: Appointment) => {
    if (appointment.type !== 'VIDEO') return false;
    if (appointment.status === 'CANCELLED') return false;
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    // Peut rejoindre 5 minutes avant et jusqu'à 1h après
    const canJoinBefore = new Date(aptDate.getTime() - 5 * 60 * 1000);
    const canJoinAfter = new Date(aptDate.getTime() + 60 * 60 * 1000);
    return now >= canJoinBefore && now <= canJoinAfter;
  };

  // Vérifier si on peut annuler le RDV (pas moins de 24h avant)
  const canCancelAppointment = (appointment: Appointment) => {
    const aptDate = parseISO(appointment.date);
    const now = new Date();
    const hoursUntilAppointment = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Ne peut pas annuler si moins de 24h avant le RDV
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

      // Si le channel n'existe pas encore, le créer
      if (!channelId) {
        const {
          initializeStreamClient,
          createOrGetChatChannel,
          getStreamClient,
        } = await import('../services/streamService');

        // Initialiser le client Stream si nécessaire
        let streamClient = getStreamClient();
        if (!streamClient || !streamClient.userID) {
          // Le client n'existe pas ou n'est pas connecté, le réinitialiser
          await initializeStreamClient(
            currentUser.id,
            currentUser.name,
            currentUser.role
          );
          streamClient = getStreamClient();
          
          // Vérifier que la connexion a réussi
          if (!streamClient || !streamClient.userID) {
            throw new Error('Failed to connect to Stream. Please try again.');
          }
        }

        // Créer ou récupérer le channel
        const channel = await createOrGetChatChannel(
          appointment.lawyerId,
          appointment.clientId,
          appointment.id
        );

        channelId = channel.id;

        // Stocker le channelId dans l'appointment
        const { ref, update } = await import('firebase/database');
        const { database } = await import('../firebaseConfig');
        const apptRef = ref(database, `appointments/${appointment.id}`);
        await update(apptRef, { channelId: channel.id });
      }

      // Rediriger vers la page messages avec le channel sélectionné
      navigate(`/messages?channel=${channelId}`);
    } catch (error: any) {
      console.error('Error opening chat:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      console.error('Détails de l\'erreur:', error);
      alert(`Erreur lors de l'ouverture de la conversation: ${errorMessage}`);
    }
  };

  const otherParty = currentUser.role === UserRole.LAWYER ? 'Client' : 'Avocat';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-navy dark:text-white mb-2">
            Mes rendez-vous
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez tous vos rendez-vous et consultations
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtres :</span>
            </div>

            {/* Filtre par statut */}
            <div className="flex gap-2">
              {(['all', 'upcoming', 'past', 'cancelled'] as FilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterType === filter
                      ? 'bg-brand-DEFAULT text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {filter === 'all' && 'Tous'}
                  {filter === 'upcoming' && 'À venir'}
                  {filter === 'past' && 'Passés'}
                  {filter === 'cancelled' && 'Annulés'}
                </button>
              ))}
            </div>

            {/* Filtre par type */}
            <div className="flex gap-2 ml-auto">
              {(['all', 'VIDEO', 'IN_PERSON', 'PHONE'] as AppointmentTypeFilter[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    typeFilter === type
                      ? 'bg-navy dark:bg-brand-DEFAULT text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {type === 'all' && 'Tous types'}
                  {type === 'VIDEO' && (
                    <>
                      <Video className="w-3 h-3" />
                      Visio
                    </>
                  )}
                  {type === 'IN_PERSON' && (
                    <>
                      <MapPin className="w-3 h-3" />
                      Présentiel
                    </>
                  )}
                  {type === 'PHONE' && (
                    <>
                      <Phone className="w-3 h-3" />
                      Téléphone
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des rendez-vous */}
        {sortedAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {filterType === 'upcoming'
                ? "Vous n'avez aucun rendez-vous à venir"
                : filterType === 'past'
                ? "Vous n'avez aucun rendez-vous passé"
                : filterType === 'cancelled'
                ? "Vous n'avez aucun rendez-vous annulé"
                : "Aucun rendez-vous ne correspond à vos filtres"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAppointments.map((appointment) => {
              const otherPartyName = getOtherPartyName(appointment);
              const aptDate = parseISO(appointment.date);
              const isUpcoming = isFuture(aptDate) || isToday(aptDate);

              return (
                <div
                  key={appointment.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar et infos principales */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-DEFAULT to-brand-dark flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {otherPartyName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-navy dark:text-white truncate">
                            {otherPartyName}
                          </h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {currentUser.role === UserRole.LAWYER ? 'Client' : 'Avocat'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(aptDate, 'EEEE d MMMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(aptDate, 'HH:mm')}
                          </span>
                          {appointment.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Type et actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {getTypeIcon(appointment.type)}
                        <span className="text-sm font-medium">{getTypeLabel(appointment.type)}</span>
                      </div>

                      {/* Bouton Rejoindre la visio (prioritaire) */}
                      {canJoinVideo(appointment) && (
                        <button
                          onClick={() => handleJoinVideo(appointment)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                          <Video className="w-4 h-4" />
                          Rejoindre la visio
                        </button>
                      )}

                      {/* Bouton Message */}
                      {appointment.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleSendMessage(appointment)}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-sm transition-colors"
                          title="Envoyer un message"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Message</span>
                        </button>
                      )}

                      {/* Bouton Accepter (avocat uniquement, pour RDV en attente) */}
                      {appointment.status === 'PENDING' && 
                       currentUser.role === UserRole.LAWYER && (
                        <button
                          onClick={async () => {
                            if (confirm('Voulez-vous accepter ce rendez-vous ?')) {
                              try {
                                await acceptAppointment(appointment.id);
                                alert('✅ Rendez-vous accepté avec succès');
                              } catch (error: any) {
                                // L'erreur est déjà affichée dans acceptAppointment
                              }
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accepter
                        </button>
                      )}

                      {/* Bouton Annuler (petit, secondaire) - seulement si plus de 24h avant */}
                      {appointment.status !== 'CANCELLED' && 
                       appointment.status !== 'COMPLETED' &&
                       canCancelAppointment(appointment) && (
                        <button
                          onClick={async () => {
                            if (confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) {
                              try {
                                await cancelAppointment(appointment.id);
                                alert('✅ Rendez-vous annulé');
                              } catch (error: any) {
                                // L'erreur est déjà affichée dans cancelAppointment
                              }
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm transition-colors"
                          title="Annuler le rendez-vous"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Annuler</span>
                        </button>
                      )}
                      
                      {/* Message si on ne peut plus annuler (moins de 24h) */}
                      {appointment.status !== 'CANCELLED' && 
                       appointment.status !== 'COMPLETED' &&
                       !canCancelAppointment(appointment) && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Annulation impossible (moins de 24h)
                        </span>
                      )}

                      {/* Bouton Voir résumé (avocat uniquement, pour RDV terminés) */}
                      {appointment.status === 'COMPLETED' && 
                       currentUser.role === UserRole.LAWYER && 
                       (appointment.summary || appointment.transcript) && (
                        <button
                          onClick={() => {
                            setSelectedAppointmentForSummary(
                              selectedAppointmentForSummary === appointment.id ? null : appointment.id
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg font-medium transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          {selectedAppointmentForSummary === appointment.id ? 'Masquer' : 'Voir résumé'}
                        </button>
                      )}

                      {/* Bouton Voir détails - Affiche/masque les détails */}
                      <button
                        onClick={() => {
                          // Toggle l'affichage des détails
                          if (selectedAppointmentForSummary === appointment.id) {
                            setSelectedAppointmentForSummary(null);
                          } else {
                            setSelectedAppointmentForSummary(appointment.id);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                      >
                        {selectedAppointmentForSummary === appointment.id ? 'Masquer détails' : 'Détails'}
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedAppointmentForSummary === appointment.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Détails du rendez-vous (affichés quand "Détails" est cliqué) */}
                  {selectedAppointmentForSummary === appointment.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                      {/* Informations détaillées */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Type de consultation</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {appointment.type === 'VIDEO' ? 'Visioconférence' : appointment.type === 'PHONE' ? 'Téléphone' : 'Présentiel'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Durée</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {appointment.duration || 60} minutes
                          </p>
                        </div>
                        {appointment.dailyRoomUrl && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Salle de visioconférence</p>
                            <p className="text-sm font-mono text-slate-600 dark:text-slate-400 break-all">
                              {appointment.dailyRoomId || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Notes si présentes */}
                      {appointment.notes && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                            {appointment.notes}
                          </p>
                        </div>
                      )}

                      {/* Résumé de la réunion (avocat uniquement, pour RDV terminés) */}
                      {currentUser.role === UserRole.LAWYER && 
                       appointment.status === 'COMPLETED' &&
                       (appointment.summary || appointment.transcript) && (
                        <div>
                          <MeetingSummary
                            appointment={appointment}
                            lawyerName={appointment.lawyerName || 'Avocat'}
                            clientName={appointment.clientName || 'Client'}
                            onSummaryShared={() => {
                              // Rafraîchir la liste des rendez-vous
                              window.location.reload();
                            }}
                            onSummaryRegenerated={() => {
                              // Rafraîchir la liste des rendez-vous
                              window.location.reload();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal d'historique */}
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

