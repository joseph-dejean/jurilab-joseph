"""
Identifie les fichiers qui ont été modifiés (articles exclus) et doivent être réimportés
"""

import json
from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def count_articles_in_file(file_path: Path) -> int:
    """Compte le nombre d'articles dans un fichier JSONL"""
    count = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        json.loads(line)
                        count += 1
                    except:
                        pass
    except:
        pass
    return count


def main():
    """Identifie les fichiers à réimporter"""
    logger.info("=" * 70)
    logger.info("🔍 IDENTIFICATION DES FICHIERS À RÉIMPORTER")
    logger.info("=" * 70)
    logger.info("")
    
    settings = get_settings()
    export_dir = settings.EXPORT_DIR
    fixed_dir = export_dir / "fixed"
    
    if not fixed_dir.exists():
        logger.error("❌ Dossier 'fixed' non trouvé")
        logger.info("   Exécutez d'abord: python fix_missing_content.py")
        return 1
    
    # Lister tous les fichiers JSONL originaux
    original_files = sorted(export_dir.glob("*.jsonl"))
    fixed_files = sorted(fixed_dir.glob("*.jsonl"))
    
    logger.info(f"📋 {len(original_files)} fichiers originaux")
    logger.info(f"📋 {len(fixed_files)} fichiers corrigés")
    logger.info("")
    
    files_to_reimport = []
    files_unchanged = []
    files_all_excluded = []
    
    for original_file in original_files:
        fixed_file = fixed_dir / original_file.name
        
        # Si le fichier corrigé n'existe pas, c'est que tous les articles ont été exclus
        if not fixed_file.exists():
            original_count = count_articles_in_file(original_file)
            if original_count > 0:
                files_all_excluded.append({
                    "file": original_file.name,
                    "original_count": original_count,
                    "fixed_count": 0,
                    "excluded": original_count,
                    "gcs_path": f"legal-rag-data-sofia-2025/{original_file.name}"
                })
                logger.warning(f"⚠️ Fichier avec tous articles exclus: {original_file.name} ({original_count} articles)")
            continue
        
        # Compter les articles
        original_count = count_articles_in_file(original_file)
        fixed_count = count_articles_in_file(fixed_file)
        
        if original_count != fixed_count:
            files_to_reimport.append({
                "file": original_file.name,
                "original_count": original_count,
                "fixed_count": fixed_count,
                "excluded": original_count - fixed_count,
                "gcs_path": f"legal-rag-data-sofia-2025/{fixed_file.name}"
            })
        else:
            files_unchanged.append(original_file.name)
    
    # Combiner les fichiers modifiés et ceux avec tous articles exclus
    all_files_to_reimport = files_to_reimport + files_all_excluded
    
    # Résumé
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ")
    logger.info("=" * 70)
    logger.info(f"Fichiers modifiés (à réimporter): {len(all_files_to_reimport)}")
    logger.info(f"   - Avec articles conservés: {len(files_to_reimport)}")
    logger.info(f"   - Tous articles exclus: {len(files_all_excluded)}")
    logger.info(f"Fichiers inchangés: {len(files_unchanged)}")
    logger.info("")
    
    if all_files_to_reimport:
        logger.warning("⚠️ Fichiers à réimporter:")
        total_excluded = 0
        for item in all_files_to_reimport:
            if item['fixed_count'] == 0:
                logger.warning(f"   - {item['file']}: {item['excluded']} articles exclus (fichier vide, non créé)")
            else:
                logger.warning(f"   - {item['file']}: {item['excluded']} articles exclus ({item['original_count']} → {item['fixed_count']})")
            total_excluded += item['excluded']
        
        logger.info("")
        logger.info(f"Total articles exclus: {total_excluded}")
        logger.info("")
        
        # Générer la liste des chemins GCS dans file_paths.txt (format sans gs://)
        logger.info("📝 Génération de file_paths.txt...")
        paths_file = Path("file_paths.txt")
        with open(paths_file, 'w', encoding='utf-8') as f:
            for item in all_files_to_reimport:
                # Format: legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl (sans gs://)
                f.write(f"{item['gcs_path']}\n")
        
        logger.success(f"✅ Liste générée: {paths_file}")
        logger.info(f"   {len(all_files_to_reimport)} fichiers à réimporter")
        logger.info("")
        logger.info("💡 Étapes:")
        logger.info("   1. Uploader les fichiers corrigés depuis data/exports/fixed/ vers GCS")
        logger.info("   2. Utiliser file_paths.txt pour réimporter dans Vertex AI (console GCP)")
    else:
        logger.success("✅ Aucun fichier à réimporter (tous identiques)")
    
    logger.info("=" * 70)
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())

