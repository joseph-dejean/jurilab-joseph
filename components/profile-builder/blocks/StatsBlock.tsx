import { Award, Briefcase, TrendingUp } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface StatsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const StatsBlock: React.FC<StatsBlockProps> = ({ block, onChange, readOnly }) => {
  // Parse stats from content (JSON string) or use default
  const parseStats = () => {
    if (block.content) {
      try {
        return JSON.parse(block.content);
      } catch {
        // Fallback to simple format
      }
    }
    return {
      years: block.title || '10',
      cases: '500+',
      success: '95%'
    };
  };

  const stats = parseStats();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-900 dark:to-primary-800 p-6 text-center">
      {readOnly ? (
        <>
          <div className="grid grid-cols-3 gap-4 w-full">
            <div>
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-white/90" />
              <p className="text-2xl font-bold text-white">{stats.years}</p>
              <p className="text-xs text-white/80">Années</p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-white/90" />
              <p className="text-2xl font-bold text-white">{stats.cases}</p>
              <p className="text-xs text-white/80">Dossiers</p>
            </div>
            <div>
              <Award className="w-8 h-8 mx-auto mb-2 text-white/90" />
              <p className="text-2xl font-bold text-white">{stats.success}</p>
              <p className="text-xs text-white/80">Réussite</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 w-full mb-4">
            <div>
              <input
                type="text"
                value={stats.years || ''}
                onChange={(e) => {
                  const newStats = { ...stats, years: e.target.value };
                  onChange(block.id, { content: JSON.stringify(newStats) });
                }}
                placeholder="10"
                className="w-full px-2 py-1 text-center text-2xl font-bold bg-white/20 border border-white/30 rounded text-white placeholder-white/50"
              />
              <p className="text-xs text-white/80 mt-1">Années</p>
            </div>
            <div>
              <input
                type="text"
                value={stats.cases || ''}
                onChange={(e) => {
                  const newStats = { ...stats, cases: e.target.value };
                  onChange(block.id, { content: JSON.stringify(newStats) });
                }}
                placeholder="500+"
                className="w-full px-2 py-1 text-center text-2xl font-bold bg-white/20 border border-white/30 rounded text-white placeholder-white/50"
              />
              <p className="text-xs text-white/80 mt-1">Dossiers</p>
            </div>
            <div>
              <input
                type="text"
                value={stats.success || ''}
                onChange={(e) => {
                  const newStats = { ...stats, success: e.target.value };
                  onChange(block.id, { content: JSON.stringify(newStats) });
                }}
                placeholder="95%"
                className="w-full px-2 py-1 text-center text-2xl font-bold bg-white/20 border border-white/30 rounded text-white placeholder-white/50"
              />
              <p className="text-xs text-white/80 mt-1">Réussite</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

