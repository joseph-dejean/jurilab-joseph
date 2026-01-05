"""
Identifie SEULEMENT les fichiers qui ont vraiment été modifiés (articles exclus)
"""

import json
from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def count_articles(file_path: Path) -> int:
    """Compte les articles valides dans un fichier JSONL"""
    count = 0
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        json.loads(line)
                        count += 1
                    except:
                        pass
    except:
        pass
    return count


def main():
    """Identifie les fichiers réellement modifiés"""
    logger.info("=" * 70)
    logger.info("🔍 IDENTIFICATION DES FICHIERS RÉELLEMENT MODIFIÉS")
    logger.info("=" * 70)
    logger.info("")
    
    settings = get_settings()
    export_dir = settings.EXPORT_DIR
    fixed_dir = export_dir / "fixed"
    
    if not fixed_dir.exists():
        logger.error("❌ Dossier 'fixed' non trouvé")
        return 1
    
    # Lister tous les fichiers originaux
    original_files = sorted(export_dir.glob("*.jsonl"))
    fixed_files = {f.name: f for f in fixed_dir.glob("*.jsonl")}
    
    logger.info(f"📋 {len(original_files)} fichiers originaux")
    logger.info(f"📋 {len(fixed_files)} fichiers corrigés")
    logger.info("")
    
    modified_files = []
    unchanged_files = []
    empty_files = []
    
    for original_file in original_files:
        fixed_file = fixed_dir / original_file.name
        
        # Si le fichier corrigé n'existe pas, c'est qu'il était vide
        if not fixed_file.exists():
            original_count = count_articles(original_file)
            if original_count > 0:
                empty_files.append({
                    "file": original_file.name,
                    "count": original_count,
                    "gcs_path": f"legal-rag-data-sofia-2025/{original_file.name}"
                })
            continue
        
        # Compter les articles
        original_count = count_articles(original_file)
        fixed_count = count_articles(fixed_file)
        
        if original_count != fixed_count:
            # Fichier modifié
            modified_files.append({
                "file": original_file.name,
                "original": original_count,
                "fixed": fixed_count,
                "excluded": original_count - fixed_count,
                "gcs_path": f"legal-rag-data-sofia-2025/{fixed_file.name}"
            })
        else:
            # Fichier inchangé
            unchanged_files.append(original_file.name)
    
    # Résumé
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ")
    logger.info("=" * 70)
    logger.info(f"✅ Fichiers inchangés (pas besoin de réimporter): {len(unchanged_files)}")
    logger.info(f"⚠️ Fichiers modifiés (à réimporter): {len(modified_files)}")
    logger.info(f"❌ Fichiers vides (tous articles exclus): {len(empty_files)}")
    logger.info("")
    
    if modified_files:
        logger.warning("⚠️ Fichiers modifiés (articles exclus):")
        total_excluded = 0
        for item in modified_files:
            logger.warning(f"   - {item['file']}: {item['excluded']} articles exclus ({item['original']} → {item['fixed']})")
            total_excluded += item['excluded']
        logger.info(f"   Total articles exclus: {total_excluded}")
        logger.info("")
    
    if empty_files:
        logger.warning("❌ Fichiers vides (tous articles exclus, ne pas réimporter):")
        for item in empty_files:
            logger.warning(f"   - {item['file']}: {item['count']} articles exclus (fichier vide)")
        logger.info("")
    
    # Générer file_paths.txt avec SEULEMENT les fichiers modifiés
    if modified_files:
        logger.info("📝 Génération de file_paths.txt (fichiers modifiés uniquement)...")
        paths_file = Path("file_paths.txt")
        with open(paths_file, 'w', encoding='utf-8') as f:
            for item in modified_files:
                f.write(f"{item['gcs_path']}\n")
        
        logger.success(f"✅ Fichier généré: {paths_file}")
        logger.info(f"   {len(modified_files)} fichiers à réimporter (modifiés)")
        logger.info("")
        logger.info("💡 Ces fichiers ont eu des articles exclus et doivent être réimportés")
    else:
        logger.success("✅ Aucun fichier modifié - tous les fichiers sont identiques")
        logger.info("   Pas besoin de réimporter (sauf si vous voulez corriger les erreurs d'import)")
    
    logger.info("=" * 70)
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())

