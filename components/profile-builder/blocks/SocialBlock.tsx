import { Facebook, Instagram, Linkedin, Twitter, Globe } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface SocialBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const SocialBlock: React.FC<SocialBlockProps> = ({ block, onChange, readOnly }) => {
  // Parse social links from content (JSON object)
  const parseSocial = () => {
    if (block.content) {
      try {
        return JSON.parse(block.content);
      } catch {
        return {};
      }
    }
    return {
      linkedin: '',
      facebook: '',
      twitter: '',
      instagram: '',
      website: ''
    };
  };

  const social = parseSocial();
  const socialIcons = {
    linkedin: Linkedin,
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    website: Globe
  };

  const handleLinkChange = (platform: string, url: string) => {
    const newSocial = { ...social, [platform]: url };
    onChange(block.id, { content: JSON.stringify(newSocial) });
  };

  return (
    <div className="h-full flex flex-col justify-center bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
      <h3 className="font-serif font-bold text-navy dark:text-white mb-4 text-center">
        {block.title || 'Réseaux sociaux'}
      </h3>
      {readOnly ? (
        <div className="flex flex-wrap justify-center gap-3">
          {Object.entries(social).map(([platform, url]) => {
            if (!url) return null;
            const Icon = socialIcons[platform as keyof typeof socialIcons];
            if (!Icon) return null;
            return (
              <a
                key={platform}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-brand-DEFAULT hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(socialIcons).map(([platform, Icon]) => (
            <div key={platform} className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <input
                type="url"
                value={social[platform] || ''}
                onChange={(e) => handleLinkChange(platform, e.target.value)}
                placeholder={`URL ${platform}`}
                className="flex-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

