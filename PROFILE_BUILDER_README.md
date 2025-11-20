# 📋 Profile Builder - Documentation Complète

## 🎯 Vue d'ensemble

Le **Profile Builder** est un système de création de profils modulaires pour les avocats, inspiré du style "Hinge/Tetris". Il permet aux avocats de créer des profils personnalisés en assemblant des blocs de contenu de différentes tailles et types.

## 🏗️ Architecture

### Structure des fichiers

```
components/profile-builder/
├── ProfileBuilder.tsx          # Composant principal de l'éditeur
├── ProfileViewer.tsx            # Composant d'affichage en lecture seule
├── DraggableGrid.tsx           # Grille avec drag & drop
├── SortableBlock.tsx           # Bloc individuel draggable
├── Toolbox.tsx                 # Boîte à outils pour ajouter des blocs
├── TemplateSelector.tsx        # Sélecteur de templates
└── blocks/
    ├── TextBlock.tsx           # Bloc texte
    ├── MediaBlock.tsx          # Bloc image/média
    ├── VideoBlock.tsx          # Bloc vidéo Daily.co
    ├── ContactBlock.tsx        # Bloc contact/action
    ├── LogoBlock.tsx           # Bloc logo du cabinet
    ├── MapBlock.tsx            # Bloc carte Google Maps
    ├── StatsBlock.tsx          # Bloc statistiques
    ├── TestimonialsBlock.tsx   # Bloc témoignages
    ├── CertificationsBlock.tsx # Bloc certifications
    ├── SocialBlock.tsx         # Bloc réseaux sociaux
    └── CollaboratorsBlock.tsx  # Bloc collaborateurs/équipe

types/
└── templates.ts                # Définition des templates

services/
└── templateService.ts         # Service de gestion des templates
```

## 📊 Structure de données

### ProfileBlock

```typescript
interface ProfileBlock {
  id: string;                    // ID unique du bloc
  type: ProfileBlockType;         // Type de bloc (TEXT, MEDIA, etc.)
  title?: string;                // Titre optionnel
  content?: string;              // Contenu (texte, URL, JSON selon le type)
  order: number;                 // Ordre d'affichage
  size: ProfileBlockSize;        // Taille du bloc
}
```

### ProfileBlockType

Types de blocs disponibles :
- `TEXT` - Texte avec titre et paragraphe
- `MEDIA` - Image ou photo
- `VIDEO` - Appel vidéo Daily.co
- `CONTACT` - Bouton d'action/contact
- `LOGO` - Logo du cabinet
- `MAP` - Carte Google Maps avec localisation
- `STATS` - Statistiques (années, dossiers, taux de réussite)
- `TESTIMONIALS` - Témoignages clients avec note
- `CERTIFICATIONS` - Liste de certifications
- `SOCIAL` - Liens vers réseaux sociaux
- `COLLABORATORS` - Équipe/collaborateurs

### ProfileBlockSize

Tailles disponibles :
- `small` - 1x1 (petit carré)
- `medium` - 2x1 (rectangle horizontal)
- `large` - 2x2 (grand carré)
- `full` - 3x1 (bandeau complet)
- `tall` - 1x2 (rectangle vertical)
- `wide` - 3x1 (large, identique à full)
- `hero` - 3x2 (format héro)
- `square` - 1x1 (carré, identique à small)

### ProfileTemplate

```typescript
interface ProfileTemplate {
  id: string;                    // ID unique
  name: string;                  // Nom du template
  description: string;           // Description
  thumbnail?: string;            // Image de prévisualisation (optionnel)
  blocks: ProfileBlock[];         // Blocs du template
  isDefault?: boolean;           // Template prédéfini ou personnalisé
  createdBy?: string;            // Email du créateur
  createdAt?: number;            // Timestamp de création
}
```

## 🎨 Composants principaux

### ProfileBuilder.tsx

**Rôle** : Composant principal de l'éditeur de profil.

**Fonctionnalités** :
- Chargement du profil depuis Firebase
- Gestion des blocs (ajout, suppression, modification)
- Drag & drop pour réorganiser
- Sauvegarde dans Firebase
- Aperçu du profil
- Application de templates

**État** :
- `blocks` : Liste des blocs du profil
- `isLoading` : État de chargement
- `isSaving` : État de sauvegarde
- `lawyerId` : ID de l'avocat
- `lawyerData` : Données complètes de l'avocat
- `isPreviewOpen` : État de la modal d'aperçu

**Fonctions principales** :
- `handleDragEnd()` : Gère le drag & drop
- `handleAddBlock()` : Ajoute un nouveau bloc
- `handleRemoveBlock()` : Supprime un bloc
- `handleUpdateBlock()` : Met à jour un bloc
- `handleSave()` : Sauvegarde dans Firebase
- `loadProfile()` : Charge le profil depuis Firebase

### ProfileViewer.tsx

**Rôle** : Affichage du profil en mode lecture seule.

**Utilisation** :
- Dans `LawyerProfileModal.tsx` pour afficher le profil aux clients
- Dans la modal d'aperçu du ProfileBuilder

**Props** :
- `blocks` : Liste des blocs à afficher
- `onContactClick` : Callback pour le bloc contact
- `onVideoClick` : Callback pour le bloc vidéo
- `lawyerData` : Données du lawyer (coordonnées, localisation)

### DraggableGrid.tsx

**Rôle** : Grille avec fonctionnalité de drag & drop.

**Technologie** : Utilise `@dnd-kit` pour le drag & drop.

**Layout** : Grille responsive 3 colonnes sur desktop, 1 colonne sur mobile.

### SortableBlock.tsx

**Rôle** : Bloc individuel avec drag & drop et contrôles.

**Fonctionnalités** :
- Drag & drop
- Redimensionnement (8 tailles)
- Suppression
- Édition du contenu

**Contrôles** :
- Poignée de drag (icône GripVertical)
- Boutons de taille (S, M, L, F, T, W, H, Q)
- Bouton de suppression (X)

### Toolbox.tsx

**Rôle** : Boîte à outils pour ajouter de nouveaux blocs.

**Fonctionnalités** :
- Affichage de tous les types de blocs disponibles
- Icônes et descriptions pour chaque type
- Ajout d'un bloc au clic

### TemplateSelector.tsx

**Rôle** : Sélection et gestion des templates.

**Fonctionnalités** :
- Affichage des templates prédéfinis (5)
- Affichage des templates personnalisés
- Application d'un template
- Création d'un nouveau template depuis le profil actuel
- Suppression des templates personnalisés

**Stockage** : Templates personnalisés dans `localStorage` (peut être migré vers Firebase)

## 🧩 Blocs de contenu

### TextBlock
- **Type** : `TEXT`
- **Contenu** : Titre et texte libre
- **Taille recommandée** : medium, large, full

### MediaBlock
- **Type** : `MEDIA`
- **Contenu** : URL d'image
- **Taille recommandée** : medium, large, hero

### VideoBlock
- **Type** : `VIDEO`
- **Contenu** : URL Daily.co (à implémenter)
- **Taille recommandée** : large, hero

### ContactBlock
- **Type** : `CONTACT`
- **Contenu** : Titre personnalisable
- **Action** : Scroll vers section réservation
- **Taille recommandée** : small, medium

### LogoBlock
- **Type** : `LOGO`
- **Contenu** : URL du logo
- **Taille recommandée** : small, square

### MapBlock
- **Type** : `MAP`
- **Contenu** : Utilise automatiquement les coordonnées du lawyer
- **Technologie** : Google Maps embed
- **Taille recommandée** : medium, large, wide

### StatsBlock
- **Type** : `STATS`
- **Contenu** : JSON avec `{years, cases, success}`
- **Style** : Dégradé brand
- **Taille recommandée** : small, medium, full

### TestimonialsBlock
- **Type** : `TESTIMONIALS`
- **Contenu** : JSON avec `{text, author, rating}`
- **Taille recommandée** : medium, large

### CertificationsBlock
- **Type** : `CERTIFICATIONS`
- **Contenu** : JSON array de certifications
- **Style** : Dégradé navy
- **Taille recommandée** : tall, large

### SocialBlock
- **Type** : `SOCIAL`
- **Contenu** : JSON avec liens sociaux `{linkedin, facebook, twitter, instagram, website}`
- **Taille recommandée** : small, medium

### CollaboratorsBlock
- **Type** : `COLLABORATORS`
- **Contenu** : JSON array de collaborateurs
- **Structure** : `{id, firstName, lastName, photo, specialties[], role}`
- **Taille recommandée** : large, hero, wide

## 📐 Templates prédéfinis

### 1. Classique
- **Description** : Layout équilibré avec texte, média et contact
- **Blocs** : 4 blocs (Texte, Média, Contact, Stats)
- **Usage** : Profil simple et efficace

### 2. Professionnel
- **Description** : Mise en avant des certifications et de l'expérience
- **Blocs** : 6 blocs (Logo, Texte, Certifications, Stats, Carte, Réseaux)
- **Usage** : Profil axé sur la crédibilité

### 3. Moderne
- **Description** : Design moderne avec vidéo et témoignages
- **Blocs** : 5 blocs (Média hero, Vidéo, Texte, Témoignages, Contact)
- **Usage** : Profil dynamique et engageant

### 4. Équipe
- **Description** : Mise en avant de l'équipe et des collaborateurs
- **Blocs** : 6 blocs (Logo, Texte, Collaborateurs, Stats, Certifications, Carte)
- **Usage** : Profil de cabinet avec équipe

### 5. Complet
- **Description** : Profil complet avec tous les éléments
- **Blocs** : 10 blocs (tous les types)
- **Usage** : Profil exhaustif et détaillé

## 🔧 Services

### templateService.ts

**Fonctions** :
- `loadCustomTemplates()` : Charge les templates depuis localStorage
- `saveCustomTemplate()` : Sauvegarde un template
- `deleteCustomTemplate()` : Supprime un template
- `createTemplateFromBlocks()` : Crée un template depuis des blocs
- `applyTemplate()` : Applique un template (génère de nouveaux IDs)

**Stockage** : `localStorage` avec la clé `jurilabb_profile_templates`

### firebaseService.ts

**Fonctions utilisées** :
- `getLawyerById()` : Récupère les données d'un lawyer
- `updateLawyerProfileConfig()` : Met à jour uniquement le `profileConfig`

**Structure Firebase** :
```
lawyers/
  {lawyerId}/
    profileConfig: ProfileBlock[]
    ...autres champs
```

## 🎯 Flux d'utilisation

### 1. Édition du profil

1. L'avocat accède à `/lawyer/profile-editor`
2. Le profil est chargé depuis Firebase (ou blocs par défaut)
3. L'avocat peut :
   - Ajouter des blocs depuis la Toolbox
   - Réorganiser par drag & drop
   - Redimensionner chaque bloc
   - Éditer le contenu de chaque bloc
   - Supprimer des blocs
   - Appliquer un template
   - Voir l'aperçu
   - Sauvegarder

### 2. Affichage aux clients

1. Le client ouvre le profil d'un lawyer
2. `LawyerProfileModal` vérifie si `lawyer.profileConfig` existe
3. Si oui : affiche `ProfileViewer` avec les blocs
4. Si non : affiche la bio classique (`lawyer.bio`)

### 3. Templates

1. L'avocat peut choisir un template prédéfini
2. Ou créer son propre template depuis son profil actuel
3. Les templates personnalisés sont sauvegardés dans localStorage
4. Application d'un template génère de nouveaux IDs pour éviter les conflits

## 🚀 Améliorations futures

### Fonctionnalités à ajouter

1. **Upload d'images**
   - Intégration Firebase Storage pour LogoBlock et MediaBlock
   - Compression automatique
   - Gestion des formats

2. **Intégration Daily.co**
   - Configuration de la salle vidéo
   - Génération automatique de l'URL
   - Test de connexion

3. **Intégration GetStream.io**
   - Chat en direct dans ContactBlock
   - Notifications

4. **Templates dans Firebase**
   - Migration des templates depuis localStorage
   - Partage de templates entre avocats
   - Templates communautaires

5. **Aperçu mobile**
   - Mode responsive dans l'aperçu
   - Test sur différentes tailles d'écran

6. **Validation**
   - Validation des champs obligatoires
   - Vérification des URLs
   - Limite de blocs

7. **Analytics**
   - Suivi des interactions (clics sur blocs)
   - Statistiques d'utilisation

8. **Export/Import**
   - Export JSON du profil
   - Import depuis fichier
   - Duplication de profil

9. **Thèmes personnalisés**
   - Choix de couleurs
   - Polices personnalisées
   - Styles de blocs

10. **Versioning**
    - Historique des modifications
    - Restauration d'une version précédente
    - Comparaison de versions

### Bugs connus / À améliorer

1. **Performance**
   - Optimisation du rendu avec beaucoup de blocs
   - Lazy loading des images
   - Virtualisation de la grille

2. **UX**
   - Feedback visuel lors du drag & drop
   - Animations de transition
   - Guide de démarrage

3. **Accessibilité**
   - Navigation au clavier
   - ARIA labels
   - Contraste des couleurs

4. **Responsive**
   - Amélioration mobile
   - Tailles adaptatives selon l'écran

## 🔐 Sécurité

### Points d'attention

1. **Validation des données**
   - Sanitization des inputs utilisateur
   - Validation des URLs
   - Limite de taille des contenus

2. **Permissions**
   - Vérification que seul le lawyer peut éditer son profil
   - Protection contre les modifications non autorisées

3. **Stockage**
   - Migration des templates vers Firebase avec règles de sécurité
   - Chiffrement des données sensibles si nécessaire

## 📝 Notes techniques

### Dépendances

- `@dnd-kit/core` : Drag & drop
- `@dnd-kit/sortable` : Tri des éléments
- `@dnd-kit/utilities` : Utilitaires
- `clsx` : Gestion des classes CSS conditionnelles
- `tailwind-merge` : Fusion des classes Tailwind

### Performance

- Les blocs sont rendus uniquement quand visibles
- Le drag & drop utilise des optimisations de `@dnd-kit`
- Les templates sont chargés à la demande

### Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Responsive design (mobile, tablette, desktop)
- Mode sombre supporté

## 🧪 Tests

### Tests à implémenter

1. **Unitaires**
   - Services (templateService, firebaseService)
   - Utilitaires (génération d'IDs, parsing)

2. **Intégration**
   - Flux complet d'édition
   - Application de templates
   - Sauvegarde/chargement

3. **E2E**
   - Création d'un profil complet
   - Affichage côté client
   - Interactions utilisateur

## 📚 Ressources

### Documentation externe

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Fichiers de référence

- `types.ts` : Types TypeScript
- `types/templates.ts` : Templates prédéfinis
- `services/templateService.ts` : Gestion des templates
- `services/firebaseService.ts` : Intégration Firebase

## 👥 Contribution

### Pour améliorer le Profile Builder

1. Lire cette documentation
2. Identifier l'amélioration souhaitée
3. Vérifier les dépendances et l'architecture
4. Implémenter avec tests
5. Documenter les changements

### Conventions

- Nommage : PascalCase pour composants, camelCase pour fonctions
- Structure : Un composant par fichier
- Types : Toujours typer les props et états
- Commentaires : Expliquer la logique complexe

---

**Dernière mise à jour** : 2024
**Version** : 1.0.0
**Auteur** : Équipe Jurilab

