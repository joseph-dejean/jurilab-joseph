"""
Génère les commandes d'import sur une seule ligne (sans \)
Pour Google Cloud SDK Shell
"""

from pathlib import Path
from config.settings import get_settings

settings = get_settings()
jsonl_files = sorted(settings.EXPORT_DIR.glob("*.jsonl"))

BUCKET = "gs://legal-rag-data-sofia-2025"
PROJECT_ID = "jurilab-481600"
DATASTORE_ID = "datastorerag_1766055384992"
LOCATION = "global"

output_file = Path("import_commands_single_line.txt")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("# Commandes d'import pour Google Cloud SDK Shell\n")
    f.write("# Copier-coller chaque commande une par une\n\n")
    
    for i, jsonl_file in enumerate(jsonl_files, 1):
        gcs_uri = f"{BUCKET}/{jsonl_file.name}"
        
        # Commande sur une seule ligne
        command = f"gcloud alpha discovery-engine documents import --datastore={DATASTORE_ID} --location={LOCATION} --gcs-uri={gcs_uri} --project={PROJECT_ID}"
        
        f.write(f"# [{i}/{len(jsonl_files)}] {jsonl_file.name}\n")
        f.write(f"{command}\n")
        f.write("\n")

print(f"✅ {len(jsonl_files)} commandes générées dans {output_file}")
print(f"\nExemple de commande:")
print(f"  {command}")

