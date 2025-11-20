import { ref, get, set, onValue, push, update, remove } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { database, auth, googleProvider } from '../firebaseConfig';
import { Lawyer, Client, UserRole, Appointment, User } from '../types';

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

export const getUserProfile = async (uid: string): Promise<User | Lawyer | null> => {
    // First check 'users' path
    let userRef = ref(database, `users/${uid}`);
    let snapshot = await get(userRef);
    
    if (snapshot.exists()) {
        const userData = snapshot.val();
        // If it's a lawyer, we might want the full lawyer profile from 'lawyers' node
        if (userData.role === UserRole.LAWYER) {
            const lawyerProfile = await getLawyerById(uid);
            return lawyerProfile || userData;
        }
        return userData;
    }
    
    // Fallback: check 'lawyers' path directly if not found in users
    const lawyerProfile = await getLawyerById(uid);
    return lawyerProfile;
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

export const updateAppointmentStatus = async (apptId: string, status: Appointment['status']): Promise<void> => {
    const apptRef = ref(database, `appointments/${apptId}`);
    await update(apptRef, { status });
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
