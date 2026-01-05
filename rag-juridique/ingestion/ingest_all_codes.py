"""
Script pour ingérer TOUS les codes d'un coup
Sauvegarde la liste des codes pour éviter de refaire la recherche récursive
"""

import json
from pathlib import Path
from ingestion.ingest_from_legi_extracted import (
    find_code_directories,
    ingest_code_from_legi,
    CODE_MAPPING,
    LEGI_EXTRACTED_DIR,
)
from ingestion.ingestion_massive import MassiveIngester
from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)

# Fichier de cache pour la liste des codes
CODES_CACHE_FILE = Path("data/cache/codes_list.json")


def get_all_codes(legi_dir: Path, force_refresh: bool = False) -> list[str]:
    """
    Récupère la liste de tous les codes, avec cache
    
    Args:
        legi_dir: Dossier LEGI
        force_refresh: Forcer la recherche même si le cache existe
    
    Returns:
        Liste des IDs de codes
    """
    # Vérifier le cache
    if not force_refresh and CODES_CACHE_FILE.exists():
        logger.info("📂 Chargement de la liste des codes depuis le cache...")
        try:
            with open(CODES_CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                codes = cache_data.get('codes', [])
                if codes:
                    logger.info(f"✅ {len(codes)} codes chargés depuis le cache")
                    return codes
        except Exception as e:
            logger.warning(f"⚠️ Erreur lecture cache: {e}")
    
    # Recherche récursive (prend ~40 secondes)
    logger.info("🔍 Recherche de tous les codes (cela peut prendre ~40 secondes)...")
    code_dirs = find_code_directories(legi_dir)
    
    if not code_dirs:
        logger.error("❌ Aucun code trouvé")
        return []
    
    codes = [d.name for d in code_dirs]
    
    # Sauvegarder dans le cache
    CODES_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CODES_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'codes': codes,
            'count': len(codes),
            'legi_dir': str(legi_dir)
        }, f, indent=2, ensure_ascii=False)
    
    logger.info(f"✅ {len(codes)} codes trouvés et sauvegardés dans le cache")
    return codes


def main():
    """Ingère tous les codes"""
    legi_dir = Path(LEGI_EXTRACTED_DIR)
    
    if not legi_dir.exists():
        logger.error(f"❌ Dossier non trouvé: {legi_dir}")
        return 1
    
    logger.info("=" * 70)
    logger.info("🚀 INGESTION COMPLÈTE DE TOUS LES CODES")
    logger.info("=" * 70)
    logger.info(f"📂 Dossier source: {legi_dir}")
    logger.info("")
    
    # Récupérer tous les codes (avec cache)
    codes_to_ingest = get_all_codes(legi_dir)
    
    if not codes_to_ingest:
        logger.error("❌ Aucun code à ingérer")
        return 1
    
    logger.info(f"📋 {len(codes_to_ingest)} codes à ingérer")
    logger.info("")
    
    # Ingérer chaque code
    ingester = MassiveIngester(max_articles=None)  # Tous les articles
    total_articles = 0
    codes_success = 0
    codes_failed = 0
    
    for idx, code_id in enumerate(codes_to_ingest, 1):
        code_name = CODE_MAPPING.get(code_id, code_id)
        logger.info("=" * 70)
        logger.info(f"📚 [{idx}/{len(codes_to_ingest)}] {code_name} ({code_id})")
        logger.info("=" * 70)
        
        try:
            articles = ingest_code_from_legi(
                code_id=code_id,
                legi_dir=legi_dir,
                max_articles=None  # Tous les articles
            )
            
            if articles:
                # Exporter
                code_info = {
                    "id": code_id,
                    "name": code_name,
                }
                export_path = ingester._export_articles(
                    code_name=code_name.lower().replace(" ", "_"),
                    code_info=code_info,
                    articles=articles
                )
                total_articles += len(articles)
                codes_success += 1
                size_mb = export_path.stat().st_size / (1024 * 1024)
                logger.success(f"   ✅ {len(articles)} articles exportés ({size_mb:.2f} MB)")
            else:
                logger.warning(f"   ⚠️ Aucun article pour {code_id}")
                codes_failed += 1
        
        except Exception as e:
            codes_failed += 1
            logger.error(f"   ❌ Erreur pour {code_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            continue
        
        logger.info("")
    
    # Résumé
    logger.info("")
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ DE L'INGESTION")
    logger.info("=" * 70)
    logger.success(f"✅ Codes réussis: {codes_success}/{len(codes_to_ingest)}")
    if codes_failed > 0:
        logger.warning(f"⚠️ Codes échoués: {codes_failed}/{len(codes_to_ingest)}")
    logger.success(f"✅ Total articles ingérés: {total_articles:,}")
    logger.info("=" * 70)
    
    # Lister les fichiers exportés
    if total_articles > 0:
        logger.info("")
        logger.info("📁 Fichiers JSONL générés:")
        settings = get_settings()
        export_files = list(settings.EXPORT_DIR.glob("*.jsonl"))
        export_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        total_size_mb = sum(f.stat().st_size for f in export_files) / (1024 * 1024)
        logger.info(f"   Total: {len(export_files)} fichiers, {total_size_mb:.2f} MB")
        logger.info("")
        logger.info("💡 Prochaine étape: Uploader vers GCS")
        logger.info("   gsutil -m cp data\\exports\\*.jsonl gs://legal-rag-data-sofia-2025/")
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())

