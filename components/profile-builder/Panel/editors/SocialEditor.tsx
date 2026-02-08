import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Facebook, Instagram, Globe, Plus, Trash2 } from 'lucide-react';

interface SocialLink {
  id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'website';
  url: string;
}

interface SocialEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const platforms = [
  { value: 'linkedin' as const, label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
  { value: 'twitter' as const, label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/...' },
  { value: 'facebook' as const, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { value: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { value: 'website' as const, label: 'Site web', icon: Globe, placeholder: 'https://votresite.com' },
];

export const SocialEditor: React.FC<SocialEditorProps> = ({ content, onChange }) => {
  const [links, setLinks] = useState<SocialLink[]>(() => {
    try {
      return content ? JSON.parse(content) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(links));
  }, [links]);

  const addLink = (platform: SocialLink['platform']) => {
    setLinks(prev => [...prev, { id: generateId(), platform, url: '' }]);
  };

  const updateLink = (id: string, url: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, url } : l));
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const usedPlatforms = links.map(l => l.platform);
  const availablePlatforms = platforms.filter(p => !usedPlatforms.includes(p.value));

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Ajoutez vos liens de réseaux sociaux.
      </p>

      {/* Existing links */}
      {links.map((link) => {
        const platform = platforms.find(p => p.value === link.platform)!;
        const Icon = platform.icon;
        
        return (
          <div
            key={link.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700"
          >
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-deep-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-deep-600 dark:text-surface-300" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">
                {platform.label}
              </label>
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(link.id, e.target.value)}
                placeholder={platform.placeholder}
                className="
                  w-full px-3 py-2 rounded-lg
                  bg-white dark:bg-deep-900
                  border border-surface-200 dark:border-deep-600
                  text-deep-900 dark:text-surface-100 text-sm
                  placeholder:text-surface-400
                  focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                  transition-all duration-200
                "
              />
            </div>
            <button
              onClick={() => removeLink(link.id)}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Add new platform */}
      {availablePlatforms.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Ajouter un réseau :
          </span>
          <div className="flex flex-wrap gap-2">
            {availablePlatforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.value}
                  onClick={() => addLink(platform.value)}
                  className="
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    bg-surface-100 dark:bg-deep-800
                    border border-surface-200 dark:border-deep-700
                    text-surface-600 dark:text-surface-400
                    hover:border-primary-400 dark:hover:border-primary-600
                    hover:text-primary-600 dark:hover:text-primary-400
                    transition-all duration-200
                    text-sm
                  "
                >
                  <Icon className="w-4 h-4" />
                  {platform.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialEditor;
