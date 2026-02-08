import { UserPlus, Plus, X, Briefcase, Users } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';
import { getStylePresetClasses, getCustomTextClasses, shouldUseLightText } from '../shared/stylePresets';

interface Collaborator {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  imageUrl?: string;
  specialties?: string[];
  role?: string;
}

interface CollaboratorsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const CollaboratorsBlock: React.FC<CollaboratorsBlockProps> = ({ block, onChange, readOnly }) => {
  const presetStyles = getStylePresetClasses(block.stylePreset);
  
  // Determine if using custom colors
  const isCustom = block.stylePreset === 'custom' && block.customBgColor;
  const isDarkBg = isCustom ? shouldUseLightText(block) : presetStyles.isDark;
  const textStyles = isCustom ? getCustomTextClasses(block) : presetStyles;
  const containerClass = isCustom ? '' : presetStyles.container;
  
  // Parse collaborators from content (JSON array)
  const parseCollaborators = (): Collaborator[] => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const collaborators = parseCollaborators();

  const updateCollaborators = (newCollaborators: Collaborator[]) => {
    onChange(block.id, { content: JSON.stringify(newCollaborators) });
  };

  const addCollaborator = () => {
    const newCollaborator: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: '',
      lastName: '',
      photo: '',
      specialties: [],
      role: ''
    };
    updateCollaborators([...collaborators, newCollaborator]);
  };

  const removeCollaborator = (collabId: string) => {
    updateCollaborators(collaborators.filter(c => c.id !== collabId));
  };

  const updateCollaborator = (collabId: string, updates: Partial<Collaborator>) => {
    updateCollaborators(
      collaborators.map(c => c.id === collabId ? { ...c, ...updates } : c)
    );
  };

  const addSpecialty = (collabId: string, specialty: string) => {
    const collaborator = collaborators.find(c => c.id === collabId);
    if (collaborator && specialty.trim() && !collaborator.specialties.includes(specialty.trim())) {
      updateCollaborator(collabId, {
        specialties: [...collaborator.specialties, specialty.trim()]
      });
    }
  };

  const removeSpecialty = (collabId: string, specialty: string) => {
    const collaborator = collaborators.find(c => c.id === collabId);
    if (collaborator) {
      updateCollaborator(collabId, {
        specialties: collaborator.specialties.filter(s => s !== specialty)
      });
    }
  };

  const commonSpecialties = [
    'Droit pénal',
    'Droit civil',
    'Droit commercial',
    'Droit du travail',
    'Droit fiscal',
    'Droit immobilier',
    'Droit de la famille',
    'Droit des affaires',
    'Droit international'
  ];

  // Get display name for collaborator
  const getCollabName = (collab: Collaborator) => {
    if (collab.name) return collab.name;
    const first = collab.firstName || '';
    const last = collab.lastName || '';
    return `${first} ${last}`.trim() || 'Sans nom';
  };

  const getCollabInitials = (collab: Collaborator) => {
    const name = getCollabName(collab);
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getCollabPhoto = (collab: Collaborator) => collab.photo || collab.imageUrl;

  return (
    <div className={`h-full w-full flex flex-col p-5 overflow-hidden ${containerClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isDarkBg ? 'bg-white/10' : 'bg-primary-100 dark:bg-primary-900/30'
        }`}>
          <Users className={`w-5 h-5 ${isDarkBg ? 'text-white/70' : 'text-primary-600 dark:text-primary-400'}`} />
        </div>
        <h3 className={`font-display font-bold text-lg ${textStyles.heading}`}>
          {block.title || 'Notre Équipe'}
        </h3>
      </div>

      {readOnly ? (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className={`text-sm text-center py-8 ${textStyles.subtext}`}>
              Aucun membre configuré
            </p>
          ) : (
            collaborators.map((collab) => (
              <div
                key={collab.id}
                className={`rounded-xl p-3 ${
                  isDarkBg 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getCollabPhoto(collab) ? (
                      <img
                        src={getCollabPhoto(collab)}
                        alt={getCollabName(collab)}
                        className="w-12 h-12 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isDarkBg 
                          ? 'bg-white/10 text-white' 
                          : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                      }`}>
                        {getCollabInitials(collab)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold text-sm truncate ${textStyles.heading}`}>
                      {getCollabName(collab)}
                    </h4>
                    {collab.role && (
                      <p className={`text-xs mt-0.5 truncate ${textStyles.subtext}`}>
                        {collab.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto">
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0">
                  {collab.photo ? (
                    <div className="relative">
                      <img
                        src={collab.photo}
                        alt={`${collab.firstName} ${collab.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-brand-DEFAULT"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => {
                          const url = prompt("URL de la photo:");
                          if (url) updateCollaborator(collab.id, { photo: url });
                        }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-primary-700"
                        title="Changer la photo"
                      >
                        ✎
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const url = prompt("URL de la photo:");
                        if (url) updateCollaborator(collab.id, { photo: url });
                      }}
                      className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <UserPlus className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={collab.firstName}
                      onChange={(e) => updateCollaborator(collab.id, { firstName: e.target.value })}
                      placeholder="Prénom"
                      className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                    />
                    <input
                      type="text"
                      value={collab.lastName}
                      onChange={(e) => updateCollaborator(collab.id, { lastName: e.target.value })}
                      placeholder="Nom"
                      className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                    />
                  </div>
                  <input
                    type="text"
                    value={collab.role || ''}
                    onChange={(e) => updateCollaborator(collab.id, { role: e.target.value })}
                    placeholder="Rôle (ex: Associé, Avocat)"
                    className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                  />
                  <div className="flex flex-wrap gap-1">
                    {collab.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary-50/30 dark:bg-primary-900/30 text-primary-600 rounded-full"
                      >
                        <Briefcase className="w-3 h-3" />
                        {spec}
                        <button
                          onClick={() => removeSpecialty(collab.id, spec)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addSpecialty(collab.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700"
                      defaultValue=""
                    >
                      <option value="">+ Spécialité</option>
                      {commonSpecialties
                        .filter(s => !collab.specialties.includes(s))
                        .map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Autre spécialité"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            addSpecialty(collab.id, input.value.trim());
                            input.value = '';
                          }
                        }
                      }}
                      className="px-2 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-700 w-24"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeCollaborator(collab.id)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCollaborator}
            className="w-full py-2 px-3 text-sm bg-primary-50/20 dark:bg-primary-900/20 hover:bg-primary-50/30 dark:hover:bg-primary-700/30 border border-primary-600/30 rounded-lg text-primary-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un collaborateur
          </button>
        </div>
      )}
    </div>
  );
};

