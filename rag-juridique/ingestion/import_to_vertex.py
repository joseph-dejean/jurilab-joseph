"""
Script pour importer tous les fichiers JSONL dans Vertex AI Search
"""

import subprocess
from pathlib import Path
from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)

# Configuration
GCP_PROJECT_ID = "jurilab-481600"
DATASTORE_ID = "datastorerag_1766055384992"
LOCATION = "global"
GCS_BUCKET = "gs://legal-rag-data-sofia-2025"


def import_file_to_vertex(gcs_path: str) -> bool:
    """
    Importe un fichier JSONL dans Vertex AI Search
    
    Args:
        gcs_path: Chemin GCS du fichier (ex: gs://bucket/file.jsonl)
    
    Returns:
        True si succès, False sinon
    """
    try:
        cmd = [
            "gcloud", "alpha", "discovery-engine", "documents", "import",
            f"--datastore={DATASTORE_ID}",
            f"--location={LOCATION}",
            f"--gcs-uri={gcs_path}",
            f"--project={GCP_PROJECT_ID}"
        ]
        
        logger.info(f"📤 Import: {gcs_path}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode == 0:
            logger.success(f"   ✅ Succès")
            return True
        else:
            logger.error(f"   ❌ Erreur: {result.stderr}")
            return False
    
    except subprocess.TimeoutExpired:
        logger.error(f"   ❌ Timeout (>1h)")
        return False
    except Exception as e:
        logger.error(f"   ❌ Exception: {e}")
        return False


def list_gcs_files() -> list[str]:
    """
    Liste tous les fichiers JSONL dans le bucket GCS
    
    Returns:
        Liste des chemins GCS
    """
    try:
        cmd = ["gsutil", "ls", f"{GCS_BUCKET}/*.jsonl"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
            logger.info(f"📋 {len(files)} fichiers JSONL trouvés dans GCS")
            return files
        else:
            logger.error(f"❌ Erreur listing GCS: {result.stderr}")
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        return []


def main():
    """Importe tous les fichiers JSONL"""
    logger.info("=" * 70)
    logger.info("🚀 IMPORT VERS VERTEX AI SEARCH")
    logger.info("=" * 70)
    logger.info(f"📂 Datastore: {DATASTORE_ID}")
    logger.info(f"📦 Bucket: {GCS_BUCKET}")
    logger.info("")
    
    # Lister les fichiers
    gcs_files = list_gcs_files()
    
    if not gcs_files:
        logger.error("❌ Aucun fichier trouvé dans GCS")
        return 1
    
    logger.info(f"📋 {len(gcs_files)} fichiers à importer")
    logger.info("")
    
    # Importer chaque fichier
    success_count = 0
    failed_count = 0
    
    for idx, gcs_file in enumerate(gcs_files, 1):
        logger.info(f"[{idx}/{len(gcs_files)}] {Path(gcs_file).name}")
        
        if import_file_to_vertex(gcs_file):
            success_count += 1
        else:
            failed_count += 1
        
        logger.info("")
    
    # Résumé
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ DE L'IMPORT")
    logger.info("=" * 70)
    logger.success(f"✅ Fichiers réussis: {success_count}/{len(gcs_files)}")
    if failed_count > 0:
        logger.warning(f"⚠️ Fichiers échoués: {failed_count}/{len(gcs_files)}")
    logger.info("=" * 70)
    
    if success_count == len(gcs_files):
        logger.info("")
        logger.success("🎉 Tous les fichiers ont été importés avec succès !")
        logger.info("💡 Attendez ~2-4 heures pour l'indexation complète")
        logger.info("   Puis testez avec: python test_search.py")
    
    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())

