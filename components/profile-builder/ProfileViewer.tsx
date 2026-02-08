import React from 'react';
import { ProfileBlock, ProfileBlockType } from '../../types';
import { TextBlock } from './blocks/TextBlock';
import { MediaBlock } from './blocks/MediaBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { ContactBlock } from './blocks/ContactBlock';
import { LogoBlock } from './blocks/LogoBlock';
import { MapBlock } from './blocks/MapBlock';
import { StatsBlock } from './blocks/StatsBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { CertificationsBlock } from './blocks/CertificationsBlock';
import { SocialBlock } from './blocks/SocialBlock';
import { CollaboratorsBlock } from './blocks/CollaboratorsBlock';
import clsx from 'clsx';

interface ProfileViewerProps {
  blocks: ProfileBlock[];
  onContactClick?: () => void;
  onVideoClick?: () => void;
  lawyerData?: {
    coordinates?: { lat: number; lng: number };
    location?: string;
  };
  compact?: boolean; // For use in modals with limited space
}

export const ProfileViewer: React.FC<ProfileViewerProps> = ({ 
  blocks, 
  onContactClick,
  onVideoClick,
  lawyerData,
  compact = false
}) => {
  const dummyOnChange = () => {}; // Dummy function for read-only mode

  const renderBlock = (block: ProfileBlock) => {
    switch (block.type) {
      case ProfileBlockType.TEXT:
        return <TextBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.MEDIA:
        return <MediaBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.VIDEO:
        return (
          <div onClick={onVideoClick} className="cursor-pointer hover:opacity-90 transition-opacity">
            <VideoBlock block={block} onChange={dummyOnChange} readOnly />
          </div>
        );
      case ProfileBlockType.CONTACT:
        return (
          <div onClick={onContactClick} className="cursor-pointer hover:opacity-90 transition-opacity">
            <ContactBlock block={block} onChange={dummyOnChange} readOnly />
          </div>
        );
      case ProfileBlockType.LOGO:
        return <LogoBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.MAP:
        return (
          <MapBlock 
            block={block} 
            onChange={dummyOnChange} 
            readOnly 
            coordinates={lawyerData?.coordinates}
            location={lawyerData?.location}
          />
        );
      case ProfileBlockType.STATS:
        return <StatsBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.TESTIMONIALS:
        return <TestimonialsBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.CERTIFICATIONS:
        return <CertificationsBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.SOCIAL:
        return <SocialBlock block={block} onChange={dummyOnChange} readOnly />;
      case ProfileBlockType.COLLABORATORS:
        return <CollaboratorsBlock block={block} onChange={dummyOnChange} readOnly />;
      default:
        return null;
    }
  };

  // Height classes for different block sizes - more flexible approach
  const getHeightClass = (size: string, type: ProfileBlockType): string => {
    // For compact mode (in modals), use smaller heights
    if (compact) {
      switch (size) {
        case 'small':
        case 'square':
          return 'min-h-[120px]';
        case 'medium':
          return 'min-h-[140px]';
        case 'large':
        case 'hero':
          return 'min-h-[200px]';
        case 'tall':
          return 'min-h-[240px]';
        case 'full':
        case 'wide':
          return 'min-h-[120px]';
        default:
          return 'min-h-[120px]';
      }
    }
    
    // For full-size display (profile page)
    switch (size) {
      case 'small':
      case 'square':
        return 'min-h-[160px] max-h-[200px]';
      case 'medium':
        return 'min-h-[180px] max-h-[240px]';
      case 'large':
        return 'min-h-[280px] max-h-[360px]';
      case 'tall':
        return 'min-h-[320px] max-h-[400px]';
      case 'full':
      case 'wide':
        return 'min-h-[160px] max-h-[220px]';
      case 'hero':
        return 'min-h-[300px] max-h-[400px]';
      default:
        return 'min-h-[160px]';
    }
  };

  // Column span classes
  const getColSpan = (size: string): string => {
    if (compact) {
      // In compact mode, use a 2-column layout
      switch (size) {
        case 'full':
        case 'wide':
        case 'hero':
        case 'large':
          return 'col-span-2';
        default:
          return 'col-span-1';
      }
    }
    
    // Full-size uses 3 columns
    switch (size) {
      case 'small':
      case 'square':
      case 'tall':
        return 'col-span-1';
      case 'medium':
      case 'large':
        return 'col-span-1 md:col-span-2';
      case 'full':
      case 'wide':
      case 'hero':
        return 'col-span-1 md:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Container classes based on mode
  const gridClasses = compact 
    ? 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-1 md:grid-cols-3 gap-4';

  return (
    <div className={gridClasses}>
      {sortedBlocks.map((block, index) => (
        <div
          key={block.id}
          className={clsx(
            'bg-white dark:bg-deep-900 rounded-xl overflow-hidden transition-all duration-200',
            'border border-surface-200 dark:border-deep-700',
            'hover:shadow-md hover:border-surface-300 dark:hover:border-deep-600',
            getColSpan(block.size),
            getHeightClass(block.size, block.type)
          )}
          style={{
            animationDelay: `${index * 50}ms`
          }}
        >
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
};

