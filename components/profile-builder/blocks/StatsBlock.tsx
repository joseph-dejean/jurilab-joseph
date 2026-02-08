import { Award, Briefcase, TrendingUp, Users } from 'lucide-react';
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
      yearsExperience: 10,
      casesWon: 500,
      successRate: 95,
      clientsServed: 200
    };
  };

  const stats = parseStats();
  
  // Get available stats to display (only those with values)
  const displayStats = [
    stats.yearsExperience && { icon: Briefcase, value: stats.yearsExperience, label: 'Années' },
    stats.casesWon && { icon: TrendingUp, value: stats.casesWon + '+', label: 'Dossiers' },
    stats.successRate && { icon: Award, value: stats.successRate + '%', label: 'Réussite' },
    stats.clientsServed && { icon: Users, value: stats.clientsServed + '+', label: 'Clients' },
  ].filter(Boolean).slice(0, 4);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-primary-950 p-4 md:p-6 text-center">
      {readOnly ? (
        <div className={`grid gap-3 md:gap-6 w-full ${displayStats.length <= 2 ? 'grid-cols-2' : displayStats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
          {displayStats.map((stat, index) => {
            if (!stat) return null;
            const Icon = stat.icon;
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-white/10 flex items-center justify-center mb-2 md:mb-3">
                  <Icon className="w-4 h-4 md:w-6 md:h-6 text-white/90" />
                </div>
                <p className="text-xl md:text-3xl font-bold text-white font-display">{stat.value}</p>
                <p className="text-[10px] md:text-xs text-white/70 mt-0.5 md:mt-1 font-medium">{stat.label}</p>
              </div>
            );
          })}
          {displayStats.length === 0 && (
            <div className="col-span-full text-white/60 text-sm">
              Configurez vos statistiques
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { key: 'yearsExperience', label: 'Années', icon: Briefcase },
            { key: 'casesWon', label: 'Dossiers', icon: TrendingUp },
            { key: 'successRate', label: 'Réussite %', icon: Award },
            { key: 'clientsServed', label: 'Clients', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex flex-col items-center">
              <Icon className="w-5 h-5 text-white/70 mb-1" />
              <input
                type="number"
                value={stats[key] || ''}
                onChange={(e) => {
                  const newStats = { ...stats, [key]: parseInt(e.target.value) || 0 };
                  onChange(block.id, { content: JSON.stringify(newStats) });
                }}
                placeholder="0"
                className="w-full px-2 py-1.5 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:bg-white/20 focus:border-white/40 transition-all"
              />
              <p className="text-[10px] text-white/60 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

