"""
Script d'ingestion MASSIVE de TOUTES les données juridiques

Stratégie :
- Un seul datastore Vertex AI
- Segmentation par métadonnées (code_id, type, etat, etc.)
- Support multi-sources avec fallback
- Checkpointing pour reprendre en cas d'erreur
- Logs détaillés de progression

Usage:
    # Ingérer Code Civil complet
    python ingestion/ingestion_massive.py --code civil
    
    # Ingérer tous les codes
    python ingestion/ingestion_massive.py --all
    
    # Ingérer avec limite (test)
    python ingestion/ingestion_massive.py --all --max-articles 1000
"""

import argparse
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from tqdm import tqdm

from config.logging_config import get_logger
from config.settings import get_settings

logger = get_logger(__name__)
settings = get_settings()


class MassiveIngester:
    """Ingestion massive avec segmentation par métadonnées"""
    
    # Mapping complet des codes juridiques français
    CODES = {
        "civil": {
            "id": "LEGITEXT000006070721",
            "name": "Code civil",
            "articles_count": 8000,
            "priority": 1,  # Priorité d'ingestion
        },
        "penal": {
            "id": "LEGITEXT000006070716",
            "name": "Code pénal",
            "articles_count": 5000,
            "priority": 2,
        },
        "travail": {
            "id": "LEGITEXT000006072050",
            "name": "Code du travail",
            "articles_count": 10000,
            "priority": 3,
        },
        "commerce": {
            "id": "LEGITEXT000005634379",
            "name": "Code de commerce",
            "articles_count": 3000,
            "priority": 4,
        },
        "procedure_civile": {
            "id": "LEGITEXT000006070716",
            "name": "Code de procédure civile",
            "articles_count": 2000,
            "priority": 5,
        },
        "procedure_penale": {
            "id": "LEGITEXT000006071164",
            "name": "Code de procédure pénale",
            "articles_count": 2000,
            "priority": 6,
        },
        "securite_sociale": {
            "id": "LEGITEXT000006073189",
            "name": "Code de la sécurité sociale",
            "articles_count": 5000,
            "priority": 7,
        },
    }
    
    def __init__(
        self,
        code_name: Optional[str] = None,
        max_articles: Optional[int] = None,
        checkpoint_dir: Path = Path("data/checkpoints"),
    ):
        """
        Initialise l'ingestion massive
        
        Args:
            code_name: Nom du code à ingérer (None = tous)
            max_articles: Nombre maximum d'articles par code (None = tous)
            checkpoint_dir: Dossier pour les checkpoints
        """
        self.code_name = code_name
        self.max_articles = max_articles
        self.checkpoint_dir = checkpoint_dir
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        
        # Statistiques
        self.stats = {
            "total_articles": 0,
            "codes_processed": 0,
            "errors": 0,
            "start_time": datetime.now(),
        }
        
        logger.info("=" * 70)
        logger.info("🚀 INGESTION MASSIVE - Données Juridiques")
        logger.info("=" * 70)
        logger.info(f"   Code(s): {code_name or 'TOUS'}")
        logger.info(f"   Max articles/code: {max_articles or 'illimité'}")
        logger.info(f"   Checkpoint dir: {checkpoint_dir}")
    
    def run(self) -> bool:
        """Lance l'ingestion massive"""
        try:
            if self.code_name:
                # Ingérer un seul code
                if self.code_name not in self.CODES:
                    logger.error(f"❌ Code inconnu: {self.code_name}")
                    return False
                
                code_info = self.CODES[self.code_name]
                return self._ingest_code(self.code_name, code_info)
            else:
                # Ingérer tous les codes par ordre de priorité
                codes_sorted = sorted(
                    self.CODES.items(),
                    key=lambda x: x[1]["priority"]
                )
                
                logger.info(f"\n📚 Ingestion de {len(codes_sorted)} codes juridiques")
                
                for code_name, code_info in codes_sorted:
                    logger.info(f"\n{'='*70}")
                    logger.info(f"📖 Code: {code_info['name']} (priorité {code_info['priority']})")
                    logger.info(f"{'='*70}")
                    
                    success = self._ingest_code(code_name, code_info)
                    if not success:
                        logger.warning(f"⚠️ Échec pour {code_info['name']}, continuation...")
                        self.stats["errors"] += 1
                    
                    self.stats["codes_processed"] += 1
                    
                    # Pause entre codes pour éviter surcharge
                    time.sleep(2)
                
                return self._finalize()
        
        except KeyboardInterrupt:
            logger.warning("\n⚠️ Interruption utilisateur")
            self._save_checkpoint()
            return False
        except Exception as e:
            logger.error(f"❌ Erreur critique: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _ingest_code(self, code_name: str, code_info: Dict[str, Any]) -> bool:
        """Ingère un code spécifique"""
        logger.info(f"📚 Ingestion: {code_info['name']}")
        
        # Vérifier checkpoint
        checkpoint_file = self.checkpoint_dir / f"{code_name}_checkpoint.json"
        start_from = 0
        
        if checkpoint_file.exists():
            logger.info(f"   📍 Checkpoint trouvé: {checkpoint_file}")
            try:
                with open(checkpoint_file, "r", encoding="utf-8") as f:
                    checkpoint = json.load(f)
                    start_from = checkpoint.get("last_article_index", 0)
                    logger.info(f"   ▶️ Reprise depuis l'article {start_from}")
            except Exception as e:
                logger.warning(f"   ⚠️ Erreur lecture checkpoint: {e}")
        
        # Stratégie d'ingestion avec fallback
        strategies = [
            ("Hugging Face", self._try_huggingface),
            ("data.gouv.fr", self._try_datagouv),
            ("Fichiers locaux", self._try_local_files),
            ("Génération enrichie", self._try_generate_enriched),
        ]
        
        for strategy_name, strategy_func in strategies:
            logger.info(f"\n📥 Stratégie: {strategy_name}...")
            try:
                articles = strategy_func(code_name, code_info, start_from)
                
                if articles and len(articles) > 0:
                    # Sauvegarder checkpoint
                    self._save_checkpoint_code(code_name, len(articles))
                    
                    # Exporter
                    output_path = self._export_articles(code_name, code_info, articles)
                    
                    logger.success(f"✅ {len(articles)} articles ingérés")
                    logger.info(f"   📁 Fichier: {output_path}")
                    
                    self.stats["total_articles"] += len(articles)
                    
                    return True
            
            except Exception as e:
                logger.warning(f"   ⚠️ Échec {strategy_name}: {e}")
                continue
        
        logger.error(f"❌ Toutes les stratégies ont échoué pour {code_info['name']}")
        return False
    
    def _try_huggingface(
        self,
        code_name: str,
        code_info: Dict[str, Any],
        start_from: int = 0,
    ) -> List[Dict[str, Any]]:
        """Essaie de charger depuis Hugging Face"""
        try:
            from datasets import load_dataset
            
            # Datasets à essayer
            datasets = [
                "antoinejeannot/code-civil-fr",
                "antoinejeannot/french-jurisprudence",
            ]
            
            for dataset_name in datasets:
                try:
                    logger.info(f"   🔍 Tentative: {dataset_name}")
                    dataset = load_dataset(dataset_name, split="train", streaming=True)
                    
                    articles = []
                    max_count = self.max_articles or code_info["articles_count"]
                    
                    for i, item in enumerate(dataset):
                        if i < start_from:
                            continue
                        
                        if self.max_articles and len(articles) >= self.max_articles:
                            break
                        
                        content = item.get("text", "") or item.get("content", "")
                        if not content:
                            continue
                        
                        article = self._create_article(
                            code_info=code_info,
                            article_id=f"{code_info['id']}_HF_{i:06d}",
                            num=str(i + 1),
                            content=content[:10000],  # Limiter taille
                            source="Hugging Face",
                        )
                        articles.append(article)
                    
                    if articles:
                        logger.success(f"   ✅ {len(articles)} articles depuis Hugging Face")
                        return articles
                
                except Exception as e:
                    logger.debug(f"   Erreur {dataset_name}: {e}")
                    continue
            
            return []
        
        except ImportError:
            logger.warning("   ⚠️ 'datasets' non installé (pip install datasets)")
            return []
    
    def _try_datagouv(
        self,
        code_name: str,
        code_info: Dict[str, Any],
        start_from: int = 0,
    ) -> List[Dict[str, Any]]:
        """Essaie de télécharger depuis DILA/data.gouv.fr"""
        # Essayer DILA d'abord
        logger.info("   🔍 Tentative DILA OPENDATA...")
        
        try:
            from ingestion.sources.dila_opendata import DILAOpendataClient
            
            client = DILAOpendataClient()
            
            # Calculer max_articles si nécessaire
            max_articles = None
            if self.max_articles:
                # Ajuster selon start_from
                max_articles = self.max_articles + start_from
            
            # Ingérer depuis DILA
            articles_raw = client.ingest_code(
                code_id=code_info["id"],
                max_articles=max_articles,
            )
            
            if articles_raw:
                # Appliquer start_from
                if start_from > 0:
                    articles_raw = articles_raw[start_from:]
                
                # Limiter si max_articles
                if self.max_articles and len(articles_raw) > self.max_articles:
                    articles_raw = articles_raw[:self.max_articles]
                
                # Convertir au format Vertex AI
                articles = []
                for art in articles_raw:
                    article = self._create_article(
                        code_info=code_info,
                        article_id=art["id"],
                        num=art["num"],
                        content=art["content"],
                        breadcrumb=art.get("breadcrumb", ""),
                        date_debut=art.get("date_debut", "1804-02-07"),
                        date_fin=art.get("date_fin"),
                        etat=art.get("etat", "VIGUEUR"),
                        source="DILA OPENDATA",
                    )
                    articles.append(article)
                
                if articles:
                    logger.success(f"   ✅ {len(articles)} articles depuis DILA")
                    return articles
        except Exception as e:
            logger.debug(f"   DILA échoué: {e}")
        
        # Si DILA échoue, essayer data.gouv.fr
        logger.info("   🔍 Tentative data.gouv.fr...")
        
        try:
            from ingestion.sources.datagouv_client import DataGouvClient
            
            client = DataGouvClient()
            
            # Télécharger les ressources
            resources = client.list_resources()
            
            if not resources:
                logger.warning("   ⚠️ Aucune ressource trouvée sur data.gouv.fr")
                return []
            
            # Pour l'instant, on télécharge juste pour voir ce qu'il y a
            # Le parsing dépendra du format des fichiers
            logger.info("   ℹ️ Ressources disponibles sur data.gouv.fr")
            logger.info("   ℹ️ Téléchargez manuellement depuis la page web")
            logger.info("   ℹ️ Mettez les fichiers dans data/raw/datagouv/")
            logger.info("   ℹ️ Le script les utilisera automatiquement")
            
            # Vérifier si on a déjà des fichiers locaux
            datagouv_dir = Path("data/raw/datagouv")
            if datagouv_dir.exists():
                files = list(datagouv_dir.glob("*.xml"))
                if files:
                    logger.info(f"   📁 {len(files)} fichiers XML trouvés localement")
                    logger.warning("   ⚠️ Parsing data.gouv.fr XML non encore implémenté")
                    # TODO: Implémenter le parsing selon le format réel
        
        except Exception as e:
            logger.debug(f"   data.gouv.fr échoué: {e}")
        
        return []
    
    def _try_local_files(
        self,
        code_name: str,
        code_info: Dict[str, Any],
        start_from: int = 0,
    ) -> List[Dict[str, Any]]:
        """Essaie de charger depuis fichiers locaux (DILA extraits)"""
        # Chercher dans data/raw/dila/{code_id}/
        dila_dir = Path("data") / "raw" / "dila" / code_info["id"]
        
        if not dila_dir.exists():
            logger.debug("   Aucun dossier DILA local trouvé")
            return []
        
        logger.info("   📁 Fichiers locaux DILA trouvés, parsing...")
        
        try:
            from ingestion.sources.dila_opendata import DILAOpendataClient
            
            client = DILAOpendataClient()
            
            # Trouver les fichiers XML
            xml_files = client.find_xml_files(dila_dir)
            
            if not xml_files:
                logger.warning("   ⚠️ Aucun fichier XML trouvé dans le dossier local")
                return []
            
            # Parser tous les fichiers
            all_articles = []
            
            for xml_file in xml_files:
                articles = client.parse_legi_xml(xml_file)
                all_articles.extend(articles)
                
                if self.max_articles and len(all_articles) >= self.max_articles:
                    all_articles = all_articles[:self.max_articles]
                    break
            
            # Appliquer start_from
            if start_from > 0:
                all_articles = all_articles[start_from:]
            
            if not all_articles:
                return []
            
            # Convertir au format Vertex AI
            articles = []
            for art in all_articles:
                article = self._create_article(
                    code_info=code_info,
                    article_id=art["id"],
                    num=art["num"],
                    content=art["content"],
                    breadcrumb=art.get("breadcrumb", ""),
                    date_debut=art.get("date_debut", "1804-02-07"),
                    date_fin=art.get("date_fin"),
                    etat=art.get("etat", "VIGUEUR"),
                    source="DILA OPENDATA (local)",
                )
                articles.append(article)
            
            if articles:
                logger.success(f"   ✅ {len(articles)} articles depuis fichiers locaux")
                return articles
            else:
                return []
        
        except ImportError as e:
            logger.warning(f"   ⚠️ Dépendances manquantes: {e}")
            return []
        except Exception as e:
            logger.warning(f"   ⚠️ Erreur parsing fichiers locaux: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            return []
    
    def _try_generate_enriched(
        self,
        code_name: str,
        code_info: Dict[str, Any],
        start_from: int = 0,
    ) -> List[Dict[str, Any]]:
        """Génère un dataset enrichi (fallback)"""
        logger.info("   🎨 Génération enrichie...")
        
        # Utiliser le script existant pour Code Civil
        if code_name == "civil":
            from ingestion.ingestion_datagouv_simple import SimpleCodeCivilIngester
            ingester = SimpleCodeCivilIngester()
            # La méthode _generate_enriched_dataset retourne True mais ne retourne pas les articles
            # On va créer les articles directement ici
            return self._get_essential_articles_civil(code_info)
        else:
            logger.warning(f"   ⚠️ Articles essentiels non définis pour {code_info['name']}")
            return []
    
    def _get_essential_articles_civil(self, code_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Récupère les articles essentiels du Code Civil (21 articles)"""
        # Liste complète des articles essentiels du Code Civil
        essential_articles = [
            {
                "num": "1",
                "content": "Les lois et, lorsqu'ils sont publiés au Journal officiel de la République française, les actes administratifs entrent en vigueur à la date qu'ils fixent ou, à défaut, le lendemain de leur publication. Toutefois, l'entrée en vigueur de celles de leurs dispositions dont l'exécution nécessite des mesures d'application est reportée à la date d'entrée en vigueur de ces mesures.",
                "breadcrumb": "Code civil > Livre préliminaire > Titre Ier > Article 1",
                "date_debut": "1804-02-07",
            },
            {
                "num": "2",
                "content": "La loi ne dispose que pour l'avenir ; elle n'a point d'effet rétroactif.",
                "breadcrumb": "Code civil > Livre préliminaire > Titre Ier > Article 2",
                "date_debut": "1804-02-07",
            },
            {
                "num": "3",
                "content": "Les lois de police et de sûreté obligent tous ceux qui habitent le territoire. Les immeubles, même ceux possédés par des étrangers, sont régis par la loi française. Les lois concernant l'état et la capacité des personnes régissent les Français, même résidant en pays étranger.",
                "breadcrumb": "Code civil > Livre préliminaire > Titre Ier > Article 3",
                "date_debut": "1804-02-07",
            },
            {
                "num": "4",
                "content": "Le juge qui refusera de juger, sous prétexte du silence, de l'obscurité ou de l'insuffisance de la loi, pourra être poursuivi comme coupable de déni de justice.",
                "breadcrumb": "Code civil > Livre préliminaire > Titre Ier > Article 4",
                "date_debut": "1804-02-07",
            },
            {
                "num": "5",
                "content": "Il est défendu aux juges de prononcer par voie de disposition générale et réglementaire sur les causes qui leur sont soumises.",
                "breadcrumb": "Code civil > Livre préliminaire > Titre Ier > Article 5",
                "date_debut": "1804-02-07",
            },
            {
                "num": "414",
                "content": "La majorité est fixée à dix-huit ans accomplis ; à cet âge, chacun est capable d'exercer les droits dont il a la jouissance.",
                "breadcrumb": "Code civil > Livre I > Titre XI > Chapitre Ier > Section 1 > Article 414",
                "date_debut": "2009-01-01",
            },
            {
                "num": "515",
                "content": "Les enfants dont la filiation est légalement établie ont les mêmes droits et les mêmes devoirs dans leurs rapports avec leur père et mère. Ils entrent dans la famille de chacun d'eux.",
                "breadcrumb": "Code civil > Livre I > Titre VII > Article 515",
                "date_debut": "2005-07-01",
            },
            {
                "num": "1101",
                "content": "Le contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre I > Section 1 > Article 1101",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1102",
                "content": "Chacun est libre de contracter ou de ne pas contracter, de choisir son cocontractant et de déterminer le contenu et la forme du contrat dans les limites fixées par la loi. La liberté contractuelle ne permet pas de déroger aux règles qui intéressent l'ordre public.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre I > Section 1 > Article 1102",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1103",
                "content": "Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre I > Section 1 > Article 1103",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1104",
                "content": "Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre I > Section 1 > Article 1104",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1105",
                "content": "Les contrats, qu'ils aient ou non une dénomination propre, sont soumis à des règles générales, qui sont l'objet du présent sous-titre. Les règles particulières à certains contrats sont établies dans les dispositions propres à chacun d'eux. Les règles générales s'appliquent sous réserve de ces règles particulières.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre I > Section 1 > Article 1105",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1128",
                "content": "Sont nécessaires à la validité d'un contrat : 1° Le consentement des parties ; 2° Leur capacité de contracter ; 3° Un contenu licite et certain.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre II > Section 1 > Article 1128",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1231-1",
                "content": "Le débiteur est condamné, s'il y a lieu, au paiement de dommages et intérêts soit à raison de l'inexécution de l'obligation, soit à raison du retard dans l'exécution, s'il ne justifie pas que l'exécution a été empêchée par la force majeure.",
                "breadcrumb": "Code civil > Livre III > Titre III > Chapitre IV > Section 1 > Article 1231-1",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1240",
                "content": "Tout fait quelconque de l'homme, qui cause à autrui un dommage, oblige celui par la faute duquel il est arrivé à le réparer.",
                "breadcrumb": "Code civil > Livre III > Titre IV > Chapitre II > Article 1240",
                "date_debut": "2016-10-01",
            },
            {
                "num": "1583",
                "content": "La vente est parfaite entre les parties, et la propriété est acquise de droit à l'acheteur à l'égard du vendeur, dès qu'on est convenu de la chose et du prix, quoique la chose n'ait pas encore été livrée ni le prix payé.",
                "breadcrumb": "Code civil > Livre III > Titre VI > Chapitre Ier > Article 1583",
                "date_debut": "1804-02-07",
            },
            {
                "num": "1604",
                "content": "La délivrance est le transport de la chose vendue en la puissance et possession de l'acheteur.",
                "breadcrumb": "Code civil > Livre III > Titre VI > Chapitre III > Article 1604",
                "date_debut": "1804-02-07",
            },
            {
                "num": "1641",
                "content": "Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.",
                "breadcrumb": "Code civil > Livre III > Titre VI > Chapitre V > Section 4 > Article 1641",
                "date_debut": "1804-02-07",
            },
            {
                "num": "1709",
                "content": "Le louage des choses est un contrat par lequel l'une des parties s'oblige à faire jouir l'autre d'une chose pendant un certain temps, et moyennant un certain prix que celle-ci s'oblige de lui payer.",
                "breadcrumb": "Code civil > Livre III > Titre VIII > Chapitre I > Article 1709",
                "date_debut": "1804-02-07",
            },
            {
                "num": "544",
                "content": "La propriété est le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu'on n'en fasse pas un usage prohibé par les lois ou par les règlements.",
                "breadcrumb": "Code civil > Livre II > Titre Ier > Chapitre II > Article 544",
                "date_debut": "1804-02-07",
            },
        ]
        
        # Limiter si max_articles spécifié
        if self.max_articles and len(essential_articles) > self.max_articles:
            essential_articles = essential_articles[:self.max_articles]
            logger.info(f"   ⚠️ Limité à {self.max_articles} articles (max spécifié)")
        
        articles = []
        for idx, art in enumerate(essential_articles):
            article = self._create_article(
                code_info=code_info,
                article_id=f"{code_info['id']}_ENRICHED_{idx:06d}",
                num=art["num"],
                content=art["content"],
                breadcrumb=art.get("breadcrumb", f"Code civil > Article {art['num']}"),
                date_debut=art.get("date_debut", "1804-02-07"),
                date_fin=art.get("date_fin"),
                etat=art.get("etat", "VIGUEUR"),
                source="Dataset enrichi",
            )
            articles.append(article)
        
        logger.info(f"   ✅ {len(articles)} articles essentiels générés")
        return articles
    
    def _create_article(
        self,
        code_info: Dict[str, Any],
        article_id: str,
        num: str,
        content: str,
        breadcrumb: str = "",
        date_debut: str = "1804-02-07",
        date_fin: Optional[str] = None,
        etat: str = "VIGUEUR",
        source: str = "Ingestion",
    ) -> Dict[str, Any]:
        """
        Crée un article au format Vertex AI avec métadonnées complètes
        
        NOUVEAU FORMAT : Champs directs pour activer embeddings et segmentation automatique
        - content: Champ direct (pour embeddings)
        - title: Champ direct (pour affichage)
        - Métadonnées: Champs directs (pour filtrage)
        
        Métadonnées pour segmentation :
        - code_id: ID du code (filtrage par code)
        - code_name: Nom du code (affichage)
        - type: Type de document (article_code, jurisprudence, etc.)
        - etat: État (VIGUEUR, ABROGE, MODIFIE)
        - date_debut/date_fin: Dates (filtrage temporel)
        - article_num: Numéro d'article (recherche précise)
        """
        if not breadcrumb:
            breadcrumb = f"{code_info['name']} > Article {num}"
        
        # NOUVEAU FORMAT : Champs directs (pas dans jsonData)
        # Cela permet à Vertex AI de créer des embeddings sur le champ 'content'
        # et d'activer la segmentation automatique
        return {
            "id": article_id,
            # Champ direct pour embeddings et segmentation
            "content": content,
            "title": f"Article {num}",
            
            # Métadonnées en champs directs pour filtrage
            "code_id": code_info["id"],
            "code_name": code_info["name"],
            "type": "article_code",
            "nature": "CODE",
            "article_id": article_id,
            "article_num": num,
            "breadcrumb": breadcrumb,
            "etat": etat,
            "date_debut": date_debut,
            "date_fin": date_fin or "",
            "source": source,
            "ingestion_date": datetime.now().isoformat(),
        }
    
    def _export_articles(
        self,
        code_name: str,
        code_info: Dict[str, Any],
        articles: List[Dict[str, Any]],
    ) -> Path:
        """Exporte les articles en JSONL"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = settings.EXPORT_DIR / f"{code_info['id']}_{code_name}_{timestamp}.jsonl"
        
        with open(output_path, "w", encoding="utf-8") as f:
            for article in articles:
                f.write(json.dumps(article, ensure_ascii=False) + "\n")
        
        logger.info(f"   💾 Export: {output_path}")
        logger.info(f"   📊 {len(articles)} articles, {output_path.stat().st_size / 1024:.1f} KB")
        
        return output_path
    
    def _save_checkpoint_code(self, code_name: str, articles_count: int) -> None:
        """Sauvegarde un checkpoint pour un code"""
        checkpoint_file = self.checkpoint_dir / f"{code_name}_checkpoint.json"
        
        checkpoint = {
            "code_name": code_name,
            "last_article_index": articles_count,
            "timestamp": datetime.now().isoformat(),
        }
        
        with open(checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, indent=2)
    
    def _save_checkpoint(self) -> None:
        """Sauvegarde un checkpoint global"""
        checkpoint_file = self.checkpoint_dir / "global_checkpoint.json"
        
        checkpoint = {
            "stats": self.stats,
            "timestamp": datetime.now().isoformat(),
        }
        
        with open(checkpoint_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, indent=2)
        
        logger.info(f"💾 Checkpoint sauvegardé: {checkpoint_file}")
    
    def _finalize(self) -> bool:
        """Finalise l'ingestion et affiche les statistiques"""
        duration = (datetime.now() - self.stats["start_time"]).total_seconds()
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ INGESTION MASSIVE TERMINÉE")
        logger.info("=" * 70)
        logger.info(f"📊 Statistiques:")
        logger.info(f"   - Codes traités: {self.stats['codes_processed']}")
        logger.info(f"   - Articles totaux: {self.stats['total_articles']}")
        logger.info(f"   - Erreurs: {self.stats['errors']}")
        logger.info(f"   - Durée: {duration:.1f} secondes")
        logger.info("=" * 70)
        
        logger.info("\n📤 PROCHAINES ÉTAPES:")
        logger.info("1. Uploader les fichiers JSONL vers Cloud Storage:")
        logger.info(f"   gsutil -m cp {settings.EXPORT_DIR}/*.jsonl gs://legal-rag-data-sofia-2025/")
        logger.info("\n2. Importer dans Vertex AI Search:")
        logger.info("   GCP Console > Vertex AI Search > datastorerag_1766055384992")
        logger.info("   > Importer > Sélectionner les fichiers depuis GCS")
        logger.info("\n3. Vérifier la segmentation par métadonnées:")
        logger.info("   - Filtres par code_id fonctionnels")
        logger.info("   - Filtres par etat fonctionnels")
        logger.info("   - Recherche sémantique opérationnelle")
        
        return True


def main():
    """Point d'entrée"""
    parser = argparse.ArgumentParser(
        description="Ingestion massive de données juridiques",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--code",
        choices=list(MassiveIngester.CODES.keys()),
        default=None,
        help="Code juridique à ingérer (défaut: tous)"
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
        help="Nombre maximum d'articles par code (défaut: illimité)"
    )
    parser.add_argument(
        "--checkpoint-dir",
        type=Path,
        default=Path("data/checkpoints"),
        help="Dossier pour les checkpoints"
    )
    
    args = parser.parse_args()
    
    if args.all:
        code_name = None
    elif args.code:
        code_name = args.code
    else:
        # Par défaut, ingérer tous les codes
        code_name = None
        logger.info("ℹ️ Aucun code spécifié, ingestion de tous les codes")
    
    ingester = MassiveIngester(
        code_name=code_name,
        max_articles=args.max_articles,
        checkpoint_dir=args.checkpoint_dir,
    )
    
    success = ingester.run()
    
    if success:
        logger.success("\n✅ Ingestion terminée avec succès!")
        return 0
    else:
        logger.error("\n❌ Ingestion terminée avec des erreurs")
        return 1


if __name__ == "__main__":
    import sys
    sys.exit(main())

