#!/bin/bash
# Script pour importer tous les fichiers JSONL dans Vertex AI Search
# À exécuter dans Google Cloud SDK Shell

PROJECT_ID="jurilab-481600"
DATASTORE_ID="datastorerag_1766055384992"
LOCATION="global"
BUCKET="gs://legal-rag-data-sofia-2025"

echo "============================================================"
echo "IMPORT VERS VERTEX AI SEARCH"
echo "============================================================"
echo "Datastore: $DATASTORE_ID"
echo "Bucket: $BUCKET"
echo ""

# Lire le fichier file_paths.txt
if [ ! -f "file_paths.txt" ]; then
    echo "ERREUR: file_paths.txt non trouvé"
    exit 1
fi

# Compter les fichiers
TOTAL=$(wc -l < file_paths.txt)
COUNT=0

echo "Fichiers à importer: $TOTAL"
echo ""
echo "Début de l'import..."
echo ""

# Lire chaque ligne et importer
while IFS= read -r line; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$line")
    GCS_URI="${BUCKET}/${FILENAME}"
    
    echo "============================================================"
    echo "[$COUNT/$TOTAL] Import: $FILENAME"
    echo "============================================================"
    
    # Essayer différentes commandes possibles
    SUCCESS=0
    
    # Méthode 1: gcloud alpha discovery-engine (si disponible)
    if command -v gcloud &> /dev/null; then
        echo "Tentative avec gcloud alpha discovery-engine..."
        gcloud alpha discovery-engine documents import \
            --datastore=$DATASTORE_ID \
            --location=$LOCATION \
            --gcs-uri=$GCS_URI \
            --project=$PROJECT_ID 2>&1
        
        if [ $? -eq 0 ]; then
            echo "  ✅ Succès (méthode gcloud alpha)"
            SUCCESS=1
        else
            echo "  ❌ Échec (méthode gcloud alpha)"
        fi
    fi
    
    # Si la méthode 1 a échoué, essayer méthode 2: API REST via curl
    if [ $SUCCESS -eq 0 ]; then
        echo "Tentative avec API REST..."
        echo "  ⚠️  L'import via API REST nécessite un token d'authentification"
        echo "  💡 Utilisez la console GCP pour cet import"
        SUCCESS=0
    fi
    
    if [ $SUCCESS -eq 0 ]; then
        echo "  ⚠️  Import échoué pour ce fichier"
        echo "  💡 Importez manuellement via la console GCP:"
        echo "     Path: $GCS_URI"
    fi
    
    echo ""
    
    # Pause entre les imports
    sleep 1
    
done < file_paths.txt

echo "============================================================"
echo "Import terminé"
echo "============================================================"
echo ""
echo "Si certains imports ont échoué, utilisez la console GCP:"
echo "https://console.cloud.google.com/vertex-ai/search/data-stores"
echo ""

