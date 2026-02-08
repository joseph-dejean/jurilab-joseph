export enum CalendarViewType {
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  AGENDA = 'agenda'
}

export enum EventSource {
  LOCAL = 'local',
  GOOGLE = 'google',
  OUTLOOK = 'outlook'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  source: EventSource;
  color?: string;
  isAllDay?: boolean;
  meetingLink?: string;
  type?: 'EVENT' | 'AVAILABILITY';
  editable?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface IntegrationsStatus {
  google: boolean;
  outlook: boolean;
}

// For Gemini parsing
export interface ParsedEventIntent {
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  description?: string;
  location?: string;
  isAllDay?: boolean;
}
