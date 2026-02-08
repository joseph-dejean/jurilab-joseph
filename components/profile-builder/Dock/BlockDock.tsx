import React, { useState } from 'react';
import {
  Award,
  Building2,
  Image,
  MapPin,
  MessageSquare,
  Quote,
  Share2,
  TrendingUp,
  Type,
  Users,
  Video,
  LucideIcon,
} from 'lucide-react';
import { ProfileBlockType } from '../../../types';

interface BlockDockProps {
  onAddBlock: (type: ProfileBlockType) => void;
  disabled?: boolean;
}

interface DockItem {
  type: ProfileBlockType;
  icon: LucideIcon;
  label: string;
  category: 'content' | 'engagement' | 'branding';
}

const dockItems: DockItem[] = [
  // Content category
  { type: ProfileBlockType.TEXT, icon: Type, label: 'Texte', category: 'content' },
  { type: ProfileBlockType.MEDIA, icon: Image, label: 'Média', category: 'content' },
  { type: ProfileBlockType.VIDEO, icon: Video, label: 'Vidéo', category: 'content' },
  // Engagement category
  { type: ProfileBlockType.CONTACT, icon: MessageSquare, label: 'Contact', category: 'engagement' },
  { type: ProfileBlockType.STATS, icon: TrendingUp, label: 'Stats', category: 'engagement' },
  { type: ProfileBlockType.TESTIMONIALS, icon: Quote, label: 'Avis', category: 'engagement' },
  // Branding category
  { type: ProfileBlockType.LOGO, icon: Building2, label: 'Logo', category: 'branding' },
  { type: ProfileBlockType.MAP, icon: MapPin, label: 'Carte', category: 'branding' },
  { type: ProfileBlockType.CERTIFICATIONS, icon: Award, label: 'Certifs', category: 'branding' },
  { type: ProfileBlockType.SOCIAL, icon: Share2, label: 'Réseaux', category: 'branding' },
  { type: ProfileBlockType.COLLABORATORS, icon: Users, label: 'Équipe', category: 'branding' },
];

export const BlockDock: React.FC<BlockDockProps> = ({ onAddBlock, disabled }) => {
  const [hoveredItem, setHoveredItem] = useState<ProfileBlockType | null>(null);
  const [activeItem, setActiveItem] = useState<ProfileBlockType | null>(null);

  const handleClick = (type: ProfileBlockType) => {
    if (disabled) return;
    
    setActiveItem(type);
    onAddBlock(type);
    
    // Reset animation after a short delay
    setTimeout(() => setActiveItem(null), 300);
  };

  const renderDockItem = (item: DockItem, index: number, isLastInCategory: boolean) => {
    const isHovered = hoveredItem === item.type;
    const isActive = activeItem === item.type;
    
    return (
      <React.Fragment key={item.type}>
        <div className="relative group">
          {/* Tooltip label */}
          <div
            className={`
              absolute -top-10 left-1/2 -translate-x-1/2 
              px-3 py-1.5 rounded-lg
              bg-deep-900 dark:bg-white text-white dark:text-deep-900
              text-xs font-medium whitespace-nowrap
              shadow-lg
              transition-all duration-200 pointer-events-none
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            {item.label}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-deep-900 dark:border-t-white" />
            </div>
          </div>
          
          {/* Dock item button */}
          <button
            onClick={() => handleClick(item.type)}
            onMouseEnter={() => setHoveredItem(item.type)}
            onMouseLeave={() => setHoveredItem(null)}
            disabled={disabled}
            className={`
              relative w-12 h-12 rounded-xl
              flex items-center justify-center
              transition-all duration-200 ease-out
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isHovered ? 'bg-white/90 dark:bg-deep-800 scale-125 -translate-y-2 shadow-lg' : 'bg-white/60 dark:bg-deep-800/60'}
              ${isActive ? 'scale-110 bg-primary-100 dark:bg-primary-900/50' : ''}
              hover:shadow-primary-500/20
            `}
            style={{
              transform: isHovered 
                ? 'scale(1.25) translateY(-8px)' 
                : isActive 
                  ? 'scale(1.1)' 
                  : 'scale(1)',
            }}
          >
            <item.icon 
              className={`
                w-5 h-5 transition-colors duration-200
                ${isHovered || isActive ? 'text-primary-600 dark:text-primary-400' : 'text-deep-600 dark:text-surface-300'}
              `}
            />
            
            {/* Click ripple effect */}
            {isActive && (
              <span className="absolute inset-0 rounded-xl bg-primary-500/20 animate-ping" />
            )}
          </button>
        </div>
        
        {/* Category separator */}
        {isLastInCategory && index < dockItems.length - 1 && (
          <div className="w-px h-8 bg-surface-300/50 dark:bg-deep-600/50 mx-1 self-center" />
        )}
      </React.Fragment>
    );
  };

  // Determine last item in each category
  const getIsLastInCategory = (item: DockItem, index: number): boolean => {
    const nextItem = dockItems[index + 1];
    return nextItem ? nextItem.category !== item.category : false;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      {/* Dock container */}
      <div 
        className="
          flex items-end gap-1 px-4 py-3
          bg-white/70 dark:bg-deep-900/70
          backdrop-blur-xl
          border border-white/30 dark:border-deep-700/50
          rounded-2xl
          shadow-xl shadow-deep-900/10 dark:shadow-black/30
        "
      >
        {dockItems.map((item, index) => 
          renderDockItem(item, index, getIsLastInCategory(item, index))
        )}
      </div>
      
      {/* Subtle reflection effect */}
      <div 
        className="
          absolute inset-x-4 -bottom-1 h-4
          bg-gradient-to-b from-white/10 to-transparent dark:from-deep-800/10
          rounded-b-2xl
          blur-sm
          pointer-events-none
        "
      />
    </div>
  );
};

export default BlockDock;
