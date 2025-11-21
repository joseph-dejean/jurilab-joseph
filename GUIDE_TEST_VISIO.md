# Guide de Test - Feature Visioconférence Daily.co

## 🎯 Prérequis

### 1. Vérifier la configuration

**Fichier `.env`** (à la racine de `HACKATON_GOOGLE`) :
```env
VITE_DAILY_API_KEY=your_daily_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Vérification :**
- Les clés sont bien définies
- Le fichier est au bon endroit (pas dans `jurilabb`, mais dans `HACKATON_GOOGLE`)

### 2. Démarrer l'application

```bash
cd jurilabb
npm install  # Si nécessaire
npm run dev
```

L'application devrait démarrer sur `http://localhost:3000`

### 3. Comptes de test

Assurez-vous d'avoir au moins :
- **1 compte Avocat** (ex: `avocat@test.com`)
- **1 compte Client** (ex: `client@test.com`)

## 📋 Scénarios de test

---

## ✅ Test 1 : Réservation d'un rendez-vous VIDEO

### Objectif
Vérifier que la création automatique d'une salle Daily.co fonctionne lors de la réservation.

### Étapes

1. **Se connecter en tant que Client**
   - Aller sur `/login`
   - Se connecter avec un compte client

2. **Chercher un avocat**
   - Aller sur `/search` ou cliquer sur "Trouver un avocat"
   - Sélectionner un avocat

3. **Réserver une consultation**
   - Cliquer sur "Prendre rendez-vous"
   - Sélectionner un créneau disponible
   - **Choisir "Visioconférence" comme type**
   - **Sélectionner une durée** (30, 60, 90 ou 120 min)
   - Ajouter des notes optionnelles
   - Confirmer la réservation

4. **Vérifier dans Firebase**
   - Ouvrir Firebase Console → Realtime Database
   - Aller dans `appointments/[appointment_id]`
   - **Vérifier la présence de :**
     - `dailyRoomUrl` : URL de la salle (ex: `https://jurilab.daily.co/room_xxx`)
     - `dailyRoomId` : ID de la salle
     - `type` : `"VIDEO"`
     - `duration` : Durée en minutes
     - `status` : `"CONFIRMED"`

### ✅ Résultat attendu
- La réservation est créée avec succès
- Les champs `dailyRoomUrl` et `dailyRoomId` sont présents dans Firebase
- Un message de confirmation s'affiche

### ❌ Si ça ne fonctionne pas
- Vérifier la console du navigateur pour les erreurs
- Vérifier que `VITE_DAILY_API_KEY` est bien défini
- Vérifier que l'API Daily.co répond (vérifier les logs réseau)

---

## ✅ Test 2 : Affichage des rendez-vous dans le Dashboard

### Objectif
Vérifier que les rendez-vous VIDEO sont correctement affichés avec les badges et boutons.

### Étapes

1. **Se connecter** (Client ou Avocat)

2. **Aller sur le Dashboard** (`/dashboard`)

3. **Vérifier l'affichage**
   - Les rendez-vous sont listés
   - **Badges de statut** sont visibles et colorés :
     - ✅ Confirmé (vert)
     - ⏳ En attente (jaune)
     - ❌ Annulé (rouge)
     - ✅ Terminé (bleu)
   - **Icônes de type** sont présentes :
     - 🎥 Visio
     - 📞 Téléphone
     - 📍 Présentiel
   - **Durée** est affichée si disponible

4. **Vérifier le bouton "Rejoindre la visio"**
   - Pour un RDV VIDEO à venir (dans les 15 prochaines minutes ou en cours)
   - Le bouton "Rejoindre la visio" devrait apparaître
   - Le bouton est **vert/bronze** (brand-DEFAULT)

### ✅ Résultat attendu
- Interface claire avec badges colorés
- Bouton "Rejoindre la visio" visible pour les RDV VIDEO à venir
- Informations complètes (date, heure, durée, type)

---

## ✅ Test 3 : Page "Mes rendez-vous"

### Objectif
Vérifier que la page de gestion des rendez-vous fonctionne correctement.

### Étapes

1. **Accéder à la page**
   - Cliquer sur "Mes rendez-vous" dans le Dashboard
   - Ou aller directement sur `/my-appointments`

2. **Tester les filtres**
   - **Filtre par statut :**
     - Cliquer sur "Tous" → Tous les RDV s'affichent
     - Cliquer sur "À venir" → Seulement les RDV futurs
     - Cliquer sur "Passés" → Seulement les RDV passés
     - Cliquer sur "Annulés" → Seulement les RDV annulés
   
   - **Filtre par type :**
     - Cliquer sur "Tous types" → Tous les types
     - Cliquer sur "Visio" → Seulement les RDV VIDEO
     - Cliquer sur "Présentiel" → Seulement les RDV IN_PERSON
     - Cliquer sur "Téléphone" → Seulement les RDV PHONE

3. **Vérifier l'affichage**
   - Les rendez-vous sont triés chronologiquement
   - Les informations sont complètes (nom, date, heure, type, statut)
   - Les badges de statut sont visibles

4. **Tester le bouton "Rejoindre la visio"**
   - Pour un RDV VIDEO à venir (dans les 15 prochaines minutes)
   - Le bouton devrait être visible et cliquable

### ✅ Résultat attendu
- Filtres fonctionnent correctement
- Affichage clair et organisé
- Navigation fluide

---

## ✅ Test 4 : Rejoindre une visioconférence

### Objectif
Vérifier que l'accès à la visioconférence fonctionne correctement.

### ⚠️ Important
Pour tester complètement, vous devez :
- Avoir un RDV VIDEO programmé dans les **15 prochaines minutes** (ou modifier la date dans Firebase pour simuler)
- Ou modifier temporairement la fonction `canJoinVideo()` pour permettre l'accès

### Étapes

1. **Créer un RDV de test proche**
   - Option 1 : Réserver un RDV VIDEO pour dans 10 minutes
   - Option 2 : Modifier manuellement la date dans Firebase pour un RDV existant

2. **Rejoindre la visio**
   - Aller dans "Mes rendez-vous" ou le Dashboard
   - Cliquer sur "Rejoindre la visio" pour un RDV VIDEO à venir
   - Ou aller directement sur `/video-call?roomUrl=...&appointmentId=...`

3. **Autoriser les permissions**
   - Le navigateur demande l'accès à la caméra
   - Le navigateur demande l'accès au microphone
   - **Autoriser les deux**

4. **Vérifier l'iframe Daily.co**
   - L'iframe Daily.co se charge
   - Vous voyez votre propre vidéo
   - L'interface Daily.co est visible (boutons caméra, micro, partage d'écran)

5. **Tester avec deux utilisateurs** (optionnel)
   - Ouvrir un deuxième onglet en navigation privée
   - Se connecter avec l'autre compte (avocat ou client)
   - Rejoindre la même salle
   - Vérifier que les deux utilisateurs se voient

### ✅ Résultat attendu
- L'iframe se charge correctement
- La caméra et le micro fonctionnent
- L'interface Daily.co est complète
- Les deux participants peuvent se voir (si test avec 2 utilisateurs)

### ❌ Si ça ne fonctionne pas
- Vérifier que `dailyRoomUrl` existe dans Firebase
- Vérifier la console pour les erreurs de token
- Vérifier que l'API Daily.co répond
- Vérifier les permissions du navigateur

---

## ✅ Test 5 : Génération automatique du transcript et résumé

### Objectif
Vérifier que le système génère automatiquement le transcript et le résumé après la fin d'une réunion.

### ⚠️ Important
Ce test nécessite :
- Une réunion qui s'est réellement terminée
- Ou simuler la fin de réunion manuellement

### Étapes

#### Option A : Test avec une vraie réunion

1. **Créer et rejoindre une réunion**
   - Réserver un RDV VIDEO
   - Rejoindre la visio
   - Participer à la réunion (parler quelques minutes)
   - **Quitter la réunion** (fermer l'onglet ou cliquer sur "Quitter")

2. **Attendre le traitement**
   - Le système détecte automatiquement la fin de réunion
   - Le transcript est extrait (peut prendre 2-5 minutes)
   - Le résumé est généré via Gemini (peut prendre 1-2 minutes)

3. **Vérifier dans Firebase**
   - Aller dans `appointments/[appointment_id]`
   - **Vérifier la présence de :**
     - `transcript` : Texte du transcript
     - `summary` : Résumé généré par Gemini
     - `meetingEndedAt` : Date de fin (ISO string)
     - `status` : `"COMPLETED"`

#### Option B : Test manuel (simulation)

1. **Créer un RDV de test dans Firebase**
   ```json
   {
     "id": "appt_test_123",
     "lawyerId": "lawyer_id",
     "clientId": "client_id",
     "date": "2024-01-15T10:00:00.000Z",
     "status": "CONFIRMED",
     "type": "VIDEO",
     "dailyRoomUrl": "https://jurilab.daily.co/test_room",
     "dailyRoomId": "test_room"
   }
   ```

2. **Appeler manuellement le traitement**
   - Ouvrir la console du navigateur
   - Importer et appeler la fonction :
   ```javascript
   import { processCompletedMeeting } from './services/meetingProcessor';
   
   const appointment = {
     id: 'appt_test_123',
     dailyRoomId: 'test_room',
     date: '2024-01-15T10:00:00.000Z',
     // ... autres champs
   };
   
   await processCompletedMeeting(
     appointment,
     'Maître Dupont',
     'Client Test'
   );
   ```

3. **Vérifier dans Firebase**
   - Les champs `transcript`, `summary`, `meetingEndedAt` sont présents

### ✅ Résultat attendu
- Le transcript est extrait depuis Daily.co
- Le résumé est généré en français avec structure claire
- Les données sont stockées dans Firebase
- Le statut passe à `COMPLETED`

### ❌ Si ça ne fonctionne pas
- Vérifier que `VITE_DAILY_API_KEY` est défini
- Vérifier que `VITE_GEMINI_API_KEY` est défini
- Vérifier les logs de la console
- Vérifier que la salle Daily.co existe et a un transcript disponible

---

## ✅ Test 6 : Affichage du résumé (Avocat)

### Objectif
Vérifier que l'avocat peut consulter le résumé et le transcript.

### Étapes

1. **Se connecter en tant qu'Avocat**
   - Aller sur `/login`
   - Se connecter avec un compte avocat

2. **Aller dans "Mes rendez-vous"**
   - Cliquer sur "Mes rendez-vous" dans le Dashboard
   - Ou aller sur `/my-appointments`

3. **Filtrer par "Passés"**
   - Cliquer sur le filtre "Passés"
   - Trouver un RDV avec statut `COMPLETED`

4. **Voir le résumé**
   - Cliquer sur "Voir résumé" pour un RDV terminé
   - Le composant `MeetingSummary` s'affiche

5. **Vérifier l'affichage**
   - **Résumé** : Texte structuré en français
   - **Informations** : Date, heure, durée, participants
   - **Bouton "Partager avec le client"** : Visible et cliquable
   - **Bouton de régénération** : Icône de rafraîchissement
   - **Transcript** : Section collapsible avec le transcript complet
   - **Bouton "Copier"** : Pour copier le résumé/transcript

6. **Tester le transcript**
   - Cliquer sur "Transcript complet" pour l'étendre
   - Vérifier que le texte complet s'affiche
   - Tester le bouton "Copier"

### ✅ Résultat attendu
- Interface claire et professionnelle
- Résumé bien formaté
- Transcript accessible
- Boutons fonctionnels

---

## ✅ Test 7 : Partager le résumé avec le client

### Objectif
Vérifier que l'avocat peut partager le résumé et que le client peut le voir.

### Étapes

1. **Partager le résumé (Avocat)**
   - Se connecter en tant qu'Avocat
   - Aller dans "Mes rendez-vous" → "Passés"
   - Cliquer sur "Voir résumé" pour un RDV terminé
   - Cliquer sur "Partager avec le client"
   - Un message de confirmation s'affiche

2. **Vérifier dans Firebase**
   - Aller dans `appointments/[appointment_id]`
   - **Vérifier que :**
     - `summaryShared` : `true`

3. **Voir le résumé (Client)**
   - Se connecter en tant que Client
   - Aller dans "Mes rendez-vous" → "Passés"
   - Trouver le même RDV
   - **Le résumé devrait maintenant être visible**
   - Un badge "Résumé partagé par votre avocat" s'affiche

4. **Vérifier les permissions**
   - Le client **ne peut pas** voir le transcript complet
   - Le client **ne peut pas** partager/régénérer le résumé
   - Seul le résumé est visible

### ✅ Résultat attendu
- Le partage fonctionne
- Le client voit le résumé après partage
- Les permissions sont respectées (client ne voit que le résumé)

---

## ✅ Test 8 : Régénérer un résumé

### Objectif
Vérifier que l'avocat peut régénérer un résumé existant.

### Étapes

1. **Se connecter en tant qu'Avocat**
   - Aller dans "Mes rendez-vous" → "Passés"
   - Cliquer sur "Voir résumé" pour un RDV avec résumé existant

2. **Régénérer le résumé**
   - Cliquer sur le bouton de régénération (icône rafraîchissement)
   - Confirmer la régénération
   - Attendre la génération (1-2 minutes)

3. **Vérifier le nouveau résumé**
   - Le résumé est mis à jour
   - Le nouveau texte s'affiche
   - Vérifier dans Firebase que `summary` a été mis à jour

### ✅ Résultat attendu
- Le résumé est régénéré avec succès
- Le nouveau résumé remplace l'ancien
- L'interface se met à jour automatiquement

---

## ✅ Test 9 : Gestion des erreurs

### Objectif
Vérifier que les erreurs sont bien gérées.

### Scénarios à tester

1. **Réservation sans clé API Daily.co**
   - Retirer temporairement `VITE_DAILY_API_KEY` du `.env`
   - Essayer de réserver un RDV VIDEO
   - **Résultat attendu** : Message d'erreur, fallback vers PHONE/IN_PERSON

2. **Rejoindre une visio sans salle**
   - Créer un RDV VIDEO sans `dailyRoomUrl` dans Firebase
   - Essayer de rejoindre la visio
   - **Résultat attendu** : Message d'erreur "URL de la salle non disponible"

3. **Génération de résumé sans transcript**
   - Essayer de générer un résumé pour un RDV sans transcript
   - **Résultat attendu** : Message d'erreur approprié

4. **Génération de résumé sans clé Gemini**
   - Retirer temporairement `VITE_GEMINI_API_KEY`
   - Essayer de générer un résumé
   - **Résultat attendu** : Message d'erreur dans la console

---

## 📊 Checklist de test complète

### Réservation
- [ ] Réservation d'un RDV VIDEO crée bien une salle Daily.co
- [ ] Les champs `dailyRoomUrl` et `dailyRoomId` sont stockés
- [ ] La durée est correctement enregistrée
- [ ] Gestion d'erreur si l'API Daily.co échoue

### Interface
- [ ] Badges de statut s'affichent correctement
- [ ] Icônes de type sont visibles
- [ ] Bouton "Rejoindre la visio" apparaît au bon moment
- [ ] Filtres fonctionnent dans "Mes rendez-vous"
- [ ] Tri chronologique fonctionne

### Visioconférence
- [ ] L'iframe Daily.co se charge
- [ ] Les permissions caméra/micro sont demandées
- [ ] Le token est généré correctement
- [ ] Deux utilisateurs peuvent se voir

### Génération automatique
- [ ] Le transcript est extrait après la fin de réunion
- [ ] Le résumé est généré automatiquement
- [ ] Les données sont stockées dans Firebase
- [ ] Le statut passe à `COMPLETED`

### Affichage des résumés
- [ ] L'avocat voit le résumé et le transcript
- [ ] Le client ne voit rien par défaut
- [ ] Le partage fonctionne
- [ ] Le client voit le résumé après partage
- [ ] La régénération fonctionne

### Gestion des erreurs
- [ ] Erreurs API sont gérées gracieusement
- [ ] Messages d'erreur sont clairs
- [ ] Fallbacks fonctionnent (VIDEO → PHONE)

---

## 🔧 Outils de débogage

### Console du navigateur
- Ouvrir les DevTools (F12)
- Vérifier l'onglet "Console" pour les logs
- Vérifier l'onglet "Network" pour les appels API

### Firebase Console
- Aller sur [Firebase Console](https://console.firebase.google.com)
- Vérifier la Realtime Database
- Surveiller les changements en temps réel

### Logs à surveiller
- `✅ Daily.co room created: [roomId]`
- `✅ Meeting summary generated by Gemini`
- `✅ Appointment transcript and summary updated`
- `❌ Error...` (pour les erreurs)

---

## 🎯 Test rapide (5 minutes)

Si vous voulez tester rapidement les fonctionnalités principales :

1. **Réserver un RDV VIDEO** (2 min)
   - Se connecter en client
   - Réserver un RDV VIDEO pour dans 5 minutes
   - Vérifier Firebase

2. **Rejoindre la visio** (1 min)
   - Attendre 5 minutes ou modifier la date dans Firebase
   - Cliquer sur "Rejoindre la visio"
   - Vérifier que l'iframe se charge

3. **Vérifier le résumé** (2 min)
   - Quitter la réunion
   - Attendre 3-5 minutes
   - Se connecter en avocat
   - Aller dans "Mes rendez-vous" → "Passés"
   - Vérifier que le résumé apparaît

---

## 📝 Notes

- Les transcripts Daily.co peuvent prendre **2-5 minutes** à être disponibles
- Les résumés Gemini peuvent prendre **1-2 minutes** à être générés
- Pour tester rapidement, vous pouvez modifier les dates dans Firebase
- Les salles Daily.co sont persistantes (ne se suppriment pas automatiquement)

---

**Bon test ! 🚀**

