# 📋 Plan Complet LEGAL-RAG FRANCE

**Date de création :** 18 Décembre 2025  
**Statut actuel :** Infrastructure RAG opérationnelle ✅  
**Prochaine étape :** Phase 1 - Développement des 5 piliers

---

## 🎯 Vue d'ensemble

Le projet LEGAL-RAG FRANCE sera développé en **4 phases progressives** :

1. **Phase 1 :** Backend Python - Les 5 piliers (2-3 jours)
2. **Phase 2 :** Ingestion complète des données (1-2 jours)
3. **Phase 3 :** API REST avec FastAPI (1 jour)
4. **Phase 4 :** Frontend + Intégration site web (2-3 jours)

**Durée totale estimée :** 6-9 jours pour un projet complet opérationnel

---

## 📊 Phase 1 : Backend - Les 5 piliers (2-3 jours)

### Objectif
Développer les APIs Python des 5 outils fonctionnels, testables indépendamment.

### Technologies
- Python 3.11+
- Google Vertex AI Search (RAG)
- Google Gemini 1.5 Pro & Flash
- Pydantic (validation)
- Loguru (logging)

### Les 5 piliers à développer

#### 🔹 Pilier 1 : Machine à Actes (~4h)
**Objectif :** Transformer un modèle d'acte + données client → acte personnalisé

**Fonctionnalités :**
- Upload d'un modèle d'acte (PDF, DOCX)
- Analyse du style et structure
- Injection des données client
- Génération avec conservation du style
- Export en format éditable

**Fichier :** `api/machine_actes.py`

**API principale :**
```python
def generate_act(
    template_path: str,
    client_data: dict,
    preserve_style: bool = True
) -> str:
    """Génère un acte personnalisé à partir d'un modèle"""
```

---

#### 🔹 Pilier 2 : Super-Chercheur de Jurisprudence (~2h)
**Objectif :** Recherche experte + analyse de probabilités judiciaires

**Fonctionnalités :**
- Recherche sémantique dans la jurisprudence
- Filtres avancés (juridiction, date, matière)
- Scoring de pertinence
- Analyse de tendances jurisprudentielles
- Probabilités de succès basées sur l'historique

**Fichier :** `api/super_chercheur.py`

**API principale :**
```python
def search_jurisprudence(
    query: str,
    filters: dict,
    analyze_trends: bool = True
) -> SearchResults:
    """Recherche experte dans la jurisprudence"""
```

---

#### 🔹 Pilier 3 : Audit & Conformité (~3h)
**Objectif :** Détecter anachronismes + vérification en temps réel

**Fonctionnalités :**
- Upload de contrat/document
- Détection de clauses obsolètes
- Vérification live via MCP Légifrance
- Comparaison avec textes en vigueur
- Génération de rapport d'audit avec recommandations

**Fichier :** `api/audit_conformite.py`

**API principale :**
```python
def audit_document(
    document_path: str,
    check_live: bool = True
) -> AuditReport:
    """Audite un document juridique pour conformité"""
```

---

#### 🔹 Pilier 4 : Synthèse & Aide Stratégique (~3h)
**Objectif :** Synthèse multi-documents → note stratégique

**Fonctionnalités :**
- Upload de plusieurs documents (pièces, jugements, courriers)
- Extraction des enjeux clés
- Timeline procédurale automatique
- Analyse des forces/faiblesses
- Recommandations stratégiques
- Génération de note de synthèse

**Fichier :** `api/synthese_strategie.py`

**API principale :**
```python
def synthesize_case(
    documents: list[str],
    generate_timeline: bool = True,
    strategic_analysis: bool = True
) -> CaseSynthesis:
    """Synthétise un dossier en note stratégique"""
```

---

#### 🔹 Pilier 5 : Chatbot Avocat (~3h)
**Objectif :** Interface conversationnelle unifiée (hub central)

**Fonctionnalités :**
- Chat en langage naturel
- Grounding avec RAG (citations sources)
- Routage intelligent vers les 4 autres outils
- Historique conversationnel
- Suggestions contextuelles

**Fichier :** `api/chatbot_avocat.py`

**API principale :**
```python
def chat(
    message: str,
    conversation_id: str,
    context: dict = None
) -> ChatResponse:
    """Répond en tant qu'assistant juridique"""
```

---

### Tests en Phase 1
**Avec 10 articles de test** → validation rapide de l'architecture

**Avantages :**
- ⚡ Tests ultra-rapides (< 5 secondes)
- 🐛 Bugs découverts tôt
- 🔄 Itération agile
- 📈 Architecture validée avant scaling

---

## 📊 Phase 2 : Ingestion complète (1-2 jours)

### Objectif
Enrichir la base de données Vertex AI avec l'ensemble du corpus juridique.

### Sources de données

#### 1. Codes juridiques (API PISTE)
- **Code Civil** (~8,000 articles)
- **Code Pénal** (~5,000 articles)
- **Code du Travail** (~10,000 articles)
- **Code de Commerce** (~3,000 articles)
- **Code de Procédure Civile** (~2,000 articles)

**Total :** ~28,000 articles de loi

**Script :** `ingestion/ingestion_codes.py` (déjà prêt)

#### 2. Jurisprudence (Hugging Face)
- **Dataset :** `antoinejeannot/decisions-justice`
- **Volume :** ~50,000 décisions de justice
- **Période :** 2000-2023
- **Juridictions :** Toutes cours françaises

**Script :** `ingestion/ingestion_jurisprudence.py` (à créer)

#### 3. Autres sources (optionnel)
- Doctrine juridique
- Circulaires et décrets
- Modèles d'actes

---

### Stratégie d'ingestion

**Ordre recommandé :**
1. Code Civil complet (priorité 1)
2. Jurisprudence (Hugging Face)
3. Autres codes juridiques
4. Sources complémentaires

**Checkpointing :** Sauvegarde tous les 500 articles (déjà implémenté)

**Monitoring :** Logs détaillés avec Loguru

---

### Re-tests après ingestion
- ✅ Tester les 5 piliers avec données complètes
- ✅ Vérifier les performances (temps de réponse)
- ✅ Ajuster les prompts si nécessaire (plus de contexte disponible)
- ✅ Valider la pertinence des résultats

---

## 🌐 Phase 3 : API REST avec FastAPI (1 jour)

### Objectif
Exposer les 5 piliers via une API REST pour l'intégration frontend.

### Architecture

```
api/
├── main.py                    # Application FastAPI principale
├── routers/
│   ├── super_chercheur.py     # Endpoints recherche
│   ├── chatbot.py             # Endpoints chat
│   ├── machine_actes.py       # Endpoints génération actes
│   ├── synthese.py            # Endpoints synthèse
│   └── audit.py               # Endpoints audit
├── models/
│   ├── requests.py            # Pydantic models (requêtes)
│   └── responses.py           # Pydantic models (réponses)
├── middleware/
│   ├── auth.py                # Authentification (JWT)
│   ├── cors.py                # CORS pour frontend
│   └── rate_limit.py          # Rate limiting
└── utils/
    ├── errors.py              # Gestion erreurs
    └── validation.py          # Validation inputs
```

---

### Endpoints principaux

#### 🔍 Super-Chercheur
```http
POST /api/search
Content-Type: application/json

{
  "query": "jurisprudence sur les contrats de travail",
  "filters": {
    "jurisdiction": "Cour de cassation",
    "date_min": "2020-01-01",
    "date_max": "2024-12-31"
  },
  "page_size": 10
}
```

**Réponse :**
```json
{
  "results": [
    {
      "id": "...",
      "title": "Cass. soc., 15 janv. 2023",
      "content": "...",
      "score": 0.95,
      "metadata": {...}
    }
  ],
  "total": 156,
  "trends": {
    "success_probability": 0.78,
    "similar_cases": 42
  }
}
```

---

#### 💬 Chatbot Avocat
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Quelles sont les conditions de validité d'un contrat ?",
  "conversation_id": "conv-123",
  "use_rag": true
}
```

**Réponse :**
```json
{
  "response": "Pour qu'un contrat soit valable, selon l'article 1128 du Code civil...",
  "sources": [
    {
      "type": "code",
      "reference": "Article 1128, Code civil",
      "text": "..."
    }
  ],
  "suggested_actions": [
    "Rechercher la jurisprudence sur ce sujet",
    "Générer un modèle de contrat"
  ]
}
```

---

#### 📄 Machine à Actes
```http
POST /api/generate-act
Content-Type: multipart/form-data

template: [fichier DOCX]
client_data: {
  "nom": "Dupont",
  "prenom": "Jean",
  "adresse": "..."
}
preserve_style: true
```

**Réponse :**
```json
{
  "generated_act": "base64_encoded_document",
  "format": "docx",
  "preview": "Contrat de vente entre M. Jean Dupont..."
}
```

---

#### 📊 Synthèse Stratégique
```http
POST /api/synthesize
Content-Type: multipart/form-data

documents: [fichiers PDF/DOCX]
generate_timeline: true
strategic_analysis: true
```

**Réponse :**
```json
{
  "synthesis": {
    "summary": "...",
    "key_issues": ["...", "..."],
    "timeline": [...],
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "recommendations": ["...", "..."]
  }
}
```

---

#### ✅ Audit & Conformité
```http
POST /api/audit
Content-Type: multipart/form-data

document: [fichier PDF/DOCX]
check_live: true
```

**Réponse :**
```json
{
  "audit_report": {
    "status": "issues_found",
    "obsolete_clauses": [
      {
        "clause": "...",
        "reason": "Article abrogé en 2022",
        "suggestion": "..."
      }
    ],
    "compliance_score": 0.75,
    "recommendations": ["..."]
  }
}
```

---

### Technologies FastAPI

**Stack :**
```python
# requirements_api.txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
python-multipart>=0.0.6  # Upload fichiers
python-jose[cryptography]  # JWT
passlib[bcrypt]  # Hashing passwords
slowapi  # Rate limiting
```

**Commande de lancement :**
```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Sécurité

**Authentification JWT :**
```python
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/api/search")
async def search(
    request: SearchRequest,
    token: str = Depends(security)
):
    user = verify_token(token)
    # ...
```

**CORS :**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://votre-site.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Rate limiting :**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/search")
@limiter.limit("10/minute")
async def search(request: Request, ...):
    # ...
```

---

## 🎨 Phase 4 : Frontend + Intégration site (2-3 jours)

### Architecture d'intégration

**Deux approches possibles :**

#### Option A : Sidebar avec les 5 outils
```
┌─────────────────────────────────────┐
│  Ton site existant                  │
│  ┌──────────────┬─────────────────┐ │
│  │   Sidebar    │  Contenu        │ │
│  │              │  principal      │ │
│  │ 🔍 Chercheur │                 │ │
│  │ 💬 Chatbot   │                 │ │
│  │ 📄 Actes     │  [Zone de       │ │
│  │ 📊 Synthèse  │   travail]      │ │
│  │ ✅ Audit     │                 │ │
│  └──────────────┴─────────────────┘ │
└─────────────────────────────────────┘
```

**Avantages :**
- ✅ Toujours accessible
- ✅ Navigation fluide entre outils
- ✅ Contexte conservé

#### Option B : Widgets/Composants réutilisables
```javascript
// Dans ton site React/Vue/etc.
import { SearchWidget, ChatWidget, ActGenerator } from '@legal-rag/components'

<SearchWidget apiUrl="http://localhost:8000/api/search" />
<ChatWidget apiUrl="http://localhost:8000/api/chat" />
```

**Avantages :**
- ✅ Flexibilité maximale
- ✅ Intégration partielle possible
- ✅ Réutilisable sur plusieurs pages

---

### Stack technique Frontend

#### Si React/Next.js (recommandé)

**Structure :**
```
frontend/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── tools/
│   │   ├── SuperChercheur/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── Filters.tsx
│   │   ├── ChatbotAvocat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── SourceCard.tsx
│   │   ├── MachineActes/
│   │   │   ├── TemplateUpload.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   └── ActPreview.tsx
│   │   ├── Synthese/
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── StrategicNote.tsx
│   │   └── Audit/
│   │       ├── DocumentUpload.tsx
│   │       ├── AuditReport.tsx
│   │       └── RecommendationCard.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── hooks/
│   ├── useSearch.ts
│   ├── useChat.ts
│   └── useApi.ts
├── lib/
│   └── api-client.ts
└── pages/
    └── index.tsx
```

**Exemple de composant (React) :**
```typescript
// components/layout/Sidebar.tsx
import { useState } from 'react'
import { SuperChercheur } from '@/components/tools/SuperChercheur'
import { ChatbotAvocat } from '@/components/tools/ChatbotAvocat'
import { MachineActes } from '@/components/tools/MachineActes'
import { Synthese } from '@/components/tools/Synthese'
import { Audit } from '@/components/tools/Audit'

type Tool = 'search' | 'chat' | 'acts' | 'synthesis' | 'audit'

export const Sidebar = () => {
  const [activeTool, setActiveTool] = useState<Tool>('chat')
  
  const tools = [
    { id: 'search', icon: '🔍', label: 'Chercheur' },
    { id: 'chat', icon: '💬', label: 'Chatbot' },
    { id: 'acts', icon: '📄', label: 'Actes' },
    { id: 'synthesis', icon: '📊', label: 'Synthèse' },
    { id: 'audit', icon: '✅', label: 'Audit' },
  ]
  
  const renderTool = () => {
    switch (activeTool) {
      case 'search': return <SuperChercheur />
      case 'chat': return <ChatbotAvocat />
      case 'acts': return <MachineActes />
      case 'synthesis': return <Synthese />
      case 'audit': return <Audit />
    }
  }
  
  return (
    <div className="flex h-screen">
      <nav className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-4">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as Tool)}
            className={`p-3 rounded-lg transition ${
              activeTool === tool.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            title={tool.label}
          >
            <span className="text-2xl">{tool.icon}</span>
          </button>
        ))}
      </nav>
      
      <div className="flex-1 overflow-y-auto bg-white">
        {renderTool()}
      </div>
    </div>
  )
}
```

---

#### Si Vue.js

**Composant principal (Vue 3) :**
```vue
<!-- components/LegalToolsSidebar.vue -->
<template>
  <div class="legal-tools-sidebar">
    <nav class="tool-nav">
      <button
        v-for="tool in tools"
        :key="tool.id"
        @click="currentTool = tool.id"
        :class="{ active: currentTool === tool.id }"
      >
        <span>{{ tool.icon }}</span>
        <span>{{ tool.label }}</span>
      </button>
    </nav>
    
    <div class="tool-content">
      <component :is="currentComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SuperChercheur from './tools/SuperChercheur.vue'
import ChatbotAvocat from './tools/ChatbotAvocat.vue'
import MachineActes from './tools/MachineActes.vue'
import Synthese from './tools/Synthese.vue'
import Audit from './tools/Audit.vue'

type Tool = 'search' | 'chat' | 'acts' | 'synthesis' | 'audit'

const currentTool = ref<Tool>('chat')

const tools = [
  { id: 'search', icon: '🔍', label: 'Chercheur', component: SuperChercheur },
  { id: 'chat', icon: '💬', label: 'Chatbot', component: ChatbotAvocat },
  { id: 'acts', icon: '📄', label: 'Actes', component: MachineActes },
  { id: 'synthesis', icon: '📊', label: 'Synthèse', component: Synthese },
  { id: 'audit', icon: '✅', label: 'Audit', component: Audit },
]

const currentComponent = computed(() => {
  return tools.find(t => t.id === currentTool.value)?.component
})
</script>
```

---

### Intégration avec l'API

**Client API (TypeScript) :**
```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class LegalRagClient {
  private token: string | null = null
  
  async search(query: string, filters: any = {}) {
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ query, filters })
    })
    return response.json()
  }
  
  async chat(message: string, conversationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ message, conversation_id: conversationId })
    })
    return response.json()
  }
  
  async generateAct(template: File, clientData: any) {
    const formData = new FormData()
    formData.append('template', template)
    formData.append('client_data', JSON.stringify(clientData))
    
    const response = await fetch(`${API_BASE_URL}/api/generate-act`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    })
    return response.json()
  }
  
  // ... autres méthodes
}

export const apiClient = new LegalRagClient()
```

**Hook React personnalisé :**
```typescript
// hooks/useSearch.ts
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

export const useSearch = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const search = async (query: string, filters: any = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await apiClient.search(query, filters)
      setResults(data.results)
      return data
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return { results, loading, error, search }
}
```

---

### UI/UX Design moderne

**Design system recommandé :**
- **Tailwind CSS** (utilitaire, rapide, moderne)
- **shadcn/ui** (composants React élégants, accessibles)
- **Framer Motion** (animations fluides)
- **Lucide Icons** (icônes modernes)

**Palette de couleurs suggérée :**
```css
:root {
  --primary: #1e40af;        /* Bleu juridique */
  --secondary: #0f172a;      /* Gris foncé */
  --accent: #3b82f6;         /* Bleu clair */
  --success: #10b981;        /* Vert */
  --warning: #f59e0b;        /* Orange */
  --error: #ef4444;          /* Rouge */
  --background: #f8fafc;     /* Gris très clair */
  --card: #ffffff;           /* Blanc */
}
```

**Exemple de composant stylisé :**
```tsx
// components/tools/SuperChercheur/ResultCard.tsx
import { motion } from 'framer-motion'
import { FileText, Calendar, Scale } from 'lucide-react'

interface ResultCardProps {
  result: SearchResult
}

export const ResultCard = ({ result }: ResultCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {result.title}
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          Score: {(result.score * 100).toFixed(0)}%
        </span>
      </div>
      
      <p className="text-gray-700 mb-4 line-clamp-3">
        {result.content}
      </p>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>{result.metadata.date}</span>
        </div>
        <div className="flex items-center gap-1">
          <Scale className="w-4 h-4" />
          <span>{result.metadata.jurisdiction}</span>
        </div>
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4" />
          <span>{result.metadata.matter}</span>
        </div>
      </div>
      
      <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
        Voir les détails
      </button>
    </motion.div>
  )
}
```

---

### Exemple d'UI complète - Chatbot

```tsx
// components/tools/ChatbotAvocat/ChatWindow.tsx
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { SourceCard } from './SourceCard'
import { useChat } from '@/hooks/useChat'

export const ChatWindow = () => {
  const [input, setInput] = useState('')
  const { messages, loading, sendMessage } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    await sendMessage(input)
    setInput('')
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <h2 className="text-2xl font-bold">💬 Chatbot Avocat</h2>
        <p className="text-blue-100 mt-1">
          Posez vos questions juridiques en langage naturel
        </p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg mb-4">👋 Bonjour ! Comment puis-je vous aider ?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition">
                Qu'est-ce qu'un contrat ?
              </button>
              <button className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition">
                Conditions de validité d'un bail
              </button>
              <button className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition">
                Délais de prescription
              </button>
            </div>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <MessageBubble key={idx} message={message} />
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>L'assistant réfléchit...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question juridique..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

### Déploiement

#### Backend (FastAPI)
**Options :**
- **Google Cloud Run** (serverless, auto-scaling)
- **AWS Lambda** + API Gateway
- **Docker** + VM traditionnelle

**Exemple Cloud Run :**
```bash
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

```bash
# Déploiement
gcloud run deploy legal-rag-api \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

---

#### Frontend
**Options :**
- **Vercel** (recommandé pour Next.js)
- **Netlify** (pour tout framework)
- **GitHub Pages** (si statique)
- **Intégration directe** dans ton site existant

**Exemple Vercel :**
```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod
```

---

## 📅 Timeline détaillée

| Phase | Jour | Tâche | Durée | Statut |
|-------|------|-------|-------|--------|
| **Phase 1** | J1 | Pilier 2 : Super-Chercheur | 2h | ⏳ À faire |
| | J1 | Pilier 5 : Chatbot Avocat | 3h | ⏳ À faire |
| | J2 | Pilier 1 : Machine à Actes | 4h | ⏳ À faire |
| | J2-J3 | Pilier 4 : Synthèse | 3h | ⏳ À faire |
| | J3 | Pilier 3 : Audit | 3h | ⏳ À faire |
| **Phase 2** | J4 | Ingestion Code Civil complet | 4h | ⏳ À faire |
| | J4-J5 | Ingestion Jurisprudence HF | 6h | ⏳ À faire |
| | J5 | Autres codes juridiques | 4h | ⏳ À faire |
| **Phase 3** | J6 | API FastAPI complète | 8h | ⏳ À faire |
| **Phase 4** | J7-J8 | Développement Frontend | 12h | ⏳ À faire |
| | J9 | Intégration + Tests | 4h | ⏳ À faire |
| | J9 | Déploiement | 2h | ⏳ À faire |

**Total : 6-9 jours de développement intensif**

---

## 🎯 Prochaine action immédiate

**Développer le Pilier 2 : Super-Chercheur** (~2h)

**Pourquoi commencer par celui-ci ?**
- ✅ Le plus simple (RAG déjà opérationnel)
- ✅ Validation rapide de l'architecture
- ✅ Tests ultra-rapides avec 10 articles
- ✅ Boost de motivation (résultat visible immédiatement)

**Fichier à créer :** `api/super_chercheur.py`

---

## ⚠️ Limitations connues & Problèmes à résoudre

### 🔴 Filtres Vertex AI (Priorité HAUTE)

**Problème :** Les filtres sur champs nested (`metadata.*`) ne fonctionnent pas dans Vertex AI Search.

**Impact :** Impossibilité de filtrer par juridiction, matière, date, état, etc. dans le Pilier 2 (Super-Chercheur).

**Solutions envisagées :**
1. **Option A :** Investiguer syntaxe correcte Vertex AI
2. **Option B :** Restructurer le format JSONL (champs au niveau racine)
3. **Option C :** Post-filtrage côté application (temporaire)
4. **Option D :** Combinaison des 3 approches (recommandé)

**Timeline :** Phase 2 (après développement des 5 piliers)

**📋 Voir détails complets :** `docs/TODO_PLUS_TARD.md`

---

### 🟡 Autres limitations (Priorité MOYENNE/BASSE)

- Estimation de probabilité basique (à améliorer avec ML)
- Extraction d'arguments simple (à améliorer avec NER/LLM)
- API PISTE encore en erreur 500 (en attente support)
- Pas de cache de résultats (à implémenter en Phase 4)
- Pas de pagination (à implémenter en Phase 4)

**📋 Liste complète :** `docs/TODO_PLUS_TARD.md`

---

## 📚 Ressources nécessaires

### Backend
- ✅ Python 3.11+ (déjà installé)
- ✅ Vertex AI Search (déjà configuré)
- ✅ Google Gemini API (clés déjà configurées)
- ✅ Environnement virtuel (déjà créé)

### Frontend (Phase 4)
- 🔲 Node.js 18+ (à installer si pas déjà)
- 🔲 Framework choisi (React/Vue/Next.js)
- 🔲 Tailwind CSS
- 🔲 Bibliothèque de composants (shadcn/ui)

### Déploiement
- ✅ Compte GCP (déjà configuré)
- 🔲 Compte Vercel/Netlify (si frontend séparé)
- 🔲 Nom de domaine (optionnel)

---

## ❓ Questions à clarifier avant Phase 4

1. **As-tu déjà un site web existant ?**
   - Si OUI : Quel framework ? (React, Vue, Angular, vanilla JS, etc.)
   - Si NON : On créera un site complet (Next.js recommandé)

2. **Préférence d'intégration ?**
   - Option A : Sidebar permanente avec les 5 outils
   - Option B : Widgets indépendants intégrables partout
   - Option C : Site dédié séparé

3. **Hébergement prévu ?**
   - Google Cloud (Run, App Engine)
   - AWS (Lambda, EC2)
   - Autre (Vercel, Netlify, VPS)

4. **Authentification nécessaire ?**
   - Publique (accès libre)
   - Authentifiée (login/password)
   - Freemium (gratuit + payant)

---

## 🚀 Statut actuel

**✅ Accompli :**
- Infrastructure RAG opérationnelle
- Vertex AI Search configuré
- 10 articles de test ingérés
- Module Python `vertex_search.py` fonctionnel
- Documentation complète

**⏳ En cours :**
- Rien (attente de lancement Phase 1)

**📋 À faire :**
- Phase 1 : Développement des 5 piliers
- Phase 2 : Ingestion complète
- Phase 3 : API REST
- Phase 4 : Frontend + Intégration

---

**Date de mise à jour :** 18 Décembre 2025  
**Prochaine session :** Développement Pilier 2 (Super-Chercheur)  
**Durée estimée prochaine session :** 2h

