import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/store';
import { generateToken, generateGuestToken } from '../services/dailyService';
import { processCompletedMeeting } from '../services/meetingProcessor';
import { getLawyerById } from '../services/firebaseService';
import { UserRole } from '../types';
import { X, AlertCircle } from 'lucide-react';
import DailyIframe, { DailyCall, DailyEvent, DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import CallHeader from '../components/video-call/CallHeader';
import VideoTile from '../components/video-call/VideoTile';
import ControlsBar from '../components/video-call/ControlsBar';
import LiveTranscriptPanel from '../components/video-call/LiveTranscriptPanel';
import PostMeetingTranscript from '../components/video-call/PostMeetingTranscript';
import ChatPanel from '../components/video-call/ChatPanel';
import InviteButton from '../components/video-call/InviteButton';

interface TranscriptMessage {
  sessionId: string;
  participantName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

const VideoCallPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const roomUrl = searchParams.get('roomUrl');
  const appointmentId = searchParams.get('appointmentId');
  const providedToken = searchParams.get('token'); // Token from invite link
  const isGuest = searchParams.get('guest') === 'true'; // Is this a guest?

  // Extract room ID from URL for invite links
  const roomId = roomUrl ? roomUrl.split('/').pop() || '' : '';

  // Daily.co call object
  const callObjectRef = useRef<DailyCall | null>(null);
  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'left' | 'error'>('idle');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // Call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Participants
  const [participants, setParticipants] = useState<{ [id: string]: DailyParticipant }>({});
  const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);

  // Meeting info
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [transcriptionActive, setTranscriptionActive] = useState(false);

  // Live transcription
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [showPostMeetingTranscript, setShowPostMeetingTranscript] = useState(false);
  const [transcriptFetchProgress, setTranscriptFetchProgress] = useState<{
    attempt: number;
    maxAttempts: number;
    status: 'fetching' | 'processing' | 'ready' | 'unavailable';
    estimatedTime?: string;
  } | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);

  // Initialize Daily call object
  useEffect(() => {
    if (!roomUrl || !currentUser) {
      setError('URL de la salle ou utilisateur manquant');
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;

    const initializeCall = async () => {
      try {
        setIsLoading(true);

        // Destroy any existing instance first
        if (callObjectRef.current) {
          console.log('🧹 Cleaning up existing call object');
          callObjectRef.current.destroy();
          callObjectRef.current = null;
        }

        // Extract room ID from URL
        const roomId = roomUrl.split('/').pop()?.split('?')[0];
        if (!roomId) {
          throw new Error("Impossible d'extraire l'ID de la salle");
        }

        // Generate or use provided token
        let userToken: string;

        if (providedToken) {
          // Guest mode: use provided token from invite link
          console.log('👤 Joining as guest with provided token');
          userToken = providedToken;
        } else if (currentUser) {
          // Regular mode: generate token for authenticated user
          userToken = await generateToken(
            roomId,
            currentUser.id,
            currentUser.name || 'Utilisateur',
            currentUser.role === UserRole.LAWYER
          );
        } else {
          throw new Error('No authentication method available');
        }

        if (!isSubscribed) return; // Component unmounted during async operation

        // Create Daily call object with multiple instances allowed
        const callObject = DailyIframe.createCallObject({
          url: roomUrl,
          token: userToken,
          dailyConfig: {
            avoidEval: true,
          },
        });

        callObjectRef.current = callObject;

        // Set up event listeners
        setupEventListeners(callObject);

        // Join the call
        await callObject.join();

        if (isSubscribed) {
          setCallState('joining');
          setIsLoading(false);
        }

      } catch (err: any) {
        console.error('❌ Error initializing call:', err);
        if (isSubscribed) {
          setError(err.message || "Erreur lors de l'initialisation de la réunion");
          setCallState('error');
          setIsLoading(false);
        }
      }
    };

    initializeCall();

    // Cleanup
    return () => {
      isSubscribed = false;
      if (callObjectRef.current) {
        console.log('🧹 Destroying call object on unmount');
        try {
          callObjectRef.current.destroy();
        } catch (err) {
          console.warn('⚠️ Error destroying call object:', err);
        }
        callObjectRef.current = null;
      }
    };
  }, [roomUrl, currentUser, providedToken, isGuest]);

  // Set up Daily event listeners
  const setupEventListeners = (callObject: DailyCall) => {
    // Joined meeting
    callObject.on('joined-meeting', (event?: DailyEventObject) => {
      console.log('✅ Joined meeting');
      setCallState('joined');
      setStartTime(new Date());

      if (event?.participants) {
        setParticipants(event.participants);
        if (event.participants.local) {
          setLocalParticipant(event.participants.local);
        }
      }

      // Start transcription for lawyers (automatically)
      if (currentUser?.role === UserRole.LAWYER) {
        startTranscription(callObject);
      }
    });

    // Participant joined
    callObject.on('participant-joined', (event?: DailyEventObject) => {
      console.log('👤 Participant joined:', event?.participant);
      if (event?.participant) {
        setParticipants(prev => ({
          ...prev,
          [event.participant.session_id]: event.participant,
        }));
      }
    });

    // Participant updated
    callObject.on('participant-updated', (event?: DailyEventObject) => {
      if (event?.participant) {
        setParticipants(prev => ({
          ...prev,
          [event.participant.session_id]: event.participant,
        }));

        if (event.participant.local) {
          setLocalParticipant(event.participant);
        }
      }
    });

    // Participant left
    callObject.on('participant-left', (event?: DailyEventObject) => {
      console.log('👋 Participant left:', event?.participant);
      if (event?.participant) {
        setParticipants(prev => {
          const newParticipants = { ...prev };
          delete newParticipants[event.participant.session_id];
          return newParticipants;
        });
      }
    });

    // Left meeting
    callObject.on('left-meeting', () => {
      console.log('🚪 Left meeting');
      setCallState('left');
      handleMeetingEnd();
    });

    // Track started/stopped
    callObject.on('track-started', (event?: DailyEventObject) => {
      console.log('🎥 Track started:', event?.participant, event?.track);
    });

    // Transcription events
    callObject.on('transcription-started', () => {
      console.log('📝 Transcription started');
      setTranscriptionActive(true);
    });

    callObject.on('transcription-stopped', () => {
      console.log('📝 Transcription stopped');
      setTranscriptionActive(false);
    });

    // Live transcription message
    callObject.on('transcription-message', (event?: any) => {
      if (event?.transcription) {
        const { session_id, participant_id, text, is_final, timestamp } = event.transcription;

        // Get participant name
        const participants = callObject.participants();
        const participant = Object.values(participants).find(
          (p: any) => p.session_id === session_id
        );
        const participantName = participant?.user_name || 'Participant';

        // Add message to transcript
        const message: TranscriptMessage = {
          sessionId: session_id,
          participantName,
          text,
          timestamp: timestamp || Date.now(),
          isFinal: is_final,
        };

        setTranscriptMessages(prev => {
          // If it's an interim message, replace previous interim from same session
          if (!is_final) {
            const filtered = prev.filter(m => m.isFinal || m.sessionId !== session_id);
            return [...filtered, message];
          }
          // If it's final, just add it
          return [...prev, message];
        });

        console.log('📝 Transcript:', participantName, ':', text);
      }
    });

    // Error
    callObject.on('error', (event?: DailyEventObject) => {
      console.error('❌ Daily error:', event);
      setError(event?.errorMsg || 'Une erreur est survenue');
      setCallState('error');
    });

    // App message (for chat)
    callObject.on('app-message', (event?: any) => {
      if (event?.data?.type === 'chat' && event?.data?.message) {
        const chatMsg = {
          id: `${event.data.senderId}-${Date.now()}`,
          senderId: event.data.senderId,
          senderName: event.data.senderName,
          text: event.data.message,
          timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, chatMsg]);
      }
    });
  };

  // Start French transcription
  const startTranscription = async (callObject: DailyCall) => {
    try {
      // Check if transcription is available
      const participants = callObject.participants();
      const participantCount = Object.keys(participants).length;

      // Only start if we have participants
      if (participantCount < 1) {
        console.log('⏳ Waiting for participants before starting transcription');
        return;
      }

      console.log('📝 Attempting to start transcription...');

      // Start transcription with French settings
      await callObject.startTranscription({
        language: 'fr',
      });

      console.log('✅ French transcription started successfully');
      setTranscriptionActive(true);
    } catch (err: any) {
      console.error('❌ Error starting transcription:', err);
      console.warn('⚠️ Live transcription not available. Will fetch transcript after call ends.');

      // Show user-friendly message
      if (err.message?.includes('transcription')) {
        console.warn('💡 Transcription may not be enabled on your Daily.co account.');
        console.warn('💡 Transcript will be available 10-15 minutes after the call ends.');
      }

      // Don't set transcriptionActive to true if it fails
      setTranscriptionActive(false);
    }
  };

  // Handle meeting end
  const handleMeetingEnd = async () => {
    if (meetingEnded) return;
    setMeetingEnded(true);

    // Show post-meeting transcript if we have messages
    if (transcriptMessages.filter(m => m.isFinal).length > 0) {
      setShowPostMeetingTranscript(true);
    }

    // Process transcript and generate summary
    if (appointmentId && currentUser) {
      try {
        const { getAllAppointments } = await import('../services/firebaseService');
        const appointments = await getAllAppointments();
        const appointment = appointments.find(a => a.id === appointmentId);

        if (appointment && appointment.dailyRoomId) {
          const lawyer = await getLawyerById(appointment.lawyerId);
          const lawyerName = lawyer?.name || 'Avocat';

          let clientName = 'Client';
          if (currentUser.id === appointment.clientId) {
            clientName = currentUser.name || 'Client';
          }

          // Process in background WITH PROGRESS TRACKING
          processCompletedMeeting(
            appointment,
            lawyerName,
            clientName,
            appointment.lawyerId,
            appointment.clientId,
            // Progress callback
            (progress) => {
              console.log('📊 Transcript fetch progress:', progress);
              setTranscriptFetchProgress({
                attempt: progress.attempt,
                maxAttempts: progress.maxAttempts,
                status: progress.status,
                estimatedTime: progress.estimatedReadyTime
              });

              // When ready, refresh to show transcript
              if (progress.status === 'ready') {
                console.log('✅ Transcript ready! Refreshing...');
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }
          )
            .then(() => console.log('✅ Meeting processed'))
            .catch(err => console.error('❌ Error processing meeting:', err));
        }
      } catch (error) {
        console.error('❌ Error initiating meeting processing:', error);
      }
    }

    // Redirect after delay (or when user closes transcript)
    if (transcriptMessages.filter(m => m.isFinal).length === 0) {
      setTimeout(() => {
        navigate('/my-appointments');
      }, 2000);
    }
  };

  // Control handlers
  const toggleMute = useCallback(() => {
    if (!callObjectRef.current) return;
    callObjectRef.current.setLocalAudio(!isMuted);
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (!callObjectRef.current) return;
    callObjectRef.current.setLocalVideo(!isVideoOff);
    setIsVideoOff(!isVideoOff);
  }, [isVideoOff]);

  const toggleScreenShare = useCallback(async () => {
    if (!callObjectRef.current) return;

    try {
      if (isScreenSharing) {
        await callObjectRef.current.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await callObjectRef.current.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('❌ Error toggling screen share:', err);
    }
  }, [isScreenSharing]);

  const handleLeave = useCallback(() => {
    if (callObjectRef.current) {
      callObjectRef.current.leave();
    }
  }, []);

  const handleClosePostMeetingTranscript = () => {
    setShowPostMeetingTranscript(false);
    navigate('/my-appointments');
  };

  const handleGenerateAISummary = async () => {
    if (!appointmentId) return;

    try {
      const { getAllAppointments } = await import('../services/firebaseService');
      const appointments = await getAllAppointments();
      const appointment = appointments.find(a => a.id === appointmentId);

      if (appointment && appointment.dailyRoomId) {
        const lawyer = await getLawyerById(appointment.lawyerId);
        const lawyerName = lawyer?.name || 'Avocat';
        const clientName = currentUser?.name || 'Client';

        await processCompletedMeeting(
          appointment,
          lawyerName,
          clientName,
          appointment.lawyerId,
          appointment.clientId
        );

        alert('Résumé IA généré avec succès!');
      }
    } catch (error) {
      console.error('❌ Error generating AI summary:', error);
      alert('Erreur lors de la génération du résumé');
    }
  };

  const handleSendChatMessage = (text: string) => {
    if (!callObjectRef.current || !currentUser) return;

    const message = {
      type: 'chat',
      senderId: currentUser.id,
      senderName: currentUser.name || 'Utilisateur',
      message: text,
    };

    // Send to all participants
    callObjectRef.current.sendAppMessage(message, '*');

    // Add to local messages
    const chatMsg = {
      id: `${currentUser.id}-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name || 'Utilisateur',
      text,
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, chatMsg]);
  };

  // Generate guest invite link
  const handleGenerateGuestLink = async (): Promise<string> => {
    if (!roomId || !roomUrl) {
      throw new Error('Room information not available');
    }

    try {
      console.log('🔗 Generating guest token for room:', roomId);

      // Generate a guest token
      const guestToken = await generateGuestToken(roomId, 'Invité');

      // Create invite URL with token
      const inviteUrl = `${window.location.origin}/video-call?roomUrl=${encodeURIComponent(roomUrl)}&token=${guestToken}&guest=true`;

      console.log('✅ Guest invite link generated');
      return inviteUrl;
    } catch (error) {
      console.error('❌ Error generating guest link:', error);
      throw error;
    }
  };

  // Get participant arrays
  const participantArray = Object.values(participants).filter(p => !p.local);
  const screenShareParticipant = participantArray.find(p => p.screen);
  const remoteParticipants = participantArray.filter(p => !p.screen);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Connexion à la réunion...</p>
          <p className="text-slate-400 text-sm mt-2">Préparation de votre caméra et microphone</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || callState === 'error') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center border border-slate-700">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/my-appointments')}
            className="px-6 py-3 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg font-medium transition-colors"
          >
            Retour aux rendez-vous
          </button>
        </div>
      </div>
    );
  }

  // Meeting ended state
  if (meetingEnded || callState === 'left') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center border border-slate-700">
          <div className="w-16 h-16 bg-brand-DEFAULT/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-brand-DEFAULT" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Réunion terminée</h2>
          <p className="text-slate-400 mb-4">
            Merci pour votre consultation
          </p>
          {transcriptionActive && (
            <p className="text-sm text-slate-500 mb-6">
              Le résumé sera disponible dans quelques minutes
            </p>
          )}
          <div className="w-12 h-12 border-4 border-brand-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 text-sm">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  // Main call UI
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header - More compact */}
      <CallHeader
        startTime={startTime || undefined}
        participantCount={Object.keys(participants).length}
      />

      {/* Main content area with video + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid - Compact */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto">
            {screenShareParticipant ? (
              // Screen share layout - more compact
              <div className="h-full flex gap-3">
                {/* Main screen share */}
                <div className="flex-1 min-h-0">
                  <VideoTile participant={screenShareParticipant} isScreenShare />
                </div>
                {/* Sidebar with participants - smaller */}
                <div className="w-48 flex flex-col gap-2 overflow-y-auto">
                  {localParticipant && (
                    <div className="h-32">
                      <VideoTile participant={localParticipant} isLocal />
                    </div>
                  )}
                  {remoteParticipants.map(p => (
                    <div key={p.session_id} className="h-32">
                      <VideoTile participant={p} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Normal grid layout - smaller videos
              <div className={`h-full grid gap-3 ${remoteParticipants.length === 0
                  ? 'grid-cols-1 max-w-2xl mx-auto'
                  : remoteParticipants.length === 1
                    ? 'grid-cols-2 max-w-4xl mx-auto'
                    : 'grid-cols-2 grid-rows-2 max-w-4xl mx-auto'
                }`}>
                {/* Local participant */}
                {localParticipant && (
                  <VideoTile participant={localParticipant} isLocal />
                )}
                {/* Remote participants */}
                {remoteParticipants.map(p => (
                  <VideoTile key={p.session_id} participant={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            onClose={() => setShowChat(false)}
            currentUserId={currentUser?.id || ''}
          />
        )}
      </div>

      {/* Transcription indicator - smaller */}
      {transcriptionActive && (
        <div className="absolute top-16 right-4 px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>Transcription (FR)</span>
        </div>
      )}

      {/* Transcript Fetch Progress Indicator */}
      {transcriptFetchProgress && transcriptFetchProgress.status !== 'ready' && (
        <div className="absolute top-16 left-4 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg shadow-lg flex items-center gap-2">
          {transcriptFetchProgress.status === 'fetching' && (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>
                Récupération du transcript... (tentative {transcriptFetchProgress.attempt}/{transcriptFetchProgress.maxAttempts})
                {transcriptFetchProgress.estimatedTime && (
                  <span className="text-blue-200 ml-1">• Prêt dans {transcriptFetchProgress.estimatedTime}</span>
                )}
              </span>
            </>
          )}
          {transcriptFetchProgress.status === 'processing' && (
            <>
              <div className="w-2 h-2 bg-white rounded-full animate-spin" />
              <span>Génération du résumé IA...</span>
            </>
          )}
          {transcriptFetchProgress.status === 'unavailable' && (
            <>
              <span className="text-yellow-300">⚠️ Transcript pas encore disponible</span>
            </>
          )}
        </div>
      )}

      {/* Live Transcript Panel - more compact */}
      <LiveTranscriptPanel
        messages={transcriptMessages}
        isActive={transcriptionActive && transcriptMessages.length > 0}
      />

      {/* Controls - more compact */}
      <ControlsBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onLeave={handleLeave}
        onToggleChat={() => setShowChat(!showChat)}
        showChat={showChat}
        leftContent={
          roomId && roomUrl ? (
            <InviteButton
              roomId={roomId}
              roomUrl={roomUrl}
              onGenerateGuestLink={handleGenerateGuestLink}
              compact
            />
          ) : undefined
        }
      />

      {/* Post-Meeting Transcript Modal */}
      {showPostMeetingTranscript && appointmentId && (
        <PostMeetingTranscript
          appointment={{
            id: appointmentId,
            date: startTime?.toISOString() || new Date().toISOString(),
            summary: '',
          } as any}
          liveMessages={transcriptMessages}
          lawyerName={currentUser?.role === UserRole.LAWYER ? currentUser.name || 'Avocat' : 'Avocat'}
          clientName={currentUser?.role === UserRole.CLIENT ? currentUser.name || 'Client' : 'Client'}
          onClose={handleClosePostMeetingTranscript}
          onGenerateAISummary={handleGenerateAISummary}
        />
      )}
    </div>
  );
};

export default VideoCallPage;
