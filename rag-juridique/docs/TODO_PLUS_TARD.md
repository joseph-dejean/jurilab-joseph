# 📋 À faire plus tard (Backlog)

**Fichier de suivi des fonctionnalités et problèmes à résoudre ultérieurement**

---

## 🔴 Priorité HAUTE

### 1. ✅ Configuration Gemini API (Pilier 5 - Chatbot) - RÉSOLU

**Statut : RÉSOLU LE 18 DÉCEMBRE 2025** ✅

**Problème initial :**
L'API Gemini renvoyait une erreur 403 "ACCESS_TOKEN_SCOPE_INSUFFICIENT" lors de la génération de contenu via Vertex AI Gemini.

**Solution implémentée :**
Utilisation de l'**API Gemini directe** avec clé API (obtenue via Google AI Studio) au lieu de Vertex AI Gemini.

**Configuration actuelle :**
- Modèles utilisés : `models/gemini-flash-latest` (rapide) et `models/gemini-pro-latest` (puissant)
- Authentification : `GEMINI_API_KEY` dans `.env`
- RAG : Vertex AI Search (inchangé)
- Génération : API Gemini directe

**Résultats :**
- ✅ Génération de réponses juridiques de qualité (confiance 95%)
- ✅ Citations précises des sources du Code Civil
- ✅ Historique de conversation fonctionnel
- ✅ Suggestions intelligentes

**Note importante :** L'API Gemini directe utilise EXACTEMENT le même RAG (Vertex AI Search).
- **Gemini fait UNIQUEMENT :** La mise en texte élégante des sources récupérées par le RAG
- **Gemini ne fait PAS :** La recherche (c'est Vertex AI Search qui s'en charge)

**Migration future possible (Phase 4 - Optionnel) :**

Si nécessaire, migration vers **Vertex AI Gemini** pour unifier l'écosystème :

**Avantages potentiels :**
- Facturation unifiée GCP
- Quotas partagés avec Vertex AI Search
- Pas de gestion de clé API séparée

**Prérequis :**
- Activer facturation GCP complète
- Vérifier disponibilité Vertex AI Gemini dans la région
- Tester accès aux modèles via Vertex AI

**Note :** Le package `google.generativeai` est déprécié. Migration vers `google.genai` recommandée à long terme.

**Timeline :** Phase 4 (optionnel - solution actuelle pleinement fonctionnelle)

---

### 2. Filtres Vertex AI Search (Pilier 2 - Super-Chercheur)

**Problème :**
Les filtres sur les champs nested (`metadata.*`) ne fonctionnent pas avec Vertex AI Search dans la configuration actuelle.

**Erreur :**
```
Invalid filter syntax 'metadata.etat="VIGUEUR"'. 
Parsing filter failed with error: Unsupported field "metadata.etat" 
on comparison operators.
```

**Filtres concernés :**
- `metadata.etat` (VIGUEUR, ABROGE, MODIFIE)
- `metadata.code_id` (ID du code juridique)
- `metadata.jurisdiction` (Juridiction)
- `metadata.matter` (Matière juridique)
- `metadata.date_debut` / `metadata.date_fin` (Dates)
- `metadata.article_num` (Numéro d'article)

**Impact actuel :**
- La recherche fonctionne parfaitement en mode sémantique pur
- Impossibilité de filtrer par critères spécifiques
- Tous les résultats sont retournés sans filtrage

**Solutions possibles (à investiguer) :**

#### Option A : Syntaxe Vertex AI correcte
Investiguer la documentation Vertex AI pour trouver la syntaxe exacte pour filtrer les champs nested.

**Pistes :**
- Peut-être utiliser `jsonData.metadata.etat` au lieu de `metadata.etat`
- Peut-être une syntaxe spéciale pour les champs JSON
- Consulter les exemples officiels Google

**Documentation à consulter :**
- https://cloud.google.com/generative-ai-app-builder/docs/filter-search-metadata
- https://cloud.google.com/generative-ai-app-builder/docs/schema

#### Option B : Restructuration du JSONL
Déplacer les champs de métadonnées au niveau racine du document.

**Format actuel :**
```json
{
  "id": "LEGIARTI...",
  "jsonData": "{\"content\": \"...\", \"title\": \"...\", \"metadata\": {\"etat\": \"VIGUEUR\", ...}}"
}
```

**Format proposé :**
```json
{
  "id": "LEGIARTI...",
  "etat": "VIGUEUR",
  "code_id": "LEGITEXT...",
  "article_num": "1101",
  "jsonData": "{\"content\": \"...\", \"title\": \"...\"}"
}
```

**Avantages :**
- Filtres directement accessibles (`etat="VIGUEUR"`)
- Pas besoin de prefix `metadata.`

**Inconvénients :**
- Nécessite ré-ingestion complète des données
- Modification des scripts d'ingestion
- Possible duplication de données

#### Option C : Post-filtrage côté application
Implémenter le filtrage côté Python après récupération des résultats.

**Implémentation :**
```python
def _apply_client_side_filters(
    results: list[SearchResult],
    filters: SearchFilters
) -> list[SearchResult]:
    """Filtre les résultats côté application"""
    filtered = results
    
    if filters.etat:
        filtered = [r for r in filtered if r.metadata.get("etat") == filters.etat.value]
    
    if filters.code_id:
        filtered = [r for r in filtered if r.metadata.get("code_id") == filters.code_id]
    
    # ... autres filtres
    
    return filtered
```

**Avantages :**
- Implémentation rapide
- Pas de modifications des données
- Fonctionne immédiatement

**Inconvénients :**
- Performance dégradée (récupère trop de résultats)
- Gaspillage de bande passante
- Pagination complexe

#### Option D : Combinaison des approches
1. Implémenter post-filtrage (Option C) en **Phase 2** pour débloquer la fonctionnalité
2. Investiguer la syntaxe Vertex AI (Option A) en parallèle
3. Si nécessaire, restructurer le JSONL (Option B) en **Phase 3**

**Recommandation : Option D** ✅

---

**Timeline :**
- **Phase 2 (Semaine prochaine) :** Implémenter Option C (post-filtrage)
- **Phase 2 (Parallèle) :** Investiguer Option A (syntaxe Vertex AI)
- **Phase 3 (Si nécessaire) :** Option B (restructuration)

**Fichiers à modifier :**
- `api/super_chercheur.py` → méthode `_build_vertex_filters()` ou nouvelle méthode `_apply_client_side_filters()`
- `ingestion/ingestion_codes.py` → si restructuration JSONL (Option B)
- `ingestion/create_test_dataset.py` → si restructuration JSONL (Option B)

**Tests à ajouter :**
- Tests unitaires des filtres
- Tests d'intégration avec différents critères
- Tests de performance (avec/sans filtres)

---

## 🟡 Priorité MOYENNE

### 2. Amélioration du calcul de probabilité de succès

**Situation actuelle :**
Estimation basique basée sur la moyenne des scores de pertinence.

**Améliorations prévues :**
- Modèle ML entraîné sur historique de décisions
- Analyse des issues (favorable/défavorable)
- Prise en compte du contexte procédural
- Facteurs temporels (évolution jurisprudence)

**Timeline :** Phase 3

---

### 3. Extraction d'arguments juridiques avancée

**Situation actuelle :**
Extraction simple de mots-clés depuis les breadcrumbs.

**Améliorations prévues :**
- NER (Named Entity Recognition) juridique
- Extraction basée sur LLM (Gemini)
- Analyse sémantique des motifs de décision
- Identification d'arguments récurrents

**Outils potentiels :**
- Theolex (legal-doc-processing)
- Spacy + modèle juridique français
- Gemini avec prompt engineering

**Timeline :** Phase 3

---

### 4. Cache des résultats de recherche

**Objectif :**
Accélérer les requêtes fréquentes et réduire les coûts API.

**Implémentation suggérée :**
```python
# Utiliser Redis ou memcache
import redis

cache = redis.Redis(host='localhost', port=6379, db=0)

def cached_search(query: str, filters: dict) -> SearchResponse:
    cache_key = f"search:{hash(query)}:{hash(str(filters))}"
    
    # Vérifier cache
    cached = cache.get(cache_key)
    if cached:
        return SearchResponse.parse_raw(cached)
    
    # Requête réelle
    response = vertex_client.search(...)
    
    # Mettre en cache (TTL: 1h)
    cache.setex(cache_key, 3600, response.json())
    
    return response
```

**Timeline :** Phase 4

---

### 5. API PISTE Légifrance - Résolution erreur 500

**Problème :**
L'API PISTE renvoie systématiquement une erreur 500 (Internal Server Error).

**Status :**
- ✅ Message envoyé au support PISTE (17 déc 2025)
- ⏳ En attente de réponse

**Workaround actuel :**
Utilisation de data.gouv.fr pour l'ingestion.

**À faire quand résolu :**
1. Tester la connexion API
2. Lancer l'ingestion complète du Code Civil (8,000 articles)
3. Ingérer les autres codes (Pénal, Travail, Commerce, Procédure Civile)
4. Comparer qualité des données PISTE vs data.gouv.fr

**Timeline :** Dès que support PISTE répond

---

## 🟢 Priorité BASSE

### 6. Internationalisation du Pilier 3 (Audit)

**Problème :**
Le système actuel ne fonctionne QUE pour le droit français avec des patterns spécifiques.

**Limites actuelles :**
```python
# ✅ Fonctionne :
"article 1101 du Code civil" (France)

# ❌ Ne fonctionne PAS :
"18 U.S.C. § 1001" (USA)
"Section 1 of the Contract Act" (UK)
"§ 242 BGB" (Allemagne)
"Artículo 1261 del Código Civil" (Espagne)
```

**Challenges pour l'international :**
1. **Patterns différents** : Chaque pays a ses conventions
2. **Langues différentes** : FR, EN, DE, ES, IT, etc.
3. **Systèmes juridiques** : Common Law vs Civil Law vs autres
4. **Codes différents** : Nomenclatures nationales
5. **Bases de données** : Légifrance vs Westlaw vs BeckOnline vs EUR-Lex

**Variations d'écriture même en France :**
- "art. 1101" (abréviation)
- "article premier" (ordinal en lettres)
- "article 1101, al. 2" (avec alinéa)
- "articles 1101 à 1105" (plages)
- "article 1101-1" (sous-numérotation)

**Solutions possibles :**

#### Option A : Regex multilingue (simple mais rigide)
Définir des patterns pour chaque pays.

**Avantages :**
- Rapide à implémenter
- Déterministe

**Inconvénients :**
- Maintenance cauchemardesque
- Rigide
- Rate les variantes

#### Option B : NLP multilingue (flexible)
Utiliser Spacy avec modèles par langue et entités personnalisées.

**Avantages :**
- Flexible
- Extensible
- Gère les variantes

**Inconvénients :**
- Complexe
- Nécessite training
- Coûteux en ressources

#### Option C : API de normalisation (idéal)
Service externe qui normalise les références juridiques.

**Architecture :**
```python
class LegalAuditor:
    def __init__(self, country: str):
        self.extractor = ReferenceExtractorFactory.create(country)
        self.verifier = ReferenceVerifierFactory.create(country)
        self.database = LegalDatabaseFactory.create(country)
```

**Roadmap recommandée :**
1. **Phase 1 (MVP)** : France uniquement
   - Améliorer regex pour "art.", "al.", "premier"
   - Dataset complet
   
2. **Phase 2** : France + Belgique/Suisse
   - Même langue, patterns similaires
   - Codes similaires (Code civil belge/suisse)
   
3. **Phase 3** : + USA/UK
   - Common Law (patterns très différents)
   - Nouvelles bases (Westlaw, LexisNexis)
   
4. **Phase 4** : + UE + Allemagne/Espagne/Italie
   - EUR-Lex pour droit européen
   - Autres langues

**Fichiers à créer :**
- `api/extractors/` → Extracteurs par pays
- `api/verifiers/` → Vérificateurs par système juridique
- `api/databases/` → Adaptateurs pour bases de données
- `config/legal_systems.yaml` → Configuration par pays

**Timeline :** Phase 4-5 (après MVP France complet)

**Priorité :** BASSE (MVP France suffit pour démonstration)

---

### 7. Pagination des résultats

**Situation actuelle :**
Tous les résultats sont retournés en une seule fois (max 100).

**Amélioration prévue :**
```python
class SearchRequest(BaseModel):
    page: int = 1
    page_size: int = 10

class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    page: int
    total_pages: int
    has_next: bool
    has_previous: bool
```

**Timeline :** Phase 4

---

### 7. Export des résultats

**Formats souhaités :**
- PDF (rapport de recherche)
- DOCX (document éditable)
- CSV (tableau de résultats)
- JSON (pour intégration)

**Timeline :** Phase 4

---

### 8. Recherche par similarité de cas

**Concept :**
"Trouver des cas similaires à cette décision" (upload PDF/DOCX).

**Implémentation :**
1. Extraire le texte du document
2. Générer un embedding
3. Rechercher par similarité vectorielle dans Vertex AI

**Timeline :** Phase 4

---

### 9. Suggestions de requêtes

**Concept :**
Suggérer des reformulations ou des requêtes connexes.

**Exemple :**
```
Recherche: "contrat"
Suggestions:
  • "formation du contrat"
  • "nullité du contrat"
  • "résiliation du contrat"
```

**Timeline :** Phase 4

---

### 10. Historique de recherche

**Fonctionnalités :**
- Sauvegarder les recherches par utilisateur
- Suggestions basées sur l'historique
- Statistiques d'utilisation

**Timeline :** Phase 4

---

## 🔵 Optimisations techniques

### 11. Tests unitaires complets

**À ajouter :**
```
tests/
├── test_super_chercheur.py
├── test_vertex_search.py
├── test_models.py
└── test_ingestion.py
```

**Timeline :** Phase 2

---

### 12. CI/CD Pipeline

**Outils :**
- GitHub Actions
- Tests automatiques
- Linting (ruff, mypy)
- Déploiement automatique

**Timeline :** Phase 4

---

### 13. Monitoring & Observabilité

**Outils :**
- Sentry (error tracking)
- Prometheus + Grafana (métriques)
- Cloud Logging (logs centralisés)

**Timeline :** Phase 4

---

## 📝 Notes

### Comment utiliser ce fichier

1. **Ajouter un nouveau TODO :**
   - Choisir la priorité (HAUTE, MOYENNE, BASSE)
   - Décrire le problème/fonctionnalité
   - Proposer des solutions
   - Estimer la timeline

2. **Déplacer vers la TODO list active :**
   Quand on commence une tâche, la déplacer vers la TODO list principale et mettre à jour le statut.

3. **Archiver :**
   Quand une tâche est terminée, la supprimer de ce fichier et la documenter dans le CHANGELOG.

---

**Dernière mise à jour :** 18 Décembre 2025  
**Prochaine révision :** Fin de Phase 1 (après développement des 5 piliers)

