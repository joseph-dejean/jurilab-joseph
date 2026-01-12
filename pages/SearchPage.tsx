import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../store/store';
import { Lawyer, LegalSpecialty } from '../types';
import { MapComponent } from '../components/MapComponent';
import { Button } from '../components/Button';
import { Search, Filter, Sparkles, MapPin, Star, ChevronDown, X, Briefcase, Clock, ArrowRight, Map, List, SlidersHorizontal } from 'lucide-react';
import { analyzeLegalCase } from '../services/geminiService';
import { LawyerProfileModal } from '../components/LawyerProfileModal';

export const SearchPage: React.FC = () => {
  const { lawyers, t, translateSpecialty, isLoadingLawyers } = useApp();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  // AI params from HomePage
  const isAiFromUrl = searchParams.get('ai') === 'true';
  const specialtyFromUrl = searchParams.get('specialty') || '';
  const summaryFromUrl = searchParams.get('summary') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>(lawyers);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ summary: string; reasoning: string } | null>(
    isAiFromUrl && summaryFromUrl ? { summary: t.search.aiSuggestion, reasoning: summaryFromUrl } : null
  );
  const [isAiSearchActive, setIsAiSearchActive] = useState(isAiFromUrl);
  const [modalLawyer, setModalLawyer] = useState<Lawyer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');


  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(isAiFromUrl ? specialtyFromUrl : '');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // City search state
  const [citySearch, setCitySearch] = useState<string>('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Extract all unique cities - OPTIMIZED with useMemo
  const allCities = useMemo(() => {
    if (lawyers.length === 0) return [];
    return Array.from(new Set(lawyers.map(l => {
      if (!l.location) return '';
      return l.location.split(',')[0]?.trim() || l.location;
    })))
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
      applyFilters();
      setIsLoading(false);
    } else {
      applyFilters();
    }
  }, []);

  useEffect(() => {
    if (isAiSearchActive) {
      applyFilters();
    } else {
      const timer = setTimeout(() => {
        applyFilters();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedSpecialty, selectedRegion, isAiSearchActive]);

  const handleAISearch = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setAiSuggestion(null);

    try {
      const analysis = await analyzeLegalCase(text);
      setAiSuggestion({ summary: t.search.aiSuggestion, reasoning: analysis.summary });

      // Apply filters directly with the new specialty to avoid race conditions
      const newSpecialty = analysis.specialty;
      setSelectedSpecialty(newSpecialty);
      setIsAiSearchActive(true);

      // Apply filters immediately with the known values
      let results = [...lawyers];
      if (newSpecialty) {
        results = results.filter(l => l.specialty === newSpecialty);
      }
      if (selectedRegion) {
        results = results.filter(l => l.location?.includes(selectedRegion));
      }
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setFilteredLawyers(results);

    } catch (error: any) {
      console.error("AI Search failed:", error);
      setAiSuggestion({
        summary: "⚠️ Analyse IA indisponible",
        reasoning: error.message || "Une erreur est survenue. Veuillez utiliser les filtres manuels."
      });
      setSelectedSpecialty('');
      setIsAiSearchActive(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFilters = () => {
    let results = [...lawyers];

    if (selectedSpecialty) {
      results = results.filter(l => l.specialty === selectedSpecialty);
    }

    if (selectedRegion) {
      results = results.filter(l => l.location?.includes(selectedRegion));
    }

    if (!isAiSearchActive && query) {
      const lowerQ = query.toLowerCase();
      results = results.filter(l =>
        l.name?.toLowerCase().includes(lowerQ) ||
        l.location?.toLowerCase().includes(lowerQ) ||
        l.firmName?.toLowerCase().includes(lowerQ)
      );
    }

    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    setFilteredLawyers(results);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiSearchActive(false);
    setAiSuggestion(null);
    setIsLoading(true);
    const timer = setTimeout(() => {
      applyFilters();
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }

  const handleCardClick = (id: string) => {
    setSelectedLawyerId(id);
    const element = document.getElementById(`lawyer-card-${id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const clearFilters = () => {
    setSelectedSpecialty('');
    setSelectedRegion('');
    setCitySearch('');
    setQuery('');
    setIsAiSearchActive(false);
    setAiSuggestion(null);
  };

  const hasActiveFilters = selectedSpecialty || selectedRegion || query;

  // Show loading indicator while lawyers are being fetched from Firebase
  if (isLoadingLawyers) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-surface-50 dark:bg-deep-950 px-4">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-base sm:text-lg font-semibold text-deep-900 dark:text-surface-100 mt-6">Chargement des avocats...</p>
        <p className="text-sm text-deep-500 dark:text-surface-500 mt-2">Connexion en cours</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] overflow-hidden bg-surface-50 dark:bg-deep-950">
        {/* Top Search Bar */}
        <div className="bg-white dark:bg-deep-900 border-b border-surface-200 dark:border-deep-800 shadow-glass z-20">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <form onSubmit={handleManualSearch} className="space-y-3">
              {/* Search Row */}
              <div className="flex gap-2 sm:gap-3">
                {/* Search Input */}
                <div className="relative flex-grow">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsAiSearchActive(false);
                    }}
                    placeholder="Rechercher..."
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 border-surface-200 dark:border-deep-700 input-focus outline-none text-sm sm:text-base text-deep-900 dark:text-surface-100"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                {/* Filter Toggle - Mobile */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`lg:hidden p-2.5 sm:p-3 rounded-xl border-2 transition-colors ${showFilters || hasActiveFilters
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-600'
                      : 'border-surface-200 dark:border-deep-700 text-deep-500'
                    }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary-500 rounded-full" />
                  )}
                </button>

                {/* Search Button */}
                <Button type="submit" variant="primary" className="hidden sm:flex">
                  Rechercher
                </Button>
              </div>

              {/* Desktop Filters Row */}
              <div className="hidden lg:flex items-center gap-3">
                {/* Specialty Dropdown */}
                <div className="relative">
                  <select
                    className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-white dark:bg-deep-800 border-2 border-surface-200 dark:border-deep-700 input-focus outline-none text-sm font-medium text-deep-700 dark:text-surface-300 cursor-pointer"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                  >
                    <option value="">Toutes spécialités</option>
                    {Object.values(LegalSpecialty).map(s => (
                      <option key={s} value={s}>{translateSpecialty(s)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-400 pointer-events-none" />
                </div>

                {/* City Search */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-400" />
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
                    placeholder={selectedRegion || "Ville..."}
                    className="w-44 pl-10 pr-8 py-2.5 rounded-xl bg-white dark:bg-deep-800 border-2 border-surface-200 dark:border-deep-700 input-focus outline-none text-sm text-deep-700 dark:text-surface-300"
                  />
                  {selectedRegion && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegion('');
                        setCitySearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-100 dark:hover:bg-deep-700"
                    >
                      <X className="w-3 h-3 text-deep-400" />
                    </button>
                  )}

                  {showCityDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-deep-900 border border-surface-200 dark:border-deep-700 rounded-xl shadow-glass-lg max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegion('');
                          setCitySearch('');
                          setShowCityDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-deep-800 text-sm font-medium border-b border-surface-100 dark:border-deep-800"
                      >
                        Toutes les villes
                      </button>
                      {filteredCities.length > 0 ? (
                        filteredCities.map(city => (
                          <button
                            type="button"
                            key={city}
                            onClick={() => {
                              setSelectedRegion(city);
                              setCitySearch('');
                              setShowCityDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-surface-50 dark:hover:bg-deep-800 text-sm ${selectedRegion === city ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-medium' : ''
                              }`}
                          >
                            {city}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-deep-500">
                          Aucune ville trouvée
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-deep-500 hover:text-deep-700 dark:hover:text-surface-300"
                  >
                    <X className="w-4 h-4" />
                    Effacer
                  </button>
                )}

                <div className="flex-1" />

                {/* AI Search Button */}
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => handleAISearch(query)}
                  isLoading={isAnalyzing}
                  disabled={!query}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Recherche IA
                </Button>
              </div>

              {/* Mobile Filters Panel */}
              {showFilters && (
                <div className="lg:hidden space-y-3 pt-3 border-t border-surface-100 dark:border-deep-800 animate-fade-in">
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 border-surface-200 dark:border-deep-700 text-sm"
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Toutes spécialités</option>
                    {Object.values(LegalSpecialty).map(s => (
                      <option key={s} value={s}>{translateSpecialty(s)}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-400" />
                    <input
                      type="text"
                      value={selectedRegion || citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="Rechercher une ville..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 border-surface-200 dark:border-deep-700 text-sm"
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" className="flex-1">
                      Appliquer
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      className="flex-1"
                      onClick={() => handleAISearch(query)}
                      isLoading={isAnalyzing}
                      disabled={!query}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      IA
                    </Button>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full py-2 text-sm text-deep-500 hover:text-deep-700"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-deep-900 border-b border-surface-200 dark:border-deep-800">
          <p className="text-sm font-medium text-deep-600 dark:text-surface-400">
            {filteredLawyers.length} {t.search.found}
          </p>
          <div className="flex gap-1 bg-surface-100 dark:bg-deep-800 rounded-lg p-1">
            <button
              onClick={() => setMobileView('list')}
              className={`p-2 rounded-md transition-colors ${mobileView === 'list'
                  ? 'bg-white dark:bg-deep-700 shadow-sm text-primary-600'
                  : 'text-deep-500'
                }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`p-2 rounded-md transition-colors ${mobileView === 'map'
                  ? 'bg-white dark:bg-deep-700 shadow-sm text-primary-600'
                  : 'text-deep-500'
                }`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-grow overflow-hidden">
          {/* Results List - Hidden on mobile when map view is active */}
          <div className={`w-full md:w-1/2 lg:w-5/12 overflow-y-auto scrollbar-thin momentum-scroll ${mobileView === 'map' ? 'hidden md:block' : 'block'
            }`}>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20 lg:pb-4">
              {/* AI Suggestion Banner */}
              {aiSuggestion && (
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 ${aiSuggestion.summary.includes('indisponible')
                    ? 'bg-accent-50 dark:bg-accent-950/30 border-accent-200 dark:border-accent-800/50'
                    : 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/50'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${aiSuggestion.summary.includes('indisponible')
                        ? 'bg-accent-100 dark:bg-accent-900/50 text-accent-600'
                        : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600'
                      }`}>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-deep-900 dark:text-surface-100 mb-1">
                        {aiSuggestion.summary.includes('indisponible') ? '⚠️ Service Indisponible' : t.search.aiSuggestion}
                      </h4>
                      <p className="text-xs sm:text-sm text-deep-600 dark:text-surface-400">{aiSuggestion.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count - Desktop only, mobile is in view toggle bar */}
              <div className="hidden md:flex items-center justify-between">
                <p className="text-sm font-medium text-deep-600 dark:text-surface-400">
                  {filteredLawyers.length} {t.search.found}
                </p>
              </div>

              {/* Loading State */}
              {isLoading || lawyers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 sm:py-20">
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-surface-200 dark:border-deep-800" />
                    <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-deep-900 dark:text-surface-100 mt-6">
                    {lawyers.length === 0 ? 'Chargement...' : 'Recherche...'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Lawyer Cards */}
                  {filteredLawyers.slice(0, displayLimit).map(lawyer => (
                    <div
                      key={lawyer.id}
                      id={`lawyer-card-${lawyer.id}`}
                      onClick={() => handleCardClick(lawyer.id)}
                      className={`group relative bg-white dark:bg-deep-900 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer active:scale-[0.98] ${selectedLawyerId === lawyer.id
                          ? 'border-primary-500 shadow-card-hover'
                          : 'border-surface-100 dark:border-deep-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-card-hover'
                        }`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex gap-3 sm:gap-4">
                          <img
                            src={lawyer.avatarUrl}
                            alt={lawyer.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-2 ring-surface-100 dark:ring-deep-700"
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-base sm:text-lg text-deep-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                  {lawyer.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-deep-500 dark:text-surface-500 truncate">
                                  {lawyer.firmName}
                                </p>
                              </div>
                              {lawyer.rating && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-50 dark:bg-accent-950/50 flex-shrink-0">
                                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-500 fill-accent-500" />
                                  <span className="text-xs sm:text-sm font-semibold text-accent-700 dark:text-accent-300">
                                    {lawyer.rating}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                              <span className="badge badge-primary text-[10px] sm:text-xs">
                                <Briefcase className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {translateSpecialty(lawyer.specialty)}
                              </span>
                              <span className="badge badge-neutral text-[10px] sm:text-xs">
                                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {lawyer.location?.split(',')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-surface-100 dark:border-deep-800 flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-deep-500 dark:text-surface-500 line-clamp-1 flex-1">
                            {lawyer.bio?.slice(0, 60)}...
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalLawyer(lawyer);
                            }}
                            className="flex-shrink-0"
                          >
                            <span className="hidden sm:inline">{t.search.viewProfile}</span>
                            <span className="sm:hidden">Voir</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More Button */}
                  {filteredLawyers.length > displayLimit && (
                    <div className="text-center py-4">
                      <Button
                        onClick={() => setDisplayLimit(prev => prev + 20)}
                        variant="secondary"
                        className="w-full sm:w-auto"
                      >
                        Charger plus ({displayLimit}/{filteredLawyers.length})
                      </Button>
                    </div>
                  )}

                  {/* Empty State */}
                  {filteredLawyers.length === 0 && !aiSuggestion && (
                    <div className="text-center py-16 sm:py-20">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-deep-800 flex items-center justify-center">
                        <Search className="w-6 h-6 sm:w-8 sm:h-8 text-deep-300 dark:text-deep-600" />
                      </div>
                      <p className="text-deep-500 dark:text-surface-500">{t.search.noResults}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Map View - Hidden on mobile when list view is active */}
          <div className={`w-full md:w-1/2 lg:w-7/12 h-full relative ${mobileView === 'list' ? 'hidden md:block' : 'block'
            }`}>
            <MapComponent
              lawyers={filteredLawyers.slice(0, 200)}
              selectedLawyerId={selectedLawyerId || undefined}
              onSelectLawyer={handleCardClick}
            />
            {filteredLawyers.length > 200 && (
              <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 glass rounded-xl px-4 py-2 text-sm font-medium shadow-glass">
                Carte limitée à 200 avocats
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lawyer Profile Modal */}
      {modalLawyer && (
        <LawyerProfileModal
          lawyer={modalLawyer}
          onClose={() => setModalLawyer(null)}
        />
      )}
    </>
  );
};
