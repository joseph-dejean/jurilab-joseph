

# 🚀 API REST - LEGAL-RAG FRANCE

## Vue d'ensemble

L'API REST expose les **5 piliers** de la plateforme d'ingénierie juridique via des endpoints HTTP sécurisés.

**Base URL** : `http://localhost:8000`  
**Documentation** : `http://localhost:8000/docs` (Swagger)  
**ReDoc** : `http://localhost:8000/redoc`

---

## 🎯 Endpoints disponibles

### 🏠 Root & Health

```
GET  /               # Page d'accueil avec liens
GET  /health         # État de santé de l'API
```

---

## 📝 Pilier 1 : Machine à Actes

**Base** : `/api/v1/machine-actes`

### Générer un acte

```http
POST /api/v1/machine-actes/generate
Content-Type: application/json

{
  "act_type": "contract_sale",
  "template_content": "CONTRAT DE VENTE\n\nEntre...",
  "client_data": "Vendeur: Jean DUPONT...",
  "output_format": "text"
}
```

### Générer depuis un fichier

```http
POST /api/v1/machine-actes/generate-from-file
Content-Type: multipart/form-data

act_type: contract_sale
template_file: <fichier PDF/DOCX>
client_data: Vendeur: Jean DUPONT...
output_format: pdf
```

### Lister les types d'actes

```http
GET /api/v1/machine-actes/types
```

**Réponse** :
```json
{
  "types": {
    "contract_sale": "Contrat de vente",
    "contract_work": "Contrat de travail",
    ...
  },
  "count": 14
}
```

---

## 🔍 Pilier 2 : Super-Chercheur

**Base** : `/api/v1/search`

### Rechercher de la jurisprudence

```http
POST /api/v1/search
Content-Type: application/json

{
  "query": "responsabilité contractuelle délais",
  "jurisdiction": "civil",
  "legal_matter": "contract",
  "max_results": 10
}
```

**Réponse** :
```json
{
  "query": "responsabilité contractuelle délais",
  "results": [
    {
      "id": "LEGIARTI001",
      "title": "Article 1231-1",
      "content": "...",
      "score": 0.95,
      "metadata": {...}
    }
  ],
  "total_results": 42,
  "trends": {...},
  "probabilities": {...}
}
```

---

## ⚖️ Pilier 3 : Audit et Conformité

**Base** : `/api/v1/audit`

### Auditer un contrat (texte)

```http
POST /api/v1/audit
Content-Type: application/json

{
  "contract_text": "CONTRAT DE VENTE...",
  "contract_date": "2020-01-15",
  "deep_analysis": true
}
```

### Auditer depuis un fichier

```http
POST /api/v1/audit/from-file
Content-Type: multipart/form-data

contract_file: <fichier PDF/DOCX>
contract_date: 2020-01-15
deep_analysis: true
```

**Réponse** :
```json
{
  "contract_date": "2020-01-15",
  "issues": [
    {
      "severity": "warning",
      "type": "anachronism",
      "message": "Article 1101 modifié en 2016",
      "article_reference": "article 1101"
    }
  ],
  "conformity_score": 0.85,
  "recommendations": "..."
}
```

---

## 📊 Pilier 4 : Synthèse et Stratégie

**Base** : `/api/v1/synthese`

### Générer une synthèse

```http
POST /api/v1/synthese
Content-Type: application/json

{
  "synthesis_type": "strategic_note",
  "documents": [
    {"title": "Procédure", "content": "..."},
    {"title": "Conclusions", "content": "..."}
  ],
  "context": "Litige commercial",
  "output_format": "text"
}
```

### Synthèse depuis fichiers

```http
POST /api/v1/synthese/from-files
Content-Type: multipart/form-data

synthesis_type: strategic_note
context: Litige commercial
output_format: pdf
files: <fichier 1>
files: <fichier 2>
...
```

### Lister les types de synthèse

```http
GET /api/v1/synthese/types
```

**Réponse** :
```json
{
  "types": {
    "strategic_note": "Note stratégique",
    "case_summary": "Résumé de dossier",
    "client_report": "Rapport client",
    "trend_analysis": "Analyse de tendances",
    "procedural_timeline": "Chronologie procédurale"
  }
}
```

---

## 💬 Pilier 5 : Chatbot Avocat

**Base** : `/api/v1/chat`

### Envoyer un message

```http
POST /api/v1/chat
Content-Type: application/json

{
  "message": "Quelles sont les conditions de validité d'un contrat?",
  "conversation_id": "conv_123",
  "use_rag": true
}
```

**Réponse** :
```json
{
  "response": "Les conditions de validité d'un contrat sont...",
  "conversation_id": "conv_123",
  "sources": [
    {
      "title": "Article 1128",
      "content": "...",
      "score": 0.92
    }
  ],
  "confidence": 0.95
}
```

### Récupérer l'historique

```http
GET /api/v1/chat/conversation/{conversation_id}
```

### Effacer une conversation

```http
DELETE /api/v1/chat/conversation/{conversation_id}
```

---

## 🎨 Templates PDF

**Base** : `/api/v1/templates`

### Lister les templates

```http
GET /api/v1/templates
```

### Récupérer un template

```http
GET /api/v1/templates/{template_name}
```

### Analyser et créer un template

```http
POST /api/v1/templates/analyze
Content-Type: multipart/form-data

pdf_file: <fichier PDF>
template_name: cabinet_dupont
```

**Réponse** :
```json
{
  "message": "Template created successfully",
  "template_name": "cabinet_dupont",
  "config": {
    "template_name": "Cabinet Dupont",
    "header": {...},
    "footer": {...},
    "styles": {...}
  }
}
```

### Supprimer un template

```http
DELETE /api/v1/templates/{template_name}
```

---

## ⬇️ Téléchargements

**Base** : `/api/v1/download`

### Stocker un document

```http
POST /api/v1/download/store
Content-Type: application/json

{
  "content": "Contenu du document...",
  "filename": "contrat_vente.pdf",
  "content_type": "application/pdf"
}
```

**Réponse** :
```json
{
  "document_id": "abc-123-def",
  "download_url": "/api/v1/download/abc-123-def",
  "expires_at": "2025-12-19T16:00:00"
}
```

### Télécharger un document

```http
GET /api/v1/download/{document_id}
```

**Réponse** : Fichier à télécharger

### Supprimer un document

```http
DELETE /api/v1/download/{document_id}
```

### Nettoyer les documents expirés

```http
GET /api/v1/download/cleanup/expired
```

---

## 🔐 Sécurité

### CORS

L'API est configurée avec CORS pour accepter les requêtes depuis n'importe quelle origine en développement.

**En production**, restreindre les origines autorisées dans `api/main.py` :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://votre-frontend.com"],  # ← Restreindre
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

### Authentification (à implémenter)

**Recommandations pour la production** :
- ✅ JWT (JSON Web Tokens)
- ✅ OAuth 2.0
- ✅ Rate limiting
- ✅ HTTPS obligatoire

---

## 📊 Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Requête invalide |
| 404 | Ressource non trouvée |
| 410 | Ressource expirée |
| 500 | Erreur serveur |
| 503 | Service indisponible |

---

## 🧪 Exemples d'utilisation

### Python avec `requests`

```python
import requests

# Générer un acte
response = requests.post(
    "http://localhost:8000/api/v1/machine-actes/generate",
    json={
        "act_type": "contract_sale",
        "template_content": "CONTRAT DE VENTE...",
        "client_data": "Vendeur: Jean...",
        "output_format": "text"
    }
)

result = response.json()
print(result["generated_act"])
```

### cURL

```bash
# Recherche de jurisprudence
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "responsabilité contractuelle",
    "max_results": 5
  }'
```

### JavaScript (fetch)

```javascript
// Chatbot
const response = await fetch('http://localhost:8000/api/v1/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: "Quelles sont les conditions d'un contrat?",
    conversation_id: "conv_123",
    use_rag: true
  })
});

const data = await response.json();
console.log(data.response);
```

---

## 🚀 Démarrage

### 1. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 2. Configurer l'environnement

Créer un fichier `.env` :

```env
GEMINI_API_KEY=your_api_key
GCP_PROJECT_ID=your_project_id
GCP_DATASTORE_ID=your_datastore_id
GCP_SEARCH_APP_ID=your_search_app_id
```

### 3. Lancer l'API

```bash
python start_api.py
```

L'API sera disponible sur **http://localhost:8000**

### 4. Accéder à la documentation

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

---

## 🛠️ Développement

### Structure

```
api/
├── main.py                  # Point d'entrée FastAPI
├── routes/
│   ├── machine_actes.py     # Pilier 1
│   ├── super_chercheur.py   # Pilier 2
│   ├── audit.py             # Pilier 3
│   ├── synthese.py          # Pilier 4
│   ├── chatbot.py           # Pilier 5
│   ├── templates.py         # Templates PDF
│   └── downloads.py         # Téléchargements
├── models.py                # Modèles Pydantic
├── machine_actes.py         # Services Pilier 1
├── super_chercheur.py       # Services Pilier 2
├── audit_conformite.py      # Services Pilier 3
├── synthese_strategie.py    # Services Pilier 4
└── chatbot_avocat.py        # Services Pilier 5
```

### Mode développement

```bash
# Avec rechargement automatique
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Tests

```bash
# Tester un endpoint
curl http://localhost:8000/health
```

---

## 📚 Ressources

- **FastAPI Documentation** : https://fastapi.tiangolo.com/
- **Swagger** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **Code source** : `api/`

---

## 🎉 Conclusion

L'API REST expose tous les piliers de LEGAL-RAG FRANCE de manière moderne, documentée et sécurisée.

**Prochaines étapes** :
1. Développement du frontend (React/Vue.js)
2. Ajout de l'authentification
3. Déploiement en production
4. Monitoring et logs

---

**Version** : 1.0.0  
**Date** : 18 décembre 2025  
**Statut** : ✅ Opérationnel

