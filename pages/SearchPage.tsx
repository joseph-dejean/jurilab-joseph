import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../store/store';
import { Lawyer, LegalSpecialty } from '../types';
import { MapComponent } from '../components/MapComponent';
import { Button } from '../components/Button';
import { LawyerProfileModal } from '../components/LawyerProfileModal';
import { Search, Filter, DollarSign, Sparkles } from 'lucide-react';
import { analyzeLegalCase } from '../services/geminiService';

export const SearchPage: React.FC = () => {
  const { lawyers, t, translateSpecialty, isLoadingLawyers } = useApp();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>(lawyers);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  
  // Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [modalLawyer, setModalLawyer] = useState<Lawyer | null>(null);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ summary: string; reasoning: string } | null>(null);
  const [recommendedLawyerIds, setRecommendedLawyerIds] = useState<string[]>([]);
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  
  // City search state
  const [citySearch, setCitySearch] = useState<string>('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Extract all unique cities - OPTIMIZED with useMemo
  const allCities = useMemo(() => {
    if (lawyers.length === 0) return [];
    return Array.from(new Set(lawyers.map(l => l.location.split(',')[0]?.trim() || l.location)))
      .filter(c => c && c !== '')
      .sort();
  }, [lawyers]);
  
  // Filter cities based on search input
  const filteredCities = useMemo(() => {
    if (!citySearch) return allCities;
    return allCities.filter(city => city.toLowerCase().startsWith(citySearch.toLowerCase()));
  }, [citySearch, allCities]);

  // Pagination State
  const [displayLimit, setDisplayLimit] = useState(20);

  // Update filtered lawyers when lawyers data loads from Firebase
  useEffect(() => {
    if (lawyers.length > 0) {
      applyFilters();
    }
  }, [lawyers]);

  useEffect(() => {
    if (initialQuery) {
      setIsLoading(true);
      handleAISearch(initialQuery).finally(() => setIsLoading(false));
    } else {
      applyFilters();
    }
  }, []); 

  useEffect(() => {
    if (!isAiSearchActive) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        applyFilters();
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedSpecialty, selectedRegion]);

  const handleAISearch = async (text: string) => {
    setIsAnalyzing(true);
    setIsAiSearchActive(true);
    const analysis = await analyzeLegalCase(text, lawyers);

    setAiSuggestion({ summary: analysis.summary, reasoning: analysis.reasoning });
    
    if (analysis.recommendedSpecialty) {
      setSelectedSpecialty(analysis.recommendedSpecialty);
      setRecommendedLawyerIds(analysis.recommendedLawyers);
      applyFilters(analysis.recommendedSpecialty, analysis.recommendedLawyers);
    } else {
      setFilteredLawyers([]); // No specialty found, show no results.
    }
    
    setIsAnalyzing(false);
  };

  const applyFilters = (overrideSpecialty?: string, overrideRecommendedIds?: string[]) => {
    let results = [...lawyers];
    const recommendedIds = overrideRecommendedIds || recommendedLawyerIds;
    
    const spec = overrideSpecialty || selectedSpecialty;
    if (spec) {
      results = results.filter(l => l.specialty === spec);
    }

    if (selectedRegion) {
      results = results.filter(l => l.location.includes(selectedRegion));
    }

    if (!isAiSearchActive && !overrideSpecialty && query) {
      const lowerQ = query.toLowerCase();
      results = results.filter(l => 
        l.name.toLowerCase().includes(lowerQ) || 
        l.location.toLowerCase().includes(lowerQ) ||
        l.firmName?.toLowerCase().includes(lowerQ)
      );
    }

    if (recommendedIds.length > 0) {
      results.sort((a, b) => {
        const aIndex = recommendedIds.indexOf(a.id);
        const bIndex = recommendedIds.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
    }

    setFilteredLawyers(results);
  };
  
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiSearchActive(false);
    setAiSuggestion(null);
    setRecommendedLawyerIds([]);
    setIsLoading(true);
    const timer = setTimeout(() => {
      applyFilters();
      setIsLoading(false);
    }, 500);
    // In a real app, you might want to debounce this.
    return () => clearTimeout(timer);
  }

  const handleCardClick = (id: string) => {
    setSelectedLawyerId(id);
    const element = document.getElementById(`lawyer-card-${id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const openBookingModal = (e: React.MouseEvent, lawyer: Lawyer) => {
    e.stopPropagation();
    setModalLawyer(lawyer);
    setIsProfileModalOpen(true);
  };

  // Show loading indicator while lawyers are being fetched from Firebase
  if (isLoadingLawyers) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-100/50 dark:bg-navy/50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand border-t-transparent mb-4"></div>
        <p className="text-lg font-semibold text-navy dark:text-white">Chargement des avocats...</p>
        <p className="text-sm text-slate-500 mt-2">Connexion à Firebase en cours</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-100/50 dark:bg-navy/50">
      <LawyerProfileModal 
        lawyer={modalLawyer}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Top Filters Bar */}
      <div className="bg-white dark:bg-navy-dark border-b shadow-subtle z-20">
        <form onSubmit={handleManualSearch} className="container mx-auto p-4 flex flex-col lg:flex-row gap-3 items-center">
           <div className="relative w-full lg:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom, ville..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none bg-slate-50 dark:bg-navy"
              />
           </div>

           <div className="flex gap-3 overflow-x-auto w-full lg:w-auto no-scrollbar">
              <select 
                className="px-3 py-2 rounded-lg border bg-white dark:bg-navy text-sm w-full"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
              >
                <option value="">Toutes Spécialités</option>
                {Object.values(LegalSpecialty).map(s => <option key={s} value={s}>{translateSpecialty(s)}</option>)}
              </select>

              {/* Searchable City Dropdown */}
              <div className="relative w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onClick={() => setShowCityDropdown(true)}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                    placeholder={selectedRegion ? `📍 ${selectedRegion}` : `Rechercher une ville...`}
                    className="w-full px-3 py-2 pr-8 rounded-lg border bg-white dark:bg-navy text-sm overflow-hidden"
                  />
                  {selectedRegion && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegion('');
                        setCitySearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {showCityDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-navy border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div 
                      onClick={() => {
                        setSelectedRegion('');
                        setCitySearch('');
                        setShowCityDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-brand/10 cursor-pointer text-sm font-semibold border-b"
                    >
                      ✕ Toutes les villes
                    </div>
                    {filteredCities.length > 0 ? (
                      filteredCities.map(city => (
                        <div
                          key={city}
                          onClick={() => {
                            setSelectedRegion(city);
                            setCitySearch('');
                            setShowCityDropdown(false);
                          }}
                          className={`px-3 py-2 hover:bg-brand/10 cursor-pointer text-sm ${
                            selectedRegion === city ? 'bg-brand/20 font-semibold' : ''
                          }`}
                        >
                          {city}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Aucune ville trouvée
                      </div>
                    )}
                  </div>
                )}
              </div>
           </div>
           <Button type="submit" className="w-full lg:w-auto bg-navy dark:bg-brand text-white dark:text-navy-dark font-semibold">
             Filtrer
           </Button>
           <Button onClick={async () => {
              setIsLoading(true);
              await handleAISearch(query);
              setIsLoading(false);
           }} isLoading={isAnalyzing} disabled={!query} className="w-full lg:w-auto">
              <Sparkles className="h-4 w-4 mr-2" />
              Recherche IA
           </Button>
        </form>
      </div>

      <div className="flex flex-grow overflow-hidden">
        {/* Results List */}
        <div className="w-full md:w-1/2 lg:w-5/12 overflow-y-auto p-4 space-y-4">
          
          {isLoading || lawyers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-brand rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-semibold text-navy dark:text-white">
                {lawyers.length === 0 ? 'Chargement des avocats...' : 'Recherche en cours...'}
              </p>
              <p className="text-slate-500">
                {lawyers.length === 0 ? 'Veuillez patienter.' : 'Nous analysons votre demande.'}
              </p>
            </div>
          ) : (
            <>
              {aiSuggestion && (
                <div className={`p-4 rounded-xl border ${
                  aiSuggestion.summary.includes('indisponible') || aiSuggestion.reasoning.includes('🔄') || aiSuggestion.reasoning.includes('⏸️')
                    ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-700/30'
                    : 'bg-brand-light/20 border-brand/20 dark:bg-brand/5 dark:border-brand/10'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${
                      aiSuggestion.summary.includes('indisponible') || aiSuggestion.reasoning.includes('🔄') || aiSuggestion.reasoning.includes('⏸️')
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-brand/10 text-brand-dark dark:text-brand'
                    }`}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-navy dark:text-white">
                        {aiSuggestion.summary.includes('indisponible') ? '⚠️ Service Temporairement Indisponible' : t.search.aiSuggestion}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{aiSuggestion.reasoning}</p>
                      {aiSuggestion.summary.includes('indisponible') && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          💡 Astuce : Utilisez les filtres manuels ci-dessus pour trouver votre avocat.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-500 font-semibold">{filteredLawyers.length} {t.search.found}</p>

              {filteredLawyers.slice(0, displayLimit).map(lawyer => (
                <div 
                  key={lawyer.id}
                  id={`lawyer-card-${lawyer.id}`}
                  onClick={() => handleCardClick(lawyer.id)}
                  className={`relative bg-white dark:bg-navy p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-brand hover:shadow-subtle-lg
                    ${selectedLawyerId === lawyer.id ? 'border-brand' : 'border-transparent'}`}
                >
                  {recommendedLawyerIds.includes(lawyer.id) && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-brand/10 text-brand-dark dark:text-brand text-xs font-bold rounded-full">
                      Recommandé
                    </div>
                  )}
                  <div className="flex gap-4">
                    <img src={lawyer.avatarUrl} alt={lawyer.name} className="w-20 h-20 rounded-full object-cover" />
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg text-navy dark:text-white">{lawyer.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{lawyer.firmName}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="bg-slate-100 dark:bg-navy-light text-slate-600 dark:text-slate-300 font-medium px-2 py-1 rounded">{translateSpecialty(lawyer.specialty)}</span>
                        <span className="bg-slate-100 dark:bg-navy-light text-slate-600 dark:text-slate-300 font-medium px-2 py-1 rounded">{lawyer.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                     <Button size="sm" variant="accent" onClick={(e) => openBookingModal(e, lawyer)}>
                        {t.search.viewProfile}
                     </Button>
                  </div>
                </div>
              ))}

              {filteredLawyers.length > displayLimit && (
                <div className="text-center py-4">
                  <Button 
                    onClick={() => setDisplayLimit(prev => prev + 20)}
                    variant="outline"
                  >
                    Charger plus d'avocats ({displayLimit}/{filteredLawyers.length})
                  </Button>
                </div>
              )}

              {filteredLawyers.length === 0 && !aiSuggestion && (
                <div className="text-center py-20">
                   <p className="text-slate-500">{t.search.noResults}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Map View */}
        <div className="hidden md:block w-1/2 lg:w-7/12 h-full">
          <MapComponent 
            lawyers={filteredLawyers.slice(0, 200)} 
            selectedLawyerId={selectedLawyerId || undefined}
            onSelectLawyer={handleCardClick}
          />
          {filteredLawyers.length > 200 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-navy px-4 py-2 rounded-lg shadow-lg text-sm">
              Carte limitée à 200 avocats sur {filteredLawyers.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};