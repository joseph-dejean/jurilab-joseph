# 🚀 Guide de démarrage rapide - Diligences

## Déploiement

### 1. Déployer les règles Firestore
```bash
# Depuis la racine du projet
firebase deploy --only firestore:rules
```

### 2. Créer les index Firestore (si nécessaire)
Les index peuvent être créés automatiquement lors de la première utilisation, ou manuellement via la console Firebase :
- Collection : `diligences`
- Champs indexés : `lawyerId`, `clientId`, `createdAt`

## Utilisation immédiate

### Pour tester la fonctionnalité :

1. **Se connecter en tant qu'avocat**
   - Utilisez un compte avec le rôle `LAWYER`

2. **Accéder au Portfolio**
   - Dashboard → Portfolio Clients

3. **Sélectionner un client**
   - Cliquez sur un client dans la liste de gauche

4. **Ouvrir l'onglet Diligences**
   - Cliquez sur l'onglet "Diligences" (icône chronomètre)

5. **Démarrer le suivi**
   - Cliquez sur "Démarrer"
   - Le chronomètre se lance

6. **Arrêter et enregistrer**
   - Travaillez sur le dossier
   - Cliquez sur "Arrêter"
   - Remplissez la description et la catégorie
   - La diligence est enregistrée automatiquement

## Fonctionnalités principales

### ✅ Chronomètre temps réel
- Démarre/arrête instantanément
- Affichage HH:MM:SS
- Persiste entre les sessions

### ✅ Catégorisation
- 10 catégories prédéfinies
- Recherche, Rédaction, Consultation, etc.

### ✅ Historique complet
- Toutes les diligences par client
- Date, heure, durée, description
- Édition et suppression possibles

### ✅ Statistiques
- Temps total cumulé
- Temps facturable séparé
- Affichage en temps réel

## Commandes de déploiement

```bash
# Déployer tout
firebase deploy

# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules

# Déployer l'application
npm run build
firebase deploy --only hosting
```

## Architecture

```
Portfolio Client
  └── Onglet Diligences
      ├── Chronomètre actif (si en cours)
      ├── Formulaire (catégorie, description, facturable)
      ├── Statistiques (total, facturable)
      └── Historique (liste des diligences)
```

## Points clés

1. **Un seul chronomètre actif** : Vous ne pouvez avoir qu'une seule diligence active à la fois
2. **Enregistrement automatique** : Les données sont synchronisées en temps réel avec Firestore
3. **Sécurité** : Seul l'avocat propriétaire peut voir/modifier ses diligences
4. **Facturable** : Option pour distinguer le temps facturable du temps non facturable

## Prochaines étapes

- [ ] Tester avec plusieurs clients
- [ ] Vérifier la persistance du chronomètre
- [ ] Tester l'édition et la suppression
- [ ] Vérifier les statistiques de temps total
- [ ] Exporter des rapports (future fonctionnalité)
