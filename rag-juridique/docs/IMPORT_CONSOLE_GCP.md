# 📤 Import via Console GCP (Solution la plus simple)

La commande `gcloud alpha discovery-engine` n'est pas disponible dans votre version. Utilisez la **Console GCP** à la place.

## Étapes détaillées

### 1. Accéder à Vertex AI Search

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet : `jurilab-481600`
3. Menu : **Vertex AI** → **Search** → **Data Stores**

### 2. Sélectionner le datastore

1. Cliquer sur : `datastorerag_1766055384992`
2. Onglet : **Import**

### 3. Importer chaque fichier

Pour **chaque fichier** (87 fichiers) :

1. Cliquer sur **Import**
2. **Source** : `Cloud Storage`
3. **Path** : `gs://legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl`
   - Remplacer `NOM_DU_FICHIER.jsonl` par le nom exact du fichier
4. **Format** : `JSONL`
5. Cliquer sur **Import**

### 4. Liste des fichiers à importer

Vous pouvez voir la liste des fichiers dans GCS :
- **Cloud Storage** → **Buckets** → `legal-rag-data-sofia-2025`
- Tous les fichiers `.jsonl` sont là

### 5. Suivi de l'import

- Dans l'onglet **Import**, vous verrez l'historique
- Statut : `In Progress` puis `Completed`
- Documents importés : nombre d'articles

## ⏱️ Durée

- **Par fichier** : ~2-5 minutes
- **Total (87 fichiers)** : ~2-4 heures
- **Indexation** : ~2-4 heures supplémentaires

## 💡 Astuce

Vous pouvez lancer plusieurs imports en parallèle (5-10 à la fois) pour accélérer le processus.

