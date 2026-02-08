import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store/store';
import { UserRole } from '../types';
import { Button } from './Button';
import { User, Moon, Sun, Menu, X, LogOut, Calendar, MessageSquare, ChevronRight, Home, Search, LayoutDashboard, Lock, Briefcase, Palette, Settings } from 'lucide-react';
import { LegalChatbot } from './LegalChatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, darkMode, toggleDarkMode, language, setLanguage, t, unreadMessagesCount } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isSearchPage = location.pathname === '/search';

  // Auto-hide navbar logic
  const showNav = () => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = null;
    }
    setIsNavVisible(true);
  };

  const hideNavDelayed = () => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
    }
    navTimeoutRef.current = setTimeout(() => {
      setIsNavVisible(false);
    }, 1500); // Hide after 1.5 seconds
  };

  // Show nav when mouse is near the top of the screen
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        showNav();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Start auto-hide after initial load and cleanup timeout on unmount
  useEffect(() => {
    // Start with nav visible, then begin auto-hide after 3 seconds
    const initialTimeout = setTimeout(() => {
      hideNavDelayed();
    }, 3000);
    
    return () => {
      clearTimeout(initialTimeout);
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  // Track scroll position for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const navLinks = [
    { path: '/search', label: t.nav.search, showAlways: true },
    { path: '/dashboard', label: t.nav.dashboard, requiresAuth: true },
    { path: '/calendar', label: 'Calendrier', requiresRole: UserRole.LAWYER, icon: Calendar },
    { path: '/messages', label: t.dashboard.messages, requiresAuth: true, hasNotification: true },
    { path: '/portfolio', label: t.dashboard.portfolio, requiresRole: UserRole.LAWYER },
    { path: '/lawyer/profile-editor', label: 'Éditeur Profil', requiresRole: UserRole.LAWYER, icon: Palette },
    { path: '/admin', label: 'Admin', requiresRole: UserRole.ADMIN },
  ];

  // Mobile bottom navigation items
  const mobileNavItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/search', icon: Search, label: 'Recherche' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', requiresAuth: true },
    { path: '/calendar', icon: Calendar, label: 'Calendrier', requiresRole: UserRole.LAWYER },
    { path: '/messages', icon: MessageSquare, label: 'Messages', requiresAuth: true, hasBadge: unreadMessagesCount > 0 },
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-surface-50 dark:bg-deep-950 text-deep-800 dark:text-surface-200">
      {/* Invisible hover zone at top to trigger nav appearance - like Windows taskbar */}
      <div 
        className="fixed top-0 left-0 right-0 h-3 z-[60]"
        onMouseEnter={showNav}
        aria-hidden="true"
      />
      
      {/* Header - Collapsible nav bar that pushes content (like Windows taskbar auto-hide) */}
      <div 
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${
          isNavVisible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
        onMouseEnter={showNav}
        onMouseLeave={hideNavDelayed}
      >
        <nav className="flex justify-center px-4 py-4 w-full">
        <div className="bg-primary-700 dark:bg-primary-800 rounded-full px-2 py-2 pl-5 flex items-center gap-4 xl:gap-8 pointer-events-auto transition-all duration-500 hover:scale-[1.01] shadow-xl shadow-primary-900/20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <img
                src="/logo.png"
                alt="Jurilab"
                className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block text-white">
              Jurilab
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              if (link.requiresAuth && !currentUser) return null;
              if (link.requiresRole && currentUser?.role !== link.requiresRole) return null;
              if (!link.showAlways && !link.requiresAuth && !currentUser) return null;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-3 xl:px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-white bg-white/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.path === '/messages' && <MessageSquare className="w-4 h-4 inline-block mr-1.5" />}
                  {link.label}
                  {link.hasNotification && unreadMessagesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 ml-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 text-sm font-semibold text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors duration-200"
            >
              {language === 'en' ? 'FR' : 'EN'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-white hidden xl:block">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-full transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">{t.nav.signout}</span>
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="bg-white text-primary-700 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-white/90 transition-all active:scale-95 shadow-md">
                  {t.nav.login}
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-1">
            {/* Theme Toggle - Mobile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-deep-950/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          {/* Mobile Menu Panel */}
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-deep-950 shadow-glass-lg animate-fade-in-right safe-area-top"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-deep-800">
              <span className="font-serif text-xl font-bold text-deep-900 dark:text-surface-100">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-deep-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Info (if logged in) */}
            {currentUser && (
              <div className="p-4 border-b border-surface-100 dark:border-deep-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-semibold">
                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-deep-900 dark:text-surface-100">{currentUser.name}</p>
                    <p className="text-sm text-deep-500 dark:text-surface-500 capitalize">
                      {currentUser.role === UserRole.LAWYER ? 'Avocat' : 'Client'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {navLinks.map((link) => {
                if (link.requiresAuth && !currentUser) return null;
                if (link.requiresRole && currentUser?.role !== link.requiresRole) return null;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors touch-target ${isActive(link.path)
                      ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
                      : 'text-deep-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-deep-900 active:bg-surface-200 dark:active:bg-deep-800'
                      }`}
                  >
                    <div className="flex items-center gap-3 font-medium">
                      {link.path === '/messages' && <MessageSquare className="w-5 h-5" />}
                      {link.path === '/search' && <Search className="w-5 h-5" />}
                      {link.path === '/dashboard' && <LayoutDashboard className="w-5 h-5" />}
                      <span>{link.label}</span>
                      {link.hasNotification && unreadMessagesCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="my-4 border-t border-surface-200 dark:border-deep-800" />

              {/* Settings */}
              <div className="space-y-3 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-deep-500 dark:text-surface-500">Langue</span>
                  <button
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-surface-100 dark:bg-deep-900"
                  >
                    {language === 'en' ? 'Français' : 'English'}
                  </button>
                </div>
              </div>

              {/* Auth Actions */}
              <div className="mt-6 px-4 space-y-2">
                {currentUser ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.nav.signout}
                  </Button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button variant="secondary" className="w-full">
                        {t.nav.login}
                      </Button>
                    </Link>
                    <Link to="/login?register=true" onClick={() => setIsMobileMenuOpen(false)} className="block">
                      <Button variant="primary" className="w-full">
                        {t.nav.signup}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - no top padding, nav floats on top like macOS */}
      <main className={`flex-grow ${isSearchPage ? '' : 'pb-16 lg:pb-0'}`}>
        {children}
      </main>

      {/* Legal Chatbot - Hidden on search page */}
      {!isSearchPage && <LegalChatbot />}

      {/* Mobile Bottom Navigation - Hidden on search page */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-deep-950/90 backdrop-blur-xl border-t border-surface-200 dark:border-deep-800 safe-area-bottom ${isSearchPage ? 'hidden' : ''}`}>
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => {
            if (item.requiresAuth && !currentUser) return null;
            if (item.requiresRole && currentUser?.role !== item.requiresRole) return null;

            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-deep-500 dark:text-surface-500'
                  }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                  {item.hasBadge && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full" aria-hidden="true" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Hidden on mobile and on search page for cleaner experience */}
      <footer className={`hidden lg:block bg-deep-900 dark:bg-deep-950 text-surface-300 border-t border-deep-800 ${isSearchPage ? 'lg:hidden' : ''}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Tiny admin shortcut (bottom-left) */}
          <Link
            to="/admin"
            aria-label="Admin"
            className="absolute left-4 bottom-4 text-surface-500/60 hover:text-surface-200 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </Link>
          {/* Main Footer */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <img
                  src="/logo.png"
                  alt="Jurilab Logo"
                  className="w-16 h-16 object-contain"
                />
                <span className="font-serif text-2xl font-bold text-white">
                  Jurilab
                </span>
              </Link>
              <p className="text-surface-400 text-sm leading-relaxed mb-6">
                {language === 'fr'
                  ? "Votre partenaire de confiance pour tous vos besoins juridiques. Trouvez l'avocat idéal en quelques clics."
                  : "Your trusted partner for all your legal needs. Find the perfect lawyer in just a few clicks."}
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-deep-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-deep-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-deep-800 hover:bg-primary-600 flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>

            {/* Services Column */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Services</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Droit Pénal</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Droit de la Famille</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Droit des Affaires</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Droit Immobilier</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Droit du Travail</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">
                {language === 'fr' ? 'Entreprise' : 'Company'}
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">À Propos</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Contact</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Carrières</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Presse</a></li>
              </ul>
            </div>

            {/* For Lawyers Column */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">
                {language === 'fr' ? 'Pour les Avocats' : 'For Lawyers'}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/register-lawyer" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-sm font-medium">
                    Inscription Avocat
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Tarifs</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">Ressources</a></li>
                <li><a href="#" className="text-surface-400 hover:text-primary-400 transition-colors text-sm">FAQ</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="py-6 border-t border-deep-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-surface-500 text-sm">
              &copy; {new Date().getFullYear()} Jurilab. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-surface-500 hover:text-surface-300 transition-colors">
                Mentions Légales
              </a>
              <a href="#" className="text-surface-500 hover:text-surface-300 transition-colors">
                Politique de Confidentialité
              </a>
              <a href="#" className="text-surface-500 hover:text-surface-300 transition-colors">
                CGU
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
