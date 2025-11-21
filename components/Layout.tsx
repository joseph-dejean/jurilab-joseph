import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store/store';
import { UserRole } from '../types';
import { Button } from './Button';
import { User, Moon, Sun, Menu, X, LogOut, Calendar, MessageSquare } from 'lucide-react';
import { LegalChatbot } from './LegalChatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, darkMode, toggleDarkMode, language, setLanguage, t, unreadMessagesCount } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-dark text-slate-700 dark:text-slate-300">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-navy-dark/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-3xl font-bold text-navy dark:text-white">
              Jurilab
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/search" 
              className={`text-sm font-semibold transition-colors ${isActive('/search') ? 'text-brand-dark dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:text-brand-dark dark:hover:text-brand'}`}
            >
              {t.nav.search}
            </Link>
            {currentUser && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-sm font-semibold transition-colors ${isActive('/dashboard') ? 'text-brand-dark dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:text-brand-dark dark:hover:text-brand'}`}
                >
                  {t.nav.dashboard}
                </Link>
                <Link 
                  to="/messages" 
                  className={`text-sm font-semibold transition-colors flex items-center gap-2 relative ${isActive('/messages') ? 'text-brand-dark dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:text-brand-dark dark:hover:text-brand'}`}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t.dashboard.messages}
                  {unreadMessagesCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center absolute -top-1 -right-1">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {currentUser?.role === UserRole.ADMIN && (
               <Link 
               to="/admin" 
               className={`text-sm font-semibold transition-colors ${isActive('/admin') ? 'text-brand-dark dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:text-brand-dark dark:hover:text-brand'}`}
             >
               Admin
             </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-md text-sm font-semibold hover:bg-slate-100 dark:hover:bg-navy transition-colors"
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-navy text-slate-600 dark:text-slate-300"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-4 ml-4">
                 <Button variant="outline" size="sm" onClick={logout} className="hover:border-red-500/50 hover:bg-red-500/5 dark:hover:bg-red-500/10">
                   <LogOut className="h-4 w-4 mr-2" /> {t.nav.signout}
                 </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                 <Link to="/login">
                    <Button variant="ghost" size="sm" className="font-semibold">{t.nav.login}</Button>
                 </Link>
                 <Link to="/login?register=true">
                    <Button size="sm" className="bg-navy dark:bg-brand text-white dark:text-navy-dark font-semibold hover:bg-navy-light dark:hover:bg-brand-light transition-colors">{t.nav.signup}</Button>
                 </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button 
              className="p-2 text-slate-600 dark:text-slate-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      {/* Legal Chatbot Overlay */}
      <LegalChatbot />

      <footer className="bg-slate-100 dark:bg-navy-dark border-t">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-serif text-2xl font-bold text-navy dark:text-white mb-4">Jurilab</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {language === 'fr' 
                  ? "Votre partenaire de confiance pour tous vos besoins juridiques."
                  : "Connecting you with the legal help you deserve."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-navy dark:text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand">Droit Pénal</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand">Droit de la Famille</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand">Droit des Affaires</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy dark:text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand">À Propos</a></li>
                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-brand-dark dark:hover:text-brand">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy dark:text-white mb-4">{language === 'fr' ? 'Pour les Avocats' : 'For Lawyers'}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register-lawyer" className="text-brand-dark dark:text-brand font-semibold hover:underline">Inscription Avocat</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <p>&copy; 2025 Jurilab. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-brand-dark dark:hover:text-brand">Mentions Légales</a>
              <a href="#" className="hover:text-brand-dark dark:hover:text-brand">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};