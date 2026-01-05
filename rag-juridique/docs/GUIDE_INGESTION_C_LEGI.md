# 🚀 Guide : Ingestion depuis C:\LEGI

## 📋 Prérequis

✅ **Archive extraite** : `C:\LEGI\legi\global\code_et_TNC_en_vigueur`  
✅ **Format validé** : Test avec 10 articles réussi  
✅ **Vertex AI configuré** : Datastore structuré prêt

---

## 🧪 Test avec un code (recommandé)

### Ingérer le Code Civil (test)

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --code civil --max-articles 100
```

**Vérifier** :
- ✅ JSONL généré dans `data/exports/`
- ✅ Format correct (champs directs)
- ✅ Upload vers GCS
- ✅ Import dans Vertex AI
- ✅ Test de recherche

---

## 📚 Ingestion complète

### Tous les codes

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --all
```

**Durée estimée** : 2-4 heures pour ~35,000 articles

### Codes spécifiques

```powershell
# Code Civil uniquement
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --code civil

# Code Pénal
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --code penal
```

---

## 📂 Structure attendue

Le script cherche les codes dans :
```
C:\LEGI\legi\global\code_et_TNC_en_vigueur\
├── LEGI\
│   ├── LEGITEXT000006070721\  (Code Civil)
│   ├── LEGITEXT000006070716\  (Code Pénal)
│   └── ...
```

Ou directement :
```
C:\LEGI\legi\global\code_et_TNC_en_vigueur\
├── LEGITEXT000006070721\
├── LEGITEXT000006070716\
└── ...
```

---

## 🔄 Processus complet

### 1. Ingérer depuis C:\LEGI

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --all
```

### 2. Vérifier les JSONL générés

```powershell
Get-ChildItem data\exports\*.jsonl | Select-Object Name, Length
```

### 3. Upload vers GCS

```powershell
gsutil -m cp data\exports\*.jsonl gs://legal-rag-data-sofia-2025/
```

### 4. Importer dans Vertex AI

1. Console GCP → Vertex AI Search → Data Stores
2. Votre datastore → Import
3. Source : Cloud Storage
4. Path : `gs://legal-rag-data-sofia-2025/*.jsonl`
5. Format : JSONL
6. Importer

**Durée** : ~2-4 heures pour ~35,000 articles

### 5. Tester

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe test_search.py
```

---

## ⚠️ Points d'attention

### 1. Chemin personnalisé

Si l'extraction est ailleurs :

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingest_from_legi_extracted.py --all --legi-dir "C:\Autre\Chemin\legi\global\code_et_TNC_en_vigueur"
```

### 2. Limiter pour test

```powershell
# 100 articles par code
--max-articles 100
```

### 3. Codes disponibles

Le script reconnaît automatiquement :
- Code civil
- Code pénal
- Code du travail
- Code de commerce
- Code de procédure civile
- Code de procédure pénale
- Code de la sécurité sociale
- + Tous les autres codes LEGITEXT* trouvés

---

## ✅ Checklist

- [ ] Archive extraite dans C:\LEGI
- [ ] Test avec 100 articles réussi
- [ ] JSONL générés correctement
- [ ] Upload vers GCS
- [ ] Import dans Vertex AI
- [ ] Test de recherche réussi
- [ ] Ingestion complète lancée

---

**Date** : 19 Décembre 2025

