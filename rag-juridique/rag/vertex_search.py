"""
Module d'intégration avec Google Vertex AI Search
Permet d'effectuer des recherches sémantiques dans le corpus juridique
"""

from typing import Any

from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1 as discoveryengine

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class VertexSearchClient:
    """
    Client pour interagir avec Vertex AI Search (Discovery Engine)
    
    Fonctionnalités:
    - Recherche sémantique dans les documents juridiques
    - Filtrage par métadonnées
    - Support du grounding (citations sources)
    """
    
    def __init__(
        self,
        project_id: str | None = None,
        location: str | None = None,
        datastore_id: str | None = None,
    ):
        """
        Initialise le client Vertex AI Search
        
        Args:
            project_id: ID du projet GCP (défaut: depuis settings)
            location: Location du data store (défaut: depuis settings)
            datastore_id: ID du Data Store (défaut: depuis settings)
        """
        self.project_id = project_id or settings.GCP_PROJECT_ID
        self.location = location or settings.GCP_LOCATION
        self.datastore_id = datastore_id or settings.GCP_DATASTORE_ID
        
        if not self.project_id or not self.datastore_id:
            raise ValueError(
                "project_id et datastore_id doivent être définis "
                "(dans .env ou en paramètres)"
            )
        
        # Initialisation du client Discovery Engine
        client_options = ClientOptions(
            api_endpoint=f"{self.location}-discoveryengine.googleapis.com"
            if self.location != "global"
            else "discoveryengine.googleapis.com"
        )
        
        self.client = discoveryengine.SearchServiceClient(
            client_options=client_options
        )
        
        # Construction du serving config path
        self.serving_config = self.client.serving_config_path(
            project=self.project_id,
            location=self.location,
            data_store=self.datastore_id,
            serving_config="default_config",
        )
        
        logger.info(f"✅ VertexSearchClient initialisé pour data store {self.datastore_id}")
    
    def search(
        self,
        query: str,
        page_size: int = 10,
        filter_expression: str = "",
        order_by: str = "",
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Effectue une recherche sémantique
        
        Args:
            query: Question ou requête en langage naturel
            page_size: Nombre de résultats à retourner (max 100)
            filter_expression: Filtres sur métadonnées (ex: "etat='VIGUEUR'")
            order_by: Tri des résultats (ex: "date_debut DESC")
            **kwargs: Arguments additionnels pour l'API
        
        Returns:
            Liste de documents trouvés avec leurs métadonnées
        
        Exemple:
            >>> client = VertexSearchClient()
            >>> results = client.search("Qu'est-ce qu'un contrat ?")
            >>> for doc in results:
            >>>     print(doc['title'], doc['content'][:100])
        """
        logger.info(f"🔍 Recherche: '{query}'")
        
        # Construction de la requête
        request = discoveryengine.SearchRequest(
            serving_config=self.serving_config,
            query=query,
            page_size=page_size,
            filter=filter_expression,
            order_by=order_by,
            **kwargs,
        )
        
        try:
            # Exécution de la recherche
            response = self.client.search(request)
            
            # Extraction des résultats
            results = []
            for result in response.results:
                doc_data = self._extract_document_data(result)
                if doc_data:
                    results.append(doc_data)
            
            logger.success(f"✅ {len(results)} résultats trouvés")
            return results
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la recherche: {e}")
            raise
    
    def search_with_answer(
        self,
        query: str,
        page_size: int = 10,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Recherche avec génération de réponse par LLM
        
        Args:
            query: Question en langage naturel
            page_size: Nombre de résultats sources
            **kwargs: Arguments additionnels
        
        Returns:
            Dict contenant:
            - answer: Réponse générée par le LLM
            - sources: Documents sources utilisés
            - grounding: Citations et références
        """
        logger.info(f"🤖 Recherche avec réponse LLM: '{query}'")
        
        # TODO: Implémenter la génération de réponse avec Gemini
        # Cette fonctionnalité nécessite l'activation de l'AI Mode dans Vertex AI
        
        raise NotImplementedError(
            "La génération de réponse nécessite l'activation de l'AI Mode. "
            "Utilisez search() pour le moment."
        )
    
    def _extract_document_data(self, result: Any) -> dict[str, Any] | None:
        """
        Extrait les données d'un résultat de recherche
        
        Supporte deux formats :
        1. NOUVEAU FORMAT : Champs directs (content, title, métadonnées)
        2. ANCIEN FORMAT : jsonData (string JSON) - pour compatibilité
        
        Args:
            result: Objet SearchResult de l'API
        
        Returns:
            Dict avec le contenu et les métadonnées, ou None si erreur
        """
        try:
            import json
            document = result.document
            struct_data = document.struct_data
            
            # NOUVEAU FORMAT : Champs directs (pour embeddings)
            if "content" in struct_data:
                # Format avec champs directs
                doc_data = {
                    "id": document.id,
                    "score": getattr(result, "relevance_score", None),
                    "content": struct_data.get("content", ""),
                    "title": struct_data.get("title", ""),
                    "metadata": {
                        "code_id": struct_data.get("code_id", ""),
                        "code_name": struct_data.get("code_name", ""),
                        "type": struct_data.get("type", ""),
                        "article_num": struct_data.get("article_num", ""),
                        "etat": struct_data.get("etat", ""),
                        "date_debut": struct_data.get("date_debut", ""),
                        "date_fin": struct_data.get("date_fin", ""),
                        "breadcrumb": struct_data.get("breadcrumb", ""),
                        "source": struct_data.get("source", ""),
                    }
                }
                return doc_data
            
            # ANCIEN FORMAT : jsonData (compatibilité)
            elif "jsonData" in struct_data:
                json_string = struct_data["jsonData"]
                json_data = json.loads(json_string)
                
                doc_data = {
                    "id": document.id,
                    "score": getattr(result, "relevance_score", None),
                    "content": json_data.get("content", ""),
                    "title": json_data.get("title", ""),
                    "metadata": json_data.get("metadata", {}),
                }
                return doc_data
            
            # Fallback : utiliser struct_data directement
            else:
                doc_data = {
                    "id": document.id,
                    "score": getattr(result, "relevance_score", None),
                    "content": struct_data.get("content", ""),
                    "title": struct_data.get("title", ""),
                    "metadata": dict(struct_data),
                }
            return doc_data
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur extraction document: {e}")
            logger.debug(f"Document struct_data: {dict(document.struct_data)}")
            return None
    
    def filter_by_metadata(
        self,
        query: str,
        code_id: str | None = None,
        etat: str | None = None,
        date_debut_min: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Recherche avec filtres sur métadonnées
        
        NOUVEAU FORMAT : Les métadonnées sont en champs directs, donc les filtres
        Vertex AI devraient fonctionner (code_id, etat, etc.)
        
        Args:
            query: Requête de recherche
            code_id: Filtrer par code (ex: "LEGITEXT000006070721")
            etat: Filtrer par état (ex: "VIGUEUR")
            date_debut_min: Date minimum (format: "YYYY-MM-DD")
            **kwargs: Autres filtres personnalisés
        
        Returns:
            Liste de documents filtrés
        
        Exemple:
            >>> results = client.filter_by_metadata(
            ...     query="contrat",
            ...     code_id="LEGITEXT000006070721",
            ...     etat="VIGUEUR"
            ... )
        """
        # Construction de l'expression de filtre
        # NOUVEAU FORMAT : Métadonnées en champs directs (code_id, etat, etc.)
        filters = []
        
        if code_id:
            # Nouveau format : champ direct (pas metadata.code_id)
            filters.append(f'code_id="{code_id}"')
        
        if etat:
            # Nouveau format : champ direct
            filters.append(f'etat="{etat}"')
        
        if date_debut_min:
            # Nouveau format : champ direct
            filters.append(f'date_debut>="{date_debut_min}"')
        
        # Filtres personnalisés additionnels
        for key, value in kwargs.items():
            # Nouveau format : champ direct
            filters.append(f'{key}="{value}"')
        
        filter_expression = " AND ".join(filters) if filters else ""
        
        logger.info(f"🔍 Filtre appliqué: {filter_expression}")
        
        return self.search(query=query, filter_expression=filter_expression)


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================


def quick_search(query: str, top_k: int = 5) -> list[dict[str, Any]]:
    """
    Fonction rapide pour effectuer une recherche simple
    
    Args:
        query: Question ou requête
        top_k: Nombre de résultats
    
    Returns:
        Liste des top_k meilleurs résultats
    """
    client = VertexSearchClient()
    return client.search(query, page_size=top_k)


def search_articles_vigueur(query: str, code_id: str) -> list[dict[str, Any]]:
    """
    Recherche uniquement dans les articles en vigueur d'un code spécifique
    
    Args:
        query: Requête de recherche
        code_id: ID du code juridique
    
    Returns:
        Articles en vigueur correspondants
    """
    client = VertexSearchClient()
    return client.filter_by_metadata(
        query=query,
        code_id=code_id,
        etat="VIGUEUR"
    )


# ============================================================================
# SCRIPT DE TEST
# ============================================================================

if __name__ == "__main__":
    """Test du module avec quelques requêtes"""
    
    logger.info("=" * 70)
    logger.info("🧪 TEST DE VERTEX AI SEARCH")
    logger.info("=" * 70)
    
    # Initialisation
    client = VertexSearchClient()
    
    # Test 1: Recherche simple
    logger.info("\n📝 Test 1: Recherche simple")
    results = client.search("Qu'est-ce qu'un contrat ?", page_size=3)
    
    for i, doc in enumerate(results, 1):
        logger.info(f"\n{i}. {doc['title']}")
        logger.info(f"   Score: {doc['score']}")
        logger.info(f"   Contenu: {doc['content'][:100]}...")
        logger.info(f"   Breadcrumb: {doc['metadata'].get('breadcrumb', 'N/A')}")
    
    # Test 2: Recherche avec filtre
    logger.info("\n📝 Test 2: Recherche avec filtre (Code Civil en vigueur)")
    results_filtered = client.filter_by_metadata(
        query="majorité",
        code_id="LEGITEXT000006070721",
        etat="VIGUEUR"
    )
    
    logger.info(f"✅ {len(results_filtered)} articles trouvés")
    
    logger.info("\n" + "=" * 70)
    logger.info("✅ Tests terminés")
    logger.info("=" * 70)
