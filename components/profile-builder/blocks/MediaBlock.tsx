import { Image, Upload } from 'lucide-react';
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
    const url = prompt("Entrez l'URL de l'image (simulation upload):");
    if (url) {
      onChange(block.id, { content: url });
    }
  };

  return (
    <div className="h-full w-full relative group overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      {block.content ? (
        <>
          <img 
            src={block.content} 
            alt={block.title || "Media"} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!readOnly && (
            <button 
              onClick={handleUpload}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
            >
              Changer l'image
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 p-4 text-center">
          <Image className="w-8 h-8 mb-2" />
          {!readOnly ? (
            <button 
              onClick={handleUpload}
              className="text-sm text-brand-DEFAULT hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Ajouter une photo
            </button>
          ) : (
            <span className="text-xs">Aucune image</span>
          )}
        </div>
      )}
    </div>
  );
};

