import React, { useEffect, useState } from 'react';
import { Video, Clock, Signal, Users } from 'lucide-react';

interface CallHeaderProps {
  title?: string;
  startTime?: Date;
  participantCount?: number;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

const CallHeader: React.FC<CallHeaderProps> = ({
  title = 'Consultation en visioconférence',
  startTime,
  participantCount = 0,
  connectionQuality = 'good',
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityText = () => {
    switch (connectionQuality) {
      case 'excellent': return 'Excellente';
      case 'good': return 'Bonne';
      case 'fair': return 'Moyenne';
      case 'poor': return 'Faible';
      default: return 'Inconnue';
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-DEFAULT/20 rounded-lg">
            <Video className="w-5 h-5 text-brand-DEFAULT" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">{title}</h1>
            <p className="text-slate-400 text-sm">Jurilab</p>
          </div>
        </div>

        {/* Center - Stats */}
        <div className="hidden md:flex items-center gap-6">
          {/* Timer */}
          {startTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-white font-mono text-sm">{elapsedTime}</span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-white text-sm">{participantCount}</span>
          </div>

          {/* Connection Quality */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg">
            <Signal className={`w-4 h-4 ${getQualityColor()}`} />
            <span className="text-slate-300 text-sm">{getQualityText()}</span>
          </div>
        </div>

        {/* Right - Additional info (mobile: compact) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-white font-mono text-xs">{elapsedTime}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="text-white text-xs">{participantCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHeader;
