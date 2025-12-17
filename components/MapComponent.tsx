import React, { useEffect, useRef } from 'react';
import { Lawyer } from '../types';

// Leaflet is loaded globally via index.html
declare global {
  interface Window {
    L: any;
  }
}

interface MapComponentProps {
  lawyers: Lawyer[];
  selectedLawyerId?: string;
  onSelectLawyer: (id: string) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({ lawyers, selectedLawyerId, onSelectLawyer }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // France bounding box (with some padding for border regions)
    const franceBounds = window.L.latLngBounds(
      [41.2, -5.5],  // Southwest corner (includes Corsica margin)
      [51.2, 10.0]   // Northeast corner
    );

    // Initialize map centered on France with strict bounds
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: franceBounds,
      maxBoundsViscosity: 1.0, // Prevents dragging outside bounds completely
      minZoom: 5,              // Can't zoom out past France level
      maxZoom: 18,             // Reasonable max zoom for street level
      bounceAtZoomLimits: false
    }).setView([46.603354, 1.888334], 6); 

    // Add Zoom Control to bottom right
    window.L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Use CartoDB Voyager (Light) with performance optimizations
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 18,
      bounds: franceBounds,    // Only load tiles within France bounds
      updateWhenIdle: true,    // Only load tiles after panning stops (faster)
      updateWhenZooming: false, // Don't load during zoom animation
      keepBuffer: 2            // Keep fewer tiles in memory (faster initial load)
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers and handle Zoom
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    const bounds = window.L.latLngBounds([]);
    let selectedCoords: [number, number] | null = null;
    
    // Filter lawyers with valid coordinates (must be valid numbers, not NaN)
    const lawyersWithCoords = lawyers.filter(l => 
      l.coordinates?.lat && 
      l.coordinates?.lng && 
      !isNaN(l.coordinates.lat) && 
      !isNaN(l.coordinates.lng) &&
      typeof l.coordinates.lat === 'number' &&
      typeof l.coordinates.lng === 'number'
    );
    
    lawyersWithCoords.forEach(lawyer => {
      const isSelected = lawyer.id === selectedLawyerId;
      
      if (isSelected && !isNaN(lawyer.coordinates.lat) && !isNaN(lawyer.coordinates.lng)) {
        selectedCoords = [lawyer.coordinates.lat, lawyer.coordinates.lng];
      }
      
      // Custom Marker HTML
      const iconHtml = `
        <div class="relative flex flex-col items-center justify-center transform transition-all duration-300 ${isSelected ? 'z-50' : 'z-10'}">
          <div class="${isSelected ? 'bg-primary-600 scale-125' : 'bg-slate-700 hover:bg-primary-600'} text-white p-2 rounded-full shadow-lg border-2 border-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          ${isSelected ? `<div class="mt-2 px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded shadow-lg whitespace-nowrap border border-slate-200 animate-fade-in-up">${lawyer.name}</div>` : ''}
        </div>
      `;

      const icon = window.L.divIcon({
        html: iconHtml,
        className: 'bg-transparent border-none', 
        iconSize: [40, 60],
        iconAnchor: [20, 30]
      });

      const marker = window.L.marker([lawyer.coordinates.lat, lawyer.coordinates.lng], { icon })
        .addTo(map)
        .on('click', () => {
          onSelectLawyer(lawyer.id);
          // Immediate smooth zoom on click - only if coordinates are valid
          if (!isNaN(lawyer.coordinates.lat) && !isNaN(lawyer.coordinates.lng)) {
            map.flyTo([lawyer.coordinates.lat, lawyer.coordinates.lng], 15, {
              animate: true,
              duration: 1.5
            });
          }
        });

      markersRef.current[lawyer.id] = marker;
      bounds.extend([lawyer.coordinates.lat, lawyer.coordinates.lng]);
    });

    // Handle View State
    if (selectedCoords && !isNaN(selectedCoords[0]) && !isNaN(selectedCoords[1])) {
      // If a lawyer is selected (from list or map), zoom to them
      map.flyTo(selectedCoords, 15, {
        animate: true,
        duration: 1.5
      });
    } else {
      // If no lawyer selected, fit all markers
      if (lawyersWithCoords.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } else {
         // Default to France
         map.setView([46.603354, 1.888334], 6);
      }
    }

  }, [lawyers, selectedLawyerId, onSelectLawyer]);

  return (
    <div ref={mapContainerRef} className="w-full h-full bg-slate-100 dark:bg-slate-800 z-10 relative" />
  );
};