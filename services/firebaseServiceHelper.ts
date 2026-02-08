// Add to the end of firebaseService.ts

/**
 * Synchronise les plages de disponibilité (basées sur les événements de type AVAILABILITY)
 * vers le profil de l'avocat (availableSlots) pour le système de réservation
 */
export const syncAvailabilityToProfile = async (userId: string): Promise<void> => {
  try {
    console.log(`🔄 Syncing availability to profile for ${userId}...`);
    
    // 1. Get all personal events
    const events = await getPersonalEvents(userId);
    
    // 2. Filter availability events
    const availEvents = events.filter(e => e.type === 'AVAILABILITY');
    
    // 3. Generate 30-min slots
    const slots: string[] = [];
    
    availEvents.forEach(e => {
        const start = new Date(e.start);
        const end = new Date(e.end);
        
        let current = new Date(start);
        // Round to nearest 30 min if needed, but assuming input is clean for now
        
        while (current < end) {
            slots.push(current.toISOString());
            current = new Date(current.getTime() + 30 * 60 * 1000); // +30 mins
        }
    });
    
    // Remove duplicates and sort
    const uniqueSlots = [...new Set(slots)].sort();
    
    // 4. Update lawyer profile in 'lawyers' node
    // We only update if the user is a lawyer
    const lawyerRef = ref(database, `lawyers/${userId}`);
    const snapshot = await get(lawyerRef);
    
    if (snapshot.exists()) {
        await update(lawyerRef, { availableSlots: uniqueSlots });
        console.log(`✅ Synced ${uniqueSlots.length} availability slots to lawyer profile`);
    } else {
        console.log(`⚠️ User ${userId} is not a lawyer, skipping profile sync`);
    }
    
  } catch(e) {
    console.error("❌ Error syncing availability:", e);
  }
};
