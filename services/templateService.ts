import { ProfileTemplate } from '../types/templates';
import { ProfileBlock } from '../types';

const STORAGE_KEY = 'jurilabb_profile_templates';

/**
 * Génère un ID unique pour un template
 */
export const generateTemplateId = (): string => {
  return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Génère un ID unique pour un bloc
 */
export const generateBlockId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Charge tous les templates depuis le localStorage
 */
export const loadCustomTemplates = (): ProfileTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Error loading templates from localStorage:', error);
  }
  return [];
};

/**
 * Sauvegarde un template personnalisé dans le localStorage
 */
export const saveCustomTemplate = (template: ProfileTemplate): void => {
  try {
    const existing = loadCustomTemplates();
    const updated = existing.filter(t => t.id !== template.id);
    updated.push(template);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log(`✅ Template "${template.name}" saved successfully`);
  } catch (error) {
    console.error('❌ Error saving template to localStorage:', error);
    throw error;
  }
};

/**
 * Supprime un template personnalisé
 */
export const deleteCustomTemplate = (templateId: string): void => {
  try {
    const existing = loadCustomTemplates();
    const updated = existing.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log(`✅ Template deleted successfully`);
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    throw error;
  }
};

/**
 * Crée un nouveau template à partir des blocs actuels
 */
export const createTemplateFromBlocks = (
  blocks: ProfileBlock[],
  name: string,
  description: string,
  userEmail?: string
): ProfileTemplate => {
  // Générer de nouveaux IDs pour chaque bloc pour éviter les conflits
  const newBlocks = blocks.map(block => ({
    ...block,
    id: generateBlockId(),
  }));

  return {
    id: generateTemplateId(),
    name,
    description,
    blocks: newBlocks,
    isDefault: false,
    createdBy: userEmail,
    createdAt: Date.now(),
  };
};

/**
 * Applique un template en générant de nouveaux IDs pour les blocs
 */
export const applyTemplate = (template: ProfileTemplate): ProfileBlock[] => {
  return template.blocks.map((block, index) => ({
    ...block,
    id: generateBlockId(),
    order: index, // S'assurer que l'ordre est correct
  }));
};

