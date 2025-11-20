import { LayoutGrid, Plus, Save, X, Trash2, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ProfileTemplate } from '../../types/templates';
import { DEFAULT_TEMPLATES } from '../../types/templates';
import { loadCustomTemplates, saveCustomTemplate, deleteCustomTemplate, createTemplateFromBlocks, applyTemplate } from '../../services/templateService';
import { ProfileBlock } from '../../types';

interface TemplateSelectorProps {
  onSelectTemplate: (blocks: ProfileBlock[]) => void;
  currentBlocks: ProfileBlock[];
  currentUserEmail?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  currentBlocks,
  currentUserEmail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<ProfileTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<ProfileTemplate | null>(null);

  useEffect(() => {
    // Charger les templates personnalisés
    const custom = loadCustomTemplates();
    setCustomTemplates(custom);
  }, []);

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  const handleSelectTemplate = (template: ProfileTemplate) => {
    const newBlocks = applyTemplate(template);
    onSelectTemplate(newBlocks);
    setIsOpen(false);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }

    if (currentBlocks.length === 0) {
      alert('Aucun bloc à sauvegarder. Ajoutez des blocs avant de créer un template.');
      return;
    }

    try {
      const newTemplate = createTemplateFromBlocks(
        currentBlocks,
        newTemplateName.trim(),
        newTemplateDesc.trim() || 'Template personnalisé',
        currentUserEmail
      );

      saveCustomTemplate(newTemplate);
      setCustomTemplates([...customTemplates, newTemplate]);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setIsCreating(false);
      alert(`✅ Template "${newTemplate.name}" sauvegardé avec succès !`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('❌ Erreur lors de la sauvegarde du template');
    }
  };

  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      try {
        deleteCustomTemplate(templateId);
        setCustomTemplates(customTemplates.filter(t => t.id !== templateId));
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('❌ Erreur lors de la suppression');
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-navy dark:text-white rounded-lg font-medium transition-colors"
      >
        <LayoutGrid className="w-4 h-4" />
        Templates
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-serif font-bold text-navy dark:text-white">
                  Templates de Profil
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choisissez un template ou créez le vôtre
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isCreating && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-navy dark:bg-brand-DEFAULT hover:bg-navy-light dark:hover:bg-brand-dark text-white rounded-lg font-medium transition-colors shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Sauvegarder le profil actuel
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreating(false);
                    setPreviewTemplate(null);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isCreating ? (
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-lg font-semibold text-navy dark:text-white">
                    Créer un nouveau template
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nom du template *
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Ex: Mon Template Personnalisé"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-navy dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={newTemplateDesc}
                      onChange={(e) => setNewTemplateDesc(e.target.value)}
                      placeholder="Description du template..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-navy dark:text-white resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTemplate}
                      className="flex-1 px-4 py-2 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg font-medium transition-colors"
                    >
                      Sauvegarder
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTemplateName('');
                        setNewTemplateDesc('');
                      }}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-navy dark:text-white rounded-lg font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 Le template sera sauvegardé avec {currentBlocks.length} bloc(s) actuel(s)
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="relative group bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-brand-DEFAULT transition-all cursor-pointer overflow-hidden"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {/* Preview */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-serif font-bold text-navy dark:text-white text-lg">
                              {template.name}
                            </h3>
                            {template.isDefault && (
                              <span className="text-xs text-brand-DEFAULT font-medium">
                                Template prédéfini
                              </span>
                            )}
                          </div>
                          {!template.isDefault && (
                            <button
                              onClick={(e) => handleDeleteTemplate(template.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <LayoutGrid className="w-4 h-4" />
                          <span>{template.blocks.length} bloc(s)</span>
                        </div>
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-brand-DEFAULT/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg font-medium text-brand-DEFAULT">
                          Appliquer ce template
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

