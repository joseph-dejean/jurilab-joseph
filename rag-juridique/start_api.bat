@echo off
echo ======================================================================
echo DÉMARRAGE DE L'API LEGAL-RAG FRANCE
echo ======================================================================
echo.
echo URL: http://localhost:8000
echo Documentation: http://localhost:8000/docs
echo.
echo Appuyez sur CTRL+C pour arrêter
echo ======================================================================
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat
python start_api.py

pause

