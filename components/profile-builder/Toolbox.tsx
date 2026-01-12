import { Image, MessageSquare, Plus, Type, Video, Building2, MapPin, TrendingUp, Quote, Award, Share2, Users } from 'lucide-react';
import React from 'react';
import { ProfileBlockType } from '../../types';

interface ToolboxProps {
  onAddBlock: (type: ProfileBlockType) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ onAddBlock }) => {
  const tools = [
    { type: ProfileBlockType.TEXT, icon: Type, label: 'Texte', desc: 'Titre & Paragraphe' },
    { type: ProfileBlockType.MEDIA, icon: Image, label: 'Média', desc: 'Photo ou Image' },
    { type: ProfileBlockType.VIDEO, icon: Video, label: 'Vidéo', desc: 'Appel Daily.co' },
    { type: ProfileBlockType.CONTACT, icon: MessageSquare, label: 'Contact', desc: 'Bouton d\'action' },
    { type: ProfileBlockType.LOGO, icon: Building2, label: 'Logo', desc: 'Logo du cabinet' },
    { type: ProfileBlockType.MAP, icon: MapPin, label: 'Carte', desc: 'Localisation' },
    { type: ProfileBlockType.STATS, icon: TrendingUp, label: 'Stats', desc: 'Statistiques' },
    { type: ProfileBlockType.TESTIMONIALS, icon: Quote, label: 'Avis', desc: 'Témoignages' },
    { type: ProfileBlockType.CERTIFICATIONS, icon: Award, label: 'Certifs', desc: 'Certifications' },
    { type: ProfileBlockType.SOCIAL, icon: Share2, label: 'Réseaux', desc: 'Liens sociaux' },
    { type: ProfileBlockType.COLLABORATORS, icon: Users, label: 'Équipe', desc: 'Collaborateurs' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-subtle border border-slate-100 dark:border-slate-700 sticky top-4">
      <h3 className="font-serif font-bold text-primary-900 dark:text-white mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Ajouter un bloc
      </h3>
      <div className="grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onAddBlock(tool.type)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-600 hover:bg-primary-50/20 dark:hover:bg-primary-900/20 transition-all group text-center"
          >
            <tool.icon className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-primary-600 mb-2" />
            <span className="text-sm font-medium text-primary-900 dark:text-white">{tool.label}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{tool.desc}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500 dark:text-slate-400">
        <p>💡 Glissez les blocs pour réorganiser votre profil.</p>
      </div>
    </div>
  );
};

