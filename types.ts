export enum UserRole {
  CLIENT = 'CLIENT',
  LAWYER = 'LAWYER',
  ADMIN = 'ADMIN'
}

export enum LegalSpecialty {
  CRIMINAL = 'Criminal Law',
  FAMILY = 'Family Law',
  CORPORATE = 'Corporate Law',
  REAL_ESTATE = 'Real Estate',
  LABOR = 'Labor Law',
  IP = 'Intellectual Property',
  IMMIGRATION = 'Immigration',
  TAX = 'Tax Law',
  GENERAL = 'General Practice'
}

export enum ProfileBlockType {
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
  VIDEO = 'VIDEO',
  CONTACT = 'CONTACT',
  LOGO = 'LOGO',
  MAP = 'MAP',
  STATS = 'STATS',
  TESTIMONIALS = 'TESTIMONIALS',
  CERTIFICATIONS = 'CERTIFICATIONS',
  SOCIAL = 'SOCIAL',
  COLLABORATORS = 'COLLABORATORS',
}

export type ProfileBlockSize = 'small' | 'medium' | 'large' | 'full' | 'tall' | 'wide' | 'hero' | 'square';

export type ProfileBlockStylePreset = 'clean' | 'cream' | 'glass' | 'primary' | 'dark' | 'custom';

export interface ProfileBlock {
  id: string;
  type: ProfileBlockType;
  title?: string;
  content?: string; // For text or media URL
  order: number;
  size: ProfileBlockSize;
  stylePreset?: ProfileBlockStylePreset; // Visual style preset for the block
  customBgColor?: string; // Custom background color (hex)
  customTextColor?: string; // Custom text color (hex) - 'light' or 'dark' for auto
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  /** If true, user can still sign-in to Firebase Auth but app access is blocked and rules can deny writes. */
  disabled?: boolean;
  /** If true, user has completed their profile after OAuth signup */
  profileCompleted?: boolean;
  /** Phone number */
  phone?: string;
  /** Date the user joined */
  createdAt?: string;
}

/**
 * Représente une tranche horaire de disponibilité (ex: 09:00 - 12:00)
 */
export interface TimeSlot {
  start: string; // Format HH:mm (ex: "09:00")
  end: string; // Format HH:mm (ex: "12:00")
}

/**
 * Heures de disponibilité pour un jour de la semaine
 */
export interface DayAvailability {
  enabled: boolean; // Si l'avocat est disponible ce jour
  timeSlots: TimeSlot[]; // Tranches horaires (ex: [{start: "09:00", end: "12:00"}, {start: "14:00", end: "18:00"}])
}

/**
 * Heures de disponibilité hebdomadaires de l'avocat
 */
export interface AvailabilityHours {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface Lawyer extends User {
  role: UserRole.LAWYER;
  specialty: LegalSpecialty;
  bio: string;
  location: string;
  coordinates: { lat: number; lng: number };
  hourlyRate: number;
  languages: string[];
  availableSlots: string[]; // ISO date strings (legacy, pour compatibilité)
  firmName?: string;
  yearsExperience: number;
  profileConfig?: ProfileBlock[];
  rating?: number;
  reviewCount?: number;
  // Google Calendar integration
  googleCalendarConnected?: boolean; // Si le calendrier Google est connecté
  googleCalendarAccessToken?: string; // Token d'accès Google (chiffré)
  googleCalendarRefreshToken?: string; // Token de rafraîchissement (chiffré)
  googleCalendarLastSyncAt?: string; // ISO timestamp de la dernière synchronisation
  // Outlook Calendar integration
  outlookCalendarConnected?: boolean; // Si le calendrier Outlook est connecté
  outlookCalendarAccessToken?: string; // Token d'accès Outlook (chiffré)
  outlookCalendarRefreshToken?: string; // Token de rafraîchissement (chiffré)
  outlookCalendarLastSyncAt?: string; // ISO timestamp de la dernière synchronisation
  // Heures de disponibilité
  availabilityHours?: AvailabilityHours; // Heures de disponibilité hebdomadaires
  // Additional fields from registration
  postalCode?: string;
  phone?: string;
  barNumber?: string;
  education?: any[];
  certifications?: any[];
  cases?: { total: number; won: number; settled: number };
  verified?: boolean;
  responseTime?: string;
}

export interface Client extends User {
  role: UserRole.CLIENT;
  favorites: string[]; // Lawyer IDs
  /** City/location for better lawyer recommendations */
  location?: string;
  /** Preferred legal specialties */
  preferredSpecialties?: LegalSpecialty[];
}

export interface Appointment {
  id: string;
  lawyerId: string;
  clientId: string;
  lawyerName?: string; // Nom de l'avocat (stocké pour affichage rapide)
  clientName?: string; // Nom du client (stocké pour affichage rapide)
  date: string; // ISO string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  type: 'VIDEO' | 'IN_PERSON' | 'PHONE';
  // Daily.co visioconférence
  dailyRoomUrl?: string; // URL de la salle Daily.co
  dailyRoomId?: string; // ID de la salle
  duration?: number; // Durée en minutes (30, 60, etc.)
  // Transcript et résumé
  transcript?: string; // Transcript de la réunion (stocké après la fin)
  summary?: string; // Résumé généré par Gemini
  summaryShared?: boolean; // Si l'avocat a partagé le résumé avec le client
  meetingEndedAt?: string; // Timestamp ISO de fin de réunion
  // GetStream.io Chat
  channelId?: string; // ID du channel GetStream pour la messagerie
  // Google Calendar integration
  googleCalendarEventId?: string; // ID de l'événement dans Google Calendar (pour synchronisation)
}

/**
 * Représente un channel de chat GetStream stocké dans Firebase
 */
export interface ChatChannel {
  channelId: string; // ID du channel GetStream (format: "lawyer-{lawyerId}-client-{clientId}")
  lawyerId: string;
  clientId: string;
  appointmentId?: string; // ID de l'appointment lié (optionnel)
  createdAt: string; // ISO string
  lastMessageAt?: string; // ISO string - timestamp du dernier message
}

export interface SearchFilters {
  query: string;
  specialty?: LegalSpecialty;
  location?: string;
  maxPrice?: number;
  date?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
  sources?: { title: string; uri: string }[];
  isError?: boolean;
}

/**
 * Types pour l'intégration Google Calendar
 */
export interface GoogleCalendarCredentials {
  googleCalendarConnected: boolean;
  googleCalendarAccessToken?: string; // Chiffré
  googleCalendarRefreshToken?: string; // Chiffré
  googleCalendarLastSyncAt?: string; // ISO timestamp
}

/**
 * Événement Google Calendar
 */
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  description?: string;
  location?: string;
}

/**
 * Types for Document Sharing
 */
export type DocumentFileType = 'PDF' | 'DOC' | 'DOCX' | 'TXT' | 'IMAGE';

export interface Document {
  id: string;
  name: string;                    // Display name
  fileName: string;                // Original file name
  fileUrl: string;                 // Firebase Storage URL
  fileType: DocumentFileType;
  fileSize: number;                // Size in bytes
  uploadedAt: string;              // ISO timestamp
  uploadedBy: string;              // User ID (lawyer or client)
  uploadedByRole: UserRole;        // Who uploaded it
  lawyerId: string;                // Associated lawyer
  clientId: string;                // Associated client
  appointmentId?: string;          // Optional link to appointment
  description?: string;            // Optional description
  aiSummary?: string;              // AI-generated summary (cached)
  sharedWithClient: boolean;       // Visibility flag
  lawyerNote?: string;             // Private note from lawyer
  lawyerNoteUpdatedAt?: string;    // When the note was last updated
}

/**
 * Représente une entrée de diligence (time tracking)
 */
export interface DiligenceEntry {
  id: string;
  lawyerId: string;              // Avocat qui a effectué la diligence
  clientId: string;              // Client pour lequel le travail a été fait
  startTime: string;             // ISO timestamp de début
  endTime?: string;              // ISO timestamp de fin (undefined si en cours)
  duration?: number;             // Durée en secondes (calculée après arrêt)
  description: string;           // Description du travail effectué
  category?: string;             // Type de diligence (ex: "Recherche", "Rédaction", "Révision", etc.)
  createdAt: string;             // ISO timestamp de création
  updatedAt: string;             // ISO timestamp de dernière modification
  billable?: boolean;            // Si c'est facturable ou non
}

/**
 * Types pour l'intégration Outlook Calendar
 */
export interface OutlookCalendarCredentials {
  outlookCalendarConnected: boolean;
  outlookCalendarAccessToken?: string; // Chiffré
  outlookCalendarRefreshToken?: string; // Chiffré
  outlookCalendarLastSyncAt?: string; // ISO timestamp
}

/**
 * Événement personnel créé dans Jurilab
 */
export interface PersonalEvent {
  id: string;
  userId: string;               // ID de l'utilisateur propriétaire
  title: string;
  start: string;                // ISO timestamp
  end: string;                  // ISO timestamp
  allDay?: boolean;
  description?: string;
  location?: string;
  color?: string;               // Couleur personnalisée
  type?: 'EVENT' | 'AVAILABILITY'; // Type d'événement
  googleCalendarEventId?: string; // ID de l'événement Google Calendar associé
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}

/**
 * Type d'événement dans le calendrier unifié
 */
export type CalendarEventType = 'APPOINTMENT' | 'GOOGLE' | 'OUTLOOK' | 'PERSONAL' | 'AVAILABILITY';

/**
 * Source d'un événement
 */
export type CalendarEventSource = 'JURILAB' | 'GOOGLE' | 'OUTLOOK';

/**
 * Événement du calendrier unifié (tous les événements de toutes sources)
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  type: CalendarEventType;
  source: CalendarEventSource;
  sourceEventId?: string;       // ID original dans la source
  description?: string;
  location?: string;
  appointment?: Appointment;    // Si c'est un rendez-vous Jurilab
  editable: boolean;            // Si l'événement peut être modifié
  deletable: boolean;           // Si l'événement peut être supprimé
}