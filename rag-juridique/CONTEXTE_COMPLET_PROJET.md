# 📚 CONTEXTE COMPLET - LEGAL-RAG FRANCE

**Document de contexte pour LLM - Toute l'histoire du projet**

**Date de création :** 18 Décembre 2025  
**Statut :** Backend opérationnel, Frontend intégré, Problèmes en cours de résolution

---

## 🎯 VUE D'ENSEMBLE DU PROJET

### Objectif
Créer une plateforme d'ingénierie juridique révolutionnaire pour le droit français, basée sur :
- **Gemini 1.5** (Google) pour la génération de texte
- **Vertex AI Search** (Google) pour le RAG dynamique
- **Theolex** (analyse sémantique) pour l'extraction de métadonnées

### Les 5 Piliers (Outils IA)
1. **Machine à Actes** : Génération automatique d'actes juridiques personnalisés
2. **Super-Chercheur** : Recherche sémantique avancée dans la jurisprudence
3. **Audit et Conformité** : Détection d'anachronismes et vérification réglementaire
4. **Synthèse et Aide à la Stratégie** : Synthèse de dossiers procéduraux
5. **Chatbot Avocat** : Assistant conversationnel avec RAG et grounding

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Backend (Python 3.11+)
- **Framework API** : FastAPI (port 8000)
- **LLM** : Google Gemini 1.5 Pro & Flash (via API directe avec clé API)
- **RAG** : Vertex AI Search (Google Cloud Platform)
- **Validation** : Pydantic
- **Logging** : Loguru
- **Structure modulaire** : `api/`, `rag/`, `config/`, `prompts/`, `utils/`

### Frontend (React + TypeScript)
- **Projet** : JuriLabb (existant)
- **Localisation** : `C:\Users\sofia\Desktop\perso\hackaton google\jurilabb`
- **Intégration** : Nouvelle page `/ai-tools` avec 5 onglets
- **Service API** : `services/legalRagService.ts`
- **Composants** : `components/ai-tools/*.tsx`

### Infrastructure Cloud
- **GCP Project** : `jurilab-481600`
- **Region** : `europe-west1` (principalement)
- **Vertex AI Search** : DataStore `datastorerag_1766055384992`
- **Cloud Storage** : `gs://legal-rag-data-sofia-2025`

---

## 📊 PHASE 1 : INGESTION ET RAG

### Problème initial : API Légifrance PISTE
- **Objectif** : Ingérer le Code Civil français via l'API PISTE (Légifrance)
- **Problème rencontré** : Erreurs 500 persistantes côté serveur Légifrance
- **Tentatives** :
  - Vérification des credentials (PRODUCTION + SANDBOX)
  - Contact avec le support Légifrance (pas de réponse)
  - Consultation de la FAQ officielle
- **Solution temporaire** : Dataset de test (10 articles Code Civil enrichis)

### Solution alternative : data.gouv.fr
- **Script créé** : `ingestion/ingestion_datagouv_simple.py`
- **Sources de fallback** :
  1. Hugging Face (dataset Antoine Jeannot)
  2. DILA (alternative)
  3. Génération enrichie (21 articles essentiels si autres sources échouent)

### Format Vertex AI Search
- **Format requis** : JSONL avec champ `jsonData` contenant une **chaîne JSON** (pas un objet)
- **Correction appliquée** : `json.dumps()` pour wrapper le contenu de `jsonData`
- **Structure** :
```json
{
  "id": "LEGIARTI000006419101",
  "jsonData": "{\"content\": \"...\", \"title\": \"...\", \"metadata\": {...}}"
}
```

### Ingestion réussie
- **Dataset test** : 10 articles Code Civil
- **Upload GCS** : `gs://legal-rag-data-sofia-2025/LEGITEXT000006070721_test_vertex.jsonl`
- **Import Vertex AI** : DataStore `datastorerag_1766055384992` (global)
- **Statut** : ✅ 10 documents indexés avec succès

---

## 🔧 PHASE 2 : DÉVELOPPEMENT DES 5 PILIERS

### Pilier 1 : Machine à Actes (`api/machine_actes.py`)

**Fonctionnalités** :
- Upload d'un PDF template (modèle d'acte)
- Analyse automatique du style (polices, couleurs, marges, header/footer)
- Injection intelligente des données client (variables détectées automatiquement)
- Génération d'un PDF identique avec nouvelles données
- Validation utilisateur avant export

**Spécificités** :
- **Format input** : PDF template + données client (dict)
- **Format output** : PDF ou texte
- **Modèle Gemini** : Flash (quota 10M tokens/min, plus rapide)
- **Templates personnalisés** : Utilisateur peut créer ses propres templates via prompt

**Problèmes rencontrés** :
- ❌ Erreur 429 (Quota exceeded) → **RÉSOLU** : Passage de Pro à Flash
- ❌ Erreur 400 (Token limit) → **RÉSOLU** : Vérification taille template (max 200k caractères)
- ⚠️ Frontend : Génération texte OK, mais problème avec téléchargement PDF

**Routes API** :
- `POST /api/v1/machine-actes/generate` : Génération depuis texte
- `POST /api/v1/machine-actes/generate-from-file` : Génération depuis PDF
- `GET /api/v1/machine-actes/types` : Liste des types d'actes
- `GET /api/v1/machine-actes/health` : Health check

---

### Pilier 2 : Super-Chercheur (`api/super_chercheur.py`)

**Fonctionnalités** :
- Recherche sémantique dans codes juridiques et jurisprudence
- Filtres avancés (juridiction, matière, date)
- Analyse de tendances jurisprudentielles
- Estimation de probabilités de succès
- Extraction d'arguments clés

**Spécificités** :
- **RAG** : Vertex AI Search pour la recherche
- **Analyse** : Gemini Pro pour les tendances
- **Filtres** : Limités (Vertex AI ne supporte pas `metadata.etat` en filtre)

**Problèmes rencontrés** :
- ❌ Erreur 500 → **RÉSOLU** : Doublon `TrendAnalysis` dans `models.py`
- ⚠️ Frontend : Interface peu claire ("Posez votre question en langage naturel" en bas)
- ⚠️ Filtres Vertex AI : Ne supporte pas les champs imbriqués (`metadata.etat`)

**Routes API** :
- `POST /api/v1/search/` : Recherche sémantique
- `GET /api/v1/search/health` : Health check

**Documentation** : `docs/PILIER_2_SUPER_CHERCHEUR.md`

---

### Pilier 3 : Audit et Conformité (`api/audit_conformite.py`)

**Fonctionnalités** :
- Détection d'anachronismes dans contrats anciens
- Vérification de conformité réglementaire
- Extraction de références juridiques (regex améliorés)
- Support PDF/DOCX/TXT
- Recommandations avec Gemini

**Spécificités** :
- **Regex français** : Patterns pour "art. 1101", "article premier", "al. 2", "L. 110-1", etc.
- **Extraction** : PyMuPDF (PDF), python-docx (DOCX)
- **Vérification** : RAG Vertex AI pour valider les références
- **MCP Légifrance** : Préparé mais désactivé (MVP)

**Problèmes rencontrés** :
- ❌ Erreur 422 → **EN COURS** : Validation FastAPI
- ❌ Erreur 500 → **EN COURS** : Gestion d'erreur
- ⚠️ PDF scannés : Extraction retourne 0 caractères (nécessite OCR - TODO futur)

**Routes API** :
- `POST /api/v1/audit/` : Audit depuis texte
- `POST /api/v1/audit/from-file` : Audit depuis fichier
- `GET /api/v1/audit/health` : Health check

**Documentation** :
- `docs/PILIER_3_UTILISATION.md` : Guide d'utilisation
- `docs/PILIER_3_AMELIORATIONS.md` : Améliorations futures

---

### Pilier 4 : Synthèse et Aide à la Stratégie (`api/synthese_strategie.py`)

**Fonctionnalités** :
- 5 types de synthèse :
  1. **Note stratégique** : Pour avocat (analyse approfondie)
  2. **Résumé de cas** : Brief rapide
  3. **Rapport client** : Vulgarisé pour non-juriste
  4. **Analyse de tendances** : Jurisprudence
  5. **Chronologie procédurale** : Timeline
- Support multi-documents (PDF/DOCX/TXT)
- Enrichissement RAG optionnel
- Prompts centralisés dans `prompts/prompts.py`

**Spécificités** :
- **Modèles** : Gemini Pro (analyses complexes) + Flash (vulgarisation)
- **Input** : Format frontend (`documents: [{content, title, date}]`) ou backend (`documents_content: [string]`)
- **Output** : Synthèse structurée avec points clés et recommandations

**Problèmes rencontrés** :
- ❌ Erreur 500 → **EN COURS** : Gestion d'erreur Gemini + validation
- ⚠️ Frontend : Seulement texte, pas PDF (corrigé mais à tester)

**Routes API** :
- `POST /api/v1/synthese/` : Génération synthèse
- `POST /api/v1/synthese/from-files` : Depuis fichiers
- `GET /api/v1/synthese/types` : Liste types
- `GET /api/v1/synthese/health` : Health check

---

### Pilier 5 : Chatbot Avocat (`api/chatbot_avocat.py`)

**Fonctionnalités** :
- Assistant conversationnel intelligent
- RAG Vertex AI pour grounding
- Citations de sources obligatoires
- Historique de conversation
- Suggestions d'actions

**Spécificités** :
- **Modèle** : Gemini Flash (rapide, quota élevé)
- **RAG** : Vertex AI Search pour récupérer sources
- **Prompts** : Centralisés dans `prompts/prompts.py`
- **Grounding** : Citations obligatoires (pas d'invention)

**Problèmes rencontrés** :
- ❌ Pas de citations sources → **RÉSOLU** : Correction parsing sources
- ⚠️ Frontend : Affichage sources amélioré

**Routes API** :
- `POST /api/v1/chat/` : Envoi message
- `GET /api/v1/chat/health` : Health check

**Documentation** : `docs/PILIER_5_CHATBOT.md`

---

## 🔌 PHASE 3 : API REST (FastAPI)

### Structure
- **Fichier principal** : `api/main.py`
- **Routers** : `api/routes/*.py` (un par pilier)
- **Modèles** : `api/models.py` (Pydantic)
- **Services** : `api/*.py` (logique métier)

### Endpoints principaux
- `GET /` : Root
- `GET /health` : Health check global
- `GET /docs` : Swagger UI
- `GET /redoc` : ReDoc

### CORS
- Configuré pour `http://localhost:5173` (frontend Vite)

### Démarrage
```powershell
cd "C:\Users\sofia\Desktop\perso\rag juridique"
$env:PYTHONPATH = (Get-Location).Path
.\venv\Scripts\python.exe start_api.py
```

**Documentation** : `docs/API_REST.md`

---

## 🎨 PHASE 4 : INTÉGRATION FRONTEND

### Projet JuriLabb
- **Localisation** : `C:\Users\sofia\Desktop\perso\hackaton google\jurilabb`
- **Framework** : React + TypeScript + Vite
- **Styling** : TailwindCSS
- **Icons** : lucide-react
- **Router** : react-router-dom

### Intégration réalisée
- **Branche Git** : `feature/integration-5-ai-tools`
- **Page** : `/ai-tools` (`pages/AIToolsPage.tsx`)
- **Navigation** : Sidebar entre "Rendez-vous" et "Messages"
- **Menu déroulant** : 5 outils avec onglets

### Composants créés
1. `ActGenerator.tsx` : Machine à Actes
2. `SuperChercheur.tsx` : Super-Chercheur
3. `ContractAuditor.tsx` : Audit et Conformité
4. `StrategicSynthesis.tsx` : Synthèse
5. `LegalChatbotEnhanced.tsx` : Chatbot

### Service API
- **Fichier** : `services/legalRagService.ts`
- **Base URL** : `http://localhost:8000` (configuré dans `.env.local`)
- **Fonctions** : Une par endpoint API

### Modifications fichiers existants
- `App.tsx` : Route `/ai-tools` ajoutée
- `Layout.tsx` : Menu "AI Tools" avec dropdown

**Documentation** :
- `INTEGRATION_FRONTEND_COMPLETE.md` : Guide général
- `INTEGRATION_JURILABB_SPECIFIQUE.md` : Guide spécifique JuriLabb
- `AI_TOOLS_INTEGRATION.md` : Détails techniques

---

## ⚠️ PROBLÈMES ACTUELS (Frontend)

### 1. Machine à Actes
- ✅ Génération texte : **FONCTIONNE**
- ❌ Téléchargement PDF : Problème (erreur `slice` sur undefined)
- ⚠️ Interface : Besoin d'améliorer UX

### 2. Super-Chercheur
- ❌ Erreur API 500 : **RÉSOLU** (doublon TrendAnalysis)
- ⚠️ Interface : Section "Posez votre question" peu claire
- ⚠️ Filtres : Limités par Vertex AI (champs imbriqués non supportés)

### 3. Audit et Conformité
- ❌ Erreur API 422 : **EN COURS** (validation FastAPI)
- ❌ Erreur API 500 : **EN COURS** (gestion d'erreur)
- ✅ Upload PDF : Fonctionne
- ⚠️ PDF scannés : Message d'erreur clair (OCR = TODO futur)

### 4. Synthèse et Aide à la Stratégie
- ❌ Erreur API 500 : **EN COURS** (gestion d'erreur Gemini)
- ✅ Upload fichiers : Fonctionne
- ⚠️ Validation : À améliorer

### 5. Chatbot Avocat
- ✅ Citations sources : **FONCTIONNE**
- ⚠️ UI : Améliorations mineures possibles

### 6. UI/UX globale
- ✅ Design professionnel : **APPLIQUÉ** (pas d'emojis, lucide-react)
- ✅ Layout : **CORRIGÉ** (plus de double layout, header band supprimé)
- ⚠️ Cohérence : À aligner avec design JuriLabb existant

---

## 🔧 CORRECTIONS APPLIQUÉES

### Backend
1. ✅ Passage Machine à Actes : Pro → Flash (éviter 429)
2. ✅ Correction doublon `TrendAnalysis` (Super-Chercheur)
3. ✅ Validation explicite Audit (422)
4. ✅ Validation explicite Synthèse (500)
5. ✅ Logs de débogage améliorés
6. ✅ Gestion PDF scannés (message clair)

### Frontend
1. ✅ Correction erreurs `.toFixed()` (valeurs undefined)
2. ✅ Correction erreurs `.slice()` (valeurs undefined)
3. ✅ Alignement interfaces TypeScript avec backend
4. ✅ Design professionnel (pas d'emojis)
5. ✅ Layout corrigé (pas de double layout)
6. ✅ Upload PDF/DOCX pour Audit et Synthèse
7. ✅ Toggle saisie texte / upload fichier

**Documents de corrections** :
- `CORRECTIONS_FINALES_ERREURS.md`
- `CORRECTIONS_FINALES_UI.md`
- `CORRECTION_422_500.md`
- `CORRECTION_TOFIXED.md`
- `CORRECTION_INTERFACES_API.md`

---

## 📋 TODOs ET BACKLOG

### Priorité HAUTE (À faire maintenant)
1. ✅ Corriger erreur 422 Audit → **EN COURS**
2. ✅ Corriger erreur 500 Synthèse → **EN COURS**
3. ⚠️ Tester tous les outils avec saisie texte
4. ⚠️ Valider téléchargement PDF Machine à Actes

### Priorité MOYENNE (Prochaines sessions)
1. **Filtres Vertex AI** : Implémenter workaround pour `metadata.etat`
2. **OCR PDF scannés** : Intégrer pytesseract ou alternative
3. **Internationalisation** : Adapter regex pour autres systèmes juridiques
4. **Templates PDF** : Améliorer génération avec styles complexes

### Priorité BASSE (Plus tard)
1. **MCP Légifrance** : Activer vérification temps réel
2. **Vertex AI Gemini** : Migrer de API directe vers Vertex AI (unification)
3. **Ingestion complète** : Code Civil complet + autres codes
4. **Tests unitaires** : Coverage complet

**Documentation** : `docs/TODO_PLUS_TARD.md`

---

## 📁 STRUCTURE DES FICHIERS

### Backend
```
rag juridique/
├── api/
│   ├── main.py                    # FastAPI app
│   ├── models.py                  # Pydantic models
│   ├── machine_actes.py           # Pilier 1
│   ├── super_chercheur.py         # Pilier 2
│   ├── audit_conformite.py        # Pilier 3
│   ├── synthese_strategie.py      # Pilier 4
│   ├── chatbot_avocat.py          # Pilier 5
│   └── routes/                    # Routers FastAPI
│       ├── machine_actes.py
│       ├── super_chercheur.py
│       ├── audit.py
│       ├── synthese.py
│       ├── chatbot.py
│       ├── templates.py           # Gestion templates PDF
│       └── downloads.py           # Téléchargements
├── config/
│   ├── settings.py                # Configuration centralisée
│   └── logging_config.py          # Loguru setup
├── rag/
│   └── vertex_search.py           # Client Vertex AI Search
├── prompts/
│   ├── prompts.py                 # TOUS les prompts centralisés
│   └── PROMPTS.md                 # Documentation prompts
├── utils/
│   ├── pdf_style_analyzer.py       # Analyse style PDF
│   └── pdf_template_manager.py    # Gestion templates
├── ingestion/
│   ├── create_test_dataset.py     # Dataset test
│   ├── ingestion_codes.py          # Ingestion PISTE (non fonctionnel)
│   └── ingestion_datagouv_simple.py # Alternative data.gouv.fr
├── demos/                         # Scripts de démonstration
├── docs/                           # Documentation complète
├── data/
│   ├── exports/                   # JSONL pour Vertex AI
│   └── test_pdfs/                 # PDFs de test
├── templates/
│   └── pdf_templates/             # Templates PDF stockés
├── .env                           # Variables d'environnement (GITIGNORE)
├── .env.example                   # Template .env
├── requirements.txt               # Dépendances Python
└── start_api.py                   # Script démarrage API
```

### Frontend
```
jurilabb/
├── components/
│   └── ai-tools/
│       ├── ActGenerator.tsx
│       ├── SuperChercheur.tsx
│       ├── ContractAuditor.tsx
│       ├── StrategicSynthesis.tsx
│       └── LegalChatbotEnhanced.tsx
├── pages/
│   └── AIToolsPage.tsx            # Page principale avec onglets
├── services/
│   └── legalRagService.ts        # Service API
├── App.tsx                        # Routes (modifié)
├── components/
│   └── Layout.tsx                 # Sidebar (modifié)
└── .env.local                     # VITE_LEGAL_RAG_API_URL
```

---

## 🔑 CONFIGURATION ENVIRONNEMENT

### Variables d'environnement (`.env`)
```bash
# Google Cloud Platform
GCP_PROJECT_ID=jurilab-481600
GCP_REGION=europe-west1
GCP_LOCATION=global
GCP_DATASTORE_ID=datastorerag_1766055384992
GCP_SEARCH_APP_ID=rag-jurilab_1766052930774
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Gemini API
GEMINI_API_KEY=your_api_key_here
GEMINI_PRO_MODEL=models/gemini-pro-latest
GEMINI_FLASH_MODEL=models/gemini-flash-latest

# Légifrance PISTE (non fonctionnel actuellement)
PISTE_CLIENT_ID=your_client_id
PISTE_CLIENT_SECRET=your_secret

# Hugging Face (alternative)
HF_TOKEN=your_token
HF_DATASET_NAME=antoine-jeannot/code-civil-fr

# MCP Légifrance (désactivé MVP)
MCP_SERVER_URL=http://localhost:8001
MCP_ENABLE=false

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/legal_rag.log
```

**Documentation** : `docs/ENV_CONFIG.md`

---

## 🧪 TESTS ET DÉMONSTRATIONS

### Scripts de démo
- `demos/demo_super_chercheur.py` : Test Pilier 2
- `demos/demo_chatbot.py` : Test Pilier 5
- `demos/demo_audit.py` : Test Pilier 3
- `demos/demo_synthese.py` : Test Pilier 4
- `demos/demo_machine_actes.py` : Test Pilier 1
- `demos/demo_pdf_analyzer.py` : Analyse style PDF

### Tests API
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **Health Check** : http://localhost:8000/health

### Tests Frontend
- **URL** : http://localhost:5173/ai-tools
- **Navigation** : Sidebar → "AI Tools" → Sélectionner outil

---

## 📚 DOCUMENTATION COMPLÈTE

### Architecture et Plan
- `docs/PLAN_COMPLET.md` : Plan 4 phases
- `docs/ARCHITECTURE_5_PILIERS.md` : Architecture détaillée
- `docs/API_REST.md` : Documentation API FastAPI

### Piliers individuels
- `docs/PILIER_1_MACHINE_ACTES.md` : Guide complet Pilier 1
- `docs/PILIER_2_SUPER_CHERCHEUR.md` : Guide complet Pilier 2
- `docs/PILIER_3_UTILISATION.md` : Guide utilisation Pilier 3
- `docs/PILIER_3_AMELIORATIONS.md` : Améliorations futures Pilier 3
- `docs/PILIER_5_CHATBOT.md` : Guide complet Pilier 5

### Configuration et Setup
- `docs/ENV_CONFIG.md` : Configuration variables d'environnement
- `docs/VERTEX_AI_SETUP.md` : Setup Vertex AI Search
- `docs/TEMPLATES_PDF.md` : Système templates PDF

### Intégration
- `INTEGRATION_FRONTEND_COMPLETE.md` : Guide intégration frontend
- `INTEGRATION_JURILABB_SPECIFIQUE.md` : Guide spécifique JuriLabb
- `AI_TOOLS_INTEGRATION.md` : Détails techniques intégration

### Problèmes et Corrections
- `docs/TODO_PLUS_TARD.md` : Backlog complet
- `CORRECTIONS_FINALES_ERREURS.md` : Corrections erreurs
- `CORRECTIONS_FINALES_UI.md` : Corrections UI
- `CORRECTION_422_500.md` : Corrections erreurs API
- `CORRECTION_TOFIXED.md` : Corrections frontend
- `CORRECTION_INTERFACES_API.md` : Alignement interfaces

### Recaps
- `PILIER_1_RECAP.md` : Récap développement Pilier 1
- `TEMPLATES_PDF_RECAP.md` : Récap système templates
- `PHASE_3_API_REST_RECAP.md` : Récap API REST
- `INTEGRATION_FRONTEND_COMPLETE.md` : Récap intégration

---

## 🚨 PROBLÈMES CONNUS ET LIMITATIONS

### 1. API Légifrance PISTE
- **Statut** : ❌ Non fonctionnel (erreurs 500 serveur)
- **Impact** : Ingestion complète Code Civil bloquée
- **Workaround** : Dataset test (10 articles) + alternatives (Hugging Face, data.gouv.fr)
- **Action** : En attente réponse support Légifrance

### 2. Filtres Vertex AI Search
- **Problème** : Ne supporte pas les champs imbriqués (`metadata.etat`)
- **Impact** : Filtres limités dans Super-Chercheur
- **Workaround** : Filtres simplifiés (code_id uniquement)
- **Solution future** : Restructurer métadonnées ou utiliser workaround

### 3. Vertex AI Gemini
- **Problème** : Modèles non accessibles via Vertex AI (projet GCP)
- **Impact** : Utilisation API Gemini directe (clé API séparée)
- **Workaround** : API directe fonctionne parfaitement
- **Note** : RAG reste via Vertex AI Search (inchangé)

### 4. PDF Scannés
- **Problème** : PyMuPDF ne peut pas extraire texte (images)
- **Impact** : Audit et Synthèse ne fonctionnent pas avec PDF scannés
- **Workaround** : Message d'erreur clair pour l'utilisateur
- **Solution future** : Intégrer OCR (pytesseract ou alternative)

### 5. Quota Gemini
- **Problème** : Gemini Pro a quota limité (2M tokens/min)
- **Impact** : Erreurs 429 possibles
- **Solution** : Utilisation Flash (10M tokens/min) pour génération d'actes
- **Note** : Pro gardé pour analyses complexes (Synthèse)

---

## 🎯 PROCHAINES ÉTAPES IMMÉDIATES

1. **Tester corrections 422/500** :
   - Redémarrer API
   - Tester Audit avec texte
   - Tester Synthèse avec texte
   - Vérifier logs backend

2. **Valider Machine à Actes** :
   - Tester téléchargement PDF
   - Corriger erreur `slice` si nécessaire

3. **Améliorer UI** :
   - Clarifier interface Super-Chercheur
   - Aligner design avec JuriLabb existant

4. **Documenter** :
   - Mettre à jour TODOs
   - Documenter problèmes résolus

---

## 💡 NOTES IMPORTANTES POUR LLM

### Architecture RAG
- **Vertex AI Search** : Fait la recherche sémantique et retourne les sources
- **Gemini** : Fait UNIQUEMENT la mise en forme élégante des sources
- **Pas de recherche dans Gemini** : Tout passe par Vertex AI Search

### Prompts centralisés
- **TOUS les prompts** sont dans `prompts/prompts.py`
- **Modification** : Changer dans ce fichier uniquement
- **Documentation** : `prompts/PROMPTS.md` (mirror markdown)

### Validation Pydantic
- **Modèles** : `api/models.py`
- **Format frontend** : `documents: [{content, title, date}]`
- **Format backend** : `documents_content: [string]`
- **Support** : Les deux formats sont acceptés

### Gestion d'erreur
- **Logs** : Loguru avec fichiers dans `logs/`
- **Traceback** : Toujours logger en cas d'erreur
- **Messages utilisateur** : Clairs et actionnables

### Tests
- **Backend** : Scripts dans `demos/`
- **Frontend** : Tester manuellement sur http://localhost:5173/ai-tools
- **API** : Swagger UI sur http://localhost:8000/docs

---

## 📞 CONTACTS ET RESSOURCES

### Documentation externe
- **Vertex AI Search** : https://cloud.google.com/generative-ai-app-builder
- **Gemini API** : https://ai.google.dev/docs
- **FastAPI** : https://fastapi.tiangolo.com
- **Légifrance FAQ** : https://www.legifrance.gouv.fr/contenu/menu/pied-de-page/foire-aux-questions-api

### Projets liés
- **JuriLabb** : https://github.com/albertbena/jurilabb
- **Theolex** : Analyse sémantique (intégration future)

---

**Dernière mise à jour :** 18 Décembre 2025  
**Version :** 1.0.0  
**Statut :** Backend opérationnel, Frontend intégré, Corrections en cours

---

## 🔄 COMMENT UTILISER CE DOCUMENT

Ce document est conçu pour être donné à un LLM (comme moi) pour comprendre **TOUT** le contexte du projet en une seule lecture.

**Structure** :
1. Vue d'ensemble → Comprendre l'objectif
2. Architecture → Comprendre la tech stack
3. Phases → Comprendre l'évolution
4. Piliers → Comprendre chaque outil
5. Problèmes → Comprendre les défis
6. Structure fichiers → Naviguer le code
7. Documentation → Trouver les guides

**Pour continuer le développement** :
1. Lire ce document en entier
2. Consulter `docs/TODO_PLUS_TARD.md` pour les tâches
3. Vérifier les documents de corrections pour les problèmes connus
4. Utiliser les scripts de démo pour tester
5. Consulter la documentation spécifique de chaque pilier

**Pour déboguer** :
1. Vérifier les logs backend (`logs/legal_rag.log`)
2. Tester via Swagger UI (http://localhost:8000/docs)
3. Vérifier les interfaces TypeScript vs backend
4. Consulter les documents de corrections

---

**FIN DU DOCUMENT DE CONTEXTE**

