import React, { useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  Type,
  Image,
  Video,
  MessageSquare,
  Building2,
  MapPin,
  TrendingUp,
  Quote,
  Award,
  Share2,
  Users,
  LucideIcon,
} from 'lucide-react';
import { ProfileBlock, ProfileBlockType, ProfileBlockSize, ProfileBlockStylePreset } from '../../../types';
import { BlockSettings } from './BlockSettings';

interface EditPanelProps {
  block: ProfileBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBlock: (id: string, updates: Partial<ProfileBlock>) => void;
  onDeleteBlock: (id: string) => void;
}

const blockTypeInfo: Record<ProfileBlockType, { icon: LucideIcon; label: string; description: string }> = {
  [ProfileBlockType.TEXT]: { icon: Type, label: 'Texte', description: 'Titre et paragraphe' },
  [ProfileBlockType.MEDIA]: { icon: Image, label: 'Média', description: 'Image ou photo' },
  [ProfileBlockType.VIDEO]: { icon: Video, label: 'Vidéo', description: 'Appel vidéo' },
  [ProfileBlockType.CONTACT]: { icon: MessageSquare, label: 'Contact', description: 'Bouton d\'action' },
  [ProfileBlockType.LOGO]: { icon: Building2, label: 'Logo', description: 'Logo du cabinet' },
  [ProfileBlockType.MAP]: { icon: MapPin, label: 'Carte', description: 'Localisation' },
  [ProfileBlockType.STATS]: { icon: TrendingUp, label: 'Statistiques', description: 'Chiffres clés' },
  [ProfileBlockType.TESTIMONIALS]: { icon: Quote, label: 'Témoignages', description: 'Avis clients' },
  [ProfileBlockType.CERTIFICATIONS]: { icon: Award, label: 'Certifications', description: 'Diplômes et certifs' },
  [ProfileBlockType.SOCIAL]: { icon: Share2, label: 'Réseaux', description: 'Liens sociaux' },
  [ProfileBlockType.COLLABORATORS]: { icon: Users, label: 'Équipe', description: 'Collaborateurs' },
};

export const EditPanel: React.FC<EditPanelProps> = ({
  block,
  isOpen,
  onClose,
  onUpdateBlock,
  onDeleteBlock,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset delete confirm when block changes
  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [block?.id]);

  const handleDelete = () => {
    if (block) {
      onDeleteBlock(block.id);
      onClose();
    }
  };

  const handleSizeChange = (size: ProfileBlockSize) => {
    if (block) {
      onUpdateBlock(block.id, { size });
    }
  };

  const handleStyleChange = (stylePreset: ProfileBlockStylePreset) => {
    if (block) {
      // When switching to a preset (not custom), clear custom colors
      if (stylePreset !== 'custom') {
        onUpdateBlock(block.id, { stylePreset, customBgColor: undefined, customTextColor: undefined });
      } else {
        onUpdateBlock(block.id, { stylePreset });
      }
    }
  };

  const handleCustomColorChange = (bgColor: string, textColorMode: 'light' | 'dark' | 'auto') => {
    if (block) {
      onUpdateBlock(block.id, { 
        stylePreset: 'custom', 
        customBgColor: bgColor,
        customTextColor: textColorMode
      });
    }
  };

  const handleContentChange = (updates: Partial<ProfileBlock>) => {
    if (block) {
      onUpdateBlock(block.id, updates);
    }
  };

  if (!block) return null;

  const typeInfo = blockTypeInfo[block.type];
  const Icon = typeInfo.icon;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`
          fixed inset-0 bg-black/30 backdrop-blur-sm z-40
          lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[400px]
          bg-white/95 dark:bg-deep-900/95
          backdrop-blur-xl
          border-l border-surface-200/50 dark:border-deep-700/50
          shadow-2xl shadow-deep-900/20 dark:shadow-black/40
          z-50
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-surface-200/50 dark:border-deep-700/50">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-deep-900 dark:text-surface-50 truncate">
              {typeInfo.label}
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
              {typeInfo.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-xl
              text-surface-500 dark:text-surface-400
              hover:bg-surface-100 dark:hover:bg-deep-800
              hover:text-deep-700 dark:hover:text-surface-200
              transition-colors duration-200
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <BlockSettings
            block={block}
            onSizeChange={handleSizeChange}
            onStyleChange={handleStyleChange}
            onContentChange={handleContentChange}
            onCustomColorChange={handleCustomColorChange}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200/50 dark:border-deep-700/50">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-deep-700 dark:text-surface-300 flex-1">
                Supprimer ce bloc ?
              </span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="
                  px-4 py-2 rounded-xl
                  text-sm font-medium
                  text-surface-600 dark:text-surface-400
                  hover:bg-surface-100 dark:hover:bg-deep-800
                  transition-colors duration-200
                "
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="
                  px-4 py-2 rounded-xl
                  text-sm font-medium
                  bg-red-500 text-white
                  hover:bg-red-600
                  shadow-lg shadow-red-500/20
                  transition-all duration-200
                "
              >
                Supprimer
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="
                flex items-center justify-center gap-2 w-full
                px-4 py-3 rounded-xl
                text-sm font-medium
                text-red-600 dark:text-red-400
                bg-red-50 dark:bg-red-900/20
                hover:bg-red-100 dark:hover:bg-red-900/30
                border border-red-200/50 dark:border-red-800/30
                transition-colors duration-200
              "
            >
              <Trash2 className="w-4 h-4" />
              Supprimer ce bloc
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default EditPanel;
