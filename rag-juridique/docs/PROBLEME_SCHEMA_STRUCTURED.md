# ⚠️ Problème : Schéma pour Données Structurées

## 🔍 Erreur rencontrée

```
404 Schema with name projects/901560039828/locations/global/... does not exist
```

## 💡 Explication

Pour les datastores de type **"Données structurées"** :
- Le schéma peut être **auto-généré** par Vertex AI
- Le schéma peut ne pas exister explicitement dans l'API
- Le project_id peut être différent (project number vs project ID)

## 🔧 Solutions alternatives

### Option 1 : Utiliser l'API Data Store (au lieu de Schema)

Pour les datastores structurés, les filtres peuvent être configurés différemment :
- Via les paramètres du Data Store
- Via l'API de configuration du Data Store

### Option 2 : Vérifier le project number

L'erreur montre `projects/901560039828` au lieu de `projects/jurilab-481600`.
- `901560039828` = Project Number
- `jurilab-481600` = Project ID

Il faut peut-être utiliser le project number.

### Option 3 : Les filtres peuvent ne pas être nécessaires

Si le filtrage côté application fonctionne (comme testé), on peut continuer sans les filtres Vertex AI.

## ✅ Solution actuelle (fonctionnelle)

Le filtrage côté application fonctionne parfaitement :
- Recherche globale : `client.search(query, page_size=50)`
- Filtrage Python : `[r for r in results if r['metadata']['code_id'] == '...']`

**Avantages** :
- ✅ Fonctionne immédiatement
- ✅ Pas de réindexation nécessaire
- ✅ Plus flexible

**Inconvénients** :
- ⚠️ Récupère plus de résultats (puis filtre)
- ⚠️ Légèrement moins performant

## 🎯 Recommandation

**Continuer avec le filtrage côté application** pour l'instant :
- C'est fonctionnel
- Pas de blocage
- On peut optimiser plus tard si nécessaire

Pour la jurisprudence (documents longs), créer un datastore "Non structuré" qui supporte mieux les fonctionnalités avancées.

---

**Date** : 19 Décembre 2025

