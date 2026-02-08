import React, { useEffect, useRef, useState } from 'react';
import { Lawyer } from '../types';
import { MapPin, AlertCircle, ExternalLink } from 'lucide-react';

// Google Maps is loaded dynamically
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    gm_authFailure?: () => void;
  }
}

interface MapComponentProps {
  lawyers: Lawyer[];
  selectedLawyerId?: string;
  onSelectLawyer: (id: string) => void;
}

// Check if API key exists
const hasApiKey = (): boolean => {
  const key = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
  return !!key && key !== 'your_google_api_key_here' && key.length > 10;
};

// Load Google Maps dynamically
const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check for API key first
    if (!hasApiKey()) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // If already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    // If script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('Google Maps timeout'));
      }, 10000);
      return;
    }

    // Set up auth failure handler
    window.gm_authFailure = () => {
      reject(new Error('Google Maps authentication failed'));
    };

    const apiKey = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=FR`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const checkInit = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkInit);
          resolve();
        }
      }, 50);
      
      setTimeout(() => {
        clearInterval(checkInit);
        if (window.google?.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps failed to initialize'));
        }
      }, 5000);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

// Fallback component when map is not available
const MapFallback: React.FC<{ lawyers: Lawyer[]; selectedLawyerId?: string; onSelectLawyer: (id: string) => void; error?: string }> = ({ 
  lawyers, 
  selectedLawyerId, 
  onSelectLawyer,
  error 
}) => {
  // Group lawyers by city
  const cityCounts = lawyers.reduce((acc, lawyer) => {
    const city = lawyer.location?.split(',')[0]?.trim() || 'Autre';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-deep-900 dark:to-deep-950 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white/80 dark:bg-deep-900/80 backdrop-blur-sm border-b border-stone-200 dark:border-deep-800">
        <div className="flex items-center gap-2 text-stone-500 dark:text-surface-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">
            {error || 'Carte non disponible - Configurez VITE_GOOGLE_DEVELOPER_KEY'}
          </span>
        </div>
      </div>

      {/* City Stats */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Répartition par ville
        </h3>
        
        <div className="space-y-2">
          {topCities.map(([city, count]) => (
            <div
              key={city}
              className="flex items-center justify-between p-3 bg-white dark:bg-deep-800 rounded-lg shadow-sm"
            >
              <span className="text-sm font-medium text-stone-700 dark:text-surface-300">{city}</span>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-1 rounded-full">
                {count} avocat{count > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>

        {topCities.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun avocat à afficher</p>
          </div>
        )}
      </div>

      {/* Setup hint */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800/50">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Pour activer la carte, ajoutez votre clé API Google Maps dans le fichier .env
        </p>
      </div>
    </div>
  );
};

export const MapComponent: React.FC<MapComponentProps> = ({ lawyers, selectedLawyerId, onSelectLawyer }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const infoWindowsRef = useRef<{ [key: string]: any }>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usesFallback, setUsesFallback] = useState(!hasApiKey());

  // Initialize Google Map
  useEffect(() => {
    if (usesFallback || !mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        await loadGoogleMaps();

        if (!mapContainerRef.current) return;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: 46.603354, lng: 1.888334 },
          zoom: 6,
          minZoom: 5,
          maxZoom: 20,
          restriction: {
            latLngBounds: {
              north: 51.2,
              south: 41.2,
              west: -5.5,
              east: 10.0,
            },
            strictBounds: false,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapRef.current = map;

        window.google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
          setIsMapLoaded(true);
        });

        setTimeout(() => setIsMapLoaded(true), 2000);
      } catch (error: any) {
        console.error('Failed to initialize Google Maps:', error);
        setLoadError(error.message || 'Impossible de charger la carte');
        setUsesFallback(true);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapRef.current);
        mapRef.current = null;
      }
    };
  }, [usesFallback]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || usesFallback) return;

    const map = mapRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.setMap(null));
    Object.values(infoWindowsRef.current).forEach((infoWindow: any) => infoWindow.close());
    markersRef.current = {};
    infoWindowsRef.current = {};

    const bounds = new window.google.maps.LatLngBounds();
    let selectedCoords: { lat: number; lng: number } | null = null;

    const lawyersWithCoords = lawyers.filter(
      (l) => l.coordinates?.lat && l.coordinates?.lng && !isNaN(l.coordinates.lat) && !isNaN(l.coordinates.lng)
    );

    lawyersWithCoords.forEach((lawyer) => {
      const isSelected = lawyer.id === selectedLawyerId;
      const position = { lat: lawyer.coordinates.lat, lng: lawyer.coordinates.lng };

      if (isSelected) selectedCoords = position;

      const markerIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: isSelected ? '#9333ea' : '#334155',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: isSelected ? 2 : 1.5,
        anchor: new window.google.maps.Point(12, 22),
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        icon: markerIcon,
        title: lawyer.name,
        animation: isSelected ? window.google.maps.Animation.BOUNCE : null,
        zIndex: isSelected ? 1000 : 1,
      });

      if (isSelected) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: system-ui, sans-serif; max-width: 200px;">
              <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #1e293b;">
                ${lawyer.name}
              </h3>
              <p style="margin: 0; font-size: 13px; color: #64748b;">
                ${lawyer.location?.split(',')[0] || ''}
              </p>
            </div>
          `,
        });
        infoWindow.open(map, marker);
        infoWindowsRef.current[lawyer.id] = infoWindow;
      }

      marker.addListener('click', () => onSelectLawyer(lawyer.id));
      markersRef.current[lawyer.id] = marker;
      bounds.extend(position);
    });

    if (selectedCoords) {
      map.panTo(selectedCoords);
      setTimeout(() => map.setZoom(15), 300);
    } else if (lawyersWithCoords.length > 0) {
      map.fitBounds(bounds);
      if (lawyersWithCoords.length === 1) {
        setTimeout(() => map.setZoom(14), 300);
      }
    } else {
      map.setCenter({ lat: 46.603354, lng: 1.888334 });
      map.setZoom(6);
    }
  }, [lawyers, selectedLawyerId, onSelectLawyer, usesFallback]);

  // Show fallback if no API key or error
  if (usesFallback) {
    return <MapFallback lawyers={lawyers} selectedLawyerId={selectedLawyerId} onSelectLawyer={onSelectLawyer} error={loadError || undefined} />;
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full bg-stone-100 dark:bg-deep-800 z-10 relative" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-deep-900/90 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="relative mx-auto mb-4 w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200 dark:border-deep-700" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-surface-300">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
};
