#!/bin/bash
# Script pour importer tous les fichiers JSONL dans Vertex AI Search
# À exécuter dans Google Cloud SDK Shell

PROJECT_ID="jurilab-481600"
DATASTORE_ID="datastorerag_1766055384992"
LOCATION="global"
BUCKET="gs://legal-rag-data-sofia-2025"

echo "============================================================"
echo "🚀 IMPORT VERS VERTEX AI SEARCH"
echo "============================================================"
echo "📂 Datastore: $DATASTORE_ID"
echo "📦 Bucket: $BUCKET"
echo ""

# Lister tous les fichiers JSONL
echo "📋 Liste des fichiers à importer:"
gsutil ls ${BUCKET}/*.jsonl | while read file; do
    echo "  - $(basename $file)"
done

echo ""
echo "📤 Début de l'import..."
echo ""

# Compter les fichiers
TOTAL=$(gsutil ls ${BUCKET}/*.jsonl | wc -l)
COUNT=0

# Importer chaque fichier
gsutil ls ${BUCKET}/*.jsonl | while read file; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename $file)
    
    echo "[$COUNT/$TOTAL] Import: $FILENAME"
    
    gcloud alpha discovery-engine documents import \
        --datastore=$DATASTORE_ID \
        --location=$LOCATION \
        --gcs-uri=$file \
        --project=$PROJECT_ID
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Succès"
    else
        echo "  ❌ Erreur"
    fi
    
    echo ""
done

echo "============================================================"
echo "✅ Import terminé"
echo "============================================================"

