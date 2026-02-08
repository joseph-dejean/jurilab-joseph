import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import React from 'react';
import { ProfileBlock } from '../../types';
import { SortableBlock } from './SortableBlock';

interface DraggableGridProps {
  blocks: ProfileBlock[];
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<ProfileBlock>) => void;
  lawyerData?: {
    coordinates?: { lat: number; lng: number };
    location?: string;
  };
}

export const DraggableGrid: React.FC<DraggableGridProps> = ({ 
  blocks, 
  onRemoveBlock, 
  onUpdateBlock, 
  lawyerData 
}) => {
  return (
    <SortableContext items={blocks.map(b => b.id)} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[180px] pb-20">
        {blocks.map((block) => (
          <SortableBlock
            key={block.id}
            block={block}
            onRemove={onRemoveBlock}
            onChange={onUpdateBlock}
            lawyerData={lawyerData}
          />
        ))}
      </div>
    </SortableContext>
  );
};
