"""
Supprime TOUS les documents du datastore Vertex AI Search
Pour éviter les doublons avant de réimporter les fichiers corrigés
"""

from google.cloud import discoveryengine_v1beta as discoveryengine
from google.api_core import exceptions
from config.settings import get_settings
from config.logging_config import get_logger
import time

logger = get_logger(__name__)

def delete_all_documents():
    """Supprime tous les documents du datastore"""
    settings = get_settings()
    
    project_id = settings.GCP_PROJECT_ID
    data_store_id = settings.GCP_DATASTORE_ID
    location = settings.GCP_LOCATION or "global"
    
    if not project_id or not data_store_id:
        logger.error("❌ GCP_PROJECT_ID et GCP_DATASTORE_ID doivent être définis dans .env")
        return 1
    
    logger.info("=" * 70)
    logger.info("🗑️  SUPPRESSION DE TOUS LES DOCUMENTS")
    logger.info("=" * 70)
    logger.info(f"📋 Datastore: {data_store_id}")
    logger.info(f"📋 Project: {project_id}")
    logger.info(f"📋 Location: {location}")
    logger.info("")
    logger.warning("⚠️  ATTENTION: Cette opération va supprimer TOUS les documents !")
    logger.info("")
    
    # Initialiser le client
    client = discoveryengine.DocumentServiceClient()
    
    # Chemin du datastore
    parent = f"projects/{project_id}/locations/{location}/collections/default_collection/dataStores/{data_store_id}"
    
    deleted_count = 0
    error_count = 0
    
    try:
        # Lister tous les documents
        logger.info("🔍 Recherche de tous les documents...")
        request = discoveryengine.ListDocumentsRequest(parent=parent)
        page_result = client.list_documents(request=request)
        
        documents = list(page_result)
        total_docs = len(documents)
        
        if total_docs == 0:
            logger.info("✅ Aucun document trouvé dans le datastore")
            return 0
        
        logger.info(f"📊 {total_docs} documents trouvés")
        logger.info("")
        logger.warning("⚠️  Début de la suppression...")
        logger.info("")
        
        # Supprimer chaque document
        for i, doc in enumerate(documents, 1):
            try:
                delete_request = discoveryengine.DeleteDocumentRequest(name=doc.name)
                client.delete_document(request=delete_request)
                deleted_count += 1
                
                if i % 100 == 0:
                    logger.info(f"   Supprimé: {deleted_count}/{total_docs} documents...")
                    
            except exceptions.NotFound:
                # Document déjà supprimé, ignorer
                pass
            except Exception as e:
                error_count += 1
                logger.error(f"   ❌ Erreur lors de la suppression de {doc.name}: {e}")
        
        logger.info("")
        logger.info("=" * 70)
        logger.info("📊 RÉSUMÉ")
        logger.info("=" * 70)
        logger.success(f"✅ Documents supprimés: {deleted_count}")
        if error_count > 0:
            logger.warning(f"⚠️  Erreurs: {error_count}")
        logger.info("")
        logger.info("💡 Vous pouvez maintenant réimporter les fichiers corrigés")
        logger.info("=" * 70)
        
        return 0
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error("❌ ERREUR lors de la suppression")
        logger.error("=" * 70)
        logger.error(f"Type: {type(e).__name__}")
        logger.error(f"Message: {e}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        logger.error("=" * 70)
        return 1


if __name__ == "__main__":
    import sys
    
    # Demander confirmation
    print("\n" + "=" * 70)
    print("⚠️  ATTENTION: Cette opération va supprimer TOUS les documents !")
    print("=" * 70)
    response = input("\nÊtes-vous sûr de vouloir continuer ? (oui/non): ")
    
    if response.lower() not in ['oui', 'o', 'yes', 'y']:
        print("❌ Opération annulée")
        sys.exit(0)
    
    sys.exit(delete_all_documents())

