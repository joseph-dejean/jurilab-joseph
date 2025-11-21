# Feature : Visioconférence avec Daily.co

## 📋 Vue d'ensemble

Cette feature implémente un système complet de visioconférence intégré à l'application Jurilab, permettant aux avocats et clients de :
- Réserver des consultations vidéo (avec système d'acceptation par l'avocat)
- Gérer les rendez-vous (acceptation, annulation avec restrictions)
- Rejoindre automatiquement des salles de visioconférence Daily.co
- Générer automatiquement des transcripts et résumés de réunions via Gemini AI
- Consulter et partager les résumés de consultations

### Fonctionnalités principales

1. **Système de réservation avec acceptation** : Les RDV sont créés en statut `PENDING` et doivent être acceptés par l'avocat
2. **Gestion des créneaux** : Créneaux toutes les 15 minutes de 8h à 19h, avec vérification de conflits
3. **Visioconférence Daily.co** : Intégration complète avec création automatique de salles
4. **Résumé IA automatique** : Génération automatique de résumés structurés via Gemini après chaque réunion
5. **Partage de résumés** : L'avocat peut partager les résumés avec le client

## 🏗️ Architecture

### Flux principal

```
1. Réservation (Client)
   ↓
   - Vérification des conflits de créneaux (avocat + client)
   - Création du RDV avec statut PENDING
   ↓
2. Acceptation par l'avocat
   ↓
   - Vérification des conflits (en excluant le RDV en cours d'acceptation)
   - Création automatique de salle Daily.co (si type VIDEO)
   - Changement du statut à CONFIRMED
   - Stockage des infos (dailyRoomUrl, dailyRoomId) dans Firebase
   ↓
3. Accès à la visio via "Rejoindre la visio" (5 min avant → 1h après)
   ↓
4. Fin de réunion → Extraction automatique du transcript
   ↓
5. Génération du résumé via Gemini AI
   ↓
6. Stockage dans Firebase (transcript, summary, meetingEndedAt)
   ↓
7. Affichage du résumé (avocat uniquement, avec option de partage)
```

## 📁 Structure des fichiers

### Services créés

#### `services/dailyService.ts`
Service centralisé pour toutes les interactions avec l'API Daily.co.

**Fonctions principales :**
- `createRoom(roomId, lawyerName, clientName, duration)` : Crée une salle Daily.co
- `generateToken(roomId, userId, userName, isOwner)` : Génère un token d'accès
- `getRoomTranscript(roomId)` : Récupère le transcript d'une réunion
- `getRoomInfo(roomId)` : Récupère les informations d'une salle
- `deleteRoom(roomId)` : Supprime une salle

**Configuration :**
- Utilise `VITE_DAILY_API_KEY` depuis `.env` (racine du projet)
- Base URL : `https://api.daily.co/v1`

#### `services/meetingProcessor.ts`
Service pour traiter les réunions terminées et générer les résumés.

**Fonctions principales :**
- `processCompletedMeeting(appointment, lawyerName, clientName)` : 
  - Extrait le transcript depuis Daily.co
  - Génère le résumé via Gemini
  - Met à jour Firebase avec transcript, summary, meetingEndedAt
- `checkAndProcessCompletedMeetings()` : Vérifie et traite toutes les réunions terminées (polling)

**Logique de traitement :**
1. Vérifie si la réunion est terminée (`meetingEndedAt` non défini)
2. Récupère le transcript depuis Daily.co
3. Génère le résumé avec Gemini (format structuré en français)
4. Met à jour l'appointment dans Firebase

#### `services/geminiService.ts` (modifié)
Extension pour la génération de résumés de réunions.

**Nouvelle fonction :**
- `generateMeetingSummary(transcript, lawyerName, clientName, meetingDate)` : 
  - Génère un résumé structuré en français
  - Format : Contexte, Points clés, Décisions, Actions à suivre, Recommandations

### Composants créés

#### `components/MeetingSummary.tsx`
Composant React pour afficher le résumé et le transcript d'une réunion.

**Fonctionnalités :**
- Affichage du résumé généré par Gemini
- Transcript complet (collapsible)
- Bouton "Partager avec le client" (toggle `summaryShared`)
- Option de régénérer le résumé
- Copie du résumé/transcript dans le presse-papier
- Informations de la consultation (date, heure, durée, participants)
- Badge "Partagé avec le client" si applicable

**Props :**
```typescript
interface MeetingSummaryProps {
  appointment: Appointment;
  lawyerName: string;
  clientName: string;
  onSummaryShared?: () => void;
  onSummaryRegenerated?: () => void;
}
```

**Visibilité :**
- Avocat : Voit toujours le résumé et peut le partager
- Client : Voit le résumé uniquement si `summaryShared === true`

### Pages créées/modifiées

#### `pages/MyAppointmentsPage.tsx` (créé)
Page principale pour gérer les rendez-vous (style Doctolib).

**Fonctionnalités :**
- Liste de tous les rendez-vous de l'utilisateur
- Filtres par statut (Tous, À venir, Passés, Annulés)
- Filtres par type (Tous, Visio, Présentiel, Téléphone)
- Tri chronologique
- Badges de statut colorés
- Bouton "Rejoindre la visio" pour les RDV VIDEO à venir
- Bouton "Voir résumé" pour les RDV terminés (avocat uniquement)
- Affichage conditionnel du composant `MeetingSummary`

**Design :**
- Interface moderne style Doctolib
- Cards avec hover effects
- Responsive design
- Dark mode support

#### `pages/VideoCallPage.tsx` (modifié)
Page pour rejoindre et participer à une visioconférence.

**Modifications principales :**
- Remplacement de l'intégration Agora.io par Daily.co iframe
- Génération automatique du token d'accès
- Gestion du cycle de vie de la réunion
- Déclenchement automatique du traitement post-réunion
- Redirection vers `/my-appointments` après la fin

**Paramètres URL :**
- `roomUrl` : URL de la salle Daily.co
- `appointmentId` : ID du rendez-vous (pour le traitement post-réunion)

**Fonctionnalités :**
- Chargement de l'iframe Daily.co avec token
- Détection de la fin de réunion (via polling ou événement)
- Appel automatique à `processCompletedMeeting()` à la fin

#### `pages/DashboardPage.tsx` (modifié)
Amélioration de l'affichage des rendez-vous dans le dashboard.

**Modifications :**
- Badges de statut colorés (Confirmé, En attente, Annulé, Terminé)
- Bouton "Rejoindre la visio" conditionnel (15 min avant → 1h après)
- Affichage amélioré avec icônes de type
- Tri chronologique des rendez-vous
- Lien vers `/my-appointments`

### Services modifiés

#### `services/firebaseService.ts`
Ajout de nouvelles fonctions pour gérer les transcripts, résumés et les RDV.

**Nouvelles fonctions :**
- `updateAppointmentTranscript(appointmentId, transcript, summary, meetingEndedAt)` : 
  - Met à jour un appointment avec transcript, summary, meetingEndedAt
  - Change le statut à 'COMPLETED'
- `shareSummaryWithClient(appointmentId)` : 
  - Toggle `summaryShared` pour partager/retirer le résumé avec le client
- `acceptAppointment(appointmentId)` :
  - Change le statut de `PENDING` à `CONFIRMED`
  - Vérifie que le statut est bien `PENDING` avant acceptation
- `cancelAppointment(appointmentId)` :
  - Change le statut à `CANCELLED`
  - Vérifie que le RDV n'est pas déjà annulé ou terminé
- `checkAppointmentConflict(lawyerId, clientId, date, duration, excludeAppointmentId?)` :
  - Vérifie s'il y a un conflit de créneaux
  - Paramètre `excludeAppointmentId` pour exclure un RDV de la vérification (utile lors de l'acceptation)
  - Retourne `{ hasConflict: boolean, conflictReason?: string }`

#### `store/store.tsx` (modifié)
Modifications pour intégrer Daily.co et la gestion des RDV.

**Fonction `bookAppointment` :**
- Vérification des conflits de créneaux avant création
- Création du RDV avec statut `PENDING` (nécessite acceptation)
- **Ne crée PAS la salle Daily.co** à la réservation (créée lors de l'acceptation)
- Stockage de `lawyerName` et `clientName` dans l'appointment

**Nouvelle fonction `acceptAppointment` :**
- Vérification que l'utilisateur est un avocat
- Vérification des conflits (en excluant le RDV en cours)
- Création de la salle Daily.co si type VIDEO
- Changement du statut à `CONFIRMED`
- Stockage de `dailyRoomUrl` et `dailyRoomId`

**Nouvelle fonction `cancelAppointment` :**
- Vérification que l'utilisateur peut annuler (client ou avocat du RDV)
- **Restriction** : Vérifie qu'on est à plus de 24h avant le RDV
- Changement du statut à `CANCELLED`

**Logique :**
```typescript
// Réservation
const newAppt: Appointment = {
  status: 'PENDING', // En attente d'acceptation
  // Pas de salle Daily.co créée ici
};

// Acceptation
if (appointment.type === 'VIDEO') {
  const room = await createRoom(...);
  // Stockage de dailyRoomUrl et dailyRoomId
}
```

### Types modifiés

#### `types.ts`
Extension de l'interface `Appointment` pour inclure les données Daily.co et les résumés.

**Nouveaux champs :**
```typescript
export interface Appointment {
  // ... champs existants
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED'; // Statut du RDV
  duration: number; // Durée en minutes (30, 60, 90, 120)
  lawyerName: string; // Nom de l'avocat (stocké pour affichage rapide)
  clientName: string; // Nom du client (stocké pour affichage rapide)
  dailyRoomUrl?: string; // URL de la salle Daily.co (créée lors de l'acceptation)
  dailyRoomId?: string; // ID de la salle Daily.co
  transcript?: string; // Transcript de la réunion (généré après la fin)
  summary?: string; // Résumé généré par Gemini AI (généré après la fin)
  summaryShared?: boolean; // Si le résumé est partagé avec le client
  meetingEndedAt?: string; // Date de fin de réunion (ISO string)
}
```

## 🔧 Configuration

### Variables d'environnement

Fichier `.env` à la racine du projet `HACKATON_GOOGLE` :

```env
VITE_DAILY_API_KEY=your_daily_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Configuration Vite

`vite.config.ts` modifié pour charger les variables depuis le répertoire parent :

```typescript
const parentDir = path.resolve(__dirname, '..');
const env = loadEnv(mode, parentDir, '');

define: {
  'import.meta.env.VITE_DAILY_API_KEY': JSON.stringify(env.VITE_DAILY_API_KEY || ''),
  'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
}
```

## 🔄 Flux de données

### 1. Réservation d'un rendez-vous VIDEO

```
Client → bookAppointment()
  ↓
Vérification des conflits de créneaux (avocat + client)
  ↓
Création du RDV avec statut PENDING
  ↓
Stockage dans Firebase :
  - status: 'PENDING'
  - duration
  - type: 'VIDEO'
  - lawyerName, clientName
  - (Pas de salle Daily.co créée ici)
```

### 1bis. Acceptation d'un rendez-vous

```
Avocat → acceptAppointment()
  ↓
Vérification des conflits (en excluant le RDV en cours)
  ↓
Si type === 'VIDEO' :
  createRoom() → Daily.co API
  ↓
Stockage dans Firebase :
  - dailyRoomUrl
  - dailyRoomId
  - status: 'CONFIRMED'
```

### 2. Rejoindre une visioconférence

```
Utilisateur clique "Rejoindre la visio"
  ↓
Vérification canJoinVideo() (5 min avant → 1h après)
  ↓
Navigation vers /video-call?roomUrl=...&appointmentId=...
  ↓
generateToken() → Daily.co API
  ↓
Chargement iframe Daily.co avec token
```

### 3. Fin de réunion et traitement IA

```
Détection fin de réunion (VideoCallPage)
  ↓
handleMeetingEnd()
  ↓
processCompletedMeeting()
  ├─ getRoomTranscript() → Daily.co API
  │   ├─ Filtre les sessions avec 2+ participants
  │   ├─ Fenêtre : 15 min avant → durée RDV + 1h après
  │   └─ Combine tous les transcripts pertinents
  ├─ generateMeetingSummary() → Gemini API
  │   ├─ Prompt structuré en français
  │   ├─ Format : Contexte, Points clés, Décisions, Actions, Recommandations
  │   └─ Génération automatique du résumé
  └─ updateAppointmentTranscript() → Firebase
      ├─ transcript (texte complet)
      ├─ summary (résumé IA)
      ├─ meetingEndedAt (timestamp)
      └─ status: 'COMPLETED'
  ↓
Redirection vers /my-appointments
```

### 4. Consultation du résumé

```
Avocat → MyAppointmentsPage
  ↓
Clic "Voir résumé" (RDV terminés uniquement)
  ↓
Affichage MeetingSummary
  ├─ Résumé IA (toujours visible pour avocat)
  │   ├─ Contexte de la consultation
  │   ├─ Points clés discutés
  │   ├─ Décisions prises
  │   ├─ Actions à suivre
  │   └─ Recommandations
  ├─ Transcript (collapsible, texte complet)
  ├─ Bouton "Partager avec le client" (toggle)
  ├─ Bouton "Régénérer le résumé" (utilise le transcript existant)
  └─ Bouton "Copier" (résumé ou transcript)
  ↓
shareSummaryWithClient() → Firebase (toggle summaryShared)
  ↓
Client peut maintenant voir le résumé (si summaryShared === true)
```

## 🎯 Fonctionnalités principales

### 1. Système de réservation avec acceptation
- Les RDV sont créés avec le statut `PENDING` (en attente d'acceptation)
- L'avocat doit accepter le RDV pour le confirmer
- La salle Daily.co est créée **lors de l'acceptation** (pas à la réservation)
- Vérification des conflits de créneaux avant création et acceptation
- Créneaux disponibles : toutes les 15 minutes de 8h à 19h (44 créneaux/jour)

### 2. Gestion des rendez-vous

#### Acceptation des RDV
- Les RDV sont créés avec le statut `PENDING` (en attente d'acceptation)
- L'avocat voit un bouton "Accepter" pour les RDV en attente
- Lors de l'acceptation :
  - Vérification des conflits de créneaux (en excluant le RDV en cours)
  - Création de la salle Daily.co si type VIDEO
  - Changement du statut à `CONFIRMED`

#### Annulation des RDV
- Bouton "Annuler" disponible pour client et avocat
- **Restriction** : Impossible d'annuler moins de 24h avant le RDV
- Changement du statut à `CANCELLED`
- Vérification côté UI et côté logique métier

#### Vérification des conflits
- Empêche les doubles réservations (même heure pour avocat ou client)
- Fonction `checkAppointmentConflict()` avec paramètre `excludeAppointmentId`
- Filtrage automatique des créneaux déjà réservés dans le calendrier

#### Créneaux disponibles
- Créneaux générés toutes les 15 minutes de 8h à 19h (44 créneaux par jour)
- Filtrage automatique des créneaux passés et réservés
- Disponible pour 8 jours à l'avance

### 3. Accès à la visioconférence
- Bouton "Rejoindre la visio" visible **5 minutes avant** l'heure prévue
- Disponible jusqu'à 1 heure après l'heure prévue
- Génération automatique du token d'accès
- Intégration via iframe Daily.co

### 4. Génération automatique de résumés IA

#### Processus de génération
1. **Extraction du transcript** : Récupération depuis Daily.co après la fin de réunion
   - Filtrage des sessions avec au moins 2 participants ou durée > 30s
   - Fenêtre de récupération : 15 min avant le RDV → durée du RDV + 1h après
   - Combinaison de tous les transcripts pertinents par ordre chronologique

2. **Génération du résumé via Gemini AI** :
   - Fonction : `generateMeetingSummary(transcript, lawyerName, clientName, meetingDate)`
   - Prompt structuré pour générer un résumé professionnel en français
   - Format du résumé :
     - **Contexte** : Résumé du contexte et du problème du client
     - **Points clés discutés** : Liste des principaux sujets abordés
     - **Décisions prises** : Accords et décisions pendant la consultation
     - **Actions à suivre** : Prochaines étapes avec responsables (avocat/client)
     - **Recommandations** : Recommandations de l'avocat

3. **Stockage** :
   - `transcript` : Transcript complet de la réunion
   - `summary` : Résumé généré par Gemini
   - `meetingEndedAt` : Timestamp ISO de fin de réunion
   - Statut automatiquement changé à `COMPLETED`

#### Gestion des erreurs
- Si le transcript n'est pas disponible immédiatement, retourne vide (pas d'erreur fatale)
- Le système peut réessayer plus tard via polling
- Gestion gracieuse des erreurs API (Daily.co ou Gemini)

### 5. Gestion des résumés
- Affichage pour l'avocat uniquement par défaut
- Option de partage avec le client (toggle `summaryShared`)
- Possibilité de régénérer le résumé (utilise `processCompletedMeeting` avec le transcript existant)
- Copie du résumé/transcript dans le presse-papier
- Affichage conditionnel pour le client si partagé
- Badge "Partagé avec le client" visible pour l'avocat

### 6. Interface utilisateur
- Page "Mes rendez-vous" avec filtres et design moderne
- Badges de statut colorés (Confirmé, En attente, Annulé, Terminé)
- Boutons d'action contextuels :
  - "Accepter" (avocat, RDV en attente)
  - "Annuler" (client/avocat, si > 24h avant)
  - "Rejoindre la visio" (5 min avant → 1h après)
  - "Voir résumé" (avocat, RDV terminés)
- Dashboard amélioré avec informations détaillées
- Responsive design et dark mode

## 📊 Structure de données Firebase

### Appointments

```json
{
  "appointments": {
    "appt_1234567890": {
      "id": "appt_1234567890",
      "lawyerId": "lawyer_id",
      "clientId": "client_id",
      "date": "2024-01-15T10:00:00.000Z",
      "status": "COMPLETED",
      "type": "VIDEO",
      "duration": 60,
      "dailyRoomUrl": "https://jurilab.daily.co/room_123",
      "dailyRoomId": "room_123",
      "transcript": "Lawyer: Bonjour...\nClient: Bonjour...",
      "summary": "Contexte de la réunion...\nPoints clés...",
      "summaryShared": true,
      "meetingEndedAt": "2024-01-15T11:05:00.000Z",
      "notes": "Consultation initiale"
    }
  }
}
```

## 🔐 Sécurité

### Tokens Daily.co
- Génération côté client avec API key
- Tokens avec permissions limitées (owner/guest)
- Expiration automatique des tokens

### Accès aux résumés
- Résumés visibles uniquement par l'avocat par défaut
- Partage explicite requis pour le client
- Pas d'accès direct aux transcripts pour le client

## 🚀 Utilisation

### Pour les développeurs

#### Tester la création d'une salle
```typescript
import { createRoom } from './services/dailyService';

const room = await createRoom(
  'test-room-123',
  'Maître Dupont',
  'Client Test',
  60
);
console.log(room.roomUrl);
```

#### Tester la génération de résumé
```typescript
import { processCompletedMeeting } from './services/meetingProcessor';

await processCompletedMeeting(
  appointment,
  'Maître Dupont',
  'Client Test'
);
```

### Pour les utilisateurs

#### Réserver une consultation vidéo
1. Aller sur le profil d'un avocat
2. Sélectionner un créneau (toutes les 15 min de 8h à 19h)
3. Choisir "Visioconférence" comme type
4. Sélectionner la durée (30, 60, 90, 120 min)
5. Confirmer la réservation (statut PENDING)
6. Attendre l'acceptation de l'avocat

#### Accepter un rendez-vous (Avocat)
1. Aller dans "Mes rendez-vous"
2. Filtrer par "À venir" ou voir les RDV en attente
3. Cliquer sur "Accepter" pour un RDV PENDING
4. La salle Daily.co est créée automatiquement si type VIDEO
5. Le statut passe à CONFIRMED

#### Rejoindre une visioconférence
1. Aller dans "Mes rendez-vous" ou le Dashboard
2. Cliquer sur "Rejoindre la visio" (visible **5 min avant**)
3. Autoriser l'accès caméra/microphone
4. Participer à la réunion
5. Le transcript et le résumé sont générés automatiquement après la fin

#### Consulter un résumé (Avocat)
1. Aller dans "Mes rendez-vous"
2. Filtrer par "Passés"
3. Cliquer sur "Voir résumé" pour un RDV terminé (statut COMPLETED)
4. Consulter le résumé IA structuré :
   - Contexte de la consultation
   - Points clés discutés
   - Décisions prises
   - Actions à suivre
   - Recommandations
5. Consulter le transcript complet (collapsible)
6. Optionnel : Partager avec le client (toggle)
7. Optionnel : Régénérer le résumé si besoin

#### Consulter un résumé partagé (Client)
1. Aller dans "Mes rendez-vous"
2. Filtrer par "Passés"
3. Si le résumé a été partagé, il apparaît automatiquement

## 🐛 Dépannage

### La salle Daily.co n'est pas créée
- Vérifier que `VITE_DAILY_API_KEY` est défini dans `.env`
- Vérifier les logs de la console pour les erreurs API
- Vérifier que le type de consultation est bien 'VIDEO'

### Le transcript n'est pas disponible
- Vérifier que la réunion s'est bien terminée
- Vérifier que `meetingEndedAt` est défini dans Firebase
- Vérifier les logs de `meetingProcessor.ts`
- Le transcript peut prendre quelques minutes à être disponible après la fin

### Le résumé n'est pas généré
- Vérifier que `VITE_GEMINI_API_KEY` est défini
- Vérifier que le transcript existe
- Vérifier les logs de `geminiService.ts`
- Le résumé est généré automatiquement après extraction du transcript

### Le bouton "Rejoindre la visio" n'apparaît pas
- Vérifier que le type est 'VIDEO'
- Vérifier que le statut est 'CONFIRMED' (pas PENDING)
- Vérifier que le statut n'est pas 'CANCELLED'
- Vérifier que l'heure est dans la fenêtre (**5 min avant** → 1h après)
- Vérifier que `dailyRoomUrl` existe dans Firebase

### Impossible d'accepter un RDV
- Vérifier que vous êtes bien l'avocat du RDV
- Vérifier qu'il n'y a pas de conflit de créneaux
- Vérifier que le statut est bien 'PENDING'

### Impossible d'annuler un RDV
- Vérifier que vous êtes le client ou l'avocat du RDV
- Vérifier qu'on est à plus de 24h avant le RDV (restriction)
- Vérifier que le statut n'est pas déjà 'CANCELLED' ou 'COMPLETED'

## 📝 Notes importantes

1. **Statut des RDV** :
   - `PENDING` : En attente d'acceptation par l'avocat
   - `CONFIRMED` : Accepté par l'avocat, salle Daily.co créée
   - `CANCELLED` : Annulé (impossible si < 24h avant)
   - `COMPLETED` : Terminé, transcript et résumé générés

2. **Créneaux disponibles** :
   - Génération automatique toutes les 15 minutes de 8h à 19h
   - 44 créneaux par jour
   - Filtrage automatique des créneaux passés et réservés
   - Disponible pour 8 jours à l'avance

3. **Vérification des conflits** :
   - Vérifie les conflits pour l'avocat ET le client
   - Exclut les RDV annulés et terminés
   - Paramètre `excludeAppointmentId` pour exclure un RDV de la vérification (utile lors de l'acceptation)

4. **Résumé IA** :
   - Généré automatiquement après la fin de réunion
   - Format structuré en français (Contexte, Points clés, Décisions, Actions, Recommandations)
   - Peut être régénéré si besoin (utilise le transcript existant)
   - Partage optionnel avec le client

5. **Polling vs Webhooks** : Actuellement, le système utilise un polling dans `VideoCallPage` pour détecter la fin de réunion. Une amélioration future serait d'utiliser les webhooks Daily.co pour une détection en temps réel.

6. **Limites Daily.co** : 
   - Les transcripts peuvent prendre quelques minutes à être disponibles
   - Les salles sont persistantes par défaut (peuvent être supprimées manuellement)
   - La transcription nécessite `enable_transcription: true` (pas besoin d'enregistrement)

7. **Coûts** : 
   - Daily.co facture par minute de réunion
   - Gemini API facture par token utilisé pour la génération de résumés

8. **Sécurité** : 
   - Les API keys sont exposées côté client (limitation Vite)
   - En production, il faudrait utiliser un backend pour sécuriser les clés

## 🔮 Améliorations futures

### Résumé IA
1. **Amélioration du prompt** : Affiner le prompt pour des résumés plus précis et contextuels
2. **Personnalisation** : Permettre à l'avocat de personnaliser le format du résumé
3. **Extraction d'entités** : Extraire automatiquement les dates, montants, parties impliquées
4. **Suggestions d'actions** : Générer des suggestions d'actions basées sur le contexte juridique
5. **Multi-langues** : Support pour générer des résumés dans d'autres langues

### Fonctionnalités générales
1. **Webhooks Daily.co** : Remplacer le polling par des webhooks pour une détection en temps réel
2. **Notifications** : Notifier l'avocat quand un résumé est prêt
3. **Export PDF** : Permettre l'export du résumé en PDF
4. **Recherche dans transcripts** : Fonction de recherche dans les transcripts
5. **Analytics** : Statistiques sur les réunions (durée moyenne, etc.)
6. **Enregistrement vidéo** : Option d'enregistrer les réunions (si autorisé)
7. **Partage de documents** : Partage de documents pendant la réunion
8. **Chat intégré** : Chat texte pendant la visioconférence
9. **Rappels automatiques** : Notifications avant les RDV
10. **Gestion des disponibilités** : Permettre aux avocats de définir leurs créneaux disponibles

## 📚 Ressources

- [Documentation Daily.co](https://docs.daily.co/)
- [API Daily.co](https://docs.daily.co/reference/rest-api)
- [Documentation Gemini](https://ai.google.dev/docs)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)

## 🤖 Contexte pour l'intégration IA (Résumé)

### État actuel
Le système de résumé IA est **partiellement implémenté** et fonctionnel. Voici ce qui est en place :

#### Ce qui fonctionne
1. **Extraction du transcript** : `getRoomTranscript()` récupère les transcripts depuis Daily.co
2. **Génération du résumé** : `generateMeetingSummary()` utilise Gemini pour générer un résumé structuré
3. **Stockage** : Les transcripts et résumés sont stockés dans Firebase
4. **Affichage** : Le composant `MeetingSummary` affiche le résumé et permet le partage
5. **Régénération** : Possibilité de régénérer le résumé avec le transcript existant

#### Format actuel du résumé
Le prompt Gemini génère un résumé structuré en français avec :
- **Contexte** : Résumé du contexte et du problème du client
- **Points clés discutés** : Liste des principaux sujets abordés
- **Décisions prises** : Accords et décisions pendant la consultation
- **Actions à suivre** : Prochaines étapes avec responsables (avocat/client)
- **Recommandations** : Recommandations de l'avocat

#### Fichiers clés pour l'IA
- `services/geminiService.ts` : Fonction `generateMeetingSummary()`
- `services/meetingProcessor.ts` : Orchestration du traitement (transcript → résumé → stockage)
- `components/MeetingSummary.tsx` : Affichage et gestion du résumé
- `services/dailyService.ts` : Extraction du transcript depuis Daily.co

#### Points d'amélioration possibles
1. **Prompt plus sophistiqué** : Ajouter du contexte juridique, des exemples, des instructions plus précises
2. **Extraction d'entités** : Extraire dates, montants, parties, références légales
3. **Personnalisation** : Permettre à l'avocat de choisir le format du résumé
4. **Multi-langues** : Support pour d'autres langues
5. **Validation** : Vérifier la qualité du résumé généré
6. **Historique** : Garder un historique des versions du résumé

#### Exemple de prompt actuel
```typescript
const prompt = `
Tu es un assistant juridique expert. Analyse le transcript suivant...
Génère un résumé en français, structuré de la manière suivante :
1. Contexte
2. Points clés discutés
3. Décisions prises
4. Actions à suivre
5. Recommandations
`;
```

#### Prochaines étapes suggérées
1. Améliorer le prompt pour des résumés plus précis
2. Ajouter l'extraction d'entités (dates, montants, etc.)
3. Permettre la personnalisation du format
4. Ajouter la validation de la qualité du résumé

---

**Dernière mise à jour** : Janvier 2024
**Auteur** : Équipe Jurilab

