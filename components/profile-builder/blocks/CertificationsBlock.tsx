import { Award, Shield } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface CertificationsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const CertificationsBlock: React.FC<CertificationsBlockProps> = ({ block, onChange, readOnly }) => {
  // Parse certifications from content (comma-separated or JSON array)
  const parseCerts = () => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return block.content.split(',').map(c => c.trim()).filter(Boolean);
      }
    }
    return ['Barreau de Paris', 'Certification Droit des Affaires'];
  };

  const certifications = parseCerts();

  return (
    <div className="h-full flex flex-col justify-center bg-gradient-to-br from-navy to-navy-dark dark:from-navy-dark dark:to-navy text-white p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6" />
        <h3 className="font-serif font-bold text-lg">
          {block.title || 'Certifications'}
        </h3>
      </div>
      {readOnly ? (
        <ul className="space-y-2">
          {certifications.map((cert, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-brand-DEFAULT flex-shrink-0" />
              <span>{cert}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {certifications.map((cert, index) => (
            <div key={index} className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-DEFAULT flex-shrink-0" />
              <input
                type="text"
                value={cert}
                onChange={(e) => {
                  const newCerts = [...certifications];
                  newCerts[index] = e.target.value;
                  onChange(block.id, { content: JSON.stringify(newCerts) });
                }}
                className="flex-1 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                placeholder="Nom de la certification"
              />
              <button
                onClick={() => {
                  const newCerts = certifications.filter((_, i) => i !== index);
                  onChange(block.id, { content: JSON.stringify(newCerts) });
                }}
                className="text-red-300 hover:text-red-200 text-xs"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newCerts = [...certifications, ''];
              onChange(block.id, { content: JSON.stringify(newCerts) });
            }}
            className="w-full mt-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white"
          >
            + Ajouter
          </button>
        </div>
      )}
    </div>
  );
};

