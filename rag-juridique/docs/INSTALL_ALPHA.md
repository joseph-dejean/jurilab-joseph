# Installation du composant Alpha pour gcloud

## Commande à exécuter

Dans **Google Cloud SDK Shell**, exécuter :

```bash
gcloud components install alpha
```

## Étapes

1. **Ouvrir Google Cloud SDK Shell**
2. **Exécuter la commande** :
   ```bash
   gcloud components install alpha
   ```
3. **Répondre `Y`** si demandé
4. **Attendre la fin de l'installation** (~1-2 minutes)
5. **Vérifier l'installation** :
   ```bash
   gcloud components list | findstr alpha
   ```
   Vous devriez voir `Installed` pour `gcloud Alpha Commands`

## Après l'installation

Une fois installé, vous pourrez utiliser les commandes d'import :

```bash
gcloud alpha discovery-engine documents import \
  --datastore=datastorerag_1766055384992 \
  --location=global \
  --gcs-uri=gs://legal-rag-data-sofia-2025/FICHIER.jsonl \
  --project=jurilab-481600
```

