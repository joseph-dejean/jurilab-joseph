"""
Génère un fichier avec tous les chemins des fichiers JSONL
Format: legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl
"""

from pathlib import Path
from config.settings import get_settings

settings = get_settings()
jsonl_files = sorted(settings.EXPORT_DIR.glob("*.jsonl"))

BUCKET = "legal-rag-data-sofia-2025"

# Générer les chemins
paths = [f"{BUCKET}/{f.name}" for f in jsonl_files]

# Écrire dans un fichier
output_file = Path("file_paths.txt")
with open(output_file, 'w', encoding='utf-8') as f:
    for path in paths:
        f.write(path + '\n')

print(f"✅ {len(paths)} chemins générés dans {output_file}")
print(f"\nPremiers chemins:")
for path in paths[:5]:
    print(f"  - {path}")

