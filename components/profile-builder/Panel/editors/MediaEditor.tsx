import React, { useState, useRef } from 'react';
import { Upload, Link, Image, X } from 'lucide-react';

interface MediaEditorProps {
  imageUrl: string;
  onChange: (url: string) => void;
}

export const MediaEditor: React.FC<MediaEditorProps> = ({ imageUrl, onChange }) => {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(imageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      onChange(localUrl);
      // Note: In production, you'd upload to Firebase Storage here
    }
  };

  const clearImage = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-surface-100 dark:bg-deep-800 rounded-xl">
        <button
          onClick={() => setMode('url')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all duration-200
            ${mode === 'url'
              ? 'bg-white dark:bg-deep-700 text-deep-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-deep-800 dark:hover:text-surface-200'
            }
          `}
        >
          <Link className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all duration-200
            ${mode === 'upload'
              ? 'bg-white dark:bg-deep-700 text-deep-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-600 dark:text-surface-400 hover:text-deep-800 dark:hover:text-surface-200'
            }
          `}
        >
          <Upload className="w-4 h-4" />
          Téléverser
        </button>
      </div>

      {/* URL Input */}
      {mode === 'url' && (
        <div>
          <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
            URL de l'image
          </label>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
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
      )}

      {/* File Upload */}
      {mode === 'upload' && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              w-full flex flex-col items-center justify-center gap-3
              px-6 py-8 rounded-xl
              border-2 border-dashed border-surface-300 dark:border-deep-600
              bg-surface-50 dark:bg-deep-800/50
              text-surface-500 dark:text-surface-400
              hover:border-primary-400 dark:hover:border-primary-600
              hover:bg-primary-50/50 dark:hover:bg-primary-900/10
              transition-all duration-200
              cursor-pointer
            "
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Cliquez pour sélectionner une image</span>
            <span className="text-xs text-surface-400">PNG, JPG, GIF jusqu'à 10MB</span>
          </button>
        </div>
      )}

      {/* Preview */}
      {imageUrl && (
        <div className="relative">
          <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
            Aperçu
          </label>
          <div className="relative rounded-xl overflow-hidden bg-surface-100 dark:bg-deep-800">
            <img
              src={imageUrl}
              alt="Aperçu"
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Image non trouvée</text></svg>';
              }}
            />
            <button
              onClick={clearImage}
              className="
                absolute top-2 right-2
                p-1.5 rounded-lg
                bg-black/50 text-white
                hover:bg-black/70
                transition-colors duration-200
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaEditor;
