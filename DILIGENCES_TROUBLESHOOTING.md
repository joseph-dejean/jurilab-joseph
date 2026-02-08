# 🔧 Guide de Dépannage - Système de Diligences

## Problèmes Fréquents et Solutions

---

## 🔴 Le chronomètre ne démarre pas

### Symptômes
- Clic sur "Démarrer" ne fait rien
- Aucune erreur visible
- Le bouton reste bleu

### Causes possibles
1. Une diligence est déjà active
2. Problème de connexion Firestore
3. Erreur de permissions

### Solutions

**1. Vérifier qu'aucune diligence n'est active**
```javascript
// Dans la console du navigateur (F12)
console.log('Active entry:', activeEntry);
```
Si une diligence est active, arrêtez-la d'abord.

**2. Vérifier la connexion Firestore**
```javascript
// Console Firebase
// Aller dans Firestore → Regarder la collection 'diligences'
// Vérifier qu'il n'y a pas de diligence sans endTime pour ce client
```

**3. Vérifier les permissions**
- Vérifiez que vous êtes connecté en tant qu'avocat
- Vérifiez que les règles Firestore sont déployées
- Console Firebase → Firestore → Rules

```bash
# Redéployer les règles si nécessaire
firebase deploy --only firestore:rules
```

---

## 🔴 Le chronomètre ne s'arrête pas

### Symptômes
- Clic sur "Arrêter" ne fait rien
- Le temps continue de défiler
- Aucune entrée n'est créée dans l'historique

### Causes possibles
1. Erreur réseau
2. Problème de validation des données
3. Permissions Firestore

### Solutions

**1. Vérifier la console navigateur**
```
F12 → Console → Rechercher des erreurs en rouge
```

**2. Vérifier les données**
```javascript
// Console navigateur
console.log({
  description,
  category,
  billable,
  activeEntry
});
```

**3. Essayer de forcer l'arrêt**
- Rafraîchir la page (F5)
- Vérifier dans l'historique si la diligence a été enregistrée
- Si elle persiste, supprimer manuellement depuis la console Firebase

---

## 🔴 L'historique ne s'affiche pas

### Symptômes
- Message "Aucune diligence enregistrée"
- Alors que des diligences existent
- La liste est vide

### Causes possibles
1. Problème de requête Firestore
2. Index manquants
3. Permissions

### Solutions

**1. Vérifier dans la console Firebase**
- Firebase Console → Firestore → Collection `diligences`
- Filtrer par `lawyerId` et `clientId`
- Vérifier que des documents existent

**2. Créer les index nécessaires**
```
Firestore → Indexes → Créer un index
Collection: diligences
Champs:
  - lawyerId (Ascending)
  - clientId (Ascending)
  - createdAt (Descending)
```

**3. Vérifier la requête**
```javascript
// Console navigateur
console.log('LawyerId:', lawyerId);
console.log('ClientId:', clientId);
```

---

## 🔴 Les statistiques sont incorrectes

### Symptômes
- Le temps total ne correspond pas
- Le temps facturable est faux
- Les chiffres ne changent pas

### Causes possibles
1. Erreur de calcul
2. Données corrompues
3. Cache du navigateur

### Solutions

**1. Vérifier les données brutes**
```javascript
// Console navigateur
diligences.forEach(d => {
  console.log(d.category, d.duration, d.billable);
});

// Calculer manuellement
const total = diligences.reduce((acc, d) => acc + (d.duration || 0), 0);
const billable = diligences.filter(d => d.billable).reduce((acc, d) => acc + (d.duration || 0), 0);
console.log('Total:', total, 'Billable:', billable);
```

**2. Nettoyer le cache**
```
Ctrl+Shift+Delete → Cocher "Données en cache" → Vider
```

**3. Supprimer les entrées corrompues**
- Identifier les diligences sans `duration`
- Les supprimer ou les corriger manuellement

---

## 🔴 Le chronomètre ne persiste pas après refresh

### Symptômes
- Démarrer une diligence
- Rafraîchir la page (F5)
- Le chronomètre revient à 00:00:00

### Causes possibles
1. La diligence n'a pas été sauvegardée
2. Problème de lecture Firestore
3. Listener `onSnapshot` ne fonctionne pas

### Solutions

**1. Vérifier que la diligence existe**
- Firebase Console → Firestore → Collection `diligences`
- Chercher une diligence sans `endTime`

**2. Vérifier les listeners**
```javascript
// Console navigateur - vérifier qu'il n'y a pas d'erreur
// Chercher "onSnapshot" dans les logs
```

**3. Tester la connexion temps réel**
- Ouvrir 2 onglets avec la même page
- Créer une diligence dans l'onglet 1
- Vérifier qu'elle apparaît dans l'onglet 2

---

## 🔴 Erreur "Permission denied"

### Symptômes
- Message d'erreur dans la console
- "Missing or insufficient permissions"
- Impossible de créer/lire/modifier

### Causes possibles
1. Règles Firestore non déployées
2. Utilisateur non authentifié
3. Rôle utilisateur incorrect

### Solutions

**1. Vérifier l'authentification**
```javascript
// Console navigateur
import { auth } from './firebaseConfig';
console.log('Current user:', auth.currentUser);
console.log('User role:', currentUser?.role);
```

**2. Redéployer les règles**
```bash
firebase deploy --only firestore:rules
```

**3. Vérifier le rôle dans Firestore**
- Firebase Console → Firestore → Collection `users`
- Trouver votre utilisateur
- Vérifier que `role: "LAWYER"`

---

## 🔴 Le build échoue

### Symptômes
- `npm run build` retourne une erreur
- Erreur de compilation TypeScript
- Import non trouvé

### Causes possibles
1. Import manquant
2. Type incorrect
3. Dépendance manquante

### Solutions

**1. Vérifier les imports**
```typescript
// DiligenceTracker.tsx doit avoir
import { db } from '../firebaseConfig';
```

**2. Vérifier que firebaseConfig exporte db**
```typescript
// firebaseConfig.ts doit avoir
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);
```

**3. Réinstaller les dépendances**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔴 Le formatage du temps est incorrect

### Symptômes
- Affichage "NaN:NaN:NaN"
- Temps négatif
- Format bizarre

### Causes possibles
1. Durée non définie
2. Timestamp incorrect
3. Erreur de calcul

### Solutions

**1. Vérifier la fonction formatDuration**
```typescript
const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

**2. Vérifier les données**
```javascript
// Console navigateur
console.log('Duration:', entry.duration, typeof entry.duration);
```

---

## 🔴 Les index Firestore manquent

### Symptômes
- Erreur dans la console: "The query requires an index"
- Lien vers la création d'index fourni
- Les données ne se chargent pas

### Solutions

**1. Cliquer sur le lien dans l'erreur**
- La console vous donne un lien direct
- Cliquer dessus pour créer l'index automatiquement

**2. Créer l'index manuellement**
```
Firebase Console → Firestore → Indexes → Single field / Composite
Collection: diligences
Champs: lawyerId, clientId, createdAt
```

**3. Attendre la création**
- Les index peuvent prendre quelques minutes à se créer
- Status: "Building" → "Enabled"

---

## 🔴 La diligence active ne s'affiche pas correctement

### Symptômes
- Plusieurs diligences marquées comme actives
- Aucune diligence active alors qu'une tourne
- Désynchronisation

### Causes possibles
1. Plusieurs diligences sans `endTime`
2. Données corrompues
3. Race condition

### Solutions

**1. Nettoyer les diligences orphelines**
```javascript
// Script de nettoyage (à exécuter dans la console Firebase Functions ou localement)
const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId),
  where('endTime', '==', null)
);

const snapshot = await getDocs(q);
if (snapshot.size > 1) {
  // Garder la plus récente, supprimer les autres
  const sorted = snapshot.docs.sort((a, b) => 
    new Date(b.data().startTime).getTime() - new Date(a.data().startTime).getTime()
  );
  
  for (let i = 1; i < sorted.length; i++) {
    await deleteDoc(sorted[i].ref);
  }
}
```

---

## 🔴 Performance lente

### Symptômes
- Page lente à charger
- Chronomètre qui lag
- Interface qui freeze

### Causes possibles
1. Trop de diligences dans l'historique
2. Listeners multiples
3. Pas d'optimisation React

### Solutions

**1. Implémenter la pagination**
```typescript
// Limiter le nombre de diligences affichées
const q = query(
  collection(db, 'diligences'),
  where('lawyerId', '==', lawyerId),
  where('clientId', '==', clientId),
  orderBy('createdAt', 'desc'),
  limit(50) // Limiter à 50
);
```

**2. Nettoyer les listeners**
```typescript
// Dans useEffect, toujours retourner unsubscribe
useEffect(() => {
  const unsubscribe = onSnapshot(q, callback);
  return () => unsubscribe(); // Important!
}, [deps]);
```

**3. Mémoïser les composants**
```typescript
export const DiligenceEntry = React.memo(({ entry }) => {
  // ...
});
```

---

## 📞 Support

Si le problème persiste après avoir essayé ces solutions :

1. **Vérifier la documentation**
   - `DILIGENCES_README.md`
   - `DILIGENCES_FIRESTORE_API.md`

2. **Consulter les logs**
   - Console navigateur (F12)
   - Firebase Console → Functions → Logs
   - Firebase Console → Firestore → Usage

3. **Créer un ticket**
   - Décrire le problème en détail
   - Joindre les logs d'erreur
   - Indiquer les étapes pour reproduire

4. **Ressources**
   - Firebase Documentation: https://firebase.google.com/docs
   - Stack Overflow: https://stackoverflow.com/questions/tagged/firebase
   - Firebase Support: https://firebase.google.com/support

---

## 🔍 Outils de Debug

### Console Firebase
```
https://console.firebase.google.com/project/jurilab-8bc6d
```

### Console navigateur
```
F12 → Console
// Logs utiles
console.log('DiligenceTracker mounted');
console.log('Active entry:', activeEntry);
console.log('All diligences:', diligences);
```

### Extension React DevTools
- Installer React DevTools pour Chrome/Firefox
- Inspecter les composants
- Voir les props et state en temps réel

### Firestore Emulator (développement local)
```bash
firebase emulators:start --only firestore
```

---

## ✅ Checklist de Dépannage

Avant de demander de l'aide, vérifiez :

- [ ] Firebase Rules déployées
- [ ] Index Firestore créés
- [ ] Utilisateur authentifié avec rôle LAWYER
- [ ] Console navigateur sans erreurs rouges
- [ ] Connexion internet stable
- [ ] Cache navigateur vidé
- [ ] Dernière version du code déployée
- [ ] Données dans Firestore visibles dans la console
- [ ] Aucune diligence orpheline (sans endTime)

---

**Version:** 1.0  
**Dernière mise à jour:** 31 Janvier 2026
