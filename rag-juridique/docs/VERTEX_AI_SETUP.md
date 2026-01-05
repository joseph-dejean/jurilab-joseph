# 🔧 Configuration Vertex AI Search - Guide Complet

**Date** : 18 Décembre 2025  
**Niveau** : Débutant → Avancé

---

## 🎯 Objectif

Configurer **Vertex AI Search** (anciennement Enterprise Search) pour indexer nos données juridiques et activer le **Dynamic RAG**.

---

## 📋 Prérequis

### 1. Compte Google Cloud Platform

- [ ] Compte GCP actif
- [ ] Projet GCP créé
- [ ] Facturation activée (essai gratuit 300$ disponible)

### 2. APIs à Activer

```bash
# Activer les APIs nécessaires
gcloud services enable \
  discoveryengine.googleapis.com \
  aiplatform.googleapis.com \
  storage-api.googleapis.com
```

### 3. Credentials Configurés

Dans ton fichier `.env` :
```env
GCP_PROJECT_ID=ton-projet-id
GCP_REGION=europe-west1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

---

## 🚀 Étape 1 : Créer un Service Account

### Via Console GCP

1. **IAM & Admin** → **Service Accounts**
2. **Create Service Account**
   - Name : `legal-rag-service`
   - Role : `Discovery Engine Admin`
   - Role : `Storage Object Admin`
3. **Create Key** → Download JSON
4. Sauvegarde dans : `credentials/legal-rag-service-account.json`
5. Update `.env` :
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=credentials/legal-rag-service-account.json
   ```

### Via gcloud CLI

```bash
# Créer le service account
gcloud iam service-accounts create legal-rag-service \
  --display-name="Legal RAG Service Account"

# Donner les permissions
gcloud projects add-iam-policy-binding ton-projet-id \
  --member="serviceAccount:legal-rag-service@ton-projet-id.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.admin"

# Créer la clé
gcloud iam service-accounts keys create credentials/legal-rag-sa.json \
  --iam-account=legal-rag-service@ton-projet-id.iam.gserviceaccount.com
```

---

## 🏗️ Étape 2 : Créer un Datastore

### Option A : Via Console GCP (Recommandé pour débutant)

1. **Vertex AI** → **Search** → **Create Data Store**
2. **Configuration** :
   - Name : `legal-rag-datastore`
   - Type : `Unstructured documents`
   - Location : `europe-west1` (RGPD compliant)
   - Industry : `Professional Services`

3. **Data Source** :
   - Type : `Cloud Storage`
   - Format : `JSONL`
   - Path : `gs://your-bucket/LEGITEXT000006070721_test_vertex.jsonl`

4. **Advanced Options** :
   - ✅ Enable Dynamic Retrieval
   - ✅ Enable Semantic Search
   - Search Tier : `Advanced` (pour meilleure qualité)

### Option B : Via gcloud CLI

```bash
# Créer le datastore
gcloud alpha discovery-engine data-stores create legal-rag-datastore \
  --location=europe-west1 \
  --industry-vertical=PROFESSIONAL_SERVICES \
  --solution-type=SOLUTION_TYPE_SEARCH \
  --content-config=CONTENT_REQUIRED

# Note l'ID du datastore créé
```

---

## 📤 Étape 3 : Upload des Données

### A. Créer un Bucket Cloud Storage

```bash
# Créer le bucket
gsutil mb -l europe-west1 gs://legal-rag-data-bucket/

# Upload du fichier JSONL
gsutil cp data/exports/LEGITEXT000006070721_test_vertex.jsonl \
  gs://legal-rag-data-bucket/
```

### B. Importer dans le Datastore

#### Via Console
1. Datastore → **Import Data**
2. Source : `gs://legal-rag-data-bucket/LEGITEXT000006070721_test_vertex.jsonl`
3. Format : `JSONL`
4. Schema : Auto-detect
5. **Import**

#### Via gcloud
```bash
gcloud alpha discovery-engine documents import \
  --datastore=legal-rag-datastore \
  --location=europe-west1 \
  --gcs-uri=gs://legal-rag-data-bucket/LEGITEXT000006070721_test_vertex.jsonl
```

**Durée** : ~5-10 minutes pour 10 articles, ~2-4h pour 150K articles

---

## 🔍 Étape 4 : Créer un Search Engine

### Via Console

1. **Vertex AI Search** → **Engines** → **Create**
2. **Configuration** :
   - Name : `legal-rag-search-engine`
   - Type : `Search`
   - Datastore : `legal-rag-datastore` (sélectionner)
   - Company : `Legal Tech Startup`

3. **Search Configuration** :
   - Search Add-ons :
     - ✅ Snippets
     - ✅ Extractive Answers
     - ✅ Personalization
   - Boost/Bury :
     - Boost : `etat:VIGUEUR` (priorité aux articles en vigueur)
     - Boost : `date_debut:recent` (articles récents)

### Via gcloud

```bash
gcloud alpha discovery-engine engines create legal-rag-search-engine \
  --location=europe-west1 \
  --data-store-ids=legal-rag-datastore \
  --industry-vertical=PROFESSIONAL_SERVICES
```

---

## 🧪 Étape 5 : Tester la Recherche

### Via Console (Quick Test)

1. **Search Engine** → **Preview** tab
2. Test queries :
   - "contrat"
   - "Article 1101"
   - "accord de volontés"

**Résultats attendus** : Articles pertinents avec scores

### Via Python (Recommended)

Créons un script de test :

```python
# tests/test_vertex_search.py
from google.cloud import discoveryengine_v1 as discoveryengine

def test_search():
    # Configuration
    project_id = "ton-projet-id"
    location = "europe-west1"
    engine_id = "legal-rag-search-engine"
    
    # Client
    client = discoveryengine.SearchServiceClient()
    
    # Requête
    serving_config = f"projects/{project_id}/locations/{location}/collections/default_collection/engines/{engine_id}/servingConfigs/default_config"
    
    request = discoveryengine.SearchRequest(
        serving_config=serving_config,
        query="contrat accord volontés",
        page_size=5
    )
    
    # Exécution
    response = client.search(request)
    
    # Affichage
    print(f"Trouvé {response.total_size} résultats\n")
    
    for result in response.results:
        document = result.document
        print(f"ID: {document.id}")
        print(f"Score: {result.score:.3f}")
        print(f"Titre: {document.derived_struct_data.get('title', 'N/A')}")
        print(f"Extrait: {document.derived_struct_data.get('snippets', ['N/A'])[0][:100]}...")
        print("-" * 80)

if __name__ == "__main__":
    test_search()
```

**Run** :
```bash
python tests/test_vertex_search.py
```

---

## ⚙️ Étape 6 : Configuration Avancée

### A. Dynamic Retrieval Configuration

```python
# Dans vertex_ai/search_config.py
DYNAMIC_RETRIEVAL_CONFIG = {
    "minimum_context_window": 2000,  # Tokens minimum
    "maximum_context_window": 8000,  # Tokens maximum
    "relevance_threshold": 0.7,      # Score minimum
    "adaptive_strategy": "AUTO",      # Ajustement automatique
}
```

### B. Filters & Facets

```python
# Filtres disponibles
AVAILABLE_FILTERS = {
    "etat": ["VIGUEUR", "ABROGE", "MODIFIE"],
    "code_id": ["LEGITEXT000006070721", ...],
    "date_debut": "date range",
    "article_num": "numeric",
}

# Exemple de recherche filtrée
request = discoveryengine.SearchRequest(
    serving_config=serving_config,
    query="contrat",
    filter="etat:VIGUEUR AND date_debut > 2020-01-01"
)
```

### C. Boosting Rules

```json
{
  "boostSpecs": [
    {
      "conditionBoostSpecs": [
        {
          "condition": "etat: VIGUEUR",
          "boost": 2.0
        },
        {
          "condition": "date_debut > 2015-01-01",
          "boost": 1.5
        }
      ]
    }
  ]
}
```

---

## 📊 Étape 7 : Monitoring & Optimisation

### Métriques à Surveiller

1. **Query Performance**
   - Latence : < 500ms (objectif)
   - Throughput : queries/seconde

2. **Quality Metrics**
   - Click-through rate
   - Relevance scores
   - User feedback

3. **Costs**
   - Queries count
   - Storage utilisé
   - Data processing

### Dashboard GCP

```
Cloud Console → Vertex AI → Search → Analytics
```

---

## 💰 Estimation des Coûts

### Tier Pricing (Approximatif)

| Volume | Prix/1000 queries | Stockage/GB/mois |
|--------|-------------------|------------------|
| 0-100K | $4-6 | $0.10 |
| 100K-1M | $3-5 | $0.08 |
| 1M+ | $2-4 | $0.05 |

**Estimation pour ton projet** :
- Test (10 articles) : ~$5-10/mois
- Production (150K articles) : ~$50-100/mois

---

## 🆘 Troubleshooting

### Problème : Import échoue

**Solutions** :
- Vérifier format JSONL (1 JSON par ligne)
- Vérifier schema (id + jsonData requis)
- Vérifier permissions Cloud Storage

### Problème : Recherche ne retourne rien

**Solutions** :
- Attendre fin d'indexation (check status)
- Vérifier query (trop spécifique ?)
- Vérifier filtres (trop restrictifs ?)

### Problème : Latence élevée

**Solutions** :
- Activer cache
- Réduire page_size
- Optimiser index (facets, boost)

---

## ✅ Checklist Finale

- [ ] Service Account créé
- [ ] APIs activées
- [ ] Datastore créé
- [ ] Données uploadées et indexées
- [ ] Search Engine configuré
- [ ] Tests de recherche OK
- [ ] Dynamic Retrieval activé
- [ ] Monitoring configuré
- [ ] Backup plan défini

---

## 🚀 Prochaine Étape

Une fois Vertex AI configuré, tu peux :
1. Développer le **Super-Chercheur** (Pilier 2)
2. Intégrer avec **Gemini** pour les réponses
3. Créer l'interface **Chatbot** (Pilier 5)

---

**Besoin d'aide ?** Consulte :
- [Documentation officielle](https://cloud.google.com/generative-ai-app-builder/docs)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- Support GCP

