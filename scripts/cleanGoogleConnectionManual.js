/**
 * Script to manually clean Google connection
 * Run this in the browser console while logged in
 */

// Copy and paste this in the browser console
(async function cleanMyGoogleConnection() {
  const { database } = window;
  const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
  
  const userId = 'YOUR_USER_ID_HERE'; // Replace with your actual user ID
  
  console.log('🧹 Cleaning Google connections...');
  
  // Clean from users node
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, {
    googleCalendarAccessToken: null,
    googleCalendarRefreshToken: null,
    googleCalendarConnected: false,
    googleCalendarLastSyncAt: null
  });
  
  console.log('✅ Google connections cleaned!');
  console.log('Please refresh the page and reconnect with Google Calendar.');
})();
