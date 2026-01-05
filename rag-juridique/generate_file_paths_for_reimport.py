"""
Génère file_paths.txt avec les fichiers corrigés à réimporter
"""

from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def main():
    """Génère file_paths.txt avec les fichiers à réimporter"""
    logger.info("=" * 70)
    logger.info("📝 GÉNÉRATION DE file_paths.txt")
    logger.info("=" * 70)
    
    settings = get_settings()
    fixed_dir = settings.EXPORT_DIR / "fixed"
    
    if not fixed_dir.exists():
        logger.error("❌ Dossier 'fixed' non trouvé")
        logger.info("   Exécutez d'abord: python fix_missing_content.py")
        return 1
    
    # Lister tous les fichiers JSONL corrigés
    fixed_files = sorted(fixed_dir.glob("*.jsonl"))
    
    if not fixed_files:
        logger.warning("⚠️ Aucun fichier corrigé trouvé dans fixed/")
        return 1
    
    logger.info(f"📋 {len(fixed_files)} fichiers corrigés trouvés")
    logger.info("")
    
    # Générer file_paths.txt (format: legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl)
    paths_file = Path("file_paths.txt")
    with open(paths_file, 'w', encoding='utf-8') as f:
        for fixed_file in fixed_files:
            # Format: legal-rag-data-sofia-2025/NOM_DU_FICHIER.jsonl (sans gs://)
            gcs_path = f"legal-rag-data-sofia-2025/{fixed_file.name}"
            f.write(f"{gcs_path}\n")
            logger.info(f"   ✅ {fixed_file.name}")
    
    logger.info("")
    logger.success(f"✅ Fichier généré: {paths_file}")
    logger.info(f"   {len(fixed_files)} fichiers à réimporter")
    logger.info("")
    logger.info("💡 Prochaines étapes:")
    logger.info("   1. Uploader les fichiers depuis data/exports/fixed/ vers GCS")
    logger.info("   2. Utiliser file_paths.txt pour réimporter dans Vertex AI (console GCP)")
    logger.info("=" * 70)
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())

