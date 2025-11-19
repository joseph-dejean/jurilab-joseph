import React, { useState } from 'react';
import { useApp } from '../store/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole } from '../types';
import { Button } from '../components/Button';

export const LoginPage: React.FC = () => {
  const { login, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('register') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email, role);
      navigate('/dashboard');
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
             </div>
          )}

          <Button type="submit" className="w-full !mt-8" size="lg">
            {isRegister ? t.auth.create : t.auth.signIn}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {isRegister ? t.auth.haveAccount : t.auth.dontHaveAccount}
          <button 
            onClick={() => navigate(isRegister ? '/login' : '/login?register=true')}
            className="ml-1 text-brand-dark dark:text-brand font-semibold hover:underline"
          >
            {isRegister ? t.nav.login : t.nav.signup}
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-navy-dark text-slate-500">OU</span>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={() => navigate('/register-lawyer')}
            className="text-sm font-semibold text-brand-dark dark:text-brand hover:underline"
          >
            Inscrivez-vous en tant qu'avocat →
          </button>
        </div>
      </div>
    </div>
  );
};