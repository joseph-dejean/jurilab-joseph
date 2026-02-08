import { Image, Upload, Camera } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface MediaBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const MediaBlock: React.FC<MediaBlockProps> = ({ block, onChange, readOnly }) => {
  const handleUpload = () => {
    // Placeholder for upload logic - in production, use Firebase Storage
    const url = prompt("Entrez l'URL de l'image:");
    if (url) {
      onChange(block.id, { content: url });
    }
  };

  return (
    <div className="h-full w-full relative group overflow-hidden bg-surface-100 dark:bg-deep-800 flex items-center justify-center">
      {block.content ? (
        <>
          <img 
            src={block.content} 
            alt={block.title || "Media"} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!readOnly && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
              <button 
                onClick={handleUpload}
                className="px-4 py-2 bg-white/90 text-deep-900 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
                Changer l'image
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-deep-700 flex items-center justify-center mb-4">
            <Image className="w-8 h-8" />
          </div>
          {!readOnly ? (
            <button 
              onClick={handleUpload}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
            >
              <Upload className="w-4 h-4" />
              Ajouter une image
            </button>
          ) : (
            <span className="text-sm">Aucune image configurée</span>
          )}
        </div>
      )}
    </div>
  );
};

