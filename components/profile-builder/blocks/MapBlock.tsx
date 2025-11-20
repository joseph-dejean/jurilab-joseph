import { MapPin } from 'lucide-react';
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
  // Generate Google Maps embed URL or use Leaflet
  const getMapUrl = () => {
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
    <div className="h-full w-full relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
      {mapUrl ? (
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
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4">
          <MapPin className="w-12 h-12 mb-3" />
          <p className="text-sm text-center">
            {readOnly ? 'Localisation non disponible' : 'Ajoutez une adresse dans les paramètres'}
          </p>
          {!readOnly && (
            <input
              type="text"
              value={block.content || ''}
              onChange={(e) => onChange(block.id, { content: e.target.value })}
              placeholder="Adresse (ex: 123 Rue de la Paix, Paris)"
              className="mt-3 w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            />
          )}
        </div>
      )}
    </div>
  );
};

