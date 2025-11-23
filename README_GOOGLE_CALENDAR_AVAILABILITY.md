# 📅 Intégration Google Calendar & Gestion des Disponibilités - Jurilab

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités implémentées](#fonctionnalités-implémentées)
3. [Architecture technique](#architecture-technique)
4. [Fichiers modifiés/créés](#fichiers-modifiéscréés)
5. [Guide d'utilisation](#guide-dutilisation)
6. [Problèmes résolus](#problèmes-résolus)
7. [Configuration requise](#configuration-requise)

---

## 🎯 Vue d'ensemble

Ce document décrit l'implémentation complète de deux fonctionnalités majeures pour la plateforme Jurilab :

1. **Intégration Google Calendar** : Synchronisation bidirectionnelle entre Jurilab et Google Calendar
2. **Gestion des heures de disponibilité** : Interface permettant aux avocats de définir leurs heures de travail

### Objectifs

- Permettre aux avocats de connecter leur Google Calendar
- Synchroniser automatiquement les événements de **TOUS** les calendriers Google (principal, école, cabinet, etc.)
- Bloquer les créneaux occupés dans Google Calendar pour les clients
- Créer/supprimer automatiquement les rendez-vous dans Google Calendar
- Permettre aux avocats de définir leurs heures de disponibilité hebdomadaires
- Filtrer les créneaux disponibles selon les heures de disponibilité ET Google Calendar

---

## ✨ Fonctionnalités implémentées

### 1. Intégration Google Calendar

#### Connexion/Déconnexion
- **Composant** : `components/GoogleCalendarConnection.tsx`
- **Fonctionnalités** :
  - Connexion via OAuth 2.0 (Firebase Auth)
  - Déconnexion avec confirmation
  - Affichage du statut de connexion
  - Affichage de la dernière synchronisation

#### Synchronisation des événements
- **Récupération depuis TOUS les calendriers** :
  - Calendrier principal
  - Calendriers partagés (école, cabinet, etc.)
  - Calendriers secondaires
- **Traitement par batch** : Les calendriers sont traités par groupes de 3 pour éviter `ERR_INSUFFICIENT_RESOURCES`
- **Délai entre batches** : 100ms pour éviter la surcharge

#### Blocage des créneaux occupés
- Les événements de Google Calendar bloquent automatiquement les créneaux pour les clients
- Fonctionne avec tous les calendriers connectés

#### Synchronisation bidirectionnelle
- **Création** : Quand un avocat accepte un RDV → Création automatique dans Google Calendar
- **Suppression** : Quand un RDV est annulé → Suppression automatique dans Google Calendar
- **Mise à jour** : Support pour la mise à jour d'événements (fonction disponible)

#### Gestion des tokens
- **Chiffrement** : Tokens stockés de manière chiffrée (Base64 - à améliorer en production)
- **Rafraîchissement automatique** : Si le token expire, rafraîchissement automatique si un refresh token est disponible
- **Vérification au chargement** : Le token est vérifié à chaque chargement de la page

### 2. Gestion des heures de disponibilité

#### Interface utilisateur
- **Composant** : `components/AvailabilitySettings.tsx`
- **Localisation** : Sidebar du Dashboard (visible uniquement pour les avocats)
- **Fonctionnalités** :
  - Activation/désactivation par jour de la semaine
  - Ajout/suppression de tranches horaires (ex: 09:00-12:00, 14:00-18:00)
  - Sauvegarde dans Firebase
  - Interface intuitive avec boutons d'ajout/suppression

#### Intégration avec les créneaux
- **Filtrage automatique** : Les créneaux sont filtrés selon les heures de disponibilité
- **Compatible avec Google Calendar** : Les heures de disponibilité ET Google Calendar sont pris en compte
- **Fonctionne avec les créneaux fixes** : Si Google Calendar n'est pas connecté, les heures de disponibilité filtrent les créneaux fixes

---

## 🏗️ Architecture technique

### Structure des données

#### Types TypeScript (`types.ts`)

```typescript
// Heures de disponibilité
interface TimeSlot {
  start: string; // Format HH:mm (ex: "09:00")
  end: string;   // Format HH:mm (ex: "12:00")
}

interface DayAvailability {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

interface AvailabilityHours {
  monday: DayAvailability;
  tuesday: DayAvailability;
  // ... autres jours
}

// Extension de l'interface Lawyer
interface Lawyer extends User {
  // ... champs existants
  googleCalendarConnected?: boolean;
  googleCalendarAccessToken?: string; // Chiffré
  googleCalendarRefreshToken?: string; // Chiffré
  googleCalendarLastSyncAt?: string;
  availabilityHours?: AvailabilityHours;
}

// Extension de l'interface Appointment
interface Appointment {
  // ... champs existants
  googleCalendarEventId?: string; // ID de l'événement dans Google Calendar
}
```

### Services

#### `services/googleCalendarService.ts`

**Fonctions principales** :
- `getGoogleCalendarList()` : Récupère la liste de tous les calendriers
- `getEventsFromCalendar()` : Récupère les événements d'un calendrier spécifique
- `getGoogleCalendarEvents()` : Récupère les événements de TOUS les calendriers
- `getAvailableSlots()` : Génère les créneaux disponibles en excluant les événements occupés
- `isSlotInAvailabilityHours()` : Vérifie si un créneau est dans les heures de disponibilité
- `createGoogleCalendarEvent()` : Crée un événement dans Google Calendar
- `updateGoogleCalendarEvent()` : Met à jour un événement dans Google Calendar
- `deleteGoogleCalendarEvent()` : Supprime un événement dans Google Calendar
- `refreshGoogleAccessToken()` : Rafraîchit le token d'accès

**Gestion des erreurs** :
- Traitement par batch pour éviter `ERR_INSUFFICIENT_RESOURCES`
- Gestion des tokens expirés avec rafraîchissement automatique
- Fallback sur le calendrier principal si la liste des calendriers échoue

#### `services/firebaseService.ts`

**Nouvelles fonctions** :
- `saveGoogleCalendarCredentials()` : Sauvegarde les credentials Google Calendar
- `getGoogleCalendarCredentials()` : Récupère les credentials Google Calendar
- `disconnectGoogleCalendar()` : Déconnecte le calendrier Google
- `updateGoogleCalendarAccessToken()` : Met à jour le token d'accès
- `syncAppointmentToGoogleCalendar()` : Synchronise un RDV avec Google Calendar
- `updateGoogleCalendarEvent()` : Met à jour un événement Google Calendar
- `deleteGoogleCalendarEvent()` : Supprime un événement Google Calendar
- `saveAvailabilityHours()` : Sauvegarde les heures de disponibilité
- `getAvailabilityHours()` : Récupère les heures de disponibilité

### Composants React

#### `components/GoogleCalendarConnection.tsx`

**Props** :
- `lawyerId: string` : ID de l'avocat
- `onConnectionChange?: (connected: boolean) => void` : Callback appelé lors du changement de statut

**Fonctionnalités** :
- Affichage du statut de connexion
- Bouton de connexion/déconnexion
- Vérification automatique de la validité du token
- Rafraîchissement automatique du token si expiré

#### `components/AvailabilitySettings.tsx`

**Props** :
- `lawyerId: string` : ID de l'avocat

**Fonctionnalités** :
- Interface pour définir les heures par jour
- Ajout/suppression de tranches horaires
- Sauvegarde dans Firebase
- Chargement des heures existantes

#### `components/LawyerProfileModal.tsx` (modifié)

**Modifications** :
- Intégration de `getAvailableSlots()` avec les heures de disponibilité
- Filtrage des créneaux selon les heures de disponibilité
- Support des créneaux Google Calendar ET des heures de disponibilité

### Store (`store/store.tsx`)

**Modifications** :
- `acceptAppointment()` : Synchronise avec Google Calendar après acceptation
- `cancelAppointment()` : Supprime l'événement Google Calendar après annulation

---

## 📁 Fichiers modifiés/créés

### Fichiers créés

1. **`components/GoogleCalendarConnection.tsx`**
   - Composant pour connecter/déconnecter Google Calendar
   - Gestion de l'OAuth et des tokens

2. **`components/AvailabilitySettings.tsx`**
   - Interface pour définir les heures de disponibilité
   - Gestion des tranches horaires par jour

3. **`services/googleCalendarService.ts`**
   - Service complet pour interagir avec l'API Google Calendar
   - Gestion des calendriers multiples
   - Génération de créneaux disponibles

4. **`GOOGLE_CALENDAR_SETUP.md`**
   - Documentation pour configurer Google Calendar API
   - Instructions de setup

5. **`README_GOOGLE_CALENDAR_AVAILABILITY.md`** (ce fichier)
   - Documentation complète de l'implémentation

### Fichiers modifiés

1. **`types.ts`**
   - Ajout de `TimeSlot`, `DayAvailability`, `AvailabilityHours`
   - Extension de `Lawyer` avec les champs Google Calendar et `availabilityHours`
   - Extension de `Appointment` avec `googleCalendarEventId`

2. **`services/firebaseService.ts`**
   - Ajout de toutes les fonctions Google Calendar
   - Ajout des fonctions pour les heures de disponibilité

3. **`components/LawyerProfileModal.tsx`**
   - Intégration de `getAvailableSlots()` avec les heures de disponibilité
   - Filtrage des créneaux selon les heures de disponibilité

4. **`pages/DashboardPage.tsx`**
   - Ajout du composant `AvailabilitySettings` dans la sidebar
   - Ajout du composant `GoogleCalendarConnection` dans la sidebar

5. **`store/store.tsx`**
   - Synchronisation Google Calendar dans `acceptAppointment()`
   - Suppression Google Calendar dans `cancelAppointment()`

---

## 📖 Guide d'utilisation

### Pour les avocats

#### Connecter Google Calendar

1. Aller dans le Dashboard
2. Dans la sidebar, trouver la section "Synchronisation Google Calendar"
3. Cliquer sur "Connecter Google Calendar"
4. Autoriser l'accès à Google Calendar dans la popup
5. Le calendrier est maintenant connecté et synchronisé

#### Définir les heures de disponibilité

1. Aller dans le Dashboard
2. Dans la sidebar, trouver la section "Disponibilité"
3. Cliquer sur "Disponibilité" pour l'ouvrir
4. Pour chaque jour :
   - Cocher/décocher pour activer/désactiver le jour
   - Ajouter des tranches horaires (ex: 09:00-12:00, 14:00-18:00)
   - Supprimer des tranches si nécessaire
5. Cliquer sur "Sauvegarder"

#### Comportement

- Les clients ne verront que les créneaux dans les heures de disponibilité définies
- Les événements de Google Calendar bloquent automatiquement les créneaux
- Les créneaux occupés dans Google Calendar ne sont pas proposés aux clients

### Pour les développeurs

#### Ajouter un nouveau calendrier externe

Les calendriers sont automatiquement détectés. Aucune action nécessaire.

#### Modifier les heures de disponibilité par défaut

Modifier `DEFAULT_AVAILABILITY` dans `components/AvailabilitySettings.tsx` :

```typescript
const DEFAULT_AVAILABILITY: AvailabilityHours = {
  monday: { enabled: true, timeSlots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  // ...
};
```

#### Personnaliser le traitement par batch

Modifier `batchSize` dans `services/googleCalendarService.ts` :

```typescript
const batchSize = 3; // Nombre de calendriers traités en parallèle
```

---

## 🔧 Problèmes résolus

### 1. Erreur `ERR_INSUFFICIENT_RESOURCES`

**Problème** : Trop de requêtes en parallèle vers l'API Google Calendar

**Solution** :
- Traitement par batch de 3 calendriers
- Délai de 100ms entre les batches
- Gestion d'erreur améliorée

### 2. Erreur `credential-already-in-use`

**Problème** : Tentative de lier un compte Google déjà lié

**Solution** :
- Vérification si l'utilisateur est déjà connecté avec Google
- Utilisation de `reauthenticateWithPopup` si déjà connecté
- Gestion gracieuse de l'erreur avec message informatif

### 3. Import manquant `isSlotInAvailabilityHours`

**Problème** : Fonction utilisée mais non importée

**Solution** : Ajout de l'import dans `LawyerProfileModal.tsx`

### 4. Token Google Calendar expiré

**Problème** : Le token expire et nécessite une reconnexion manuelle

**Solution** :
- Vérification automatique de la validité du token au chargement
- Rafraîchissement automatique si un refresh token est disponible
- Test du token avant de demander une reconnexion

### 5. Événements d'autres calendriers non comptabilisés

**Problème** : Seuls les événements du calendrier principal étaient pris en compte

**Solution** :
- Récupération de la liste de TOUS les calendriers
- Récupération des événements de chaque calendrier
- Combinaison de tous les événements pour bloquer les créneaux

---

## ⚙️ Configuration requise

### Google Cloud Console

1. **Projet Google Cloud** : Créer ou utiliser un projet existant
2. **API Google Calendar** : Activer l'API Google Calendar
3. **OAuth 2.0** : Configurer l'écran de consentement OAuth
4. **Identifiants OAuth** : Créer un ID client OAuth 2.0
5. **URI de redirection** : Ajouter les URI autorisés

### Firebase

1. **Authentication** : Activer Google comme méthode de connexion
2. **Realtime Database** : Structure de données pour stocker les credentials

### Variables d'environnement

Aucune variable d'environnement nécessaire. Tout est configuré via Firebase Config.

---

## 🔐 Sécurité

### Tokens

- **Chiffrement** : Les tokens sont chiffrés avec Base64 (à améliorer en production)
- **Stockage** : Tokens stockés dans Firebase Realtime Database
- **Accès** : Seuls les avocats peuvent accéder à leurs propres tokens

### Recommandations pour la production

1. **Chiffrement robuste** : Utiliser `crypto-js` ou Web Crypto API au lieu de Base64
2. **Refresh tokens** : Implémenter un backend pour obtenir les refresh tokens
3. **Validation** : Valider les tokens avant chaque utilisation
4. **Rate limiting** : Limiter le nombre de requêtes à l'API Google Calendar

---

## 📊 Flux de données

### Connexion Google Calendar

```
Utilisateur → GoogleCalendarConnection → Firebase Auth (OAuth) 
→ Google API (Token) → Firebase Realtime Database (Stockage chiffré)
```

### Synchronisation des créneaux

```
Client demande créneaux → LawyerProfileModal 
→ getGoogleCalendarEvents (Tous les calendriers) 
→ getAvailableSlots (Filtre selon disponibilité + Google Calendar)
→ Affichage des créneaux disponibles
```

### Création d'un RDV

```
Avocat accepte RDV → acceptAppointment (store.tsx)
→ syncAppointmentToGoogleCalendar (firebaseService.ts)
→ createGoogleCalendarEvent (googleCalendarService.ts)
→ Google Calendar API
→ Stockage de googleCalendarEventId dans Firebase
```

---

## 🐛 Debugging

### Logs utiles

- `📅 Fetching Google Calendar events` : Début de la récupération des événements
- `✅ Found X total events across Y calendars` : Événements trouvés
- `🚫 Busy slot` : Créneau occupé détecté
- `✅ Generated X available slots` : Créneaux disponibles générés
- `⚠️ Token expired` : Token expiré détecté
- `✅ Token refreshed` : Token rafraîchi avec succès

### Problèmes courants

1. **Token expiré** : Vérifier si un refresh token est disponible
2. **Calendriers non détectés** : Vérifier les permissions OAuth
3. **Créneaux non filtrés** : Vérifier que les heures de disponibilité sont sauvegardées
4. **Erreur 401** : Token invalide, reconnexion nécessaire

---

## 🚀 Améliorations futures

1. **Backend pour refresh tokens** : Implémenter un backend pour obtenir les refresh tokens
2. **Chiffrement robuste** : Remplacer Base64 par un chiffrement réel
3. **Synchronisation bidirectionnelle complète** : Mettre à jour les RDV si modifiés dans Google Calendar
4. **Notifications** : Notifier l'avocat si un événement Google Calendar est ajouté/modifié
5. **Statistiques** : Afficher des statistiques sur l'utilisation de Google Calendar
6. **Multi-calendriers sélectionnables** : Permettre à l'avocat de choisir quels calendriers synchroniser

---

## 📝 Notes importantes

- Les tokens Google Calendar expirent après 1 heure (par défaut)
- Les refresh tokens ne sont pas disponibles côté client avec Firebase Auth seul
- Le chiffrement Base64 n'est pas sécurisé pour la production
- Les événements de Google Calendar sont récupérés pour les 8 prochains jours
- Les créneaux sont générés avec un intervalle de 15 minutes par défaut

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs dans la console du navigateur
2. Vérifier la configuration Google Cloud Console
3. Vérifier que l'API Google Calendar est activée
4. Vérifier que les permissions OAuth sont correctes

---

**Dernière mise à jour** : [Date de création]
**Version** : 1.0.0
**Auteur** : Équipe Jurilab

