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

export interface ProfileBlock {
  id: string;
  type: ProfileBlockType;
  title?: string;
  content?: string; // For text or media URL
  order: number;
  size: ProfileBlockSize;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Lawyer extends User {
  role: UserRole.LAWYER;
  specialty: LegalSpecialty;
  bio: string;
  location: string;
  coordinates: { lat: number; lng: number };
  hourlyRate: number;
  languages: string[];
  availableSlots: string[]; // ISO date strings
  firmName?: string;
  yearsExperience: number;
  profileConfig?: ProfileBlock[];
  rating?: number;
  reviewCount?: number;
}

export interface Client extends User {
  role: UserRole.CLIENT;
  phone?: string;
  favorites: string[]; // Lawyer IDs
}

export interface Appointment {
  id: string;
  lawyerId: string;
  clientId: string;
  date: string; // ISO string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  type: 'VIDEO' | 'IN_PERSON' | 'PHONE';
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