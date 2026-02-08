/**
 * Script to clean Google connections for a specific user
 * Run this with: node scripts/cleanGoogleConnection.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../jurilab-8bc6d-firebase-adminsdk-vrlbl-9faa0c88f9.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://jurilab-8bc6d-default-rtdb.europe-west1.firebasedatabase.app'
  });
}

const db = admin.database();

async function cleanGoogleConnection(email) {
  try {
    console.log(`🔍 Searching for user: ${email}`);
    
    // Get all users
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();
    
    if (!users) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Find user by email
    let userId = null;
    for (const [id, user] of Object.entries(users)) {
      if (user.email === email) {
        userId = id;
        console.log(`✅ Found user: ${user.name} (${id})`);
        console.log(`   Role: ${user.role}`);
        break;
      }
    }
    
    if (!userId) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    // Clean Google Calendar/Drive credentials from users node
    console.log('\n🧹 Cleaning Google credentials from users node...');
    await usersRef.child(userId).update({
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarConnected: false,
      googleCalendarLastSyncAt: null
    });
    console.log('✅ Users node cleaned');
    
    // Check if user is also in lawyers node
    const lawyersRef = db.ref('lawyers');
    const lawyerSnapshot = await lawyersRef.child(userId).once('value');
    
    if (lawyerSnapshot.exists()) {
      console.log('\n🧹 Cleaning Google credentials from lawyers node...');
      await lawyersRef.child(userId).update({
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarConnected: false,
        googleCalendarLastSyncAt: null
      });
      console.log('✅ Lawyers node cleaned');
    }
    
    console.log('\n✅ All Google connections cleaned successfully!');
    console.log('📝 User can now reconnect with Google Calendar permissions');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Email to clean
const email = 'abenabid@albertschool.com';

console.log('🔧 Google Connection Cleaner');
console.log('================================\n');

cleanGoogleConnection(email);
