import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { LegalSpecialty } from '../types';
import { useApp } from '../store/store';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, translateSpecialty } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="flex flex-col bg-gradient-light dark:bg-gradient-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 subtle-pattern opacity-50"></div>
        <div className="container mx-auto px-4 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-brand-light/50 dark:bg-brand-dark/20 rounded-full border border-brand/20 dark:border-brand/10 animate-fade-in-up">
            <span className="text-brand-dark dark:text-brand font-semibold text-sm">
              ⚖️ Plateforme Juridique de Confiance
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-navy dark:text-white mb-6 animate-fade-in-up whitespace-pre-line" style={{ animationDelay: '0.1s' }}>
            {t.hero.title1}
            <span className="text-accent dark:text-accent-light">{t.hero.title2}</span>
            {t.hero.title3}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t.hero.subtitle}
          </p>

          <div className="max-w-3xl mx-auto bg-white/50 dark:bg-navy/30 backdrop-blur-sm p-3 sm:p-4 rounded-2xl border animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand" />
                <input
                  type="text"
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-white dark:bg-navy-dark border-2 border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto px-8 rounded-lg bg-navy dark:bg-brand text-white dark:text-navy-dark font-semibold hover:bg-navy-light dark:hover:bg-brand-light transition-colors shadow-subtle hover:shadow-subtle-lg">
                {t.hero.searchBtn}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-navy-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif">{t.hero.whyTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, ...t.hero.features.vetted },
              { icon: Clock, ...t.hero.features.time },
              { icon: Award, ...t.hero.features.rated },
            ].map((feature, i) => (
              <div key={i} className="p-8 text-center bg-slate-50 dark:bg-navy rounded-xl border transition-all duration-300 hover:shadow-subtle-lg hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-light/50 dark:bg-brand/10 text-brand-dark dark:text-brand rounded-full mb-6">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="py-24 bg-slate-100/50 dark:bg-navy/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-3">{t.hero.browseTitle}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">{t.hero.browseSubtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.values(LegalSpecialty).slice(0, 8).map((specialty) => (
              <div 
                key={specialty}
                onClick={() => navigate(`/search?specialty=${specialty}`)}
                className="group cursor-pointer p-6 bg-white dark:bg-navy rounded-xl shadow-subtle hover:shadow-subtle-xl hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="font-semibold text-lg text-navy dark:text-white group-hover:text-brand dark:group-hover:text-brand transition-colors">
                  {translateSpecialty(specialty)}
                </h3>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    120+ avocats
                  </span>
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};