import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Briefcase } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

interface CollaboratorsEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const CollaboratorsEditor: React.FC<CollaboratorsEditorProps> = ({ content, onChange }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    try {
      return content ? JSON.parse(content) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(collaborators));
  }, [collaborators]);

  const addCollaborator = () => {
    setCollaborators(prev => [
      ...prev,
      { id: generateId(), name: '', role: '', imageUrl: '' }
    ]);
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    setCollaborators(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Présentez les membres de votre équipe.
      </p>

      {collaborators.map((collab, index) => (
        <div
          key={collab.id}
          className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-deep-700 dark:text-surface-300 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              Membre {index + 1}
            </span>
            <button
              onClick={() => removeCollaborator(collab.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">
              Nom complet
            </label>
            <input
              type="text"
              value={collab.name}
              onChange={(e) => updateCollaborator(collab.id, { name: e.target.value })}
              placeholder="Marie Dupont"
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

          {/* Role */}
          <div>
            <label className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400 mb-1">
              <Briefcase className="w-3 h-3" />
              Fonction
            </label>
            <input
              type="text"
              value={collab.role}
              onChange={(e) => updateCollaborator(collab.id, { role: e.target.value })}
              placeholder="Avocat associé"
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

          {/* Image URL */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">
              Photo (URL)
            </label>
            <input
              type="url"
              value={collab.imageUrl}
              onChange={(e) => updateCollaborator(collab.id, { imageUrl: e.target.value })}
              placeholder="https://..."
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
            {collab.imageUrl && (
              <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-deep-700">
                <img
                  src={collab.imageUrl}
                  alt={collab.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addCollaborator}
        className="
          w-full flex items-center justify-center gap-2
          px-4 py-3 rounded-xl
          border-2 border-dashed border-surface-300 dark:border-deep-600
          text-surface-600 dark:text-surface-400
          hover:border-primary-400 dark:hover:border-primary-600
          hover:text-primary-600 dark:hover:text-primary-400
          transition-all duration-200
        "
      >
        <Plus className="w-4 h-4" />
        Ajouter un membre
      </button>
    </div>
  );
};

export default CollaboratorsEditor;
