import React, { useState } from 'react';
import {
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Maximize2,
  LayoutGrid,
  Columns,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProfileBlock, ProfileBlockType, ProfileBlockSize, ProfileBlockStylePreset } from '../../../types';
import { ColorPicker } from './ColorPicker';

// Import content editors
import { TextEditor } from './editors/TextEditor';
import { MediaEditor } from './editors/MediaEditor';
import { StatsEditor } from './editors/StatsEditor';
import { TestimonialsEditor } from './editors/TestimonialsEditor';
import { CertificationsEditor } from './editors/CertificationsEditor';
import { SocialEditor } from './editors/SocialEditor';
import { ContactEditor } from './editors/ContactEditor';
import { CollaboratorsEditor } from './editors/CollaboratorsEditor';

interface BlockSettingsProps {
  block: ProfileBlock;
  onSizeChange: (size: ProfileBlockSize) => void;
  onStyleChange: (style: ProfileBlockStylePreset) => void;
  onContentChange: (updates: Partial<ProfileBlock>) => void;
  onCustomColorChange: (bgColor: string, textColor: 'light' | 'dark' | 'auto') => void;
}

// Size options with visual representations
const sizeOptions: { value: ProfileBlockSize; label: string; icon: React.ReactNode; description: string }[] = [
  { 
    value: 'small', 
    label: 'Petit', 
    icon: <Square className="w-4 h-4" />,
    description: '1 colonne'
  },
  { 
    value: 'medium', 
    label: 'Moyen', 
    icon: <Square className="w-5 h-5" />,
    description: '1 colonne'
  },
  { 
    value: 'large', 
    label: 'Grand', 
    icon: <Columns className="w-5 h-5" />,
    description: '2 colonnes'
  },
  { 
    value: 'full', 
    label: 'Pleine largeur', 
    icon: <Maximize2 className="w-5 h-5" />,
    description: '3 colonnes'
  },
  { 
    value: 'tall', 
    label: 'Haut', 
    icon: <RectangleVertical className="w-5 h-5" />,
    description: '1 col, 2 lignes'
  },
  { 
    value: 'wide', 
    label: 'Large', 
    icon: <RectangleHorizontal className="w-5 h-5" />,
    description: '2 colonnes'
  },
];

// Style presets with visual swatches
const stylePresets: { value: ProfileBlockStylePreset; label: string; bgClass: string; textClass: string }[] = [
  { 
    value: 'clean', 
    label: 'Blanc', 
    bgClass: 'bg-white border-surface-200',
    textClass: 'text-deep-900'
  },
  { 
    value: 'cream', 
    label: 'Crème', 
    bgClass: 'bg-surface-50 border-surface-200',
    textClass: 'text-deep-800'
  },
  { 
    value: 'glass', 
    label: 'Verre', 
    bgClass: 'bg-white/50 border-white/30 backdrop-blur-sm',
    textClass: 'text-deep-800'
  },
  { 
    value: 'primary', 
    label: 'Accent', 
    bgClass: 'bg-primary-50 border-primary-200',
    textClass: 'text-primary-900'
  },
  { 
    value: 'dark', 
    label: 'Sombre', 
    bgClass: 'bg-deep-900 border-deep-700',
    textClass: 'text-white'
  },
];

export const BlockSettings: React.FC<BlockSettingsProps> = ({
  block,
  onSizeChange,
  onStyleChange,
  onContentChange,
  onCustomColorChange,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColorMode, setTextColorMode] = useState<'light' | 'dark' | 'auto'>(
    block.customTextColor === 'light' ? 'light' : 
    block.customTextColor === 'dark' ? 'dark' : 'auto'
  );

  const handleColorSelect = (color: string) => {
    onCustomColorChange(color, textColorMode);
  };

  const handleTextColorModeChange = (mode: 'light' | 'dark' | 'auto') => {
    setTextColorMode(mode);
    if (block.customBgColor) {
      onCustomColorChange(block.customBgColor, mode);
    }
  };

  const isCustomColor = block.stylePreset === 'custom' && block.customBgColor;

  // Render the appropriate content editor based on block type
  const renderContentEditor = () => {
    switch (block.type) {
      case ProfileBlockType.TEXT:
        return (
          <TextEditor
            title={block.title || ''}
            content={block.content || ''}
            onChange={(title, content) => onContentChange({ title, content })}
          />
        );
      case ProfileBlockType.MEDIA:
      case ProfileBlockType.LOGO:
        return (
          <MediaEditor
            imageUrl={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.STATS:
        return (
          <StatsEditor
            content={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.TESTIMONIALS:
        return (
          <TestimonialsEditor
            content={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.CERTIFICATIONS:
        return (
          <CertificationsEditor
            content={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.SOCIAL:
        return (
          <SocialEditor
            content={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.CONTACT:
        return (
          <ContactEditor
            title={block.title || ''}
            content={block.content || ''}
            onChange={(title, content) => onContentChange({ title, content })}
          />
        );
      case ProfileBlockType.COLLABORATORS:
        return (
          <CollaboratorsEditor
            content={block.content || ''}
            onChange={(content) => onContentChange({ content })}
          />
        );
      case ProfileBlockType.VIDEO:
      case ProfileBlockType.MAP:
        // These blocks use automatic data, no content editor needed
        return (
          <div className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">
            Ce bloc utilise vos données de profil automatiquement.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Size Selection */}
      <section>
        <h3 className="text-sm font-semibold text-deep-800 dark:text-surface-200 mb-3 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Taille du bloc
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {sizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSizeChange(option.value)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl
                border-2 transition-all duration-200
                ${block.size === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-deep-800'
                }
              `}
            >
              <div className={`
                ${block.size === option.value 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-surface-500 dark:text-surface-400'
                }
              `}>
                {option.icon}
              </div>
              <span className={`
                text-xs font-medium
                ${block.size === option.value 
                  ? 'text-primary-700 dark:text-primary-300' 
                  : 'text-deep-700 dark:text-surface-300'
                }
              `}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Style Selection */}
      <section>
        <h3 className="text-sm font-semibold text-deep-800 dark:text-surface-200 mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          Style visuel
        </h3>
        
        {/* Quick presets */}
        <div className="flex gap-2 mb-3">
          {stylePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onStyleChange(preset.value)}
              className={`
                flex-1 flex flex-col items-center gap-2 p-2.5 rounded-xl
                border-2 transition-all duration-200
                ${(block.stylePreset || 'clean') === preset.value && !isCustomColor
                  ? 'border-primary-500 ring-2 ring-primary-500/20'
                  : 'border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700'
                }
              `}
            >
              <div className={`
                w-7 h-7 rounded-lg border
                ${preset.bgClass}
              `} />
              <span className={`
                text-[10px] font-medium
                ${(block.stylePreset || 'clean') === preset.value && !isCustomColor
                  ? 'text-primary-700 dark:text-primary-300' 
                  : 'text-deep-600 dark:text-surface-400'
                }
              `}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom Color Picker Toggle */}
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`
            w-full flex items-center justify-between p-3 rounded-xl
            border-2 transition-all duration-200
            ${isCustomColor
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-deep-800'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg border border-surface-300 dark:border-deep-600"
              style={{ 
                background: block.customBgColor?.startsWith('gradient:')
                  ? `linear-gradient(135deg, ${block.customBgColor.split(':')[1]}, ${block.customBgColor.split(':')[2]})`
                  : block.customBgColor || 'linear-gradient(135deg, #770722, #991B1B)'
              }}
            />
            <div className="text-left">
              <span className="text-sm font-medium text-deep-800 dark:text-surface-200 block">
                Couleur personnalisée
              </span>
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {isCustomColor 
                  ? block.customBgColor?.startsWith('gradient:') ? 'Dégradé' : block.customBgColor
                  : 'Choisir une couleur'
                }
              </span>
            </div>
          </div>
          {showColorPicker 
            ? <ChevronUp className="w-5 h-5 text-surface-400" />
            : <ChevronDown className="w-5 h-5 text-surface-400" />
          }
        </button>

        {/* Color Picker Panel */}
        {showColorPicker && (
          <div className="mt-3 p-4 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700">
            <ColorPicker
              selectedColor={block.customBgColor}
              onChange={handleColorSelect}
              textColorMode={textColorMode}
              onTextColorChange={handleTextColorModeChange}
            />
          </div>
        )}
      </section>

      {/* Content Editor */}
      <section>
        <h3 className="text-sm font-semibold text-deep-800 dark:text-surface-200 mb-3">
          Contenu
        </h3>
        {renderContentEditor()}
      </section>
    </div>
  );
};

export default BlockSettings;
