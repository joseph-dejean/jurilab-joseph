# 🚀 Guide Phase 1 : Archive Freemium LEGI

## 📋 Processus complet

### Étape 1 : Télécharger l'archive (1.1 GB)

**Option A : Script automatique** (recommandé)
```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/download_and_ingest_freemium.py
```

**Option B : Manuel**
```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe -c "from ingestion.sources.datagouv_client import DataGouvClient; client = DataGouvClient(); client.download_freemium_archive()"
```

**Durée** : ~15-30 minutes (selon connexion)

**Emplacement** : `data/raw/datagouv/Freemium_legi_global_YYYYMMDD-HHMMSS.tar.gz`

---

### Étape 2 : Extraire l'archive

**Option A : Script automatique** (fait automatiquement par le script)
```powershell
# Le script extrait automatiquement
```

**Option B : Manuel** (si nécessaire)
```powershell
# Utiliser 7-Zip ou tar
# Windows : 7-Zip peut extraire .tar.gz
# Ou utiliser Python :
python -c "import tarfile; tarfile.open('data/raw/datagouv/Freemium_legi_global_*.tar.gz').extractall('data/raw/datagouv/')"
```

**Durée** : ~5-10 minutes

**Emplacement** : `data/raw/datagouv/Freemium_legi_global_YYYYMMDD-HHMMSS/`

---

### Étape 3 : Ingérer les codes

**Script automatique** :
```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/download_and_ingest_freemium.py
```

**Ou utiliser ingestion_massive.py** :
```powershell
# Le script détectera automatiquement les fichiers locaux
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/ingestion_massive.py --all
```

**Durée** : ~1-2 heures (parsing de 35,000 articles)

---

## 📊 Résultat attendu

### Codes ingérés

- ✅ Code Civil : ~8,000 articles
- ✅ Code Pénal : ~5,000 articles
- ✅ Code du Travail : ~10,000 articles
- ✅ Code de Commerce : ~3,000 articles
- ✅ Code de Procédure Civile : ~2,000 articles
- ✅ Code de Procédure Pénale : ~2,000 articles
- ✅ Code de la Sécurité Sociale : ~5,000 articles
- ✅ Autres codes : ~5,000 articles

**Total** : ~35,000 articles avec métadonnées complètes

---

## ⚠️ Points d'attention

### 1. Espace disque

- Archive : 1.1 GB
- Extrait : ~2-3 GB
- JSONL final : ~500 MB - 1 GB

**Total nécessaire** : ~4-5 GB

### 2. Temps de traitement

- Téléchargement : 15-30 min
- Extraction : 5-10 min
- Parsing : 1-2 heures
- **Total** : ~2-3 heures

### 3. Si téléchargement interrompu

Le script peut reprendre si vous relancez (vérifie si fichier existe).

---

## 🔄 Reprendre après interruption

Si le téléchargement est interrompu :

1. **Vérifier le fichier** :
   ```powershell
   Get-ChildItem data\raw\datagouv\Freemium*.tar.gz
   ```

2. **Si fichier existe** : Le script détectera et utilisera le fichier existant

3. **Si fichier incomplet** : Supprimer et relancer

---

## ✅ Checklist

- [ ] Télécharger l'archive Freemium (1.1 GB)
- [ ] Extraire l'archive
- [ ] Vérifier structure (dossier LEGI/)
- [ ] Ingérer les codes
- [ ] Vérifier JSONL générés
- [ ] Upload vers GCS
- [ ] Importer dans Vertex AI

---

**Prêt à lancer ?** 

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe ingestion/download_and_ingest_freemium.py
```

