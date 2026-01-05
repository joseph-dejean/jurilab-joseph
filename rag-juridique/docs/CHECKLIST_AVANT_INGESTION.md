# ✅ Checklist Avant Ingestion Complète

## 🎯 Objectif

Valider que tout est prêt pour l'ingestion complète avec les fonctionnalités avancées activées.

---

## 📋 Étape 1 : Vérifier le Format

### Test du nouveau format

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe test_new_format.py
```

**Résultat attendu** : ✅ TOUS LES CHECKS PASSÉS

**Si échec** : Vérifier que `_create_article` utilise le nouveau format (champs directs).

---

## 📋 Étape 2 : Test d'Ingestion (10 articles)

### Ingérer 10 articles Code Civil

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --code civil --max-articles 10
```

### Vérifier le JSONL généré

```powershell
# Voir le premier article
Get-Content data\exports\LEGITEXT*.jsonl -First 1 | python -m json.tool
```

**Vérifier** :
- ✅ `content` est un champ direct (pas dans `jsonData`)
- ✅ `title` est un champ direct
- ✅ Métadonnées en champs directs (`code_id`, `etat`, etc.)
- ✅ Pas de champ `jsonData`

---

## 📋 Étape 3 : Upload Test vers GCS

```powershell
gsutil cp data\exports\LEGITEXT*.jsonl gs://legal-rag-data-sofia-2025/
```

---

## 📋 Étape 4 : Import Test dans Vertex AI

1. **Console GCP** → Vertex AI Search → Data Stores
2. **Votre datastore** → Import
3. **Source** : Cloud Storage
4. **Path** : `gs://legal-rag-data-sofia-2025/LEGITEXT*.jsonl`
5. **Format** : JSONL
6. **Importer**

**Attendre** : ~2-5 minutes pour 10 articles

---

## 📋 Étape 5 : Vérifier le Schéma

1. **Datastore** → Onglet "Schéma"
2. **Vérifier** que les champs suivants existent :
   - ✅ `id` : string
   - ✅ `content` : string ← **CRITIQUE**
   - ✅ `title` : string
   - ✅ `code_id` : string
   - ✅ `code_name` : string
   - ✅ `type` : string
   - ✅ `article_num` : string
   - ✅ `etat` : string
   - ✅ `date_debut` : string

3. **Vérifier** que tous sont :
   - ✅ "Inclus dans l'index de recherche"
   - ✅ "Indexable"
   - ✅ "Récup" (Retrievable)

---

## 📋 Étape 6 : Configurer les Embeddings

**Suivre** : `docs/GUIDE_ACTIVATION_VERTEX_AI_ADVANCED.md` → Étape 1

1. **Présentation de l'application** → "Retrieve" → "Managed Retrieval"
2. **Cliquer** : "Définir des vecteurs d'embedding"
3. **Champ source** : `content`
4. **Sauvegarder**

**Vérification** : Les options de segmentation deviennent disponibles

---

## 📋 Étape 7 : Activer Segmentation Automatique

**Suivre** : `docs/GUIDE_ACTIVATION_VERTEX_AI_ADVANCED.md` → Étape 2

1. **Managed Retrieval** → "Chunking" ou "Segmentation"
2. **Activer** : "Automatic chunking"
3. **Configuration** :
   - Taille : 500 tokens
   - Chevauchement : 50 tokens
   - Méthode : Intelligent
4. **Sauvegarder**

---

## 📋 Étape 8 : Activer Dynamic Retrieval

**Suivre** : `docs/GUIDE_ACTIVATION_VERTEX_AI_ADVANCED.md` → Étape 3

1. **Managed Retrieval** → "Dynamic Retrieval"
2. **Activer** : "Enable Dynamic Retrieval"
3. **Configuration** :
   - Nombre de chunks : 5-7
   - Stratégie : Hybrid
4. **Sauvegarder**

---

## 📋 Étape 9 : Activer Grounding

**Suivre** : `docs/GUIDE_ACTIVATION_VERTEX_AI_ADVANCED.md` → Étape 5

1. **Serve** → "Answer generation"
2. **Activer** : "Enable grounding" et "Show citations"
3. **Sauvegarder**

---

## 📋 Étape 10 : Test de Recherche

### Test Python

```python
from rag.vertex_search import VertexSearchClient

client = VertexSearchClient()

# Test 1 : Recherche simple
results = client.search("contrat", page_size=5)
print(f"✅ {len(results)} résultats")

# Test 2 : Vérifier les métadonnées
for r in results:
    print(f"Article: {r['metadata'].get('article_num')}")
    print(f"Code: {r['metadata'].get('code_name')}")

# Test 3 : Filtres (devraient fonctionner maintenant)
results_filtered = client.filter_by_metadata(
    query="contrat",
    code_id="LEGITEXT000006070721",
    etat="VIGUEUR"
)
print(f"✅ {len(results_filtered)} résultats filtrés")
```

**Résultat attendu** :
- ✅ Recherche fonctionne
- ✅ Métadonnées accessibles
- ✅ Filtres fonctionnent (ou fallback côté app)

---

## ✅ Checklist Finale

Avant ingestion complète :

- [ ] Format test validé (test_new_format.py)
- [ ] 10 articles ingérés et importés
- [ ] Schéma vérifié (champ `content` présent)
- [ ] Embeddings configurés
- [ ] Segmentation activée
- [ ] Dynamic Retrieval activé
- [ ] Grounding activé
- [ ] Test de recherche réussi

---

## 🚀 Prêt pour Ingestion Complète

Si tous les checks sont ✅ :

```powershell
# Ingérer tous les codes depuis C:\LEGI
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --all
```

**Durée estimée** : 2-4 heures pour ~35,000 articles

---

**Date** : 19 Décembre 2025

