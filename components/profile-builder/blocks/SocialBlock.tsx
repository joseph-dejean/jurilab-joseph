import { Facebook, Instagram, Linkedin, Twitter, Globe, Share2 } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, getCustomTextClasses, shouldUseLightText } from '../shared/stylePresets';

interface SocialLink {
  id?: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'website';
  url: string;
}

interface SocialBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

const platformConfig = {
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'hover:bg-[#0077b5] hover:text-white' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'hover:bg-[#1877f2] hover:text-white' },
  twitter: { icon: Twitter, label: 'Twitter', color: 'hover:bg-[#1da1f2] hover:text-white' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] hover:text-white' },
  website: { icon: Globe, label: 'Site web', color: 'hover:bg-primary-600 hover:text-white' },
};

export const SocialBlock: React.FC<SocialBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Determine if using custom colors
  const isCustom = block.stylePreset === 'custom' && block.customBgColor;
  const isDarkBg = isCustom ? shouldUseLightText(block) : presetStyles.isDark;
  const textStyles = isCustom ? getCustomTextClasses(block) : presetStyles;
  const containerClass = isCustom ? '' : presetStyles.container;
  
  // Parse social links from content (array format)
  const parseSocial = (): SocialLink[] => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        // Handle both old object format and new array format
        if (Array.isArray(parsed)) return parsed;
        // Convert old object format to array
        return Object.entries(parsed)
          .filter(([_, url]) => url)
          .map(([platform, url]) => ({ platform: platform as SocialLink['platform'], url: url as string }));
      } catch {
        return [];
      }
    }
    return [];
  };

  const socialLinks = parseSocial();
  
  // Get links that have URLs
  const activeLinks = socialLinks.filter(l => l.url);

  return (
    <div className={`h-full flex flex-col items-center justify-center p-6 ${containerClass}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isDarkBg ? 'bg-white/10' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
        <Share2 className={`w-5 h-5 ${isDarkBg ? 'text-white/70' : 'text-primary-600 dark:text-primary-400'}`} />
      </div>
      
      <h3 className={`font-display font-bold mb-5 text-center ${textStyles.heading}`}>
        {block.title || 'Réseaux sociaux'}
      </h3>
      
      {readOnly ? (
        <div className="flex flex-wrap justify-center gap-3">
          {activeLinks.map((link, index) => {
            const config = platformConfig[link.platform];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${
                  isDarkBg 
                    ? 'bg-white/10 text-white/80 hover:bg-white/20' 
                    : `bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-300 ${config.color}`
                }`}
              >
                <Icon className="w-5 h-5" />
              </a>
            );
          })}
          {activeLinks.length === 0 && (
            <p className={`text-sm ${textStyles.subtext}`}>
              Aucun réseau configuré
            </p>
          )}
        </div>
      ) : (
        <div className="w-full space-y-2">
          {Object.entries(platformConfig).map(([platform, config]) => {
            const Icon = config.icon;
            const link = socialLinks.find(l => l.platform === platform);
            return (
              <div key={platform} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-deep-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-deep-500 dark:text-surface-400" />
                </div>
                <input
                  type="url"
                  value={link?.url || ''}
                  onChange={(e) => {
                    const newLinks = socialLinks.filter(l => l.platform !== platform);
                    if (e.target.value) {
                      newLinks.push({ platform: platform as SocialLink['platform'], url: e.target.value });
                    }
                    onChange(block.id, { content: JSON.stringify(newLinks) });
                  }}
                  placeholder={`URL ${config.label}`}
                  className="flex-1 px-3 py-2 text-sm border border-surface-200 dark:border-deep-700 rounded-lg bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

