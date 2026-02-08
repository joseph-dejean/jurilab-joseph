import React, { useState } from 'react';
import { Check, Palette, Pipette } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string | undefined;
  onChange: (color: string) => void;
  textColorMode: 'light' | 'dark' | 'auto';
  onTextColorChange: (mode: 'light' | 'dark' | 'auto') => void;
}

// Comprehensive color palette organized by hue
const colorPalette = {
  // Neutrals
  neutrals: [
    { color: '#FFFFFF', name: 'Blanc' },
    { color: '#F8FAFC', name: 'Gris très clair' },
    { color: '#F1F5F9', name: 'Gris clair' },
    { color: '#E2E8F0', name: 'Gris' },
    { color: '#94A3B8', name: 'Gris moyen' },
    { color: '#64748B', name: 'Gris foncé' },
    { color: '#334155', name: 'Ardoise' },
    { color: '#1E1B24', name: 'Noir profond' },
  ],
  // Reds / Primary
  reds: [
    { color: '#FEF2F2', name: 'Rose pâle' },
    { color: '#FECACA', name: 'Rose clair' },
    { color: '#F87171', name: 'Rouge clair' },
    { color: '#EF4444', name: 'Rouge' },
    { color: '#DC2626', name: 'Rouge vif' },
    { color: '#991B1B', name: 'Rouge foncé' },
    { color: '#770722', name: 'Bordeaux' },
    { color: '#450A0A', name: 'Bordeaux foncé' },
  ],
  // Oranges / Ambers
  oranges: [
    { color: '#FFFBEB', name: 'Crème' },
    { color: '#FEF3C7', name: 'Jaune pâle' },
    { color: '#FCD34D', name: 'Or clair' },
    { color: '#F59E0B', name: 'Ambre' },
    { color: '#D97706', name: 'Orange' },
    { color: '#B45309', name: 'Orange foncé' },
    { color: '#92400E', name: 'Bronze' },
    { color: '#78350F', name: 'Marron' },
  ],
  // Greens
  greens: [
    { color: '#ECFDF5', name: 'Menthe pâle' },
    { color: '#A7F3D0', name: 'Menthe' },
    { color: '#6EE7B7', name: 'Vert clair' },
    { color: '#34D399', name: 'Émeraude' },
    { color: '#10B981', name: 'Vert' },
    { color: '#059669', name: 'Vert moyen' },
    { color: '#047857', name: 'Vert foncé' },
    { color: '#064E3B', name: 'Vert forêt' },
  ],
  // Blues
  blues: [
    { color: '#EFF6FF', name: 'Bleu glacé' },
    { color: '#BFDBFE', name: 'Bleu pâle' },
    { color: '#93C5FD', name: 'Bleu clair' },
    { color: '#60A5FA', name: 'Bleu ciel' },
    { color: '#3B82F6', name: 'Bleu' },
    { color: '#2563EB', name: 'Bleu royal' },
    { color: '#1D4ED8', name: 'Bleu foncé' },
    { color: '#1E3A5F', name: 'Bleu marine' },
  ],
  // Purples
  purples: [
    { color: '#FAF5FF', name: 'Lavande pâle' },
    { color: '#E9D5FF', name: 'Lavande' },
    { color: '#C4B5FD', name: 'Violet clair' },
    { color: '#A78BFA', name: 'Violet' },
    { color: '#8B5CF6', name: 'Violet vif' },
    { color: '#7C3AED', name: 'Violet foncé' },
    { color: '#6D28D9', name: 'Pourpre' },
    { color: '#4C1D95', name: 'Prune' },
  ],
  // Pinks
  pinks: [
    { color: '#FDF2F8', name: 'Rose poudré' },
    { color: '#FCE7F3', name: 'Rose pâle' },
    { color: '#FBCFE8', name: 'Rose bonbon' },
    { color: '#F9A8D4', name: 'Rose' },
    { color: '#EC4899', name: 'Fuchsia' },
    { color: '#DB2777', name: 'Rose vif' },
    { color: '#BE185D', name: 'Rose foncé' },
    { color: '#831843', name: 'Magenta' },
  ],
};

// Gradient presets
const gradientPresets = [
  { from: '#770722', to: '#991B1B', name: 'Bordeaux' },
  { from: '#1E3A5F', to: '#334155', name: 'Nuit' },
  { from: '#7C3AED', to: '#EC4899', name: 'Violet-Rose' },
  { from: '#059669', to: '#10B981', name: 'Émeraude' },
  { from: '#F59E0B', to: '#FCD34D', name: 'Or' },
  { from: '#3B82F6', to: '#8B5CF6', name: 'Bleu-Violet' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onChange,
  textColorMode,
  onTextColorChange,
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'gradients' | 'custom'>('colors');
  const [customHex, setCustomHex] = useState(selectedColor || '#770722');

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  const handleGradientSelect = (from: string, to: string) => {
    // Store gradient as a special format
    onChange(`gradient:${from}:${to}`);
  };

  const isGradient = selectedColor?.startsWith('gradient:');
  const selectedGradient = isGradient ? selectedColor.split(':').slice(1) : null;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-deep-800 rounded-xl">
        <button
          onClick={() => setActiveTab('colors')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            text-xs font-medium transition-all duration-200
            ${activeTab === 'colors'
              ? 'bg-white dark:bg-deep-700 text-deep-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-deep-800'
            }
          `}
        >
          <Palette className="w-3.5 h-3.5" />
          Couleurs
        </button>
        <button
          onClick={() => setActiveTab('gradients')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            text-xs font-medium transition-all duration-200
            ${activeTab === 'gradients'
              ? 'bg-white dark:bg-deep-700 text-deep-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-deep-800'
            }
          `}
        >
          <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-r from-primary-500 to-accent-500" />
          Dégradés
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            text-xs font-medium transition-all duration-200
            ${activeTab === 'custom'
              ? 'bg-white dark:bg-deep-700 text-deep-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-deep-800'
            }
          `}
        >
          <Pipette className="w-3.5 h-3.5" />
          Personnalisé
        </button>
      </div>

      {/* Color Grid */}
      {activeTab === 'colors' && (
        <div className="space-y-3">
          {Object.entries(colorPalette).map(([category, colors]) => (
            <div key={category}>
              <div className="flex gap-1">
                {colors.map((item) => (
                  <button
                    key={item.color}
                    onClick={() => onChange(item.color)}
                    title={item.name}
                    className={`
                      relative w-8 h-8 rounded-lg transition-all duration-150
                      hover:scale-110 hover:z-10 hover:shadow-lg
                      ${selectedColor === item.color 
                        ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-deep-900 scale-110 z-10' 
                        : ''
                      }
                    `}
                    style={{ backgroundColor: item.color }}
                  >
                    {selectedColor === item.color && (
                      <Check 
                        className={`
                          absolute inset-0 m-auto w-4 h-4
                          ${['#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#FFFBEB', '#FEF3C7', '#ECFDF5', '#EFF6FF', '#FAF5FF', '#FDF2F8', '#FCE7F3', '#FEF2F2', '#FECACA', '#A7F3D0', '#BFDBFE', '#E9D5FF', '#FBCFE8', '#FCD34D'].includes(item.color)
                            ? 'text-deep-800' 
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gradient Presets */}
      {activeTab === 'gradients' && (
        <div className="grid grid-cols-3 gap-2">
          {gradientPresets.map((gradient) => (
            <button
              key={gradient.name}
              onClick={() => handleGradientSelect(gradient.from, gradient.to)}
              title={gradient.name}
              className={`
                relative h-16 rounded-xl transition-all duration-150
                hover:scale-105 hover:shadow-lg
                ${selectedGradient && selectedGradient[0] === gradient.from && selectedGradient[1] === gradient.to
                  ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-deep-900 scale-105'
                  : ''
                }
              `}
              style={{ 
                background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` 
              }}
            >
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium text-white/90 drop-shadow-sm">
                {gradient.name}
              </span>
              {selectedGradient && selectedGradient[0] === gradient.from && selectedGradient[1] === gradient.to && (
                <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom Hex Input */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-deep-700 dark:text-surface-300 mb-2">
              Code couleur HEX
            </label>
            <div className="flex gap-2">
              <div 
                className="w-12 h-10 rounded-lg border border-surface-200 dark:border-deep-700 flex-shrink-0"
                style={{ backgroundColor: customHex }}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                placeholder="#770722"
                className="
                  flex-1 px-3 py-2 rounded-lg
                  bg-surface-50 dark:bg-deep-800
                  border border-surface-200 dark:border-deep-700
                  text-deep-900 dark:text-surface-100
                  font-mono text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                  transition-all
                "
              />
            </div>
          </div>
          
          {/* Native color picker */}
          <div>
            <label className="block text-xs font-medium text-deep-700 dark:text-surface-300 mb-2">
              Sélecteur de couleur
            </label>
            <input
              type="color"
              value={customHex}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="w-full h-12 rounded-lg cursor-pointer border border-surface-200 dark:border-deep-700"
            />
          </div>
        </div>
      )}

      {/* Text Color Toggle */}
      <div className="pt-3 border-t border-surface-200 dark:border-deep-700">
        <label className="block text-xs font-medium text-deep-700 dark:text-surface-300 mb-2">
          Couleur du texte
        </label>
        <div className="flex gap-2">
          {[
            { value: 'auto', label: 'Auto', desc: 'Contraste auto' },
            { value: 'dark', label: 'Foncé', desc: 'Texte noir' },
            { value: 'light', label: 'Clair', desc: 'Texte blanc' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onTextColorChange(option.value as 'light' | 'dark' | 'auto')}
              className={`
                flex-1 flex flex-col items-center gap-1 p-2 rounded-lg
                border-2 transition-all duration-200
                ${textColorMode === option.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-surface-200 dark:border-deep-700 hover:border-primary-300'
                }
              `}
            >
              <div 
                className={`
                  w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold
                  ${option.value === 'dark' 
                    ? 'bg-white text-deep-900 border border-surface-300' 
                    : option.value === 'light'
                      ? 'bg-deep-900 text-white'
                      : 'bg-gradient-to-br from-white to-deep-900 text-transparent'
                  }
                `}
              >
                A
              </div>
              <span className="text-[10px] font-medium text-deep-600 dark:text-surface-400">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
