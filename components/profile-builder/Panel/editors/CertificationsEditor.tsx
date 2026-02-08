import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Award, Calendar } from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

interface CertificationsEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const CertificationsEditor: React.FC<CertificationsEditorProps> = ({ content, onChange }) => {
  const [certifications, setCertifications] = useState<Certification[]>(() => {
    try {
      return content ? JSON.parse(content) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(certifications));
  }, [certifications]);

  const addCertification = () => {
    setCertifications(prev => [
      ...prev,
      { id: generateId(), name: '', issuer: '', year: new Date().getFullYear().toString() }
    ]);
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    setCertifications(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const removeCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500 dark:text-surface-400">
        Listez vos certifications et diplômes.
      </p>

      {certifications.map((cert, index) => (
        <div
          key={cert.id}
          className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-deep-700 dark:text-surface-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Certification {index + 1}
            </span>
            <button
              onClick={() => removeCertification(cert.id)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">
              Nom de la certification
            </label>
            <input
              type="text"
              value={cert.name}
              onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
              placeholder="Master en Droit des Affaires"
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

          {/* Issuer */}
          <div>
            <label className="text-xs text-surface-600 dark:text-surface-400 mb-1 block">
              Organisme / Établissement
            </label>
            <input
              type="text"
              value={cert.issuer}
              onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
              placeholder="Université Paris-Saclay"
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

          {/* Year */}
          <div>
            <label className="flex items-center gap-1 text-xs text-surface-600 dark:text-surface-400 mb-1">
              <Calendar className="w-3 h-3" />
              Année d'obtention
            </label>
            <input
              type="text"
              value={cert.year}
              onChange={(e) => updateCertification(cert.id, { year: e.target.value })}
              placeholder="2020"
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
        </div>
      ))}

      <button
        onClick={addCertification}
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
        Ajouter une certification
      </button>
    </div>
  );
};

export default CertificationsEditor;
