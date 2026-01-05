# 🏛️ LEGAL-RAG FRANCE

**Plateforme d'Ingénierie Juridique Intelligente** basée sur Gemini 1.5, Vertex AI Search et l'analyse sémantique Theolex.

---

## 📋 Vue d'Ensemble

Cette application révolutionnaire pour le droit français intègre quatre piliers fonctionnels :

1. **🤖 Machine à Actes** : Génération automatique d'actes juridiques personnalisés
2. **🔍 Super-Chercheur** : Recherche sémantique avancée dans la jurisprudence
3. **✅ Audit & Conformité** : Détection d'anachronismes légaux et vérification live
4. **📊 Synthèse Stratégique** : Résumés multi-dossiers et notes justificatives

---

## 🏗️ Architecture

```
rag-juridique/
├── config/              # Configuration centralisée
├── ingestion/           # Capture des données (Légifrance, HF)
├── processing/          # Nettoyage et enrichissement (Theolex)
├── rag/                 # Connexion Vertex AI Search
├── api/                 # Logique métier (4 piliers)
├── mcp/                 # Protocole MCP (vérifications temps réel)
├── data/                # Données locales (non versionnées)
├── tests/               # Tests unitaires
└── docs/                # Documentation technique
```

---

## 🚀 Installation

### 1. Cloner le Projet

```bash
git clone <url-du-repo>
cd rag-juridique
```

### 2. Créer l'Environnement Virtuel

```bash
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate
```

### 3. Installer les Dépendances

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configuration

Copier le fichier template et renseigner vos identifiants :

```bash
cp .env.example .env
# Éditer .env avec vos clés API
```

**Variables critiques à configurer :**
- `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` : API Légifrance
- `GCP_PROJECT_ID` / `GOOGLE_APPLICATION_CREDENTIALS` : Google Cloud
- `HF_TOKEN` : Hugging Face

---

## 📚 Stack Technique

- **LLM** : Gemini 1.5 Pro & Flash
- **RAG** : Google Vertex AI Search (Dynamic Retrieval)
- **Sources** :
  - Lois/Codes : API PISTE (Légifrance)
  - Jurisprudence : Dataset Antoine Jeannot (2M+ arrêts)
- **NLP Juridique** : Theolex (legal_doc_processing)
- **Temps Réel** : MCP Server Légifrance

---

## 🔧 Utilisation (En Développement)

### Ingestion du Code Civil

```bash
python ingestion/ingestion_codes.py
```

*(Les autres modules seront documentés au fur et à mesure)*

---

## 📝 Feuille de Route

- [x] Initialisation de l'architecture
- [ ] Ingestion Code Civil (avec checkpointing)
- [ ] Ingestion Jurisprudence (Hugging Face)
- [ ] Pipeline de traitement Theolex
- [ ] Configuration Vertex AI Search
- [ ] API Machine à Actes
- [ ] API Super-Chercheur
- [ ] Audit & Conformité
- [ ] Intégration MCP

---

## 📄 Licence

*(À définir)*

---

## 👨‍💻 Auteur

Développé avec ❤️ pour révolutionner l'ingénierie juridique française.

