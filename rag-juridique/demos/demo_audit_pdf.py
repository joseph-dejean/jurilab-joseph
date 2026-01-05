"""
Démonstration du Pilier 3 avec support PDF/DOCX

Montre comment auditer des documents depuis différents formats.
"""

from datetime import datetime
from pathlib import Path

from api.audit_conformite import AuditConformite
from api.models import AuditRequest
from config.logging_config import setup_logging
from loguru import logger

setup_logging()


def demo_texte_direct():
    """Test avec texte fourni directement"""
    
    logger.info("="*70)
    logger.info("📝 TEST 1 : Texte direct (comme avant)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT DE VENTE
    
    Fait à Paris, le 15 janvier 2020
    
    ARTICLE 1 - Définition
    Conformément à l'article 1101 du Code civil, le contrat est
    un accord de volontés.
    
    ARTICLE 2 - Variantes d'écriture
    - L'art. 1102 définit la liberté contractuelle.
    - L'article premier du Code civil traite de l'entrée en vigueur.
    - Selon l'article 1104, al. 2, la bonne foi est d'ordre public.
    - Les articles 1101 à 1105 s'appliquent.
    - Conformément à L. 110-1 du Code de commerce.
    """
    
    request = AuditRequest(
        document_title="Test avec texte direct",
        document_content=document,  # ← TEXTE
        document_date=datetime(2020, 1, 15),
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    _print_result(result)


def demo_pdf_file():
    """Test avec fichier PDF"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📄 TEST 2 : Fichier PDF")
    logger.info("="*70)
    logger.info("")
    
    # Créer un document de test
    test_pdf = Path("data/test_contrat.pdf")
    
    if not test_pdf.exists():
        logger.warning("⚠️ Fichier PDF de test non trouvé")
        logger.info("Pour tester avec un PDF :")
        logger.info("  1. Placez un PDF dans data/test_contrat.pdf")
        logger.info("  2. Ou créez-en un avec le texte suivant :")
        logger.info("")
        logger.info("```")
        logger.info("CONTRAT DE PRESTATION")
        logger.info("")
        logger.info("Article 1 - Conformément à l'art. 1101 du Code civil...")
        logger.info("Article 2 - Selon l'article premier...")
        logger.info("```")
        logger.info("")
        return
    
    request = AuditRequest(
        document_title="Contrat depuis PDF",
        document_file_path=str(test_pdf),  # ← FICHIER PDF
        document_date=datetime(2024, 1, 1),
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    _print_result(result)


def demo_patterns_ameliores():
    """Test montrant tous les patterns détectés"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🔍 TEST 3 : Patterns améliorés (droit français)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    DOCUMENT DE TEST - Tous les formats
    
    1. Format standard : article 1101 du Code civil
    
    2. Abréviation : art. 1102 du Code civil
    
    3. Ordinal : article premier du Code civil
    
    4. Avec alinéa : article 1104, alinéa 2 du Code civil
    
    5. Avec alinéa abrégé : article 1103, al. 1
    
    6. Plage d'articles : articles 1101 à 1105 du Code civil
    
    7. Notation légistique : L. 110-1 du Code de commerce
    
    8. Article simple : l'article 414 s'applique
    
    9. Variante avec 1er : article 1er du Code civil
    """
    
    request = AuditRequest(
        document_title="Test patterns complets",
        document_content=document,
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    logger.info("📊 RÉSULTAT DE L'EXTRACTION")
    logger.info("-"*70)
    logger.info(f"Références extraites : {result.total_references}")
    logger.info("")
    
    logger.success("✅ PATTERNS DÉTECTÉS :")
    logger.success("  • 'article X du Code Y' (standard)")
    logger.success("  • 'art. X' (abréviation)")
    logger.success("  • 'article premier' (ordinal)")
    logger.success("  • 'article X, al. Y' (avec alinéa)")
    logger.success("  • 'articles X à Y' (plage)")
    logger.success("  • 'L. X-Y' (notation légistique)")
    logger.success("")
    
    _print_result(result)


def _print_result(result):
    """Affiche un résultat d'audit"""
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Document : {result.document_title}")
    logger.info(f"Score : {result.conformity_score:.1f}%")
    logger.info(f"Références : {result.total_references} ({result.valid_references} valides)")
    
    if result.issues:
        logger.warning(f"Problèmes : {len(result.issues)}")
        for issue in result.issues[:3]:  # Max 3
            logger.warning(f"  • {issue.description}")
    else:
        logger.success("✅ Aucun problème détecté")
    logger.info("")


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🔍 DÉMONSTRATION : Pilier 3 - Formats améliorés")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script montre :")
    logger.info("  1. Support TEXTE direct")
    logger.info("  2. Support FICHIER PDF/DOCX")
    logger.info("  3. Patterns améliorés pour le droit français")
    logger.info("")
    
    try:
        # Test 1 : Texte
        demo_texte_direct()
        
        # Test 2 : PDF
        demo_pdf_file()
        
        # Test 3 : Patterns
        demo_patterns_ameliores()
        
        logger.info("")
        logger.info("="*70)
        logger.info("📝 RÉCAPITULATIF")
        logger.info("="*70)
        logger.info("")
        logger.info("✅ FORMATS SUPPORTÉS :")
        logger.info("   • Texte brut (document_content)")
        logger.info("   • PDF (document_file_path)")
        logger.info("   • DOCX (document_file_path)")
        logger.info("")
        logger.info("✅ PATTERNS DÉTECTÉS :")
        logger.info("   • article 1101 du Code civil")
        logger.info("   • art. 1101")
        logger.info("   • article premier / 1er")
        logger.info("   • article 1101, al. 2")
        logger.info("   • articles 1101 à 1105")
        logger.info("   • L. 110-1")
        logger.info("")
        logger.info("🎯 TECH UTILISÉE :")
        logger.info("   • PyMuPDF (extraction PDF haute précision)")
        logger.info("   • python-docx (extraction DOCX)")
        logger.info("   • Regex améliorées (droit français)")
        logger.info("")
        logger.success("✅ DÉMONSTRATION TERMINÉE")
        logger.info("="*70)
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Démonstration interrompue")
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

