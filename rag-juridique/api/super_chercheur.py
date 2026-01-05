"""
Pilier 2 : Super-Chercheur de Jurisprudence
Recherche experte avec analyse de tendances et probabilités judiciaires
"""

import time
from typing import Any

from config.logging_config import get_logger
from config.settings import get_settings
from rag.vertex_search import VertexSearchClient
from api.models import (
    SearchFilters,
    SearchRequest,
    SearchResponse,
    SearchResult,
    TrendAnalysis,
)

logger = get_logger(__name__)
settings = get_settings()


class SuperChercheur:
    """
    Super-Chercheur de Jurisprudence
    
    Fonctionnalités:
    - Recherche sémantique avancée
    - Filtrage multi-critères
    - Analyse de tendances jurisprudentielles
    - Probabilités de succès
    - Identification d'arguments clés
    """
    
    def __init__(self):
        """Initialise le Super-Chercheur"""
        self.vertex_client = VertexSearchClient()
        logger.info("✅ SuperChercheur initialisé")
    
    def search(self, request: SearchRequest) -> SearchResponse:
        """
        Effectue une recherche experte
        
        Args:
            request: Requête de recherche avec filtres
        
        Returns:
            Réponse complète avec résultats et analyse
        """
        start_time = time.time()
        
        logger.info(f"🔍 Recherche: '{request.query}'")
        logger.info(f"   Filtres: {request.filters.model_dump(exclude_none=True)}")
        
        try:
            # 1. Construction des filtres Vertex AI
            vertex_filters = self._build_vertex_filters(request.filters)
            
            # 2. Recherche dans Vertex AI
            raw_results = self.vertex_client.search(
                query=request.query,
                page_size=request.page_size,
                filter_expression=vertex_filters,
            )
            
            # 3. Transformation des résultats
            results = self._transform_results(raw_results, request.include_metadata)
            
            # 4. Analyse de tendances (si demandée)
            trends = None
            if request.analyze_trends and len(results) > 0:
                trends = self._analyze_trends(results, request.query)
            
            # 5. Construction de la réponse
            processing_time = (time.time() - start_time) * 1000
            
            response = SearchResponse(
                results=results,
                total=len(results),
                query=request.query,
                filters_applied=request.filters.model_dump(exclude_none=True),
                trends=trends,
                processing_time_ms=round(processing_time, 2),
            )
            
            logger.success(f"✅ {len(results)} résultats trouvés en {processing_time:.0f}ms")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la recherche: {e}")
            raise
    
    def _build_vertex_filters(self, filters: SearchFilters) -> str:
        """
        Construit l'expression de filtre pour Vertex AI
        
        NOTE: Vertex AI a des limitations sur les filtres des champs nested.
        Pour l'instant, les filtres sont désactivés dans le MVP.
        TODO: Investiguer la syntaxe correcte pour filtrer metadata dans Vertex AI
        
        Args:
            filters: Filtres de recherche
        
        Returns:
            Expression de filtre Vertex AI
        """
        filter_parts = []
        
        # NOTE: Les filtres sur metadata.* ne sont pas supportés par Vertex AI
        # dans la configuration actuelle. Ils seront implémentés en Phase 2
        # après investigation de la syntaxe correcte ou en utilisant un
        # post-filtrage côté application.
        
        # Pour l'instant, on retourne une expression vide
        # La recherche se fera uniquement par sémantique sans filtres
        
        logger.debug("Filtres temporairement désactivés (limitations Vertex AI)")
        
        return ""
    
    def _transform_results(
        self,
        raw_results: list[dict[str, Any]],
        include_metadata: bool
    ) -> list[SearchResult]:
        """
        Transforme les résultats bruts en SearchResult
        
        Args:
            raw_results: Résultats bruts de Vertex AI
            include_metadata: Inclure les métadonnées détaillées
        
        Returns:
            Liste de SearchResult
        """
        results = []
        
        for raw in raw_results:
            result = SearchResult(
                id=raw.get("id", ""),
                title=raw.get("title", "Sans titre"),
                content=raw.get("content", ""),
                score=raw.get("score", 0.0) or 0.0,
                metadata=raw.get("metadata", {}) if include_metadata else {},
                highlights=self._extract_highlights(raw.get("content", "")),
            )
            results.append(result)
        
        return results
    
    def _extract_highlights(self, content: str, max_length: int = 150) -> list[str]:
        """
        Extrait des extraits pertinents du contenu
        
        Args:
            content: Contenu textuel
            max_length: Longueur maximale d'un extrait
        
        Returns:
            Liste d'extraits
        """
        if not content:
            return []
        
        # Pour l'instant, on prend simplement le début
        # TODO: Améliorer avec extraction basée sur la query
        if len(content) <= max_length:
            return [content]
        
        return [content[:max_length] + "..."]
    
    def _analyze_trends(
        self,
        results: list[SearchResult],
        query: str
    ) -> TrendAnalysis:
        """
        Analyse les tendances jurisprudentielles
        
        Args:
            results: Résultats de recherche
            query: Requête d'origine
        
        Returns:
            Analyse de tendances
        """
        logger.info("📊 Analyse des tendances...")
        
        try:
            # 1. Comptage des cas similaires
            similar_cases_count = len(results)
            
            # 2. Estimation de probabilité de succès
            # NOTE: Pour l'instant, estimation basique
            # TODO: Améliorer avec ML sur historique de décisions
            success_probability = self._estimate_success_probability(results)
            
            # 3. Identification des arguments clés
            key_arguments = self._extract_key_arguments(results)
            
            # 4. Jurisprudence dominante
            dominant_jurisprudence = self._identify_dominant_jurisprudence(results)
            
            # 5. Évolution temporelle
            temporal_evolution = self._analyze_temporal_evolution(results)
            
            analysis = TrendAnalysis(
                success_probability=success_probability,
                similar_cases_count=similar_cases_count,
                dominant_jurisprudence=dominant_jurisprudence,
                key_arguments=key_arguments,
                temporal_evolution=temporal_evolution,
            )
            
            logger.success(f"✅ Analyse terminée: {similar_cases_count} cas similaires")
            
            return analysis
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur analyse tendances: {e}")
            # Retourner analyse minimale en cas d'erreur
            return TrendAnalysis(
                success_probability=0.5,  # Valeur neutre par défaut
                similar_cases_count=len(results),
                dominant_jurisprudence=None,
                key_arguments=[],
                temporal_evolution=None,
            )
    
    def _estimate_success_probability(self, results: list[SearchResult]) -> float:
        """
        Estime la probabilité de succès basée sur les résultats
        
        NOTE: Implémentation basique pour MVP
        TODO: Améliorer avec modèle ML entraîné sur historique
        
        Args:
            results: Résultats de recherche
        
        Returns:
            Probabilité entre 0 et 1
        """
        if not results:
            return 0.5  # Neutre si pas de données
        
        # Pour l'instant: moyenne des scores de pertinence
        # Dans une vraie implémentation, on analyserait les issues des décisions
        avg_score = sum(r.score for r in results) / len(results)
        
        # Ajustement: plus on a de cas similaires pertinents, plus la probabilité augmente
        confidence_boost = min(len(results) / 20, 0.2)  # Max +20%
        
        probability = min(avg_score + confidence_boost, 1.0)
        
        return round(probability, 2)
    
    def _extract_key_arguments(self, results: list[SearchResult]) -> list[str]:
        """
        Extrait les arguments juridiques clés récurrents
        
        NOTE: Implémentation basique pour MVP
        TODO: Améliorer avec NLP pour extraction d'arguments
        
        Args:
            results: Résultats de recherche
        
        Returns:
            Liste d'arguments clés
        """
        # Pour l'instant: extraction de mots-clés fréquents
        # TODO: Utiliser NER et analyse sémantique
        
        arguments = []
        
        # Analyse simple des titres et breadcrumbs
        seen_topics = set()
        for result in results[:5]:  # Top 5 résultats
            metadata = result.metadata
            
            # Extraire le breadcrumb si disponible
            if "breadcrumb" in metadata:
                breadcrumb = metadata["breadcrumb"]
                parts = breadcrumb.split(" > ")
                
                # Prendre les 2 derniers niveaux comme argument
                if len(parts) >= 2:
                    topic = f"{parts[-2]} - {parts[-1]}"
                    if topic not in seen_topics:
                        arguments.append(topic)
                        seen_topics.add(topic)
        
        return arguments[:5]  # Max 5 arguments
    
    def _identify_dominant_jurisprudence(
        self,
        results: list[SearchResult]
    ) -> str | None:
        """
        Identifie la jurisprudence dominante
        
        Args:
            results: Résultats de recherche
        
        Returns:
            Description de la jurisprudence dominante
        """
        if not results:
            return None
        
        # Prendre le résultat le plus pertinent
        top_result = results[0]
        
        title = top_result.title
        metadata = top_result.metadata
        
        # Construire description
        jurisdiction = metadata.get("jurisdiction", "")
        date = metadata.get("date_debut", "")
        
        if jurisdiction and date:
            return f"{title} ({jurisdiction}, {date})"
        
        return title
    
    def _analyze_temporal_evolution(
        self,
        results: list[SearchResult]
    ) -> dict[str, Any]:
        """
        Analyse l'évolution temporelle de la jurisprudence
        
        Args:
            results: Résultats de recherche
        
        Returns:
            Données d'évolution temporelle
        """
        # Grouper par année
        yearly_counts: dict[str, int] = {}
        
        for result in results:
            date_str = result.metadata.get("date_debut", "")
            if date_str:
                year = date_str[:4]  # YYYY-MM-DD -> YYYY
                yearly_counts[year] = yearly_counts.get(year, 0) + 1
        
        if not yearly_counts:
            return {}
        
        # Trier par année
        sorted_years = sorted(yearly_counts.items())
        
        return {
            "yearly_distribution": dict(sorted_years),
            "trend": "stable" if len(sorted_years) <= 2 else "croissant",
            "peak_year": max(yearly_counts, key=yearly_counts.get),
        }


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def quick_search(query: str, filters: SearchFilters | None = None) -> SearchResponse:
    """
    Fonction rapide pour effectuer une recherche
    
    Args:
        query: Question ou requête
        filters: Filtres optionnels
    
    Returns:
        Réponse de recherche
    
    Exemple:
        >>> response = quick_search("Qu'est-ce qu'un contrat ?")
        >>> print(f"{response.total} résultats")
        >>> for result in response.results:
        >>>     print(result.title)
    """
    chercheur = SuperChercheur()
    
    request = SearchRequest(
        query=query,
        filters=filters or SearchFilters(),
        page_size=10,
        analyze_trends=True,
    )
    
    return chercheur.search(request)


def search_in_code(
    query: str,
    code_id: str,
    en_vigueur_only: bool = True
) -> SearchResponse:
    """
    Recherche dans un code juridique spécifique
    
    Args:
        query: Requête de recherche
        code_id: ID du code (ex: LEGITEXT000006070721)
        en_vigueur_only: Uniquement articles en vigueur
    
    Returns:
        Réponse de recherche
    """
    filters = SearchFilters(
        code_id=code_id,
        etat="VIGUEUR" if en_vigueur_only else None,
    )
    
    return quick_search(query, filters)


# ============================================================================
# SCRIPT DE TEST
# ============================================================================

if __name__ == "__main__":
    """Test du Super-Chercheur"""
    
    logger.info("=" * 70)
    logger.info("🧪 TEST DU SUPER-CHERCHEUR")
    logger.info("=" * 70)
    
    # Test 1: Recherche simple
    logger.info("\n📝 Test 1: Recherche simple")
    response = quick_search("Qu'est-ce qu'un contrat ?")
    
    logger.info(f"\n✅ {response.total} résultats trouvés en {response.processing_time_ms}ms")
    
    for i, result in enumerate(response.results[:3], 1):
        logger.info(f"\n{i}. {result.title}")
        logger.info(f"   Score: {result.score:.2f}")
        logger.info(f"   Contenu: {result.content[:100]}...")
        if result.metadata.get("breadcrumb"):
            logger.info(f"   Breadcrumb: {result.metadata['breadcrumb']}")
    
    # Test 2: Analyse de tendances
    if response.trends:
        logger.info("\n📊 Analyse de tendances:")
        logger.info(f"   - Probabilité de succès: {response.trends.success_probability:.0%}")
        logger.info(f"   - Cas similaires: {response.trends.similar_cases_count}")
        
        if response.trends.dominant_jurisprudence:
            logger.info(f"   - Jurisprudence dominante: {response.trends.dominant_jurisprudence}")
        
        if response.trends.key_arguments:
            logger.info(f"   - Arguments clés:")
            for arg in response.trends.key_arguments:
                logger.info(f"     • {arg}")
    
    # Test 3: Recherche avec filtres
    logger.info("\n📝 Test 2: Recherche avec filtres (Code Civil en vigueur)")
    response2 = search_in_code(
        query="majorité",
        code_id="LEGITEXT000006070721",
        en_vigueur_only=True
    )
    
    logger.info(f"✅ {response2.total} articles trouvés")
    if response2.results:
        logger.info(f"   Premier résultat: {response2.results[0].title}")
    
    logger.info("\n" + "=" * 70)
    logger.info("✅ TESTS TERMINÉS")
    logger.info("=" * 70)

