# Script PowerShell pour télécharger l'archive Freemium LEGI

$env:PYTHONPATH = (Get-Location).Path
.\venv\Scripts\python.exe -c "from ingestion.sources.datagouv_client import DataGouvClient; client = DataGouvClient(); archive = client.download_freemium_archive(); print(f'\n✅ Archive téléchargée: {archive}')"

