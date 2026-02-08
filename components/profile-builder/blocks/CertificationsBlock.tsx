import { Award, Shield, GraduationCap, Plus, X } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface Certification {
  id?: string;
  name: string;
  issuer?: string;
  year?: string;
}

interface CertificationsBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const CertificationsBlock: React.FC<CertificationsBlockProps> = ({ block, onChange, readOnly }) => {
  // Parse certifications from content
  const parseCerts = (): Certification[] => {
    if (block.content) {
      try {
        const parsed = JSON.parse(block.content);
        if (Array.isArray(parsed)) {
          // Handle both string arrays and object arrays
          return parsed.map(c => typeof c === 'string' ? { name: c } : c);
        }
        return [typeof parsed === 'string' ? { name: parsed } : parsed];
      } catch {
        return block.content.split(',').map(c => ({ name: c.trim() })).filter(c => c.name);
      }
    }
    return [
      { name: 'Barreau de Paris', issuer: 'Ordre des Avocats', year: '2015' },
      { name: 'Droit des Affaires', issuer: 'Université Paris-Saclay', year: '2014' }
    ];
  };

  const certifications = parseCerts();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-primary-800 via-primary-900 to-deep-900 dark:from-deep-900 dark:via-primary-950 dark:to-deep-950 text-white p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5" />
        </div>
        <h3 className="font-display font-bold text-lg">
          {block.title || 'Certifications'}
        </h3>
      </div>
      
      {readOnly ? (
        <ul className="space-y-3 flex-1">
          {certifications.map((cert, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Award className="w-4 h-4 text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{cert.name}</p>
                {(cert.issuer || cert.year) && (
                  <p className="text-xs text-white/60 mt-0.5">
                    {cert.issuer}{cert.issuer && cert.year ? ' • ' : ''}{cert.year}
                  </p>
                )}
              </div>
            </li>
          ))}
          {certifications.length === 0 && (
            <li className="text-white/50 text-sm text-center py-4">
              Aucune certification configurée
            </li>
          )}
        </ul>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {certifications.map((cert, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
              <Award className="w-4 h-4 text-accent-400 flex-shrink-0" />
              <input
                type="text"
                value={cert.name}
                onChange={(e) => {
                  const newCerts = [...certifications];
                  newCerts[index] = { ...newCerts[index], name: e.target.value };
                  onChange(block.id, { content: JSON.stringify(newCerts) });
                }}
                className="flex-1 px-2 py-1.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:bg-white/15 focus:border-white/40 transition-all"
                placeholder="Certification"
              />
              <button
                onClick={() => {
                  const newCerts = certifications.filter((_, i) => i !== index);
                  onChange(block.id, { content: JSON.stringify(newCerts) });
                }}
                className="p-1 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newCerts = [...certifications, { name: '' }];
              onChange(block.id, { content: JSON.stringify(newCerts) });
            }}
            className="w-full mt-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
};

