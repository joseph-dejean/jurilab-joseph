"""
Script pour ingérer les codes depuis l'archive Freemium extraite dans C:/LEGI

Usage:
    python ingestion/ingest_from_legi_extracted.py --code civil
    python ingestion/ingest_from_legi_extracted.py --all
"""

import argparse
from pathlib import Path
from typing import Dict, List, Optional, Any

from config.logging_config import get_logger
from ingestion.ingestion_massive import MassiveIngester
from ingestion.sources.dila_opendata import DILAOpendataClient

logger = get_logger(__name__)

# Chemin de l'archive extraite
# Structure: C:/LEGI/legi/global/code_et_TNC_en_vigueur/code_en_vigueur/LEGI/LEGITEXT*/
LEGI_EXTRACTED_DIR = Path("C:/LEGI/legi/global/code_et_TNC_en_vigueur/code_en_vigueur")

# Mapping code_id → nom
CODE_MAPPING = {
    "LEGITEXT000006070721": "Code civil",
    "LEGITEXT000006070716": "Code pénal",
    "LEGITEXT000006072050": "Code du travail",
    "LEGITEXT000005634379": "Code de commerce",
    "LEGITEXT000006071164": "Code de procédure civile",
    "LEGITEXT000006071165": "Code de procédure pénale",
    "LEGITEXT000006073189": "Code de la sécurité sociale",
}

# Cache global pour éviter de refaire la recherche à chaque fois
_CODE_DIRS_CACHE: Dict[Path, List[Path]] = {}


def find_code_directories(legi_dir: Path) -> List[Path]:
    """
    Trouve les dossiers de codes dans l'archive extraite
    
    Args:
        legi_dir: Dossier legi/global/code_et_TNC_en_vigueur
    
    Returns:
        Liste des dossiers LEGITEXT*
    """
    if not legi_dir.exists():
        logger.error(f"❌ Dossier non trouvé: {legi_dir}")
        return []
    
    logger.info(f"🔍 Recherche des codes dans: {legi_dir}")
    
    # Structure Freemium : LEGI/TEXT/00/00/06/07/07/LEGITEXT*/
    # Chercher spécifiquement dans LEGI/TEXT/
    legi_text_dir = legi_dir / "LEGI" / "TEXT"
    if legi_text_dir.exists():
        logger.info(f"   📂 Cherchant dans: {legi_text_dir}")
        try:
            # Recherche récursive dans TEXT/ pour trouver tous les LEGITEXT*
            code_dirs = []
            for path in legi_text_dir.rglob("LEGITEXT*"):
                if path.is_dir() and path.name.startswith("LEGITEXT"):
                    code_dirs.append(path)
            
            if code_dirs:
                # Dédupliquer (garder les plus profonds = les vrais dossiers de codes)
                from collections import defaultdict
                by_name = defaultdict(list)
                for d in code_dirs:
                    by_name[d.name].append(d)
                
                # Garder le chemin le plus long (le plus profond)
                code_dirs = [max(dirs, key=lambda x: len(str(x))) for dirs in by_name.values()]
                logger.info(f"   ✅ {len(code_dirs)} codes trouvés dans LEGI/TEXT/")
                return code_dirs
        except Exception as e:
            logger.warning(f"   ⚠️ Erreur lecture LEGI/TEXT/: {e}")
    
    # Structure possible 1: code_en_vigueur/LEGI/LEGITEXT*/ (directement dans LEGI)
    legi_subdir = legi_dir / "LEGI"
    if legi_subdir.exists():
        logger.info(f"   📂 Cherchant dans: {legi_subdir}")
        try:
            code_dirs = [d for d in legi_subdir.iterdir() if d.is_dir() and d.name.startswith("LEGITEXT")]
            if code_dirs:
                logger.info(f"   ✅ {len(code_dirs)} codes trouvés dans LEGI/")
                return code_dirs
        except Exception as e:
            logger.warning(f"   ⚠️ Erreur lecture LEGI/: {e}")
    
    # Structure possible 2: code_en_vigueur/LEGITEXT*/ (directement)
    logger.info(f"   📂 Cherchant directement dans: {legi_dir}")
    try:
        code_dirs = [d for d in legi_dir.iterdir() if d.is_dir() and d.name.startswith("LEGITEXT")]
        if code_dirs:
            logger.info(f"   ✅ {len(code_dirs)} codes trouvés directement")
            return code_dirs
    except Exception as e:
        logger.warning(f"   ⚠️ Erreur lecture directe: {e}")
    
    # Structure possible 3: Recherche récursive générale (limite de profondeur)
    logger.info(f"   📂 Recherche récursive générale (profondeur limitée)...")
    try:
        code_dirs = []
        # Limiter à 10 niveaux de profondeur pour éviter de scanner tout C:\LEGI
        for path in legi_dir.rglob("LEGITEXT*"):
            if path.is_dir() and path.name.startswith("LEGITEXT"):
                # Limiter la profondeur (max 10 niveaux depuis legi_dir)
                depth = len(path.relative_to(legi_dir).parts)
                if depth <= 10:
                    code_dirs.append(path)
        
        if code_dirs:
            # Dédupliquer (garder les plus profonds)
            from collections import defaultdict
            by_name = defaultdict(list)
            for d in code_dirs:
                by_name[d.name].append(d)
            
            code_dirs = [max(dirs, key=lambda x: len(str(x))) for dirs in by_name.values()]
            logger.info(f"   ✅ {len(code_dirs)} codes trouvés (recherche générale)")
            return code_dirs
    except Exception as e:
        logger.warning(f"   ⚠️ Erreur recherche récursive: {e}")
    
    logger.warning(f"   ⚠️ Aucun code LEGITEXT* trouvé")
    try:
        dirs_present = [d.name for d in legi_dir.iterdir() if d.is_dir()][:10]
        logger.info(f"   📂 Dossiers présents: {dirs_present}")
    except:
        pass
    return []


def ingest_code_from_legi(
    code_id: str,
    legi_dir: Path,
    max_articles: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    Ingère un code depuis C:/LEGI
    
    Args:
        code_id: ID du code (ex: LEGITEXT000006070721)
        legi_dir: Dossier legi/global/code_et_TNC_en_vigueur
        max_articles: Nombre maximum d'articles (None = tous)
    
    Returns:
        Liste d'articles au format Vertex AI
    """
    logger.info(f"📚 Ingestion: {CODE_MAPPING.get(code_id, code_id)}")
    
    # Essayer d'abord un chemin direct (plus rapide)
    # Structure: LEGI/TEXT/00/00/06/07/07/LEGITEXT000006070721
    code_dir = None
    
    # Extraire les chiffres de l'ID (ex: LEGITEXT000006070721 -> 000006070721)
    if code_id.startswith("LEGITEXT"):
        code_num = code_id.replace("LEGITEXT", "")
        # Construire le chemin: TEXT/00/00/06/07/07/LEGITEXT000006070721
        # Les 10 premiers chiffres déterminent le chemin (5 niveaux de 2 chiffres)
        if len(code_num) >= 10:
            path_parts = [code_num[i:i+2] for i in range(0, 10, 2)]  # ['00', '00', '06', '07', '07']
            direct_path = legi_dir / "LEGI" / "TEXT"
            for part in path_parts:
                direct_path = direct_path / part
            direct_path = direct_path / code_id
            if direct_path.exists():
                code_dir = direct_path
                logger.info(f"   ✅ Chemin direct trouvé: {code_dir}")
    
    # Si le chemin direct ne fonctionne pas, utiliser la recherche récursive (avec cache)
    if not code_dir:
        # Utiliser le cache pour éviter de refaire la recherche
        global _CODE_DIRS_CACHE
        if legi_dir not in _CODE_DIRS_CACHE:
            logger.info("   🔍 Recherche des codes (première fois, mise en cache)...")
            _CODE_DIRS_CACHE[legi_dir] = find_code_directories(legi_dir)
        else:
            logger.info("   ✅ Utilisation du cache des codes")
        
        code_dirs = _CODE_DIRS_CACHE[legi_dir]
        
        for d in code_dirs:
            if d.name == code_id:
                code_dir = d
                break
    
    if not code_dir:
        logger.warning(f"   ⚠️ Code {code_id} non trouvé dans {legi_dir}")
        return []
    
    logger.info(f"   📂 Dossier: {code_dir}")
    
    # Utiliser le parser DILA
    client = DILAOpendataClient()
    
    # Trouver les fichiers XML
    xml_files = client.find_xml_files(code_dir)
    
    if not xml_files:
        logger.warning(f"   ⚠️ Aucun fichier XML trouvé")
        return []
    
    logger.info(f"   📄 {len(xml_files)} fichiers XML trouvés")
    
    # Parser les fichiers
    all_articles = []
    
    from tqdm import tqdm
    for xml_file in tqdm(xml_files, desc=f"   Parsing {code_id}"):
        articles = client.parse_legi_xml(xml_file)
        if articles:
            all_articles.extend(articles)
        
        if max_articles and len(all_articles) >= max_articles:
            all_articles = all_articles[:max_articles]
            break
    
    logger.success(f"   ✅ {len(all_articles)} articles parsés")
    
    # Convertir au format Vertex AI
    code_info = {
        "id": code_id,
        "name": CODE_MAPPING.get(code_id, code_id),
    }
    
    ingester = MassiveIngester(max_articles=max_articles)
    
    articles_vertex = []
    for art in all_articles:
        article = ingester._create_article(
            code_info=code_info,
            article_id=art.get("id", f"{code_id}_{art.get('num', 'UNKNOWN')}"),
            num=art.get("num", ""),
            content=art.get("content", ""),
            breadcrumb=art.get("breadcrumb", ""),
            date_debut=art.get("date_debut", "1804-02-07"),
            date_fin=art.get("date_fin"),
            etat=art.get("etat", "VIGUEUR"),
            source="Freemium LEGI",
        )
        articles_vertex.append(article)
    
    return articles_vertex


def main():
    """Fonction principale"""
    parser = argparse.ArgumentParser(description="Ingérer les codes depuis C:\\LEGI")
    parser.add_argument("--code", type=str, help="Code à ingérer (ex: civil, penal)")
    parser.add_argument("--all", action="store_true", help="Ingérer tous les codes")
    parser.add_argument("--max-articles", type=int, help="Nombre maximum d'articles par code")
    parser.add_argument("--legi-dir", type=str, default=str(LEGI_EXTRACTED_DIR), help="Chemin vers code_en_vigueur (ex: C:/LEGI/legi/global/code_et_TNC_en_vigueur/code_en_vigueur)")
    
    args = parser.parse_args()
    
    legi_dir = Path(args.legi_dir)
    
    if not legi_dir.exists():
        logger.error(f"❌ Dossier non trouvé: {legi_dir}")
        logger.info(f"   Vérifiez que l'extraction est terminée dans C:\\LEGI")
        return 1
    
    logger.info("=" * 70)
    logger.info("🚀 INGESTION DEPUIS C:\\LEGI")
    logger.info("=" * 70)
    logger.info(f"📂 Dossier source: {legi_dir}")
    logger.info("")
    
    # Déterminer quels codes ingérer (sans faire de recherche récursive si un code spécifique est demandé)
    if args.code:
        # Chercher le code correspondant
        code_name_lower = args.code.lower()
        code_id = None
        
        for code_id_key, code_name in CODE_MAPPING.items():
            if code_name_lower in code_name.lower():
                code_id = code_id_key
                break
        
        if not code_id:
            logger.error(f"❌ Code '{args.code}' non trouvé")
            logger.info(f"   Codes disponibles: {', '.join(CODE_MAPPING.values())}")
            return 1
        
        codes_to_ingest = [code_id]
        logger.info(f"📋 Ingestion: {CODE_MAPPING[code_id]}")
    elif args.all:
        # Pour --all, on doit trouver tous les codes (recherche récursive nécessaire)
        logger.info("   🔍 Recherche de tous les codes...")
        code_dirs = find_code_directories(legi_dir)
        
        if not code_dirs:
            logger.error("❌ Aucun code trouvé dans l'archive extraite")
            return 1
        
        codes_to_ingest = [d.name for d in code_dirs]
        logger.info(f"📋 Ingestion de TOUS les codes ({len(codes_to_ingest)})")
    else:
        logger.error("❌ Spécifiez --code ou --all")
        return 1
    
    logger.info("")
    
    # Ingérer chaque code
    ingester = MassiveIngester(max_articles=args.max_articles)
    total_articles = 0
    codes_success = 0
    codes_failed = 0
    
    logger.info(f"📋 Ingestion de {len(codes_to_ingest)} codes...")
    logger.info("")
    
    for idx, code_id in enumerate(codes_to_ingest, 1):
        code_name = CODE_MAPPING.get(code_id, code_id)
        logger.info("=" * 70)
        logger.info(f"📚 [{idx}/{len(codes_to_ingest)}] {code_name} ({code_id})")
        logger.info("=" * 70)
        
        try:
            articles = ingest_code_from_legi(
                code_id=code_id,
                legi_dir=legi_dir,
                max_articles=args.max_articles
            )
            
            if articles:
                # Exporter
                code_info = {
                    "id": code_id,
                    "name": code_name,
                }
                export_path = ingester._export_articles(
                    code_name=code_name.lower().replace(" ", "_"),
                    code_info=code_info,
                    articles=articles
                )
                total_articles += len(articles)
                codes_success += 1
                logger.success(f"   ✅ {len(articles)} articles exportés: {export_path.name}")
            else:
                logger.warning(f"   ⚠️ Aucun article pour {code_id}")
                codes_failed += 1
        
        except Exception as e:
            codes_failed += 1
            logger.error(f"   ❌ Erreur pour {code_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            continue
        
        logger.info("")
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ DE L'INGESTION")
    logger.info("=" * 70)
    logger.success(f"✅ Codes réussis: {codes_success}/{len(codes_to_ingest)}")
    if codes_failed > 0:
        logger.warning(f"⚠️ Codes échoués: {codes_failed}/{len(codes_to_ingest)}")
    logger.success(f"✅ Total articles ingérés: {total_articles}")
    logger.info("=" * 70)
    
    # Lister les fichiers exportés
    if total_articles > 0:
        logger.info("")
        logger.info("📁 Fichiers JSONL générés:")
        from config.settings import get_settings
        settings = get_settings()
        export_files = list(settings.EXPORT_DIR.glob("*.jsonl"))
        export_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        for f in export_files[:10]:  # Afficher les 10 derniers
            size_kb = f.stat().st_size / 1024
            logger.info(f"   - {f.name} ({size_kb:.1f} KB)")
        if len(export_files) > 10:
            logger.info(f"   ... et {len(export_files) - 10} autres fichiers")
    
    logger.info("")
    logger.info("💡 Prochaine étape: Uploader les fichiers JSONL vers GCS")
    logger.info("   gsutil -m cp data\\exports\\*.jsonl gs://legal-rag-data-sofia-2025/")
    
    return 0


if __name__ == "__main__":
    exit(main())

