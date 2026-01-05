@echo off
REM Script pour importer tous les fichiers JSONL dans Vertex AI Search
REM À exécuter dans Google Cloud SDK Shell (pas PowerShell)

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

if not exist "file_paths.txt" (
    echo ERREUR: file_paths.txt non trouve
    pause
    exit /b 1
)

echo Lecture de file_paths.txt...
echo.

set COUNT=0
for /f "tokens=*" %%f in (file_paths.txt) do (
    set /a COUNT+=1
    set "LINE=%%f"
    call :extract_filename "%%f"
    set "GCS_URI=%BUCKET%/%FILENAME%"
    
    echo [%COUNT%] Import: %FILENAME%
    echo.
    
    gcloud alpha discovery-engine documents import --datastore=%DATASTORE_ID% --location=%LOCATION% --gcs-uri=%GCS_URI% --project=%PROJECT_ID%
    
    if errorlevel 1 (
        echo   ERREUR pour ce fichier
    ) else (
        echo   SUCCES
    )
    
    echo.
    timeout /t 2 /nobreak >nul
)

echo ============================================================
echo Import termine
echo ============================================================
pause
exit /b 0

:extract_filename
set "FILENAME=%~nx1"
set "FILENAME=%FILENAME:*\=%"
goto :eof

