/**
 * supabaseService.ts
 * Drop-in replacement for firebaseService.ts — same exported function names,
 * same signatures. Backed by Supabase (PostgreSQL + Auth + Storage + Realtime).
 */

import { supabase } from '../supabaseClient';
import {
  Lawyer, Client, UserRole, Appointment, User, ProfileBlock,
  AvailabilityHours, PersonalEvent,
  GoogleCalendarCredentials, OutlookCalendarCredentials,
} from '../types';
import {
  encryptToken, decryptToken,
  getGoogleCalendarEvents as fetchGoogleEvents,
  refreshGoogleAccessToken,
} from './googleCalendarService';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — row → TypeScript type mappers
// ─────────────────────────────────────────────────────────────────────────────

function rowToProfile(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    disabled: row.disabled,
    profileCompleted: row.profile_completed,
    createdAt: row.created_at,
  };
}

function rowToLawyer(profile: any, lawyer: any): Lawyer {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: UserRole.LAWYER,
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
    disabled: profile.disabled,
    profileCompleted: profile.profile_completed,
    createdAt: profile.created_at,
    specialty: lawyer.specialty,
    bio: lawyer.bio,
    location: lawyer.location,
    coordinates: lawyer.coordinates,
    hourlyRate: lawyer.hourly_rate,
    languages: lawyer.languages || [],
    availableSlots: lawyer.available_slots || [],
    firmName: lawyer.firm_name,
    yearsExperience: lawyer.years_experience,
    profileConfig: lawyer.profile_config,
    rating: lawyer.rating,
    reviewCount: lawyer.review_count,
    postalCode: lawyer.postal_code,
    barNumber: lawyer.bar_number,
    education: lawyer.education,
    certifications: lawyer.certifications,
    cases: lawyer.cases,
    verified: lawyer.verified,
    responseTime: lawyer.response_time,
    availabilityHours: lawyer.availability_hours,
    googleCalendarConnected: lawyer.google_calendar_connected,
    googleCalendarAccessToken: lawyer.google_calendar_access_token,
    googleCalendarRefreshToken: lawyer.google_calendar_refresh_token,
    googleCalendarLastSyncAt: lawyer.google_calendar_last_sync_at,
    outlookCalendarConnected: lawyer.outlook_calendar_connected,
    outlookCalendarAccessToken: lawyer.outlook_calendar_access_token,
    outlookCalendarRefreshToken: lawyer.outlook_calendar_refresh_token,
    outlookCalendarLastSyncAt: lawyer.outlook_calendar_last_sync_at,
  };
}

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    lawyerId: row.lawyer_id,
    clientId: row.client_id,
    lawyerName: row.lawyer_name,
    clientName: row.client_name,
    date: row.date,
    status: row.status as Appointment['status'],
    notes: row.notes,
    type: row.type as Appointment['type'],
    dailyRoomUrl: row.daily_room_url,
    dailyRoomId: row.daily_room_id,
    duration: row.duration,
    transcript: row.transcript,
    summary: row.summary,
    summaryShared: row.summary_shared,
    meetingEndedAt: row.meeting_ended_at,
    channelId: row.channel_id,
    googleCalendarEventId: row.google_calendar_event_id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a file to Supabase Storage and return the public URL.
 * Bucket 'documents' must be created in Supabase Dashboard → Storage.
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('documents').getPublicUrl(path);
  return data.publicUrl;
};

// ─────────────────────────────────────────────────────────────────────────────
// LAWYERS
// ─────────────────────────────────────────────────────────────────────────────

export const loadLawyersFromFirebase = async (): Promise<Lawyer[]> => {
  const { data, error } = await supabase
    .from('lawyers')
    .select('*, profiles(*)');

  if (error) {
    console.error('❌ Error loading lawyers:', error);
    throw error;
  }

  return (data || []).map(row => rowToLawyer(row.profiles, row));
};

export const subscribeToLawyers = (callback: (lawyers: Lawyer[]) => void) => {
  const fetch = async () => {
    const lawyers = await loadLawyersFromFirebase().catch(() => []);
    callback(lawyers);
  };

  fetch();

  const channel = supabase
    .channel('lawyers_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lawyers' }, fetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const uploadLawyersToFirebase = async (lawyers: Lawyer[]): Promise<void> => {
  for (const lawyer of lawyers) {
    // Upsert profile
    await supabase.from('profiles').upsert({
      id: lawyer.id,
      email: lawyer.email,
      name: lawyer.name,
      role: UserRole.LAWYER,
      avatar_url: lawyer.avatarUrl,
      phone: lawyer.phone,
      disabled: lawyer.disabled ?? false,
      profile_completed: lawyer.profileCompleted ?? true,
    });

    // Upsert lawyer
    await supabase.from('lawyers').upsert({
      id: lawyer.id,
      specialty: lawyer.specialty,
      bio: lawyer.bio,
      location: lawyer.location,
      coordinates: lawyer.coordinates,
      hourly_rate: lawyer.hourlyRate,
      languages: lawyer.languages,
      available_slots: lawyer.availableSlots,
      firm_name: lawyer.firmName,
      years_experience: lawyer.yearsExperience,
      profile_config: lawyer.profileConfig,
      rating: lawyer.rating,
      review_count: lawyer.reviewCount,
      postal_code: lawyer.postalCode,
      bar_number: lawyer.barNumber,
      education: lawyer.education,
      certifications: lawyer.certifications,
      cases: lawyer.cases,
      verified: lawyer.verified ?? false,
      response_time: lawyer.responseTime,
      availability_hours: lawyer.availabilityHours,
    });
  }
};

export const getLawyerById = async (lawyerId: string): Promise<Lawyer | null> => {
  const { data, error } = await supabase
    .from('lawyers')
    .select('*, profiles(*)')
    .eq('id', lawyerId)
    .single();

  if (error || !data) return null;
  return rowToLawyer(data.profiles, data);
};

export const getClientById = async (clientId: string): Promise<Client | User | null> => {
  return getUserProfile(clientId);
};

export const addLawyerToFirebase = async (lawyer: Lawyer): Promise<void> => {
  await uploadLawyersToFirebase([lawyer]);
};

export const updateLawyerProfileConfig = async (
  lawyerId: string,
  profileConfig: ProfileBlock[]
): Promise<void> => {
  const { error } = await supabase
    .from('lawyers')
    .update({ profile_config: profileConfig })
    .eq('id', lawyerId);

  if (error) throw error;
};

export const getUserByEmail = async (email: string): Promise<User | Lawyer | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return getUserProfile(data.id);
};

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export const getUserProfile = async (uid: string): Promise<User | Lawyer | null> => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !profile) return null;

  if (profile.role === UserRole.LAWYER) {
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select('*')
      .eq('id', uid)
      .single();

    if (lawyer) return rowToLawyer(profile, lawyer);
  }

  return rowToProfile(profile);
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  const profileUpdate: Record<string, any> = {};
  if (data.name !== undefined)             profileUpdate.name = data.name;
  if (data.email !== undefined)            profileUpdate.email = data.email;
  if (data.avatarUrl !== undefined)        profileUpdate.avatar_url = data.avatarUrl;
  if (data.phone !== undefined)            profileUpdate.phone = data.phone;
  if (data.disabled !== undefined)         profileUpdate.disabled = data.disabled;
  if (data.profileCompleted !== undefined) profileUpdate.profile_completed = data.profileCompleted;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
    if (error) throw error;
  }

  // If updating lawyer-specific fields
  const lawyerData = data as Partial<Lawyer>;
  const lawyerUpdate: Record<string, any> = {};
  if (lawyerData.specialty !== undefined)         lawyerUpdate.specialty = lawyerData.specialty;
  if (lawyerData.bio !== undefined)               lawyerUpdate.bio = lawyerData.bio;
  if (lawyerData.location !== undefined)          lawyerUpdate.location = lawyerData.location;
  if (lawyerData.coordinates !== undefined)       lawyerUpdate.coordinates = lawyerData.coordinates;
  if (lawyerData.hourlyRate !== undefined)        lawyerUpdate.hourly_rate = lawyerData.hourlyRate;
  if (lawyerData.languages !== undefined)         lawyerUpdate.languages = lawyerData.languages;
  if (lawyerData.availableSlots !== undefined)    lawyerUpdate.available_slots = lawyerData.availableSlots;
  if (lawyerData.firmName !== undefined)          lawyerUpdate.firm_name = lawyerData.firmName;
  if (lawyerData.yearsExperience !== undefined)   lawyerUpdate.years_experience = lawyerData.yearsExperience;
  if (lawyerData.profileConfig !== undefined)     lawyerUpdate.profile_config = lawyerData.profileConfig;
  if (lawyerData.availabilityHours !== undefined) lawyerUpdate.availability_hours = lawyerData.availabilityHours;
  if (lawyerData.verified !== undefined)          lawyerUpdate.verified = lawyerData.verified;
  if (lawyerData.barNumber !== undefined)         lawyerUpdate.bar_number = lawyerData.barNumber;
  if (lawyerData.postalCode !== undefined)        lawyerUpdate.postal_code = lawyerData.postalCode;
  if (lawyerData.cases !== undefined)             lawyerUpdate.cases = lawyerData.cases;
  if (lawyerData.googleCalendarConnected !== undefined)     lawyerUpdate.google_calendar_connected = lawyerData.googleCalendarConnected;
  if (lawyerData.googleCalendarAccessToken !== undefined)   lawyerUpdate.google_calendar_access_token = lawyerData.googleCalendarAccessToken;
  if (lawyerData.googleCalendarRefreshToken !== undefined)  lawyerUpdate.google_calendar_refresh_token = lawyerData.googleCalendarRefreshToken;
  if (lawyerData.googleCalendarLastSyncAt !== undefined)    lawyerUpdate.google_calendar_last_sync_at = lawyerData.googleCalendarLastSyncAt;
  if (lawyerData.outlookCalendarConnected !== undefined)    lawyerUpdate.outlook_calendar_connected = lawyerData.outlookCalendarConnected;
  if (lawyerData.outlookCalendarAccessToken !== undefined)  lawyerUpdate.outlook_calendar_access_token = lawyerData.outlookCalendarAccessToken;
  if (lawyerData.outlookCalendarRefreshToken !== undefined) lawyerUpdate.outlook_calendar_refresh_token = lawyerData.outlookCalendarRefreshToken;
  if (lawyerData.outlookCalendarLastSyncAt !== undefined)   lawyerUpdate.outlook_calendar_last_sync_at = lawyerData.outlookCalendarLastSyncAt;

  if (Object.keys(lawyerUpdate).length > 0) {
    // Upsert in case the lawyers row doesn't exist yet
    await supabase.from('lawyers').update(lawyerUpdate).eq('id', userId);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export const registerUser = async (
  email: string,
  password: string,
  role: UserRole,
  name: string
): Promise<any> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Signup failed');

  // The handle_new_user trigger creates profiles row automatically.
  // Create the role-specific row now.
  if (role === UserRole.LAWYER) {
    await supabase.from('lawyers').insert({
      id: data.user.id,
      specialty: 'General Practice',
      bio: '',
      location: '',
    });
  } else {
    await supabase.from('clients').insert({ id: data.user.id });
  }

  return data.user;
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

/**
 * Google OAuth — triggers a redirect to Google then back to the app.
 * The role is stored in localStorage so onAuthStateChange can read it on return.
 */
export const loginWithGoogle = async (defaultRole: UserRole = UserRole.CLIENT): Promise<{ user: any; isNewUser: boolean }> => {
  localStorage.setItem('jurilab_pending_role', defaultRole);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  // Page redirects — return value is never reached during the OAuth flow
  return { user: null, isNewUser: false };
};

/**
 * Microsoft OAuth — triggers a redirect. Requires Azure app configured in Supabase.
 */
export const loginWithMicrosoft = async (defaultRole: UserRole = UserRole.CLIENT): Promise<{ user: any; isNewUser: boolean }> => {
  localStorage.setItem('jurilab_pending_role', defaultRole);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return { user: null, isNewUser: false };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const createAppointment = async (appointment: Appointment): Promise<void> => {
  const { error } = await supabase.from('appointments').insert({
    id: appointment.id,
    lawyer_id: appointment.lawyerId,
    client_id: appointment.clientId,
    lawyer_name: appointment.lawyerName,
    client_name: appointment.clientName,
    date: appointment.date,
    status: appointment.status,
    notes: appointment.notes,
    type: appointment.type,
    duration: appointment.duration,
    daily_room_url: appointment.dailyRoomUrl,
    daily_room_id: appointment.dailyRoomId,
    channel_id: appointment.channelId,
    google_calendar_event_id: appointment.googleCalendarEventId,
  });
  if (error) throw error;
};

export const acceptAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CONFIRMED' })
    .eq('id', appointmentId);
  if (error) throw error;
};

export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId);
  if (error) throw error;
};

export const checkAppointmentConflict = async (
  lawyerId: string,
  clientId: string,
  date: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ hasConflict: boolean; conflictReason?: string }> => {
  const start = new Date(date);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  let query = supabase
    .from('appointments')
    .select('id, date, duration, status, lawyer_id, client_id')
    .in('status', ['CONFIRMED', 'PENDING'])
    .or(`lawyer_id.eq.${lawyerId},client_id.eq.${clientId}`);

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }

  const { data, error } = await query;
  if (error || !data) return { hasConflict: false };

  for (const appt of data) {
    const apptStart = new Date(appt.date);
    const apptEnd = new Date(apptStart.getTime() + (appt.duration || 60) * 60 * 1000);

    const overlaps = start < apptEnd && end > apptStart;
    if (overlaps) {
      return {
        hasConflict: true,
        conflictReason: appt.lawyer_id === lawyerId
          ? "L'avocat a déjà un rendez-vous sur ce créneau"
          : 'Vous avez déjà un rendez-vous sur ce créneau',
      };
    }
  }

  return { hasConflict: false };
};

export const subscribeToAppointments = (
  userId: string,
  role: UserRole,
  callback: (appointments: Appointment[]) => void
) => {
  const column = role === UserRole.LAWYER ? 'lawyer_id' : 'client_id';

  const fetch = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq(column, userId)
      .order('date', { ascending: true });

    if (!error && data) callback(data.map(rowToAppointment));
  };

  fetch();

  const channel = supabase
    .channel(`appointments_${userId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'appointments',
      filter: `lawyer_id=eq.${userId}`,
    }, fetch)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'appointments',
      filter: `client_id=eq.${userId}`,
    }, fetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToAppointment);
};

export const deleteAppointmentData = async (appointmentId: string): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', appointmentId);
  if (error) throw error;
};

export const updateAppointmentField = async (
  appointmentId: string,
  fields: Partial<Record<string, any>>
): Promise<void> => {
  const { error } = await supabase
    .from('appointments')
    .update(fields)
    .eq('id', appointmentId);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getPersonalEvents = async (userId: string): Promise<PersonalEvent[]> => {
  const { data, error } = await supabase
    .from('personal_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    allDay: row.all_day,
    description: row.description,
    location: row.location,
    color: row.color,
    type: row.type,
    googleCalendarEventId: row.google_calendar_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const createPersonalEvent = async (event: Omit<PersonalEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const { data, error } = await supabase.from('personal_events').insert({
    user_id: event.userId,
    title: event.title,
    start_time: event.start,
    end_time: event.end,
    all_day: event.allDay,
    description: event.description,
    location: event.location,
    color: event.color,
    type: event.type,
    google_calendar_event_id: event.googleCalendarEventId,
  }).select('id').single();

  if (error) throw error;
  return data.id;
};

export const updatePersonalEvent = async (eventId: string, fields: Partial<PersonalEvent>): Promise<void> => {
  const update: Record<string, any> = {};
  if (fields.title !== undefined)                    update.title = fields.title;
  if (fields.start !== undefined)                    update.start_time = fields.start;
  if (fields.end !== undefined)                      update.end_time = fields.end;
  if (fields.allDay !== undefined)                   update.all_day = fields.allDay;
  if (fields.description !== undefined)              update.description = fields.description;
  if (fields.location !== undefined)                 update.location = fields.location;
  if (fields.color !== undefined)                    update.color = fields.color;
  if (fields.type !== undefined)                     update.type = fields.type;
  if (fields.googleCalendarEventId !== undefined)    update.google_calendar_event_id = fields.googleCalendarEventId;

  const { error } = await supabase.from('personal_events').update(update).eq('id', eventId);
  if (error) throw error;
};

export const deletePersonalEvent = async (eventId: string): Promise<void> => {
  const { error } = await supabase.from('personal_events').delete().eq('id', eventId);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE CALENDAR (unchanged logic — only data fetching moves to Supabase)
// ─────────────────────────────────────────────────────────────────────────────

export const syncAppointmentToGoogleCalendar = async (appointment: Appointment): Promise<string | null> => {
  try {
    const lawyer = await getLawyerById(appointment.lawyerId);
    if (!lawyer?.googleCalendarConnected || !lawyer.googleCalendarAccessToken) return null;

    const decryptedToken = decryptToken(lawyer.googleCalendarAccessToken);
    let accessToken = decryptedToken;

    // Refresh if needed
    if (lawyer.googleCalendarRefreshToken) {
      try {
        const newToken = await refreshGoogleAccessToken(decryptToken(lawyer.googleCalendarRefreshToken));
        accessToken = newToken;
        await updateUserProfile(lawyer.id, {
          googleCalendarAccessToken: encryptToken(newToken),
          googleCalendarLastSyncAt: new Date().toISOString(),
        } as Partial<Lawyer>);
      } catch {
        console.warn('⚠️ Could not refresh Google token, using existing');
      }
    }

    const client = await getUserProfile(appointment.clientId);
    const eventData = {
      summary: `Consultation juridique avec ${client?.name || 'client'}`,
      description: appointment.notes || '',
      start: { dateTime: appointment.date },
      end: { dateTime: new Date(new Date(appointment.date).getTime() + (appointment.duration || 60) * 60000).toISOString() },
      location: appointment.type === 'VIDEO' ? appointment.dailyRoomUrl || 'Visio-conférence' : 'Cabinet',
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) return null;
    const event = await response.json();

    await updateAppointmentField(appointment.id, { google_calendar_event_id: event.id });
    return event.id;
  } catch (error) {
    console.error('❌ Error syncing to Google Calendar:', error);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL HELPERS (replaces remaining firebaseService exports)
// ─────────────────────────────────────────────────────────────────────────────

/** Full lawyer registration with all profile fields. */
export const registerLawyer = async (
  email: string,
  password: string,
  lawyerData: Omit<Lawyer, 'id' | 'email'>
): Promise<any> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: lawyerData.name, role: UserRole.LAWYER } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed');

  await supabase.from('lawyers').insert({
    id: data.user.id,
    specialty: lawyerData.specialty,
    bio: lawyerData.bio || '',
    location: lawyerData.location || '',
    coordinates: lawyerData.coordinates,
    hourly_rate: lawyerData.hourlyRate,
    languages: lawyerData.languages,
    firm_name: lawyerData.firmName,
    years_experience: lawyerData.yearsExperience,
    bar_number: lawyerData.barNumber,
    postal_code: lawyerData.postalCode,
    availability_hours: lawyerData.availabilityHours,
  });

  return data.user;
};

/** Save transcript + summary after a meeting ends. */
export const updateAppointmentTranscript = async (
  appointmentId: string,
  transcript: string,
  summary: string,
  meetingEndedAt: string
): Promise<void> => {
  await updateAppointmentField(appointmentId, {
    transcript,
    summary,
    meeting_ended_at: meetingEndedAt,
    status: 'COMPLETED',
  });
};

/** Mark a meeting summary as shared with the client. */
export const shareSummaryWithClient = async (appointmentId: string): Promise<void> => {
  await updateAppointmentField(appointmentId, { summary_shared: true });
};

/** Persist a lawyer's weekly availability schedule. */
export const saveAvailabilityHours = async (
  lawyerId: string,
  availabilityHours: AvailabilityHours
): Promise<void> => {
  await supabase.from('lawyers').update({ availability_hours: availabilityHours }).eq('id', lawyerId);
};

/** Read a lawyer's weekly availability schedule. */
export const getAvailabilityHours = async (lawyerId: string): Promise<AvailabilityHours | null> => {
  const lawyer = await getLawyerById(lawyerId);
  return (lawyer as any)?.availabilityHours ?? null;
};

/** Get Google Calendar events for a lawyer (fetches from Google API using stored credentials). */
export const getGoogleCalendarEvents = async (lawyerId: string): Promise<any[]> => {
  try {
    const credentials = await getGoogleCalendarCredentials(lawyerId);
    if (!credentials?.googleCalendarConnected || !credentials.googleCalendarAccessToken) return [];

    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 14);
    const end = new Date(now); end.setMonth(now.getMonth() + 3);

    try {
      return await fetchGoogleEvents(decryptToken(credentials.googleCalendarAccessToken), start.toISOString(), end.toISOString());
    } catch (err: any) {
      if ((err.message?.includes('401') || err.message?.includes('expired')) && credentials.googleCalendarRefreshToken) {
        const newToken = await refreshGoogleAccessToken(decryptToken(credentials.googleCalendarRefreshToken));
        await updateGoogleCalendarAccessToken(lawyerId, newToken);
        return await fetchGoogleEvents(newToken, start.toISOString(), end.toISOString());
      }
      throw err;
    }
  } catch (e) {
    console.error('❌ Error in getGoogleCalendarEvents:', e);
    return [];
  }
};

/** Sync a personal event to Google Calendar and save the Google event ID. */
export const syncPersonalEventToGoogleCalendar = async (event: PersonalEvent): Promise<string | null> => {
  try {
    const credentials = await getGoogleCalendarCredentials(event.userId);
    if (!credentials?.googleCalendarConnected || !credentials.googleCalendarAccessToken) return null;

    const { createGoogleCalendarEvent } = await import('./googleCalendarService');
    let accessToken = decryptToken(credentials.googleCalendarAccessToken);

    const createEvent = async (token: string) => createGoogleCalendarEvent(
      token, event.title, new Date(event.start).toISOString(), new Date(event.end).toISOString(),
      event.description || '', event.location || ''
    );

    let googleEvent;
    try {
      googleEvent = await createEvent(accessToken);
    } catch (err: any) {
      if ((err.message?.includes('401') || err.message?.includes('expired')) && credentials.googleCalendarRefreshToken) {
        accessToken = await refreshGoogleAccessToken(decryptToken(credentials.googleCalendarRefreshToken));
        await updateGoogleCalendarAccessToken(event.userId, accessToken);
        googleEvent = await createEvent(accessToken);
      } else throw err;
    }

    await updatePersonalEvent(event.id, { googleCalendarEventId: googleEvent.id });
    return googleEvent.id;
  } catch (e) {
    console.error('❌ Error syncing personal event to Google Calendar:', e);
    return null;
  }
};

/** Update a personal event in Google Calendar. */
export const updatePersonalEventGoogleCalendar = async (event: PersonalEvent): Promise<void> => {
  try {
    if (!event.googleCalendarEventId) return;
    const credentials = await getGoogleCalendarCredentials(event.userId);
    if (!credentials?.googleCalendarConnected || !credentials.googleCalendarAccessToken) return;

    const { updateGoogleCalendarEvent } = await import('./googleCalendarService');
    let accessToken = decryptToken(credentials.googleCalendarAccessToken);
    const payload = {
      summary: event.title, startTime: new Date(event.start).toISOString(),
      endTime: new Date(event.end).toISOString(), description: event.description, location: event.location,
    };

    try {
      await updateGoogleCalendarEvent(accessToken, event.googleCalendarEventId, payload);
    } catch (err: any) {
      if ((err.message?.includes('401') || err.message?.includes('expired')) && credentials.googleCalendarRefreshToken) {
        accessToken = await refreshGoogleAccessToken(decryptToken(credentials.googleCalendarRefreshToken));
        await updateGoogleCalendarAccessToken(event.userId, accessToken);
        await updateGoogleCalendarEvent(accessToken, event.googleCalendarEventId, payload);
      }
    }
  } catch (e) {
    console.error('❌ Failed to update Google Calendar event:', e);
  }
};

/** Delete a personal event from Google Calendar. */
export const deletePersonalEventGoogleCalendar = async (userId: string, googleCalendarEventId: string): Promise<void> => {
  try {
    const credentials = await getGoogleCalendarCredentials(userId);
    if (!credentials?.googleCalendarConnected || !credentials.googleCalendarAccessToken) return;

    const { deleteGoogleCalendarEvent } = await import('./googleCalendarService');
    let accessToken = decryptToken(credentials.googleCalendarAccessToken);

    try {
      await deleteGoogleCalendarEvent(accessToken, googleCalendarEventId);
    } catch (err: any) {
      if ((err.message?.includes('401') || err.message?.includes('expired')) && credentials.googleCalendarRefreshToken) {
        accessToken = await refreshGoogleAccessToken(decryptToken(credentials.googleCalendarRefreshToken));
        await updateGoogleCalendarAccessToken(userId, accessToken);
        await deleteGoogleCalendarEvent(accessToken, googleCalendarEventId);
      }
    }
  } catch (e) {
    console.error('❌ Failed to delete Google Calendar event:', e);
  }
};

/** Admin: get all user profiles. */
export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return (data || []).map(rowToProfile);
};

/** Admin: enable or disable a user account. */
export const setUserDisabled = async (userId: string, disabled: boolean): Promise<void> => {
  await supabase.from('profiles').update({ disabled }).eq('id', userId);
};

/** Admin: change a user's role. */
export const setUserRole = async (userId: string, role: UserRole): Promise<void> => {
  await supabase.from('profiles').update({ role }).eq('id', userId);
};

/** Admin: delete a user account and all associated data. */
export const deleteUserAccountCascade = async (userId: string): Promise<void> => {
  // Cascade deletes via ON DELETE CASCADE on lawyers/clients/appointments tables.
  // Deleting from profiles cascades to everything else.
  await supabase.from('appointments').delete().or(`lawyer_id.eq.${userId},client_id.eq.${userId}`);
  await supabase.from('diligences').delete().or(`lawyer_id.eq.${userId},client_id.eq.${userId}`);
  await supabase.from('documents').delete().or(`lawyer_id.eq.${userId},uploaded_by.eq.${userId}`);
  await supabase.from('personal_events').delete().eq('user_id', userId);
  await supabase.from('conversations').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);
};

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE CALENDAR CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────

export const getGoogleCalendarCredentials = async (lawyerId: string): Promise<GoogleCalendarCredentials | null> => {
  const { data, error } = await supabase
    .from('lawyers')
    .select('google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_last_sync_at')
    .eq('id', lawyerId)
    .single();
  if (error || !data) return null;
  return {
    googleCalendarConnected: data.google_calendar_connected ?? false,
    googleCalendarAccessToken: data.google_calendar_access_token ?? undefined,
    googleCalendarRefreshToken: data.google_calendar_refresh_token ?? undefined,
    googleCalendarLastSyncAt: data.google_calendar_last_sync_at ?? undefined,
  };
};

export const saveGoogleCalendarCredentials = async (
  lawyerId: string,
  credentials: { accessToken: string; refreshToken?: string }
): Promise<void> => {
  await supabase.from('lawyers').update({
    google_calendar_connected: true,
    google_calendar_access_token: encryptToken(credentials.accessToken),
    google_calendar_refresh_token: credentials.refreshToken ? encryptToken(credentials.refreshToken) : null,
    google_calendar_last_sync_at: new Date().toISOString(),
  }).eq('id', lawyerId);
};

export const updateGoogleCalendarAccessToken = async (lawyerId: string, newToken: string): Promise<void> => {
  await supabase.from('lawyers').update({
    google_calendar_access_token: encryptToken(newToken),
    google_calendar_last_sync_at: new Date().toISOString(),
  }).eq('id', lawyerId);
};

export const disconnectGoogleCalendar = async (lawyerId: string): Promise<void> => {
  await supabase.from('lawyers').update({
    google_calendar_connected: false,
    google_calendar_access_token: null,
    google_calendar_refresh_token: null,
  }).eq('id', lawyerId);
};

// ─────────────────────────────────────────────────────────────────────────────
// OUTLOOK CALENDAR CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────

export const getOutlookCalendarCredentials = async (lawyerId: string): Promise<OutlookCalendarCredentials | null> => {
  const { data, error } = await supabase
    .from('lawyers')
    .select('outlook_calendar_connected, outlook_calendar_access_token, outlook_calendar_refresh_token, outlook_calendar_last_sync_at')
    .eq('id', lawyerId)
    .single();
  if (error || !data) return null;
  return {
    outlookCalendarConnected: data.outlook_calendar_connected ?? false,
    outlookCalendarAccessToken: data.outlook_calendar_access_token ?? undefined,
    outlookCalendarRefreshToken: data.outlook_calendar_refresh_token ?? undefined,
    outlookCalendarLastSyncAt: data.outlook_calendar_last_sync_at ?? undefined,
  };
};

export const saveOutlookCalendarCredentials = async (
  lawyerId: string,
  credentials: { accessToken: string; refreshToken?: string }
): Promise<void> => {
  await supabase.from('lawyers').update({
    outlook_calendar_connected: true,
    outlook_calendar_access_token: encryptToken(credentials.accessToken),
    outlook_calendar_refresh_token: credentials.refreshToken ? encryptToken(credentials.refreshToken) : null,
    outlook_calendar_last_sync_at: new Date().toISOString(),
  }).eq('id', lawyerId);
};

export const disconnectOutlookCalendar = async (lawyerId: string): Promise<void> => {
  await supabase.from('lawyers').update({
    outlook_calendar_connected: false,
    outlook_calendar_access_token: null,
    outlook_calendar_refresh_token: null,
  }).eq('id', lawyerId);
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getChatPermission = async (channelId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('chat_permissions')
    .select('client_can_message')
    .eq('channel_id', channelId)
    .maybeSingle();
  return data?.client_can_message ?? true;
};

export const setChatPermission = async (
  channelId: string,
  clientCanMessage: boolean,
  lawyerId?: string,
  clientId?: string
): Promise<void> => {
  const { data } = await supabase
    .from('chat_permissions')
    .select('channel_id')
    .eq('channel_id', channelId)
    .maybeSingle();
  if (data) {
    await supabase.from('chat_permissions').update({ client_can_message: clientCanMessage }).eq('channel_id', channelId);
  } else {
    await supabase.from('chat_permissions').insert({
      channel_id: channelId,
      client_can_message: clientCanMessage,
      lawyer_id: lawyerId,
      client_id: clientId,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

export const deleteUserData = async (userId: string): Promise<void> => {
  // Deleting from profiles cascades to lawyers/clients (ON DELETE CASCADE)
  await supabase.from('appointments').delete()
    .or(`lawyer_id.eq.${userId},client_id.eq.${userId}`);
  await supabase.from('profiles').delete().eq('id', userId);
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

export const getAuthErrorMessage = (error: any): string => {
  const msg: string = error?.message || '';

  if (msg.includes('Invalid login credentials'))   return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))          return 'Veuillez confirmer votre email avant de vous connecter.';
  if (msg.includes('User already registered'))      return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be at least'))  return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (msg.includes('rate limit'))                   return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (msg.includes('network'))                      return 'Erreur réseau. Vérifiez votre connexion.';

  return msg || 'Une erreur inattendue est survenue.';
};
