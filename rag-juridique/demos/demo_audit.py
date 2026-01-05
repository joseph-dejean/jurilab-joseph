"""
Démonstration du Pilier 3 : Audit et Conformité

Lance des audits de test sur des documents juridiques.
"""

from datetime import datetime

from api.audit_conformite import AuditConformite
from api.models import AuditRequest
from config.logging_config import setup_logging
from loguru import logger

setup_logging()


def demo_contrat_2010():
    """Test avec un contrat de 2010 (avant réforme du droit des contrats)"""
    
    logger.info("="*70)
    logger.info("📋 TEST 1 : Contrat de Vente 2010")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT DE VENTE
    
    Entre les soussignés :
    - Vendeur : Société ABC
    - Acheteur : Monsieur Jean Dupont
    
    Fait à Paris, le 15 janvier 2010
    
    ARTICLE 1 - Objet
    Conformément à l'article 1101 du Code civil, le présent contrat est un accord
    de volontés destiné à créer des obligations.
    
    ARTICLE 2 - Prix
    Le prix est fixé conformément à l'article 1591 du Code civil et aux articles
    L. 110-1 et suivants du Code de commerce.
    
    ARTICLE 3 - Capacité
    Les parties ont la pleine capacité juridique conformément à l'article 414
    du Code civil (majorité fixée à 18 ans).
    
    ARTICLE 4 - Formation du contrat
    Le contrat est formé selon les articles 1127 et suivants du Code civil.
    
    ARTICLE 5 - Force obligatoire
    Conformément à l'article 1134 du Code civil, les conventions légalement 
    formées tiennent lieu de loi à ceux qui les ont faites.
    """
    
    request = AuditRequest(
        document_title="Contrat de Vente 2010",
        document_content=document,
        document_date=datetime(2010, 1, 15),
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    _print_audit_result(result)


def demo_contrat_recent():
    """Test avec un contrat récent"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📋 TEST 2 : Contrat de Prestation 2024")
    logger.info("="*70)
    logger.info("")
    
    document = """
    CONTRAT DE PRESTATION DE SERVICES
    
    Entre :
    - Prestataire : Tech Solutions SAS
    - Client : Innovation Corp
    
    Fait à Lyon, le 10 mars 2024
    
    PRÉAMBULE
    Les parties se sont rapprochées en vue de conclure un contrat de prestation
    conformément aux dispositions du Code civil.
    
    ARTICLE 1 - Définition
    Au sens de l'article 1101 du Code civil, le contrat est un accord de volontés
    entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou 
    éteindre des obligations.
    
    ARTICLE 2 - Liberté contractuelle
    Conformément à l'article 1102 du Code civil, chacun est libre de contracter
    ou de ne pas contracter, de choisir son cocontractant et de déterminer le
    contenu et la forme du contrat dans les limites fixées par la loi.
    
    ARTICLE 3 - Bonne foi
    Les contrats doivent être négociés, formés et exécutés de bonne foi, 
    conformément à l'article 1104 du Code civil.
    
    ARTICLE 4 - Force obligatoire
    Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits,
    en application de l'article 1103 du Code civil.
    """
    
    request = AuditRequest(
        document_title="Contrat de Prestation 2024",
        document_content=document,
        document_date=datetime(2024, 3, 10),
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    _print_audit_result(result)


def demo_document_sans_date():
    """Test avec un document sans date"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📋 TEST 3 : Document sans date spécifiée")
    logger.info("="*70)
    logger.info("")
    
    document = """
    MÉMORANDUM D'ACCORD
    
    Les parties conviennent de ce qui suit :
    
    1. Conformément à l'article 1101 du Code civil, le présent mémorandum
       constitue un contrat liant les parties.
    
    2. La majorité est fixée à dix-huit ans accomplis conformément à
       l'article 414 du Code civil.
    
    3. Les lois entrent en vigueur selon l'article 1 du Code civil.
    """
    
    request = AuditRequest(
        document_title="Mémorandum d'Accord",
        document_content=document,
        # Pas de date spécifiée
    )
    
    auditor = AuditConformite()
    result = auditor.audit(request)
    
    _print_audit_result(result)


def _print_audit_result(result):
    """Affiche le résultat d'un audit de manière formatée"""
    
    logger.info("📊 RÉSULTAT DE L'AUDIT")
    logger.info("-"*70)
    logger.info(f"Document : {result.document_title}")
    logger.info(f"Date de l'audit : {result.audit_date.strftime('%d/%m/%Y %H:%M')}")
    if result.document_date:
        logger.info(f"Date du document : {result.document_date.strftime('%d/%m/%Y')}")
    logger.info("")
    logger.info(f"Score de conformité : {result.conformity_score:.1f}%")
    logger.info(f"Références totales : {result.total_references}")
    logger.info(f"Références valides : {result.valid_references}")
    logger.info(f"Problèmes détectés : {len(result.issues)}")
    logger.info("")
    
    if result.issues:
        logger.info("⚠️ PROBLÈMES DÉTECTÉS:")
        logger.info("-"*70)
        
        # Grouper par sévérité
        critical = [i for i in result.issues if i.severity.value == "critical"]
        high = [i for i in result.issues if i.severity.value == "high"]
        medium = [i for i in result.issues if i.severity.value == "medium"]
        low = [i for i in result.issues if i.severity.value == "low"]
        
        if critical:
            logger.error(f"🔴 CRITIQUE ({len(critical)}):")
            for issue in critical:
                logger.error(f"   • {issue.description}")
                logger.error(f"     Référence: {issue.article_reference}")
                logger.error(f"     💡 {issue.recommendation}")
                logger.error("")
        
        if high:
            logger.warning(f"🟠 ÉLEVÉ ({len(high)}):")
            for issue in high:
                logger.warning(f"   • {issue.description}")
                logger.warning(f"     Référence: {issue.article_reference}")
                logger.warning(f"     💡 {issue.recommendation}")
                logger.warning("")
        
        if medium:
            logger.info(f"🟡 MOYEN ({len(medium)}):")
            for issue in medium:
                logger.info(f"   • {issue.description}")
                logger.info(f"     Référence: {issue.article_reference}")
                logger.info(f"     💡 {issue.recommendation}")
                logger.info("")
        
        if low:
            logger.info(f"🟢 FAIBLE ({len(low)}):")
            for issue in low:
                logger.info(f"   • {issue.description}")
                logger.info(f"     Référence: {issue.article_reference}")
                logger.info(f"     💡 {issue.recommendation}")
                logger.info("")
    else:
        logger.success("✅ Aucun problème détecté !")
        logger.success("")
    
    logger.info("💡 RECOMMANDATIONS:")
    logger.info("-"*70)
    for rec in result.recommendations:
        logger.info(f"   {rec}")
    logger.info("")


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🔍 DÉMONSTRATION : Pilier 3 - Audit et Conformité")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script audite plusieurs documents juridiques pour détecter")
    logger.info("les anachronismes et références obsolètes.")
    logger.info("")
    
    try:
        # Test 1 : Contrat ancien (2010)
        demo_contrat_2010()
        
        # Test 2 : Contrat récent (2024)
        demo_contrat_recent()
        
        # Test 3 : Document sans date
        demo_document_sans_date()
        
        logger.info("")
        logger.info("="*70)
        logger.success("✅ DÉMONSTRATION TERMINÉE")
        logger.info("="*70)
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Démonstration interrompue par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

