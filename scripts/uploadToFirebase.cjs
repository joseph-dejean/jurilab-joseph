/**
 * Script to upload CSV lawyers to Firebase Realtime Database
 * 
 * Usage: node scripts/uploadToFirebase.cjs
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, update } = require('firebase/database');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Firebase configuration - load from environment variables
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Specialty mapping
const LegalSpecialty = {
  CRIMINAL: 'Criminal Law',
  FAMILY: 'Family Law',
  CORPORATE: 'Corporate Law',
  REAL_ESTATE: 'Real Estate',
  LABOR: 'Labor Law',
  IP: 'Intellectual Property',
  IMMIGRATION: 'Immigration',
  TAX: 'Tax Law',
  GENERAL: 'General Practice'
};

const UserRole = {
  LAWYER: 'LAWYER'
};

// French cities coordinates (top 50)
const COORDINATES = {
  'PARIS': { lat: 48.8566, lng: 2.3522 },
  'LYON': { lat: 45.7640, lng: 4.8357 },
  'MARSEILLE': { lat: 43.2965, lng: 5.3698 },
  'TOULOUSE': { lat: 43.6047, lng: 1.4442 },
  'NICE': { lat: 43.7102, lng: 7.2620 },
  'NANTES': { lat: 47.2184, lng: -1.5536 },
  'STRASBOURG': { lat: 48.5734, lng: 7.7521 },
  'MONTPELLIER': { lat: 43.6108, lng: 3.8767 },
  'BORDEAUX': { lat: 44.8378, lng: -0.5792 },
  'LILLE': { lat: 50.6292, lng: 3.0573 },
  'RENNES': { lat: 48.1173, lng: -1.6778 },
  'AGEN': { lat: 44.2028, lng: 0.6161 },
  'AIX-EN-PROVENCE': { lat: 43.5297, lng: 5.4474 },
  'DEFAULT': { lat: 46.2276, lng: 2.2137 }
};

const mapSpecialty = (specialty) => {
  if (!specialty) return LegalSpecialty.GENERAL;
  const normalized = specialty.toLowerCase().trim();
  
  if (normalized.includes('pénal') || normalized.includes('penal')) return LegalSpecialty.CRIMINAL;
  if (normalized.includes('famille')) return LegalSpecialty.FAMILY;
  if (normalized.includes('sociétés') || normalized.includes('affaires')) return LegalSpecialty.CORPORATE;
  if (normalized.includes('immobilier')) return LegalSpecialty.REAL_ESTATE;
  if (normalized.includes('travail') || normalized.includes('social')) return LegalSpecialty.LABOR;
  if (normalized.includes('propriété intellectuelle')) return LegalSpecialty.IP;
  if (normalized.includes('étranger') || normalized.includes('immigration')) return LegalSpecialty.IMMIGRATION;
  if (normalized.includes('fiscal')) return LegalSpecialty.TAX;
  
  return LegalSpecialty.GENERAL;
};

const getCoordinates = (city) => {
  if (!city) return COORDINATES['DEFAULT'];
  const normalized = city.toUpperCase().trim();
  return COORDINATES[normalized] || COORDINATES['DEFAULT'];
};

// Helper to delay between batches
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadCSVToFirebase() {
  try {
    console.log('📖 Reading CSV file...');
    const csvPath = path.join(__dirname, '..', 'annuaire_avocats.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('📊 Parsing CSV...');
    const results = Papa.parse(csvContent, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true
    });
    
    console.log(`✅ Found ${results.data.length} rows`);
    console.log('🚀 Starting batch upload (this may take a few minutes)...');
    
    let batch = {};
    let batchCount = 0;
    let totalUploaded = 0;
    const BATCH_SIZE = 500; // Smaller batch size for safety
    
    for (const row of results.data) {
      if (!row.avNom || !row.avPrenom) continue;
      
      const yearsExperience = Math.floor(Math.random() * 25) + 5;
      const baseRate = 150;
      const experienceBonus = yearsExperience * 5;
      const locationBonus = ['PARIS', 'LYON', 'MARSEILLE'].includes(row.Barreau?.toUpperCase()) ? 100 : 0;
      const hourlyRate = Math.round((baseRate + experienceBonus + locationBonus) / 10) * 10;
      
      const specialty = mapSpecialty(row.spLibelle1 || row.spLibelle2 || row.spLibelle3);
      const location = `${row.cbVille || row.Barreau}, France`;
      const coordinates = getCoordinates(row.cbVille || row.Barreau);
      
      const id = `lawyer_${row.cbSiretSiren || totalUploaded}`;
      
      const lawyer = {
        id,
        name: `Maître ${row.avPrenom} ${row.avNom}`,
        email: `${row.avPrenom.toLowerCase()}.${row.avNom.toLowerCase()}@avocats.fr`.replace(/[^a-z0-9.@]/g, ''),
        role: UserRole.LAWYER,
        specialty,
        bio: `Avocat inscrit au Barreau de ${row.Barreau} avec ${yearsExperience} ans d'expérience.`,
        location,
        coordinates,
        hourlyRate,
        languages: row.aVLang ? row.aVLang.split(/[,;]/).map(l => l.trim()).filter(l => l) : ['Français'],
        yearsExperience,
        availableSlots: [],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.avPrenom + '+' + row.avNom)}&background=random`
      };
      
      if (row.cbRaisonSociale && row.cbRaisonSociale.trim() !== '') {
        lawyer.firmName = row.cbRaisonSociale;
      }
      
      // Add to current batch
      batch[`lawyers/${id}`] = lawyer;
      batchCount++;
      totalUploaded++;
      
      // If batch is full, upload it
      if (batchCount >= BATCH_SIZE) {
        process.stdout.write(`📤 Uploading batch... (${totalUploaded}/${results.data.length})\r`);
        
        // Use update() on root reference to update multiple paths at once
        await update(ref(database), batch);
        
        // Reset batch
        batch = {};
        batchCount = 0;
        
        // Small pause to not overwhelm the database
        await sleep(500);
      }
    }
    
    // Upload remaining items
    if (batchCount > 0) {
      console.log(`📤 Uploading final batch of ${batchCount} items...`);
      await update(ref(database), batch);
    }
    
    console.log('\n✅ Successfully uploaded all lawyers to Firebase!');
    console.log(`🎉 Total processed: ${totalUploaded}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the upload
uploadCSVToFirebase();
