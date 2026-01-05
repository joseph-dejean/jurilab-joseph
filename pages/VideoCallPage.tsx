import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/store';
import { generateToken } from '../services/dailyService';
import { processCompletedMeeting } from '../services/meetingProcessor';
import { getLawyerById } from '../services/firebaseService';
import { UserRole } from '../types';
import { X, Video, VideoOff, Mic, MicOff, Monitor, LogOut } from 'lucide-react';

const VideoCallPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const roomUrl = searchParams.get('roomUrl');
  const appointmentId = searchParams.get('appointmentId');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!roomUrl || !currentUser) {
      setError('URL de la salle ou utilisateur manquant');
      setIsLoading(false);
      return;
    }

    const initializeMeeting = async () => {
      try {
        setIsLoading(true);

        // Extraire le roomId depuis l'URL Daily.co
        // Format: https://domain.daily.co/room-name
        const roomId = roomUrl.split('/').pop()?.split('?')[0];

        if (!roomId) {
          throw new Error('Impossible d\'extraire l\'ID de la salle');
        }

        // Générer un token pour l'utilisateur
        const userToken = await generateToken(
          roomId,
          currentUser.id,
          currentUser.name || 'Utilisateur',
          currentUser.role === UserRole.LAWYER // isOwner
        );

        setToken(userToken);
        setIsLoading(false);
      } catch (err: any) {
        console.error('❌ Error initializing meeting:', err);
        setError(err.message || 'Erreur lors de l\'initialisation de la réunion');
        setIsLoading(false);
      }
    };

    initializeMeeting();
  }, [roomUrl, currentUser]);

  // Écouter les messages de l'iframe Daily.co
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      if (!event.origin.includes('daily.co')) {
        return;
      }

      const data = event.data;

      // Gérer les événements Daily.co
      if (data.type === 'participant-left' && data.participant?.local) {
        // L'utilisateur local a quitté
        handleMeetingEnd();
      }

      if (data.type === 'meeting-ended') {
        handleMeetingEnd();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleMeetingEnd = async () => {
    if (meetingEnded) return; // Éviter les appels multiples

    setMeetingEnded(true);

    // Traiter le transcript et générer le résumé si appointmentId est présent
    if (appointmentId && currentUser) {
      try {
        // Récupérer l'appointment depuis Firebase
        const { getAllAppointments } = await import('../services/firebaseService');
        const appointments = await getAllAppointments();
        const appointment = appointments.find(a => a.id === appointmentId);

        if (appointment && appointment.dailyRoomId) {
          // Récupérer les noms de l'avocat et du client
          const lawyer = await getLawyerById(appointment.lawyerId);
          const lawyerName = lawyer?.name || 'Avocat';

          // Pour le client, on utilise currentUser si c'est le client, sinon on récupère depuis Firebase
          let clientName = 'Client';
          if (currentUser.id === appointment.clientId) {
            clientName = currentUser.name || 'Client';
          } else {
            // TODO: Récupérer le nom du client depuis Firebase si nécessaire
            clientName = 'Client';
          }

          // Lancer le traitement en arrière-plan (ne pas bloquer la redirection)
          // Passer les IDs pour vérifier la présence des deux participants
          processCompletedMeeting(
            appointment,
            lawyerName,
            clientName,
            appointment.lawyerId,
            appointment.clientId
          )
            .then(() => {
              console.log('✅ Meeting processed successfully');
            })
            .catch((error) => {
              console.error('❌ Error processing meeting:', error);
              // Ne pas bloquer l'utilisateur, le traitement pourra être relancé plus tard
            });
        }
      } catch (error) {
        console.error('❌ Error initiating meeting processing:', error);
        // Ne pas bloquer l'utilisateur
      }
    }

    // Rediriger vers la page des rendez-vous après un court délai
    setTimeout(() => {
      navigate('/my-appointments');
    }, 2000);
  };

  const handleLeave = () => {
    if (iframeRef.current) {
      // Envoyer un message à l'iframe pour quitter
      iframeRef.current.contentWindow?.postMessage(
        { type: 'leave-meeting' },
        '*'
      );
    }
    handleMeetingEnd();
  };

  const toggleMute = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: isMuted ? 'unmute-audio' : 'mute-audio' },
        '*'
      );
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: isVideoOff ? 'start-video' : 'stop-video' },
        '*'
      );
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: isScreenSharing ? 'stop-screenshare' : 'start-screenshare' },
        '*'
      );
      setIsScreenSharing(!isScreenSharing);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement de la réunion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">
            Erreur
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/my-appointments')}
            className="px-6 py-2 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg font-medium"
          >
            Retour aux rendez-vous
          </button>
        </div>
      </div>
    );
  }

  if (meetingEnded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <Video className="w-16 h-16 text-brand-DEFAULT mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">
            Réunion terminée
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Redirection vers vos rendez-vous...
          </p>
        </div>
      </div>
    );
  }

  // Construire l'URL Daily.co avec le token
  const dailyIframeUrl = token
    ? `${roomUrl}?t=${token}&lang=fr&enable_transcription=true`
    : `${roomUrl}?lang=fr&enable_transcription=true`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-brand-DEFAULT" />
          <h1 className="text-xl font-semibold text-white">
            Consultation en visioconférence
          </h1>
        </div>
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Quitter
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={dailyIframeUrl}
          allow="camera; microphone; display-capture"
          className="w-full h-full border-0"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            title={isMuted ? 'Activer le micro' : 'Désactiver le micro'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${isVideoOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-colors ${isScreenSharing
              ? 'bg-brand-DEFAULT hover:bg-brand-dark text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            title={isScreenSharing ? 'Arrêter le partage d\'écran' : 'Partager l\'écran'}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={handleLeave}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="Quitter la réunion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
