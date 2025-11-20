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
}

export const ProfileViewer: React.FC<ProfileViewerProps> = ({ 
  blocks, 
  onContactClick,
  onVideoClick,
  lawyerData
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
          <div onClick={onVideoClick} className="cursor-pointer">
            <VideoBlock block={block} onChange={dummyOnChange} readOnly />
          </div>
        );
      case ProfileBlockType.CONTACT:
        return (
          <div onClick={onContactClick} className="cursor-pointer">
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

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-2 row-span-1',
    large: 'col-span-1 md:col-span-2 row-span-2',
    full: 'col-span-1 md:col-span-3 row-span-1',
    tall: 'col-span-1 row-span-2',
    wide: 'col-span-1 md:col-span-3 row-span-1',
    hero: 'col-span-1 md:col-span-3 row-span-2',
    square: 'col-span-1 row-span-1',
  };

  if (!blocks || blocks.length === 0) {
    return null;
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
      {sortedBlocks.map((block) => (
        <div
          key={block.id}
          className={clsx(
            'bg-white dark:bg-slate-800 rounded-xl shadow-subtle border border-slate-100 dark:border-slate-700 overflow-hidden',
            sizeClasses[block.size]
          )}
        >
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
};

