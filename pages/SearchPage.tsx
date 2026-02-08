import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../store/store';
import { Lawyer, LegalSpecialty } from '../types';
import { MapComponent } from '../components/MapComponent';
import { Button } from '../components/Button';
import { Search, Sparkles, MapPin, Star, X, Briefcase, ArrowRight, Map, List, ChevronDown, Globe, Scale, Building2, Home, Users, Plane, Lightbulb, Calculator, Gavel, Heart, FileText, Shield, Landmark, Car, Stethoscope, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { analyzeLegalCase } from '../services/geminiService';
import { LawyerProfileModal } from '../components/LawyerProfileModal';

// Specialty icons mapping
const specialtyIcons: Record<string, React.ReactNode> = {
  [LegalSpecialty.CRIMINAL]: <Gavel className="w-4 h-4" />,
  [LegalSpecialty.FAMILY]: <Heart className="w-4 h-4" />,
  [LegalSpecialty.CORPORATE]: <Building2 className="w-4 h-4" />,
  [LegalSpecialty.REAL_ESTATE]: <Home className="w-4 h-4" />,
  [LegalSpecialty.LABOR]: <Users className="w-4 h-4" />,
  [LegalSpecialty.IMMIGRATION]: <Plane className="w-4 h-4" />,
  [LegalSpecialty.IP]: <Lightbulb className="w-4 h-4" />,
  [LegalSpecialty.TAX]: <Calculator className="w-4 h-4" />,
  [LegalSpecialty.CIVIL]: <FileText className="w-4 h-4" />,
  [LegalSpecialty.ADMINISTRATIVE]: <Landmark className="w-4 h-4" />,
  [LegalSpecialty.ENVIRONMENTAL]: <Globe className="w-4 h-4" />,
  [LegalSpecialty.BANKING]: <Shield className="w-4 h-4" />,
  [LegalSpecialty.INSURANCE]: <Shield className="w-4 h-4" />,
  [LegalSpecialty.INTERNATIONAL]: <Globe className="w-4 h-4" />,
  [LegalSpecialty.SPORTS]: <Users className="w-4 h-4" />,
  [LegalSpecialty.MEDICAL]: <Stethoscope className="w-4 h-4" />,
  [LegalSpecialty.TRANSPORT]: <Car className="w-4 h-4" />,
};

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
  const [aiSuggestion, setAiSuggestion] = useState<{ summary: string; reasoning: string } | null>(
    isAiFromUrl && summaryFromUrl ? { summary: t.search.aiSuggestion, reasoning: summaryFromUrl } : null
  );
  const [isAiSearchActive, setIsAiSearchActive] = useState(isAiFromUrl);
  const [modalLawyer, setModalLawyer] = useState<Lawyer | null>(null);
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [citySearchInput, setCitySearchInput] = useState('');

  // Refs
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Filters
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(isAiFromUrl ? specialtyFromUrl : '');
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Extract all unique cities
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
    if (!citySearchInput) return allCities.slice(0, 20);
    return allCities.filter(city => 
      city.toLowerCase().includes(citySearchInput.toLowerCase())
    ).slice(0, 20);
  }, [allCities, citySearchInput]);

  // Pagination State
  const [displayLimit, setDisplayLimit] = useState(20);

  // Popular specialties to show first
  const popularSpecialties = [
    LegalSpecialty.FAMILY,
    LegalSpecialty.CRIMINAL,
    LegalSpecialty.REAL_ESTATE,
    LegalSpecialty.LABOR,
    LegalSpecialty.CORPORATE,
    LegalSpecialty.IMMIGRATION,
  ];

  const otherSpecialties = Object.values(LegalSpecialty).filter(
    s => !popularSpecialties.includes(s)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update filtered lawyers when lawyers data loads
  useEffect(() => {
    if (lawyers.length > 0) {
      applyFilters();
    }
  }, [lawyers]);

  useEffect(() => {
    applyFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedSpecialty, selectedCity, query]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const wordCount = query.trim().split(/\s+/).length;
    if (wordCount >= 4 && query.trim()) {
      await handleAISearch(query);
    } else {
      applyFilters();
    }
  };

  const handleAISearch = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setAiSuggestion(null);

    try {
      const analysis = await analyzeLegalCase(text);
      
      // Map specialty string to enum value for filtering
      const specialtyMap: Record<string, LegalSpecialty> = {
        'Criminal Law': LegalSpecialty.CRIMINAL,
        'Family Law': LegalSpecialty.FAMILY,
        'Corporate Law': LegalSpecialty.CORPORATE,
        'Real Estate': LegalSpecialty.REAL_ESTATE,
        'Labor Law': LegalSpecialty.LABOR,
        'Intellectual Property': LegalSpecialty.IP,
        'Immigration': LegalSpecialty.IMMIGRATION,
        'Tax Law': LegalSpecialty.TAX,
        'General Practice': LegalSpecialty.GENERAL,
      };
      
      const mappedSpecialty = specialtyMap[analysis.specialty] || '';
      
      setAiSuggestion({ summary: t.search.aiSuggestion, reasoning: analysis.summary });
      setSelectedSpecialty(mappedSpecialty);
      setIsAiSearchActive(true);

      let results = [...lawyers];
      if (mappedSpecialty) {
        results = results.filter(l => l.specialty === mappedSpecialty);
      }
      if (selectedCity) {
        results = results.filter(l => l.location?.includes(selectedCity));
      }
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setFilteredLawyers(results);

    } catch (error: any) {
      console.error("AI Search failed:", error);
      // Show fallback message and apply text-based search
      setAiSuggestion({
        summary: "Recherche alternative",
        reasoning: "Analyse IA temporairement indisponible. Recherche textuelle appliquée."
      });
      setSelectedSpecialty('');
      setIsAiSearchActive(false);
      
      // Apply text-based search as fallback
      const lowerQ = text.toLowerCase();
      let results = lawyers.filter(l =>
        l.name?.toLowerCase().includes(lowerQ) ||
        l.location?.toLowerCase().includes(lowerQ) ||
        l.firmName?.toLowerCase().includes(lowerQ) ||
        l.bio?.toLowerCase().includes(lowerQ)
      );
      if (selectedCity) {
        results = results.filter(l => l.location?.includes(selectedCity));
      }
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setFilteredLawyers(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyFilters = () => {
    let results = [...lawyers];

    if (selectedSpecialty) {
      results = results.filter(l => l.specialty === selectedSpecialty);
    }

    if (selectedCity) {
      results = results.filter(l => l.location?.includes(selectedCity));
    }

    if (query && !isAiSearchActive) {
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

  const handleCardClick = (id: string) => {
    setSelectedLawyerId(id);
    const element = document.getElementById(`lawyer-card-${id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const clearAllFilters = () => {
    setSelectedSpecialty('');
    setSelectedCity('');
    setQuery('');
    setIsAiSearchActive(false);
    setAiSuggestion(null);
    setCitySearchInput('');
  };

  const toggleSpecialty = (specialty: string) => {
    if (selectedSpecialty === specialty) {
      setSelectedSpecialty('');
    } else {
      setSelectedSpecialty(specialty);
    }
    setIsAiSearchActive(false);
    setAiSuggestion(null);
  };

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
    setCitySearchInput('');
  };

  const hasActiveFilters = selectedSpecialty || selectedCity || query;

  // Loading state
  if (isLoadingLawyers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-deep-950 px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-lg font-semibold text-deep-900 dark:text-surface-100 mt-6">Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 top-20 flex flex-col bg-stone-50 dark:bg-deep-950 z-30">
        {/* Search Header */}
        <div className="bg-white dark:bg-deep-900 border-b border-stone-200 dark:border-deep-800 shadow-sm flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="flex items-center bg-stone-50 dark:bg-deep-800 rounded-xl border border-stone-200 dark:border-deep-700 focus-within:border-primary-500 transition-colors overflow-hidden">
                {isAnalyzing ? (
                  <div className="pl-3 pr-2">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <Sparkles className="ml-3 mr-2 w-4 h-4 text-primary-500 flex-shrink-0" />
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsAiSearchActive(false);
                    setAiSuggestion(null);
                  }}
                  placeholder="Décrivez votre besoin juridique ou recherchez par nom..."
                  className="flex-1 bg-transparent border-none py-2.5 pr-4 text-deep-900 dark:text-surface-100 placeholder-stone-400 focus:outline-none focus:ring-0 text-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="m-1 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Rechercher</span>
                </button>
              </div>
            </form>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className={`mb-3 px-3 py-2 rounded-lg border text-sm ${
                aiSuggestion.summary.includes('indisponible')
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200'
                  : 'bg-primary-50 dark:bg-primary-950/30 border-primary-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <p className="text-stone-600 dark:text-surface-400 flex-1 truncate">{aiSuggestion.reasoning}</p>
                  <button
                    onClick={() => { setAiSuggestion(null); setIsAiSearchActive(false); }}
                    className="p-1 hover:bg-black/5 rounded flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* City Dropdown */}
              <div className="relative" ref={cityDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedCity
                      ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-300 text-primary-700'
                      : 'bg-white dark:bg-deep-800 border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedCity || 'Ville'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCityDropdown && (
                  <div className="absolute z-[100] mt-2 w-64 bg-white dark:bg-deep-900 border border-stone-200 dark:border-deep-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-stone-100 dark:border-deep-800">
                      <input
                        type="text"
                        value={citySearchInput}
                        onChange={(e) => setCitySearchInput(e.target.value)}
                        placeholder="Rechercher une ville..."
                        className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-deep-800 border border-stone-200 dark:border-deep-700 rounded-lg focus:outline-none focus:border-primary-500"
                        autoFocus
                      />
                    </div>
                    {/* City list */}
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => selectCity('')}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-deep-800 ${
                          !selectedCity ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 font-medium' : ''
                        }`}
                      >
                        Toutes les villes
                      </button>
                      {filteredCities.length > 0 ? (
                        filteredCities.map(city => (
                          <button
                            type="button"
                            key={city}
                            onClick={() => selectCity(city)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-deep-800 ${
                              selectedCity === city ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 font-medium' : ''
                            }`}
                          >
                            {city}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-stone-400">Aucune ville trouvée</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-stone-200 dark:bg-deep-700" />

              {/* Specialty Pills */}
              {popularSpecialties.map(specialty => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedSpecialty === specialty
                      ? 'bg-primary-700 border-primary-700 text-white'
                      : 'bg-white dark:bg-deep-800 border-stone-200 text-stone-600 hover:border-primary-300 hover:text-primary-700'
                  }`}
                >
                  {specialtyIcons[specialty]}
                  <span className="hidden sm:inline">{translateSpecialty(specialty)}</span>
                </button>
              ))}
              
              {/* More button */}
              <button
                type="button"
                onClick={() => setShowAllSpecialties(!showAllSpecialties)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:text-primary-600 transition-all"
              >
                +{otherSpecialties.length}
                <ChevronDown className={`w-3 h-3 transition-transform ${showAllSpecialties ? 'rotate-180' : ''}`} />
              </button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="p-1.5 text-stone-400 hover:text-primary-600 transition-colors"
                  title="Effacer les filtres"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Map Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  showMap
                    ? 'bg-primary-100 border-primary-300 text-primary-700'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {showMap ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                <span className="hidden sm:inline">{showMap ? 'Masquer carte' : 'Afficher carte'}</span>
              </button>
            </div>

            {/* Expanded specialties */}
            {showAllSpecialties && (
              <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-stone-100 dark:border-deep-800">
                {otherSpecialties.map(specialty => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      selectedSpecialty === specialty
                        ? 'bg-primary-700 border-primary-700 text-white'
                        : 'bg-white dark:bg-deep-800 border-stone-200 text-stone-600 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    {specialtyIcons[specialty]}
                    {translateSpecialty(specialty)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results info bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-stone-100/50 dark:bg-deep-900/50 border-b border-stone-200 dark:border-deep-800 flex-shrink-0">
          <p className="text-xs font-medium text-stone-500">
            {filteredLawyers.length} avocat{filteredLawyers.length > 1 ? 's' : ''} trouvé{filteredLawyers.length > 1 ? 's' : ''}
          </p>
          {/* Mobile view toggle */}
          <div className="md:hidden flex gap-1 bg-white dark:bg-deep-800 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setShowMap(false)}
              className={`p-1.5 rounded-md transition-colors ${!showMap ? 'bg-primary-100 text-primary-600' : 'text-stone-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowMap(true)}
              className={`p-1.5 rounded-md transition-colors ${showMap ? 'bg-primary-100 text-primary-600' : 'text-stone-400'}`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Results List */}
          <div className={`${showMap ? 'w-full md:w-2/5 lg:w-1/3' : 'w-full'} overflow-y-auto bg-white dark:bg-deep-900 ${showMap ? 'hidden md:block' : 'block'}`}>
            <div className="p-3 space-y-2">
              {filteredLawyers.length > 0 ? (
                <>
                  {filteredLawyers.slice(0, displayLimit).map(lawyer => (
                    <div
                      key={lawyer.id}
                      id={`lawyer-card-${lawyer.id}`}
                      onClick={() => handleCardClick(lawyer.id)}
                      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer ${
                        selectedLawyerId === lawyer.id
                          ? 'border-primary-500 bg-primary-50/50'
                          : 'border-transparent hover:bg-stone-50 dark:hover:bg-deep-800'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex gap-3">
                          <img
                            src={lawyer.avatarUrl}
                            alt={lawyer.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-deep-900 dark:text-surface-100 group-hover:text-primary-600 transition-colors truncate">
                                  {lawyer.name}
                                </h3>
                                <p className="text-xs text-stone-400 truncate">
                                  {lawyer.firmName}
                                </p>
                              </div>
                              {lawyer.rating && (
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span className="text-xs font-medium text-amber-600">{lawyer.rating}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] text-primary-600 font-medium">
                                {specialtyIcons[lawyer.specialty]}
                                {translateSpecialty(lawyer.specialty)}
                              </span>
                              <span className="text-stone-300">•</span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-500">
                                <MapPin className="w-2.5 h-2.5" />
                                {lawyer.location?.split(',')[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs text-stone-400 line-clamp-1 flex-1">
                            {lawyer.bio?.slice(0, 50)}...
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalLawyer(lawyer);
                            }}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 flex-shrink-0"
                          >
                            Voir
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredLawyers.length > displayLimit && (
                    <button
                      onClick={() => setDisplayLimit(prev => prev + 20)}
                      className="w-full py-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      Voir plus ({filteredLawyers.length - displayLimit} restants)
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                  <p className="text-sm text-stone-500">Aucun résultat</p>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="mt-2 text-xs text-primary-600 hover:underline">
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map View */}
          {showMap && (
            <div className={`flex-1 h-full relative ${!showMap ? 'hidden' : 'hidden md:block'}`}>
              <MapComponent
                lawyers={filteredLawyers.slice(0, 200)}
                selectedLawyerId={selectedLawyerId || undefined}
                onSelectLawyer={handleCardClick}
              />
              {filteredLawyers.length > 200 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg">
                  200 avocats affichés sur {filteredLawyers.length}
                </div>
              )}
            </div>
          )}

          {/* Mobile Map View */}
          {showMap && (
            <div className="md:hidden absolute inset-0 top-0 z-20">
              <MapComponent
                lawyers={filteredLawyers.slice(0, 200)}
                selectedLawyerId={selectedLawyerId || undefined}
                onSelectLawyer={handleCardClick}
              />
              {/* Back to list button on mobile */}
              <button
                onClick={() => setShowMap(false)}
                className="absolute top-4 left-4 bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Voir la liste
              </button>
            </div>
          )}
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
