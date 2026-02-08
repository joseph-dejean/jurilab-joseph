# 🔥 API Firestore - Collection Diligences

## Structure de la collection

**Nom de la collection** : `diligences`

### Schéma de document

```typescript
{
  id: string;                    // Généré automatiquement par Firestore
  lawyerId: string;              // ID de l'avocat (requis)
  clientId: string;              // ID du client (requis)
  startTime: string;             // ISO timestamp de début (requis)
  endTime?: string;              // ISO timestamp de fin (optionnel, undefined si en cours)
  duration?: number;             // Durée en secondes (optionnel, calculée après arrêt)
  description: string;           // Description du travail (requis, peut être vide initialement)
  category?: string;             // Catégorie de la diligence (optionnel)
  createdAt: string;             // ISO timestamp de création (requis)
  updatedAt: string;             // ISO timestamp de dernière modification (requis)
  billable?: boolean;            // Si facturable (optionnel, true par défaut)
}
```

## Index Firestore

Pour des performances optimales, créez les index composés suivants :

1. **Par avocat et client**
   - Collection: `diligences`
   - Champs: `lawyerId` (Ascending), `clientId` (Ascending), `createdAt` (Descending)

2. **Par avocat seulement**
   - Collection: `diligences`
   - Champs: `lawyerId` (Ascending), `createdAt` (Descending)

3. **Diligences actives**
   - Collection: `diligences`
   - Champs: `lawyerId` (Ascending), `endTime` (Ascending)

## Règles de sécurité

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /diligences/{diligenceId} {
      // Lecture : seul l'avocat propriétaire ou admin
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.lawyerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
      );
      
      // Création : seul un avocat peut créer pour lui-même
      allow create: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'LAWYER' &&
        request.resource.data.lawyerId == request.auth.uid &&
        request.resource.data.keys().hasAll(['lawyerId', 'clientId', 'startTime', 'description', 'createdAt', 'updatedAt']);
      
      // Mise à jour : seul l'avocat propriétaire ou admin
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.lawyerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
      );
      
      // Suppression : seul l'avocat propriétaire ou admin
      allow delete: if request.auth != null && (
        request.auth.uid == resource.data.lawyerId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN'
      );
    }
  }
}
```

## Opérations CRUD

### CREATE - Créer une nouvelle diligence

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const startTime = new Date().toISOString();

const diligenceRef = await addDoc(collection(db, 'diligences'), {
  lawyerId: 'lawyer_id_123',
  clientId: 'client_id_456',
  startTime,
  description: '',
  category: 'Recherche',
  createdAt: startTime,
  updatedAt: startTime,
  billable: true
});

console.log('Diligence créée avec ID:', diligenceRef.id);
```

### READ - Lire les diligences d'un client

```typescript
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', 'lawyer_id_123'),
  where('clientId', '==', 'client_id_456'),
  orderBy('createdAt', 'desc')
);

// Écouter en temps réel
const unsubscribe = onSnapshot(q, (snapshot) => {
  const diligences = [];
  snapshot.forEach((doc) => {
    diligences.push({
      id: doc.id,
      ...doc.data()
    });
  });
  console.log('Diligences:', diligences);
});

// N'oubliez pas de nettoyer
// unsubscribe();
```

### UPDATE - Arrêter une diligence

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const endTime = new Date();
const startTime = new Date('2026-01-31T10:00:00.000Z');
const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

await updateDoc(doc(db, 'diligences', 'diligence_id_789'), {
  endTime: endTime.toISOString(),
  duration,
  description: 'Révision du contrat de bail',
  category: 'Révision documents',
  billable: true,
  updatedAt: new Date().toISOString()
});

console.log('Diligence mise à jour');
```

### DELETE - Supprimer une diligence

```typescript
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

await deleteDoc(doc(db, 'diligences', 'diligence_id_789'));

console.log('Diligence supprimée');
```

## Requêtes avancées

### Trouver la diligence active

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId),
  where('endTime', '==', null) // Diligence sans endTime = en cours
);

const snapshot = await getDocs(q);
const activeDiligence = snapshot.empty ? null : {
  id: snapshot.docs[0].id,
  ...snapshot.docs[0].data()
};
```

### Calculer le temps total pour un client

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId)
);

const snapshot = await getDocs(q);
let totalSeconds = 0;
let billableSeconds = 0;

snapshot.forEach((doc) => {
  const data = doc.data();
  if (data.duration) {
    totalSeconds += data.duration;
    if (data.billable) {
      billableSeconds += data.duration;
    }
  }
});

console.log('Temps total:', totalSeconds, 'secondes');
console.log('Temps facturable:', billableSeconds, 'secondes');
```

### Filtrer par période

```typescript
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const startDate = new Date('2026-01-01');
const endDate = new Date('2026-01-31');

const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId),
  where('createdAt', '>=', startDate.toISOString()),
  where('createdAt', '<=', endDate.toISOString())
);

const snapshot = await getDocs(q);
const diligencesInPeriod = [];

snapshot.forEach((doc) => {
  diligencesInPeriod.push({
    id: doc.id,
    ...doc.data()
  });
});
```

### Obtenir les statistiques par catégorie

```typescript
const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId)
);

const snapshot = await getDocs(q);
const statsByCategory = {};

snapshot.forEach((doc) => {
  const data = doc.data();
  const category = data.category || 'Autre';
  
  if (!statsByCategory[category]) {
    statsByCategory[category] = {
      count: 0,
      totalDuration: 0,
      billableDuration: 0
    };
  }
  
  statsByCategory[category].count++;
  if (data.duration) {
    statsByCategory[category].totalDuration += data.duration;
    if (data.billable) {
      statsByCategory[category].billableDuration += data.duration;
    }
  }
});

console.log('Statistiques par catégorie:', statsByCategory);
```

## Validation des données

### Côté client

```typescript
function validateDiligence(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.lawyerId) errors.push('lawyerId est requis');
  if (!data.clientId) errors.push('clientId est requis');
  if (!data.startTime) errors.push('startTime est requis');
  if (!data.createdAt) errors.push('createdAt est requis');
  if (!data.updatedAt) errors.push('updatedAt est requis');
  
  // Validation des dates
  if (data.startTime && isNaN(Date.parse(data.startTime))) {
    errors.push('startTime doit être une date ISO valide');
  }
  
  if (data.endTime && isNaN(Date.parse(data.endTime))) {
    errors.push('endTime doit être une date ISO valide');
  }
  
  // Validation de la durée
  if (data.endTime && data.duration !== undefined) {
    const calculatedDuration = Math.floor(
      (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 1000
    );
    if (Math.abs(calculatedDuration - data.duration) > 1) {
      errors.push('La durée ne correspond pas à l\'intervalle de temps');
    }
  }
  
  return errors;
}
```

## Gestion des erreurs

```typescript
import { FirebaseError } from 'firebase/app';

try {
  await addDoc(collection(db, 'diligences'), data);
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        console.error('Accès refusé. Vérifiez les règles de sécurité.');
        break;
      case 'not-found':
        console.error('Document non trouvé.');
        break;
      case 'already-exists':
        console.error('Le document existe déjà.');
        break;
      case 'resource-exhausted':
        console.error('Quota dépassé.');
        break;
      default:
        console.error('Erreur Firestore:', error.code, error.message);
    }
  } else {
    console.error('Erreur inattendue:', error);
  }
}
```

## Optimisations

### Batch writes pour plusieurs opérations

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

// Créer plusieurs diligences en une seule transaction
const diligence1Ref = doc(collection(db, 'diligences'));
batch.set(diligence1Ref, { /* data */ });

const diligence2Ref = doc(collection(db, 'diligences'));
batch.set(diligence2Ref, { /* data */ });

await batch.commit();
console.log('Toutes les diligences créées en une seule transaction');
```

### Pagination

```typescript
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

const PAGE_SIZE = 20;
let lastVisible = null;

async function loadNextPage() {
  let q = query(
    collection(db, 'diligences'),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  
  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }
  
  const snapshot = await getDocs(q);
  lastVisible = snapshot.docs[snapshot.docs.length - 1];
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

## Monitoring et Analytics

### Logger les opérations

```typescript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function logOperation(operation: string, diligenceId: string) {
  await setDoc(doc(db, 'diligence_logs', `${Date.now()}`), {
    operation,
    diligenceId,
    timestamp: serverTimestamp(),
    userId: auth.currentUser?.uid
  });
}
```

## Limites et quotas

- **Lectures** : 50,000 lectures/jour (plan gratuit)
- **Écritures** : 20,000 écritures/jour (plan gratuit)
- **Suppressions** : 20,000 suppressions/jour (plan gratuit)
- **Taille document** : Max 1 MB
- **Taille collection** : Illimitée

**Recommandations** :
- Utilisez `onSnapshot` avec parcimonie (consomme des lectures)
- Implémentez la pagination pour les grandes listes
- Utilisez des batch writes pour les opérations multiples
- Nettoyez les anciennes diligences régulièrement

## Migration et backup

### Exporter les données

```typescript
import { collection, getDocs } from 'firebase/firestore';

async function exportDiligences() {
  const snapshot = await getDocs(collection(db, 'diligences'));
  const data = [];
  
  snapshot.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Télécharger en JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diligences-export-${Date.now()}.json`;
  a.click();
}
```

## Support et debugging

### Activer les logs Firestore

```typescript
import { enableIndexedDbPersistence, enableNetwork } from 'firebase/firestore';

// En développement
if (process.env.NODE_ENV === 'development') {
  // Les logs Firestore apparaîtront dans la console
  console.log('Mode développement : logs Firestore activés');
}

// Activer la persistance hors ligne
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Plusieurs onglets ouverts, persistance désactivée');
    } else if (err.code === 'unimplemented') {
      console.warn('Navigateur non supporté pour la persistance');
    }
  });
```
