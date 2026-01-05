# 🧪 Guide de Test - Ingestion Code Civil (100 articles)

## Étape 1 : Lancer l'ingestion de test

```bash
python ingestion/ingestion_massive.py --code civil --max-articles 100
```

**Ce qui va se passer :**
- Le script va essayer plusieurs sources (Hugging Face, data.gouv.fr, etc.)
- Il va générer un fichier JSONL dans `data/exports/`
- Format : `LEGITEXT000006070721_civil_YYYYMMDD_HHMMSS.jsonl`

**Vérification :**
- ✅ Le fichier JSONL est créé
- ✅ Pas d'erreurs dans les logs
- ✅ Message "✅ X articles ingérés"

---

## Étape 2 : Vérifier le format JSONL

### 2.1 Vérifier que le fichier existe

```bash
# Lister les fichiers créés
ls -lh data/exports/LEGITEXT000006070721_civil_*.jsonl
```

### 2.2 Vérifier le format (ligne par ligne)

```bash
# Afficher la première ligne (premier article)
head -1 data/exports/LEGITEXT000006070721_civil_*.jsonl | python -m json.tool
```

**Format attendu :**
```json
{
  "id": "LEGITEXT000006070721_ENRICHED_000000",
  "jsonData": "{\"content\": \"...\", \"title\": \"Article 1\", \"metadata\": {...}}"
}
```

### 2.3 Vérifier les métadonnées

```bash
# Extraire et afficher les métadonnées du premier article
head -1 data/exports/LEGITEXT000006070721_civil_*.jsonl | \
  python -c "import json, sys; data=json.load(sys.stdin); \
  metadata=json.loads(data['jsonData'])['metadata']; \
  print(json.dumps(metadata, indent=2, ensure_ascii=False))"
```

**Métadonnées attendues :**
```json
{
  "code_id": "LEGITEXT000006070721",
  "code_name": "Code civil",
  "type": "article_code",
  "article_num": "1",
  "etat": "VIGUEUR",
  "date_debut": "1804-02-07",
  "source": "Dataset enrichi",
  ...
}
```

### 2.4 Compter les articles

```bash
# Compter le nombre de lignes (articles)
wc -l data/exports/LEGITEXT000006070721_civil_*.jsonl
```

**Résultat attendu :** ~100 lignes

### 2.5 Vérifier la validité JSON (optionnel)

```bash
# Vérifier que chaque ligne est un JSON valide
python -c "
import json
with open('data/exports/LEGITEXT000006070721_civil_*.jsonl', 'r') as f:
    for i, line in enumerate(f, 1):
        try:
            json.loads(line)
        except json.JSONDecodeError as e:
            print(f'Erreur ligne {i}: {e}')
            break
    else:
        print('✅ Toutes les lignes sont des JSON valides')
"
```

---

## Étape 3 : Upload vers Cloud Storage

### 3.1 Vérifier que gsutil est installé

```bash
gsutil --version
```

Si pas installé : Installer Google Cloud SDK

### 3.2 Upload vers GCS

```bash
# Upload le fichier JSONL vers Cloud Storage
gsutil cp data/exports/LEGITEXT000006070721_civil_*.jsonl \
  gs://legal-rag-data-sofia-2025/
```

**Vérification :**
```bash
# Lister les fichiers dans le bucket
gsutil ls gs://legal-rag-data-sofia-2025/LEGITEXT000006070721_civil_*.jsonl
```

---

## Étape 4 : Importer dans Vertex AI Search

### 4.1 Accéder à Vertex AI Search

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet : `jurilab-481600`
3. Menu : **Vertex AI** → **Search** → **Data Stores**

### 4.2 Sélectionner le datastore

1. Cliquer sur le datastore : `datastorerag_1766055384992`
2. Onglet : **Import**

### 4.3 Configurer l'import

1. **Source** : `Cloud Storage`
2. **Path** : `gs://legal-rag-data-sofia-2025/LEGITEXT000006070721_civil_YYYYMMDD_HHMMSS.jsonl`
   - (Remplacer par le nom exact de votre fichier)
3. **Format** : `JSONL`
4. **Schema** : `Auto-detect` (ou laisser par défaut)

### 4.4 Lancer l'import

1. Cliquer sur **Import**
2. Attendre la fin de l'import (~2-5 minutes pour 100 articles)

**Vérification :**
- Statut : `Completed` (vert)
- Documents importés : ~100

---

## Étape 5 : Tester la recherche et les filtres

### 5.1 Test basique : Recherche simple

Créer un fichier `test_search.py` :

```python
"""Test de recherche dans Vertex AI Search"""

from rag.vertex_search import VertexSearchClient
from config.logging_config import get_logger

logger = get_logger(__name__)

# Initialiser le client
client = VertexSearchClient()

# Test 1 : Recherche simple
logger.info("=" * 70)
logger.info("TEST 1 : Recherche simple")
logger.info("=" * 70)

results = client.search("contrat", page_size=5)

logger.info(f"✅ {len(results)} résultats trouvés")
for i, doc in enumerate(results, 1):
    logger.info(f"\n{i}. {doc.get('title', 'Sans titre')}")
    logger.info(f"   Score: {doc.get('score', 'N/A')}")
    logger.info(f"   Contenu: {doc.get('content', '')[:100]}...")
    metadata = doc.get('metadata', {})
    logger.info(f"   Code: {metadata.get('code_name', 'N/A')}")
    logger.info(f"   Article: {metadata.get('article_num', 'N/A')}")

# Test 2 : Recherche avec filtre par code
logger.info("\n" + "=" * 70)
logger.info("TEST 2 : Recherche avec filtre (Code Civil uniquement)")
logger.info("=" * 70)

try:
    results_filtered = client.filter_by_metadata(
        query="contrat",
        code_id="LEGITEXT000006070721",
        etat="VIGUEUR"
    )
    
    logger.info(f"✅ {len(results_filtered)} résultats filtrés")
    for i, doc in enumerate(results_filtered[:3], 1):
        logger.info(f"\n{i}. {doc.get('title', 'Sans titre')}")
        metadata = doc.get('metadata', {})
        logger.info(f"   Code: {metadata.get('code_name', 'N/A')}")
        logger.info(f"   État: {metadata.get('etat', 'N/A')}")
except Exception as e:
    logger.warning(f"⚠️ Erreur filtre: {e}")
    logger.info("   (Les filtres peuvent ne pas fonctionner selon config Vertex AI)")

# Test 3 : Recherche globale (tous les types)
logger.info("\n" + "=" * 70)
logger.info("TEST 3 : Recherche globale")
logger.info("=" * 70)

results_all = client.search("majorité", page_size=10)
logger.info(f"✅ {len(results_all)} résultats globaux")

# Vérifier les métadonnées
types_found = set()
for doc in results_all:
    metadata = doc.get('metadata', {})
    doc_type = metadata.get('type', 'unknown')
    types_found.add(doc_type)

logger.info(f"   Types de documents trouvés: {types_found}")

logger.info("\n" + "=" * 70)
logger.info("✅ Tests terminés")
logger.info("=" * 70)
```

**Exécuter :**
```bash
python test_search.py
```

### 5.2 Test des filtres (si supportés)

Si les filtres fonctionnent, vous devriez voir :
- ✅ Résultats filtrés par `code_id`
- ✅ Résultats filtrés par `etat`

Si les filtres ne fonctionnent pas :
- ⚠️ Erreur : `Unsupported field "metadata.code_id"`
- ✅ Solution : Filtrer côté application (voir ci-dessous)

### 5.3 Filtrage côté application (fallback)

Si Vertex AI ne supporte pas les filtres nested, filtrer après récupération :

```python
# Recherche globale
results = client.search("contrat", page_size=100)

# Filtrer côté application
code_civil_results = [
    r for r in results 
    if r.get('metadata', {}).get('code_id') == 'LEGITEXT000006070721'
]

vigueur_results = [
    r for r in results 
    if r.get('metadata', {}).get('etat') == 'VIGUEUR'
]

logger.info(f"Code Civil: {len(code_civil_results)} résultats")
logger.info(f"En vigueur: {len(vigueur_results)} résultats")
```

---

## Étape 6 : Validation finale

### Checklist de validation

- [ ] ✅ Fichier JSONL créé et valide
- [ ] ✅ Métadonnées présentes et correctes
- [ ] ✅ Upload vers GCS réussi
- [ ] ✅ Import dans Vertex AI réussi (~100 documents)
- [ ] ✅ Recherche simple fonctionne
- [ ] ✅ Résultats pertinents retournés
- [ ] ✅ Métadonnées accessibles dans les résultats
- [ ] ⚠️ Filtres Vertex AI (test, peut ne pas fonctionner)
- [ ] ✅ Filtrage côté application fonctionne (fallback)

### Si tout est OK ✅

**Prochaine étape :** Ingérer tous les codes

```bash
python ingestion/ingestion_massive.py --all
```

### Si problème ❌

**Vérifier :**
1. Logs : `logs/legal_rag.log`
2. Format JSONL : Vérifier avec `head -1 | python -m json.tool`
3. Métadonnées : Vérifier structure
4. Vertex AI : Vérifier statut import dans console

---

## 🐛 Dépannage

### Erreur : "File not found"

```bash
# Vérifier que le fichier existe
ls -la data/exports/
```

### Erreur : "Invalid JSON"

```bash
# Vérifier chaque ligne
python -c "
import json
with open('data/exports/LEGITEXT000006070721_civil_*.jsonl', 'r') as f:
    for i, line in enumerate(f, 1):
        try:
            json.loads(line)
        except Exception as e:
            print(f'Ligne {i}: {e}')
"
```

### Erreur : "gsutil: command not found"

Installer Google Cloud SDK :
```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# Puis authentifier
gcloud auth login
gcloud auth application-default login
```

### Erreur : "Permission denied" (GCS)

```bash
# Vérifier les permissions
gsutil iam get gs://legal-rag-data-sofia-2025/

# Si nécessaire, donner les permissions
gsutil iam ch user:your-email@example.com:objectAdmin gs://legal-rag-data-sofia-2025/
```

### Erreur : "DataStore not found" (Vertex AI)

Vérifier dans `.env` :
```
GCP_PROJECT_ID=jurilab-481600
GCP_DATASTORE_ID=datastorerag_1766055384992
```

---

## 📊 Résultats attendus

### Recherche "contrat"

**Résultats attendus :**
- Articles du Code Civil sur les contrats (1101, 1102, 1103, etc.)
- Score de pertinence > 0
- Métadonnées complètes

### Recherche "majorité"

**Résultats attendus :**
- Article 414 du Code Civil (majorité à 18 ans)
- Autres articles pertinents

### Filtres (si supportés)

**Filtre `code_id="LEGITEXT000006070721"` :**
- Uniquement articles Code Civil
- Pas d'autres codes

**Filtre `etat="VIGUEUR"` :**
- Uniquement articles en vigueur
- Pas d'articles abrogés

---

**Date** : 19 Décembre 2025  
**Statut** : Guide de test complet

