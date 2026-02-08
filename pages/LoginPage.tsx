import React, { useState, useEffect } from 'react';
import { useApp } from '../store/store';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { getAuthErrorMessage } from '../services/firebaseService';
import {
  Mail, Lock, User, ArrowRight, Scale, Sparkles, ChevronLeft,
  Eye, EyeOff, CheckCircle2, AlertCircle, UserCircle, Briefcase,
  Loader2
} from 'lucide-react';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

type AuthMode = 'signin' | 'signup-choice' | 'signup-client';
type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export const LoginPage: React.FC = () => {
  const { login, loginGoogle, loginMicrosoft, register, t, currentUser, isAuthLoading } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerParam = searchParams.get('register') === 'true';

  // Auth mode: signin, signup-choice (choose role), signup-client (client form)
  const [authMode, setAuthMode] = useState<AuthMode>(registerParam ? 'signup-choice' : 'signin');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      // Check if profile is complete
      if (currentUser.profileCompleted === false) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isAuthLoading, navigate]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (authMode === 'signup-client' && password.length < 8) {
      newErrors.password = 'Minimum 8 caractères requis';
    }

    if (authMode === 'signup-client') {
      if (!name.trim()) {
        newErrors.name = 'Le nom est requis';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setAuthStatus('loading');
    setErrors({});

    try {
      if (authMode === 'signup-client') {
        await register(email, password, UserRole.CLIENT, name);
        setSuccessMessage('Compte créé avec succès !');
        setAuthStatus('success');
        // Small delay to show success message before redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        await login(email, password);
        setSuccessMessage('Connexion réussie !');
        setAuthStatus('success');
        // Small delay to show success message before redirect
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      }
    } catch (error: any) {
      console.error(error);
      setAuthStatus('error');
      setErrors({ form: getAuthErrorMessage(error) });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthStatus('loading');
    setErrors({});

    try {
      const { isNewUser } = await loginGoogle(UserRole.CLIENT);
      setSuccessMessage(isNewUser ? 'Bienvenue sur Jurilab !' : 'Connexion réussie !');
      setAuthStatus('success');
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        if (isNewUser) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (error: any) {
      console.error(error);
      setAuthStatus('error');
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrors({ form: getAuthErrorMessage(error) });
      }
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setAuthStatus('loading');
    setErrors({});

    try {
      const { isNewUser } = await loginMicrosoft(UserRole.CLIENT);
      setSuccessMessage(isNewUser ? 'Bienvenue sur Jurilab !' : 'Connexion réussie !');
      setAuthStatus('success');
      
      // Small delay to show success message before redirect
      setTimeout(() => {
        if (isNewUser) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (error: any) {
      console.error(error);
      setAuthStatus('error');
      if (error.code !== 'auth/popup-closed-by-user') {
        setErrors({ form: getAuthErrorMessage(error) });
      }
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const switchToSignIn = () => {
    clearForm();
    setAuthMode('signin');
  };

  const switchToSignUp = () => {
    clearForm();
    setAuthMode('signup-choice');
  };

  // Render role choice for signup
  const renderSignUpChoice = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-deep-900 dark:text-surface-100 mb-2">
          Choisissez votre profil
        </h2>
        <p className="text-deep-600 dark:text-surface-400">
          Comment souhaitez-vous utiliser Jurilab ?
        </p>
      </div>

      {/* Client Option */}
      <button
        onClick={() => setAuthMode('signup-client')}
        className="w-full group relative overflow-hidden rounded-2xl border-2 border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 p-6 text-left transition-all duration-300 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-950/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserCircle className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-deep-900 dark:text-surface-100 mb-1 flex items-center gap-2">
              Je suis un Client
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-deep-600 dark:text-surface-400">
              Recherchez des avocats, prenez rendez-vous et gérez vos consultations juridiques
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Inscription gratuite
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Accès immédiat
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Lawyer Option */}
      <button
        onClick={() => navigate('/register-lawyer')}
        className="w-full group relative overflow-hidden rounded-2xl border-2 border-surface-200 dark:border-deep-700 bg-white dark:bg-deep-900 p-6 text-left transition-all duration-300 hover:border-accent-400 dark:hover:border-accent-500 hover:shadow-lg"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900/30 dark:to-accent-950/20 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900/50 dark:to-accent-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Scale className="w-7 h-7 text-accent-600 dark:text-accent-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-deep-900 dark:text-surface-100 mb-1 flex items-center gap-2">
              Je suis un Avocat
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-deep-600 dark:text-surface-400">
              Créez votre profil professionnel, gérez vos disponibilités et développez votre clientèle
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                Profil vérifié
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-full">
                <Briefcase className="w-3 h-3" />
                Formulaire dédié
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Back to Sign In */}
      <p className="text-center text-sm text-deep-600 dark:text-surface-400 pt-4">
        Déjà un compte ?{' '}
        <button
          onClick={switchToSignIn}
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
        >
          Se connecter
        </button>
      </p>
    </div>
  );

  // Render sign in or client sign up form
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Form Error */}
      {errors.form && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{errors.form}</p>
        </div>
      )}

      {/* Name (only for signup) */}
      {authMode === 'signup-client' && (
        <div>
          <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
            <input
              type="text"
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.name
                ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                : 'border-surface-200 dark:border-deep-700 focus:border-primary-500 dark:focus:border-primary-400'
                } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              style={{ fontSize: '16px' }}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.name}
            </p>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          {t.auth.email}
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <input
            type="email"
            className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.email
              ? 'border-red-300 dark:border-red-800 focus:border-red-500'
              : 'border-surface-200 dark:border-deep-700 focus:border-primary-500 dark:focus:border-primary-400'
              } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
            placeholder="nom@exemple.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            style={{ fontSize: '16px' }}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          {t.auth.password}
          {authMode === 'signup-client' && (
            <span className="font-normal text-deep-500 dark:text-surface-500 ml-1">(min. 8 caractères)</span>
          )}
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.password
              ? 'border-red-300 dark:border-red-800 focus:border-red-500'
              : 'border-surface-200 dark:border-deep-700 focus:border-primary-500 dark:focus:border-primary-400'
              } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            style={{ fontSize: '16px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400 dark:text-surface-500 hover:text-deep-600 dark:hover:text-surface-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password (only for signup) */}
      {authMode === 'signup-client' && (
        <div>
          <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.confirmPassword
                ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                : 'border-surface-200 dark:border-deep-700 focus:border-primary-500 dark:focus:border-primary-400'
                } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400 dark:text-surface-500 hover:text-deep-600 dark:hover:text-surface-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isLoading}
      >
        {authMode === 'signup-client' ? 'Créer mon compte' : t.auth.signIn}
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </form>
  );

  // Success Overlay Component
  const SuccessOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-deep-950/95 backdrop-blur-sm animate-fadeIn">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-50" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-12 h-12 text-white animate-scaleIn" />
          </div>
        </div>
        <h2 className="text-2xl font-serif font-bold text-deep-900 dark:text-surface-100 mb-2">
          {successMessage}
        </h2>
        <p className="text-deep-500 dark:text-surface-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirection en cours...
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row">
      {/* Success Overlay */}
      {authStatus === 'success' && <SuccessOverlay />}

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-surface-50 dark:bg-deep-950 safe-area-bottom">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => {
              if (authMode === 'signup-client') {
                setAuthMode('signup-choice');
              } else if (authMode === 'signup-choice') {
                setAuthMode('signin');
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 text-deep-500 hover:text-deep-700 dark:hover:text-surface-300 mb-6 -ml-1 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {authMode === 'signup-client' ? 'Retour au choix' : authMode === 'signup-choice' ? 'Retour à la connexion' : 'Retour'}
          </button>

          {/* Logo and Title */}
          <div className="text-center mb-8 sm:mb-10">
            <Link to="/" className="inline-flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <img
                src="/logo.png"
                alt="Jurilab Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
              <span className="font-serif text-xl sm:text-2xl font-bold text-deep-900 dark:text-surface-100">
                Jurilab
              </span>
            </Link>

            {authMode === 'signin' && (
              <>
                <h1 className="text-2xl sm:text-display-sm font-serif text-deep-900 dark:text-surface-100 mb-2">
                  {t.auth.welcome}
                </h1>
                <p className="text-sm sm:text-base text-deep-600 dark:text-surface-400">
                  {t.auth.loginSubtitle}
                </p>
              </>
            )}

            {authMode === 'signup-client' && (
              <>
                <h1 className="text-2xl sm:text-display-sm font-serif text-deep-900 dark:text-surface-100 mb-2">
                  Créer un compte Client
                </h1>
                <p className="text-sm sm:text-base text-deep-600 dark:text-surface-400">
                  Rejoignez des milliers de clients qui trouvent leur avocat sur Jurilab
                </p>
              </>
            )}
          </div>

          {/* Form Card */}
          <div className="glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-glass-lg">
            {authMode === 'signup-choice' ? renderSignUpChoice() : (
              <>
                {renderForm()}

                {/* Divider */}
                <div className="relative my-5 sm:my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-surface-200 dark:border-deep-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white/70 dark:bg-deep-900/70 text-sm text-deep-500 dark:text-surface-500">
                      OU
                    </span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-deep-900 border-2 border-surface-200 dark:border-deep-700 rounded-xl hover:bg-surface-50 dark:hover:bg-deep-800 hover:border-surface-300 dark:hover:border-deep-600 transition-all duration-200 font-medium text-deep-700 dark:text-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  {authMode === 'signup-client' ? 'S\'inscrire avec Google' : t.auth.google}
                </button>

                {/* Microsoft Login */}
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={isLoading}
                  className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-deep-900 border-2 border-surface-200 dark:border-deep-700 rounded-xl hover:bg-surface-50 dark:hover:bg-deep-800 hover:border-surface-300 dark:hover:border-deep-600 transition-all duration-200 font-medium text-deep-700 dark:text-surface-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  {authMode === 'signup-client' ? 'S\'inscrire avec Microsoft' : 'Continuer avec Microsoft'}
                </button>

                {/* Switch between login/register */}
                <p className="text-center text-sm text-deep-600 dark:text-surface-400 mt-5 sm:mt-6">
                  {authMode === 'signup-client' ? t.auth.haveAccount : t.auth.dontHaveAccount}
                  <button
                    onClick={authMode === 'signup-client' ? switchToSignIn : switchToSignUp}
                    className="ml-1 text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  >
                    {authMode === 'signup-client' ? t.nav.login : t.nav.signup}
                  </button>
                </p>
              </>
            )}
          </div>

          {/* Lawyer registration link (only on sign in) */}
          {authMode === 'signin' && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={() => navigate('/register-lawyer')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:underline group"
              >
                <Scale className="w-4 h-4" />
                Vous êtes avocat ? Inscrivez-vous ici
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-deep-950">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        {/* Decorative shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-48 h-48 bg-accent-400/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-md">
            <div className="w-32 h-32 flex items-center justify-center mx-auto mb-8 p-4">
              <img src="/logo.png" alt="Jurilab Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              L'excellence juridique à portée de main
            </h2>
            <p className="text-primary-100 text-lg leading-relaxed mb-8">
              Rejoignez une communauté de milliers d'utilisateurs qui font confiance à Jurilab pour leurs besoins juridiques.
            </p>

            {/* Features */}
            <div className="grid gap-4 text-left mb-8">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Avocats vérifiés</p>
                  <p className="text-primary-200 text-xs">Profils validés par notre équipe</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Réservation en ligne</p>
                  <p className="text-primary-200 text-xs">Prenez RDV 24h/24, 7j/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Tarifs transparents</p>
                  <p className="text-primary-200 text-xs">Pas de mauvaises surprises</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left">
              <p className="text-white/90 italic mb-4">
                "Grâce à Jurilab, j'ai trouvé un avocat compétent en moins de 24h. Le processus était simple et transparent."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                  MD
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Marie Dubois</p>
                  <p className="text-primary-200 text-xs">Paris, France</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
