# 🎯 Stratégie Complète d'Ingestion - Données Juridiques

## 📊 Vue d'ensemble des données

### Types de données à ingérer

1. **Codes juridiques** (~35,000 articles)
   - Code Civil, Code Pénal, Code du Travail, etc.
   - Format : Articles structurés
   - Volume : ~35,000 documents

2. **Jurisprudence** (~50,000+ décisions)
   - Décisions de justice (Cour de cassation, Conseil d'État, etc.)
   - Format : Décisions complètes avec métadonnées
   - Volume : ~50,000-100,000 documents

3. **Doctrine** (optionnel, plus tard)
   - Commentaires, analyses juridiques
   - Volume : Variable

**Total estimé : ~85,000-135,000 documents**

## 🏗️ Architecture : Un seul datastore avec segmentation

### ✅ Recommandation : UN SEUL DATASTORE

**Pourquoi un seul datastore ?**

1. ✅ **Recherche unifiée** : Une seule requête pour chercher dans tous les types
2. ✅ **Simplicité** : Un seul point d'accès, moins de configuration
3. ✅ **Recherche sémantique optimale** : Vertex AI peut faire des liens entre codes et jurisprudence
4. ✅ **Volume acceptable** : ~135K documents (limite Vertex AI : ~1M)
5. ✅ **Métadonnées puissantes** : Segmentation par `type`, `code_id`, `jurisdiction`, etc.

### Structure du datastore unique

```
datastorerag_1766055384992 (global)
│
├── 📚 CODES JURIDIQUES (type: "article_code")
│   ├── Code Civil (code_id: LEGITEXT000006070721)
│   ├── Code Pénal (code_id: LEGITEXT000006070716)
│   ├── Code du Travail (code_id: LEGITEXT000006072050)
│   └── ... (autres codes)
│
├── ⚖️ JURISPRUDENCE (type: "jurisprudence")
│   ├── Cour de cassation (jurisdiction: "Cour de cassation")
│   ├── Conseil d'État (jurisdiction: "Conseil d'État")
│   ├── Cours d'appel (jurisdiction: "Cour d'appel")
│   └── ... (autres juridictions)
│
└── 📖 DOCTRINE (type: "doctrine") - Plus tard
    └── Commentaires, analyses
```

## 🏷️ Métadonnées pour segmentation

### Schéma de métadonnées unifié

```json
{
  "id": "UNIQUE_ID",
  "jsonData": "{
    \"content\": \"...\",
    \"title\": \"...\",
    \"metadata\": {
      // ===== SEGMENTATION PRINCIPALE =====
      \"type\": \"article_code\" | \"jurisprudence\" | \"doctrine\",
      
      // ===== POUR LES CODES =====
      \"code_id\": \"LEGITEXT000006070721\",
      \"code_name\": \"Code civil\",
      \"article_num\": \"1101\",
      \"article_id\": \"LEGIARTI000006419101\",
      
      // ===== POUR LA JURISPRUDENCE =====
      \"jurisdiction\": \"Cour de cassation\" | \"Conseil d'État\" | \"Cour d'appel\",
      \"decision_date\": \"2020-01-15\",
      \"decision_num\": \"C-20-12345\",
      \"matter\": \"Droit civil\" | \"Droit pénal\" | \"Droit du travail\",
      
      // ===== COMMUN =====
      \"etat\": \"VIGUEUR\" | \"ABROGE\" | \"MODIFIE\",
      \"date_debut\": \"2016-10-01\",
      \"date_fin\": null,
      \"breadcrumb\": \"Code civil > Livre III > ...\",
      \"source\": \"Hugging Face\" | \"Légifrance\" | \"data.gouv.fr\",
      \"ingestion_date\": \"2025-12-19T10:00:00\"
    }
  }"
}
```

### Filtres possibles

Avec ces métadonnées, on peut filtrer :

```python
# Recherche dans codes uniquement
client.filter_by_metadata(
    query="contrat",
    type="article_code",
    code_id="LEGITEXT000006070721",
    etat="VIGUEUR"
)

# Recherche dans jurisprudence uniquement
client.filter_by_metadata(
    query="contrat",
    type="jurisprudence",
    jurisdiction="Cour de cassation",
    matter="Droit civil"
)

# Recherche dans tout (codes + jurisprudence)
client.search("contrat", page_size=20)
```

## 📋 Plan d'ingestion par phases

### Phase 1 : Codes juridiques (PRIORITÉ 1)

**Objectif** : Ingérer tous les codes français

**Ordre d'ingestion** :
1. Code Civil (~8,000 articles) - **PRIORITÉ 1**
2. Code Pénal (~5,000 articles) - **PRIORITÉ 2**
3. Code du Travail (~10,000 articles) - **PRIORITÉ 3**
4. Code de Commerce (~3,000 articles)
5. Code de Procédure Civile (~2,000 articles)
6. Code de Procédure Pénale (~2,000 articles)
7. Code de la Sécurité Sociale (~5,000 articles)

**Durée estimée** : 2-3 jours (selon sources disponibles)

**Commandes** :
```bash
# Un code à la fois (recommandé)
python ingestion/ingestion_massive.py --code civil
python ingestion/ingestion_massive.py --code penal

# Ou tous d'un coup
python ingestion/ingestion_massive.py --all
```

### Phase 2 : Jurisprudence (PRIORITÉ 2)

**Objectif** : Ingérer la jurisprudence française

**Sources** :
1. Hugging Face : `antoinejeannot/french-jurisprudence` (~50,000 décisions)
2. data.gouv.fr : Décisions de justice (si disponible)
3. API Légifrance : Jurisprudence (si API fonctionne)

**Ordre d'ingestion** :
1. Cour de cassation (priorité haute)
2. Conseil d'État
3. Cours d'appel
4. Tribunaux (si disponible)

**Durée estimée** : 3-5 jours

**Script** : `ingestion/ingestion_jurisprudence.py` (à créer)

### Phase 3 : Doctrine (OPTIONNEL, plus tard)

**Objectif** : Enrichir avec commentaires et analyses

**Sources** :
- Articles juridiques
- Commentaires de codes
- Analyses doctrinales

**Priorité** : BASSE (après codes + jurisprudence)

## 🔄 Stratégie d'ingestion progressive

### Approche recommandée : Progressive par type

**Pourquoi progressive ?**

1. ✅ **Validation étape par étape** : Valider chaque type avant de continuer
2. ✅ **Tests intermédiaires** : Tester les 5 piliers après chaque phase
3. ✅ **Gestion d'erreurs** : Plus facile de déboguer
4. ✅ **Flexibilité** : Ajuster la stratégie si nécessaire

### Workflow recommandé

```
Jour 1-2 : Phase 1 - Codes juridiques
├── Ingérer Code Civil
├── Tester les 5 piliers avec Code Civil
├── Valider la segmentation (filtres)
└── Continuer avec autres codes

Jour 3-5 : Phase 2 - Jurisprudence
├── Ingérer jurisprudence Cour de cassation
├── Tester recherche croisée (codes + jurisprudence)
├── Valider les filtres par juridiction
└── Continuer avec autres juridictions

Plus tard : Phase 3 - Doctrine (si nécessaire)
```

## 🎯 Alternatives : Plusieurs datastores ?

### Option A : Un seul datastore (RECOMMANDÉ) ✅

**Avantages** :
- Recherche unifiée
- Simplicité de gestion
- Vertex AI peut faire des liens sémantiques entre types
- Volume acceptable (~135K << 1M limite)

**Inconvénients** :
- Filtres sur métadonnées nested peuvent être limités (mais recherche sémantique fonctionne)

### Option B : Deux datastores (codes + jurisprudence)

**Structure** :
- `datastore_codes` : Tous les codes
- `datastore_jurisprudence` : Toute la jurisprudence

**Avantages** :
- Séparation claire
- Filtres plus simples (pas de nested)

**Inconvénients** :
- Recherche fragmentée (2 requêtes pour chercher partout)
- Plus complexe à gérer
- Pas de liens sémantiques entre codes et jurisprudence

### Option C : Un datastore par code (TROP COMPLEXE) ❌

**Inconvénients** :
- 7+ datastores à gérer
- Recherche très fragmentée
- Complexité inutile

## ✅ Recommandation finale

### **UN SEUL DATASTORE avec métadonnées structurées**

**Raisons** :
1. Volume acceptable (~135K documents)
2. Recherche sémantique optimale
3. Simplicité de gestion
4. Métadonnées permettent segmentation fine

**Si problèmes de filtres** :
- Solution 1 : Filtrer côté application (après récupération)
- Solution 2 : Créer 2 datastores (codes + jurisprudence) si vraiment nécessaire

## 📝 Plan d'action immédiat

### Étape 1 : Tester avec Code Civil (100 articles)

```bash
# Test rapide
python ingestion/ingestion_massive.py --code civil --max-articles 100

# Vérifier le format JSONL
cat data/exports/LEGITEXT000006070721_civil_*.jsonl | head -1 | jq

# Upload test
gsutil cp data/exports/LEGITEXT000006070721_civil_*.jsonl gs://legal-rag-data-sofia-2025/

# Importer dans Vertex AI (GCP Console)
# Tester la recherche et les filtres
```

### Étape 2 : Valider la segmentation

```python
from rag.vertex_search import VertexSearchClient

client = VertexSearchClient()

# Test 1 : Recherche dans Code Civil uniquement
results = client.filter_by_metadata(
    query="contrat",
    code_id="LEGITEXT000006070721"
)
print(f"✅ {len(results)} résultats Code Civil")

# Test 2 : Recherche globale
results_all = client.search("contrat", page_size=10)
print(f"✅ {len(results_all)} résultats globaux")
```

### Étape 3 : Si validation OK → Ingérer tous les codes

```bash
python ingestion/ingestion_massive.py --all
```

### Étape 4 : Tester les 5 piliers avec données complètes

- Machine à Actes
- Super-Chercheur
- Audit et Conformité
- Synthèse
- Chatbot

### Étape 5 : Ingérer jurisprudence (Phase 2)

Créer `ingestion/ingestion_jurisprudence.py` et ingérer.

## 🚨 Points d'attention

### 1. Limite Vertex AI

- **Limite théorique** : ~1M documents par datastore
- **Notre volume** : ~135K documents
- **Marge** : Large (8x en dessous de la limite)

### 2. Filtres sur métadonnées nested

Si les filtres `metadata.code_id` ne fonctionnent pas :

**Solution immédiate** : Filtrer côté application
```python
results = client.search("contrat", page_size=100)
filtered = [r for r in results if r['metadata'].get('code_id') == 'LEGITEXT000006070721']
```

**Solution future** : Restructurer JSONL (métadonnées au niveau racine)

### 3. Performance

- **Recherche sémantique** : Très rapide même avec 135K documents
- **Filtres** : Peuvent être plus lents (mais recherche sémantique prioritaire)

## 📊 Métriques de succès

Après chaque phase, vérifier :

1. ✅ **Format correct** : JSONL valide, métadonnées présentes
2. ✅ **Import réussi** : Documents visibles dans Vertex AI
3. ✅ **Recherche fonctionne** : Résultats pertinents
4. ✅ **Filtres fonctionnent** : Segmentation par type/code/jurisdiction
5. ✅ **5 piliers fonctionnent** : Tous les outils opérationnels

## 🎯 Conclusion

**Stratégie recommandée** :
- ✅ **UN SEUL DATASTORE** avec métadonnées structurées
- ✅ **Ingestion progressive** : Codes d'abord, puis jurisprudence
- ✅ **Validation étape par étape** : Tester après chaque phase
- ✅ **Flexibilité** : Ajuster si nécessaire

**Commencez par** :
1. Tester avec 100 articles Code Civil
2. Valider format et segmentation
3. Ingérer tous les codes
4. Tester les 5 piliers
5. Puis passer à la jurisprudence

---

**Date** : 19 Décembre 2025  
**Statut** : Stratégie validée, prête pour exécution

