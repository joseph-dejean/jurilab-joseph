import React from 'react';
import { MessageSquare, Phone, Mail, Calendar } from 'lucide-react';

interface ContactEditorProps {
  title: string;
  content: string;
  onChange: (title: string, content: string) => void;
}

const buttonStyles = [
  { value: 'primary', label: 'Principal', preview: 'bg-primary-600 text-white' },
  { value: 'secondary', label: 'Secondaire', preview: 'bg-surface-100 text-deep-800 border border-surface-300' },
  { value: 'accent', label: 'Accent', preview: 'bg-accent-500 text-white' },
];

const actionTypes = [
  { value: 'book', label: 'Prendre RDV', icon: Calendar },
  { value: 'call', label: 'Appeler', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'message', label: 'Message', icon: MessageSquare },
];

export const ContactEditor: React.FC<ContactEditorProps> = ({ title, content, onChange }) => {
  // Parse content as JSON for button config
  let config = { style: 'primary', action: 'book' };
  try {
    if (content) {
      config = { ...config, ...JSON.parse(content) };
    }
  } catch {}

  const updateConfig = (updates: Partial<typeof config>) => {
    const newConfig = { ...config, ...updates };
    onChange(title, JSON.stringify(newConfig));
  };

  return (
    <div className="space-y-5">
      {/* Button Text */}
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Texte du bouton
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onChange(e.target.value, content)}
          placeholder="Me contacter"
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

      {/* Action Type */}
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Type d'action
        </label>
        <div className="grid grid-cols-2 gap-2">
          {actionTypes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateConfig({ action: value })}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl
                border-2 transition-all duration-200
                ${config.action === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-800 text-deep-600 dark:text-surface-400 hover:border-primary-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Button Style */}
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Style du bouton
        </label>
        <div className="flex gap-2">
          {buttonStyles.map(({ value, label, preview }) => (
            <button
              key={value}
              onClick={() => updateConfig({ style: value })}
              className={`
                flex-1 flex flex-col items-center gap-2 p-3 rounded-xl
                border-2 transition-all duration-200
                ${config.style === value
                  ? 'border-primary-500 ring-2 ring-primary-500/20'
                  : 'border-surface-200 dark:border-deep-700 hover:border-primary-300'
                }
              `}
            >
              <div className={`w-full h-8 rounded-lg ${preview}`} />
              <span className="text-xs font-medium text-deep-600 dark:text-surface-400">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
          Aperçu
        </label>
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 flex justify-center">
          <button
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-200
              ${config.style === 'primary' ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30' : ''}
              ${config.style === 'secondary' ? 'bg-white dark:bg-deep-700 text-deep-800 dark:text-surface-100 border border-surface-300 dark:border-deep-600' : ''}
              ${config.style === 'accent' ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-deep-900 shadow-lg shadow-accent-500/30' : ''}
            `}
          >
            {actionTypes.find(a => a.value === config.action)?.icon && 
              React.createElement(actionTypes.find(a => a.value === config.action)!.icon, { className: 'w-4 h-4' })
            }
            {title || 'Me contacter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactEditor;
