import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Signal } from 'lucide-react';
import { DailyParticipant } from '@daily-co/daily-js';

interface VideoTileProps {
  participant: DailyParticipant;
  isLocal?: boolean;
  isScreenShare?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({ participant, isLocal = false, isScreenShare = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!participant) return;

    // Set up video
    if (videoRef.current && participant.video) {
      const videoTrack = isScreenShare 
        ? participant.tracks.screenVideo?.persistentTrack
        : participant.tracks.video?.persistentTrack;
      
      if (videoTrack && videoRef.current.srcObject !== videoTrack) {
        const stream = new MediaStream([videoTrack]);
        videoRef.current.srcObject = stream;
      }
    }

    // Set up audio (only for remote participants)
    if (!isLocal && audioRef.current && participant.audio) {
      const audioTrack = participant.tracks.audio?.persistentTrack;
      if (audioTrack && audioRef.current.srcObject !== audioTrack) {
        const stream = new MediaStream([audioTrack]);
        audioRef.current.srcObject = stream;
      }
    }
  }, [participant, isLocal, isScreenShare]);

  const isVideoOn = isScreenShare 
    ? participant.tracks.screenVideo?.state === 'playable'
    : participant.tracks.video?.state === 'playable';
  
  const isAudioOn = participant.audio;

  const userName = participant.user_name || 'Participant';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Connection quality indicator
  const getQualityColor = () => {
    // This would need to be enhanced with actual network stats
    return 'bg-green-500';
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden group">
      {/* Video element */}
      {isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        // Avatar placeholder when video is off
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="w-24 h-24 rounded-full bg-brand-DEFAULT flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{userInitials}</span>
          </div>
        </div>
      )}

      {/* Audio element (hidden, only for remote participants) */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Overlay info */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLocal && (
            <span className="px-2 py-1 bg-brand-DEFAULT text-white text-xs font-medium rounded">
              Vous
            </span>
          )}
          {isScreenShare && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              Partage d'écran
            </span>
          )}
        </div>

        {/* Connection quality indicator (top right) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/80 backdrop-blur rounded">
            <Signal className="w-3 h-3 text-white" />
            <div className={`w-2 h-2 rounded-full ${getQualityColor()}`} />
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate flex-1">
              {userName}
            </span>
            <div className="flex items-center gap-2 ml-2">
              {!isAudioOn && (
                <div className="p-1.5 bg-red-600 rounded-full">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              {!isVideoOn && !isScreenShare && (
                <div className="p-1.5 bg-red-600 rounded-full">
                  <VideoOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
