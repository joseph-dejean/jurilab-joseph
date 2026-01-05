"""Test de recherche dans Vertex AI Search après ingestion"""

from rag.vertex_search import VertexSearchClient
from config.logging_config import get_logger

logger = get_logger(__name__)


def test_search():
    """Test complet de recherche et filtres"""
    
    # Initialiser le client
    try:
        client = VertexSearchClient()
        logger.info("✅ Client Vertex AI initialisé")
    except Exception as e:
        logger.error(f"❌ Erreur initialisation client: {e}")
        return
    
    # Test 1 : Recherche simple
    logger.info("=" * 70)
    logger.info("TEST 1 : Recherche simple - 'contrat'")
    logger.info("=" * 70)
    
    try:
        results = client.search("contrat", page_size=5)
        logger.info(f"✅ {len(results)} résultats trouvés")
        
        if not results:
            logger.warning("⚠️ Aucun résultat trouvé. Vérifiez que l'import est terminé.")
            return
        
        for i, doc in enumerate(results, 1):
            logger.info(f"\n{i}. {doc.get('title', 'Sans titre')}")
            logger.info(f"   Score: {doc.get('score', 'N/A')}")
            content = doc.get('content', '')
            logger.info(f"   Contenu: {content[:100]}...")
            # NOUVEAU FORMAT : Champs directs (pas dans metadata)
            code_name = doc.get('code_name') or doc.get('metadata', {}).get('code_name', 'N/A')
            article_num = doc.get('article_num') or doc.get('metadata', {}).get('article_num', 'N/A')
            etat = doc.get('etat') or doc.get('metadata', {}).get('etat', 'N/A')
            logger.info(f"   Code: {code_name}")
            logger.info(f"   Article: {article_num}")
            logger.info(f"   État: {etat}")
    except Exception as e:
        logger.error(f"❌ Erreur recherche: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return
    
    # Test 2 : Recherche avec filtre par code
    logger.info("\n" + "=" * 70)
    logger.info("TEST 2 : Recherche avec filtre (Code Civil uniquement)")
    logger.info("=" * 70)
    
    try:
        results_filtered = client.filter_by_metadata(
            query="contrat",
            code_id="LEGITEXT000006070721",
            etat="VIGUEUR"
        )
        
        logger.info(f"✅ {len(results_filtered)} résultats filtrés")
        
        if results_filtered:
            for i, doc in enumerate(results_filtered[:3], 1):
                logger.info(f"\n{i}. {doc.get('title', 'Sans titre')}")
                # NOUVEAU FORMAT : Champs directs
                code_name = doc.get('code_name') or doc.get('metadata', {}).get('code_name', 'N/A')
                etat = doc.get('etat') or doc.get('metadata', {}).get('etat', 'N/A')
                logger.info(f"   Code: {code_name}")
                logger.info(f"   État: {etat}")
        else:
            logger.warning("⚠️ Aucun résultat filtré (filtres peuvent ne pas fonctionner)")
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur filtre: {e}")
        logger.info("   (Les filtres peuvent ne pas fonctionner selon config Vertex AI)")
        logger.info("   → Utiliser filtrage côté application (voir ci-dessous)")
    
    # Test 3 : Filtrage côté application (fallback)
    logger.info("\n" + "=" * 70)
    logger.info("TEST 3 : Filtrage côté application (fallback)")
    logger.info("=" * 70)
    
    try:
        # Recherche globale
        results_all = client.search("contrat", page_size=50)
        
        # Filtrer côté application (NOUVEAU FORMAT : champs directs)
        code_civil_results = [
            r for r in results_all 
            if (r.get('code_id') or r.get('metadata', {}).get('code_id')) == 'LEGITEXT000006070721'
        ]
        
        vigueur_results = [
            r for r in results_all 
            if (r.get('etat') or r.get('metadata', {}).get('etat')) == 'VIGUEUR'
        ]
        
        logger.info(f"✅ Recherche globale: {len(results_all)} résultats")
        logger.info(f"✅ Filtré Code Civil: {len(code_civil_results)} résultats")
        logger.info(f"✅ Filtré en vigueur: {len(vigueur_results)} résultats")
        
        if code_civil_results:
            logger.info("\n   Exemples Code Civil:")
            for i, doc in enumerate(code_civil_results[:3], 1):
                article_num = doc.get('article_num') or doc.get('metadata', {}).get('article_num', 'N/A')
                logger.info(f"   {i}. Article {article_num} - {doc.get('title', 'N/A')}")
    
    except Exception as e:
        logger.error(f"❌ Erreur filtrage: {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    # Test 4 : Vérifier les types de documents
    logger.info("\n" + "=" * 70)
    logger.info("TEST 4 : Vérification des types de documents")
    logger.info("=" * 70)
    
    try:
        results_all = client.search("majorité", page_size=20)
        
        # Extraire les types
        types_found = {}
        codes_found = set()
        
        for doc in results_all:
            # NOUVEAU FORMAT : Champs directs
            doc_type = doc.get('type') or doc.get('metadata', {}).get('type', 'unknown')
            code_id = doc.get('code_id') or doc.get('metadata', {}).get('code_id', 'unknown')
            
            types_found[doc_type] = types_found.get(doc_type, 0) + 1
            if code_id != 'unknown':
                codes_found.add(code_id)
        
        logger.info(f"✅ Types de documents trouvés:")
        for doc_type, count in types_found.items():
            logger.info(f"   - {doc_type}: {count}")
        
        logger.info(f"✅ Codes trouvés: {len(codes_found)}")
        for code_id in codes_found:
            logger.info(f"   - {code_id}")
    
    except Exception as e:
        logger.error(f"❌ Erreur vérification types: {e}")
    
    logger.info("\n" + "=" * 70)
    logger.info("✅ Tests terminés")
    logger.info("=" * 70)


if __name__ == "__main__":
    test_search()

