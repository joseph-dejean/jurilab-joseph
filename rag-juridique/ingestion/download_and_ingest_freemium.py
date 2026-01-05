"""
Script pour télécharger, extraire et ingérer l'archive Freemium LEGI

Usage:
    python ingestion/download_and_ingest_freemium.py
"""

import tarfile
from pathlib import Path
from typing import Optional

from config.logging_config import get_logger
from ingestion.sources.datagouv_client import DataGouvClient
from ingestion.sources.dila_opendata import DILAOpendataClient

logger = get_logger(__name__)


def download_freemium() -> Optional[Path]:
    """Télécharge l'archive Freemium"""
    logger.info("=" * 70)
    logger.info("📥 TÉLÉCHARGEMENT ARCHIVE FREEMIUM LEGI")
    logger.info("=" * 70)
    
    client = DataGouvClient()
    archive_path = client.download_freemium_archive()
    
    if archive_path:
        logger.success(f"✅ Archive téléchargée: {archive_path}")
        return archive_path
    else:
        logger.error("❌ Échec du téléchargement")
        return None


def extract_archive(archive_path: Path, extract_dir: Optional[Path] = None) -> Optional[Path]:
    """Extrait l'archive tar.gz"""
    logger.info("=" * 70)
    logger.info("📦 EXTRACTION ARCHIVE")
    logger.info("=" * 70)
    
    if extract_dir is None:
        # Utiliser un chemin court pour éviter problème Windows
        extract_dir = Path("C:/LEGI") if Path("C:/").exists() else archive_path.parent / "LEGI_extracted"
    
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"📂 Extraction vers: {extract_dir}")
    
    try:
        # Vérifier si déjà extrait
        if extract_dir.exists() and any(extract_dir.iterdir()):
            logger.info("   ✅ Archive déjà extraite")
            return extract_dir
        
        logger.info("   📦 Extraction en cours...")
        logger.warning("   ⚠️ Sur Windows, l'extraction peut être lente à cause des chemins longs")
        logger.info("   💡 Alternative: Utiliser 7-Zip pour extraire manuellement")
        
        # Essayer avec tarfile mais avec gestion d'erreurs
        import os
        import sys
        
        try:
            with tarfile.open(archive_path, "r:gz") as tar:
                # Compter les membres
                members = tar.getmembers()
                logger.info(f"   📄 {len(members)} fichiers à extraire")
                
                # Extraire avec filter='data' pour éviter les problèmes de sécurité
                tar.extractall(extract_dir, filter='data')
                
                logger.success(f"   ✅ Archive extraite: {extract_dir}")
                return extract_dir
        
        except Exception as e:
            logger.error(f"   ❌ Erreur extraction avec tarfile: {e}")
            logger.info("   💡 Solution: Extraire manuellement avec 7-Zip")
            logger.info(f"   📁 Archive: {archive_path}")
            logger.info(f"   📁 Destination: {extract_dir}")
            logger.info("   Commandes 7-Zip:")
            logger.info(f"   7z x \"{archive_path}\" -o\"{extract_dir}\"")
            return None
    
    except Exception as e:
        logger.error(f"   ❌ Erreur extraction: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None


def ingest_from_extracted(extract_dir: Path, code_ids: Optional[list] = None) -> int:
    """
    Ingère les codes depuis l'archive extraite
    
    Args:
        extract_dir: Dossier extrait
        code_ids: Liste des code_ids à ingérer (None = tous)
    
    Returns:
        Nombre d'articles ingérés
    """
    logger.info("=" * 70)
    logger.info("📚 INGESTION DES CODES")
    logger.info("=" * 70)
    
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
    
    client = DILAOpendataClient()
    
    # Chercher les dossiers de codes
    legi_dir = extract_dir / "LEGI"
    if not legi_dir.exists():
        # Essayer structure alternative
        legi_dir = extract_dir
        for subdir in extract_dir.iterdir():
            if subdir.is_dir() and "LEGI" in subdir.name:
                legi_dir = subdir
                break
    
    if not legi_dir.exists():
        logger.error(f"❌ Dossier LEGI non trouvé dans {extract_dir}")
        return 0
    
    logger.info(f"📂 Dossier LEGI: {legi_dir}")
    
    # Trouver les codes
    code_dirs = [d for d in legi_dir.iterdir() if d.is_dir() and d.name.startswith("LEGITEXT")]
    
    if not code_dirs:
        logger.warning("⚠️ Aucun code trouvé")
        return 0
    
    logger.info(f"📚 {len(code_dirs)} codes trouvés")
    
    # Filtrer si code_ids spécifiés
    if code_ids:
        code_dirs = [d for d in code_dirs if d.name in code_ids]
        logger.info(f"📚 {len(code_dirs)} codes à ingérer")
    
    total_articles = 0
    
    for code_dir in code_dirs:
        code_id = code_dir.name
        code_name = CODE_MAPPING.get(code_id, code_id)
        
        logger.info(f"\n📖 Code: {code_name} ({code_id})")
        
        # Trouver les fichiers XML
        xml_files = client.find_xml_files(code_dir)
        
        if not xml_files:
            logger.warning(f"   ⚠️ Aucun fichier XML trouvé")
            continue
        
        logger.info(f"   📄 {len(xml_files)} fichiers XML")
        
        # Parser les fichiers
        articles = []
        for xml_file in xml_files:
            parsed = client.parse_legi_xml(xml_file)
            articles.extend(parsed)
        
        logger.success(f"   ✅ {len(articles)} articles parsés")
        total_articles += len(articles)
    
    logger.success(f"\n✅ Total: {total_articles} articles ingérés")
    return total_articles


def main():
    """Fonction principale"""
    # 1. Télécharger
    archive_path = download_freemium()
    if not archive_path:
        logger.error("❌ Échec téléchargement")
        return
    
    # 2. Extraire
    extract_dir = extract_archive(archive_path)
    if not extract_dir:
        logger.error("❌ Échec extraction")
        return
    
    # 3. Ingérer
    total = ingest_from_extracted(extract_dir)
    
    logger.info("=" * 70)
    logger.success(f"✅ PROCESSUS TERMINÉ: {total} articles ingérés")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()

