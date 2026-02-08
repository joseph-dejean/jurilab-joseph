import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Phone, Settings, MessageSquare } from 'lucide-react';

interface ControlsBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  onToggleChat?: () => void;
  onOpenSettings?: () => void;
  showChat?: boolean;
  leftContent?: React.ReactNode; // Additional content for left side (like invite button)
}

const ControlsBar: React.FC<ControlsBarProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  onToggleChat,
  onOpenSettings,
  showChat = false,
  leftContent,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left side - Communication controls + optional content */}
        <div className="flex items-center gap-2">
          {/* Optional left content (e.g., Invite button) */}
          {leftContent}
          
          {/* Microphone */}
          <button
            onClick={onToggleMute}
            className={`group relative p-3 rounded-lg transition-all duration-200 ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={isMuted ? 'Activer le micro' : 'Désactiver le micro'}
          >
            {isMuted ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Camera */}
          <button
            onClick={onToggleVideo}
            className={`group relative p-3 rounded-lg transition-all duration-200 ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
          >
            {isVideoOff ? (
              <VideoOff className="w-4 h-4 text-white" />
            ) : (
              <Video className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`group relative p-3 rounded-lg transition-all duration-200 ${
              isScreenSharing
                ? 'bg-brand-DEFAULT hover:bg-brand-dark'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-4 h-4 text-white" />
            ) : (
              <Monitor className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Center - Leave call button */}
        <button
          onClick={onLeave}
          className="group relative px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-all duration-200 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 rotate-[135deg]" />
            <span className="text-sm">Quitter</span>
          </div>
        </button>

        {/* Right side - Additional controls */}
        <div className="flex items-center gap-2">
          {/* Chat */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`group relative p-3 rounded-lg transition-all duration-200 ${
                showChat
                  ? 'bg-brand-DEFAULT hover:bg-brand-dark'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              title="Chat"
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </button>
          )}

          {/* Settings */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="group relative p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all duration-200"
              title="Paramètres"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlsBar;
