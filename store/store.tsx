import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../supabaseClient";
import {
  acceptAppointment as acceptAppointmentService,
  cancelAppointment as cancelAppointmentService,
  checkAppointmentConflict,
  createAppointment,
  getUserProfile,
  loadLawyers,
  loginUser,
  loginWithGoogle,
  loginWithMicrosoft,
  logoutUser,
  registerUser,
  subscribeToAppointments,
  updateAppointmentField,
} from "../services/supabaseService";
import { Appointment, Lawyer, LegalSpecialty, User, UserRole } from "../types";

type Language = "en" | "fr";

const TRANSLATIONS = {
  en: {
    nav: {
      search: "Find a Lawyer",
      dashboard: "Dashboard",
      login: "Log in",
      signup: "Sign up",
      signout: "Sign Out",
    },
    hero: {
      title1: "The right ",
      title2: "lawyer",
      title3: ",\nat the right time.",
      subtitle:
        "Find and book the best lawyers in your region. From specialized advice to full representation, Jurilab connects you instantly.",
      searchPlaceholder: "Describe your legal issue or search by name...",
      searchBtn: "Find Lawyers",
      new: "New",
      aiHint:
        "AI-Powered Search: Type natural sentences like 'I was unfairly fired' to find specialists.",
      verified: "Verified Professionals",
      pricing: "Transparent Pricing",
      booking: "Secure Booking",
      whyTitle: "Why Choose Jurilab?",
      browseTitle: "Browse by Specialty",
      browseSubtitle: "Find the right expert for your specific needs.",
      viewAll: "View All",
      features: {
        vetted: {
          title: "Vetted Experts",
          desc: "Every lawyer on Jurilab undergoes a rigorous verification process.",
        },
        time: {
          title: "Real-Time Availability",
          desc: "See lawyer schedules and book appointments instantly online.",
        },
        rated: {
          title: "Top Rated",
          desc: "Read verified reviews from real clients to make informed decisions.",
        },
      },
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
      recommendedLawyers: "recommended lawyers",
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
      portfolio: "Portfolio",
      myAppointments: "My Appointments",
      viewAll: "View All",
      noAppts: "You have no upcoming appointments.",
      findLawyer: "Find a Lawyer",
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
      google: "Continue with Google",
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
      close: "Close",
    },
    chatbot: {
      title: "Juribot Assistant",
      placeholder: "Ask about a law, contract, or case law...",
      disclaimer:
        "⚠️ IMPORTANT: Juribot is an AI assistant, not a lawyer. It can make errors. Information provided is for educational purposes only. Always consult a professional.",
      welcome:
        "Hello! I am Juribot. I can help you research French law (Légifrance, Dalloz) or explain complex terms. How can I help you today?",
      sources: "Sources found:",
    },
    booking: {
      youSelected: "You have selected",
      selectDay: "Please select a day.",
      availableSlotsFor: "Available slots for",
      noSlots: "No slots available.",
      confirmMessage: "Appointment confirmed with",
      confirmOn: "on",
      selectSlotFirst: "Please select a time slot first.",
    },
  },
  fr: {
    nav: {
      search: "Trouver un Avocat",
      dashboard: "Tableau de Bord",
      login: "Connexion",
      signup: "Inscription",
      signout: "Déconnexion",
    },
    hero: {
      title1: "Le bon ",
      title2: "avocat",
      title3: ",\nau bon moment.",
      subtitle:
        "Besoin d’un avocat ? Trouvez le bon et réservez tout de suite.\n\nDes avocats près de vous, disponibles, et une réservation de rendez-vous en quelques minutes.",
      searchPlaceholder: "Décrivez votre problème ou cherchez par nom...",
      searchBtn: "Rechercher",
      new: "Nouveau",
      aiHint:
        "Recherche IA : Écrivez naturellement, ex: 'J'ai été licencié abusivement'.",
      verified: "Professionnels Vérifiés",
      pricing: "Tarifs Transparents",
      booking: "Réservation Sécurisée",
      whyTitle: "Pourquoi choisir Jurilab ?",
      browseTitle: "Parcourir par Spécialité",
      browseSubtitle: "Trouvez l'expert adapté à vos besoins spécifiques.",
      viewAll: "Voir Tout",
      features: {
        vetted: {
          title: "Experts Vérifiés",
          desc: "Chaque avocat sur Jurilab subit un processus de vérification rigoureux.",
        },
        time: {
          title: "Disponibilité Temps Réel",
          desc: "Consultez les agendas et prenez rendez-vous en ligne instantanément.",
        },
        rated: {
          title: "Les Mieux Notés",
          desc: "Lisez des avis vérifiés de clients réels pour prendre des décisions éclairées.",
        },
      },
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
      recommendedLawyers: "avocats recommandés",
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
      portfolio: "Portfolio Clients",
      myAppointments: "Mes Rendez-vous",
      viewAll: "Voir Tout",
      noAppts: "Vous n'avez aucun rendez-vous à venir.",
      findLawyer: "Trouver un Avocat",
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
      google: "Continuer avec Google",
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
      close: "Fermer",
    },
    chatbot: {
      title: "Assistant Juribot",
      placeholder: "Posez une question sur une loi, un contrat...",
      disclaimer:
        "⚠️ IMPORTANT : Juribot est une IA, pas un avocat. Elle peut faire des erreurs. Les infos sont à titre documentaire. Consultez toujours un professionnel.",
      welcome:
        "Bonjour ! Je suis Juribot. Je peux vous aider à rechercher des textes de loi (Légifrance, Dalloz) ou vulgariser des termes. Comment puis-je vous aider ?",
      sources: "Sources trouvées :",
    },
    booking: {
      youSelected: "Vous avez sélectionné le",
      selectDay: "Veuillez sélectionner un jour.",
      availableSlotsFor: "Créneaux disponibles pour le",
      noSlots: "Aucun créneau disponible.",
      confirmMessage: "Rendez-vous confirmé avec",
      confirmOn: "le",
      selectSlotFirst: "Veuillez d'abord sélectionner un créneau horaire.",
    },
  },
};

// Helper to translate specialties
const SPECIALTY_TRANSLATIONS: Record<
  LegalSpecialty,
  { en: string; fr: string }
> = {
  [LegalSpecialty.CRIMINAL]: { en: "Criminal Law", fr: "Droit Pénal" },
  [LegalSpecialty.FAMILY]: { en: "Family Law", fr: "Droit de la Famille" },
  [LegalSpecialty.CORPORATE]: { en: "Corporate Law", fr: "Droit des Affaires" },
  [LegalSpecialty.REAL_ESTATE]: { en: "Real Estate", fr: "Droit Immobilier" },
  [LegalSpecialty.LABOR]: { en: "Labor Law", fr: "Droit du Travail" },
  [LegalSpecialty.IP]: {
    en: "Intellectual Property",
    fr: "Propriété Intellectuelle",
  },
  [LegalSpecialty.IMMIGRATION]: {
    en: "Immigration",
    fr: "Droit des Étrangers",
  },
  [LegalSpecialty.TAX]: { en: "Tax Law", fr: "Droit Fiscal" },
  [LegalSpecialty.GENERAL]: { en: "General Practice", fr: "Droit Général" },
};

interface AppState {
  currentUser: User | null;
  isAuthLoading: boolean;
  lawyers: Lawyer[];
  appointments: Appointment[];
  darkMode: boolean;
  language: Language;
  isLoadingLawyers: boolean;
  t: (typeof TRANSLATIONS)["en"];
  // Chat State
  isChatOpen: boolean;
  toggleChat: () => void;
  unreadMessagesCount: number;

  translateSpecialty: (s: LegalSpecialty) => string;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: (role?: UserRole) => Promise<{ isNewUser: boolean }>;
  loginMicrosoft: (role?: UserRole) => Promise<{ isNewUser: boolean }>;
  register: (
    email: string,
    password: string,
    role: UserRole,
    name: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  bookAppointment: (
    lawyerId: string,
    date: string,
    type: Appointment["type"],
    notes: string,
    duration?: number
  ) => Promise<void>;
  acceptAppointment: (appointmentId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  deleteAppointment: (appointmentId: string) => Promise<void>;
  deleteClientPortfolio: (clientId: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("fr");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = session?.user ?? null;
      if (supabaseUser) {
        console.log("👤 User logged in:", supabaseUser.email, "UID:", supabaseUser.id);
          (async () => {
            try {
              let userProfile = await getUserProfile(supabaseUser.id);

              // Retry logic for race conditions (registration)
              if (!userProfile) {
                console.log("⏳ Profile not found immediately, retrying in 1s...");
                await new Promise(r => setTimeout(r, 1000));
                userProfile = await getUserProfile(supabaseUser.id);
              }
              if (!userProfile) {
                console.log("⏳ Profile still not found, retrying in 2s...");
                await new Promise(r => setTimeout(r, 2000));
                userProfile = await getUserProfile(supabaseUser.id);
              }

              if (userProfile) {
              // Block disabled accounts (app-level). They can still sign-in to Firebase Auth,
              // but we immediately sign them out and deny access to the UI.
              if ((userProfile as any).disabled === true) {
                alert("Ce compte a été désactivé. Contactez le support si besoin.");
                try {
                  await logoutUser();
                } finally {
                  setCurrentUser(null);
                  setAppointments([]);
                  setIsAuthLoading(false);
                }
                return;
              }
              console.log("✅ User profile loaded:", {
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                role: userProfile.role,
              });
              setCurrentUser(userProfile);

              // Initialize Stream Chat client (async, non-blocking)
              (async () => {
                try {
                  const { initializeStreamClient, getUnreadMessageCount } =
                    await import("../services/streamService");
                  await initializeStreamClient(
                    userProfile.id,
                    userProfile.name,
                    userProfile.role
                  );
                  console.log("✅ Stream client initialized");

                  // Charger le nombre de messages non lus
                  try {
                    const unreadCount = await getUnreadMessageCount(
                      userProfile.id
                    );
                    setUnreadMessagesCount(unreadCount);

                    // Écouter les nouveaux messages pour mettre à jour le compteur
                    const { getStreamClient } = await import(
                      "../services/streamService"
                    );
                    const client = getStreamClient();
                    if (client) {
                      const updateUnreadCount = async () => {
                        try {
                          const count = await getUnreadMessageCount(
                            userProfile.id
                          );
                          setUnreadMessagesCount(count);
                        } catch (e) {
                          // Ignorer les erreurs
                        }
                      };

                      client.on("message.new", updateUnreadCount);
                      client.on("message.read", updateUnreadCount);
                      client.on("notification.message_new", updateUnreadCount);
                    }
                  } catch (unreadError) {
                    console.error(
                      "⚠️ Error loading unread count:",
                      unreadError
                    );
                  }
                } catch (streamError) {
                  console.error(
                    "⚠️ Error initializing Stream client (non-blocking):",
                    streamError
                  );
                  // Ne pas bloquer la connexion si Stream échoue
                }
              })();

              // Load appointments (this is now handled by the real-time listener below)
              // const userAppointments = await getUserAppointments(userProfile.id, userProfile.role);
              // setAppointments(userAppointments);
            } else {
              // New OAuth user — trigger created profiles row but clients row may be missing
              console.warn("⚠️ User profile not found after retries. Creating for OAuth user:", supabaseUser.id);
              const pendingRole = localStorage.getItem('jurilab_pending_role') as UserRole || UserRole.CLIENT;
              localStorage.removeItem('jurilab_pending_role');
              try {
                // Ensure profiles row exists (trigger may have failed)
                await supabase.from('profiles').upsert({
                  id: supabaseUser.id,
                  email: supabaseUser.email,
                  name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
                  role: pendingRole,
                }, { onConflict: 'id' });
                // Create role-specific row
                if (pendingRole === UserRole.LAWYER) {
                  await supabase.from('lawyers').upsert({ id: supabaseUser.id, specialty: 'General Practice', bio: '', location: '' }, { onConflict: 'id' });
                } else {
                  await supabase.from('clients').upsert({ id: supabaseUser.id }, { onConflict: 'id' });
                }
                // Re-fetch profile
                const newProfile = await getUserProfile(supabaseUser.id);
                if (newProfile) {
                  console.log("✅ OAuth user profile created:", newProfile.name);
                  setCurrentUser(newProfile);
                }
              } catch (createError) {
                console.error("❌ Failed to create OAuth user profile:", createError);
              }
            }
          } catch (e) {
            console.error("❌ Error fetching user profile:", e);
          } finally {
            setIsAuthLoading(false);
          }
        })();
      } else {
        console.log("👋 User logged out");
        setCurrentUser(null);
        setAppointments([]);
        setIsAuthLoading(false);

        // Disconnect Stream client (async, non-blocking)
        (async () => {
          try {
            const { disconnectStreamClient } = await import(
              "../services/streamService"
            );
            await disconnectStreamClient();
            console.log("✅ Stream client disconnected");
          } catch (streamError) {
            console.error("⚠️ Error disconnecting Stream client:", streamError);
          }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time appointment listener
  useEffect(() => {
    if (!currentUser) {
      setAppointments([]);
      return;
    }

    const unsubscribe = subscribeToAppointments(
      currentUser.id,
      currentUser.role,
      (newAppointments) => {
        setAppointments(newAppointments);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Load lawyers from Firebase with IndexedDB caching (for large datasets)
  useEffect(() => {
    const DB_NAME = 'jurilab_cache';
    const STORE_NAME = 'lawyers';
    const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

    // IndexedDB helpers for large data caching
    const openDB = (): Promise<IDBDatabase> => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
      });
    };

    const getCachedLawyers = async (): Promise<{ lawyers: Lawyer[]; timestamp: number } | null> => {
      try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get('data');
          request.onerror = () => { db.close(); reject(request.error); };
          request.onsuccess = () => { db.close(); resolve(request.result || null); };
        });
      } catch {
        return null;
      }
    };

    const setCachedLawyers = async (lawyers: Lawyer[]): Promise<void> => {
      try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put({ lawyers, timestamp: Date.now() }, 'data');
          request.onerror = () => { db.close(); reject(request.error); };
          request.onsuccess = () => { db.close(); resolve(); };
        });
      } catch (error) {
        console.warn("⚠️ Could not cache lawyers to IndexedDB:", error);
      }
    };

    const loadLawyers = async () => {
      try {
        setIsLoadingLawyers(true);
        const now = Date.now();
        
        // Try to load from IndexedDB cache first
        const cached = await getCachedLawyers();
        
        if (cached && cached.lawyers && cached.lawyers.length > 0) {
          const cacheAge = now - cached.timestamp;
          if (cacheAge < CACHE_DURATION_MS) {
            console.log(`⚡ Loaded ${cached.lawyers.length} lawyers from IndexedDB cache (${Math.round(cacheAge / 1000)}s old)`);
            setLawyers(cached.lawyers);
            setIsLoadingLawyers(false);
            
            // Refresh in background if cache is older than 1 minute
            if (cacheAge > 60 * 1000) {
              console.log("🔄 Refreshing lawyers in background...");
              refreshLawyersInBackground();
            }
            return;
          }
        }
        
        // No valid cache, load from Supabase
        console.log("🗄️ Loading lawyers from Supabase...");
        const lawyersData = await loadLawyers();

        if (lawyersData.length === 0) {
          console.warn(
            "⚠️ No lawyers in Supabase yet. You need to upload the CSV first."
          );
        } else {
          setLawyers(lawyersData);
          console.log(`✅ Loaded ${lawyersData.length} lawyers from Supabase`);

          // Cache the data to IndexedDB (no size limit like localStorage)
          await setCachedLawyers(lawyersData);
          console.log("💾 Lawyers data cached to IndexedDB");
        }
      } catch (error) {
        console.error("❌ Failed to load lawyers from Supabase:", error);

        // Try to use cached data as fallback
        try {
          const cached = await getCachedLawyers();
          if (cached && cached.lawyers && cached.lawyers.length > 0) {
            console.log(`⚠️ Using stale cache (${cached.lawyers.length} lawyers) due to Supabase error`);
            setLawyers(cached.lawyers);
          }
        } catch (cacheError) {
          console.error("❌ Cache also failed:", cacheError);
        }
      } finally {
        setIsLoadingLawyers(false);
      }
    };

    const refreshLawyersInBackground = async () => {
      try {
        const lawyersData = await loadLawyers();
        if (lawyersData.length > 0) {
          setLawyers(lawyersData);
          await setCachedLawyers(lawyersData);
          console.log(`✅ Background refresh complete: ${lawyersData.length} lawyers`);
        }
      } catch (error) {
        console.warn("⚠️ Background refresh failed:", error);
      }
    };

    loadLawyers();
  }, []);

  // Check system preference on mount
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  const login = async (email: string, password: string) => {
    await loginUser(email, password);
  };

  const loginGoogle = async (role?: UserRole): Promise<{ isNewUser: boolean }> => {
    const result = await loginWithGoogle(role);
    return { isNewUser: result.isNewUser };
  };

  const loginMicrosoft = async (role?: UserRole): Promise<{ isNewUser: boolean }> => {
    const result = await loginWithMicrosoft(role);
    return { isNewUser: result.isNewUser };
  };

  const register = async (
    email: string,
    password: string,
    role: UserRole,
    name: string
  ) => {
    await registerUser(email, password, role, name);
  };

  const logout = async () => {
    // Disconnect Stream client before logging out
    try {
      const { disconnectStreamClient } = await import(
        "../services/streamService"
      );
      await disconnectStreamClient();
    } catch (streamError) {
      console.error("⚠️ Error disconnecting Stream client:", streamError);
    }

    await logoutUser();
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleChat = () => setIsChatOpen((prev) => !prev);

  const bookAppointment = async (
    lawyerId: string,
    date: string,
    type: Appointment["type"],
    notes: string,
    duration?: number
  ) => {
    if (!currentUser) return;

    // Vérifier les conflits de créneaux avant de créer le RDV
    try {
      const conflictCheck = await checkAppointmentConflict(
        lawyerId,
        currentUser.id,
        date,
        duration || 60
      );

      if (conflictCheck.hasConflict) {
        alert(
          conflictCheck.conflictReason || "Ce créneau n'est plus disponible"
        );
        throw new Error(conflictCheck.conflictReason || "Time slot conflict");
      }
    } catch (error: any) {
      if (
        error.message?.includes("conflict") ||
        error.message?.includes("créneau")
      ) {
        throw error; // Re-throw les erreurs de conflit
      }
      console.error("Error checking conflicts:", error);
      // Continuer même si la vérification échoue (pour ne pas bloquer)
    }

    // Ne pas créer la salle Daily.co maintenant - on la créera quand l'avocat acceptera
    // Cela évite de créer des salles pour des RDV qui ne seront peut-être pas acceptés

    // Récupérer les noms pour les stocker dans l'appointment
    // Si lawyers n'est pas encore chargé, utiliser getLawyerById
    let lawyer = lawyers.find((l) => l.id === lawyerId);
    if (!lawyer) {
      const { getLawyerById } = await import("../services/supabaseService");
      lawyer = await getLawyerById(lawyerId);
    }
    const lawyerName = lawyer?.name || "Avocat";
    const clientName = currentUser.name || "Client";

    const newAppt: Appointment = {
      id: "appt_" + Date.now(),
      lawyerId,
      clientId: currentUser.id,
      lawyerName, // Stocker le nom de l'avocat
      clientName, // Stocker le nom du client
      date,
      status: "PENDING", // Statut initial : en attente d'acceptation
      type,
      notes,
      duration: duration || 60,
      // Ne pas créer la salle Daily.co maintenant
    };

    try {
      await createAppointment(newAppt);
      console.log("✅ Appointment created successfully (pending acceptance)");

      // Créer automatiquement un channel GetStream pour la messagerie
      try {
        const {
          initializeStreamClient,
          createOrGetChatChannel,
          getStreamClient,
        } = await import("../services/streamService");

        // Initialiser le client Stream si ce n'est pas déjà fait
        const streamClient = getStreamClient();
        if (!streamClient) {
          await initializeStreamClient(
            currentUser.id,
            currentUser.name,
            currentUser.role
          );
        }

        // Créer ou récupérer le channel de chat
        const channel = await createOrGetChatChannel(
          lawyerId,
          currentUser.id,
          newAppt.id
        );

        // Stocker le channelId dans l'appointment
        await updateAppointmentField(newAppt.id, { channel_id: channel.id });

        console.log("✅ Chat channel created:", channel.id);
      } catch (streamError) {
        console.error(
          "⚠️ Error creating chat channel (non-blocking):",
          streamError
        );
        // Ne pas bloquer la création de l'appointment si le channel échoue
      }

      alert(
        "Votre demande de rendez-vous a été envoyée. L'avocat doit l'accepter pour confirmer."
      );
    } catch (e) {
      console.error("Error booking appointment:", e);
      alert("Erreur lors de la réservation.");
      throw e;
    }
  };

  const acceptAppointment = async (appointmentId: string) => {
    if (!currentUser || currentUser.role !== UserRole.LAWYER) {
      throw new Error("Seuls les avocats peuvent accepter des rendez-vous");
    }

    try {
      // Récupérer l'appointment pour vérifier qu'il est bien pour cet avocat
      const { getAllAppointments } = await import(
        "../services/supabaseService"
      );
      const allAppointments = await getAllAppointments();
      const appointment = allAppointments.find((a) => a.id === appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (appointment.lawyerId !== currentUser.id) {
        throw new Error("Vous ne pouvez accepter que vos propres rendez-vous");
      }

      // Vérifier les conflits avant d'accepter (exclure l'appointment qu'on est en train d'accepter)
      const conflictCheck = await checkAppointmentConflict(
        appointment.lawyerId,
        appointment.clientId,
        appointment.date,
        appointment.duration || 60,
        appointmentId // Exclure cet appointment de la vérification
      );

      if (conflictCheck.hasConflict) {
        alert(
          conflictCheck.conflictReason || "Ce créneau n'est plus disponible"
        );
        throw new Error(conflictCheck.conflictReason || "Time slot conflict");
      }

      // Si c'est une visioconférence, créer la salle Daily.co maintenant
      let dailyRoomUrl: string | undefined;
      let dailyRoomId: string | undefined;

      if (appointment.type === "VIDEO") {
        try {
          const { createRoom } = await import("../services/dailyService");
          const room = await createRoom(
            appointmentId,
            appointment.lawyerName || "Avocat",
            appointment.clientName || "Client",
            appointment.duration || 60
          );

          dailyRoomUrl = room.roomUrl;
          dailyRoomId = room.roomId;

          console.log(`✅ Daily.co room created: ${dailyRoomId}`);
        } catch (error) {
          console.error("❌ Error creating Daily.co room:", error);
          // Continuer quand même - on peut créer la salle plus tard
        }
      }

      // Accepter le rendez-vous et mettre à jour avec la salle si créée
      await acceptAppointmentService(appointmentId);

      if (dailyRoomUrl && dailyRoomId) {
        await updateAppointmentField(appointmentId, { daily_room_url: dailyRoomUrl, daily_room_id: dailyRoomId });
      }

      // Récupérer l'appointment mis à jour (avec le statut CONFIRMED)
      const updatedAppointment = {
        ...appointment,
        status: "CONFIRMED" as Appointment["status"],
      };

      // Synchroniser avec Google Calendar (non-bloquant)
      console.log(
        "📍📍📍 SYNC GOOGLE CALENDAR START - Appointment ID:",
        updatedAppointment.id
      );
      console.log("📍📍📍 Appointment details:", {
        id: updatedAppointment.id,
        lawyerId: updatedAppointment.lawyerId,
        date: updatedAppointment.date,
        status: updatedAppointment.status,
      });
      try {
        const { syncAppointmentToGoogleCalendar } = await import(
          "../services/supabaseService"
        );
        console.log("✅ syncAppointmentToGoogleCalendar imported successfully");
        const eventId = await syncAppointmentToGoogleCalendar(
          updatedAppointment
        );
        console.log("✅ Appointment synced to Google Calendar:", eventId);
      } catch (error) {
        console.error("⚠️ Error syncing to Google Calendar (non-blocking):", error);
      }
    } catch (error) {
      console.error("Error accepting appointment:", error);
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { cancelAppointment: cancelService } = await import("../services/supabaseService");
      await cancelService(appointmentId);

      // Mettre à jour l'état local
      setAppointments(prev => prev.map(a =>
        a.id === appointmentId ? { ...a, status: 'CANCELLED' } : a
      ));
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      const { updateUserProfile } = await import("../services/supabaseService");
      await updateUserProfile(currentUser.id, data);

      // Update local state immediately for responsiveness
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);

    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      const { deleteAppointmentData } = await import("../services/supabaseService");
      await deleteAppointmentData(appointmentId);
      // setAppointments is handled by the real-time listener
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  };

  const deleteClientPortfolio = async (clientId: string) => {
    if (!currentUser) return;
    try {
      const { deleteAppointmentData } = await import("../services/supabaseService");
      const appointmentsToDelete = appointments.filter(
        a => a.lawyerId === currentUser.id && a.clientId === clientId
      );

      await Promise.all(
        appointmentsToDelete.map(a => deleteAppointmentData(a.id))
      );
      // setAppointments is handled by the real-time listener
    } catch (error) {
      console.error("Error deleting client portfolio:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        lawyers,
        appointments,
        darkMode,
        language,
        isLoadingLawyers,
        t: TRANSLATIONS[language],
        isChatOpen,
        toggleChat,
        unreadMessagesCount,
        translateSpecialty: (s) => SPECIALTY_TRANSLATIONS[s]?.[language] || s,
        setLanguage,
        login,
        loginGoogle,
        loginMicrosoft,
        register,
        logout,
        toggleDarkMode,
        bookAppointment,
        acceptAppointment,
        cancelAppointment,
        updateProfile,
        deleteAppointment,
        deleteClientPortfolio
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
