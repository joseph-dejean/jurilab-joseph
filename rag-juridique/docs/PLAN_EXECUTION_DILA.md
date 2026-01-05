# 🚀 Plan d'Exécution : Ingestion Complète depuis DILA

## 📋 Objectif

Ingérer **TOUTES** les données juridiques depuis DILA OPENDATA :
- ✅ **7 codes juridiques complets** (~35,000 articles)
- ✅ **Format officiel** (XML LEGI)
- ✅ **Métadonnées complètes** (dates, états, breadcrumbs)

---

## 🏗️ Ce qui a été créé

### 1. Module DILA (`ingestion/sources/dila_opendata.py`)

**Fonctionnalités** :
- ✅ Téléchargement automatique depuis DILA OPENDATA
- ✅ Extraction d'archives ZIP
- ✅ Parsing XML LEGI avec namespaces
- ✅ Extraction métadonnées complètes
- ✅ Conversion format Vertex AI

### 2. Intégration dans `ingestion_massive.py`

- ✅ `_try_datagouv()` maintenant utilise DILA
- ✅ Fallback automatique si DILA échoue
- ✅ Support checkpointing et max_articles

### 3. Dépendances ajoutées

```bash
pip install lxml beautifulsoup4
```

---

## 🎯 Plan d'exécution par étapes

### Étape 1 : Installer les dépendances

```powershell
.\venv\Scripts\pip.exe install lxml beautifulsoup4
```

### Étape 2 : Tester avec Code Civil (100 articles)

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --code civil --max-articles 100
```

**Ce qui va se passer** :
1. Téléchargement depuis DILA (si disponible)
2. Parsing XML
3. Génération JSONL
4. Export

**Vérifications** :
- ✅ Archive téléchargée dans `data/raw/dila/`
- ✅ Articles parsés correctement
- ✅ Format Vertex AI valide

### Étape 3 : Si test OK → Code Civil complet

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --code civil
```

**Durée estimée** : ~30-60 minutes (selon taille archive)

### Étape 4 : Tous les codes

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --all
```

**Durée estimée** : ~3-5 heures (selon connexion et taille archives)

---

## ⚠️ Points d'attention

### 1. Structure DILA peut varier

**Problème** : Les URLs et structures peuvent changer

**Solution** :
- Le script essaie plusieurs URLs
- Logs détaillés pour déboguer
- Fallback automatique si échec

### 2. Fichiers volumineux

**Problème** : Archives ZIP de plusieurs GB

**Solution** :
- Téléchargement stream (chunk par chunk)
- Barre de progression
- Checkpointing pour reprendre

### 3. Parsing XML complexe

**Problème** : XML LEGI avec namespaces et structure hiérarchique

**Solution** :
- Utilisation de `lxml` (plus robuste)
- Gestion des namespaces
- Parsing progressif avec gestion d'erreurs

### 4. Si DILA ne fonctionne pas

**Fallback automatique** :
1. DILA (essai)
2. Hugging Face (essai)
3. data.gouv.fr (essai)
4. Génération enrichie (fallback)

---

## 📊 Résultats attendus

### Après ingestion complète

**Codes juridiques** :
- Code Civil : ~8,000 articles
- Code Pénal : ~5,000 articles
- Code du Travail : ~10,000 articles
- Code de Commerce : ~3,000 articles
- Code de Procédure Civile : ~2,000 articles
- Code de Procédure Pénale : ~2,000 articles
- Code de la Sécurité Sociale : ~5,000 articles

**Total** : ~35,000 articles avec métadonnées complètes

**Format** : Tous au format Vertex AI, prêts pour import

---

## 🔍 Vérifications à faire

### Après chaque code ingéré

1. ✅ **Vérifier le JSONL** :
   ```powershell
   Get-Content data\exports\LEGITEXT*.jsonl -First 1 | python -m json.tool
   ```

2. ✅ **Compter les articles** :
   ```powershell
   (Get-Content data\exports\LEGITEXT*.jsonl).Count
   ```

3. ✅ **Vérifier les métadonnées** :
   - `code_id` présent
   - `article_num` présent
   - `etat` présent (VIGUEUR, ABROGE, MODIFIE)
   - `date_debut` présent

### Après tous les codes

1. ✅ **Upload vers GCS** :
   ```powershell
   gsutil -m cp data\exports\LEGITEXT*.jsonl gs://legal-rag-data-sofia-2025/
   ```

2. ✅ **Importer dans Vertex AI** :
   - Via Console GCP
   - Importer tous les fichiers JSONL
   - Attendre indexation (~2-4h pour 35K articles)

3. ✅ **Tester la recherche** :
   ```powershell
   $env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe test_search.py
   ```

---

## 🐛 Dépannage

### Erreur : "ModuleNotFoundError: No module named 'lxml'"

**Solution** :
```powershell
.\venv\Scripts\pip.exe install lxml beautifulsoup4
```

### Erreur : "404 Not Found" (DILA)

**Causes possibles** :
- URL a changé
- Code ID incorrect
- Archive non disponible

**Solution** :
- Vérifier manuellement sur `https://echanges.dila.gouv.fr/OPENDATA/LEGI/`
- Ajuster les URLs dans `dila_opendata.py`
- Utiliser fallback (Hugging Face ou génération enrichie)

### Erreur : "XML parsing failed"

**Causes possibles** :
- Fichier XML corrompu
- Structure XML différente
- Namespace incorrect

**Solution** :
- Vérifier le fichier XML manuellement
- Ajuster les XPath dans `_extract_article()`
- Logger le XML pour déboguer

### Erreur : "Timeout" (téléchargement)

**Solution** :
- Augmenter timeout dans `requests.get()`
- Télécharger manuellement et mettre dans `data/raw/dila/`
- Le script utilisera les fichiers locaux

---

## 📝 Checklist d'exécution

### Avant de commencer

- [ ] Installer dépendances : `pip install lxml beautifulsoup4`
- [ ] Vérifier connexion internet (archives volumineuses)
- [ ] Vérifier espace disque (plusieurs GB)

### Test initial

- [ ] Tester avec 100 articles Code Civil
- [ ] Vérifier format JSONL
- [ ] Vérifier métadonnées
- [ ] Valider avec Vertex AI (import test)

### Ingestion complète

- [ ] Code Civil complet
- [ ] Code Pénal complet
- [ ] Code du Travail complet
- [ ] Code de Commerce complet
- [ ] Code de Procédure Civile complet
- [ ] Code de Procédure Pénale complet
- [ ] Code de la Sécurité Sociale complet

### Validation finale

- [ ] Tous les JSONL créés
- [ ] Upload vers GCS
- [ ] Import dans Vertex AI
- [ ] Test recherche
- [ ] Test filtres (côté application)

---

## 🎯 Prochaines étapes après ingestion

1. **Tester les 5 piliers** avec données complètes
2. **Valider la segmentation** (filtres par code/état)
3. **Ajouter jurisprudence** (Phase 2)
4. **Optimiser les prompts** (plus de contexte disponible)

---

**Date** : 19 Décembre 2025  
**Statut** : Prêt pour exécution

