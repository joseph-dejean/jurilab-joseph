import React from 'react';

interface TextEditorProps {
  title: string;
  content: string;
  onChange: (title: string, content: string) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ title, content, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Titre
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange(e.target.value, content)}
          placeholder="Entrez un titre..."
          className="
            w-full px-4 py-3 rounded-xl
            bg-surface-50 dark:bg-deep-800
            border border-surface-200 dark:border-deep-700
            text-deep-900 dark:text-surface-100
            placeholder:text-surface-400 dark:placeholder:text-surface-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            transition-all duration-200
          "
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Contenu
        </label>
        <textarea
          value={content}
          onChange={(e) => onChange(title, e.target.value)}
          placeholder="Écrivez votre texte ici..."
          rows={6}
          className="
            w-full px-4 py-3 rounded-xl
            bg-surface-50 dark:bg-deep-800
            border border-surface-200 dark:border-deep-700
            text-deep-900 dark:text-surface-100
            placeholder:text-surface-400 dark:placeholder:text-surface-500
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            transition-all duration-200
            resize-none
          "
        />
      </div>
    </div>
  );
};

export default TextEditor;
