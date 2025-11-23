import { onAuthStateChanged } from "firebase/auth";
import { ref, update } from "firebase/database";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, database } from "../firebaseConfig";
import {
  acceptAppointment as acceptAppointmentService,
  cancelAppointment as cancelAppointmentService,
  checkAppointmentConflict,
  createAppointment,
  getUserProfile,
  loadLawyersFromFirebase,
  loginUser,
  loginWithGoogle,
  logoutUser,
  registerUser,
  subscribeToAppointments,
} from "../services/firebaseService";
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
        "Trouvez et réservez les meilleurs avocats de votre région. Du conseil spécialisé à la représentation complète, Jurilab vous connecte instantanément.",
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
  loginGoogle: (role?: UserRole) => Promise<void>;
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
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>("fr");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        console.log(
          "👤 User logged in:",
          firebaseUser.email,
          "UID:",
          firebaseUser.uid
        );
        // Charger le profil de manière asynchrone pour ne pas bloquer
        (async () => {
          try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            if (userProfile) {
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
              // Fallback if profile creation is delayed
              console.warn(
                "⚠️ User profile not found in DB immediately. UID:",
                firebaseUser.uid
              );
              console.warn(
                "⚠️ This might happen if the user was created manually in Firebase Auth but not in Realtime Database."
              );
              // Retry logic could go here, but for now relying on create logic to have finished
            }
          } catch (e) {
            console.error("❌ Error fetching user profile:", e);
          }
        })();
      } else {
        console.log("👋 User logged out");
        setCurrentUser(null);
        setAppointments([]);

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

    return () => unsubscribe();
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

  // Load lawyers from Firebase on mount
  useEffect(() => {
    const loadLawyers = async () => {
      try {
        setIsLoadingLawyers(true);
        console.log("🔥 Loading lawyers from Firebase...");
        const lawyersData = await loadLawyersFromFirebase();

        if (lawyersData.length === 0) {
          console.warn(
            "⚠️ No lawyers in Firebase yet. You need to upload the CSV first."
          );
        } else {
          setLawyers(lawyersData);
          console.log(`✅ Loaded ${lawyersData.length} lawyers from Firebase`);
        }
      } catch (error) {
        console.error("❌ Failed to load lawyers from Firebase:", error);
      } finally {
        setIsLoadingLawyers(false);
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

  const loginGoogle = async (role?: UserRole) => {
    await loginWithGoogle(role);
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
      const { getLawyerById } = await import("../services/firebaseService");
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
        const { ref, update } = await import("firebase/database");
        const { database } = await import("../firebaseConfig");
        const apptRef = ref(database, `appointments/${newAppt.id}`);
        await update(apptRef, { channelId: channel.id });

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
        "../services/firebaseService"
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
        const apptRef = ref(database, `appointments/${appointmentId}`);
        await update(apptRef, { dailyRoomUrl, dailyRoomId });
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
          "../services/firebaseService"
        );
        console.log("✅ syncAppointmentToGoogleCalendar imported successfully");
        const eventId = await syncAppointmentToGoogleCalendar(
          updatedAppointment
        );
        if (eventId) {
          console.log(
            "✅ Appointment synced to Google Calendar, event ID:",
            eventId
          );
        } else {
          console.log(
            "⚠️ Google Calendar sync returned null (calendar not connected?)"
          );
        }
      } catch (calError) {
        console.error(
          "⚠️ Error syncing to Google Calendar (non-blocking):",
          calError
        );
      }

      console.log("✅ Appointment accepted successfully");
    } catch (error: any) {
      console.error("Error accepting appointment:", error);
      alert(error.message || "Erreur lors de l'acceptation du rendez-vous");
      throw error;
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    if (!currentUser) {
      throw new Error("Vous devez être connecté pour annuler un rendez-vous");
    }

    try {
      // Vérifier que l'utilisateur peut annuler ce RDV
      const { getAllAppointments } = await import(
        "../services/firebaseService"
      );
      const allAppointments = await getAllAppointments();
      const appointment = allAppointments.find((a) => a.id === appointmentId);

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      if (
        appointment.clientId !== currentUser.id &&
        appointment.lawyerId !== currentUser.id
      ) {
        throw new Error("Vous ne pouvez annuler que vos propres rendez-vous");
      }

      // Vérifier qu'on est à plus de 24h avant le RDV
      const aptDate = new Date(appointment.date);
      const now = new Date();
      const hoursUntilAppointment =
        (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        throw new Error(
          "Impossible d'annuler un rendez-vous moins de 24 heures avant l'heure prévue"
        );
      }

      await cancelAppointmentService(appointmentId);

      // Synchroniser avec Google Calendar (non-bloquant)
      try {
        const { deleteGoogleCalendarEvent } = await import(
          "../services/firebaseService"
        );
        await deleteGoogleCalendarEvent(appointment);
        console.log("✅ Google Calendar event deleted");
      } catch (calError) {
        console.error(
          "⚠️ Error deleting Google Calendar event (non-blocking):",
          calError
        );
      }

      console.log("✅ Appointment cancelled successfully");
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      alert(error.message || "Erreur lors de l'annulation du rendez-vous");
      throw error;
    }
  };

  const translateSpecialty = (s: LegalSpecialty) => {
    return SPECIALTY_TRANSLATIONS[s][language];
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        lawyers,
        appointments,
        darkMode,
        language,
        setLanguage,
        t: TRANSLATIONS[language],
        translateSpecialty,
        isChatOpen,
        toggleChat,
        isLoadingLawyers,
        unreadMessagesCount,
        login,
        loginGoogle,
        register,
        logout,
        toggleDarkMode,
        bookAppointment,
        acceptAppointment,
        cancelAppointment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
