import { MessageSquare, Phone, Mail, Calendar } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, getCustomTextClasses, shouldUseLightText } from '../shared/stylePresets';

interface ContactBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const ContactBlock: React.FC<ContactBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Determine if using custom colors
  const isCustom = block.stylePreset === 'custom' && block.customBgColor;
  const isDarkBg = isCustom ? shouldUseLightText(block) : presetStyles.isDark;
  
  // Container class only for non-custom presets
  const containerClass = isCustom ? '' : presetStyles.container;
  
  // Parse button config from content
  let config = { style: 'primary', action: 'book' };
  try {
    if (block.content) {
      config = { ...config, ...JSON.parse(block.content) };
    }
  } catch {}

  const getActionIcon = () => {
    switch (config.action) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'message': return MessageSquare;
      default: return Calendar;
    }
  };
  
  const ActionIcon = getActionIcon();

  const getButtonClasses = () => {
    switch (config.style) {
      case 'secondary':
        return 'bg-white dark:bg-deep-700 text-deep-800 dark:text-surface-100 border border-surface-300 dark:border-deep-600 hover:bg-surface-50 dark:hover:bg-deep-600';
      case 'accent':
        return 'bg-gradient-to-r from-accent-500 to-accent-600 text-deep-900 shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50';
      default:
        return 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:brightness-110';
    }
  };

  return (
    <div className={`h-full flex flex-col items-center justify-center p-4 md:p-6 text-center ${containerClass}`}>
      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 ${isDarkBg ? 'bg-white/10' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
        <ActionIcon className={`w-5 h-5 md:w-7 md:h-7 ${isDarkBg ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`} />
      </div>
      
      <button className={`w-full py-2.5 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2 ${getButtonClasses()}`}>
        <ActionIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
        {block.title || "Prendre rendez-vous"}
      </button>
      
      {!readOnly && (
        <div className="mt-4 w-full">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Texte du bouton"
            className="w-full bg-white dark:bg-deep-800 border border-surface-200 dark:border-deep-700 text-deep-900 dark:text-white text-sm rounded-lg p-2 text-center focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
      )}
    </div>
  );
};

