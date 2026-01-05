@echo off
REM Script pour importer tous les fichiers JSONL dans Vertex AI Search
REM À exécuter dans Google Cloud SDK Shell

set PROJECT_ID=jurilab-481600
set DATASTORE_ID=datastorerag_1766055384992
set LOCATION=global
set BUCKET=gs://legal-rag-data-sofia-2025

echo ============================================================
echo 🚀 IMPORT VERS VERTEX AI SEARCH
echo ============================================================
echo 📂 Datastore: %DATASTORE_ID%
echo 📦 Bucket: %BUCKET%
echo.

echo 📋 Liste des fichiers à importer:
gsutil ls %BUCKET%\*.jsonl
if errorlevel 1 (
    echo ❌ Erreur lors de la liste des fichiers
    echo Vérifiez que gsutil est installé et que vous êtes authentifié
    pause
    exit /b 1
)
echo.

echo 📤 Début de l'import...
echo.

REM Importer chaque fichier
set COUNT=0
for /f "tokens=*" %%f in ('gsutil ls %BUCKET%\*.jsonl') do (
    set /a COUNT+=1
    echo [%COUNT%] Import: %%f
    gcloud alpha discovery-engine documents import ^
        --datastore=%DATASTORE_ID% ^
        --location=%LOCATION% ^
        --gcs-uri=%%f ^
        --project=%PROJECT_ID%
    
    if errorlevel 1 (
        echo   ❌ Erreur
    ) else (
        echo   ✅ Succès
    )
    echo.
)

echo ============================================================
echo ✅ Import terminé
echo ============================================================

