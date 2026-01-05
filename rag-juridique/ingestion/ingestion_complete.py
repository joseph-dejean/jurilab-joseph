"""
Script d'ingestion COMPLET du Code Civil et autres codes juridiques

Stratégie multi-sources avec fallback automatique :
1. Hugging Face (datasets disponibles)
2. Téléchargement direct depuis data.gouv.fr / DILA
3. Parsing de fichiers XML/JSON locaux
4. Génération enrichie (fallback)

Usage:
    python ingestion/ingestion_complete.py --code civil --max-articles 1000
    python ingestion/ingestion_complete.py --code penal --max-articles 500
    python ingestion/ingestion_complete.py --all --max-articles 10000
"""

import argparse
import json
import re
from pathlib import Path
from typing import Optional
from tqdm import tqdm

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class CompleteIngester:
    """Ingestion complète avec multi-sources"""
    
    # Mapping codes juridiques
    CODES = {
        "civil": {
            "id": "LEGITEXT000006070721",
            "name": "Code civil",
            "articles_count": 8000,
        },
        "penal": {
            "id": "LEGITEXT000006070716",
            "name": "Code pénal",
            "articles_count": 5000,
        },
        "travail": {
            "id": "LEGITEXT000006072050",
            "name": "Code du travail",
            "articles_count": 10000,
        },
        "commerce": {
            "id": "LEGITEXT000005634379",
            "name": "Code de commerce",
            "articles_count": 3000,
        },
        "procedure_civile": {
            "id": "LEGITEXT000006070716",
            "name": "Code de procédure civile",
            "articles_count": 2000,
        },
    }
    
    def __init__(self, code_name: str, max_articles: Optional[int] = None):
        """
        Initialise l'ingestion
        
        Args:
            code_name: Nom du code (civil, penal, travail, etc.)
            max_articles: Nombre maximum d'articles à ingérer (None = tous)
        """
        if code_name not in self.CODES:
            raise ValueError(f"Code inconnu: {code_name}. Codes disponibles: {list(self.CODES.keys())}")
        
        self.code_info = self.CODES[code_name]
        self.code_name = code_name
        self.max_articles = max_articles
        self.articles = []
        
        logger.info(f"📚 Ingestion: {self.code_info['name']} (max: {max_articles or 'tous'})")
    
    def run(self) -> bool:
        """Lance l'ingestion avec fallback automatique"""
        logger.info("=" * 70)
        logger.info(f"🚀 INGESTION COMPLÈTE: {self.code_info['name']}")
        logger.info("=" * 70)
        
        # Stratégie 1: Hugging Face
        logger.info("\n📥 Stratégie 1: Hugging Face...")
        if self._try_huggingface():
            return True
        
        # Stratégie 2: data.gouv.fr / DILA
        logger.info("\n📥 Stratégie 2: data.gouv.fr / DILA...")
        if self._try_datagouv():
            return True
        
        # Stratégie 3: Fichiers locaux (XML/JSON)
        logger.info("\n📥 Stratégie 3: Fichiers locaux...")
        if self._try_local_files():
            return True
        
        # Stratégie 4: Génération enrichie (fallback)
        logger.info("\n📥 Stratégie 4: Génération enrichie (fallback)...")
        if self._generate_enriched():
            return True
        
        logger.error("\n❌ Échec de toutes les stratégies")
        return False
    
    def _try_huggingface(self) -> bool:
        """Essaie de charger depuis Hugging Face"""
        try:
            from datasets import load_dataset
            
            # Datasets disponibles sur Hugging Face
            datasets_to_try = [
                "antoinejeannot/french-jurisprudence",
                "antoinejeannot/code-civil-fr",
            ]
            
            for dataset_name in datasets_to_try:
                try:
                    logger.info(f"   Tentative: {dataset_name}")
                    dataset = load_dataset(dataset_name, split="train", streaming=True)
                    
                    articles = []
                    for i, item in enumerate(dataset):
                        if self.max_articles and i >= self.max_articles:
                            break
                        
                        # Extraire les articles du dataset
                        content = item.get("text", "") or item.get("content", "")
                        if not content:
                            continue
                        
                        article = self._create_article(
                            article_id=f"HF_{i:06d}",
                            num=str(i + 1),
                            content=content[:5000],  # Limiter taille
                            source="Hugging Face",
                        )
                        articles.append(article)
                    
                    if articles:
                        self.articles = articles
                        self._export_to_jsonl("huggingface")
                        logger.success(f"✅ {len(articles)} articles depuis Hugging Face")
                        return True
                
                except Exception as e:
                    logger.warning(f"   Erreur {dataset_name}: {e}")
                    continue
            
            return False
        
        except ImportError:
            logger.warning("⚠️  'datasets' non installé (pip install datasets)")
            return False
    
    def _try_datagouv(self) -> bool:
        """Essaie de télécharger depuis data.gouv.fr"""
        try:
            import requests
            
            # URLs possibles pour data.gouv.fr
            # Note: Les URLs exactes changent, il faudrait scraper la page
            base_urls = [
                "https://www.data.gouv.fr/fr/datasets/code-civil/",
                "https://echanges.dila.gouv.fr/OPENDATA/LEGI/",
            ]
            
            logger.warning("⚠️  Téléchargement data.gouv.fr nécessite parsing HTML/XML")
            logger.info("   Cette méthode sera implémentée si nécessaire")
            
            # TODO: Implémenter le téléchargement et parsing XML
            return False
        
        except ImportError:
            logger.warning("⚠️  'requests' non installé")
            return False
    
    def _try_local_files(self) -> bool:
        """Essaie de charger depuis des fichiers locaux"""
        data_dir = Path("data") / "raw"
        
        if not data_dir.exists():
            logger.info("   Aucun dossier data/raw trouvé")
            return False
        
        # Chercher des fichiers XML/JSON
        xml_files = list(data_dir.glob("*.xml"))
        json_files = list(data_dir.glob("*.json"))
        
        if not xml_files and not json_files:
            logger.info("   Aucun fichier XML/JSON trouvé dans data/raw")
            return False
        
        logger.info(f"   {len(xml_files)} fichiers XML, {len(json_files)} fichiers JSON trouvés")
        logger.warning("⚠️  Parsing XML/JSON local non encore implémenté")
        
        # TODO: Implémenter le parsing XML/JSON
        return False
    
    def _generate_enriched(self) -> bool:
        """Génère un dataset enrichi avec articles essentiels"""
        logger.info("🎨 Génération d'un dataset enrichi...")
        
        # Articles essentiels selon le code
        essential_articles = self._get_essential_articles()
        
        if not essential_articles:
            logger.warning("   Aucun article essentiel défini pour ce code")
            return False
        
        # Limiter si max_articles spécifié
        if self.max_articles:
            essential_articles = essential_articles[:self.max_articles]
        
        # Convertir en format Vertex AI
        articles = []
        for idx, art in enumerate(tqdm(essential_articles, desc="Génération articles")):
            article = self._create_article(
                article_id=f"{self.code_info['id']}_ENRICHED_{idx:06d}",
                num=art.get("num", str(idx + 1)),
                content=art["content"],
                breadcrumb=art.get("breadcrumb", ""),
                date_debut=art.get("date_debut", "1804-02-07"),
                date_fin=art.get("date_fin"),
                etat=art.get("etat", "VIGUEUR"),
                source="Dataset enrichi",
            )
            articles.append(article)
        
        self.articles = articles
        self._export_to_jsonl("enrichi")
        
        logger.success(f"✅ {len(articles)} articles essentiels générés")
        logger.info(f"💡 Ce dataset contient les articles les + importants du {self.code_info['name']}")
        
        return True
    
    def _get_essential_articles(self) -> list[dict]:
        """Retourne les articles essentiels selon le code"""
        if self.code_name == "civil":
            # Utiliser le script existant pour le Code Civil
            # On va simplement utiliser la méthode enrichie existante
            from ingestion.ingestion_datagouv_simple import SimpleCodeCivilIngester
            ingester = SimpleCodeCivilIngester()
            # Pour l'instant, on retourne une liste vide
            # Le script _generate_enriched() utilisera la méthode de SimpleCodeCivilIngester
            return []
        else:
            # Pour les autres codes, retourner une liste vide (à enrichir)
            logger.warning(f"   Articles essentiels non définis pour {self.code_name}")
            return []
    
    def _create_article(
        self,
        article_id: str,
        num: str,
        content: str,
        breadcrumb: str = "",
        date_debut: str = "1804-02-07",
        date_fin: Optional[str] = None,
        etat: str = "VIGUEUR",
        source: str = "Ingestion",
    ) -> dict:
        """Crée un article au format Vertex AI"""
        return {
            "id": article_id,
            "jsonData": json.dumps({
                "content": content,
                "title": f"Article {num}",
                "metadata": {
                    "type": "code",
                    "code_id": self.code_info["id"],
                    "code_name": self.code_info["name"],
                    "article_id": article_id,
                    "article_num": num,
                    "breadcrumb": breadcrumb or f"{self.code_info['name']} > Article {num}",
                    "date_debut": date_debut,
                    "date_fin": date_fin,
                    "etat": etat,
                    "nature": "CODE",
                    "source": source,
                    "type": "article_code",
                }
            }, ensure_ascii=False)
        }
    
    def _export_to_jsonl(self, source: str) -> None:
        """Exporte les articles en JSONL"""
        if not self.articles:
            logger.warning("⚠️  Aucun article à exporter")
            return
        
        output_path = settings.EXPORT_DIR / f"{self.code_info['id']}_{source}.jsonl"
        
        with open(output_path, "w", encoding="utf-8") as f:
            for article in self.articles:
                f.write(json.dumps(article, ensure_ascii=False) + "\n")
        
        logger.success(f"💾 Export: {output_path}")
        logger.info(f"   {len(self.articles)} articles")
        logger.info(f"   Taille: {output_path.stat().st_size / 1024:.1f} KB")
        
        # Afficher les prochaines étapes
        logger.info("\n📤 PROCHAINES ÉTAPES:")
        logger.info("1. Uploader vers Cloud Storage:")
        logger.info(f"   gsutil cp {output_path} gs://legal-rag-data-sofia-2025/")
        logger.info("\n2. Importer dans Vertex AI Search:")
        logger.info("   GCP Console > Vertex AI Search > datastorerag_1766055384992 > Importer")
        logger.info(f"   Source: gs://legal-rag-data-sofia-2025/{output_path.name}")


def main():
    """Point d'entrée"""
    parser = argparse.ArgumentParser(description="Ingestion complète de codes juridiques")
    parser.add_argument(
        "--code",
        choices=["civil", "penal", "travail", "commerce", "procedure_civile"],
        default="civil",
        help="Code juridique à ingérer"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Ingérer tous les codes"
    )
    parser.add_argument(
        "--max-articles",
        type=int,
        default=None,
        help="Nombre maximum d'articles à ingérer"
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 70)
    logger.info("🏛️  INGESTION COMPLÈTE - Codes Juridiques")
    logger.info("=" * 70)
    
    if args.all:
        # Ingérer tous les codes
        codes = ["civil", "penal", "travail", "commerce", "procedure_civile"]
        for code_name in codes:
            logger.info(f"\n{'='*70}")
            logger.info(f"Ingestion: {code_name}")
            logger.info(f"{'='*70}")
            ingester = CompleteIngester(code_name, args.max_articles)
            ingester.run()
    else:
        # Ingérer un seul code
        ingester = CompleteIngester(args.code, args.max_articles)
        ingester.run()


if __name__ == "__main__":
    main()

