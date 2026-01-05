"""
Génère les commandes d'import pour tous les fichiers JSONL
"""

from pathlib import Path
from config.settings import get_settings

settings = get_settings()
jsonl_files = sorted(settings.EXPORT_DIR.glob("*.jsonl"))

print(f"# {len(jsonl_files)} fichiers à importer\n")

for i, f in enumerate(jsonl_files, 1):
    gcs_path = f"gs://legal-rag-data-sofia-2025/{f.name}"
    print(f"# [{i}/{len(jsonl_files)}] {f.name}")
    print(f"gcloud alpha discovery-engine documents import \\")
    print(f"  --datastore=datastorerag_1766055384992 \\")
    print(f"  --location=global \\")
    print(f"  --gcs-uri={gcs_path} \\")
    print(f"  --project=jurilab-481600")
    print()

