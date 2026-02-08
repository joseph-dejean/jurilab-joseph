import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, getCustomTextClasses } from '../shared/stylePresets';

interface TextBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Use custom text classes if custom colors are applied
  const textStyles = block.stylePreset === 'custom' && block.customBgColor
    ? getCustomTextClasses(block)
    : presetStyles;
  
  // Only apply container class for non-custom presets (custom uses inline styles)
  const containerClass = block.stylePreset === 'custom' ? '' : presetStyles.container;
  
  return (
    <div className={`h-full flex flex-col gap-2 md:gap-3 p-4 md:p-5 overflow-hidden ${containerClass}`}>
      {readOnly ? (
        <>
          {block.title && (
            <h3 className={`text-base md:text-xl font-bold font-display leading-tight ${textStyles.heading}`}>
              {block.title}
            </h3>
          )}
          {block.content && (
            <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-auto ${textStyles.text}`}>
              {block.content}
            </p>
          )}
          {!block.title && !block.content && (
            <div className={`flex-1 flex items-center justify-center ${textStyles.subtext}`}>
              <span className="text-xs md:text-sm italic">Aucun contenu</span>
            </div>
          )}
        </>
      ) : (
        <>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Titre (ex: Ma philosophie)"
            className="w-full p-3 border border-surface-200 dark:border-deep-700 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 font-display font-bold text-deep-900 dark:text-white bg-white dark:bg-deep-800 transition-all"
          />
          <textarea
            value={block.content || ''}
            onChange={(e) => onChange(block.id, { content: e.target.value })}
            placeholder="Écrivez votre texte ici..."
            className="w-full flex-1 p-3 border border-surface-200 dark:border-deep-700 rounded-xl focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 transition-all"
          />
        </>
      )}
    </div>
  );
};

