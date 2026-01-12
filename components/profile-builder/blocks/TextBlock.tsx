import React from 'react';
import { ProfileBlock } from '../../../types';

interface TextBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({ block, onChange, readOnly }) => {
  return (
    <div className="h-full flex flex-col gap-2 p-4">
      {readOnly ? (
        <>
          {block.title && (
            <h3 className="text-lg font-bold text-primary-900 dark:text-white font-serif">{block.title}</h3>
          )}
          {block.content && (
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap flex-1">{block.content}</p>
          )}
        </>
      ) : (
        <>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onChange(block.id, { title: e.target.value })}
            placeholder="Titre (ex: Ma philosophie)"
            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent font-serif font-bold text-primary-900 dark:text-white bg-white dark:bg-slate-800"
          />
          <textarea
            value={block.content || ''}
            onChange={(e) => onChange(block.id, { content: e.target.value })}
            placeholder="Écrivez votre texte ici..."
            className="w-full flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          />
        </>
      )}
    </div>
  );
};

