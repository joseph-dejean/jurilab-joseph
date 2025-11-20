import React, { useState } from 'react';
import { useApp } from '../store/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { getAuthErrorMessage } from '../services/firebaseService';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login, loginGoogle, register, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('register') === 'true';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (isRegister && !name) {
        alert("Veuillez entrer votre nom.");
        return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        if (role === UserRole.LAWYER) {
           navigate('/register-lawyer');
           return;
        }
        await register(email, password, role, name);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      alert("Erreur: " + getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        // Pass the currently selected role. If user exists, this is ignored.
        // If user is new, this role is used to create the profile.
        await loginGoogle(role);
        navigate('/dashboard');
    } catch (error: any) {
        console.error(error);
        // auth/popup-closed-by-user is common, we can ignore or show a small toast
        if (error.code !== 'auth/popup-closed-by-user') {
             alert("Erreur Google: " + getAuthErrorMessage(error));
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-100/50 dark:bg-navy/50 p-4">
      <div className="bg-white dark:bg-navy-dark p-8 rounded-xl shadow-subtle-lg border w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-navy dark:text-white mb-2">
            {isRegister ? t.auth.create : t.auth.welcome}
          </h1>
          <p className="text-slate-500">
            {isRegister ? t.auth.registerSubtitle : t.auth.loginSubtitle}
          </p>
        </div>

        <div className="space-y-6">
            {/* Role Selection - Moved up so it applies to Google Sign In too for new users */}
            {isRegister && (
             <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.auth.iam}</label>
              <div className="grid grid-cols-2 gap-3">
                 <button
                   type="button"
                   onClick={() => setRole(UserRole.CLIENT)}
                   className={`py-3 rounded-lg border text-sm font-semibold transition-colors ${role === UserRole.CLIENT ? 'bg-brand-light/50 dark:bg-brand/10 border-brand/50 text-brand-dark dark:text-brand' : 'bg-slate-50 dark:bg-navy hover:bg-slate-100 dark:hover:bg-navy-light'}`}
                 >
                   {t.auth.client}
                 </button>
                 <button
                   type="button"
                   onClick={() => setRole(UserRole.LAWYER)}
                   className={`py-3 rounded-lg border text-sm font-semibold transition-colors ${role === UserRole.LAWYER ? 'bg-brand-light/50 dark:bg-brand/10 border-brand/50 text-brand-dark dark:text-brand' : 'bg-slate-50 dark:bg-navy hover:bg-slate-100 dark:hover:bg-navy-light'}`}
                 >
                   {t.auth.lawyer}
                 </button>
              </div>
              {role === UserRole.LAWYER && isRegister && (
                  <p className="text-xs text-amber-600 mt-2">
                      Note: Pour les avocats, l'inscription complète via le formulaire dédié est recommandée.
                  </p>
              )}
             </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && role === UserRole.CLIENT && (
                <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nom complet</label>
                <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 rounded-lg border focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-navy"
                    placeholder="Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                </div>
            )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.auth.email}</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-lg border focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-navy"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t.auth.password}</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-lg border focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none bg-white dark:bg-navy"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

            <Button type="submit" className="w-full !mt-2" size="lg" disabled={isLoading}>
                {isLoading ? 'Chargement...' : (isRegister ? t.auth.create : t.auth.signIn)}
          </Button>
        </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-navy-dark text-slate-500">OU</span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-navy"
            >
                <GoogleIcon />
                {t.auth.google}
            </button>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isRegister ? t.auth.haveAccount : t.auth.dontHaveAccount}
          <button 
            onClick={() => navigate(isRegister ? '/login' : '/login?register=true')}
            className="ml-1 text-brand-dark dark:text-brand font-semibold hover:underline"
          >
            {isRegister ? t.nav.login : t.nav.signup}
          </button>
          </div>
        </div>
        
        {!isRegister && (
             <div className="text-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate('/register-lawyer')}
            className="text-sm font-semibold text-brand-dark dark:text-brand hover:underline"
          >
            Inscrivez-vous en tant qu'avocat →
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
