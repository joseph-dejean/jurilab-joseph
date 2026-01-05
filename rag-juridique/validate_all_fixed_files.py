"""
Validation complète de TOUS les fichiers corrigés
Vérifie que chaque article a un champ 'content' non vide
"""

import json
from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def validate_file(file_path: Path) -> dict:
    """Valide un fichier JSONL et retourne les statistiques"""
    stats = {
        "total": 0,
        "valid": 0,
        "invalid": 0,
        "missing_content": 0,
        "missing_id": 0,
        "json_errors": 0,
        "errors": []
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                
                stats["total"] += 1
                
                try:
                    doc = json.loads(line)
                    
                    # Vérifier id
                    if not doc.get("id"):
                        stats["missing_id"] += 1
                        stats["invalid"] += 1
                        stats["errors"].append(f"Ligne {line_num}: pas d'id")
                        continue
                    
                    # Vérifier content
                    content = doc.get("content", "")
                    if not content or not str(content).strip():
                        stats["missing_content"] += 1
                        stats["invalid"] += 1
                        stats["errors"].append(f"Ligne {line_num} (id={doc.get('id')}): pas de content")
                        continue
                    
                    # Article valide
                    stats["valid"] += 1
                    
                except json.JSONDecodeError as e:
                    stats["json_errors"] += 1
                    stats["invalid"] += 1
                    stats["errors"].append(f"Ligne {line_num}: JSON invalide - {e}")
                except Exception as e:
                    stats["invalid"] += 1
                    stats["errors"].append(f"Ligne {line_num}: Erreur - {e}")
                    
    except Exception as e:
        stats["errors"].append(f"Erreur lecture fichier: {e}")
    
    return stats


def main():
    """Valide tous les fichiers corrigés"""
    logger.info("=" * 70)
    logger.info("🔍 VALIDATION COMPLÈTE DE TOUS LES FICHIERS CORRIGÉS")
    logger.info("=" * 70)
    logger.info("")
    
    settings = get_settings()
    fixed_dir = settings.EXPORT_DIR / "fixed"
    
    if not fixed_dir.exists():
        logger.error("❌ Dossier 'fixed' non trouvé")
        return 1
    
    fixed_files = sorted(fixed_dir.glob("*.jsonl"))
    
    if not fixed_files:
        logger.error("❌ Aucun fichier corrigé trouvé")
        return 1
    
    logger.info(f"📋 Validation de {len(fixed_files)} fichiers...")
    logger.info("")
    
    all_valid = True
    files_with_errors = []
    total_articles = 0
    total_valid = 0
    total_invalid = 0
    
    for file_path in fixed_files:
        stats = validate_file(file_path)
        total_articles += stats["total"]
        total_valid += stats["valid"]
        total_invalid += stats["invalid"]
        
        if stats["invalid"] > 0:
            all_valid = False
            files_with_errors.append({
                "file": file_path.name,
                "stats": stats
            })
            logger.error(f"❌ {file_path.name}:")
            logger.error(f"   Total: {stats['total']}, Valides: {stats['valid']}, Invalides: {stats['invalid']}")
            if stats["missing_content"] > 0:
                logger.error(f"   ⚠️ {stats['missing_content']} articles sans content")
            if stats["missing_id"] > 0:
                logger.error(f"   ⚠️ {stats['missing_id']} articles sans id")
            if stats["json_errors"] > 0:
                logger.error(f"   ⚠️ {stats['json_errors']} erreurs JSON")
            if stats["errors"]:
                logger.error(f"   Premières erreurs: {stats['errors'][:3]}")
        else:
            logger.success(f"✅ {file_path.name}: {stats['valid']} articles valides")
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ GLOBAL")
    logger.info("=" * 70)
    logger.info(f"Fichiers validés: {len(fixed_files)}")
    logger.info(f"Fichiers avec erreurs: {len(files_with_errors)}")
    logger.info(f"Total articles: {total_articles}")
    logger.info(f"Articles valides: {total_valid}")
    logger.info(f"Articles invalides: {total_invalid}")
    logger.info("")
    
    if all_valid:
        logger.success("✅ TOUS LES FICHIERS SONT VALIDES !")
        logger.info("   Tous les articles ont un champ 'content' non vide")
        logger.info("   Prêt pour l'import dans Vertex AI")
    else:
        logger.error("❌ ERREURS DÉTECTÉES !")
        logger.error(f"   {len(files_with_errors)} fichiers ont des problèmes")
        logger.error("")
        logger.error("Fichiers avec erreurs:")
        for item in files_with_errors:
            logger.error(f"   - {item['file']}: {item['stats']['invalid']} articles invalides")
        logger.error("")
        logger.error("💡 Il faut corriger ces fichiers avant l'import")
    
    logger.info("=" * 70)
    
    return 0 if all_valid else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())

