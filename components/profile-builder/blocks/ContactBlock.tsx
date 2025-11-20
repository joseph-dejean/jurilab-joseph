import { MessageSquare } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface ContactBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const ContactBlock: React.FC<ContactBlockProps> = ({ block, onChange, readOnly }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-brand-light dark:bg-brand-dark/20 p-6 text-center rounded-lg">
      <MessageSquare className="w-8 h-8 text-brand-dark dark:text-brand-DEFAULT mb-3" />
      <h3 className="font-serif text-lg font-bold text-navy dark:text-white mb-2">
        {block.title || "Contactez-moi"}
      </h3>
      <button className="w-full py-2 bg-navy dark:bg-navy-dark text-white rounded hover:bg-navy-light dark:hover:bg-navy transition-colors font-medium">
        Envoyer un message
      </button>
      
      {!readOnly && (
        <div className="mt-4 w-full">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Titre du bouton"
            className="w-full bg-white dark:bg-slate-800 border border-brand-DEFAULT/20 dark:border-brand-DEFAULT/40 text-navy dark:text-white text-xs rounded p-1 text-center"
          />
        </div>
      )}
    </div>
  );
};

