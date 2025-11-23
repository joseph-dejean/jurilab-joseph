import { ref, get, set, onValue, push, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { database, auth, googleProvider } from '../firebaseConfig';
import { Lawyer, Client, UserRole, Appointment, User, ProfileBlock, GoogleCalendarCredentials, AvailabilityHours } from '../types';
import { encryptToken, decryptToken } from './googleCalendarService';

/**
 * Load all lawyers from Firebase Realtime Database
 */
export const loadLawyersFromFirebase = async (): Promise<Lawyer[]> => {
  try {
    console.log('🔥 Loading lawyers from Firebase...');
    const lawyersRef = ref(database, 'lawyers');
    const snapshot = await get(lawyersRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const lawyers: Lawyer[] = Object.values(data);
      console.log(`✅ Loaded ${lawyers.length} lawyers from Firebase`);
      return lawyers;
    } else {
      console.warn('⚠️ No lawyers found in Firebase');
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading lawyers from Firebase:', error);
    throw error;
  }
};

/**
 * Listen to real-time updates of lawyers
 */
export const subscribeToLawyers = (callback: (lawyers: Lawyer[]) => void) => {
  console.log('👂 Subscribing to real-time lawyer updates...');
  const lawyersRef = ref(database, 'lawyers');
  
  return onValue(lawyersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const lawyers: Lawyer[] = Object.values(data);
      console.log(`🔄 Received ${lawyers.length} lawyers update from Firebase`);
      callback(lawyers);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('❌ Error subscribing to lawyers:', error);
  });
};

/**
 * Upload lawyers to Firebase (admin use only)
 */
export const uploadLawyersToFirebase = async (lawyers: Lawyer[]): Promise<void> => {
  try {
    console.log(`📤 Uploading ${lawyers.length} lawyers to Firebase...`);
    
    // Convert array to object with IDs as keys
    const lawyersObject: Record<string, Lawyer> = {};
    lawyers.forEach(lawyer => {
      lawyersObject[lawyer.id] = lawyer;
    });
    
    const lawyersRef = ref(database, 'lawyers');
    await set(lawyersRef, lawyersObject);
    
    console.log('✅ Successfully uploaded lawyers to Firebase');
  } catch (error) {
    console.error('❌ Error uploading lawyers to Firebase:', error);
    throw error;
  }
};

/**
 * Get a single lawyer by ID
 */
export const getLawyerById = async (lawyerId: string): Promise<Lawyer | null> => {
  try {
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    const snapshot = await get(lawyerRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Lawyer;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting lawyer:', error);
    return null;
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | User | null> => {
  try {
    console.log(`🔍 getClientById called for: ${clientId}`);
    // Utiliser getUserProfile qui gère déjà tous les cas
    const userProfile = await getUserProfile(clientId);
    console.log(`📊 getUserProfile returned for ${clientId}:`, userProfile ? { id: userProfile.id, name: userProfile.name, role: userProfile.role } : null);
    
    if (userProfile) {
      // Vérifier le rôle (peut être string ou enum)
      const isClient = userProfile.role === UserRole.CLIENT || 
                       userProfile.role === 'CLIENT' ||
                       (userProfile as any).role === 'CLIENT';
      
      if (isClient) {
        console.log(`✅ Client found: ${userProfile.name} (${clientId})`);
        return userProfile as Client;
      } else {
        console.warn(`⚠️ User ${clientId} is not a client, role: ${userProfile.role}`);
      }
    } else {
      console.warn(`⚠️ User profile not found for client ID: ${clientId}`);
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting client:', error);
    return null;
  }
};

/**
 * Add a new lawyer to Firebase Database
 */
export const addLawyerToFirebase = async (lawyer: Lawyer): Promise<void> => {
  try {
    console.log(`➕ Adding new lawyer: ${lawyer.name}`);
    const lawyerRef = ref(database, `lawyers/${lawyer.id}`);
    await set(lawyerRef, lawyer);
    console.log('✅ Successfully added lawyer to Firebase');
  } catch (error) {
    console.error('❌ Error adding lawyer to Firebase:', error);
    throw error;
  }
};

/**
 * Update a lawyer's profile configuration (ProfileBuilder blocks)
 * This only updates the profileConfig field without overwriting other lawyer data
 */
export const updateLawyerProfileConfig = async (
  lawyerId: string, 
  profileConfig: ProfileBlock[]
): Promise<void> => {
  try {
    console.log(`📝 Updating profile config for lawyer: ${lawyerId}`);
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    
    // Use update() to only modify the profileConfig field
    await update(lawyerRef, {
      profileConfig: profileConfig
    });
    
    console.log(`✅ Successfully updated profile config (${profileConfig.length} blocks)`);
  } catch (error) {
    console.error('❌ Error updating profile config:', error);
    throw error;
  }
};

/**
 * Get a user (lawyer or client) by email
 * Used for the Profile Builder login system
 */
export const getUserByEmail = async (email: string): Promise<User | Lawyer | null> => {
  try {
    // Try to find in 'users' node first
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users: User[] = Object.values(usersSnapshot.val());
      const user = users.find(u => u.email === email);
      if (user) {
        // If it's a lawyer, get full profile from lawyers node
        if (user.role === UserRole.LAWYER) {
          const lawyerProfile = await getLawyerById(user.id);
          return lawyerProfile || user;
        }
        return user;
      }
    }
    
    // Try to find as lawyer in 'lawyers' node
    const lawyersRef = ref(database, 'lawyers');
    const lawyersSnapshot = await get(lawyersRef);
    
    if (lawyersSnapshot.exists()) {
      const lawyers: Lawyer[] = Object.values(lawyersSnapshot.val());
      const lawyer = lawyers.find(l => l.email === email);
      if (lawyer) {
        return lawyer;
      }
    }
    
    // Try to find as client in 'clients' node (legacy support)
    const clientsRef = ref(database, 'clients');
    const clientsSnapshot = await get(clientsRef);
    
    if (clientsSnapshot.exists()) {
      const clients: Client[] = Object.values(clientsSnapshot.val());
      const client = clients.find(c => c.email === email);
      if (client) {
        return client;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting user by email:', error);
    return null;
  }
};

// --- AUTHENTICATION ---

export const registerUser = async (email: string, password: string, role: UserRole, name: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in database
    const userRef = ref(database, `users/${user.uid}`);
    const userData: Partial<User> = {
        id: user.uid,
        name,
        email,
        role,
        avatarUrl: `https://ui-avatars.com/api/?name=${name}`
    };
    
    if (role === UserRole.CLIENT) {
        const clientData: Client = {
            ...(userData as Client),
            favorites: []
        };
        await set(userRef, clientData);
    } 
    // Lawyers are handled separately in registerLawyer because they have much more data
    
    return user;
};

export const registerLawyer = async (email: string, password: string, lawyerData: Omit<Lawyer, 'id' | 'email'>): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const newLawyer: Lawyer = {
        ...lawyerData,
        id: user.uid,
        email: email,
    };

    await addLawyerToFirebase(newLawyer);
    
    // Also save a basic user record for auth lookups if needed, or just rely on lawyers node
    // For simplicity, we might want to keep all "users" in users node too, but for now let's keep them separate to match existing structure
    // or duplicate the basic info. Let's duplicate basic info to users node for easier login role check
    const userRef = ref(database, `users/${user.uid}`);
    const basicUser: User = {
        id: user.uid,
        name: lawyerData.name,
        email: email,
        role: UserRole.LAWYER,
        avatarUrl: `https://ui-avatars.com/api/?name=${lawyerData.name}`
    };
    await set(userRef, basicUser);

    return user;
};

export const loginUser = async (email: string, password: string) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async (defaultRole: UserRole = UserRole.CLIENT): Promise<FirebaseUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user exists in DB
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
        // New user - create default profile
        const userData: Partial<User> = {
            id: user.uid,
            name: user.displayName || 'Utilisateur Google',
            email: user.email || '',
            role: defaultRole,
            avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`
        };
        
        if (defaultRole === UserRole.CLIENT) {
             const clientData: Client = {
                ...(userData as Client),
                favorites: []
            };
            await set(userRef, clientData);
        } else {
            // For lawyers, we create a basic entry but they might need to complete profile later
            // For now, just save basic user info
            await set(userRef, userData);
        }
    }
    
    return user;
};

export const logoutUser = async () => {
    return await signOut(auth);
};

/**
 * Create a default client profile if user exists in Auth but not in DB
 */
const createDefaultClientProfile = async (uid: string, email: string | null): Promise<Client> => {
    console.log(`📝 Creating default client profile for UID: ${uid}`);
    const defaultClient: Client = {
        id: uid,
        name: email ? email.split('@')[0] : 'Client',
        email: email || '',
        role: UserRole.CLIENT,
        avatarUrl: `https://ui-avatars.com/api/?name=${email ? email.split('@')[0] : 'Client'}`,
        favorites: []
    };
    
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, defaultClient);
    console.log(`✅ Default client profile created`);
    return defaultClient;
};

export const getUserProfile = async (uid: string): Promise<User | Lawyer | null> => {
    try {
        console.log(`🔍 Getting user profile for UID: ${uid}`);
        
        // First check 'users' path
        let userRef = ref(database, `users/${uid}`);
        let snapshot;
        
        try {
            snapshot = await get(userRef);
            console.log(`📊 Snapshot exists: ${snapshot.exists()}`);
        } catch (error) {
            console.error(`❌ Error reading from Firebase for UID ${uid}:`, error);
            throw error;
        }
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log(`✅ Found user in 'users' node:`, { 
                email: userData.email, 
                role: userData.role,
                name: userData.name 
            });
            
            // Normalize role (handle both string and enum)
            const userRole = userData.role === 'LAWYER' || userData.role === UserRole.LAWYER ? UserRole.LAWYER : 
                             userData.role === 'CLIENT' || userData.role === UserRole.CLIENT ? UserRole.CLIENT : 
                             UserRole.CLIENT; // Default to CLIENT if role is unclear
            
            console.log(`📝 Normalized role: ${userRole}`);
            
            // If it's a lawyer, we might want the full lawyer profile from 'lawyers' node
            if (userRole === UserRole.LAWYER) {
                console.log(`🔍 Checking for full lawyer profile...`);
                const lawyerProfile = await getLawyerById(uid);
                if (lawyerProfile) {
                    console.log(`✅ Found full lawyer profile in 'lawyers' node`);
                    return lawyerProfile;
                }
                console.log(`⚠️ Lawyer profile not found in 'lawyers' node, using basic user data`);
                return { ...userData, role: userRole };
            }
            
            // Ensure role is properly set for clients
            const finalUser = { ...userData, role: userRole };
            console.log(`✅ Returning user profile:`, { id: finalUser.id, email: finalUser.email, role: finalUser.role });
            return finalUser;
        }
        
        console.log(`⚠️ User not found in 'users' node, checking 'lawyers' node...`);
        
        // Fallback: check 'lawyers' path directly if not found in users
        const lawyerProfile = await getLawyerById(uid);
        if (lawyerProfile) {
            console.log(`✅ Found lawyer in 'lawyers' node`);
            return lawyerProfile;
        }
        
        // Last fallback: check 'clients' node (legacy support)
        console.log(`⚠️ User not found in 'lawyers' node, checking 'clients' node (legacy)...`);
        const clientsRef = ref(database, `clients/${uid}`);
        const clientSnapshot = await get(clientsRef);
        
        if (clientSnapshot.exists()) {
            const clientData = clientSnapshot.val();
            console.log(`✅ Found client in 'clients' node (legacy)`);
            // Migrate to users node for consistency
            const userRef = ref(database, `users/${uid}`);
            await set(userRef, { ...clientData, role: UserRole.CLIENT });
            return { ...clientData, role: UserRole.CLIENT };
        }
        
        // If user exists in Auth but not in DB, try to get email from Auth and create default profile
        console.log(`⚠️ User profile not found anywhere for UID: ${uid}`);
        console.log(`⚠️ Attempting to get user email from Auth to create default profile...`);
        
        // Import auth to get current user
        const { auth } = await import('../firebaseConfig');
        const firebaseUser = auth.currentUser;
        
        if (firebaseUser && firebaseUser.uid === uid) {
            console.log(`✅ Found user in Auth (${firebaseUser.email}), creating default client profile`);
            const defaultClient = await createDefaultClientProfile(uid, firebaseUser.email);
            return defaultClient;
        } else {
            console.error(`❌ User not found in Auth either. Current user:`, firebaseUser?.uid);
        }
        
        console.error(`❌ Could not retrieve or create user profile for UID: ${uid}`);
        return null;
    } catch (error) {
        console.error(`❌ Error in getUserProfile for UID ${uid}:`, error);
        return null;
    }
};

// --- APPOINTMENTS ---

export const createAppointment = async (appointment: Appointment): Promise<void> => {
    const apptRef = ref(database, `appointments/${appointment.id}`);
    await set(apptRef, appointment);
    
    // Also update lawyer's available slots if necessary? 
    // For now, we just save the appointment.
};

export const getUserAppointments = async (userId: string, role: UserRole): Promise<Appointment[]> => {
    const apptsRef = ref(database, 'appointments');
    // This is inefficient for large datasets (filtering client side), but fine for MVP
    // Realtime DB query support is limited without indexing.
    const snapshot = await get(apptsRef);
    
    if (!snapshot.exists()) return [];
    
    const allAppts = Object.values(snapshot.val()) as Appointment[];
    
    if (role === UserRole.LAWYER) {
        return allAppts.filter(a => a.lawyerId === userId);
    } else {
        return allAppts.filter(a => a.clientId === userId);
    }
};

/**
 * Met à jour le transcript et le résumé d'un rendez-vous
 */
export const updateAppointmentTranscript = async (
  appointmentId: string,
  transcript: string,
  summary: string,
  meetingEndedAt: string
): Promise<void> => {
  try {
    const apptRef = ref(database, `appointments/${appointmentId}`);
    
    await update(apptRef, {
      transcript,
      summary,
      meetingEndedAt,
      status: 'COMPLETED' as Appointment['status'], // Marquer comme terminé
    });

    console.log(`✅ Appointment transcript and summary updated: ${appointmentId}`);
  } catch (error) {
    console.error('❌ Error updating appointment transcript:', error);
    throw error;
  }
};

/**
 * Partage le résumé d'un rendez-vous avec le client
 */
export const shareSummaryWithClient = async (appointmentId: string): Promise<void> => {
  try {
    const apptRef = ref(database, `appointments/${appointmentId}`);
    
    await update(apptRef, {
      summaryShared: true,
    });

    console.log(`✅ Summary shared with client: ${appointmentId}`);
  } catch (error) {
    console.error('❌ Error sharing summary:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (apptId: string, status: Appointment['status']): Promise<void> => {
    const apptRef = ref(database, `appointments/${apptId}`);
    await update(apptRef, { status });
    console.log(`✅ Appointment ${apptId} status updated to ${status}`);
};

/**
 * Accepte un rendez-vous (change le statut de PENDING à CONFIRMED)
 * Seulement l'avocat peut accepter
 */
export const acceptAppointment = async (appointmentId: string): Promise<void> => {
  try {
    const apptRef = ref(database, `appointments/${appointmentId}`);
    const snapshot = await get(apptRef);
    
    if (!snapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointment = snapshot.val() as Appointment;
    
    if (appointment.status !== 'PENDING') {
      throw new Error(`Cannot accept appointment with status ${appointment.status}`);
    }
    
    await update(apptRef, { status: 'CONFIRMED' });
    console.log(`✅ Appointment ${appointmentId} accepted by lawyer`);
  } catch (error) {
    console.error('❌ Error accepting appointment:', error);
    throw error;
  }
};

/**
 * Annule un rendez-vous (change le statut à CANCELLED)
 * Le client ou l'avocat peuvent annuler
 */
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    const apptRef = ref(database, `appointments/${appointmentId}`);
    const snapshot = await get(apptRef);
    
    if (!snapshot.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointment = snapshot.val() as Appointment;
    
    if (appointment.status === 'CANCELLED') {
      throw new Error('Appointment is already cancelled');
    }
    
    if (appointment.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed appointment');
    }
    
    await update(apptRef, { status: 'CANCELLED' });
    console.log(`✅ Appointment ${appointmentId} cancelled`);
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    throw error;
  }
};

/**
 * Vérifie s'il y a un conflit de créneaux pour un avocat ou un client
 * Retourne true s'il y a un conflit (un autre RDV confirmé ou en attente au même moment)
 * @param excludeAppointmentId - ID de l'appointment à exclure de la vérification (utile lors de l'acceptation d'un RDV)
 */
export const checkAppointmentConflict = async (
  lawyerId: string,
  clientId: string,
  date: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<{ hasConflict: boolean; conflictReason?: string }> => {
  try {
    const allAppointments = await getAllAppointments();
    const appointmentDate = new Date(date);
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60 * 1000);
    
    // Vérifier les conflits pour l'avocat
    const lawyerConflicts = allAppointments.filter(apt => {
      // Exclure l'appointment qu'on est en train de vérifier (utile lors de l'acceptation)
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.lawyerId !== lawyerId) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
      
      const aptDate = new Date(apt.date);
      const aptEnd = new Date(aptDate.getTime() + (apt.duration || 60) * 60 * 1000);
      
      // Vérifier si les créneaux se chevauchent
      return (appointmentDate < aptEnd && appointmentEnd > aptDate);
    });
    
    if (lawyerConflicts.length > 0) {
      return {
        hasConflict: true,
        conflictReason: `L'avocat a déjà un rendez-vous à ce moment-là`
      };
    }
    
    // Vérifier les conflits pour le client
    const clientConflicts = allAppointments.filter(apt => {
      // Exclure l'appointment qu'on est en train de vérifier
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.clientId !== clientId) return false;
      if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
      
      const aptDate = new Date(apt.date);
      const aptEnd = new Date(aptDate.getTime() + (apt.duration || 60) * 60 * 1000);
      
      // Vérifier si les créneaux se chevauchent
      return (appointmentDate < aptEnd && appointmentEnd > aptDate);
    });
    
    if (clientConflicts.length > 0) {
      return {
        hasConflict: true,
        conflictReason: `Vous avez déjà un rendez-vous à ce moment-là`
      };
    }
    
    return { hasConflict: false };
  } catch (error) {
    console.error('❌ Error checking appointment conflict:', error);
    throw error;
  }
};

/**
 * Listen to real-time updates of a user's appointments
 */
export const subscribeToAppointments = (userId: string, role: UserRole, callback: (appointments: Appointment[]) => void) => {
  console.log(`👂 Subscribing to appointments for user ${userId}...`);
  const apptsRef = ref(database, 'appointments');

  // Firebase Realtime DB doesn't support complex "OR" queries efficiently on the client side.
  // We listen to all appointments and filter locally. This is acceptable for small-to-medium scale apps.
  // For very large scale, a backend solution or denormalizing data would be needed.
  return onValue(apptsRef, (snapshot) => {
    if (snapshot.exists()) {
      const allAppts = Object.values(snapshot.val()) as Appointment[];
      let userAppts: Appointment[];

      if (role === UserRole.LAWYER) {
        userAppts = allAppts.filter(a => a.lawyerId === userId);
      } else {
        userAppts = allAppts.filter(a => a.clientId === userId);
      }
      
      console.log(`🔄 Received ${userAppts.length} appointments update for user ${userId}`);
      callback(userAppts);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error(`❌ Error subscribing to appointments for user ${userId}:`, error);
  });
};

// --- ADMIN FUNCTIONS ---

/**
 * Get all users (for admin panel)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as User[];
    }
    return [];
  } catch (error) {
    console.error('❌ Error getting all users:', error);
    return [];
  }
};

/**
 * Get all appointments (for admin panel)
 */
export const getAllAppointments = async (): Promise<Appointment[]> => {
    const apptsRef = ref(database, 'appointments');
    const snapshot = await get(apptsRef);
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val()) as Appointment[];
};

/**
 * Delete a user's data from the 'users' node
 */
export const deleteUserData = async (userId: string): Promise<void> => {
  const userRef = ref(database, `users/${userId}`);
  await remove(userRef);
  // Note: This does not delete the Firebase Auth user. That requires the Admin SDK on a backend.
  // This will only remove their data from the Realtime Database.
};

/**
 * Delete a lawyer's data from the 'lawyers' and 'users' nodes
 */
export const deleteLawyerData = async (lawyerId: string): Promise<void> => {
  const lawyerRef = ref(database, `lawyers/${lawyerId}`);
  await remove(lawyerRef);
  // Also remove them from the general users node
  await deleteUserData(lawyerId);
};

/**
 * Delete an appointment
 */
export const deleteAppointmentData = async (appointmentId: string): Promise<void> => {
  const apptRef = ref(database, `appointments/${appointmentId}`);
  await remove(apptRef);
};


// --- UTILS ---

export const getAuthErrorMessage = (error: any): string => {
    const code = error.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/operation-not-allowed':
      case 'auth/configuration-not-found':
        return 'La connexion par email/mot de passe n\'est pas activée dans Firebase Console.';
      case 'auth/popup-closed-by-user':
        return 'La connexion a été annulée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      default:
        return error.message || 'Une erreur est survenue lors de l\'authentification.';
    }
};

// --- GOOGLE CALENDAR INTEGRATION ---

/**
 * Sauvegarde les credentials Google Calendar pour un avocat
 */
export const saveGoogleCalendarCredentials = async (
  lawyerId: string,
  credentials: {
    accessToken: string;
    refreshToken?: string;
  }
): Promise<void> => {
  try {
    console.log(`💾 Saving Google Calendar credentials for lawyer: ${lawyerId}`);
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    
    // Chiffrer les tokens avant de les stocker
    const encryptedAccessToken = encryptToken(credentials.accessToken);
    
    // Préparer l'objet de mise à jour (sans undefined)
    const updateData: any = {
      googleCalendarConnected: true,
      googleCalendarAccessToken: encryptedAccessToken,
      googleCalendarLastSyncAt: new Date().toISOString(),
    };
    
    // Ajouter le refresh token seulement s'il existe
    if (credentials.refreshToken) {
      updateData.googleCalendarRefreshToken = encryptToken(credentials.refreshToken);
    }
    
    await update(lawyerRef, updateData);
    
    console.log(`✅ Google Calendar credentials saved successfully`);
  } catch (error) {
    console.error('❌ Error saving Google Calendar credentials:', error);
    throw error;
  }
};

/**
 * Récupère les credentials Google Calendar d'un avocat
 */
export const getGoogleCalendarCredentials = async (
  lawyerId: string
): Promise<GoogleCalendarCredentials | null> => {
  try {
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    const snapshot = await get(lawyerRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const lawyer = snapshot.val() as Lawyer;
    
    if (!lawyer.googleCalendarConnected || !lawyer.googleCalendarAccessToken) {
      return null;
    }
    
    // Déchiffrer les tokens
    const accessToken = decryptToken(lawyer.googleCalendarAccessToken);
    const refreshToken = lawyer.googleCalendarRefreshToken 
      ? decryptToken(lawyer.googleCalendarRefreshToken)
      : undefined;
    
    return {
      googleCalendarConnected: lawyer.googleCalendarConnected || false,
      googleCalendarAccessToken: accessToken,
      googleCalendarRefreshToken: refreshToken,
      googleCalendarLastSyncAt: lawyer.googleCalendarLastSyncAt,
    };
  } catch (error) {
    console.error('❌ Error getting Google Calendar credentials:', error);
    return null;
  }
};

/**
 * Déconnecte le calendrier Google d'un avocat
 */
export const disconnectGoogleCalendar = async (lawyerId: string): Promise<void> => {
  try {
    console.log(`🔌 Disconnecting Google Calendar for lawyer: ${lawyerId}`);
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    
    await update(lawyerRef, {
      googleCalendarConnected: false,
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarLastSyncAt: null,
    });
    
    console.log(`✅ Google Calendar disconnected successfully`);
  } catch (error) {
    console.error('❌ Error disconnecting Google Calendar:', error);
    throw error;
  }
};

/**
 * Met à jour le token d'accès Google Calendar (après rafraîchissement)
 */
export const updateGoogleCalendarAccessToken = async (
  lawyerId: string,
  accessToken: string
): Promise<void> => {
  try {
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    const encryptedToken = encryptToken(accessToken);
    
    await update(lawyerRef, {
      googleCalendarAccessToken: encryptedToken,
      googleCalendarLastSyncAt: new Date().toISOString(),
    });
    
    console.log(`✅ Google Calendar access token updated`);
  } catch (error) {
    console.error('❌ Error updating Google Calendar access token:', error);
    throw error;
  }
};

/**
 * Synchronise un rendez-vous avec Google Calendar
 * Crée un événement dans Google Calendar quand un RDV est accepté
 */
export const syncAppointmentToGoogleCalendar = async (
  appointment: Appointment
): Promise<string | null> => {
  try {
    console.log('🔄 Starting Google Calendar sync for appointment:', appointment.id);
    
    // Récupérer les credentials Google Calendar de l'avocat
    const credentials = await getGoogleCalendarCredentials(appointment.lawyerId);
    
    if (!credentials || !credentials.googleCalendarConnected || !credentials.googleCalendarAccessToken) {
      console.log('⚠️ Google Calendar not connected for lawyer, skipping sync');
      return null;
    }

    console.log('✅ Google Calendar credentials found for lawyer:', appointment.lawyerId);

    const {
      createGoogleCalendarEvent,
      refreshGoogleAccessToken,
    } = await import('./googleCalendarService');

    let accessToken = credentials.googleCalendarAccessToken;
    
    try {
      // Calculer les heures de début et fin
      const startTime = new Date(appointment.date);
      const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000);
      
      // Créer le titre et la description de l'événement
      const summary = `Consultation avec ${appointment.clientName || 'Client'}`;
      const description = `Type: ${appointment.type}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`;
      const location = appointment.type === 'IN_PERSON' ? 'Cabinet' : 
                       appointment.type === 'VIDEO' ? 'Visioconférence' : 'Téléphone';
      
      console.log('📅 Creating event:', { summary, startTime: startTime.toISOString(), endTime: endTime.toISOString() });
      
      // Créer l'événement dans Google Calendar
      const googleEvent = await createGoogleCalendarEvent(
        accessToken,
        summary,
        startTime.toISOString(),
        endTime.toISOString(),
        description,
        location
      );
      
      // Stocker l'ID de l'événement Google Calendar dans l'appointment
      const apptRef = ref(database, `appointments/${appointment.id}`);
      await update(apptRef, { googleCalendarEventId: googleEvent.id });
      
      console.log(`✅ Appointment synced to Google Calendar: ${googleEvent.id}`);
      return googleEvent.id;
    } catch (error: any) {
      // Si le token a expiré, essayer de le rafraîchir
      if (error.message?.includes('401') || error.message?.includes('expired') || error.message?.includes('Invalid Credentials')) {
        if (credentials.googleCalendarRefreshToken) {
          const newAccessToken = await refreshGoogleAccessToken(credentials.googleCalendarRefreshToken);
          accessToken = newAccessToken;
          await updateGoogleCalendarAccessToken(appointment.lawyerId, accessToken);
          
          // Réessayer avec le nouveau token
          const startTime = new Date(appointment.date);
          const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000);
          const summary = `Consultation avec ${appointment.clientName || 'Client'}`;
          const description = `Type: ${appointment.type}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`;
          const location = appointment.type === 'IN_PERSON' ? 'Cabinet' : 
                           appointment.type === 'VIDEO' ? 'Visioconférence' : 'Téléphone';
          
          const googleEvent = await createGoogleCalendarEvent(
            accessToken,
            summary,
            startTime.toISOString(),
            endTime.toISOString(),
            description,
            location
          );
          
          const apptRef = ref(database, `appointments/${appointment.id}`);
          await update(apptRef, { googleCalendarEventId: googleEvent.id });
          
          console.log(`✅ Appointment synced to Google Calendar (after token refresh): ${googleEvent.id}`);
          return googleEvent.id;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error syncing appointment to Google Calendar:', error);
    // Ne pas bloquer si la synchronisation échoue
    return null;
  }
};

/**
 * Met à jour un événement Google Calendar
 */
export const updateGoogleCalendarEvent = async (
  appointment: Appointment
): Promise<void> => {
  try {
    if (!appointment.googleCalendarEventId) {
      console.log('⚠️ No Google Calendar event ID, skipping update');
      return;
    }

    const credentials = await getGoogleCalendarCredentials(appointment.lawyerId);
    
    if (!credentials || !credentials.googleCalendarConnected || !credentials.googleCalendarAccessToken) {
      console.log('⚠️ Google Calendar not connected, skipping update');
      return;
    }

    const {
      updateGoogleCalendarEvent: updateEvent,
      refreshGoogleAccessToken,
    } = await import('./googleCalendarService');

    let accessToken = credentials.googleCalendarAccessToken;
    
    try {
      const startTime = new Date(appointment.date);
      const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000);
      const summary = `Consultation avec ${appointment.clientName || 'Client'}`;
      const description = `Type: ${appointment.type}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`;
      const location = appointment.type === 'IN_PERSON' ? 'Cabinet' : 
                       appointment.type === 'VIDEO' ? 'Visioconférence' : 'Téléphone';
      
      await updateEvent(accessToken, appointment.googleCalendarEventId, {
        summary,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description,
        location,
      });
      
      console.log(`✅ Google Calendar event updated: ${appointment.googleCalendarEventId}`);
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('expired') || error.message?.includes('Invalid Credentials')) {
        if (credentials.googleCalendarRefreshToken) {
          const newAccessToken = await refreshGoogleAccessToken(credentials.googleCalendarRefreshToken);
          accessToken = newAccessToken;
          await updateGoogleCalendarAccessToken(appointment.lawyerId, accessToken);
          
          const startTime = new Date(appointment.date);
          const endTime = new Date(startTime.getTime() + (appointment.duration || 60) * 60 * 1000);
          const summary = `Consultation avec ${appointment.clientName || 'Client'}`;
          const description = `Type: ${appointment.type}\n${appointment.notes ? `Notes: ${appointment.notes}` : ''}`;
          const location = appointment.type === 'IN_PERSON' ? 'Cabinet' : 
                           appointment.type === 'VIDEO' ? 'Visioconférence' : 'Téléphone';
          
          await updateEvent(accessToken, appointment.googleCalendarEventId, {
            summary,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            description,
            location,
          });
          
          console.log(`✅ Google Calendar event updated (after token refresh): ${appointment.googleCalendarEventId}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error updating Google Calendar event:', error);
    // Ne pas bloquer si la mise à jour échoue
  }
};

/**
 * Supprime un événement Google Calendar
 */
export const deleteGoogleCalendarEvent = async (
  appointment: Appointment
): Promise<void> => {
  try {
    if (!appointment.googleCalendarEventId) {
      console.log('⚠️ No Google Calendar event ID, skipping delete');
      return;
    }

    const credentials = await getGoogleCalendarCredentials(appointment.lawyerId);
    
    if (!credentials || !credentials.googleCalendarConnected || !credentials.googleCalendarAccessToken) {
      console.log('⚠️ Google Calendar not connected, skipping delete');
      return;
    }

    const {
      deleteGoogleCalendarEvent: deleteEvent,
      refreshGoogleAccessToken,
    } = await import('./googleCalendarService');

    let accessToken = credentials.googleCalendarAccessToken;
    
    try {
      await deleteEvent(accessToken, appointment.googleCalendarEventId);
      console.log(`✅ Google Calendar event deleted: ${appointment.googleCalendarEventId}`);
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('expired') || error.message?.includes('Invalid Credentials')) {
        if (credentials.googleCalendarRefreshToken) {
          const newAccessToken = await refreshGoogleAccessToken(credentials.googleCalendarRefreshToken);
          accessToken = newAccessToken;
          await updateGoogleCalendarAccessToken(appointment.lawyerId, accessToken);
          
          await deleteEvent(accessToken, appointment.googleCalendarEventId);
          console.log(`✅ Google Calendar event deleted (after token refresh): ${appointment.googleCalendarEventId}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error deleting Google Calendar event:', error);
    // Ne pas bloquer si la suppression échoue
  }
};

// --- AVAILABILITY HOURS ---

/**
 * Sauvegarde les heures de disponibilité d'un avocat
 */
export const saveAvailabilityHours = async (
  lawyerId: string,
  availabilityHours: AvailabilityHours
): Promise<void> => {
  try {
    console.log(`💾 Saving availability hours for lawyer: ${lawyerId}`);
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    
    await update(lawyerRef, {
      availabilityHours,
    });
    
    console.log(`✅ Availability hours saved successfully`);
  } catch (error) {
    console.error('❌ Error saving availability hours:', error);
    throw error;
  }
};

/**
 * Récupère les heures de disponibilité d'un avocat
 */
export const getAvailabilityHours = async (
  lawyerId: string
): Promise<AvailabilityHours | null> => {
  try {
    const lawyerRef = ref(database, `lawyers/${lawyerId}`);
    const snapshot = await get(lawyerRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const lawyerData = snapshot.val();
    return lawyerData.availabilityHours || null;
  } catch (error) {
    console.error('❌ Error getting availability hours:', error);
    throw error;
  }
};
