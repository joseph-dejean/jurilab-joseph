import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Lawyer, Appointment, UserRole, LegalSpecialty, ChatMessage } from '../types';
import { 
  loadLawyersFromFirebase, 
  loginUser, 
  loginWithGoogle,
  logoutUser, 
  registerUser, 
  getUserProfile, 
  createAppointment,
  getUserAppointments,
  subscribeToAppointments
} from '../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

type Language = 'en' | 'fr';

const TRANSLATIONS = {
  en: {
    nav: { search: "Find a Lawyer", dashboard: "Dashboard", login: "Log in", signup: "Sign up", signout: "Sign Out" },
    hero: {
      title1: "The right ",
      title2: "lawyer",
      title3: ",\nat the right time.",
      subtitle: "Find and book the best lawyers in your region. From specialized advice to full representation, Jurilab connects you instantly.",
      searchPlaceholder: "Describe your legal issue or search by name...",
      searchBtn: "Find Lawyers",
      new: "New",
      aiHint: "AI-Powered Search: Type natural sentences like 'I was unfairly fired' to find specialists.",
      verified: "Verified Professionals",
      pricing: "Transparent Pricing",
      booking: "Secure Booking",
      whyTitle: "Why Choose Jurilab?",
      browseTitle: "Browse by Specialty",
      browseSubtitle: "Find the right expert for your specific needs.",
      viewAll: "View All",
      features: {
        vetted: { title: "Vetted Experts", desc: "Every lawyer on Jurilab undergoes a rigorous verification process." },
        time: { title: "Real-Time Availability", desc: "See lawyer schedules and book appointments instantly online." },
        rated: { title: "Top Rated", desc: "Read verified reviews from real clients to make informed decisions." }
      }
    },
    search: {
      analyzing: "Analyzing...",
      search: "Search",
      allSpecialties: "All Specialties",
      allRegions: "All Regions",
      anyRating: "Any Rating",
      aiSuggestion: "AI Suggestion",
      filteredBy: "Filtered by",
      found: "Lawyers Found",
      noResults: "No lawyers found matching your criteria.",
      viewProfile: "View Profile & Book",
      stars: "Stars",
      hr: "/hr",
      aiRecommended: "AI Recommended",
      recommendedLawyers: "recommended lawyers"
    },
    dashboard: {
      appointments: "Appointments",
      messages: "Messages",
      documents: "Documents",
      settings: "Settings",
      upcoming: "Upcoming",
      unread: "Unread Messages",
      inboxClear: "Inbox clear",
      sharedFiles: "Shared files",
      myAppointments: "My Appointments",
      viewAll: "View All",
      noAppts: "You have no upcoming appointments.",
      findLawyer: "Find a Lawyer"
    },
    auth: {
      welcome: "Welcome Back",
      create: "Create Account",
      loginSubtitle: "Sign in to manage your appointments.",
      registerSubtitle: "Join thousands of clients finding legal help.",
      email: "Email Address",
      password: "Password",
      iam: "I am a...",
      client: "Client",
      lawyer: "Lawyer",
      signIn: "Sign In",
      haveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      google: "Continue with Google"
    },
    modal: {
      about: "About",
      specialties: "Specialties",
      languages: "Languages",
      experience: "Experience",
      years: "years",
      bookTitle: "Book an Appointment",
      reviewsTitle: "Client Reviews",
      selectSlot: "Select a date",
      consultationType: "Consultation Type",
      video: "Video Call",
      inPerson: "In Person",
      phone: "Phone Call",
      notes: "Briefly describe your legal issue (optional)",
      confirm: "Confirm Booking",
      loginToBook: "Log in to Book",
      success: "Appointment Confirmed!",
      close: "Close"
    },
    chatbot: {
      title: "Juribot Assistant",
      placeholder: "Ask about a law, contract, or case law...",
      disclaimer: "⚠️ IMPORTANT: Juribot is an AI assistant, not a lawyer. It can make errors. Information provided is for educational purposes only. Always consult a professional.",
      welcome: "Hello! I am Juribot. I can help you research French law (Légifrance, Dalloz) or explain complex terms. How can I help you today?",
      sources: "Sources found:"
    },
    booking: {
      youSelected: "You have selected",
      selectDay: "Please select a day.",
      availableSlotsFor: "Available slots for",
      noSlots: "No slots available.",
      confirmMessage: "Appointment confirmed with",
      confirmOn: "on",
      selectSlotFirst: "Please select a time slot first."
    }
  },
  fr: {
    nav: { search: "Trouver un Avocat", dashboard: "Tableau de Bord", login: "Connexion", signup: "Inscription", signout: "Déconnexion" },
    hero: {
      title1: "Le bon ",
      title2: "avocat",
      title3: ",\nau bon moment.",
      subtitle: "Trouvez et réservez les meilleurs avocats de votre région. Du conseil spécialisé à la représentation complète, Jurilab vous connecte instantanément.",
      searchPlaceholder: "Décrivez votre problème ou cherchez par nom...",
      searchBtn: "Rechercher",
      new: "Nouveau",
      aiHint: "Recherche IA : Écrivez naturellement, ex: 'J'ai été licencié abusivement'.",
      verified: "Professionnels Vérifiés",
      pricing: "Tarifs Transparents",
      booking: "Réservation Sécurisée",
      whyTitle: "Pourquoi choisir Jurilab ?",
      browseTitle: "Parcourir par Spécialité",
      browseSubtitle: "Trouvez l'expert adapté à vos besoins spécifiques.",
      viewAll: "Voir Tout",
      features: {
        vetted: { title: "Experts Vérifiés", desc: "Chaque avocat sur Jurilab subit un processus de vérification rigoureux." },
        time: { title: "Disponibilité Temps Réel", desc: "Consultez les agendas et prenez rendez-vous en ligne instantanément." },
        rated: { title: "Les Mieux Notés", desc: "Lisez des avis vérifiés de clients réels pour prendre des décisions éclairées." }
      }
    },
    search: {
      analyzing: "Analyse...",
      search: "Rechercher",
      allSpecialties: "Toutes Spécialités",
      allRegions: "Toutes Régions",
      anyRating: "Toutes Notes",
      aiSuggestion: "Suggestion IA",
      filteredBy: "Filtré par",
      found: "Avocats Trouvés",
      noResults: "Aucun avocat trouvé correspondant à vos critères.",
      viewProfile: "Voir Profil & Réserver",
      stars: "Étoiles",
      hr: "/h",
      aiRecommended: "IA Recommandé",
      recommendedLawyers: "avocats recommandés"
    },
    dashboard: {
      appointments: "Rendez-vous",
      messages: "Messages",
      documents: "Documents",
      settings: "Paramètres",
      upcoming: "À venir",
      unread: "Messages Non Lus",
      inboxClear: "Boîte vide",
      sharedFiles: "Fichiers partagés",
      myAppointments: "Mes Rendez-vous",
      viewAll: "Voir Tout",
      noAppts: "Vous n'avez aucun rendez-vous à venir.",
      findLawyer: "Trouver un Avocat"
    },
    auth: {
      welcome: "Bon retour",
      create: "Créer un Compte",
      loginSubtitle: "Connectez-vous pour gérer vos rendez-vous.",
      registerSubtitle: "Rejoignez des milliers de clients satisfaits.",
      email: "Adresse Email",
      password: "Mot de passe",
      iam: "Je suis...",
      client: "Client",
      lawyer: "Avocat",
      signIn: "Se Connecter",
      haveAccount: "Déjà un compte ?",
      dontHaveAccount: "Pas encore de compte ?",
      google: "Continuer avec Google"
    },
    modal: {
      about: "À Propos",
      specialties: "Expertise",
      languages: "Langues parlées",
      experience: "Expérience",
      years: "ans",
      bookTitle: "Prendre Rendez-vous",
      reviewsTitle: "Avis des Clients",
      selectSlot: "Sélectionnez une date",
      consultationType: "Type de Consultation",
      video: "Visio-conférence",
      inPerson: "Au Cabinet",
      phone: "Téléphone",
      notes: "Décrivez brièvement votre besoin (optionnel)",
      confirm: "Confirmer le Rendez-vous",
      loginToBook: "Connexion requise",
      success: "Rendez-vous Confirmé !",
      close: "Fermer"
    },
    chatbot: {
      title: "Assistant Juribot",
      placeholder: "Posez une question sur une loi, un contrat...",
      disclaimer: "⚠️ IMPORTANT : Juribot est une IA, pas un avocat. Elle peut faire des erreurs. Les infos sont à titre documentaire. Consultez toujours un professionnel.",
      welcome: "Bonjour ! Je suis Juribot. Je peux vous aider à rechercher des textes de loi (Légifrance, Dalloz) ou vulgariser des termes. Comment puis-je vous aider ?",
      sources: "Sources trouvées :"
    },
    booking: {
      youSelected: "Vous avez sélectionné le",
      selectDay: "Veuillez sélectionner un jour.",
      availableSlotsFor: "Créneaux disponibles pour le",
      noSlots: "Aucun créneau disponible.",
      confirmMessage: "Rendez-vous confirmé avec",
      confirmOn: "le",
      selectSlotFirst: "Veuillez d'abord sélectionner un créneau horaire."
    }
  }
};

// Helper to translate specialties
const SPECIALTY_TRANSLATIONS: Record<LegalSpecialty, { en: string, fr: string }> = {
  [LegalSpecialty.CRIMINAL]: { en: "Criminal Law", fr: "Droit Pénal" },
  [LegalSpecialty.FAMILY]: { en: "Family Law", fr: "Droit de la Famille" },
  [LegalSpecialty.CORPORATE]: { en: "Corporate Law", fr: "Droit des Affaires" },
  [LegalSpecialty.REAL_ESTATE]: { en: "Real Estate", fr: "Droit Immobilier" },
  [LegalSpecialty.LABOR]: { en: "Labor Law", fr: "Droit du Travail" },
  [LegalSpecialty.IP]: { en: "Intellectual Property", fr: "Propriété Intellectuelle" },
  [LegalSpecialty.IMMIGRATION]: { en: "Immigration", fr: "Droit des Étrangers" },
  [LegalSpecialty.TAX]: { en: "Tax Law", fr: "Droit Fiscal" },
  [LegalSpecialty.GENERAL]: { en: "General Practice", fr: "Droit Général" },
};

interface AppState {
  currentUser: User | null;
  lawyers: Lawyer[];
  appointments: Appointment[];
  darkMode: boolean;
  language: Language;
  isLoadingLawyers: boolean;
  t: typeof TRANSLATIONS['en'];
  // Chat State
  isChatOpen: boolean;
  toggleChat: () => void;
  
  translateSpecialty: (s: LegalSpecialty) => string;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (role?: UserRole) => Promise<void>;
  register: (email: string, password: string, role: UserRole, name: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  bookAppointment: (lawyerId: string, date: string, type: Appointment['type'], notes: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('fr');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(true);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('👤 User logged in:', firebaseUser.email);
        try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            if (userProfile) {
                setCurrentUser(userProfile);
                
                // Load appointments (this is now handled by the real-time listener below)
                // const userAppointments = await getUserAppointments(userProfile.id, userProfile.role);
                // setAppointments(userAppointments);
            } else {
                // Fallback if profile creation is delayed
                console.warn('User profile not found in DB immediately.');
                // Retry logic could go here, but for now relying on create logic to have finished
            }
        } catch (e) {
            console.error('Error fetching user profile', e);
        }
      } else {
        console.log('👋 User logged out');
        setCurrentUser(null);
        setAppointments([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time appointment listener
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      return;
    }

    const unsubscribe = subscribeToAppointments(currentUser.id, currentUser.role, (newAppointments) => {
      setAppointments(newAppointments);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load lawyers from Firebase on mount
  useEffect(() => {
    const loadLawyers = async () => {
      try {
        setIsLoadingLawyers(true);
        console.log('🔥 Loading lawyers from Firebase...');
        const lawyersData = await loadLawyersFromFirebase();
        
        if (lawyersData.length === 0) {
          console.warn('⚠️ No lawyers in Firebase yet. You need to upload the CSV first.');
        } else {
          setLawyers(lawyersData);
          console.log(`✅ Loaded ${lawyersData.length} lawyers from Firebase`);
        }
      } catch (error) {
        console.error('❌ Failed to load lawyers from Firebase:', error);
        console.error('Please check:');
        console.error('1. Firebase config is correct');
        console.error('2. Database rules allow read access');
        console.error('3. Data has been uploaded to Firebase');
      } finally {
        setIsLoadingLawyers(false);
      }
    };
    loadLawyers();
  }, []);

  // Check system preference on mount
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
  };

  const loginGoogle = async (role?: UserRole) => {
    await loginWithGoogle(role);
  };

  const register = async (email: string, password: string, role: UserRole, name: string) => {
    await registerUser(email, password, role, name);
  };

  const logout = async () => {
      await logoutUser();
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleChat = () => setIsChatOpen(prev => !prev);

  const bookAppointment = async (lawyerId: string, date: string, type: Appointment['type'], notes: string) => {
    if (!currentUser) return;
    const newAppt: Appointment = {
      id: 'appt_' + Date.now(),
      lawyerId,
      clientId: currentUser.id,
      date,
      status: 'CONFIRMED',
      type,
      notes
    };
    
    try {
        await createAppointment(newAppt);
        // TODO: Notify lawyer or update availability
    } catch (e) {
        console.error("Error booking appointment:", e);
        alert("Erreur lors de la réservation.");
    }
  };

  const translateSpecialty = (s: LegalSpecialty) => {
    return SPECIALTY_TRANSLATIONS[s][language];
  }

  return (
    <AppContext.Provider value={{ 
      currentUser, lawyers, appointments, darkMode, 
      language, setLanguage, t: TRANSLATIONS[language], translateSpecialty,
      isChatOpen, toggleChat, isLoadingLawyers,
      login, loginGoogle, register, logout, toggleDarkMode, bookAppointment 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
