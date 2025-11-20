import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { GripVertical, X } from 'lucide-react';
import React from 'react';
import { ProfileBlock, ProfileBlockType } from '../../types';
import { ContactBlock } from './blocks/ContactBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { TextBlock } from './blocks/TextBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { LogoBlock } from './blocks/LogoBlock';
import { MapBlock } from './blocks/MapBlock';
import { StatsBlock } from './blocks/StatsBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { CertificationsBlock } from './blocks/CertificationsBlock';
import { SocialBlock } from './blocks/SocialBlock';
import { CollaboratorsBlock } from './blocks/CollaboratorsBlock';

interface SortableBlockProps {
  block: ProfileBlock;
  onRemove: (id: string) => void;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({ block, onRemove, onChange, lawyerData }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case ProfileBlockType.TEXT:
        return <TextBlock block={block} onChange={onChange} />;
      case ProfileBlockType.MEDIA:
        return <MediaBlock block={block} onChange={onChange} />;
      case ProfileBlockType.VIDEO:
        return <VideoBlock block={block} onChange={onChange} />;
      case ProfileBlockType.CONTACT:
        return <ContactBlock block={block} onChange={onChange} />;
      case ProfileBlockType.LOGO:
        return <LogoBlock block={block} onChange={onChange} />;
      case ProfileBlockType.MAP:
        return (
          <MapBlock 
            block={block} 
            onChange={onChange} 
            coordinates={lawyerData?.coordinates}
            location={lawyerData?.location}
          />
        );
      case ProfileBlockType.STATS:
        return <StatsBlock block={block} onChange={onChange} />;
      case ProfileBlockType.TESTIMONIALS:
        return <TestimonialsBlock block={block} onChange={onChange} />;
      case ProfileBlockType.CERTIFICATIONS:
        return <CertificationsBlock block={block} onChange={onChange} />;
      case ProfileBlockType.SOCIAL:
        return <SocialBlock block={block} onChange={onChange} />;
      case ProfileBlockType.COLLABORATORS:
        return <CollaboratorsBlock block={block} onChange={onChange} />;
      default:
        return <div>Unknown block type</div>;
    }
  };

  const sizeClasses = {
    small: 'col-span-1 row-span-1',           // 1x1 - Petit carré
    medium: 'col-span-1 md:col-span-2 row-span-1',  // 2x1 - Rectangle horizontal
    large: 'col-span-1 md:col-span-2 row-span-2',   // 2x2 - Grand carré
    full: 'col-span-1 md:col-span-3 row-span-1',     // 3x1 - Bandeau complet
    tall: 'col-span-1 row-span-2',                   // 1x2 - Rectangle vertical
    wide: 'col-span-1 md:col-span-3 row-span-1',     // 3x1 - Large (identique à full)
    hero: 'col-span-1 md:col-span-3 row-span-2',      // 3x2 - Format héro
    square: 'col-span-1 row-span-1',                 // 1x1 - Carré (identique à small)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative bg-white dark:bg-slate-800 rounded-xl shadow-subtle border border-slate-100 dark:border-slate-700 group transition-shadow hover:shadow-subtle-lg',
        sizeClasses[block.size],
        isDragging && 'opacity-50 shadow-2xl ring-2 ring-brand-DEFAULT'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 bg-white/80 dark:bg-slate-700/80 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-slate-100 dark:hover:bg-slate-600"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(block.id)}
        className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-slate-700/80 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Resize Controls */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-wrap gap-1 max-w-[120px]">
        {(['small', 'medium', 'large', 'full', 'tall', 'wide', 'hero', 'square'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onChange(block.id, { size: s })}
            className={clsx(
              "w-6 h-6 text-[9px] flex items-center justify-center rounded border font-bold",
              block.size === s 
                ? "bg-brand-DEFAULT text-white border-brand-DEFAULT shadow-md" 
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
            )}
            title={`Taille: ${s}`}
          >
            {s === 'small' ? 'S' : s === 'medium' ? 'M' : s === 'large' ? 'L' : s === 'full' ? 'F' : s === 'tall' ? 'T' : s === 'wide' ? 'W' : s === 'hero' ? 'H' : 'Q'}
          </button>
        ))}
      </div>

      <div className="h-full overflow-hidden rounded-xl">
        {renderBlockContent()}
      </div>
    </div>
  );
};

