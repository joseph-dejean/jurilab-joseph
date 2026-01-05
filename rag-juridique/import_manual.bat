@echo off
REM Script pour importer manuellement fichier par fichier
REM Affiche chaque commande et attend votre confirmation

set PROJECT_ID=jurilab-481600
set DATASTORE_ID=datastorerag_1766055384992
set LOCATION=global
set BUCKET=gs://legal-rag-data-sofia-2025

echo ============================================================
echo IMPORT MANUEL - VERTEX AI SEARCH
echo ============================================================
echo.
echo Ce script va afficher chaque commande.
echo Vous devrez la copier-coller dans Google Cloud SDK Shell.
echo.
pause

if not exist "import_commands_single_line.txt" (
    echo ERREUR: import_commands_single_line.txt non trouve
    pause
    exit /b 1
)

echo.
echo Commandes a executer dans Google Cloud SDK Shell:
echo ============================================================
echo.

type import_commands_single_line.txt

echo.
echo ============================================================
echo.
echo Copiez-collez ces commandes dans Google Cloud SDK Shell
echo une par une.
echo.
pause

