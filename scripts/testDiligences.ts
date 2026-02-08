/**
 * Script de test pour vérifier la fonctionnalité des diligences
 * 
 * Ce script teste :
 * 1. La connexion à Firestore
 * 2. La création d'une diligence de test
 * 3. La lecture des diligences
 * 4. La mise à jour d'une diligence
 * 5. La suppression d'une diligence
 */

import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs 
} from 'firebase/firestore';

// Configuration Firebase (à remplir avec vos propres valeurs)
const firebaseConfig = {
    apiKey: "votre-api-key",
    authDomain: "votre-auth-domain",
    projectId: "votre-project-id",
    storageBucket: "votre-storage-bucket",
    messagingSenderId: "votre-messaging-sender-id",
    appId: "votre-app-id"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// IDs de test
const TEST_LAWYER_ID = 'test_lawyer_123';
const TEST_CLIENT_ID = 'test_client_456';

async function testDiligences() {
    console.log('🚀 Démarrage des tests Diligences...\n');

    try {
        // Test 1: Créer une diligence
        console.log('1️⃣ Test de création d\'une diligence...');
        const startTime = new Date().toISOString();
        
        const diligenceRef = await addDoc(collection(db, 'diligences'), {
            lawyerId: TEST_LAWYER_ID,
            clientId: TEST_CLIENT_ID,
            startTime,
            description: '',
            category: 'Test',
            createdAt: startTime,
            updatedAt: startTime,
            billable: true
        });

        console.log('✅ Diligence créée avec ID:', diligenceRef.id);

        // Test 2: Lire les diligences
        console.log('\n2️⃣ Test de lecture des diligences...');
        const q = query(
            collection(db, 'diligences'),
            where('lawyerId', '==', TEST_LAWYER_ID),
            where('clientId', '==', TEST_CLIENT_ID)
        );

        const querySnapshot = await getDocs(q);
        console.log(`✅ ${querySnapshot.size} diligence(s) trouvée(s)`);

        querySnapshot.forEach((doc) => {
            console.log('   -', doc.id, ':', doc.data());
        });

        // Test 3: Mettre à jour la diligence
        console.log('\n3️⃣ Test de mise à jour de la diligence...');
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000);

        await updateDoc(doc(db, 'diligences', diligenceRef.id), {
            endTime: endTime.toISOString(),
            duration,
            description: 'Test de diligence - Vérification du système',
            category: 'Test',
            billable: true,
            updatedAt: new Date().toISOString()
        });

        console.log('✅ Diligence mise à jour');
        console.log(`   - Durée: ${duration} secondes`);

        // Test 4: Vérifier la mise à jour
        console.log('\n4️⃣ Vérification de la mise à jour...');
        const updatedSnapshot = await getDocs(q);
        updatedSnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('   - Description:', data.description);
            console.log('   - Durée:', data.duration, 'secondes');
            console.log('   - Facturable:', data.billable);
        });

        // Test 5: Supprimer la diligence de test
        console.log('\n5️⃣ Test de suppression de la diligence...');
        await deleteDoc(doc(db, 'diligences', diligenceRef.id));
        console.log('✅ Diligence supprimée');

        // Vérification finale
        console.log('\n6️⃣ Vérification finale...');
        const finalSnapshot = await getDocs(q);
        console.log(`✅ ${finalSnapshot.size} diligence(s) restante(s) (devrait être 0)`);

        console.log('\n🎉 Tous les tests sont passés avec succès!');

    } catch (error) {
        console.error('❌ Erreur pendant les tests:', error);
        throw error;
    }
}

// Fonction pour formater la durée
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Fonction de test pour simuler un chronomètre
async function testChronometer() {
    console.log('\n⏱️ Test du chronomètre (simulation 5 secondes)...\n');

    const startTime = new Date();
    console.log('⏱️ Démarrage:', startTime.toLocaleTimeString());

    // Créer une diligence active
    const diligenceRef = await addDoc(collection(db, 'diligences'), {
        lawyerId: TEST_LAWYER_ID,
        clientId: TEST_CLIENT_ID,
        startTime: startTime.toISOString(),
        description: '',
        category: 'Test Chronomètre',
        createdAt: startTime.toISOString(),
        updatedAt: startTime.toISOString(),
        billable: true
    });

    // Simuler 5 secondes
    for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        console.log(`   ${formatDuration(elapsed)}`);
    }

    // Arrêter le chronomètre
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await updateDoc(doc(db, 'diligences', diligenceRef.id), {
        endTime: endTime.toISOString(),
        duration,
        description: 'Test du chronomètre - Simulation 5 secondes',
        updatedAt: endTime.toISOString()
    });

    console.log('\n⏱️ Arrêt:', endTime.toLocaleTimeString());
    console.log('✅ Durée enregistrée:', formatDuration(duration));

    // Nettoyer
    await deleteDoc(doc(db, 'diligences', diligenceRef.id));
    console.log('✅ Diligence de test supprimée');
}

// Exécuter les tests
console.log('═══════════════════════════════════════');
console.log('   Tests Système de Diligences');
console.log('═══════════════════════════════════════\n');

testDiligences()
    .then(() => testChronometer())
    .then(() => {
        console.log('\n═══════════════════════════════════════');
        console.log('   ✅ Tous les tests terminés!');
        console.log('═══════════════════════════════════════\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n═══════════════════════════════════════');
        console.error('   ❌ Tests échoués!');
        console.error('═══════════════════════════════════════\n');
        console.error(error);
        process.exit(1);
    });

export { testDiligences, testChronometer };
