import React from 'react';
import { Mic, User, Clock } from 'lucide-react';

interface TranscriptMessage {
  sessionId: string;
  participantName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface LiveTranscriptPanelProps {
  messages: TranscriptMessage[];
  isActive: boolean;
}

const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({ messages, isActive }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showHelp, setShowHelp] = React.useState(false);

  // Auto-scroll to latest message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show help after 10 seconds if no messages
  React.useEffect(() => {
    if (isActive && messages.length === 0) {
      const timer = setTimeout(() => setShowHelp(true), 10000);
      return () => clearTimeout(timer);
    }
    setShowHelp(false);
  }, [isActive, messages.length]);

  if (!isActive) return null;

  return (
    <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 max-h-64 bg-slate-900/95 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white font-medium text-sm">Transcription en direct</span>
        </div>
        <span className="text-slate-400 text-xs">FR</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="p-4 space-y-3 overflow-y-auto max-h-48 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>En attente de paroles...</p>
            {showHelp && (
              <div className="mt-4 text-xs text-slate-500 bg-slate-800/50 rounded p-3">
                <p className="font-medium mb-1">💡 Transcription non disponible ?</p>
                <p className="mb-2">La transcription en direct nécessite:</p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Compte Daily.co avec transcription activée</li>
                  <li>Parler pendant au moins 3-5 secondes</li>
                  <li>Microphone fonctionnel</li>
                </ul>
                <p className="mt-2 text-yellow-400">
                  ⏰ Le transcript complet sera disponible 10-15 min après l'appel
                </p>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.sessionId}-${msg.timestamp}-${index}`}
              className={`transition-opacity duration-300 ${msg.isFinal ? 'opacity-100' : 'opacity-70'
                }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-DEFAULT/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-brand-DEFAULT" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-300">
                      {msg.participantName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${msg.isFinal ? 'text-white' : 'text-slate-300 italic'
                      }`}
                  >
                    {msg.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/50 flex items-center gap-2">
        <Clock className="w-3 h-3 text-slate-400" />
        <span className="text-xs text-slate-400">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default LiveTranscriptPanel;
