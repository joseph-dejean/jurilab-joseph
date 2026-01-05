# 📤 Solution Finale : Import des 87 fichiers

## ⚠️ Important

Les commandes `gcloud` doivent être exécutées dans **Google Cloud SDK Shell**, **PAS dans PowerShell/CMD**.

## Méthode 1 : Script automatique (si gcloud alpha discovery-engine existe)

### Dans Google Cloud SDK Shell :

```bash
cd "C:\Users\sofia\Desktop\perso\rag juridique"
bash import_simple.sh
```

Ou si bash n'est pas disponible, utilisez le script batch dans Google Cloud SDK Shell :
```bash
import_all.bat
```

## Méthode 2 : Commandes manuelles (recommandé)

1. **Ouvrir Google Cloud SDK Shell** (pas PowerShell)
2. **Ouvrir le fichier** `import_commands_single_line.txt`
3. **Copier-coller chaque commande** une par une dans Google Cloud SDK Shell
4. **Exécuter** chaque commande

### Exemple de commande :

```bash
gcloud alpha discovery-engine documents import --datastore=datastorerag_1766055384992 --location=global --gcs-uri=gs://legal-rag-data-sofia-2025/CODE_CIVIL_enrichi.jsonl --project=jurilab-481600
```

## Méthode 3 : Console GCP (si les commandes ne fonctionnent pas)

Si `gcloud alpha discovery-engine` n'existe pas, utilisez la console GCP :

1. [Google Cloud Console](https://console.cloud.google.com)
2. Vertex AI → Search → Data Stores → `datastorerag_1766055384992` → Import
3. Pour chaque fichier dans `file_paths.txt` :
   - Source : Cloud Storage
   - Path : `gs://legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl`
   - Format : JSONL
   - Import

## Vérifier si la commande existe

Dans Google Cloud SDK Shell :
```bash
gcloud alpha discovery-engine documents import --help
```

Si ça affiche une erreur, utilisez la **console GCP**.

