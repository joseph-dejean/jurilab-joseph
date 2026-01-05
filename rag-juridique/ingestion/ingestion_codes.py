"""
Script d'ingestion des codes juridiques depuis l'API PISTE (Légifrance)

Fonctionnalités :
- Extraction complète d'un code (ex: Code Civil)
- Checkpointing automatique (reprise en cas d'interruption)
- Respect des limites API (rate limiting, retry avec backoff)
- Format d'export JSONL compatible Vertex AI Search
- Préservation de la hiérarchie (Livre > Titre > Chapitre > Section > Article)
"""

import json
import time
from pathlib import Path
from typing import Any, Optional

from pylegifrance import LegifranceClient, ApiConfig
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from tqdm import tqdm

from config.logging_config import get_logger
from config.settings import get_settings
from ingestion.checkpointer import Checkpointer

logger = get_logger(__name__)
settings = get_settings()


class CodeIngester:
    """
    Gère l'ingestion complète d'un code juridique
    
    Usage:
        >>> ingester = CodeIngester("LEGITEXT000006070721")  # Code Civil
        >>> ingester.run()
    """
    
    def __init__(self, code_id: str):
        """
        Args:
            code_id: Identifiant Légifrance du code (ex: LEGITEXT000006070721)
        """
        self.code_id = code_id
        self.checkpointer = Checkpointer(code_id)
        self.logger = logger.bind(code_id=code_id)
        
        # Vérification des credentials
        if not settings.PISTE_CLIENT_ID or not settings.PISTE_CLIENT_SECRET:
            raise ValueError(
                "❌ Credentials PISTE manquants ! "
                "Configurez PISTE_CLIENT_ID et PISTE_CLIENT_SECRET dans .env"
            )
        
        # Initialisation de l'API Légifrance
        config = ApiConfig(
            client_id=settings.PISTE_CLIENT_ID,
            client_secret=settings.PISTE_CLIENT_SECRET,
        )
        self.api = LegifranceClient(config=config)
        
        self.logger.info(f"✅ Ingester initialisé pour le code {code_id}")
    
    def run(self, force_restart: bool = False) -> None:
        """
        Lance l'ingestion complète du code
        
        Args:
            force_restart: Si True, ignore le checkpoint et recommence depuis zéro
        """
        self.logger.info("=" * 70)
        self.logger.info(f"🚀 DÉMARRAGE INGESTION CODE : {self.code_id}")
        self.logger.info("=" * 70)
        
        # Gestion du checkpoint
        if force_restart:
            self.checkpointer.reset()
            self.logger.warning("🔄 Mode force_restart : checkpoint supprimé")
        
        state = self.checkpointer.load()
        
        if state["completed"]:
            self.logger.success(f"✅ Ingestion déjà complétée pour {self.code_id}")
            self.logger.info("💡 Utilisez force_restart=True pour recommencer")
            return
        
        try:
            # Étape 1 : Récupération de la structure du code
            self.logger.info("📥 Récupération de la structure du code...")
            code_structure = self._fetch_code_structure()
            
            # Étape 2 : Extraction des articles
            self.logger.info("📄 Extraction des articles...")
            articles = self._extract_all_articles(code_structure, state)
            
            # Étape 3 : Export au format JSONL pour Vertex AI
            self.logger.info("💾 Export au format JSONL...")
            self._export_to_jsonl(articles)
            
            # Marquer comme terminé
            self.checkpointer.mark_completed()
            
            self.logger.success("=" * 70)
            self.logger.success(f"✅ INGESTION TERMINÉE : {len(articles)} articles extraits")
            self.logger.success("=" * 70)
        
        except KeyboardInterrupt:
            self.logger.warning("⚠️  Interruption manuelle (Ctrl+C)")
            self.logger.info("💡 Relancez le script pour reprendre où vous vous étiez arrêté")
        
        except Exception as e:
            self.logger.error(f"❌ Erreur fatale : {e}")
            self.logger.exception("Détails de l'erreur :")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    )
    def _fetch_code_structure(self) -> Any:
        """
        Récupère la structure complète du code depuis l'API
        
        Returns:
            Objet Code contenant toute la hiérarchie
        """
        try:
            code = self.api.consult_code(self.code_id)
            self.logger.success(f"✅ Structure récupérée : {code.titre}")
            return code
        
        except Exception as e:
            self.logger.error(f"❌ Erreur lors de la récupération du code : {e}")
            raise
    
    def _extract_all_articles(
        self,
        code_structure: Any,
        state: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """
        Extrait tous les articles du code avec leur hiérarchie
        
        Args:
            code_structure: Structure du code récupérée
            state: État du checkpoint
        
        Returns:
            Liste de dictionnaires contenant les articles enrichis
        """
        articles = []
        processed_count = state["processed_count"]
        error_count = state["error_count"]
        last_article_id = state.get("last_article_id")
        
        # Identifier si on doit reprendre depuis un checkpoint
        skip_until_found = last_article_id is not None
        
        self.logger.info("🔍 Démarrage de l'extraction des articles...")
        if skip_until_found:
            self.logger.info(f"📍 Reprise depuis l'article : {last_article_id}")
        
        # Explorer la structure de l'objet Code pour trouver les articles
        structure_attrs = self._identify_structure_attributes(code_structure)
        
        self.logger.info(f"📊 Structure identifiée : {structure_attrs}")
        
        # Extraire récursivement les articles
        try:
            articles = self._extract_articles_recursive(
                node=code_structure,
                breadcrumb=[code_structure.titre if hasattr(code_structure, 'titre') else self.code_id],
                articles_list=articles,
                skip_until_id=last_article_id,
                processed_count_ref=[processed_count],
                error_count_ref=[error_count],
            )
        except Exception as e:
            self.logger.error(f"❌ Erreur lors de l'extraction : {e}")
            raise
        
        self.logger.success(f"✅ {len(articles)} articles extraits au total")
        
        return articles
    
    def _identify_structure_attributes(self, obj: Any) -> dict[str, str]:
        """
        Identifie les attributs de structure dans l'objet
        
        Returns:
            Dict avec les noms des attributs trouvés (articles, sections, etc.)
        """
        structure = {}
        
        # Attributs possibles pour la hiérarchie
        candidates = {
            'articles': ['articles', 'article'],
            'sections': ['sections', 'section'],
            'chapitres': ['chapitres', 'chapitre'],
            'titres': ['titres', 'titre'],
            'livres': ['livres', 'livre'],
            'parties': ['parties', 'partie'],
            'children': ['children', 'enfants', 'contenus'],
        }
        
        for category, names in candidates.items():
            for name in names:
                if hasattr(obj, name):
                    attr_value = getattr(obj, name)
                    if isinstance(attr_value, list) and len(attr_value) > 0:
                        structure[category] = name
                        break
        
        return structure
    
    def _extract_articles_recursive(
        self,
        node: Any,
        breadcrumb: list[str],
        articles_list: list[dict],
        skip_until_id: Optional[str],
        processed_count_ref: list[int],
        error_count_ref: list[int],
    ) -> list[dict]:
        """
        Parcourt récursivement la structure pour extraire les articles
        
        Args:
            node: Nœud actuel (Code, Livre, Titre, Chapitre, Section, ou Article)
            breadcrumb: Fil d'Ariane actuel
            articles_list: Liste des articles (modifiée en place)
            skip_until_id: ID de l'article où reprendre (checkpoint)
            processed_count_ref: Compteur d'articles traités (référence)
            error_count_ref: Compteur d'erreurs (référence)
        """
        # Si c'est un article, l'extraire
        if self._is_article(node):
            article_id = self._get_article_id(node)
            
            # Skip jusqu'à retrouver l'article du checkpoint
            if skip_until_id and article_id != skip_until_id:
                return articles_list
            elif skip_until_id and article_id == skip_until_id:
                self.logger.info(f"✅ Checkpoint retrouvé : {article_id}")
                skip_until_id = None  # Reprendre l'extraction normale
                return articles_list
            
            try:
                # Extraire le contenu et les métadonnées
                content = self._get_article_content(node)
                title = self._get_article_title(node)
                metadata = self._extract_article_metadata(node, breadcrumb)
                
                # Formater pour Vertex AI
                formatted = self._format_for_vertex_ai(
                    article_id=article_id,
                    content=content,
                    title=title,
                    metadata=metadata
                )
                
                articles_list.append(formatted)
                processed_count_ref[0] += 1
                
                # Checkpoint périodique
                if processed_count_ref[0] % settings.CHECKPOINT_INTERVAL == 0:
                    self.checkpointer.save(
                        last_article_id=article_id,
                        processed_count=processed_count_ref[0],
                        error_count=error_count_ref[0],
                    )
                    self.logger.info(f"💾 Checkpoint : {processed_count_ref[0]} articles")
                
                # Rate limiting
                time.sleep(settings.RATE_LIMIT_DELAY)
            
            except Exception as e:
                self.logger.error(f"❌ Erreur sur l'article {article_id} : {e}")
                error_count_ref[0] += 1
        
        # Sinon, c'est un conteneur → parcourir les enfants
        else:
            children = self._get_children(node)
            
            # Ajouter le titre du nœud au breadcrumb
            node_title = self._get_node_title(node)
            if node_title and node_title not in breadcrumb:
                breadcrumb = breadcrumb + [node_title]
            
            # Parcourir récursivement les enfants
            for child in children:
                self._extract_articles_recursive(
                    node=child,
                    breadcrumb=breadcrumb,
                    articles_list=articles_list,
                    skip_until_id=skip_until_id,
                    processed_count_ref=processed_count_ref,
                    error_count_ref=error_count_ref,
                )
        
        return articles_list
    
    def _is_article(self, node: Any) -> bool:
        """Détermine si le nœud est un article"""
        # Stratégies pour identifier un article
        return (
            hasattr(node, 'num') or 
            hasattr(node, 'article') or
            type(node).__name__ in ['Article', 'ArticleCode'] or
            (hasattr(node, 'nature') and getattr(node, 'nature') == 'ARTICLE')
        )
    
    def _get_children(self, node: Any) -> list[Any]:
        """Récupère les enfants d'un nœud"""
        # Essayer différents attributs possibles
        for attr in ['articles', 'sections', 'chapitres', 'titres', 'livres', 'parties', 'children', 'contenus']:
            if hasattr(node, attr):
                value = getattr(node, attr)
                if isinstance(value, list):
                    return value
        return []
    
    def _get_node_title(self, node: Any) -> Optional[str]:
        """Récupère le titre d'un nœud"""
        for attr in ['titre', 'title', 'intitule', 'nom', 'name']:
            if hasattr(node, attr):
                value = getattr(node, attr)
                if isinstance(value, str):
                    return value
        return None
    
    def _get_article_id(self, article: Any) -> str:
        """Récupère l'ID d'un article"""
        for attr in ['id', 'cid', 'article_id']:
            if hasattr(article, attr):
                return str(getattr(article, attr))
        return f"unknown_{id(article)}"
    
    def _get_article_content(self, article: Any) -> str:
        """Récupère le contenu textuel d'un article"""
        for attr in ['texte', 'content', 'contenu', 'text']:
            if hasattr(article, attr):
                content = getattr(article, attr)
                if isinstance(content, str):
                    return content
        return ""
    
    def _get_article_title(self, article: Any) -> str:
        """Récupère le titre/numéro d'un article"""
        if hasattr(article, 'num'):
            return f"Article {getattr(article, 'num')}"
        elif hasattr(article, 'titre'):
            return getattr(article, 'titre')
        return "Article sans numéro"
    
    def _extract_article_metadata(
        self,
        article: Any,
        breadcrumb: list[str]
    ) -> dict[str, Any]:
        """
        Extrait les métadonnées d'un article
        
        Args:
            article: Objet article de pylegifrance
            breadcrumb: Fil d'Ariane (ex: ["Livre III", "Titre III", "Chapitre I"])
        
        Returns:
            Dictionnaire de métadonnées structurées
        """
        # Helper pour extraire un attribut de manière sécurisée
        def safe_get(obj, *attrs, default=None):
            for attr in attrs:
                if hasattr(obj, attr):
                    val = getattr(obj, attr)
                    if val is not None:
                        return val
            return default
        
        return {
            "article_id": safe_get(article, "id", "cid"),
            "article_num": safe_get(article, "num", "numero"),
            "breadcrumb": " > ".join(breadcrumb),
            "date_debut": safe_get(article, "date_debut", "dateDebut", "debut_vigueur"),
            "date_fin": safe_get(article, "date_fin", "dateFin", "fin_vigueur"),
            "etat": safe_get(article, "etat", "state", "statut", default="VIGUEUR"),
            "nature": "CODE",
            "source": "Légifrance",
            "code_id": self.code_id,
        }
    
    def _format_for_vertex_ai(
        self,
        article_id: str,
        content: str,
        title: str,
        metadata: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Formate un article au format JSONL pour Vertex AI Search
        
        Args:
            article_id: Identifiant unique de l'article
            content: Texte intégral de l'article
            title: Titre/numéro de l'article
            metadata: Métadonnées additionnelles
        
        Returns:
            Objet JSON conforme au schéma Vertex AI
        """
        # jsonData doit être une STRING JSON, pas un objet
        json_data = {
            "content": content,
            "title": title,
            "metadata": {
                **metadata,
                "code_id": self.code_id,
                "type": "article_code",
            }
        }
        
        return {
            "id": article_id,
            "jsonData": json.dumps(json_data, ensure_ascii=False)  # ✅ STRING JSON
        }
    
    def _export_to_jsonl(self, articles: list[dict[str, Any]]) -> None:
        """
        Exporte les articles au format JSONL pour import Vertex AI
        
        Args:
            articles: Liste des articles formatés
        """
        output_path = settings.get_jsonl_export_path(self.code_id)
        
        with open(output_path, "w", encoding="utf-8") as f:
            for article in articles:
                f.write(json.dumps(article, ensure_ascii=False) + "\n")
        
        self.logger.success(f"💾 Export JSONL : {output_path} ({len(articles)} articles)")


def main():
    """Point d'entrée principal du script"""
    
    # Code Civil par défaut
    CODE_CIVIL_ID = "LEGITEXT000006070721"
    
    logger.info("=" * 70)
    logger.info("🏛️  INGESTION CODE CIVIL - Legal-RAG France")
    logger.info("=" * 70)
    
    try:
        ingester = CodeIngester(CODE_CIVIL_ID)
        ingester.run(force_restart=False)
    
    except ValueError as e:
        logger.error(str(e))
        logger.info("💡 Créez un fichier .env avec vos credentials PISTE")
        logger.info("   Copiez .env.example vers .env et remplissez les valeurs")
        return 1
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

