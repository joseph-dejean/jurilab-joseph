import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Clock, Award, ArrowRight, Star, Users, Sparkles, CheckCircle, Video, Bot, FolderLock, Lock } from 'lucide-react';
import { Button } from '../components/Button';
import { LegalSpecialty } from '../types';
import { useApp } from '../store/store';
import { analyzeLegalCase } from '../services/geminiService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, translateSpecialty, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const adminTapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (adminTapCount === 0) return;

    // Reset tap count after 2 seconds of inactivity
    if (adminTapTimerRef.current) {
      window.clearTimeout(adminTapTimerRef.current);
    }
    adminTapTimerRef.current = window.setTimeout(() => setAdminTapCount(0), 2000);

    // 7 taps quickly => navigate to admin
    if (adminTapCount >= 7) {
      setAdminTapCount(0);
      navigate('/admin');
    }
  }, [adminTapCount, navigate]);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/search');
      return;
    }

    setIsSearching(true);
    try {
      // Pre-analyze with AI and pass the specialty to the search page
      const analysis = await analyzeLegalCase(searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&ai=true&specialty=${encodeURIComponent(analysis.specialty)}&summary=${encodeURIComponent(analysis.summary)}`);
    } catch (error) {
      // If AI fails, just navigate with the query for manual search
      console.error('AI search failed:', error);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const specialtyIcons: Record<string, string> = {
    [LegalSpecialty.CRIMINAL]: '⚖️',
    [LegalSpecialty.FAMILY]: '👨‍👩‍👧',
    [LegalSpecialty.CORPORATE]: '🏢',
    [LegalSpecialty.REAL_ESTATE]: '🏠',
    [LegalSpecialty.LABOR]: '💼',
    [LegalSpecialty.IMMIGRATION]: '🌍',
    [LegalSpecialty.IP]: '💡',
    [LegalSpecialty.TAX]: '📊',
  };

  const ecosystemFeatures = [
    {
      icon: Video,
      title: 'Consultation Vidéo',
      description: 'Échangez en direct avec votre avocat via notre plateforme sécurisée et chiffrée de bout en bout.',
    },
    {
      icon: Bot,
      title: 'Assistant IA',
      description: 'Une première analyse instantanée de vos besoins pour vous orienter vers la bonne spécialité.',
    },
    {
      icon: FolderLock,
      title: 'Gestion Documentaire',
      description: 'Centralisez, partagez et signez vos documents juridiques dans un espace collaboratif sécurisé.',
    },
    {
      icon: Lock,
      title: 'Sécurité Maximale',
      description: 'Vos données sont protégées par les plus hauts standards de confidentialité et d\'anonymat.',
    },
  ];

  return (
    <div className="flex flex-col selection:bg-primary-600 selection:text-white">
      {/* Hidden admin access zone (7 taps in <2s) */}
      <button
        type="button"
        aria-label="admin"
        onClick={() => setAdminTapCount((c) => c + 1)}
        className="fixed bottom-2 left-2 w-10 h-10 opacity-0 z-[60]"
      />

      {/* Hero Section with Mesh Background */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-32 sm:pt-36 pb-10 bg-gradient-to-b from-rose-50/80 via-stone-50 to-white dark:from-deep-950 dark:via-deep-900 dark:to-deep-900">
        {/* Mesh Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[20%] left-[20%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-rose-200/40 dark:bg-primary-900/20 rounded-full filter blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-[30%] right-[20%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-100/60 dark:bg-primary-800/20 rounded-full filter blur-[80px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-indigo-100/40 dark:bg-accent-900/20 rounded-full filter blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </div>

        {/* Floating Decorative Cards */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[25%] left-[10%] hidden lg:block animate-float">
            <div className="bg-white/40 dark:bg-deep-800/40 backdrop-blur-xl w-32 h-40 rounded-xl transform rotate-12 flex flex-col p-4 gap-2 border border-white/60 dark:border-deep-700/60 shadow-lg">
              <div className="w-full h-2 bg-primary-600/10 rounded-full" />
              <div className="w-2/3 h-2 bg-primary-600/5 rounded-full" />
              <div className="w-full h-2 bg-primary-600/5 rounded-full mt-2" />
              <div className="w-full h-2 bg-primary-600/5 rounded-full" />
            </div>
          </div>
          <div className="absolute bottom-[20%] right-[8%] hidden lg:block animate-float" style={{ animationDelay: '4s' }}>
            <div className="bg-white/40 dark:bg-deep-800/40 backdrop-blur-xl w-28 h-28 rounded-2xl transform -rotate-12 flex items-center justify-center border border-white/60 dark:border-deep-700/60 shadow-lg">
              <span className="text-5xl text-primary-600/20 dark:text-primary-400/20">⚖️</span>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[960px] px-6 flex flex-col items-center text-center gap-10">
          <div className="flex flex-col gap-6 items-center">
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium leading-[0.95] tracking-tight text-primary-700 dark:text-primary-400 drop-shadow-sm">
              Un <span className="text-deep-900 dark:text-surface-100">avocat</span><br />
              <span className="italic text-primary-500 dark:text-primary-300">au bon moment</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-500 dark:text-surface-400 max-w-lg font-light leading-relaxed tracking-wide">
              Quand l'intelligence artificielle rencontre <br className="hidden sm:block" /> l'excellence juridique humaine.
            </p>
          </div>

          {/* Search Box - Glass Style */}
          <div className="w-full max-w-2xl mt-4 group">
            <form onSubmit={handleAISearch} className="relative block w-full">
              <div className="bg-white/70 dark:bg-deep-800/70 backdrop-blur-2xl rounded-2xl p-2.5 flex items-center gap-4 relative overflow-hidden border border-white/60 dark:border-deep-700/60 shadow-xl transition-all duration-400 focus-within:shadow-2xl focus-within:border-primary-300 dark:focus-within:border-primary-700 focus-within:bg-white/90 dark:focus-within:bg-deep-800/90 focus-within:scale-[1.01]">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer pointer-events-none" style={{ animationDuration: '3s', animationIterationCount: 'infinite' }} />
                
                <div className="pl-4 text-primary-500/60 dark:text-primary-400/60 flex items-center">
                  <Sparkles className="w-7 h-7" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une expertise juridique..."
                  className="w-full bg-transparent border-none text-gray-800 dark:text-surface-100 placeholder-stone-400 dark:placeholder-surface-500 focus:ring-0 text-lg md:text-xl py-4 font-light tracking-wide outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 text-white rounded-xl h-12 w-12 md:w-auto md:px-6 transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 md:hidden" />
                      <span className="hidden md:block font-bold text-sm tracking-wide">Rechercher</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Tags */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                { icon: '🏢', label: 'Fusions-Acquisitions', query: 'Fusions Acquisitions' },
                { icon: '💡', label: 'Propriété Intellectuelle', query: 'Propriété Intellectuelle' },
                { icon: '⚖️', label: 'Contentieux', query: 'Contentieux' },
              ].map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(tag.query)}`)}
                  className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-surface-400 hover:text-primary-700 dark:hover:text-primary-400 bg-white/40 dark:bg-deep-800/40 hover:bg-white/80 dark:hover:bg-deep-800/80 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-deep-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all shadow-sm"
                >
                  <span>{tag.icon}</span>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce opacity-40">
          <svg className="w-8 h-8 text-primary-700 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Ecosystem Features Section */}
      <section className="relative bg-white dark:bg-deep-900 py-24 md:py-32 border-t border-stone-100 dark:border-deep-800">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <span className="text-primary-700 dark:text-primary-400 text-sm font-bold tracking-widest uppercase mb-4 block">Notre Écosystème</span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-primary-700 dark:text-primary-400 mb-6 leading-tight">
              Comment Jurilab transforme<br />votre expérience juridique
            </h2>
            <p className="text-stone-500 dark:text-surface-400 text-lg font-light leading-relaxed">
              Une plateforme unifiée qui connecte les besoins juridiques complexes avec l'expertise la plus adaptée, propulsée par l'intelligence artificielle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {ecosystemFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-6 md:p-8 rounded-3xl bg-stone-50 dark:bg-deep-800 border border-stone-100 dark:border-deep-700 hover:border-primary-100 dark:hover:border-primary-800 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-500 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white dark:bg-deep-900 shadow-sm flex items-center justify-center text-primary-700 dark:text-primary-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <h3 className="font-serif text-lg md:text-xl text-deep-900 dark:text-surface-100 mb-3 font-medium">{feature.title}</h3>
                <p className="text-stone-500 dark:text-surface-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 md:mt-16 flex justify-center">
            <button
              onClick={() => navigate('/search')}
              className="group bg-primary-700 dark:bg-primary-600 text-white text-sm font-bold px-8 py-4 rounded-full hover:bg-primary-600 dark:hover:bg-primary-500 transition-all shadow-lg hover:shadow-primary-900/30 flex items-center gap-3"
            >
              Découvrir toutes les fonctionnalités
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 sm:py-24 bg-stone-50 dark:bg-deep-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs sm:text-sm font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 rounded-full uppercase tracking-widest">
              Domaines d'expertise
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-primary-700 dark:text-primary-400 mb-3 sm:mb-4">
              {t.hero.browseTitle}
            </h2>
            <p className="text-base sm:text-lg text-stone-500 dark:text-surface-400 max-w-2xl mx-auto px-4">
              {t.hero.browseSubtitle}
            </p>
          </div>

          {/* 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {Object.values(LegalSpecialty).slice(0, 8).map((specialty, index) => (
              <button
                key={specialty}
                onClick={() => navigate(`/search?specialty=${specialty}`)}
                className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-deep-800 border border-stone-100 dark:border-deep-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-700 text-left active:scale-[0.98]"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                  {specialtyIcons[specialty] || '⚖️'}
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-deep-900 dark:text-surface-100 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors mb-1 sm:mb-2 line-clamp-2">
                  {translateSpecialty(specialty)}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-stone-500 dark:text-surface-500">
                    120+ avocats
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-400 dark:text-surface-600 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/search')}
              className="w-full sm:w-auto"
            >
              Voir toutes les spécialités
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-700 to-primary-900 dark:from-primary-800 dark:to-primary-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white mb-4 sm:mb-6">
              Prêt à trouver l'avocat qu'il vous faut?
            </h2>
            <p className="text-base sm:text-xl text-primary-100 mb-8 sm:mb-10 leading-relaxed px-4">
              Rejoignez des milliers de clients satisfaits qui ont trouvé leur avocat idéal sur Jurilab.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <button
                onClick={() => navigate('/search')}
                className="bg-white text-primary-700 font-bold px-8 py-4 rounded-full hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Trouver un avocat
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/register-lawyer')}
                className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Je suis avocat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-50 dark:bg-deep-950 border-t border-stone-200 dark:border-deep-800 text-stone-600 dark:text-surface-400 py-16">
        <div className="max-w-[960px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="Jurilab" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl text-primary-700 dark:text-primary-400 tracking-tight">Jurilab</span>
              </div>
              <p className="text-sm font-light max-w-xs leading-relaxed opacity-80">
                Redéfinir l'accès au droit grâce au matching intelligent et des partenariats premium.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-primary-700 dark:text-primary-400 font-bold text-sm">Plateforme</h4>
              <button onClick={() => navigate('/register-lawyer')} className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors text-left">Pour les Avocats</button>
              <button onClick={() => navigate('/search')} className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors text-left">Pour les Clients</button>
              <button onClick={() => navigate('/search')} className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors text-left">Entreprise</button>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-primary-700 dark:text-primary-400 font-bold text-sm">Légal</h4>
              <a href="#" className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Politique de Confidentialité</a>
              <a href="#" className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Conditions Générales</a>
              <a href="#" className="text-sm hover:text-primary-700 dark:hover:text-primary-400 transition-colors">Conformité</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-stone-200 dark:border-deep-800">
            <p className="text-xs opacity-60">© {new Date().getFullYear()} Jurilab Inc. Tous droits réservés.</p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-full bg-stone-200 dark:bg-deep-800 flex items-center justify-center hover:bg-stone-300 dark:hover:bg-deep-700 transition-colors text-primary-700 dark:text-primary-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-stone-200 dark:bg-deep-800 flex items-center justify-center hover:bg-stone-300 dark:hover:bg-deep-700 transition-colors text-primary-700 dark:text-primary-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
