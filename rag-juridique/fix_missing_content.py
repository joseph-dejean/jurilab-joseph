"""
Corrige les articles sans contenu dans les fichiers JSONL
"""

import json
from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def fix_jsonl_file(input_file: Path, output_file: Path) -> dict:
    """
    Corrige un fichier JSONL en excluant les articles sans content
    
    Returns:
        Dict avec statistiques
    """
    stats = {
        "total": 0,
        "kept": 0,
        "removed": 0,
        "fixed": 0,
    }
    
    fixed_docs = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                stats["total"] += 1
                
                try:
                    doc = json.loads(line)
                    
                    # Vérifier si content existe et n'est pas vide
                    content = doc.get("content", "").strip()
                    
                    if not content:
                        # Article sans contenu - l'exclure
                        stats["removed"] += 1
                        logger.debug(f"   Article {doc.get('id', 'unknown')} exclu (pas de contenu)")
                        continue
                    
                    # Vérifier que id existe
                    if not doc.get("id"):
                        stats["removed"] += 1
                        logger.debug(f"   Article exclu (pas d'ID)")
                        continue
                    
                    # Article valide - le garder
                    fixed_docs.append(doc)
                    stats["kept"] += 1
                    
                except json.JSONDecodeError as e:
                    stats["removed"] += 1
                    logger.warning(f"   Ligne invalide: {e}")
                    continue
        
        # Écrire le fichier corrigé
        if fixed_docs:
            with open(output_file, 'w', encoding='utf-8') as f:
                for doc in fixed_docs:
                    f.write(json.dumps(doc, ensure_ascii=False) + '\n')
        
        return stats
    
    except Exception as e:
        logger.error(f"Erreur traitement {input_file}: {e}")
        return stats


def main():
    """Corrige tous les fichiers JSONL"""
    logger.info("=" * 70)
    logger.info("🔧 CORRECTION DES FICHIERS JSONL")
    logger.info("=" * 70)
    logger.info("")
    
    settings = get_settings()
    export_dir = settings.EXPORT_DIR
    fixed_dir = export_dir / "fixed"
    fixed_dir.mkdir(exist_ok=True)
    
    jsonl_files = sorted(export_dir.glob("*.jsonl"))
    
    logger.info(f"📋 {len(jsonl_files)} fichiers à corriger")
    logger.info("")
    
    total_stats = {
        "total": 0,
        "kept": 0,
        "removed": 0,
    }
    
    for file_path in jsonl_files:
        logger.info(f"🔧 Correction: {file_path.name}")
        
        output_file = fixed_dir / file_path.name
        stats = fix_jsonl_file(file_path, output_file)
        
        total_stats["total"] += stats["total"]
        total_stats["kept"] += stats["kept"]
        total_stats["removed"] += stats["removed"]
        
        if stats["removed"] > 0:
            logger.warning(f"   ⚠️ {stats['removed']} articles exclus, {stats['kept']} conservés")
        else:
            logger.success(f"   ✅ {stats['kept']} articles conservés")
    
    # Résumé
    logger.info("")
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ")
    logger.info("=" * 70)
    logger.info(f"Total articles: {total_stats['total']:,}")
    logger.info(f"Articles conservés: {total_stats['kept']:,}")
    logger.info(f"Articles exclus: {total_stats['removed']:,}")
    logger.info("")
    logger.info(f"📁 Fichiers corrigés dans: {fixed_dir}")
    logger.info("")
    logger.info("💡 Prochaines étapes:")
    logger.info("   1. Uploader les fichiers corrigés vers GCS")
    logger.info("   2. Réimporter dans Vertex AI")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()

