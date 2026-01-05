#!/bin/bash
# Script simple pour importer tous les fichiers
# À exécuter dans Google Cloud SDK Shell

PROJECT_ID="jurilab-481600"
DATASTORE_ID="datastorerag_1766055384992"
LOCATION="global"
BUCKET="gs://legal-rag-data-sofia-2025"

echo "Import de tous les fichiers JSONL..."
echo ""

COUNT=0
while IFS= read -r line; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$line")
    GCS_URI="${BUCKET}/${FILENAME}"
    
    echo "[$COUNT] $FILENAME"
    
    # Commande d'import (à adapter selon votre version de gcloud)
    gcloud alpha discovery-engine documents import \
        --datastore=$DATASTORE_ID \
        --location=$LOCATION \
        --gcs-uri=$GCS_URI \
        --project=$PROJECT_ID
    
    echo ""
    sleep 1
done < file_paths.txt

echo "Terminé!"

