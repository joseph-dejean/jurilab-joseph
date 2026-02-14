/**
 * Script pour créer un rendez-vous de test dans Firebase
 * Usage: npx tsx scripts/createTestAppointment.ts
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { Appointment } from '../types';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configuration Firebase - load from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "jurilab-8bc6d.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://jurilab-8bc6d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "jurilab-8bc6d",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "jurilab-8bc6d.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1025942707223",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1025942707223:web:3470e12a6fc7a589251052",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RWGMWP6H0X"
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Error: VITE_FIREBASE_API_KEY not found in .env file');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Configuration du rendez-vous de test
const createTestAppointment = async () => {
  // UID du client (soso@gmail.com)
  const clientId = 'XEoWj85YVCQRjHZkyJMRJLonIB62';
  
  // UID de l'avocat (vous pouvez changer ça)
  // Pour trouver un avocat, allez dans Firebase Console -> lawyers -> prenez un ID
  const lawyerId = 'gNJSckZj8sQ8YYxBoiTsaOnDHlG2'; // sofian.duong@gmail.com
  
  // Date et heure : aujourd'hui à 11h00
  const today = new Date();
  today.setHours(11, 0, 0, 0); // 11h00 aujourd'hui
  const appointmentDate = today.toISOString();
  
  // Créer un ID unique pour le rendez-vous
  const appointmentId = `appt_test_${Date.now()}`;
  
  // Créer l'objet appointment
  const appointment: Appointment = {
    id: appointmentId,
    lawyerId: lawyerId,
    clientId: clientId,
    date: appointmentDate,
    status: 'CONFIRMED',
    type: 'VIDEO',
    duration: 60, // 60 minutes
    notes: 'Rendez-vous de test pour la visioconférence',
    // Optionnel : si vous voulez tester avec une vraie salle Daily.co
    // dailyRoomUrl: 'https://jurilab.daily.co/test-room',
    // dailyRoomId: 'test-room',
  };
  
  try {
    console.log('📝 Création du rendez-vous de test...');
    console.log('📅 Date:', appointmentDate);
    console.log('👤 Client ID:', clientId);
    console.log('⚖️ Avocat ID:', lawyerId);
    
    const apptRef = ref(database, `appointments/${appointmentId}`);
    await set(apptRef, appointment);
    
    console.log('✅ Rendez-vous créé avec succès !');
    console.log('📋 ID du rendez-vous:', appointmentId);
    console.log('🕐 Date:', new Date(appointmentDate).toLocaleString('fr-FR'));
    console.log('\n💡 Vous pouvez maintenant tester la visioconférence !');
    console.log('   - Le bouton "Rejoindre la visio" apparaîtra 15 minutes avant 11h');
    console.log('   - Ou modifiez la date dans Firebase pour tester immédiatement');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du rendez-vous:', error);
    process.exit(1);
  }
};

// Exécuter le script
createTestAppointment()
  .then(() => {
    console.log('\n✨ Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });

