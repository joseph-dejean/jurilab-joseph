import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';

export const GoogleSyncModal = () => {
  const { isGoogleAuthModalOpen, closeGoogleAuthModal, saveGoogleConfig } = useCalendar();
  
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [clientId, setClientId] = useState('');

  if (!isGoogleAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleConfig(apiKey, clientId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={closeGoogleAuthModal}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-700" />
            Connecter Google Agenda
          </h2>
          <button onClick={closeGoogleAuthModal} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600 bg-rose-50 p-3 rounded-lg border border-rose-100 mb-4">
            <p className="mb-2">Pour synchroniser avec votre vrai Google Agenda, nous avons besoin de vos identifiants Cloud. Ils sont stockés localement dans votre navigateur.</p>
            <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noreferrer"
                className="text-rose-600 hover:underline flex items-center gap-1 inline-flex"
            >
                Obtenir des identifiants <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 uppercase">ID Client OAuth</label>
            <input
              type="text"
              placeholder="ex: 12345...apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 py-2 px-3"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 uppercase">Clé API</label>
            <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                type="text"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 py-2 pl-9 pr-3"
                required
                />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={closeGoogleAuthModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
            >
              Enregistrer & Synchroniser
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
