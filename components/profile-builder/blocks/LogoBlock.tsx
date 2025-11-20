import { Building2, Upload } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface LogoBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const LogoBlock: React.FC<LogoBlockProps> = ({ block, onChange, readOnly }) => {
  const handleUpload = () => {
    // Placeholder for upload logic - in production, use Firebase Storage
    const url = prompt("Entrez l'URL du logo (simulation upload):");
    if (url) {
      onChange(block.id, { content: url });
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-800 p-6">
      {block.content ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={block.content} 
            alt={block.title || "Logo"} 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!readOnly && (
            <button 
              onClick={handleUpload}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium rounded"
            >
              Changer le logo
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 p-4 text-center">
          <Building2 className="w-12 h-12 mb-3" />
          {!readOnly ? (
            <button 
              onClick={handleUpload}
              className="text-sm text-brand-DEFAULT hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Ajouter un logo
            </button>
          ) : (
            <span className="text-xs">Aucun logo</span>
          )}
        </div>
      )}
    </div>
  );
};

