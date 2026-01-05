"""Validation rapide de tous les fichiers corrigés"""
import json
from pathlib import Path
from config.settings import get_settings

settings = get_settings()
fixed_dir = settings.EXPORT_DIR / "fixed"
fixed_files = sorted(fixed_dir.glob("*.jsonl"))

errors = []
total_lines = 0
valid_lines = 0

for f in fixed_files:
    with open(f, 'r', encoding='utf-8') as file:
        for line_num, line in enumerate(file, 1):
            line = line.strip()
            if not line:
                continue
            total_lines += 1
            try:
                doc = json.loads(line)
                if not doc.get("content") or not str(doc.get("content", "")).strip():
                    errors.append(f"{f.name}: ligne {line_num} - pas de content")
                else:
                    valid_lines += 1
            except:
                errors.append(f"{f.name}: ligne {line_num} - JSON invalide")

print(f"Total articles: {total_lines}")
print(f"Articles valides: {valid_lines}")
print(f"Erreurs: {len(errors)}")
if errors:
    print("\nPremières erreurs:")
    for e in errors[:10]:
        print(f"  - {e}")
else:
    print("\n✅ TOUS LES FICHIERS SONT VALIDES !")

