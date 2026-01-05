@echo off
echo ======================================================================
echo UPLOAD DE TOUS LES FICHIERS CORRIGÉS VERS GCS
echo ======================================================================
echo.
echo Dossier source: data\exports\fixed
echo Bucket: gs://legal-rag-data-sofia-2025
echo.
echo Upload en cours...
gsutil -m cp data\exports\fixed\*.jsonl gs://legal-rag-data-sofia-2025/
echo.
echo ======================================================================
echo Upload terminé !
echo ======================================================================
pause

