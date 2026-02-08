import {
  Award,
  Building2,
  Image,
  MapPin,
  MessageSquare,
  Plus,
  Quote,
  Share2,
  Sparkles,
  TrendingUp,
  Type,
  Users,
  Video,
  Grip,
  Lightbulb,
} from 'lucide-react';
import React, { useState } from 'react';
import { ProfileBlockType } from '../../types';

interface ToolboxProps {
  onAddBlock: (type: ProfileBlockType) => void;
}

interface Tool {
  type: ProfileBlockType;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  bgColor: string;
}

const tools: Tool[] = [
  { 
    type: ProfileBlockType.TEXT, 
    icon: Type, 
    label: 'Texte', 
    desc: 'Titre & Paragraphe',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30'
  },
  { 
    type: ProfileBlockType.MEDIA, 
    icon: Image, 
    label: 'Média', 
    desc: 'Photo ou Image',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30'
  },
  { 
    type: ProfileBlockType.VIDEO, 
    icon: Video, 
    label: 'Vidéo', 
    desc: 'Appel Daily.co',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30'
  },
  { 
    type: ProfileBlockType.CONTACT, 
    icon: MessageSquare, 
    label: 'Contact', 
    desc: "Bouton d'action",
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30'
  },
  { 
    type: ProfileBlockType.LOGO, 
    icon: Building2, 
    label: 'Logo', 
    desc: 'Logo du cabinet',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-800/50'
  },
  { 
    type: ProfileBlockType.MAP, 
    icon: MapPin, 
    label: 'Carte', 
    desc: 'Localisation',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  { 
    type: ProfileBlockType.STATS, 
    icon: TrendingUp, 
    label: 'Stats', 
    desc: 'Statistiques',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30'
  },
  { 
    type: ProfileBlockType.TESTIMONIALS, 
    icon: Quote, 
    label: 'Avis', 
    desc: 'Témoignages',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30'
  },
  { 
    type: ProfileBlockType.CERTIFICATIONS, 
    icon: Award, 
    label: 'Certifs', 
    desc: 'Certifications',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
  },
  { 
    type: ProfileBlockType.SOCIAL, 
    icon: Share2, 
    label: 'Réseaux', 
    desc: 'Liens sociaux',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30'
  },
  { 
    type: ProfileBlockType.COLLABORATORS, 
    icon: Users, 
    label: 'Équipe', 
    desc: 'Collaborateurs',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30'
  },
];

export const Toolbox: React.FC<ToolboxProps> = ({ onAddBlock }) => {
  const [hoveredTool, setHoveredTool] = useState<ProfileBlockType | null>(null);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-950/30 dark:to-transparent">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/30">
            <Plus className="w-4 h-4 text-white" />
          </div>
          Ajouter un bloc
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cliquez pour ajouter à votre profil
        </p>
      </div>

      {/* Tools Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => onAddBlock(tool.type)}
              onMouseEnter={() => setHoveredTool(tool.type)}
              onMouseLeave={() => setHoveredTool(null)}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl 
                border-2 border-transparent transition-all duration-200
                hover:border-primary-300 dark:hover:border-primary-700
                hover:shadow-lg hover:shadow-primary-500/10
                group text-center
                ${hoveredTool === tool.type ? 'scale-[1.02] bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}
              `}
            >
              <div className={`w-10 h-10 rounded-xl ${tool.bgColor} flex items-center justify-center mb-2 transition-transform group-hover:scale-110`}>
                <tool.icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {tool.label}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {tool.desc}
              </span>
              
              {/* Hover indicator */}
              <div className={`absolute inset-0 rounded-xl bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="px-4 pb-4">
        <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Conseils
              </p>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <li className="flex items-center gap-1.5">
                  <Grip className="w-3 h-3" />
                  Glissez les blocs pour réorganiser
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Utilisez différentes tailles
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
