import React, { useState, useEffect } from 'react';
import { TrendingUp, Briefcase, Award, Users } from 'lucide-react';

interface StatsData {
  yearsExperience?: number;
  casesWon?: number;
  successRate?: number;
  clientsServed?: number;
}

interface StatsEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const StatsEditor: React.FC<StatsEditorProps> = ({ content, onChange }) => {
  const [stats, setStats] = useState<StatsData>(() => {
    try {
      return content ? JSON.parse(content) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(stats));
  }, [stats]);

  const updateStat = (key: keyof StatsData, value: string) => {
    const numValue = parseInt(value) || 0;
    setStats(prev => ({ ...prev, [key]: numValue }));
  };

  const statFields = [
    { key: 'yearsExperience' as const, label: 'Années d\'expérience', icon: TrendingUp, max: 50 },
    { key: 'casesWon' as const, label: 'Dossiers gagnés', icon: Briefcase, max: 10000 },
    { key: 'successRate' as const, label: 'Taux de succès (%)', icon: Award, max: 100 },
    { key: 'clientsServed' as const, label: 'Clients servis', icon: Users, max: 10000 },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Définissez les statistiques à afficher sur votre profil.
      </p>
      
      {statFields.map(({ key, label, icon: Icon, max }) => (
        <div key={key}>
          <label className="flex items-center gap-2 text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
            <Icon className="w-4 h-4 text-primary-500" />
            {label}
          </label>
          <input
            type="number"
            min="0"
            max={max}
            value={stats[key] || ''}
            onChange={(e) => updateStat(key, e.target.value)}
            placeholder="0"
            className="
              w-full px-4 py-3 rounded-xl
              bg-surface-50 dark:bg-deep-800
              border border-surface-200 dark:border-deep-700
              text-deep-900 dark:text-surface-100
              placeholder:text-surface-400 dark:placeholder:text-surface-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
              transition-all duration-200
            "
          />
        </div>
      ))}
    </div>
  );
};

export default StatsEditor;
