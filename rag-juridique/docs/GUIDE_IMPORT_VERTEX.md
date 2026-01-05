# 📤 Guide : Importer tous les fichiers dans Vertex AI Search

## Problème

Vertex AI Search ne supporte **pas les wildcards** (`*.jsonl`) dans les chemins GCS. Il faut importer chaque fichier individuellement.

## Solution : Script d'import automatique

### Option 1 : Script batch (Windows - Google Cloud SDK Shell)

1. **Ouvrir Google Cloud SDK Shell**
2. **Naviguer vers le projet** :
   ```bash
   cd "C:\Users\sofia\Desktop\perso\rag juridique"
   ```
3. **Exécuter le script** :
   ```bash
   import_all_to_vertex.bat
   ```

Le script va :
- Lister tous les fichiers JSONL dans GCS
- Importer chaque fichier un par un
- Afficher la progression

**Durée estimée** : ~2-4 heures pour 87 fichiers

### Option 2 : Via Console GCP (manuel)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Vertex AI → Search → Data Stores → `datastorerag_1766055384992` → Import
3. Pour **chaque fichier** (87 fois) :
   - Source : Cloud Storage
   - Path : `gs://legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl`
   - Format : JSONL
   - Import

⚠️ **Long et fastidieux** avec 87 fichiers

### Option 3 : Script Python (alternative)

Si vous préférez Python :

```python
from pathlib import Path
from config.settings import get_settings

settings = get_settings()
jsonl_files = list(settings.EXPORT_DIR.glob("*.jsonl"))

for f in jsonl_files:
    gcs_path = f"gs://legal-rag-data-sofia-2025/{f.name}"
    print(f"gcloud alpha discovery-engine documents import \\")
    print(f"  --datastore=datastorerag_1766055384992 \\")
    print(f"  --location=global \\")
    print(f"  --gcs-uri={gcs_path}")
```

Puis copier-coller les commandes dans Google Cloud SDK Shell.

## ⏱️ Durée estimée

- **Import** : ~2-4 heures pour 87 fichiers
- **Indexation** : ~2-4 heures supplémentaires pour 488,635 articles
- **Total** : ~4-8 heures

## ✅ Vérification

Après l'import, vérifier dans la console :
- Statut : `Completed`
- Documents importés : ~488,635
- Puis tester : `python test_search.py`

