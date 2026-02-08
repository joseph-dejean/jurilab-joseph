import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import React, { useState } from 'react';
import { ProfileBlock, ProfileBlockType, ProfileBlockSize } from '../../types';
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
  lawyerData?: {
    coordinates?: { lat: number; lng: number };
    location?: string;
  };
}

const SIZE_OPTIONS: { value: ProfileBlockSize; label: string; icon: string }[] = [
  { value: 'small', label: 'Petit', icon: 'S' },
  { value: 'medium', label: 'Moyen', icon: 'M' },
  { value: 'large', label: 'Grand', icon: 'L' },
  { value: 'full', label: 'Pleine largeur', icon: 'F' },
  { value: 'tall', label: 'Vertical', icon: 'T' },
  { value: 'hero', label: 'Hero', icon: 'H' },
];

const BLOCK_TYPE_LABELS: Record<ProfileBlockType, string> = {
  [ProfileBlockType.TEXT]: 'Texte',
  [ProfileBlockType.MEDIA]: 'Média',
  [ProfileBlockType.VIDEO]: 'Vidéo',
  [ProfileBlockType.CONTACT]: 'Contact',
  [ProfileBlockType.LOGO]: 'Logo',
  [ProfileBlockType.MAP]: 'Carte',
  [ProfileBlockType.STATS]: 'Stats',
  [ProfileBlockType.TESTIMONIALS]: 'Avis',
  [ProfileBlockType.CERTIFICATIONS]: 'Certifications',
  [ProfileBlockType.SOCIAL]: 'Réseaux',
  [ProfileBlockType.COLLABORATORS]: 'Équipe',
};

const BLOCK_TYPE_COLORS: Record<ProfileBlockType, string> = {
  [ProfileBlockType.TEXT]: 'bg-blue-500',
  [ProfileBlockType.MEDIA]: 'bg-purple-500',
  [ProfileBlockType.VIDEO]: 'bg-red-500',
  [ProfileBlockType.CONTACT]: 'bg-green-500',
  [ProfileBlockType.LOGO]: 'bg-slate-500',
  [ProfileBlockType.MAP]: 'bg-emerald-500',
  [ProfileBlockType.STATS]: 'bg-amber-500',
  [ProfileBlockType.TESTIMONIALS]: 'bg-pink-500',
  [ProfileBlockType.CERTIFICATIONS]: 'bg-yellow-500',
  [ProfileBlockType.SOCIAL]: 'bg-cyan-500',
  [ProfileBlockType.COLLABORATORS]: 'bg-indigo-500',
};

export const SortableBlock: React.FC<SortableBlockProps> = ({ block, onRemove, onChange, lawyerData }) => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  
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

  const sizeClasses: Record<ProfileBlockSize, string> = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-2 row-span-1',
    large: 'col-span-1 md:col-span-2 row-span-2',
    full: 'col-span-1 md:col-span-3 row-span-1',
    tall: 'col-span-1 row-span-2',
    wide: 'col-span-1 md:col-span-3 row-span-1',
    hero: 'col-span-1 md:col-span-3 row-span-2',
    square: 'col-span-1 row-span-1',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700',
        'group transition-all duration-200',
        'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
        'hover:border-slate-300 dark:hover:border-slate-600',
        sizeClasses[block.size],
        isDragging && 'opacity-60 shadow-2xl ring-2 ring-primary-500 scale-[1.02]'
      )}
    >
      {/* Block Type Indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${BLOCK_TYPE_COLORS[block.type]}`} />
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          {BLOCK_TYPE_LABELS[block.type]}
        </span>
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-1/2 -translate-x-1/2 p-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-sm"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {/* Size Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowSizeSelector(!showSizeSelector)}
            className="p-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
            title="Changer la taille"
          >
            {showSizeSelector ? (
              <Minimize2 className="w-4 h-4 text-slate-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Size Selector Dropdown */}
          {showSizeSelector && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 min-w-[140px] z-30">
              <div className="grid grid-cols-3 gap-1">
                {SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(block.id, { size: option.value });
                      setShowSizeSelector(false);
                    }}
                    className={clsx(
                      'w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition-all',
                      block.size === option.value
                        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    )}
                    title={option.label}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 px-1">
                {SIZE_OPTIONS.find(o => o.value === block.size)?.label}
              </p>
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(block.id)}
          className="p-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors shadow-sm"
          title="Supprimer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Block Content */}
      <div className="h-full overflow-hidden rounded-2xl">
        {renderBlockContent()}
      </div>
    </div>
  );
};
