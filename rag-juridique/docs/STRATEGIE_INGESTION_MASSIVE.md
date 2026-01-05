# 📚 Stratégie d'Ingestion Massive - Données Juridiques

## 🎯 Objectif

Ingérer **TOUTES** les données juridiques françaises dans un **seul datastore Vertex AI** avec segmentation par **métadonnées**.

## ✅ Pourquoi maintenant ?

1. ✅ **Tous les outils fonctionnent** (5 piliers opérationnels)
2. ✅ **API stable** (plus d'erreurs 500 critiques)
3. ✅ **Format Vertex AI validé** (test avec 10 articles réussi)
4. ✅ **Métadonnées structurées** (prêtes pour segmentation)

## 🏗️ Architecture

### Un seul datastore, segmentation par métadonnées

```
datastorerag_1766055384992 (global)
├── Code Civil (code_id: LEGITEXT000006070721)
├── Code Pénal (code_id: LEGITEXT000006070716)
├── Code du Travail (code_id: LEGITEXT000006072050)
├── Code de Commerce (code_id: LEGITEXT000005634379)
└── ... (autres codes)
```

### Métadonnées pour segmentation

Chaque document contient des métadonnées permettant le filtrage :

```json
{
  "id": "LEGIARTI000006419101",
  "jsonData": "{
    \"content\": \"...\",
    \"title\": \"Article 1101\",
    \"metadata\": {
      \"code_id\": \"LEGITEXT000006070721\",      // ← Filtrage par code
      \"code_name\": \"Code civil\",                // ← Affichage
      \"type\": \"article_code\",                  // ← Type de document
      \"etat\": \"VIGUEUR\",                       // ← Filtrage par état
      \"date_debut\": \"2016-10-01\",              // ← Filtrage temporel
      \"article_num\": \"1101\",                   // ← Recherche précise
      \"breadcrumb\": \"Code civil > Livre III...\", // ← Navigation
      \"source\": \"Hugging Face\"                 // ← Traçabilité
    }
  }"
}
```

## 📋 Codes à ingérer (par priorité)

| Priorité | Code | ID | Articles | Statut |
|----------|------|-----|----------|--------|
| 1 | Code civil | LEGITEXT000006070721 | ~8,000 | ⏳ À faire |
| 2 | Code pénal | LEGITEXT000006070716 | ~5,000 | ⏳ À faire |
| 3 | Code du travail | LEGITEXT000006072050 | ~10,000 | ⏳ À faire |
| 4 | Code de commerce | LEGITEXT000005634379 | ~3,000 | ⏳ À faire |
| 5 | Code de procédure civile | LEGITEXT000006070716 | ~2,000 | ⏳ À faire |
| 6 | Code de procédure pénale | LEGITEXT000006071164 | ~2,000 | ⏳ À faire |
| 7 | Code de la sécurité sociale | LEGITEXT000006073189 | ~5,000 | ⏳ À faire |

**Total estimé : ~35,000 articles**

## 🚀 Utilisation

### 1. Ingérer un code spécifique

```bash
# Code Civil complet
python ingestion/ingestion_massive.py --code civil

# Code Pénal avec limite (test)
python ingestion/ingestion_massive.py --code penal --max-articles 1000
```

### 2. Ingérer tous les codes

```bash
# Tous les codes (ordre de priorité)
python ingestion/ingestion_massive.py --all

# Avec limite par code (test)
python ingestion/ingestion_massive.py --all --max-articles 500
```

### 3. Reprendre après interruption

Le script sauvegarde automatiquement des checkpoints :

```bash
# Le script reprendra automatiquement depuis le dernier checkpoint
python ingestion/ingestion_massive.py --code civil
```

## 📥 Stratégies d'ingestion (avec fallback)

Le script essaie plusieurs sources dans l'ordre :

1. **Hugging Face** (datasets disponibles)
   - `antoinejeannot/code-civil-fr`
   - `antoinejeannot/french-jurisprudence`

2. **data.gouv.fr / DILA** (téléchargement direct)
   - Archives LEGI
   - Dumps XML

3. **Fichiers locaux** (XML/JSON)
   - Dossier `data/raw/{code_name}/`

4. **Génération enrichie** (fallback)
   - Articles essentiels pré-définis
   - Pour tester le pipeline

## 📤 Upload vers Vertex AI

### Étape 1 : Upload vers Cloud Storage

```bash
# Upload tous les fichiers JSONL
gsutil -m cp data/exports/*.jsonl gs://legal-rag-data-sofia-2025/
```

### Étape 2 : Import dans Vertex AI Search

1. Aller dans **GCP Console** > **Vertex AI Search**
2. Sélectionner le datastore : `datastorerag_1766055384992`
3. Cliquer sur **Importer**
4. Sélectionner les fichiers depuis GCS : `gs://legal-rag-data-sofia-2025/*.jsonl`
5. Lancer l'import

### Étape 3 : Vérification

Tester la segmentation par métadonnées :

```python
from rag.vertex_search import VertexSearchClient

client = VertexSearchClient()

# Recherche dans Code Civil uniquement
results = client.filter_by_metadata(
    query="contrat",
    code_id="LEGITEXT000006070721",
    etat="VIGUEUR"
)

# Recherche dans tous les codes
results_all = client.search("contrat", page_size=10)
```

## 🔍 Segmentation par métadonnées

### Filtres disponibles

- **Par code** : `code_id="LEGITEXT000006070721"`
- **Par état** : `etat="VIGUEUR"` (VIGUEUR, ABROGE, MODIFIE)
- **Par date** : `date_debut>="2020-01-01"`
- **Par type** : `type="article_code"` (article_code, jurisprudence, etc.)

### Exemples d'utilisation

```python
# Articles en vigueur du Code Civil
client.filter_by_metadata(
    query="contrat",
    code_id="LEGITEXT000006070721",
    etat="VIGUEUR"
)

# Articles modifiés après 2020
client.filter_by_metadata(
    query="travail",
    code_id="LEGITEXT000006072050",
    date_debut_min="2020-01-01"
)
```

## ⚠️ Limitations connues

### Filtres Vertex AI

Les filtres sur champs nested (`metadata.etat`) peuvent ne pas fonctionner selon la configuration Vertex AI. Dans ce cas :

- **Solution 1** : Utiliser la recherche sémantique pure (fonctionne toujours)
- **Solution 2** : Filtrer côté application après récupération
- **Solution 3** : Restructurer le JSONL (métadonnées au niveau racine)

### Volume de données

- **Limite Vertex AI** : ~1M documents par datastore
- **Notre volume** : ~35,000 articles (bien en dessous)
- **Marge** : Place pour jurisprudence et autres sources

## 📊 Monitoring

### Checkpoints

Le script sauvegarde automatiquement :
- `data/checkpoints/{code_name}_checkpoint.json` : Progression par code
- `data/checkpoints/global_checkpoint.json` : Statistiques globales

### Logs

Tous les logs sont dans :
- Console (temps réel)
- `logs/legal_rag.log` (fichier)

### Statistiques

À la fin de l'ingestion :
```
✅ INGESTION MASSIVE TERMINÉE
📊 Statistiques:
   - Codes traités: 7
   - Articles totaux: 35,000
   - Erreurs: 0
   - Durée: 1234.5 secondes
```

## 🎯 Prochaines étapes après ingestion

1. **Tester les 5 piliers** avec données complètes
2. **Valider la segmentation** (filtres par code/état)
3. **Ajouter jurisprudence** (Hugging Face datasets)
4. **Optimiser les prompts** (plus de contexte disponible)
5. **Améliorer les filtres** (si nécessaire)

## 💡 Conseils

- **Commencer petit** : Tester avec `--max-articles 100` d'abord
- **Un code à la fois** : Valider le pipeline avant d'ingérer tous les codes
- **Vérifier les métadonnées** : S'assurer que la segmentation fonctionne
- **Sauvegarder les exports** : Garder les fichiers JSONL pour re-import si besoin

---

**Date de création** : 19 Décembre 2025  
**Statut** : Prêt pour ingestion massive

