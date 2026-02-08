# 📋 Système de Suivi des Diligences (Time Tracking)

## Vue d'ensemble

Le système de suivi des diligences permet aux avocats de suivre précisément le temps passé sur chaque dossier client. Cette fonctionnalité est intégrée directement dans le Portfolio Client et facilite la facturation et la gestion du temps.

## Fonctionnalités

### ⏱️ Chronomètre en temps réel
- **Démarrer/Arrêter** : Lancer un chronomètre pour suivre le temps de travail en temps réel
- **Affichage en direct** : Le temps s'affiche en format HH:MM:SS pendant que vous travaillez
- **Persistance** : Le chronomètre continue même si vous fermez l'application

### 📝 Enregistrement détaillé
Chaque diligence enregistre :
- **Heure de début** et **heure de fin**
- **Durée totale** calculée automatiquement
- **Description** du travail effectué
- **Catégorie** de la diligence
- **Facturable** : Option pour marquer si c'est facturable au client

### 🏷️ Catégories prédéfinies
- Recherche
- Rédaction
- Révision documents
- Consultation
- Correspondance
- Appel téléphonique
- Déplacement
- Réunion
- Préparation audience
- Autre

### 📊 Statistiques et rapports
- **Temps total** : Cumul de toutes les diligences
- **Temps facturable** : Somme du temps marqué comme facturable
- **Historique complet** : Toutes les diligences avec dates et descriptions

## Utilisation

### 1. Accéder aux diligences
1. Allez dans **Portfolio** depuis le dashboard avocat
2. Sélectionnez un **client** dans la liste
3. Cliquez sur l'onglet **"Diligences"**

### 2. Démarrer une diligence
1. Cliquez sur le bouton **"Démarrer"**
2. Le chronomètre se lance automatiquement
3. Continuez votre travail normalement

### 3. Arrêter et enregistrer
1. Cliquez sur **"Arrêter"** quand vous avez terminé
2. Sélectionnez la **catégorie** du travail effectué
3. Ajoutez une **description** détaillée
4. Cochez **"Temps facturable"** si applicable
5. La diligence est automatiquement enregistrée

### 4. Gérer l'historique
- **Modifier** : Cliquez sur l'icône crayon pour éditer la description
- **Supprimer** : Cliquez sur l'icône poubelle pour supprimer une entrée
- **Consulter** : Visualisez l'historique complet avec dates et durées

## Structure des données

### Type DiligenceEntry
```typescript
interface DiligenceEntry {
  id: string;
  lawyerId: string;              // Avocat qui a effectué la diligence
  clientId: string;              // Client pour lequel le travail a été fait
  startTime: string;             // ISO timestamp de début
  endTime?: string;              // ISO timestamp de fin (undefined si en cours)
  duration?: number;             // Durée en secondes (calculée après arrêt)
  description: string;           // Description du travail effectué
  category?: string;             // Type de diligence
  createdAt: string;             // ISO timestamp de création
  updatedAt: string;             // ISO timestamp de dernière modification
  billable?: boolean;            // Si c'est facturable ou non
}
```

## Base de données Firestore

### Collection : `diligences`
- **Règles de sécurité** : Seuls les avocats peuvent lire/écrire leurs propres diligences
- **Index** : `lawyerId`, `clientId`, `createdAt`
- **Temps réel** : Mise à jour automatique via `onSnapshot`

### Exemple de document
```json
{
  "id": "diligence_12345",
  "lawyerId": "lawyer_abc",
  "clientId": "client_xyz",
  "startTime": "2026-01-31T10:00:00.000Z",
  "endTime": "2026-01-31T12:30:00.000Z",
  "duration": 9000,
  "description": "Révision du contrat de bail et préparation des amendements",
  "category": "Révision documents",
  "billable": true,
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T12:30:00.000Z"
}
```

## Composants

### DiligenceTracker
**Fichier** : `components/DiligenceTracker.tsx`

**Props** :
- `lawyerId: string` - ID de l'avocat
- `clientId: string` - ID du client

**Fonctionnalités** :
- Chronomètre en temps réel
- Formulaire de description et catégorisation
- Historique des diligences
- Actions CRUD (Create, Read, Update, Delete)

## Intégration

### Dans PortfolioPage
```tsx
import { DiligenceTracker } from '../components/DiligenceTracker';

// Dans le rendu
{activeTab === 'diligences' && currentUser && (
  <DiligenceTracker
    lawyerId={currentUser.id}
    clientId={selectedClient.id}
  />
)}
```

## Déploiement des règles Firestore

Pour déployer les nouvelles règles de sécurité :

```bash
firebase deploy --only firestore:rules
```

## Évolutions futures possibles

1. **Export PDF** : Générer des rapports PDF des diligences pour la facturation
2. **Taux horaire** : Calculer automatiquement le montant à facturer
3. **Rappels** : Notifications pour rappeler d'enregistrer les diligences
4. **Statistiques avancées** : Graphiques de temps par client/catégorie
5. **Filtres** : Filtrer par date, catégorie, client
6. **Export Excel** : Exporter les données pour la comptabilité
7. **Templates** : Descriptions prédéfinies pour les tâches récurrentes
8. **Intégration facturation** : Générer automatiquement des factures

## Support

Pour toute question ou problème :
1. Vérifiez que les règles Firestore sont déployées
2. Assurez-vous que l'utilisateur a le rôle `LAWYER`
3. Consultez la console Firebase pour les logs d'erreur
