# 🎨 Guide Visuel - Système de Diligences

## Interface Utilisateur

### 1. Localisation dans l'application

```
Dashboard Avocat
    └── Portfolio Clients
        └── [Sélectionner un client]
            └── Onglet "Diligences" ⏱️
```

### 2. Vue principale du Chronomètre

```
┌─────────────────────────────────────────────────┐
│  ⏱️ Suivi du temps de travail                   │
│  Total: 02:30:45 | Facturable: 02:15:30         │
├─────────────────────────────────────────────────┤
│                                                 │
│              ┌──────────────┐                   │
│              │  00:00:00    │  ← Chronomètre    │
│              └──────────────┘                   │
│                                                 │
│              [  DÉMARRER  ]   ← Bouton         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. Chronomètre actif

```
┌─────────────────────────────────────────────────┐
│  ⏱️ Suivi du temps de travail                   │
│  Total: 02:30:45 | Facturable: 02:15:30         │
├─────────────────────────────────────────────────┤
│                                                 │
│              ┌──────────────┐                   │
│              │  00:15:42    │  ← En cours...    │
│              └──────────────┘                   │
│                                                 │
│              [   ARRÊTER   ]  ← Bouton rouge   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Catégorie                                      │
│  [Sélectionner...          ▼]                   │
│                                                 │
│  Description du travail effectué                │
│  ┌─────────────────────────────────────────┐   │
│  │ Révision du contrat de bail...          │   │
│  │                                          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☑ Temps facturable au client                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Historique des diligences

```
┌─────────────────────────────────────────────────┐
│  Historique des diligences                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Recherche]  01:30:00  ✓                      │
│  Recherche jurisprudence sur les baux          │
│  31 Jan 2026 à 10:00 → 11:30                   │
│                              [✏️] [🗑️]          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Rédaction]  02:15:00  ✓                      │
│  Rédaction amendements contrat                 │
│  30 Jan 2026 à 14:00 → 16:15                   │
│                              [✏️] [🗑️]          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Consultation]  00:45:00                      │
│  Appel téléphonique avec le client            │
│  29 Jan 2026 à 09:00 → 09:45                   │
│                              [✏️] [🗑️]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Couleurs et Styles

### Palette de couleurs

- **Primary (Chronomètre)** : Gradient bleu (#4F46E5 → #6366F1)
- **Success (Facturable)** : Vert (#10B981)
- **Warning (En cours)** : Orange/Ambre avec animation pulse
- **Danger (Arrêter)** : Rouge (#EF4444)
- **Neutral (Non facturable)** : Gris (#6B7280)

### États visuels

1. **Inactif** : Bouton "Démarrer" en bleu, chronomètre à 00:00:00
2. **Actif** : Bouton "Arrêter" en rouge, chronomètre qui défile, formulaire visible
3. **Enregistré** : Entrée dans l'historique avec badge catégorie coloré

### Badges de catégorie

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Recherche   │  │  Rédaction   │  │ Consultation │
└──────────────┘  └──────────────┘  └──────────────┘
   Bleu clair       Violet            Vert

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Révision doc │  │Correspondance│  │Appel tél.    │
└──────────────┘  └──────────────┘  └──────────────┘
   Indigo           Cyan              Orange

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Déplacement  │  │   Réunion    │  │ Prép. aud.   │
└──────────────┘  └──────────────┘  └──────────────┘
   Jaune            Rose              Rouge

┌──────────────┐
│    Autre     │
└──────────────┘
   Gris
```

## Interactions utilisateur

### Workflow typique

```
1. Avocat ouvre le dossier client
   ↓
2. Clique sur onglet "Diligences"
   ↓
3. Clique "DÉMARRER"
   ↓
4. Travaille sur le dossier
   ↓
5. Clique "ARRÊTER"
   ↓
6. Remplit description + catégorie
   ↓
7. Enregistrement automatique
   ↓
8. Nouvelle entrée dans l'historique
```

### Actions disponibles

| Action | Icône | Couleur | Description |
|--------|-------|---------|-------------|
| Démarrer | ▶️ | Bleu | Lance le chronomètre |
| Arrêter | ⏸️ | Rouge | Arrête et enregistre |
| Éditer | ✏️ | Gris | Modifie la description |
| Supprimer | 🗑️ | Rouge | Supprime l'entrée |

## Responsive Design

### Desktop (>1024px)
- Chronomètre centré avec grande police (6xl)
- Historique avec scroll vertical
- Actions sur la droite des entrées

### Tablette (768-1024px)
- Chronomètre légèrement plus petit (5xl)
- Historique compact
- Actions visibles au survol

### Mobile (<768px)
- Chronomètre adapté (4xl)
- Entrées d'historique en stack vertical
- Boutons pleine largeur
- Actions accessibles par tap

## Animations

1. **Chronomètre en cours** : Aucune animation (performance)
2. **Pulse "En cours"** : Animation pulse sur l'indicateur vert
3. **Hover effects** : Transition smooth sur boutons et cartes
4. **Slide in** : Nouvelles entrées apparaissent avec animation

## Accessibilité

- ✅ Contraste WCAG AA conforme
- ✅ Textes alternatifs sur icônes
- ✅ Navigation au clavier
- ✅ Labels sur formulaires
- ✅ Focus visible sur éléments interactifs
- ✅ Tailles tactiles minimales (44x44px)

## États d'erreur

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Une diligence est déjà en cours             │
│  Veuillez arrêter la diligence actuelle avant  │
│  d'en démarrer une nouvelle.                    │
└─────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│  ⚠️ Erreur de connexion                         │
│  Impossible d'enregistrer la diligence.         │
│  Vérifiez votre connexion internet.             │
│  [ Réessayer ]                                  │
└─────────────────────────────────────────────────┘
```

## Mode sombre

- Tous les composants supportent le mode sombre
- Adaptation automatique des couleurs
- Contraste préservé pour la lisibilité
- Gradients ajustés pour moins de luminosité

## Exemples de messages

### Messages de succès
- ✅ "Diligence démarrée"
- ✅ "Diligence enregistrée avec succès"
- ✅ "Description mise à jour"

### Messages d'information
- ℹ️ "Aucune diligence enregistrée pour ce client"
- ℹ️ "Une diligence est en cours..."

### Messages de confirmation
- ⚠️ "Supprimer cette diligence ?"
- ⚠️ "Cette action est irréversible"

## Performance

- **Mise à jour chronomètre** : 1 fois/seconde (setInterval)
- **Synchronisation Firestore** : Temps réel (onSnapshot)
- **Rendu** : React.memo pour optimisation
- **Scroll virtuel** : Pour >100 entrées (futur)
