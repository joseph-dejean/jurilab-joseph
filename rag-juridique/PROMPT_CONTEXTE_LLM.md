# 🤖 PROMPT CONTEXTE POUR LLM

**Utilisez ce prompt pour donner le contexte complet à un autre LLM**

---

```
Tu es un assistant IA qui va continuer le développement du projet LEGAL-RAG FRANCE.

CONTEXTE COMPLET :

# PROJET
Plateforme d'ingénierie juridique française avec 5 outils IA :
1. Machine à Actes : Génération PDF personnalisés
2. Super-Chercheur : Recherche sémantique jurisprudence
3. Audit et Conformité : Détection anachronismes
4. Synthèse et Stratégie : Synthèse dossiers procéduraux
5. Chatbot Avocat : Assistant conversationnel avec RAG

# ARCHITECTURE
- Backend : Python 3.11+ + FastAPI (port 8000)
- LLM : Gemini 1.5 Pro/Flash (API directe avec clé)
- RAG : Vertex AI Search (GCP project jurilab-481600)
- Frontend : React + TypeScript (JuriLabb, branche feature/integration-5-ai-tools)
- Structure : api/, rag/, config/, prompts/, utils/

# PROBLÈMES RENCONTRÉS
1. API Légifrance PISTE : Erreurs 500 (non résolu, workaround dataset test)
2. Vertex AI Gemini : Modèles inaccessibles → Utilisation API directe
3. Filtres Vertex AI : Ne supporte pas metadata.etat (workaround simplifié)
4. PDF scannés : Extraction impossible (OCR = TODO futur)

# PROBLÈMES ACTUELS FRONTEND
1. Machine à Actes : Erreur slice() sur téléchargement PDF
2. Super-Chercheur : Interface peu claire
3. Audit : Erreur 422 (validation FastAPI) + 500 (gestion erreur)
4. Synthèse : Erreur 500 (gestion erreur Gemini)
5. Chatbot : OK mais améliorations UI possibles

# CORRECTIONS RÉCENTES
- Passage Machine à Actes : Pro → Flash (éviter 429)
- Correction doublon TrendAnalysis (Super-Chercheur)
- Validation explicite Audit/Synthèse (422/500)
- Logs débogage améliorés
- Frontend : Correction toFixed(), slice(), interfaces TypeScript
- Design professionnel (pas d'emojis, lucide-react)

# FICHIERS IMPORTANTS
- api/models.py : Tous les modèles Pydantic
- prompts/prompts.py : TOUS les prompts centralisés
- docs/TODO_PLUS_TARD.md : Backlog complet
- CONTEXTE_COMPLET_PROJET.md : Documentation exhaustive (lire en entier)

# COMMANDES UTILES
Démarrer API : cd "C:\Users\sofia\Desktop\perso\rag juridique" && $env:PYTHONPATH = (Get-Location).Path && .\venv\Scripts\python.exe start_api.py
Frontend : cd "C:\Users\sofia\Desktop\perso\hackaton google\jurilabb" && npm run dev
Swagger : http://localhost:8000/docs
Frontend : http://localhost:5173/ai-tools

# RÈGLES IMPORTANTES
- TOUS les prompts sont dans prompts/prompts.py (NE PAS modifier ailleurs)
- Vertex AI Search fait la recherche, Gemini fait la mise en forme
- Support format frontend (documents: [{content, title, date}]) ET backend (documents_content: [string])
- Toujours logger les erreurs avec traceback
- Messages utilisateur clairs et actionnables

# PROCHAINES ÉTAPES
1. Tester corrections 422/500 (redémarrer API, tester Audit/Synthèse)
2. Corriger téléchargement PDF Machine à Actes
3. Améliorer UI Super-Chercheur
4. Valider tous les outils avec saisie texte

# DOCUMENTATION COMPLÈTE
Lire CONTEXTE_COMPLET_PROJET.md pour TOUS les détails (architecture, piliers, problèmes, structure fichiers, etc.)

---

MAINTENANT : Continue le développement en résolvant les problèmes actuels.
```

---

**Utilisation** : Copiez-collez ce prompt dans votre conversation avec un autre LLM pour lui donner tout le contexte nécessaire.

