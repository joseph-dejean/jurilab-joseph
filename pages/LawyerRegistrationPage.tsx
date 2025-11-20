import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/store';
import { LegalSpecialty, UserRole, Lawyer } from '../types';
import { Button } from '../components/Button';
import { registerLawyer, getAuthErrorMessage } from '../services/firebaseService';
import { 
  User, Briefcase, MapPin, DollarSign, Languages, 
  FileText, Upload, Check, ChevronRight, ChevronLeft 
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

export const LawyerRegistrationPage: React.FC = () => {
  const { t, translateSpecialty } = useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LawyerFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof LawyerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
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

  // Helper function to get coordinates for common cities
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
    return cityCoords[normalizedCity] || { lat: 46.2276, lng: 2.2137 }; // Default: center of France
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    try {
      // Get coordinates for the city (basic implementation)
      const coordinates = getCityCoordinates(formData.city);
      
      // Prepare lawyer data (excluding id and email which are handled by auth)
      const lawyerData = {
        name: `${formData.firstName} ${formData.lastName}`,
        specialty: formData.specialty,
        location: `${formData.city}, France`,
        hourlyRate: formData.hourlyRate,
        experience: formData.yearsExperience,
        languages: formData.languages,
        availableSlots: [], // Empty initially
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
        verified: false, // Will be verified by admin
        firmName: formData.firmName,
        barNumber: formData.barNumber,
        responseTime: '24h',
        role: UserRole.LAWYER,
        avatarUrl: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}`
      };
      
      // Register via Firebase Auth and save profile
      await registerLawyer(formData.email, formData.password, lawyerData);
      
      alert('✅ Inscription réussie! Votre compte sera activé après vérification de vos documents (24-48h).');
      navigate('/');
    } catch (error: any) {
      console.error('❌ Error during registration:', error);
      alert('❌ Erreur lors de l\'inscription: ' + getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                ${currentStep > step ? 'bg-green-500 text-white' : 
                  currentStep === step ? 'bg-primary-600 text-white' : 
                  'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
            >
              {currentStep > step ? <Check className="h-5 w-5" /> : step}
            </div>
            {step < 5 && (
              <div className={`h-1 w-12 md:w-20 mx-2 transition-colors
                ${currentStep > step ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>Personnel</span>
        <span>Professionnel</span>
        <span>Localisation</span>
        <span>Tarifs</span>
        <span>Documents</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
        <User className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Informations Personnelles
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Prénom *
          </label>
          <input 
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
            placeholder="Jean"
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nom *
          </label>
          <input 
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
            placeholder="Dupont"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Email Professionnel *
        </label>
        <input 
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="jean.dupont@avocats.fr"
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Téléphone *
        </label>
        <input 
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="+33 6 12 34 56 78"
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Mot de passe * (min. 8 caractères)
        </label>
        <input 
          type="password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="••••••••"
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Confirmer le mot de passe *
        </label>
        <input 
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
        <Briefcase className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Informations Professionnelles
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Numéro d'inscription au Barreau *
        </label>
        <input 
          type="text"
          value={formData.barNumber}
          onChange={(e) => updateField('barNumber', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.barNumber ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="P1234567890"
        />
        {errors.barNumber && <p className="text-red-500 text-xs mt-1">{errors.barNumber}</p>}
        <p className="text-xs text-slate-500 mt-1">Votre numéro sera vérifié auprès du barreau</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Spécialité Juridique *
        </label>
        <select
          value={formData.specialty}
          onChange={(e) => updateField('specialty', e.target.value as LegalSpecialty)}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {Object.values(LegalSpecialty).map(s => (
            <option key={s} value={s}>{translateSpecialty(s)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nom du Cabinet *
        </label>
        <input 
          type="text"
          value={formData.firmName}
          onChange={(e) => updateField('firmName', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.firmName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="Cabinet Dupont & Associés"
        />
        {errors.firmName && <p className="text-red-500 text-xs mt-1">{errors.firmName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Années d'Expérience *
        </label>
        <input 
          type="number"
          min="0"
          value={formData.yearsExperience}
          onChange={(e) => updateField('yearsExperience', parseInt(e.target.value))}
          className={`w-full px-4 py-2 rounded-lg border ${errors.yearsExperience ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
        />
        {errors.yearsExperience && <p className="text-red-500 text-xs mt-1">{errors.yearsExperience}</p>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
        <MapPin className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Pratique & Localisation
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Biographie Professionnelle * (min. 50 caractères)
        </label>
        <textarea
          rows={5}
          value={formData.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.bio ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none resize-none`}
          placeholder="Décrivez votre parcours, vos expertises et votre approche..."
        />
        <div className="flex justify-between items-center mt-1">
          {errors.bio && <p className="text-red-500 text-xs">{errors.bio}</p>}
          <p className="text-xs text-slate-500 ml-auto">{formData.bio.length} / 500</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Ville *
        </label>
        <input 
          type="text"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.city ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="Paris"
        />
        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Adresse du Cabinet *
        </label>
        <input 
          type="text"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.address ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="123 Rue de la Paix"
        />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Code Postal *
        </label>
        <input 
          type="text"
          value={formData.postalCode}
          onChange={(e) => updateField('postalCode', e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${errors.postalCode ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          placeholder="75001"
        />
        {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
        <DollarSign className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Tarifs & Langues
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Tarif Horaire (€) *
        </label>
        <div className="relative">
          <input 
            type="number"
            min="50"
            step="10"
            value={formData.hourlyRate}
            onChange={(e) => updateField('hourlyRate', parseInt(e.target.value))}
            className={`w-full px-4 py-2 rounded-lg border ${errors.hourlyRate ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none`}
          />
          <span className="absolute right-4 top-2 text-slate-500">€ / heure</span>
        </div>
        {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
        <p className="text-xs text-slate-500 mt-1">Ce tarif sera visible par les clients</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Langues Parlées * <Languages className="inline h-4 w-4" />
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AVAILABLE_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.languages.includes(lang)
                  ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        {errors.languages && <p className="text-red-500 text-xs mt-1">{errors.languages}</p>}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b dark:border-slate-700">
        <FileText className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Documents de Vérification
        </h2>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Important:</strong> Vos documents seront vérifiés par notre équipe avant l'activation de votre compte.
          Ce processus prend généralement 24-48 heures.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Photo de Profil (Recommandé)
        </label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Cliquez pour télécharger ou glissez-déposez
          </p>
          <p className="text-xs text-slate-500">JPG, PNG (max. 5MB)</p>
          <input 
            type="file" 
            accept="image/*"
            className="hidden"
            onChange={(e) => updateField('profilePhoto', e.target.files?.[0])}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Certificat d'Inscription au Barreau * (Obligatoire)
        </label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Téléchargez votre certificat
          </p>
          <p className="text-xs text-slate-500">PDF (max. 10MB)</p>
          <input 
            type="file" 
            accept=".pdf"
            className="hidden"
            onChange={(e) => updateField('barCertificate', e.target.files?.[0])}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Diplôme de Droit (Optionnel)
        </label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Téléchargez votre diplôme
          </p>
          <p className="text-xs text-slate-500">PDF (max. 10MB)</p>
          <input 
            type="file" 
            accept=".pdf"
            className="hidden"
            onChange={(e) => updateField('diploma', e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-2">
          Récapitulatif de votre inscription
        </h3>
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <p><strong>Nom:</strong> {formData.firstName} {formData.lastName}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Spécialité:</strong> {translateSpecialty(formData.specialty)}</p>
          <p><strong>Cabinet:</strong> {formData.firmName}</p>
          <p><strong>Localisation:</strong> {formData.city}</p>
          <p><strong>Tarif:</strong> {formData.hourlyRate}€/h</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <input 
          type="checkbox" 
          id="terms"
          required
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-blue-900 dark:text-blue-200">
          J'accepte les <a href="#" className="underline font-medium">conditions d'utilisation</a> et la 
          <a href="#" className="underline font-medium"> politique de confidentialité</a> de Jurilab.
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2">
            Inscription Avocat
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Rejoignez Jurilab et développez votre clientèle
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
          {renderProgressBar()}

          <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t dark:border-slate-700">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
              )}
              
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 ml-auto"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 ml-auto bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Inscription en cours...
                    </>
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
        <div className="text-center mt-6 text-sm text-slate-500">
          Vous avez déjà un compte?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-primary-600 font-medium hover:underline"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};
