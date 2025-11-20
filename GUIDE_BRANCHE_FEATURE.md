# 🌿 Guide : Rester sur Votre Branche Feature

## ✅ Vérification de la Branche Actuelle

Exécutez cette commande pour voir sur quelle branche vous êtes :

```bash
git branch --show-current
```

ou

```bash
git status
```

## 📋 Scénarios Possibles

### Scénario 1 : Vous êtes sur `main`

Si vous êtes sur `main`, créez/switch vers votre branche feature :

```bash
# Créer une nouvelle branche feature depuis main
git checkout -b feat/avocat-profile-builder

# OU si la branche existe déjà
git checkout feat/avocat-profile-builder
```

### Scénario 2 : Vous êtes déjà sur `feat/avocat-profile-builder`

Parfait ! Vous êtes déjà sur votre branche. Vous pouvez continuer à travailler.

### Scénario 3 : La branche n'existe plus (après reset)

Si vous avez fait un `git reset --hard origin/main`, votre branche locale peut avoir été supprimée. Recréez-la :

```bash
# 1. S'assurer d'être sur main et à jour
git checkout main
git fetch origin
git reset --hard origin/main

# 2. Créer votre nouvelle branche feature
git checkout -b feat/avocat-profile-builder

# 3. Vérifier
git branch --show-current
```

## 🎯 Workflow Recommandé

```bash
# 1. Vérifier la branche actuelle
git branch --show-current

# 2. Si vous êtes sur main, créer votre branche
git checkout -b feat/avocat-profile-builder

# 3. Vérifier que vous êtes bien sur votre branche
git status

# 4. Maintenant vous pouvez travailler en toute sécurité
# Vos modifications ne toucheront pas le main du collègue
```

## ⚠️ Important

- **NE PAS** faire de `git push` vers `origin/main`
- **TOUJOURS** travailler sur votre branche `feat/avocat-profile-builder`
- **VÉRIFIER** la branche avant chaque commit avec `git status`

## 🔄 Pour Pousser Votre Branche

```bash
# 1. Vérifier que vous êtes sur votre branche
git branch --show-current

# 2. Pousser votre branche (pas main !)
git push origin feat/avocat-profile-builder

# OU si c'est la première fois
git push -u origin feat/avocat-profile-builder
```

## 📝 Commandes Utiles

```bash
# Voir toutes les branches
git branch -a

# Voir les branches distantes
git branch -r

# Voir la différence entre votre branche et main
git diff main..feat/avocat-profile-builder

# Mettre à jour votre branche avec les changements de main (sans merger)
git fetch origin
git rebase origin/main
```

---

**Rappel** : Vous avez maintenant la version propre du collègue sur votre branche feature. Vous pouvez recommencer à travailler sur le Profile Builder sans toucher au main ! 🚀

