import React, { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebaseConfig';
import { useApp } from '../store/store';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  getChannelById, 
  getStreamClient,
  initializeStreamClient,
  toggleClientMessagePermission,
  getClientMessagePermission
} from '../services/streamService';
import { Channel } from 'stream-chat';
import { 
  Chat, 
  Channel as StreamChannel, 
  ChannelHeader, 
  MessageList, 
  MessageInput,
  Thread,
  Window
} from 'stream-chat-react';
import { ArrowLeft, User, Lock, Unlock } from 'lucide-react';
import 'stream-chat-react/dist/css/v2/index.css';

interface ChatWindowProps {
  channelId: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channelId, onBack }) => {
  const { currentUser, appointments } = useApp();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedAppointment, setLinkedAppointment] = useState<any>(null);
  const [clientCanMessage, setClientCanMessage] = useState<boolean>(true);
  const [isTogglingPermission, setIsTogglingPermission] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const loadChannel = async () => {
      try {
        setIsLoading(true);
        
        // Initialize Stream client if needed
        const client = getStreamClient();
        if (!client) {
          await initializeStreamClient(
            currentUser.id,
            currentUser.name,
            currentUser.role
          );
        }

        // Get channel
        const channelData = await getChannelById(channelId);
        if (channelData) {
          // Watch the channel to receive real-time updates
          await channelData.watch();
          setChannel(channelData);
        }
      } catch (error) {
        console.error('Error loading channel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannel();
  }, [channelId, currentUser]);

  // Charger le rendez-vous lié quand le channel est chargé
  useEffect(() => {
    if (channel?.data?.appointmentId) {
      const appointment = appointments.find(a => a.id === channel.data.appointmentId);
      setLinkedAppointment(appointment);
    } else {
      setLinkedAppointment(null);
    }
  }, [channel, appointments]);

  // Charger et écouter la permission du client depuis Firebase
  useEffect(() => {
    if (!channelId) return;

    // Charger la permission initiale
    const loadPermission = async () => {
      try {
        const permission = await getClientMessagePermission(channelId);
        setClientCanMessage(permission);
      } catch (error) {
        console.error('Error loading permission:', error);
        setClientCanMessage(true); // Par défaut autorisé
      }
    };

    loadPermission();

    // Écouter les changements en temps réel depuis Firebase
    const permissionRef = ref(database, `chatPermissions/${channelId}/clientCanMessage`);
    
    const unsubscribe = onValue(permissionRef, (snapshot) => {
      if (snapshot.exists()) {
        setClientCanMessage(snapshot.val() as boolean);
      } else {
        setClientCanMessage(true); // Par défaut autorisé si pas de valeur
      }
    }, (error) => {
      console.error('Error listening to permission:', error);
      setClientCanMessage(true); // Par défaut autorisé en cas d'erreur
    });

    return () => {
      off(permissionRef);
    };
  }, [channelId]);

  const client = getStreamClient();

  if (isLoading || !client || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark dark:border-brand mx-auto mb-2"></div>
          <p className="text-slate-500 dark:text-slate-400">Chargement de la conversation...</p>
        </div>
      </div>
    );
  }

  // Get the other user's info
  const getOtherUser = () => {
    if (!currentUser) return null;
    const members = Object.values(channel.state.members || {});
    return members.find(m => m.user?.id !== currentUser.id)?.user;
  };

  const otherUser = getOtherUser();

  // Vérifier si l'utilisateur actuel est l'avocat
  const isLawyer = currentUser && channel?.data?.lawyerId === currentUser.id;
  const isClient = currentUser && channel?.data?.clientId === currentUser.id;

  // Fonction pour toggle la permission du client
  const handleTogglePermission = async () => {
    if (!channel || !isLawyer) return;

    setIsTogglingPermission(true);
    try {
      const newPermission = !clientCanMessage;
      await toggleClientMessagePermission(channel.id, newPermission);
      setClientCanMessage(newPermission);
    } catch (error) {
      console.error('Error toggling permission:', error);
      alert('Erreur lors de la modification de la permission');
    } finally {
      setIsTogglingPermission(false);
    }
  };

  // Custom theme to match Jurilab design
  const theme = {
    '--primary-color': '#1e40af', // navy
    '--primary-color-text': '#ffffff',
    '--secondary-color': '#3b82f6', // brand
    '--text-high-emphasis': '#1e293b', // slate-800
    '--text-low-emphasis': '#64748b', // slate-500
    '--border': '#e2e8f0', // slate-200
    '--surface': '#ffffff',
    '--surface-low': '#f8fafc', // slate-50
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-navy">
      {/* Mobile Back Button */}
      {onBack && (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 dark:hover:bg-navy/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              {otherUser?.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-dark dark:bg-brand flex items-center justify-center text-white font-semibold">
                  {(otherUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-navy dark:text-white">
                  {otherUser?.name || 'Unknown User'}
                </h3>
                {otherUser && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {channel.data?.appointmentId ? 'Rendez-vous lié' : 'En ligne'}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Bouton de contrôle pour l'avocat (mobile) */}
          {isLawyer && (
            <button
              onClick={handleTogglePermission}
              disabled={isTogglingPermission}
              className={`p-2 rounded-lg transition-colors ${
                clientCanMessage
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              } disabled:opacity-50`}
              title={clientCanMessage ? 'Client autorisé' : 'Client non autorisé'}
            >
              {clientCanMessage ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </button>
          )}
        </div>
      )}

      {/* Stream Chat Components */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Desktop Header - Custom pour afficher seulement le nom */}
        {!onBack && (
          <div className="hidden md:flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-navy p-4 items-center justify-between">
            <div className="flex items-center gap-3">
              {otherUser?.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-dark dark:bg-brand flex items-center justify-center text-white font-semibold">
                  {(otherUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-navy dark:text-white">
                  {otherUser?.name || 'Unknown User'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {linkedAppointment ? 'Rendez-vous lié' : 'En ligne'}
                </p>
              </div>
            </div>
            {/* Bouton de contrôle pour l'avocat */}
            {isLawyer && (
              <button
                onClick={handleTogglePermission}
                disabled={isTogglingPermission}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  clientCanMessage
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                } disabled:opacity-50`}
                title={clientCanMessage ? 'Client autorisé à envoyer des messages' : 'Client non autorisé à envoyer des messages'}
              >
                {clientCanMessage ? (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span className="hidden sm:inline">Client autorisé</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span className="hidden sm:inline">Client non autorisé</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden relative">
          <style>{`
            /* Personnalisation de l'interface GetStream */
            .str-chat {
              height: 100%;
            }
            .str-chat__main-panel {
              max-width: 100% !important;
            }
            .str-chat__message-list {
              padding: 1rem !important;
            }
            .str-chat__message {
              max-width: 70% !important;
              margin: 0.5rem 0 !important;
            }
            .str-chat__message--me {
              margin-left: auto !important;
            }
            .str-chat__message--other {
              margin-right: auto !important;
            }
            .str-chat__input-flat {
              padding: 1rem !important;
              border-top: 1px solid #e2e8f0 !important;
            }
            .str-chat__input-flat-wrapper {
              max-width: 100% !important;
            }
          `}</style>
          <div style={theme} className="h-full">
            <Chat client={client} theme="messaging light">
              <StreamChannel channel={channel}>
                {/* Messages and Input */}
                <Window>
                  <MessageList />
                  {/* Désactiver l'input pour le client si non autorisé */}
                  {isClient && !clientCanMessage ? (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Lock className="h-4 w-4" />
                        <span>Vous n'êtes pas autorisé à envoyer des messages pour le moment. L'avocat vous autorisera quand il sera prêt à répondre.</span>
                      </div>
                    </div>
                  ) : (
                    <MessageInput disabled={isClient && !clientCanMessage} />
                  )}
                </Window>

                {/* Thread (for replies) */}
                <Thread />
              </StreamChannel>
            </Chat>
          </div>
        </div>
      </div>

      {/* Appointment Context Card (if linked) */}
      {linkedAppointment && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy/50">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-400">
              Rendez-vous du {format(parseISO(linkedAppointment.date), 'EEEE d MMMM yyyy', { locale: fr })} à {format(parseISO(linkedAppointment.date), 'HH:mm', { locale: fr })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

