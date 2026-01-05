# Configuration des Variables d'Environnement

Ce document explique comment configurer le fichier `.env` pour LEGAL-RAG FRANCE.

## 📝 Mise à jour après configuration Vertex AI

Après avoir créé votre data store et votre Search App dans Vertex AI, **mettez à jour votre fichier `.env`** avec les valeurs suivantes :

```bash
# ==============================================================================
# GOOGLE CLOUD PLATFORM - Vertex AI Search
# ==============================================================================

# ID de votre projet GCP
GCP_PROJECT_ID=jurilab-481600

# Région de déploiement
GCP_REGION=europe-west1

# Location du data store (global ou regional)
GCP_LOCATION=global

# ID du Data Store créé dans Vertex AI
# Format: datastorerag_[TIMESTAMP]
GCP_DATASTORE_ID=datastorerag_1766055384992

# ID de la Search App créée dans Vertex AI
# Format: [nom-app]_[TIMESTAMP]
GCP_SEARCH_APP_ID=legal-rag-search_1766055550052

# Chemin vers le fichier de credentials JSON (clé de compte de service)
# Téléchargeable depuis GCP Console > IAM > Service Accounts
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

## 🔑 Valeurs actuelles (Décembre 2025)

Pour référence, voici les valeurs configurées lors de l'installation initiale :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `GCP_PROJECT_ID` | `jurilab-481600` | Projet GCP principal |
| `GCP_REGION` | `europe-west1` | Région Europe (Belgique) |
| `GCP_LOCATION` | `global` | Location du data store |
| `GCP_DATASTORE_ID` | `datastorerag_1766055384992` | Data store avec 10 articles de test |
| `GCP_SEARCH_APP_ID` | `legal-rag-search_1766055550052` | Search App principale |
| **Cloud Storage Bucket** | `gs://legal-rag-data-sofia-2025` | Bucket pour les données JSONL |

## 📦 Structure complète du `.env`

Voici la structure complète recommandée :

```bash
# ==============================================================================
# API LÉGIFRANCE (PISTE)
# ==============================================================================
PISTE_CLIENT_ID=your_client_id_here
PISTE_CLIENT_SECRET=your_client_secret_here
PISTE_GRANT_TYPE=client_credentials
PISTE_TOKEN_URL=https://oauth.piste.gouv.fr/api/oauth/token

# ==============================================================================
# GOOGLE CLOUD PLATFORM
# ==============================================================================
GCP_PROJECT_ID=jurilab-481600
GCP_REGION=europe-west1
GCP_LOCATION=global
GCP_DATASTORE_ID=datastorerag_1766055384992
GCP_SEARCH_APP_ID=legal-rag-search_1766055550052
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# ==============================================================================
# HUGGING FACE
# ==============================================================================
HF_TOKEN=your_hf_token_here
HF_DATASET_NAME=antoinejeannot/decisions-justice

# ==============================================================================
# MODÈLES GEMINI
# ==============================================================================
GEMINI_PRO_MODEL=gemini-1.5-pro-latest
GEMINI_FLASH_MODEL=gemini-1.5-flash-latest

# ==============================================================================
# MCP (MODEL CONTEXT PROTOCOL)
# ==============================================================================
MCP_SERVER_URL=http://localhost:3000
MCP_ENABLE=false

# ==============================================================================
# PARAMÈTRES D'INGESTION
# ==============================================================================
CHECKPOINT_INTERVAL=500
MAX_RETRY_ATTEMPTS=3
RATE_LIMIT_DELAY=0.5

# ==============================================================================
# LOGS
# ==============================================================================
LOG_LEVEL=INFO
LOG_FILE=logs/legal_rag.log
```

## 🔍 Comment trouver les IDs Vertex AI

### Data Store ID

1. Allez dans **GCP Console** → **Discovery Engine** → **Data Stores**
2. Cliquez sur votre data store (ex: `datastorerag`)
3. L'ID est affiché dans la colonne **"Identifiant"**
4. Format: `datastorerag_[TIMESTAMP]`

### Search App ID

1. Allez dans **GCP Console** → **Discovery Engine** → **Apps**
2. Cliquez sur votre application (ex: `legal-rag-search`)
3. L'ID est affiché dans la colonne **"Identifiant"**
4. Format: `[nom-app]_[TIMESTAMP]`

### Credentials JSON

1. Allez dans **GCP Console** → **IAM & Admin** → **Service Accounts**
2. Créez un nouveau compte de service (ou utilisez un existant)
3. Accordez les rôles :
   - `Discovery Engine Admin`
   - `Storage Object Viewer`
4. Créez une clé JSON
5. Téléchargez le fichier et placez-le dans votre projet
6. Mettez à jour `GOOGLE_APPLICATION_CREDENTIALS` avec le chemin

## ✅ Vérification

Pour vérifier que votre configuration est correcte :

```bash
# Dans votre terminal
python -c "from config.settings import get_settings; s = get_settings(); print(f'Project: {s.GCP_PROJECT_ID}'); print(f'App: {s.GCP_SEARCH_APP_ID}')"
```

Vous devriez voir :
```
Project: jurilab-481600
App: legal-rag-search_1766055550052
```

## 🧪 Test de connexion Vertex AI

Pour tester la connexion à Vertex AI Search :

```bash
python rag/vertex_search.py
```

Cela exécutera des tests de recherche et affichera les résultats.

## 🚨 Sécurité

⚠️ **IMPORTANT** :
- Ne commitez JAMAIS le fichier `.env` dans Git
- Ne partagez JAMAIS vos credentials
- Le `.gitignore` est configuré pour ignorer `.env` automatiquement
- Utilisez `.env.example` comme template (sans valeurs sensibles)

## 📚 Ressources

- [Documentation Vertex AI Search](https://cloud.google.com/generative-ai-app-builder/docs)
- [Guide d'authentification GCP](https://cloud.google.com/docs/authentication)
- [Documentation pylegifrance](https://pypi.org/project/pylegifrance/)

