@echo off
REM Script simplifié pour importer tous les fichiers JSONL
REM À exécuter dans Google Cloud SDK Shell

set PROJECT_ID=jurilab-481600
set DATASTORE_ID=datastorerag_1766055384992
set LOCATION=global
set BUCKET=gs://legal-rag-data-sofia-2025

echo ============================================================
echo IMPORT VERS VERTEX AI SEARCH
echo ============================================================
echo Datastore: %DATASTORE_ID%
echo Bucket: %BUCKET%
echo.

echo Test de connexion GCS...
gsutil ls %BUCKET%/ | findstr /i ".jsonl" > temp_files.txt
if errorlevel 1 (
    echo ERREUR: Impossible de lister les fichiers
    echo Verifiez que gsutil fonctionne et que vous etes authentifie
    pause
    exit /b 1
)

echo Fichiers trouves. Debut de l'import...
echo.

set COUNT=0
for /f "tokens=*" %%f in (temp_files.txt) do (
    set /a COUNT+=1
    echo [%COUNT%] Import: %%f
    gcloud alpha discovery-engine documents import --datastore=%DATASTORE_ID% --location=%LOCATION% --gcs-uri=%%f --project=%PROJECT_ID%
    if errorlevel 1 (
        echo   ERREUR
    ) else (
        echo   SUCCES
    )
    echo.
)

del temp_files.txt

echo ============================================================
echo Import termine
echo ============================================================
pause

