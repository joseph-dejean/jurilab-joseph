# ✅ Solution Finale : Import via Console GCP

## Problème

L'API Python `discoveryengine_v1` ne contient pas `ImportServiceClient` dans cette version. L'import automatique via Python n'est **pas possible** actuellement.

## Solution : Console GCP (Recommandée)

C'est la méthode la plus fiable et la plus simple.

### Étapes

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com)
2. **Sélectionner le projet** : `jurilab-481600`
3. **Vertex AI** → **Search** → **Data Stores**
4. **Cliquer sur** : `datastorerag_1766055384992`
5. **Onglet** : **Import**

### Pour chaque fichier (87 fichiers)

1. Cliquer sur **Import**
2. **Source** : `Cloud Storage`
3. **Path** : `gs://legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl`
   - Remplacer `NOM_DU_FICHIER.jsonl` par le nom exact
4. **Format** : `JSONL`
5. Cliquer sur **Import**

### Liste des fichiers

Pour voir tous les fichiers dans GCS :
- **Cloud Storage** → **Buckets** → `legal-rag-data-sofia-2025`
- Tous les fichiers `.jsonl` sont listés

### Astuce : Imports en parallèle

Vous pouvez lancer **plusieurs imports en parallèle** (5-10 à la fois) pour accélérer :
1. Ouvrir plusieurs onglets de la console
2. Lancer plusieurs imports simultanément
3. Chaque import prend ~2-5 minutes

### Durée

- **Par fichier** : ~2-5 minutes
- **Total (87 fichiers)** : ~2-4 heures si fait séquentiellement
- **Avec parallélisation (10 à la fois)** : ~30-45 minutes
- **Indexation** : ~2-4 heures supplémentaires après l'import

## Alternative : Script pour générer les URLs

Si vous voulez accélérer, je peux créer un script qui génère des liens directs vers la console GCP pour chaque fichier, pour que vous puissiez cliquer directement.

