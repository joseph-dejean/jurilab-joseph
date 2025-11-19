import { ref, get, set, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';
import { Lawyer } from '../types';

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
 * Add a new lawyer to Firebase
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

