# 📤 Import Manuel : Fichier par Fichier

Si le script automatique ne fonctionne pas, voici comment importer manuellement :

## Méthode 1 : Via Console GCP (Recommandé)

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com)
2. **Vertex AI** → **Search** → **Data Stores**
3. **Cliquer sur** `datastorerag_1766055384992`
4. **Onglet Import**
5. **Pour chaque fichier** (87 fichiers) :
   - Source : `Cloud Storage`
   - Path : `gs://legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl`
   - Format : `JSONL`
   - Cliquer **Import**

⚠️ **Long** mais fiable

## Méthode 2 : Commandes gcloud une par une

Dans **Google Cloud SDK Shell**, exécuter pour chaque fichier :

```bash
gcloud alpha discovery-engine documents import \
  --datastore=datastorerag_1766055384992 \
  --location=global \
  --gcs-uri=gs://legal-rag-data-sofia-2025/LEGITEXT000006070721_code_civil_20251219_162457.jsonl \
  --project=jurilab-481600
```

Remplacer le nom du fichier pour chaque import.

## Liste des fichiers à importer

Vous pouvez lister tous les fichiers avec :

```bash
gsutil ls gs://legal-rag-data-sofia-2025/*.jsonl
```

Puis copier-coller chaque chemin dans la commande d'import.

## Durée

- ~2-4 heures pour 87 fichiers
- Chaque import prend ~2-5 minutes

