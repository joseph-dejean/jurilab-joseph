import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/store';
import { LegalSpecialty, UserRole, Lawyer } from '../types';
import { Button } from '../components/Button';
import { registerLawyer, getAuthErrorMessage } from '../services/firebaseService';
import {
  User, Briefcase, MapPin, DollarSign, Languages,
  FileText, Upload, Check, ChevronRight, ChevronLeft,
  Scale, Eye, EyeOff, AlertCircle, Phone, Mail, Lock,
  Building, Award, GraduationCap, Globe
} from 'lucide-react';

interface LawyerFormData {
  // Étape 1: Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;

  // Étape 2: Informations professionnelles
  barNumber: string; // Numéro d'inscription au barreau
  specialty: LegalSpecialty;
  firmName: string;
  yearsExperience: number;

  // Étape 3: Pratique & Localisation
  bio: string;
  city: string;
  address: string;
  postalCode: string;

  // Étape 4: Tarifs & Langues
  hourlyRate: number;
  languages: string[];

  // Étape 5: Documents
  profilePhoto?: File;
  barCertificate?: File;
  diploma?: File;
}

const INITIAL_FORM_DATA: LawyerFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  barNumber: '',
  specialty: LegalSpecialty.GENERAL,
  firmName: '',
  yearsExperience: 0,
  bio: '',
  city: '',
  address: '',
  postalCode: '',
  hourlyRate: 150,
  languages: ['Français'],
};

const AVAILABLE_LANGUAGES = [
  'Français', 'Anglais', 'Espagnol', 'Allemand', 'Italien',
  'Arabe', 'Chinois', 'Portugais', 'Russe'
];

const STEPS = [
  { number: 1, title: 'Identité', icon: User },
  { number: 2, title: 'Profession', icon: Briefcase },
  { number: 3, title: 'Localisation', icon: MapPin },
  { number: 4, title: 'Tarifs', icon: DollarSign },
  { number: 5, title: 'Documents', icon: FileText },
];

const InputField = ({
  label,
  name,
  type = 'text',
  placeholder,
  icon: Icon,
  value,
  onChange,
  error,
  hint,
  required = true
}: any) => (
  <div>
    <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
      {hint && <span className="font-normal text-deep-400 dark:text-surface-500 ml-1">({hint})</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${error
            ? 'border-red-300 dark:border-red-800'
            : 'border-surface-200 dark:border-deep-700 focus:border-accent-500 dark:focus:border-accent-400'
          } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
        placeholder={placeholder}
        style={{ fontSize: '16px' }}
      />
    </div>
    {error && (
      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);


export const LawyerRegistrationPage: React.FC = () => {
  const { translateSpecialty } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LawyerFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const updateField = (field: keyof LawyerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
        if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
        if (!formData.email.trim()) newErrors.email = 'Email requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email invalide';
        }
        if (!formData.password) newErrors.password = 'Mot de passe requis';
        else if (formData.password.length < 8) {
          newErrors.password = 'Minimum 8 caractères';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
        break;

      case 2:
        if (!formData.barNumber.trim()) newErrors.barNumber = 'Numéro au barreau requis';
        if (!formData.firmName.trim()) newErrors.firmName = 'Nom du cabinet requis';
        if (formData.yearsExperience < 0) newErrors.yearsExperience = 'Années d\'expérience invalides';
        break;

      case 3:
        if (!formData.bio.trim()) newErrors.bio = 'Biographie requise';
        else if (formData.bio.length < 50) {
          newErrors.bio = 'La biographie doit contenir au moins 50 caractères';
        }
        if (!formData.city.trim()) newErrors.city = 'Ville requise';
        if (!formData.address.trim()) newErrors.address = 'Adresse requise';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Code postal requis';
        break;

      case 4:
        if (formData.hourlyRate < 50) newErrors.hourlyRate = 'Tarif minimum: 50€';
        if (formData.languages.length === 0) newErrors.languages = 'Au moins une langue requise';
        break;

      case 5:
        if (!acceptedTerms) newErrors.terms = 'Vous devez accepter les conditions';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getCityCoordinates = (city: string): { lat: number; lng: number } => {
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'PARIS': { lat: 48.8566, lng: 2.3522 },
      'MARSEILLE': { lat: 43.2965, lng: 5.3698 },
      'LYON': { lat: 45.7640, lng: 4.8357 },
      'TOULOUSE': { lat: 43.6047, lng: 1.4442 },
      'NICE': { lat: 43.7102, lng: 7.2620 },
      'NANTES': { lat: 47.2184, lng: -1.5536 },
      'STRASBOURG': { lat: 48.5734, lng: 7.7521 },
      'MONTPELLIER': { lat: 43.6108, lng: 3.8767 },
      'BORDEAUX': { lat: 44.8378, lng: -0.5792 },
      'LILLE': { lat: 50.6292, lng: 3.0573 },
      'RENNES': { lat: 48.1173, lng: -1.6778 },
      'REIMS': { lat: 49.2583, lng: 4.0317 },
      'SAINT-ÉTIENNE': { lat: 45.4397, lng: 4.3872 },
      'LE HAVRE': { lat: 49.4944, lng: 0.1079 },
      'TOULON': { lat: 43.1242, lng: 5.9280 },
      'GRENOBLE': { lat: 45.1885, lng: 5.7245 },
      'DIJON': { lat: 47.3220, lng: 5.0415 },
      'ANGERS': { lat: 47.4784, lng: -0.5632 },
      'NÎMES': { lat: 43.8367, lng: 4.3601 },
      'VILLEURBANNE': { lat: 45.7660, lng: 4.8795 }
    };

    const normalizedCity = city.toUpperCase().trim();
    return cityCoords[normalizedCity] || { lat: 46.2276, lng: 2.2137 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const coordinates = getCityCoordinates(formData.city);

      const lawyerData = {
        name: `${formData.firstName} ${formData.lastName}`,
        specialty: formData.specialty,
        location: `${formData.city}, France`,
        hourlyRate: formData.hourlyRate,
        yearsExperience: formData.yearsExperience,
        languages: formData.languages,
        availableSlots: [],
        bio: formData.bio,
        education: [],
        certifications: [],
        cases: {
          total: 0,
          won: 0,
          settled: 0
        },
        phone: formData.phone,
        address: formData.address,
        coordinates,
        verified: false,
        firmName: formData.firmName,
        barNumber: formData.barNumber,
        responseTime: '24h',
        role: UserRole.LAWYER,
        avatarUrl: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=7c3aed&color=fff`
      };

      await registerLawyer(formData.email, formData.password, lawyerData);

      alert('✅ Inscription réussie! Votre compte sera activé après vérification de vos documents (24-48h).');
      navigate('/');
    } catch (error: any) {
      console.error('❌ Error during registration:', error);
      setErrors({ form: getAuthErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      {/* Desktop Progress */}
      <div className="hidden md:flex justify-between items-center mb-4">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${currentStep > step.number
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : currentStep === step.number
                      ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/30'
                      : 'bg-surface-100 dark:bg-deep-800 text-deep-400 dark:text-surface-500'}`}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs mt-2 font-medium transition-colors
                ${currentStep >= step.number
                  ? 'text-deep-900 dark:text-surface-100'
                  : 'text-deep-400 dark:text-surface-500'}`}>
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-1 mx-3 rounded-full transition-all duration-500
                ${currentStep > step.number
                  ? 'bg-green-500'
                  : 'bg-surface-200 dark:bg-deep-700'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-deep-900 dark:text-surface-100">
            Étape {currentStep} sur 5
          </span>
          <span className="text-sm text-deep-500 dark:text-surface-400">
            {STEPS[currentStep - 1].title}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-200 dark:bg-deep-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );



  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-deep-700">
        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <User className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
            Informations Personnelles
          </h2>
          <p className="text-sm text-deep-500 dark:text-surface-400">
            Commençons par vos informations de base
          </p>
        </div>
      </div>

      {errors.form && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{errors.form}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <InputField
          label="Prénom"
          name="firstName"
          icon={User}
          placeholder="Jean"
          value={formData.firstName}
          onChange={(e: any) => updateField('firstName', e.target.value)}
          error={errors.firstName}
        />
        <InputField
          label="Nom"
          name="lastName"
          icon={User}
          placeholder="Dupont"
          value={formData.lastName}
          onChange={(e: any) => updateField('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>

      <InputField
        label="Email Professionnel"
        name="email"
        type="email"
        icon={Mail}
        placeholder="jean.dupont@avocats.fr"
        value={formData.email}
        onChange={(e: any) => updateField('email', e.target.value)}
        error={errors.email}
      />

      <InputField
        label="Téléphone"
        name="phone"
        type="tel"
        icon={Phone}
        placeholder="+33 6 12 34 56 78"
        value={formData.phone}
        onChange={(e: any) => updateField('phone', e.target.value)}
        error={errors.phone}
      />

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Mot de passe <span className="text-red-500">*</span>
          <span className="font-normal text-deep-400 dark:text-surface-500 ml-1">(min. 8 caractères)</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.password
                ? 'border-red-300 dark:border-red-800'
                : 'border-surface-200 dark:border-deep-700 focus:border-accent-500'
              } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
            placeholder="••••••••"
            style={{ fontSize: '16px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400 dark:text-surface-500 hover:text-deep-600 transition-colors"
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

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            className={`w-full pl-12 pr-12 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.confirmPassword
                ? 'border-red-300 dark:border-red-800'
                : 'border-surface-200 dark:border-deep-700 focus:border-accent-500'
              } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
            placeholder="••••••••"
            style={{ fontSize: '16px' }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-400 dark:text-surface-500 hover:text-deep-600 transition-colors"
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-deep-700">
        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
            Informations Professionnelles
          </h2>
          <p className="text-sm text-deep-500 dark:text-surface-400">
            Détails de votre pratique juridique
          </p>
        </div>
      </div>

      <InputField
        label="Numéro d'inscription au Barreau"
        name="barNumber"
        icon={Award}
        placeholder="P1234567890"
        value={formData.barNumber}
        onChange={(e: any) => updateField('barNumber', e.target.value)}
        error={errors.barNumber}
        hint="sera vérifié"
      />

      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Spécialité Juridique <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <select
            value={formData.specialty}
            onChange={(e) => updateField('specialty', e.target.value as LegalSpecialty)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 border-surface-200 dark:border-deep-700 focus:border-accent-500 outline-none text-deep-900 dark:text-surface-100 transition-colors appearance-none cursor-pointer"
            style={{ fontSize: '16px' }}
          >
            {Object.values(LegalSpecialty).map(s => (
              <option key={s} value={s}>{translateSpecialty(s)}</option>
            ))}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 rotate-90" />
        </div>
      </div>

      <InputField
        label="Nom du Cabinet"
        name="firmName"
        icon={Building}
        placeholder="Cabinet Dupont & Associés"
        value={formData.firmName}
        onChange={(e: any) => updateField('firmName', e.target.value)}
        error={errors.firmName}
      />

      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Années d'Expérience <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          value={formData.yearsExperience}
          onChange={(e) => updateField('yearsExperience', parseInt(e.target.value) || 0)}
          className={`w-full px-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.yearsExperience
              ? 'border-red-300 dark:border-red-800'
              : 'border-surface-200 dark:border-deep-700 focus:border-accent-500'
            } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
          style={{ fontSize: '16px' }}
        />
        {errors.yearsExperience && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.yearsExperience}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-deep-700">
        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
            Pratique & Localisation
          </h2>
          <p className="text-sm text-deep-500 dark:text-surface-400">
            Où et comment vous exercez
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Biographie Professionnelle <span className="text-red-500">*</span>
          <span className="font-normal text-deep-400 dark:text-surface-500 ml-1">(min. 50 caractères)</span>
        </label>
        <textarea
          rows={5}
          value={formData.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          className={`w-full px-4 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.bio
              ? 'border-red-300 dark:border-red-800'
              : 'border-surface-200 dark:border-deep-700 focus:border-accent-500'
            } outline-none text-deep-900 dark:text-surface-100 resize-none transition-colors`}
          placeholder="Décrivez votre parcours, vos expertises et votre approche..."
          style={{ fontSize: '16px' }}
        />
        <div className="flex justify-between items-center mt-1.5">
          {errors.bio && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.bio}
            </p>
          )}
          <p className={`text-xs ml-auto ${formData.bio.length >= 50 ? 'text-green-600' : 'text-deep-500'}`}>
            {formData.bio.length} / 50 min.
          </p>
        </div>
      </div>

      <InputField
        label="Ville"
        name="city"
        icon={MapPin}
        placeholder="Paris"
        value={formData.city}
        onChange={(e: any) => updateField('city', e.target.value)}
        error={errors.city}
      />

      <InputField
        label="Adresse du Cabinet"
        name="address"
        icon={Building}
        placeholder="123 Rue de la Paix"
        value={formData.address}
        onChange={(e: any) => updateField('address', e.target.value)}
        error={errors.address}
      />

      <InputField
        label="Code Postal"
        name="postalCode"
        placeholder="75001"
        value={formData.postalCode}
        onChange={(e: any) => updateField('postalCode', e.target.value)}
        error={errors.postalCode}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-deep-700">
        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
            Tarifs & Langues
          </h2>
          <p className="text-sm text-deep-500 dark:text-surface-400">
            Vos conditions de consultation
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
          Tarif Horaire <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-400 dark:text-surface-500" />
          <input
            type="number"
            min="50"
            step="10"
            value={formData.hourlyRate}
            onChange={(e) => updateField('hourlyRate', parseInt(e.target.value) || 0)}
            className={`w-full pl-12 pr-20 py-3.5 rounded-xl bg-white dark:bg-deep-900 border-2 ${errors.hourlyRate
                ? 'border-red-300 dark:border-red-800'
                : 'border-surface-200 dark:border-deep-700 focus:border-accent-500'
              } outline-none text-deep-900 dark:text-surface-100 transition-colors`}
            style={{ fontSize: '16px' }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-deep-500 dark:text-surface-400 font-medium">
            € / heure
          </span>
        </div>
        {errors.hourlyRate && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.hourlyRate}
          </p>
        )}
        <p className="text-xs text-deep-500 dark:text-surface-400 mt-1.5">
          Ce tarif sera visible par les clients
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Langues Parlées <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${formData.languages.includes(lang)
                  ? 'bg-accent-50 dark:bg-accent-900/30 border-accent-500 text-accent-700 dark:text-accent-300'
                  : 'border-surface-200 dark:border-deep-700 text-deep-600 dark:text-surface-400 hover:border-accent-300 dark:hover:border-accent-700'
                }`}
            >
              {lang}
            </button>
          ))}
        </div>
        {errors.languages && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.languages}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-200 dark:border-deep-700">
        <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <FileText className="h-5 w-5 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100">
            Documents & Finalisation
          </h2>
          <p className="text-sm text-deep-500 dark:text-surface-400">
            Dernière étape avant validation
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> Vos documents seront vérifiés par notre équipe avant l'activation de votre compte.
          Ce processus prend généralement 24-48 heures.
        </p>
      </div>

      {/* File Uploads */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
            Photo de Profil <span className="text-deep-400">(Recommandé)</span>
          </label>
          <div className="border-2 border-dashed border-surface-300 dark:border-deep-600 rounded-xl p-6 text-center hover:border-accent-400 dark:hover:border-accent-500 transition-colors cursor-pointer bg-surface-50 dark:bg-deep-900/50">
            <Upload className="h-8 w-8 mx-auto mb-2 text-deep-400 dark:text-surface-500" />
            <p className="text-sm text-deep-600 dark:text-surface-400 mb-1">
              Cliquez pour télécharger
            </p>
            <p className="text-xs text-deep-400 dark:text-surface-500">JPG, PNG (max. 5MB)</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => updateField('profilePhoto', e.target.files?.[0])}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-deep-700 dark:text-surface-300 mb-2">
            Certificat d'Inscription au Barreau <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-surface-300 dark:border-deep-600 rounded-xl p-6 text-center hover:border-accent-400 dark:hover:border-accent-500 transition-colors cursor-pointer bg-surface-50 dark:bg-deep-900/50">
            <Upload className="h-8 w-8 mx-auto mb-2 text-deep-400 dark:text-surface-500" />
            <p className="text-sm text-deep-600 dark:text-surface-400 mb-1">
              Téléchargez votre certificat
            </p>
            <p className="text-xs text-deep-400 dark:text-surface-500">PDF (max. 10MB)</p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => updateField('barCertificate', e.target.files?.[0])}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface-100 dark:bg-deep-800 p-5 rounded-xl">
        <h3 className="font-bold text-deep-900 dark:text-surface-100 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          Récapitulatif de votre inscription
        </h3>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Nom</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Email</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Spécialité</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">{translateSpecialty(formData.specialty)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Cabinet</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">{formData.firmName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Localisation</span>
            <span className="font-medium text-deep-900 dark:text-surface-100">{formData.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-deep-500 dark:text-surface-400">Tarif</span>
            <span className="font-medium text-accent-600 dark:text-accent-400">{formData.hourlyRate}€/h</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${acceptedTerms
          ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
          : errors.terms
            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
        <input
          type="checkbox"
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => {
            setAcceptedTerms(e.target.checked);
            if (errors.terms) setErrors({ ...errors, terms: '' });
          }}
          className="mt-1 w-5 h-5 rounded border-2 accent-accent-600"
        />
        <label htmlFor="terms" className="text-sm text-deep-700 dark:text-surface-200">
          J'accepte les <a href="#" className="underline font-semibold text-accent-600 dark:text-accent-400">conditions d'utilisation</a> et la
          <a href="#" className="underline font-semibold text-accent-600 dark:text-accent-400 ml-1">politique de confidentialité</a> de Jurilab.
        </label>
      </div>
      {errors.terms && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.terms}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface-100 to-accent-50 dark:from-deep-950 dark:via-deep-900 dark:to-accent-950/20 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-2xl font-bold text-deep-900 dark:text-surface-100">
              Jurilab
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-deep-900 dark:text-surface-100 mb-2">
            Inscription Avocat
          </h1>
          <p className="text-deep-600 dark:text-surface-400">
            Rejoignez Jurilab et développez votre clientèle
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-deep-900 p-6 md:p-8 rounded-2xl shadow-xl border border-surface-200 dark:border-deep-800">
          {renderProgressBar()}

          <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-deep-700">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/login?register=true')}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    'Inscription en cours...'
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Finaliser l'inscription
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-deep-500 dark:text-surface-400">
          Vous avez déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-accent-600 dark:text-accent-400 font-semibold hover:underline"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};
