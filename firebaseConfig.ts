// Import firebase modules with type-only import to avoid type declaration errors
import type { FirebaseApp } from "firebase/app";
import type { Database } from "firebase/database";
import type { Analytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY_REMOVED",
  authDomain: "jurilab-8bc6d.firebaseapp.com",
  databaseURL: "https://jurilab-8bc6d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jurilab-8bc6d",
  storageBucket: "jurilab-8bc6d.firebasestorage.app",
  messagingSenderId: "1025942707223",
  appId: "1:1025942707223:web:3470e12a6fc7a589251052",
  measurementId: "G-RWGMWP6H0X"
};

import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
import { OAuthProvider } from "firebase/auth";
export const microsoftProvider = new OAuthProvider('microsoft.com');
