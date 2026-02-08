import { MapPin, Navigation } from 'lucide-react';
import React from 'react';
import { ProfileBlock } from '../../../types';

interface MapBlockProps {
  block: ProfileBlock;
  onChange: (id: string, updates: Partial<ProfileBlock>) => void;
  readOnly?: boolean;
  coordinates?: { lat: number; lng: number };
  location?: string;
}

export const MapBlock: React.FC<MapBlockProps> = ({ block, onChange, readOnly, coordinates, location }) => {
  // Generate Google Maps embed URL
  const getMapUrl = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
    const hasApiKey = apiKey && apiKey !== 'your_google_api_key_here' && apiKey.length > 10;

    if (hasApiKey) {
      if (coordinates) {
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coordinates.lat},${coordinates.lng}`;
      }
      if (location) {
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(location)}`;
      }
    }

    if (coordinates) {
      return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&output=embed`;
    }
    if (location) {
      return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
    }
    return null;
  };

  const mapUrl = getMapUrl();

  return (
    <div className="h-full w-full relative bg-surface-100 dark:bg-deep-800 overflow-hidden">
      {mapUrl ? (
        <>
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
          {/* Location overlay */}
          {location && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{location}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 p-6">
          <div className="w-16 h-16 rounded-2xl bg-surface-200 dark:bg-deep-700 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <p className="text-sm text-center font-medium text-deep-600 dark:text-surface-300 mb-1">
            Localisation
          </p>
          <p className="text-xs text-center text-surface-500 dark:text-surface-400 mb-4">
            {readOnly ? 'Non configurée' : 'Utilise l\'adresse de votre profil'}
          </p>
          {!readOnly && (
            <div className="w-full max-w-xs space-y-2">
              <input
                type="text"
                value={block.content || ''}
                onChange={(e) => onChange(block.id, { content: e.target.value })}
                placeholder="Adresse (optionnel)"
                className="w-full px-3 py-2 text-sm border border-surface-200 dark:border-deep-700 rounded-xl bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
              />
              <p className="text-[10px] text-surface-400 text-center">
                Laissez vide pour utiliser l'adresse de votre profil
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

