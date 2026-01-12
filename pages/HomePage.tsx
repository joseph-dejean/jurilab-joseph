import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Clock, Award, ArrowRight, Star, Users, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { LegalSpecialty } from '../types';
import { useApp } from '../store/store';
import { analyzeLegalCase } from '../services/geminiService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, translateSpecialty } = useApp();
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

  const stats = [
    { value: '500+', label: 'Avocats vérifiés', icon: Users },
    { value: '98%', label: 'Clients satisfaits', icon: Star },
    { value: '24h', label: 'Réponse moyenne', icon: Clock },
    { value: '15+', label: 'Spécialités', icon: Award },
  ];

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

  return (
    <div className="flex flex-col">
      {/* Hidden admin access zone (7 taps in <2s) */}
      <button
        type="button"
        aria-label="admin"
        onClick={() => setAdminTapCount((c) => c + 1)}
        className="fixed bottom-2 left-2 w-10 h-10 opacity-0 z-[60]"
      />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden px-4 sm:px-0">
        {/* Background Elements */}
        <div className="absolute inset-0 hero-gradient dark:hero-gradient-dark" />
        <div className="absolute inset-0 pattern-dots dark:pattern-dots-dark opacity-40" />

        {/* Floating decorative elements - Hidden on mobile for performance */}
        <div className="hidden sm:block absolute top-20 right-[15%] w-64 h-64 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl animate-float" />
        <div className="hidden sm:block absolute bottom-20 left-[10%] w-48 h-48 bg-accent-200/30 dark:bg-accent-800/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1
              className="text-3xl sm:text-4xl md:text-display-md lg:text-display-lg font-serif text-deep-900 dark:text-surface-100 mb-4 sm:mb-6 opacity-0 animate-fade-in-up delay-100 leading-tight"
            >
              {t.hero.title1}
              <span className="text-gradient">{t.hero.title2}</span>
              {t.hero.title3}
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg md:text-xl text-deep-600 dark:text-surface-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up delay-200 px-2"
            >
              {t.hero.subtitle}
            </p>

            {/* Search Box */}
            <div
              className="max-w-2xl mx-auto opacity-0 animate-fade-in-up delay-300"
            >
              <form onSubmit={handleAISearch} className="relative">
                <div className="glass rounded-2xl p-2 shadow-glass-lg">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-grow">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                      <input
                        type="text"
                        placeholder={t.hero.searchPlaceholder}
                        className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl bg-white dark:bg-deep-900 border-2 border-transparent focus:border-primary-500 focus:ring-0 outline-none text-base transition-colors duration-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto px-6 sm:px-8 rounded-xl shadow-glow"
                      isLoading={isSearching}
                      disabled={isSearching}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Recherche IA
                    </Button>
                  </div>
                </div>
              </form>

              {/* Quick tags - Horizontal scroll on mobile */}
              <div className="flex items-center gap-2 mt-4 sm:mt-6 overflow-x-auto no-scrollbar pb-2 sm:justify-center sm:flex-wrap">
                <span className="text-sm text-deep-500 dark:text-surface-500 flex-shrink-0">Populaires:</span>
                {['Divorce', 'Immobilier', 'Pénal', 'Travail'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/search?q=${tag}`)}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-deep-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 rounded-lg transition-colors duration-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-white dark:fill-deep-900"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 sm:py-8 bg-white dark:bg-deep-900 relative -mt-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Horizontal scroll on mobile, grid on larger screens */}
          <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[200px] sm:w-auto text-center p-4 sm:p-6 rounded-2xl bg-surface-50 dark:bg-deep-800 border border-surface-100 dark:border-deep-700 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-3 sm:mb-4">
                  <stat.icon className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-deep-900 dark:text-surface-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-deep-500 dark:text-surface-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-deep-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 rounded-full">
              Comment ça marche
            </span>
            <h2 className="text-2xl sm:text-display-sm md:text-display-md font-serif text-deep-900 dark:text-surface-100 mb-4">
              Trouvez votre avocat en 3 étapes
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-6 md:gap-8 relative">
            {/* Connection line - Hidden on mobile */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-900 dark:via-primary-700 dark:to-primary-900" />

            {[
              {
                step: '01',
                title: 'Décrivez votre besoin',
                description: 'Utilisez notre recherche intelligente ou notre assistant IA pour décrire votre situation juridique.',
                icon: Search,
              },
              {
                step: '02',
                title: 'Comparez les profils',
                description: 'Consultez les profils détaillés, avis clients et tarifs des avocats correspondant à vos critères.',
                icon: Users,
              },
              {
                step: '03',
                title: 'Prenez rendez-vous',
                description: 'Réservez directement en ligne votre consultation vidéo, téléphone ou en cabinet.',
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="relative z-10 inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 sm:mb-6 shadow-glow">
                  <item.icon className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 text-5xl sm:text-6xl font-bold text-surface-100 dark:text-deep-800 -z-10">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-deep-900 dark:text-surface-100 mb-2 sm:mb-3">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-deep-600 dark:text-surface-400 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-16">
            <Button
              variant="primary"
              size="xl"
              onClick={() => navigate('/search')}
              className="w-full sm:w-auto shadow-glow"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-surface-50 dark:bg-deep-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 rounded-full">
              Pourquoi nous choisir
            </span>
            <h2 className="text-2xl sm:text-display-sm md:text-display-md font-serif text-deep-900 dark:text-surface-100 mb-3 sm:mb-4">
              {t.hero.whyTitle}
            </h2>
            <p className="text-base sm:text-lg text-deep-600 dark:text-surface-400 max-w-2xl mx-auto px-4">
              Une plateforme conçue pour simplifier votre recherche juridique
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Shield,
                color: 'primary',
                ...t.hero.features.vetted
              },
              {
                icon: Clock,
                color: 'accent',
                ...t.hero.features.time
              },
              {
                icon: Award,
                color: 'primary',
                ...t.hero.features.rated
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-deep-800 border border-surface-100 dark:border-deep-700 transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 active:scale-[0.98]"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={`relative inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 ${feature.color === 'accent'
                  ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  }`}>
                  <feature.icon className="w-6 sm:w-8 h-6 sm:h-8" />
                </div>

                <h3 className="relative text-lg sm:text-xl font-bold text-deep-900 dark:text-surface-100 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="relative text-sm sm:text-base text-deep-600 dark:text-surface-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-deep-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 rounded-full">
              Domaines d'expertise
            </span>
            <h2 className="text-2xl sm:text-display-sm md:text-display-md font-serif text-deep-900 dark:text-surface-100 mb-3 sm:mb-4">
              {t.hero.browseTitle}
            </h2>
            <p className="text-base sm:text-lg text-deep-600 dark:text-surface-400 max-w-2xl mx-auto px-4">
              {t.hero.browseSubtitle}
            </p>
          </div>

          {/* 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {Object.values(LegalSpecialty).slice(0, 8).map((specialty, index) => (
              <button
                key={specialty}
                onClick={() => navigate(`/search?specialty=${specialty}`)}
                className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-surface-50 dark:bg-deep-900 border border-surface-100 dark:border-deep-800 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800 text-left active:scale-[0.98]"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                  {specialtyIcons[specialty] || '⚖️'}
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-deep-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1 sm:mb-2 line-clamp-2">
                  {translateSpecialty(specialty)}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-deep-500 dark:text-surface-500">
                    120+ avocats
                  </span>
                  <ArrowRight className="w-4 h-4 text-deep-400 dark:text-surface-600 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
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
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-display-sm md:text-display-md font-serif text-white mb-4 sm:mb-6">
              Prêt à trouver l'avocat qu'il vous faut?
            </h2>
            <p className="text-base sm:text-xl text-primary-100 mb-8 sm:mb-10 leading-relaxed px-4">
              Rejoignez des milliers de clients satisfaits qui ont trouvé leur avocat idéal sur Jurilab.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button
                variant="accent"
                size="xl"
                onClick={() => navigate('/search')}
                className="w-full sm:w-auto"
              >
                Trouver un avocat
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="xl"
                onClick={() => navigate('/register-lawyer')}
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              >
                Je suis avocat
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
