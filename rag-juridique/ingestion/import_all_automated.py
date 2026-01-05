"""
Script Python pour importer automatiquement tous les fichiers JSONL dans Vertex AI Search
Utilise l'API Google Cloud directement
"""

import time
from pathlib import Path
from typing import List
from google.cloud import discoveryengine_v1 as discoveryengine
from google.api_core import operation
from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)

# Configuration
PROJECT_ID = "jurilab-481600"
DATASTORE_ID = "datastorerag_1766055384992"
LOCATION = "global"
BUCKET = "gs://legal-rag-data-sofia-2025"


def list_gcs_files() -> List[str]:
    """Liste tous les fichiers JSONL (depuis fichiers locaux ou GCS)"""
    # Option 1: Utiliser les fichiers locaux
    settings = get_settings()
    local_files = list(settings.EXPORT_DIR.glob("*.jsonl"))
    
    if local_files:
        # Convertir en chemins GCS
        gcs_files = [f"{BUCKET}/{f.name}" for f in sorted(local_files)]
        logger.info(f"📋 {len(gcs_files)} fichiers JSONL trouvés (depuis fichiers locaux)")
        return gcs_files
    
    # Option 2: Essayer de lister depuis GCS (si gsutil est disponible)
    import subprocess
    try:
        cmd = ["gsutil", "ls", f"{BUCKET}/*.jsonl"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            files = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
            logger.info(f"📋 {len(files)} fichiers JSONL trouvés dans GCS")
            return files
    except FileNotFoundError:
        logger.warning("⚠️ gsutil non trouvé, utilisation des fichiers locaux")
    except Exception as e:
        logger.warning(f"⚠️ Erreur listing GCS: {e}, utilisation des fichiers locaux")
    
    return []


def import_file_to_vertex(gcs_uri: str) -> bool:
    """
    Importe un fichier JSONL dans Vertex AI Search via l'API
    
    Args:
        gcs_uri: URI GCS du fichier (ex: gs://bucket/file.jsonl)
    
    Returns:
        True si succès, False sinon
    """
    try:
        # Initialiser le client
        client = discoveryengine.ImportServiceClient()
        
        # Chemin du datastore
        parent = client.branch_path(
            project=PROJECT_ID,
            location=LOCATION,
            data_store=DATASTORE_ID,
            branch="default_branch"
        )
        
        # Configuration de l'import
        gcs_source = discoveryengine.GcsSource(
            input_uris=[gcs_uri],
            data_schema="document"
        )
        
        import_config = discoveryengine.ImportDocumentsRequest.InlineSource(
            documents=[]  # Vide car on utilise GCS
        )
        
        # Requête d'import
        request = discoveryengine.ImportDocumentsRequest(
            parent=parent,
            gcs_source=gcs_source,
            reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.INCREMENTAL
        )
        
        logger.info(f"📤 Import: {Path(gcs_uri).name}")
        
        # Lancer l'import
        operation_result = client.import_documents(request=request)
        
        # Attendre la fin (avec timeout)
        logger.info("   ⏳ Attente de la fin de l'import...")
        response = operation_result.result(timeout=3600)  # 1h max par fichier
        
        if response.error_samples:
            logger.error(f"   ❌ Erreurs: {response.error_samples}")
            return False
        
        logger.success(f"   ✅ Succès: {response.error_config.total_failed_import_count} erreurs, {response.error_config.total_import_count} importés")
        return True
        
    except Exception as e:
        logger.error(f"   ❌ Erreur: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def main():
    """Importe tous les fichiers automatiquement"""
    logger.info("=" * 70)
    logger.info("🚀 IMPORT AUTOMATIQUE VERS VERTEX AI SEARCH")
    logger.info("=" * 70)
    logger.info(f"📂 Datastore: {DATASTORE_ID}")
    logger.info(f"📦 Bucket: {BUCKET}")
    logger.info("")
    
    # Lister les fichiers
    gcs_files = list_gcs_files()
    
    if not gcs_files:
        logger.error("❌ Aucun fichier trouvé dans GCS")
        return 1
    
    logger.info(f"📋 {len(gcs_files)} fichiers à importer")
    logger.info("")
    logger.warning("⏱️  Durée estimée: ~2-4 heures pour tous les fichiers")
    logger.info("   (Chaque fichier prend ~2-5 minutes)")
    logger.info("")
    
    # Demander confirmation
    response = input("Voulez-vous continuer ? (o/n): ")
    if response.lower() != 'o':
        logger.info("❌ Annulé")
        return 0
    
    logger.info("")
    logger.info("📤 Début de l'import...")
    logger.info("")
    
    # Importer chaque fichier
    success_count = 0
    failed_count = 0
    
    for idx, gcs_file in enumerate(gcs_files, 1):
        logger.info("=" * 70)
        logger.info(f"[{idx}/{len(gcs_files)}] {Path(gcs_file).name}")
        logger.info("=" * 70)
        
        if import_file_to_vertex(gcs_file):
            success_count += 1
        else:
            failed_count += 1
        
        logger.info("")
        
        # Pause entre les imports pour éviter de surcharger l'API
        if idx < len(gcs_files):
            time.sleep(2)  # 2 secondes entre chaque import
    
    # Résumé
    logger.info("")
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

