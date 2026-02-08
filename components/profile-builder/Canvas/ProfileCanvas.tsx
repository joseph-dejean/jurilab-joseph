import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import React from 'react';
import { Sparkles, MousePointerClick } from 'lucide-react';
import { ProfileBlock } from '../../../types';
import { CanvasBlock } from './CanvasBlock';

interface ProfileCanvasProps {
  blocks: ProfileBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<ProfileBlock>) => void;
  lawyerData?: {
    coordinates?: { lat: number; lng: number };
    location?: string;
  };
}

export const ProfileCanvas: React.FC<ProfileCanvasProps> = ({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  lawyerData,
}) => {
  // Click on canvas background to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectBlock(null);
    }
  };

  // Empty state
  if (blocks.length === 0) {
    return (
      <div 
        className="flex-1 flex flex-col items-center justify-center py-20 px-8"
        onClick={handleCanvasClick}
      >
        <div className="relative mb-8">
          {/* Animated background circles */}
          <div className="absolute inset-0 -m-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl animate-pulse delay-500" />
          </div>
          
          {/* Icon */}
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center shadow-xl shadow-primary-500/20">
            <Sparkles className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-deep-900 dark:text-surface-50 mb-3 text-center font-display">
          Créez votre profil unique
        </h3>
        <p className="text-surface-600 dark:text-surface-400 text-center max-w-md mb-8 leading-relaxed">
          Utilisez les blocs ci-dessous pour construire une page professionnelle qui reflète votre expertise et attire vos clients idéaux.
        </p>
        
        <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-deep-800 px-5 py-3 rounded-xl">
          <MousePointerClick className="w-5 h-5 text-primary-500" />
          <span>Cliquez sur un bloc dans la barre ci-dessous pour commencer</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 py-8 px-4 sm:px-8 lg:px-12"
      onClick={handleCanvasClick}
    >
      {/* Canvas container - simulating the actual profile page */}
      <div className="max-w-5xl mx-auto">
        {/* Profile preview header hint */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-surface-400 dark:text-surface-500">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-surface-200 dark:to-deep-700" />
          <span className="px-3">Votre profil tel qu'il apparaîtra aux clients</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-surface-200 dark:to-deep-700" />
        </div>
        
        {/* Grid of blocks */}
        <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[180px] pb-32">
            {blocks.map((block) => (
              <CanvasBlock
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={onSelectBlock}
                onChange={onUpdateBlock}
                lawyerData={lawyerData}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default ProfileCanvas;
