import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/store';
import { UserRole, LegalSpecialty } from '../types';
import { Button } from '../components/Button';
import { updateUserProfile } from '../services/firebaseService';
import {
  User, Phone, MapPin, Check, ArrowRight, Sparkles,
  AlertCircle, Scale, UserCircle, ChevronRight, Heart
} from 'lucide-react';

const POPULAR_CITIES = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice',
  'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'
];

export const ProfileCompletionPage: React.FC = () => {
  const { currentUser, translateSpecialty, isAuthLoading } = useApp();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [preferredSpecialties, setPreferredSpecialties] = useState<LegalSpecialty[]>([]);

  // Redirect if not logged in or profile already completed
  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser) {
        navigate('/login');
      } else if (currentUser.profileCompleted) {
        navigate('/dashboard');
      } else {
        // Pre-fill name if available
        setName(currentUser.name || '');
      }
    }
  }, [currentUser, isAuthLoading, navigate]);

  const toggleSpecialty = (specialty: LegalSpecialty) => {
    setPreferredSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!name.trim()) {
        newErrors.name = 'Veuillez entrer votre nom';
      }
    }

    if (stepNum === 2) {
      // Phone is optional but validate format if provided
      if (phone && !/^[\d\s+()-]{8,}$/.test(phone)) {
        newErrors.phone = 'Format de téléphone invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const profileData: any = {
        name: name.trim(),
        profileCompleted: true,
      };

      if (phone.trim()) {
        profileData.phone = phone.trim();
      }

      if (location.trim()) {
        profileData.location = location.trim();
      }

      if (preferredSpecialties.length > 0) {
        profileData.preferredSpecialties = preferredSpecialties;
      }

      await updateUserProfile(currentUser.id, profileData);

      // Navigate to dashboard with success
      navigate('/dashboard', { state: { welcomeMessage: true } });
    } catch (error) {
      console.error('Error completing profile:', error);
      setErrors({ form: 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      // Mark profile as completed with minimal data
      await updateUserProfile(currentUser.id, {
        profileCompleted: true,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the user is a lawyer (from OAuth), redirect them to complete lawyer registration
  const handleLawyerSignup = () => {
    navigate('/register-lawyer');
  };

  if (isAuthLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-deep-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-100 dark:from-deep-950 dark:via-deep-900 dark:to-deep-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-primary-600'
                  : s < step
                  ? 'w-8 bg-green-500'
                  : 'w-2 bg-surface-300 dark:bg-deep-700'
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-deep-900 rounded-3xl shadow-2xl border border-surface-200 dark:border-deep-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-white mb-2">
              Bienvenue sur Jurilab !
            </h1>
            <p className="text-primary-100">
              Complétez votre profil pour une meilleure expérience
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {errors.form && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{errors.form}</p>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">
                    Comment devons-nous vous appeler ?
                  </h2>
                  <p className="text-sm text-deep-500 dark:text-surface-400">
                    Ce nom sera visible par les avocats
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 ${
                        errors.name
                          ? 'border-red-300 dark:border-red-800'
                          : 'border-transparent focus:border-primary-500'
                      } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
                      placeholder="Jean Dupont"
                      autoFocus
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Are you a lawyer? */}
                <div className="pt-4 border-t border-surface-200 dark:border-deep-700">
                  <button
                    type="button"
                    onClick={handleLawyerSignup}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 border-2 border-accent-200 dark:border-accent-800 hover:border-accent-400 dark:hover:border-accent-600 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-deep-900 dark:text-surface-100">
                          Vous êtes avocat ?
                        </p>
                        <p className="text-xs text-deep-500 dark:text-surface-400">
                          Créez votre profil professionnel
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-accent-600 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">
                    Informations de contact
                  </h2>
                  <p className="text-sm text-deep-500 dark:text-surface-400">
                    Optionnel mais recommandé pour les rendez-vous
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                    Téléphone <span className="font-normal text-deep-400">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-4 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 ${
                        errors.phone
                          ? 'border-red-300 dark:border-red-800'
                          : 'border-transparent focus:border-primary-500'
                      } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
                    Ville <span className="font-normal text-deep-400">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-50 dark:bg-deep-800 border-2 border-transparent focus:border-primary-500 outline-none text-deep-900 dark:text-surface-100 transition-colors"
                      placeholder="Paris"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {POPULAR_CITIES.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setLocation(city)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                          location === city
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-300 dark:border-primary-700'
                            : 'bg-surface-100 dark:bg-deep-800 text-deep-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-deep-700'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">
                    Vos besoins juridiques
                  </h2>
                  <p className="text-sm text-deep-500 dark:text-surface-400">
                    Sélectionnez les domaines qui vous intéressent
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {Object.values(LegalSpecialty).map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        preferredSpecialties.includes(specialty)
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400 dark:border-primary-600'
                          : 'bg-surface-50 dark:bg-deep-800 border-surface-200 dark:border-deep-700 hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          preferredSpecialties.includes(specialty)
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-deep-700 dark:text-surface-300'
                        }`}>
                          {translateSpecialty(specialty)}
                        </span>
                        {preferredSpecialties.includes(specialty) && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-center text-deep-400 dark:text-surface-500">
                  Vous pourrez modifier ces préférences plus tard
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Retour
                </Button>
              )}

              {step < 3 ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="text-deep-500"
                  >
                    Passer
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-deep-400 dark:text-surface-500 mt-6">
          Vos données sont protégées et ne seront jamais partagées sans votre consentement.
        </p>
      </div>
    </div>
  );
};
