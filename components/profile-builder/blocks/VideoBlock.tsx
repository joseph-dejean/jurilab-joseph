import { Video, Calendar, Play } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface VideoBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ block, onChange, readOnly }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-deep-800 via-deep-900 to-deep-950 text-white p-6 text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated video icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl shadow-primary-500/30">
            <Video className="w-8 h-8 text-white" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary-500/30 animate-ping opacity-50" style={{ animationDuration: '2s' }} />
        </div>
        
        <h3 className="font-display text-xl font-bold mb-2">
          {block.title || "Consultation Vidéo"}
        </h3>
        <p className="text-sm text-surface-300 mb-5 max-w-[200px]">
          {block.content || "Échangez en visio depuis chez vous"}
        </p>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:brightness-110 transition-all">
          <Calendar className="w-4 h-4" />
          Réserver
        </button>
      </div>
      
      {!readOnly && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Titre"
            className="bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs rounded-lg px-2 py-1.5 w-36 focus:bg-white/15 focus:border-white/40 transition-all"
          />
          <input
            type="text"
            value={block.content || ''}
            onChange={(e) => onChange(block.id, { content: e.target.value })}
            placeholder="Description"
            className="bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs rounded-lg px-2 py-1.5 w-36 focus:bg-white/15 focus:border-white/40 transition-all"
          />
        </div>
      )}
    </div>
  );
};

