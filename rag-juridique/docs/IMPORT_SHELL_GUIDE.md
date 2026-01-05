# 📤 Guide : Import via Google Cloud SDK Shell

## Méthode 1 : Script automatique

1. **Ouvrir Google Cloud SDK Shell**
2. **Naviguer vers le projet** :
   ```bash
   cd "C:\Users\sofia\Desktop\perso\rag juridique"
   ```
3. **Exécuter le script** :
   ```bash
   bash import_simple.sh
   ```

Le script va importer automatiquement tous les fichiers un par un.

## Méthode 2 : Commandes manuelles une par une

Si le script ne fonctionne pas, vous pouvez copier-coller chaque commande depuis `import_commands.txt` dans Google Cloud SDK Shell.

**Important** : Dans Google Cloud SDK Shell, les commandes avec `\` (continuation de ligne) doivent être sur **une seule ligne** ou exécutées telles quelles.

### Exemple de commande (une ligne) :

```bash
gcloud alpha discovery-engine documents import --datastore=datastorerag_1766055384992 --location=global --gcs-uri=gs://legal-rag-data-sofia-2025/CODE_CIVIL_enrichi.jsonl --project=jurilab-481600
```

## Si la commande n'existe pas

Si `gcloud alpha discovery-engine` n'existe pas dans votre version, **la seule solution est la console GCP**.

Vérifier si la commande existe :
```bash
gcloud alpha discovery-engine --help
```

Si ça affiche une erreur, utilisez la console GCP.

