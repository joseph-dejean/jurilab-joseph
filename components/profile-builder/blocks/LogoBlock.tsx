import { Building2, Upload, Camera } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, shouldUseLightText } from '../shared/stylePresets';

interface LogoBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const LogoBlock: React.FC<LogoBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Determine if using custom colors
  const isCustom = block.stylePreset === 'custom' && block.customBgColor;
  const isDarkBg = isCustom ? shouldUseLightText(block) : presetStyles.isDark;
  const containerClass = isCustom ? '' : presetStyles.container;
  const subtextClass = isCustom 
    ? (isDarkBg ? 'text-white/60' : 'text-surface-500')
    : presetStyles.subtext;
  
  const handleUpload = () => {
    const url = prompt("Entrez l'URL du logo:");
    if (url) {
      onChange(block.id, { content: url });
    }
  };

  return (
    <div className={`h-full w-full flex items-center justify-center p-6 ${containerClass}`}>
      {block.content ? (
        <div className="relative w-full h-full flex items-center justify-center group">
          <img 
            src={block.content} 
            alt={block.title || "Logo"} 
            className="max-w-full max-h-full object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!readOnly && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 rounded-xl">
              <button 
                onClick={handleUpload}
                className="px-4 py-2 bg-white/90 text-deep-900 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
              >
                <Camera className="w-4 h-4" />
                Changer le logo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex flex-col items-center p-6 text-center ${subtextClass}`}>
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
            isDarkBg ? 'bg-white/10' : 'bg-surface-200 dark:bg-deep-700'
          }`}>
            <Building2 className="w-10 h-10" />
          </div>
          {!readOnly ? (
            <button 
              onClick={handleUpload}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
            >
              <Upload className="w-4 h-4" />
              Ajouter un logo
            </button>
          ) : (
            <span className="text-sm">Logo du cabinet</span>
          )}
        </div>
      )}
    </div>
  );
};

