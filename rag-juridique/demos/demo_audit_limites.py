"""
Démonstration des LIMITES du Pilier 3 : Audit et Conformité

Ce script montre les cas où le système échoue ou a des limites.
"""

from datetime import datetime

from api.audit_conformite import AuditConformite
from api.models import AuditRequest
from config.logging_config import setup_logging
from loguru import logger

setup_logging()


def test_formats_non_detectes():
    """Test 1 : Formats d'articles NON détectés par les regex"""
    
    logger.info("="*70)
    logger.info("🧪 TEST 1 : Formats NON détectés (limites regex)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT DE VENTE
    
    Ce contrat est soumis aux dispositions suivantes :
    
    1. L'art. 1101 définit le contrat (ABRÉVIATION)
    
    2. Selon l'article mille cent un (LETTRES)
    
    3. Conformément à l'Art. 1101, al. 2 (AVEC ALINÉA)
    
    4. Les articles 1101 à 1105 s'appliquent (PLAGE)
    
    5. L'article L. 110-1 du Code de commerce (NOTATION LÉGISTIQUE)
    
    6. En vertu de l'article 1er du Code civil (ORDINAL)
    """
    
    request = AuditRequest(
        document_title="Test formats non standard",
        document_content=document,
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Références extraites : {result.total_references}")
    logger.info("")
    
    logger.warning("⚠️ PROBLÈME : La regex basique rate beaucoup de formats !")
    logger.warning("   • 'art.' (abréviation)")
    logger.warning("   • 'mille cent un' (lettres)")
    logger.warning("   • 'al. 2' (alinéa)")
    logger.warning("   • 'articles X à Y' (plages)")
    logger.warning("   • 'L. 110-1' (notation légistique)")
    logger.warning("")
    
    logger.info("💡 SOLUTION : Utiliser NLP (Spacy) au lieu de regex")
    logger.info("")


def test_article_inexistant():
    """Test 2 : Article qui n'existe pas"""
    
    logger.info("="*70)
    logger.info("🧪 TEST 2 : Article inexistant")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT FICTIF
    
    Conformément à l'article 9999 du Code civil (n'existe pas),
    les parties conviennent de ce qui suit...
    
    De plus, l'article 8888 du Code pénal (inexistant) s'applique.
    """
    
    request = AuditRequest(
        document_title="Test article inexistant",
        document_content=document,
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Score de conformité : {result.conformity_score:.1f}%")
    logger.info(f"Problèmes détectés : {len(result.issues)}")
    logger.info("")
    
    if result.issues:
        logger.error("🔴 PROBLÈMES DÉTECTÉS :")
        for issue in result.issues:
            logger.error(f"   • {issue.description}")
            logger.error(f"     Référence: {issue.article_reference}")
            logger.error("")
    
    logger.success("✅ BONNE DÉTECTION : Le système détecte les articles inexistants !")
    logger.info("")


def test_dataset_limite():
    """Test 3 : Articles hors du dataset de test"""
    
    logger.info("="*70)
    logger.info("🧪 TEST 3 : Limites du dataset")
    logger.info("="*70)
    logger.info("")
    
    logger.warning("⚠️ NOTRE DATASET ACTUEL :")
    logger.warning("   • Seulement 10 articles du Code Civil")
    logger.warning("   • Tous en VIGUEUR")
    logger.warning("   • Aucun article ABROGE")
    logger.warning("")
    
    document = """
    CONTRAT DE VENTE
    
    Article 1 - Référence à l'article 1134 du Code civil
    (cet article a été ABROGÉ en 2016 et remplacé par l'article 1103)
    
    Article 2 - Référence à l'article 1583 du Code civil
    (cet article existe mais n'est pas dans notre dataset de test)
    """
    
    request = AuditRequest(
        document_title="Test dataset limité",
        document_content=document,
        document_date=datetime(2010, 1, 1),  # Avant l'abrogation
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Score de conformité : {result.conformity_score:.1f}%")
    logger.info(f"Problèmes détectés : {len(result.issues)}")
    logger.info("")
    
    if result.issues:
        for issue in result.issues:
            logger.info(f"   • {issue.description}")
    
    logger.warning("")
    logger.warning("⚠️ LIMITATION : Ces articles ne sont PAS dans notre dataset !")
    logger.warning("   → L'article 1134 DEVRAIT être détecté comme ABROGE")
    logger.warning("   → L'article 1583 DEVRAIT être trouvé")
    logger.warning("")
    
    logger.info("💡 SOLUTION : Ingérer TOUS les articles du Code Civil")
    logger.info("")


def test_pdf_non_supporte():
    """Test 4 : PDF non supporté"""
    
    logger.info("="*70)
    logger.info("🧪 TEST 4 : PDF non supporté (pour le moment)")
    logger.info("="*70)
    logger.info("")
    
    logger.warning("⚠️ ACTUELLEMENT :")
    logger.warning("   • Seulement TEXTE BRUT supporté")
    logger.warning("   • Pas de PDF")
    logger.warning("   • Pas de DOCX")
    logger.warning("")
    
    logger.info("📝 Pour utiliser un PDF, il faudrait :")
    logger.info("")
    logger.info("```python")
    logger.info("import PyPDF2")
    logger.info("")
    logger.info("def extract_text_from_pdf(file_path):")
    logger.info("    with open(file_path, 'rb') as file:")
    logger.info("        reader = PyPDF2.PdfReader(file)")
    logger.info("        text = ''")
    logger.info("        for page in reader.pages:")
    logger.info("            text += page.extract_text()")
    logger.info("    return text")
    logger.info("")
    logger.info("# Puis")
    logger.info("text = extract_text_from_pdf('contrat.pdf')")
    logger.info("request = AuditRequest(")
    logger.info("    document_content=text,  # Texte extrait")
    logger.info("    ...)")
    logger.info("```")
    logger.info("")
    
    logger.info("💡 SOLUTION : Ajouter PyPDF2 ou pdfplumber")
    logger.info("")


def test_anachronisme_temporel():
    """Test 5 : Détection temporelle non implémentée"""
    
    logger.info("="*70)
    logger.info("🧪 TEST 5 : Anachronisme temporel (non détecté)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT DE VENTE
    
    Signé à Paris, le 15 janvier 2010
    
    Article 1 - Conformément à l'article 1101 du Code civil,
    le contrat est un accord de volontés...
    
    (NOTE : L'article 1101 a été MODIFIÉ en 2016 lors de la réforme
    du droit des contrats. La définition actuelle est différente de
    celle de 2010 !)
    """
    
    request = AuditRequest(
        document_title="Test anachronisme temporel",
        document_content=document,
        document_date=datetime(2010, 1, 15),
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Score de conformité : {result.conformity_score:.1f}%")
    logger.info(f"Problèmes détectés : {len(result.issues)}")
    logger.info("")
    
    logger.warning("⚠️ PROBLÈME : L'anachronisme temporel N'EST PAS détecté !")
    logger.warning("   • Document : 2010")
    logger.warning("   • Article 1101 : modifié en 2016")
    logger.warning("   → La version de 2010 ≠ version actuelle")
    logger.warning("   → DEVRAIT être signalé !")
    logger.warning("")
    
    logger.info("💡 SOLUTION : Comparer date document vs date modification")
    logger.info("   • Récupérer l'historique des versions")
    logger.info("   • Vérifier quelle version était en vigueur à la date du document")
    logger.info("   • Comparer avec la version actuelle")
    logger.info("")


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🔍 DÉMONSTRATION : LIMITES du Pilier 3")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script montre les CAS D'ÉCHEC et LIMITES du système actuel.")
    logger.info("")
    
    try:
        test_formats_non_detectes()
        test_article_inexistant()
        test_dataset_limite()
        test_pdf_non_supporte()
        test_anachronisme_temporel()
        
        logger.info("")
        logger.info("="*70)
        logger.info("📝 CONCLUSION")
        logger.info("="*70)
        logger.info("")
        logger.info("Le Pilier 3 est un MVP FONCTIONNEL mais avec des limites :")
        logger.info("")
        logger.info("✅ Ce qui fonctionne :")
        logger.info("   • Extraction basique (regex)")
        logger.info("   • Vérification via RAG")
        logger.info("   • Détection articles inexistants")
        logger.info("   • Rapports structurés")
        logger.info("")
        logger.info("❌ Limites actuelles :")
        logger.info("   • Regex rate beaucoup de formats")
        logger.info("   • Dataset limité (10 articles)")
        logger.info("   • Pas de PDF/DOCX")
        logger.info("   • Pas de détection temporelle")
        logger.info("")
        logger.info("🚀 Améliorations futures :")
        logger.info("   • NLP (Spacy) au lieu de regex")
        logger.info("   • Dataset complet avec articles abrogés")
        logger.info("   • Extracteur PDF/DOCX")
        logger.info("   • Analyse temporelle (versions)")
        logger.info("")
        logger.info("="*70)
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

