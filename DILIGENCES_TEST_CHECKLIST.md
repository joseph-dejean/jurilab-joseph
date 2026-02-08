# ✅ Checklist de Test - Système de Diligences

## Pré-requis

- [ ] Firebase Rules déployées
- [ ] Application déployée sur Firebase Hosting
- [ ] Index Firestore créés (automatiques ou manuels)
- [ ] Compte avocat de test disponible
- [ ] Au moins un client dans le portfolio

---

## 🧪 Tests Fonctionnels

### 1. Accès à la fonctionnalité
- [ ] Se connecter en tant qu'avocat
- [ ] Naviguer vers "Portfolio Clients"
- [ ] Sélectionner un client
- [ ] Vérifier que l'onglet "Diligences" est visible
- [ ] Cliquer sur l'onglet "Diligences"
- [ ] Vérifier que le chronomètre s'affiche

### 2. Démarrer une diligence
- [ ] Le chronomètre affiche "00:00:00"
- [ ] Le bouton "Démarrer" est visible et actif
- [ ] Cliquer sur "Démarrer"
- [ ] Vérifier que le chronomètre commence à compter
- [ ] Vérifier que le bouton change en "Arrêter" (rouge)
- [ ] Vérifier que le formulaire apparaît (catégorie, description)

### 3. Chronomètre en cours
- [ ] Le temps s'incrémente chaque seconde
- [ ] Le format est HH:MM:SS
- [ ] Attendre 10 secondes → vérifier que le temps atteint 00:00:10
- [ ] Rafraîchir la page → vérifier que le chronomètre continue
- [ ] Le bouton "Démarrer" n'est plus disponible

### 4. Formulaire de diligence
- [ ] Le champ "Catégorie" affiche les 10 catégories
- [ ] Sélectionner une catégorie (ex: "Recherche")
- [ ] Entrer une description dans le textarea
- [ ] La checkbox "Temps facturable" est cochée par défaut
- [ ] Décocher puis recocher la checkbox
- [ ] Les champs sont modifiables pendant que le chronomètre tourne

### 5. Arrêter une diligence
- [ ] Laisser tourner au moins 15 secondes
- [ ] Remplir la description et la catégorie
- [ ] Cliquer sur "Arrêter"
- [ ] Vérifier que le chronomètre s'arrête
- [ ] Vérifier qu'une nouvelle entrée apparaît dans l'historique
- [ ] Vérifier que le temps total est mis à jour
- [ ] Vérifier que le temps facturable est mis à jour

### 6. Historique des diligences
- [ ] La nouvelle diligence apparaît en haut de la liste
- [ ] La durée est affichée correctement (HH:MM:SS)
- [ ] La catégorie est affichée dans un badge coloré
- [ ] La description est visible
- [ ] La date et l'heure sont formatées correctement
- [ ] Le badge "✓" (facturable) est visible
- [ ] Les boutons d'action (éditer, supprimer) sont visibles

### 7. Éditer une diligence
- [ ] Cliquer sur le bouton "Éditer" (✏️)
- [ ] Un textarea apparaît avec la description actuelle
- [ ] Modifier la description
- [ ] Cliquer sur "Enregistrer"
- [ ] Vérifier que la description est mise à jour
- [ ] Cliquer sur "Annuler" → vérifier que l'édition est annulée

### 8. Supprimer une diligence
- [ ] Créer une diligence de test
- [ ] Cliquer sur le bouton "Supprimer" (🗑️)
- [ ] Une confirmation apparaît
- [ ] Cliquer sur "Annuler" → rien ne se passe
- [ ] Cliquer à nouveau sur "Supprimer"
- [ ] Confirmer la suppression
- [ ] Vérifier que l'entrée disparaît
- [ ] Vérifier que les statistiques sont mises à jour

### 9. Statistiques
- [ ] Créer 3 diligences :
  - 1ère : 00:10:00 (facturable)
  - 2ème : 00:15:00 (facturable)
  - 3ème : 00:05:00 (non facturable)
- [ ] Vérifier que le temps total = 00:30:00
- [ ] Vérifier que le temps facturable = 00:25:00
- [ ] Les statistiques sont mises à jour en temps réel

### 10. Persistance des données
- [ ] Créer une diligence
- [ ] Rafraîchir la page (F5)
- [ ] Vérifier que la diligence est toujours là
- [ ] Fermer l'onglet et le rouvrir
- [ ] Vérifier que les données sont conservées
- [ ] Démarrer une diligence
- [ ] Fermer l'application
- [ ] Rouvrir l'application
- [ ] Vérifier que le chronomètre continue

### 11. Cas limites
- [ ] Essayer de démarrer une 2ème diligence alors qu'une est active
- [ ] Vérifier qu'un message d'erreur ou que le bouton est désactivé
- [ ] Créer une diligence de 0 secondes (démarrer puis arrêter immédiatement)
- [ ] Vérifier que la durée est correcte (0 ou 1 seconde)
- [ ] Laisser tourner une diligence pendant plus d'une heure
- [ ] Vérifier que le format HH:MM:SS fonctionne (ex: 01:05:30)

---

## 🔐 Tests de Sécurité

### 1. Tests de permissions
- [ ] Se connecter en tant que client
- [ ] Vérifier que l'onglet "Diligences" n'est pas visible
- [ ] Essayer d'accéder directement à la collection (console Firebase)
- [ ] Vérifier que l'accès est refusé

### 2. Tests d'isolation
- [ ] Se connecter avec Avocat A
- [ ] Créer une diligence pour Client X
- [ ] Se déconnecter et se reconnecter avec Avocat B
- [ ] Vérifier que la diligence d'Avocat A n'est pas visible
- [ ] Vérifier que seules les diligences d'Avocat B sont visibles

### 3. Tests admin
- [ ] Se connecter en tant qu'admin (si disponible)
- [ ] Vérifier que toutes les diligences sont accessibles
- [ ] Vérifier que l'admin peut supprimer n'importe quelle diligence

---

## 📱 Tests Responsive

### Desktop (>1024px)
- [ ] Chronomètre bien centré et lisible
- [ ] Formulaire sur une ligne
- [ ] Historique avec scroll vertical
- [ ] Actions visibles sans scroll horizontal
- [ ] Les statistiques sont bien alignées

### Tablette (768-1024px)
- [ ] Chronomètre adapté
- [ ] Formulaire reste utilisable
- [ ] Historique compact mais lisible
- [ ] Actions au survol ou tap

### Mobile (<768px)
- [ ] Chronomètre visible sans zoom
- [ ] Boutons pleine largeur
- [ ] Formulaire en stack vertical
- [ ] Historique scrollable
- [ ] Pas de débordement horizontal
- [ ] Touch targets >= 44px

---

## 🎨 Tests UI/UX

### Design
- [ ] Les couleurs correspondent à la palette de l'app
- [ ] Les gradients sont appliqués correctement
- [ ] Les badges de catégorie sont colorés
- [ ] Le badge "facturable" est vert
- [ ] Les boutons ont les bonnes couleurs (bleu, rouge, gris)

### Mode sombre
- [ ] Activer le mode sombre
- [ ] Vérifier que le chronomètre reste lisible
- [ ] Vérifier que les badges sont visibles
- [ ] Vérifier que le formulaire est utilisable
- [ ] Vérifier que l'historique est lisible

### Animations
- [ ] Les transitions sont fluides (hover sur boutons)
- [ ] L'indicateur "En cours" pulse correctement
- [ ] Les nouvelles entrées apparaissent sans saccade
- [ ] Pas de flash ou scintillement

### Accessibilité
- [ ] Navigation au clavier (Tab) fonctionne
- [ ] Les labels sont présents sur les formulaires
- [ ] Les boutons ont des tooltips ou aria-labels
- [ ] Le contraste est suffisant (WCAG AA)
- [ ] Les icônes ont des alternatives textuelles

---

## ⚡ Tests de Performance

### Temps de chargement
- [ ] Page Portfolio charge en < 2s
- [ ] Onglet Diligences charge en < 1s
- [ ] Les données Firestore arrivent en < 1s
- [ ] Pas de freeze ou lag visible

### Synchronisation temps réel
- [ ] Ouvrir 2 onglets avec le même client
- [ ] Créer une diligence dans l'onglet 1
- [ ] Vérifier qu'elle apparaît dans l'onglet 2 en < 1s
- [ ] Éditer dans l'onglet 1
- [ ] Vérifier la mise à jour dans l'onglet 2

### Chronomètre
- [ ] Le chronomètre ne saute pas de secondes
- [ ] La mise à jour est fluide (1 fois/seconde)
- [ ] Pas de ralentissement après 1 minute
- [ ] Pas de ralentissement après 5 minutes

---

## 🐛 Tests de Gestion d'Erreurs

### Erreurs réseau
- [ ] Démarrer une diligence
- [ ] Couper la connexion internet
- [ ] Vérifier qu'un message d'erreur apparaît
- [ ] Rétablir la connexion
- [ ] Vérifier que la synchronisation reprend

### Erreurs Firestore
- [ ] Simuler un quota dépassé (si possible)
- [ ] Vérifier qu'un message d'erreur est affiché
- [ ] Vérifier que l'app ne crash pas

### Validation
- [ ] Essayer d'enregistrer sans description
- [ ] Vérifier que c'est accepté (description optionnelle)
- [ ] Essayer de modifier avec une description vide
- [ ] Vérifier le comportement

---

## 📊 Tests de Données

### Intégrité des données
- [ ] Créer une diligence et vérifier dans la console Firebase
- [ ] Vérifier que tous les champs sont présents
- [ ] Vérifier que les timestamps sont au format ISO
- [ ] Vérifier que la durée est en secondes
- [ ] Vérifier que `lawyerId` et `clientId` sont corrects

### Calculs
- [ ] Créer une diligence de 1 minute exactement
- [ ] Vérifier que la durée enregistrée = 60 secondes
- [ ] Vérifier que l'affichage = "00:01:00"
- [ ] Créer une diligence de 1h 30m 45s
- [ ] Vérifier la durée = 5445 secondes
- [ ] Vérifier l'affichage = "01:30:45"

---

## ✅ Critères d'Acceptation

### Fonctionnel
- [ ] Toutes les fonctionnalités de base marchent
- [ ] Aucune erreur bloquante
- [ ] Les données sont persistées correctement
- [ ] La synchronisation temps réel fonctionne

### Sécurité
- [ ] Les règles Firestore sont strictes
- [ ] Seuls les avocats peuvent accéder à leurs diligences
- [ ] Pas de fuite de données entre avocats

### UX/UI
- [ ] Design cohérent avec le reste de l'app
- [ ] Responsive sur tous les écrans
- [ ] Mode sombre fonctionne
- [ ] Pas de bugs visuels

### Performance
- [ ] Temps de chargement acceptable (< 2s)
- [ ] Chronomètre fluide (1 update/s)
- [ ] Pas de ralentissement après utilisation prolongée

---

## 🚀 Validation Finale

- [ ] Tous les tests fonctionnels passent ✅
- [ ] Tous les tests de sécurité passent ✅
- [ ] Tous les tests responsive passent ✅
- [ ] Tous les tests UI/UX passent ✅
- [ ] Tous les tests de performance passent ✅
- [ ] Tous les tests d'erreurs passent ✅
- [ ] Tous les tests de données passent ✅

**Date du test:** _______________  
**Testeur:** _______________  
**Résultat global:** ⬜ PASS / ⬜ FAIL  

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
