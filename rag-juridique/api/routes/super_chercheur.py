"""
Routes pour le Pilier 2 : Super-Chercheur de Jurisprudence

Endpoints pour la recherche sémantique avancée de jurisprudence.
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from api.models import SearchRequest, SearchResponse
from api.super_chercheur import SuperChercheur

router = APIRouter()

# Instance du service
chercheur = SuperChercheur()


@router.post("/", response_model=SearchResponse)
async def search_jurisprudence(request: SearchRequest):
    """
    Recherche sémantique de jurisprudence
    
    Args:
        request: Requête de recherche avec filtres
    
    Returns:
        Résultats de recherche avec analyses
    
    Example:
        ```json
        {
          "query": "responsabilité contractuelle non-respect des délais",
          "jurisdiction": "civil",
          "legal_matter": "contract",
          "max_results": 10
        }
        ```
    """
    try:
        logger.info(f"🔍 Recherche: \"{request.query}\"")
        result = chercheur.search(request)
        logger.success(f"✅ {len(result.results)} résultat(s) trouvé(s)")
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur de recherche : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Vérifie que le service de recherche fonctionne"""
    return {
        "status": "healthy",
        "service": "Super-Chercheur",
        "vertex_search_configured": chercheur.search_client is not None
    }

