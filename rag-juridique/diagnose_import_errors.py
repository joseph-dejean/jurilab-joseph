"""
Script pour diagnostiquer les erreurs d'import
Vérifie le format JSONL et identifie les problèmes potentiels
"""

import json
from pathlib import Path
from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)

def validate_jsonl_file(file_path: Path) -> dict:
    """
    Valide un fichier JSONL et retourne les erreurs trouvées
    
    Returns:
        Dict avec statistiques et erreurs
    """
    errors = []
    warnings = []
    stats = {
        "total_lines": 0,
        "valid_json": 0,
        "invalid_json": 0,
        "missing_fields": {},
        "invalid_types": {},
    }
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                stats["total_lines"] += 1
                line = line.strip()
                
                if not line:
                    continue
                
                try:
                    doc = json.loads(line)
                    stats["valid_json"] += 1
                    
                    # Vérifier les champs requis pour Vertex AI
                    required_fields = ["id", "content"]
                    for field in required_fields:
                        if field not in doc:
                            if field not in stats["missing_fields"]:
                                stats["missing_fields"][field] = 0
                            stats["missing_fields"][field] += 1
                            errors.append(f"Ligne {line_num}: Champ '{field}' manquant")
                    
                    # Vérifier les types
                    if "id" in doc and not isinstance(doc["id"], str):
                        errors.append(f"Ligne {line_num}: 'id' doit être une string")
                    
                    if "content" in doc and not isinstance(doc["content"], str):
                        errors.append(f"Ligne {line_num}: 'content' doit être une string")
                    
                    # Vérifier la longueur du contenu
                    if "content" in doc:
                        content_len = len(doc["content"])
                        if content_len == 0:
                            warnings.append(f"Ligne {line_num}: 'content' est vide")
                        elif content_len > 100000:  # ~100KB
                            warnings.append(f"Ligne {line_num}: 'content' très long ({content_len} chars)")
                    
                    # Vérifier les caractères spéciaux dans l'ID
                    if "id" in doc:
                        id_val = doc["id"]
                        if not id_val or len(id_val) == 0:
                            errors.append(f"Ligne {line_num}: 'id' est vide")
                    
                except json.JSONDecodeError as e:
                    stats["invalid_json"] += 1
                    errors.append(f"Ligne {line_num}: JSON invalide - {e}")
    
    except Exception as e:
        errors.append(f"Erreur lecture fichier: {e}")
    
    return {
        "file": file_path.name,
        "stats": stats,
        "errors": errors[:20],  # Limiter à 20 erreurs
        "warnings": warnings[:20],  # Limiter à 20 warnings
        "error_count": len(errors),
        "warning_count": len(warnings),
    }


def main():
    """Diagnostique tous les fichiers JSONL"""
    logger.info("=" * 70)
    logger.info("🔍 DIAGNOSTIC DES ERREURS D'IMPORT")
    logger.info("=" * 70)
    logger.info("")
    
    settings = get_settings()
    jsonl_files = sorted(settings.EXPORT_DIR.glob("*.jsonl"))
    
    logger.info(f"📋 {len(jsonl_files)} fichiers à analyser")
    logger.info("")
    
    all_results = []
    total_errors = 0
    total_warnings = 0
    
    for file_path in jsonl_files:
        logger.info(f"🔍 Analyse: {file_path.name}")
        result = validate_jsonl_file(file_path)
        all_results.append(result)
        total_errors += result["error_count"]
        total_warnings += result["warning_count"]
        
        if result["error_count"] > 0 or result["warning_count"] > 0:
            logger.warning(f"   ⚠️ {result['error_count']} erreurs, {result['warning_count']} warnings")
        else:
            logger.success(f"   ✅ Aucun problème détecté")
    
    # Résumé
    logger.info("")
    logger.info("=" * 70)
    logger.info("📊 RÉSUMÉ")
    logger.info("=" * 70)
    logger.info(f"Total fichiers analysés: {len(jsonl_files)}")
    logger.info(f"Total erreurs: {total_errors}")
    logger.info(f"Total warnings: {total_warnings}")
    logger.info("")
    
    # Fichiers avec erreurs
    files_with_errors = [r for r in all_results if r["error_count"] > 0]
    if files_with_errors:
        logger.warning("⚠️ Fichiers avec erreurs:")
        for result in files_with_errors[:10]:  # Afficher les 10 premiers
            logger.warning(f"   - {result['file']}: {result['error_count']} erreurs")
            if result['errors']:
                logger.warning(f"     Exemple: {result['errors'][0]}")
    
    # Statistiques globales
    logger.info("")
    logger.info("📈 Statistiques globales:")
    total_lines = sum(r["stats"]["total_lines"] for r in all_results)
    valid_json = sum(r["stats"]["valid_json"] for r in all_results)
    invalid_json = sum(r["stats"]["invalid_json"] for r in all_results)
    
    logger.info(f"   Total lignes: {total_lines:,}")
    logger.info(f"   JSON valides: {valid_json:,}")
    logger.info(f"   JSON invalides: {invalid_json:,}")
    
    # Champs manquants
    all_missing = {}
    for result in all_results:
        for field, count in result["stats"]["missing_fields"].items():
            all_missing[field] = all_missing.get(field, 0) + count
    
    if all_missing:
        logger.warning("")
        logger.warning("⚠️ Champs manquants fréquents:")
        for field, count in sorted(all_missing.items(), key=lambda x: x[1], reverse=True):
            logger.warning(f"   - {field}: {count} occurrences")
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("💡 Prochaines étapes:")
    logger.info("   1. Vérifier les logs d'erreur dans la console GCP")
    logger.info("   2. Corriger les fichiers avec erreurs")
    logger.info("   3. Réimporter les fichiers corrigés")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()

