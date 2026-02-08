import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import React from 'react';
import { ProfileBlock, ProfileBlockType, ProfileBlockSize, ProfileBlockStylePreset } from '../../../types';
import { ContactBlock } from '../blocks/ContactBlock';
import { MediaBlock } from '../blocks/MediaBlock';
import { TextBlock } from '../blocks/TextBlock';
import { VideoBlock } from '../blocks/VideoBlock';
import { LogoBlock } from '../blocks/LogoBlock';
import { MapBlock } from '../blocks/MapBlock';
import { StatsBlock } from '../blocks/StatsBlock';
import { TestimonialsBlock } from '../blocks/TestimonialsBlock';
import { CertificationsBlock } from '../blocks/CertificationsBlock';
import { SocialBlock } from '../blocks/SocialBlock';
import { CollaboratorsBlock } from '../blocks/CollaboratorsBlock';
import { getCustomColorStyles } from '../shared/stylePresets';

interface CanvasBlockProps {
  block: ProfileBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  lawyerData?: {
    coordinates?: { lat: number; lng: number };
    location?: string;
  };
}

// Grid size classes for different block sizes
const sizeClasses: Record<ProfileBlockSize, string> = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-1 row-span-1',
  large: 'col-span-1 md:col-span-2 row-span-1',
  full: 'col-span-1 md:col-span-3 row-span-1',
  tall: 'col-span-1 row-span-2',
  wide: 'col-span-1 md:col-span-2 row-span-1',
  hero: 'col-span-1 md:col-span-3 row-span-2',
  square: 'col-span-1 row-span-1 aspect-square',
};

// Style preset classes
const getPresetClasses = (preset: ProfileBlockStylePreset = 'clean', isDragging: boolean): string => {
  const baseClasses = isDragging ? 'opacity-90' : '';
  
  switch (preset) {
    case 'clean':
      return `${baseClasses} bg-white dark:bg-deep-900 border-surface-200 dark:border-deep-700`;
    case 'cream':
      return `${baseClasses} bg-surface-50 dark:bg-deep-800 border-surface-200 dark:border-deep-700`;
    case 'glass':
      return `${baseClasses} bg-white/60 dark:bg-deep-900/60 backdrop-blur-lg border-white/40 dark:border-deep-600/40`;
    case 'primary':
      return `${baseClasses} bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/50`;
    case 'dark':
      return `${baseClasses} bg-deep-900 dark:bg-deep-950 border-deep-700 dark:border-deep-600 text-white`;
    case 'custom':
      // Custom colors are applied via inline styles
      return `${baseClasses} border-transparent`;
    default:
      return `${baseClasses} bg-white dark:bg-deep-900 border-surface-200 dark:border-deep-700`;
  }
};

export const CanvasBlock: React.FC<CanvasBlockProps> = ({
  block,
  isSelected,
  onSelect,
  onChange,
  lawyerData,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Get custom color inline styles if applicable
  const customColorStyles = getCustomColorStyles(block);
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : isSelected ? 50 : 'auto',
    ...customColorStyles,
  };

  const renderBlockContent = () => {
    // Pass readOnly=true since editing is done in the panel
    const commonProps = { block, onChange, readOnly: true };
    
    switch (block.type) {
      case ProfileBlockType.TEXT:
        return <TextBlock {...commonProps} />;
      case ProfileBlockType.MEDIA:
        return <MediaBlock {...commonProps} />;
      case ProfileBlockType.VIDEO:
        return <VideoBlock {...commonProps} />;
      case ProfileBlockType.CONTACT:
        return <ContactBlock {...commonProps} />;
      case ProfileBlockType.LOGO:
        return <LogoBlock {...commonProps} />;
      case ProfileBlockType.MAP:
        return (
          <MapBlock 
            {...commonProps}
            coordinates={lawyerData?.coordinates}
            location={lawyerData?.location}
          />
        );
      case ProfileBlockType.STATS:
        return <StatsBlock {...commonProps} />;
      case ProfileBlockType.TESTIMONIALS:
        return <TestimonialsBlock {...commonProps} />;
      case ProfileBlockType.CERTIFICATIONS:
        return <CertificationsBlock {...commonProps} />;
      case ProfileBlockType.SOCIAL:
        return <SocialBlock {...commonProps} />;
      case ProfileBlockType.COLLABORATORS:
        return <CollaboratorsBlock {...commonProps} />;
      default:
        return <div className="p-4 text-surface-500">Bloc inconnu</div>;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(block.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        relative group cursor-pointer
        rounded-2xl border overflow-hidden
        transition-all duration-200 ease-out
        ${sizeClasses[block.size]}
        ${getPresetClasses(block.stylePreset, isDragging)}
        ${isSelected 
          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-deep-950 shadow-xl shadow-primary-500/20' 
          : 'hover:shadow-lg hover:shadow-deep-900/10 dark:hover:shadow-black/20 hover:-translate-y-0.5'
        }
        ${isDragging 
          ? 'scale-[1.02] shadow-2xl shadow-deep-900/20 dark:shadow-black/40 rotate-1' 
          : ''
        }
      `}
    >
      {/* Selection indicator glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-500/10 pointer-events-none z-10" />
      )}
      
      {/* Drag handle - appears on hover */}
      <div
        {...attributes}
        {...listeners}
        className={`
          absolute top-3 left-1/2 -translate-x-1/2 z-30
          p-2 rounded-xl
          bg-white/90 dark:bg-deep-800/90 backdrop-blur-sm
          border border-surface-200/50 dark:border-deep-600/50
          shadow-lg shadow-deep-900/10 dark:shadow-black/20
          cursor-grab active:cursor-grabbing
          transition-all duration-200
          ${isDragging 
            ? 'opacity-100 scale-110' 
            : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-surface-500 dark:text-surface-400" />
      </div>

      {/* Selected badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-30">
          <div className="px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-semibold shadow-lg shadow-primary-600/30">
            Sélectionné
          </div>
        </div>
      )}

      {/* Block content - displayed as preview */}
      <div className="h-full min-h-[120px] overflow-hidden">
        {renderBlockContent()}
      </div>

      {/* Hover overlay hint */}
      <div 
        className={`
          absolute inset-0 flex items-center justify-center
          bg-deep-900/0 group-hover:bg-deep-900/5 dark:group-hover:bg-white/5
          transition-colors duration-200 pointer-events-none
          ${isSelected ? 'hidden' : ''}
        `}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-medium text-deep-700 dark:text-surface-300 bg-white/90 dark:bg-deep-800/90 px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm">
          Cliquez pour modifier
        </span>
      </div>
    </div>
  );
};

export default CanvasBlock;
