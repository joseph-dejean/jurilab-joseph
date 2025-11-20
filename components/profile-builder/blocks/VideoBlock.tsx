import { Video } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface VideoBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ block, onChange, readOnly }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-navy dark:bg-navy-dark text-white p-6 text-center rounded-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-light to-navy-dark opacity-50" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm">
          <Video className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-serif text-lg font-bold mb-1">
          {block.title || "Consultation Vidéo"}
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          {block.content || "Réservez un créneau en visio directement."}
        </p>
        <button className="px-4 py-2 bg-brand-DEFAULT text-white rounded-full text-sm font-medium hover:bg-brand-dark transition-colors">
          Prendre RDV
        </button>
      </div>
      
      {!readOnly && (
        <div className="absolute top-2 right-2 z-20">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Titre"
            className="bg-white/10 border-none text-white placeholder-white/50 text-xs rounded p-1 mb-1 w-32 block"
          />
        </div>
      )}
    </div>
  );
};

