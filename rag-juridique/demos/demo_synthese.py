"""
Démonstration du Pilier 4 : Synthèse et Aide à la Stratégie

Montre les différents types de synthèse disponibles.
"""

from api.models import SynthesisRequest, SynthesisType
from api.synthese_strategie import SynthesisAideStrategie
from config.logging_config import setup_logging
from loguru import logger

setup_logging()


def demo_strategic_note():
    """Test 1 : Note stratégique pour avocat"""
    
    logger.info("="*70)
    logger.info("📋 TEST 1 : Note stratégique (pour avocat)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    DOSSIER : LICENCIEMENT ABUSIF
    
    TRIBUNAL JUDICIAIRE DE PARIS
    RG : 24/12345
    
    DEMANDEUR : M. Jean DUPONT
    DÉFENDERESSE : Société TechCorp SAS
    
    FAITS :
    - Embauche : 15/01/2020 (CDI)
    - Poste : Développeur senior
    - Salaire : 4 200 € brut/mois
    - Licenciement économique : 30/06/2023
    - Motif invoqué : Suppression de poste
    - Ancienneté : 3 ans et 5 mois
    
    CONTEXTE :
    - L'entreprise a embauché 2 développeurs juniors 3 mois après le licenciement
    - Aucun plan de sauvegarde de l'emploi malgré 15 licenciements
    - Pas de proposition de reclassement
    - Lettre de licenciement laconique (3 lignes)
    
    DEMANDES :
    1. Réintégration (subsidiairement indemnisation)
    2. Dommages et intérêts : 50 000 €
    3. Rappel de salaire : 12 600 € (3 mois)
    4. Indemnités légales et conventionnelles
    5. Frais irrépétibles : 3 000 €
    
    PIÈCES :
    - Contrat de travail
    - Fiches de paie (3 dernières années)
    - Lettre de licenciement
    - Témoignages de collègues (3)
    - Annonces d'emploi (embauches post-licenciement)
    """
    
    request = SynthesisRequest(
        synthesis_type=SynthesisType.STRATEGIC_NOTE,
        documents_content=[document],
    )
    
    synthesizer = SynthesisAideStrategie()
    result = synthesizer.synthesize(request)
    
    _print_result(result)


def demo_case_summary():
    """Test 2 : Résumé de cas (brief)"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📝 TEST 2 : Résumé de cas (brief rapide)")
    logger.info("="*70)
    logger.info("")
    
    document = """
    AFFAIRE : Rupture de contrat commercial
    
    DEMANDEUR : Société ABC (fournisseur)
    DÉFENDEUR : Société XYZ (client)
    
    OBJET : Paiement de factures impayées
    MONTANT : 125 000 € TTC
    
    JURIDICTION : Tribunal de Commerce de Lyon
    ÉTAPE : Conclusions en défense déposées
    
    PROCHAINE AUDIENCE : 15/02/2024
    
    FOND : Le défendeur conteste la qualité des marchandises livrées
    et invoque l'exception d'inexécution.
    """
    
    request = SynthesisRequest(
        synthesis_type=SynthesisType.CASE_SUMMARY,
        documents_content=[document],
    )
    
    synthesizer = SynthesisAideStrategie()
    result = synthesizer.synthesize(request)
    
    _print_result(result)


def demo_client_report():
    """Test 3 : Rapport client (vulgarisé)"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📄 TEST 3 : Rapport client (vulgarisé)")
    logger.info("="*70)
    logger.info("")
    
    internal_summary = """
    ANALYSE JURIDIQUE INTERNE
    
    Dossier : Litige locatif (expulsion)
    
    Fondement : Articles 1728 et 1729 du Code civil
    + Loi du 6 juillet 1989
    
    Points forts :
    - Loyers impayés depuis 8 mois (preuve irréfutable)
    - Mise en demeure avec AR
    - Clause résolutoire valide
    - Jurisprudence favorable (Cass. Civ. 3ème, 2022)
    
    Points faibles :
    - Locataire invoque difficultés financières (COVID)
    - Présence d'enfants mineurs
    - Risque de délais accordés par le juge (6-12 mois)
    
    Pronostic : 85% de succès sur le principe
    Mais délais d'expulsion probables (clause de sauvegarde sociale)
    """
    
    request = SynthesisRequest(
        synthesis_type=SynthesisType.CLIENT_REPORT,
        documents_content=[internal_summary],
    )
    
    synthesizer = SynthesisAideStrategie()
    result = synthesizer.synthesize(request)
    
    _print_result(result)


def demo_avec_pdf():
    """Test 4 : Avec fichiers PDF"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📄 TEST 4 : Synthèse depuis fichiers PDF")
    logger.info("="*70)
    logger.info("")
    
    # Vérifier si des fichiers de test existent
    from pathlib import Path
    test_files = [
        "data/test_assignation.pdf",
        "data/test_conclusions.pdf",
    ]
    
    existing_files = [f for f in test_files if Path(f).exists()]
    
    if not existing_files:
        logger.warning("⚠️ Aucun fichier PDF de test trouvé")
        logger.info("Pour tester avec des PDF :")
        logger.info("  1. Placez des PDFs dans data/")
        logger.info("  2. Ou utilisez documents_content avec texte")
        logger.info("")
        return
    
    request = SynthesisRequest(
        synthesis_type=SynthesisType.STRATEGIC_NOTE,
        documents_files=existing_files,
    )
    
    synthesizer = SynthesisAideStrategie()
    result = synthesizer.synthesize(request)
    
    _print_result(result)


def _print_result(result):
    """Affiche un résultat de synthèse"""
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Type : {result.synthesis_type.value}")
    logger.info(f"Confiance : {result.confidence:.0%}")
    logger.info("")
    
    logger.info("📝 SYNTHÈSE :")
    logger.info("-"*70)
    # Afficher les 1000 premiers caractères
    summary_preview = result.summary[:1000]
    if len(result.summary) > 1000:
        summary_preview += "..."
    logger.info(summary_preview)
    logger.info("")
    
    if result.key_points:
        logger.info(f"🎯 POINTS CLÉS ({len(result.key_points)}) :")
        logger.info("-"*70)
        for i, point in enumerate(result.key_points[:5], 1):
            logger.info(f"  {i}. {point}")
        if len(result.key_points) > 5:
            logger.info(f"  ... et {len(result.key_points) - 5} autres")
        logger.info("")
    
    if result.recommendations:
        logger.info(f"💡 RECOMMANDATIONS ({len(result.recommendations)}) :")
        logger.info("-"*70)
        for i, rec in enumerate(result.recommendations[:5], 1):
            logger.info(f"  {i}. {rec}")
        if len(result.recommendations) > 5:
            logger.info(f"  ... et {len(result.recommendations) - 5} autres")
        logger.info("")


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🎯 DÉMONSTRATION : Pilier 4 - Synthèse et Stratégie")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script montre les différents types de synthèse :")
    logger.info("  1. Note stratégique (pour avocat)")
    logger.info("  2. Résumé de cas (brief)")
    logger.info("  3. Rapport client (vulgarisé)")
    logger.info("  4. Support fichiers PDF/DOCX")
    logger.info("")
    
    try:
        # Test 1 : Note stratégique
        demo_strategic_note()
        
        # Test 2 : Résumé de cas
        demo_case_summary()
        
        # Test 3 : Rapport client
        demo_client_report()
        
        # Test 4 : Avec PDF
        demo_avec_pdf()
        
        logger.info("")
        logger.info("="*70)
        logger.info("📝 RÉCAPITULATIF")
        logger.info("="*70)
        logger.info("")
        logger.info("✅ TYPES DE SYNTHÈSE DISPONIBLES :")
        logger.info("   • strategic_note : Note stratégique (avocat)")
        logger.info("   • trend_analysis : Analyse de tendances")
        logger.info("   • client_report : Rapport client (vulgarisé)")
        logger.info("   • case_summary : Résumé de cas (brief)")
        logger.info("   • procedural_timeline : Chronologie procédurale")
        logger.info("")
        logger.info("✅ FORMATS SUPPORTÉS :")
        logger.info("   • Texte brut (documents_content)")
        logger.info("   • PDF (documents_files)")
        logger.info("   • DOCX (documents_files)")
        logger.info("")
        logger.info("✅ ENRICHISSEMENT :")
        logger.info("   • RAG Vertex AI (enrich_with_rag=True)")
        logger.info("   • Jurisprudence pertinente automatique")
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

