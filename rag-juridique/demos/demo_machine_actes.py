"""
Démonstration du Pilier 1 : Machine à Actes

Montre la génération automatique d'actes par mimétisme intelligent.
"""

from api.machine_actes import MachineActes
from api.models import ActGenerationRequest, ActType, DataInputFormat, OutputFormat
from config.logging_config import setup_logging
from loguru import logger

setup_logging()


def demo_contrat_vente():
    """Test 1 : Contrat de vente simple"""
    
    logger.info("="*70)
    logger.info("📋 TEST 1 : Contrat de vente")
    logger.info("="*70)
    logger.info("")
    
    template = """
    CONTRAT DE VENTE AUTOMOBILE
    
    Entre les soussignés :
    
    Monsieur Jean DURAND, né le 15/03/1980 à Lyon
    Demeurant : 5 rue de la République, 69001 Lyon
    ci-après dénommé "le Vendeur"
    
    ET
    
    Madame Marie LEBLANC, née le 22/07/1985 à Paris
    Demeurant : 12 avenue des Champs, 75008 Paris
    ci-après dénommée "l'Acheteur"
    
    Il a été convenu et arrêté ce qui suit :
    
    ARTICLE 1 - OBJET DE LA VENTE
    Le Vendeur cède à l'Acheteur, qui accepte, un véhicule automobile
    dont les caractéristiques sont les suivantes :
    - Marque : Renault
    - Modèle : Clio
    - Immatriculation : AB-123-CD
    - Kilométrage : 45 000 km
    
    ARTICLE 2 - PRIX ET MODALITÉS DE PAIEMENT
    Le prix de vente est fixé à la somme de cinquante mille (50 000) euros.
    Le paiement sera effectué par virement bancaire à la signature des présentes.
    
    ARTICLE 3 - GARANTIES
    Le véhicule est vendu en l'état, sans garantie.
    
    ARTICLE 4 - TRANSFERT DE PROPRIÉTÉ
    Le transfert de propriété s'opère dès le paiement intégral du prix.
    
    Fait à Lyon, le 15 janvier 2020
    En deux exemplaires originaux
    
    Le Vendeur                    L'Acheteur
    (Signature)                   (Signature)
    """
    
    client_data = """
    Vendeur : Pierre MARTIN, né le 10/05/1975 à Marseille, 10 rue de la Paix, 75001 Paris
    Acheteur : Sophie DUPONT, née le 18/09/1990 à Bordeaux, 25 avenue Victor Hugo, 69003 Lyon
    Véhicule : Mercedes Classe A, GH-789-IJ, 28 000 km
    Prix : 75 000 euros
    Lieu : Paris
    Date : 18 décembre 2025
    """
    
    request = ActGenerationRequest(
        act_type=ActType.CONTRACT_SALE,
        template_content=template,
        client_data=client_data,
    )
    
    machine = MachineActes()
    result = machine.generate(request)
    
    _print_result(result)


def demo_bail_habitation():
    """Test 2 : Bail d'habitation"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🏠 TEST 2 : Bail d'habitation")
    logger.info("="*70)
    logger.info("")
    
    template = """
    BAIL D'HABITATION
    
    Entre :
    
    Monsieur Robert BLANC
    Propriétaire du bien ci-après désigné
    Adresse : 3 place de la Mairie, 13001 Marseille
    
    Ci-après dénommé "le Bailleur"
    
    Et :
    
    Mademoiselle Julie NOIR
    Adresse actuelle : 7 rue du Port, 13002 Marseille
    
    Ci-après dénommée "le Locataire"
    
    IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :
    
    Article 1 - DÉSIGNATION DU BIEN
    Le Bailleur donne en location un appartement de type T2
    situé au 15 rue de la Liberté, 13001 Marseille
    
    Article 2 - DURÉE
    Le présent bail est consenti pour une durée de trois (3) ans
    à compter du 1er février 2020
    
    Article 3 - LOYER
    Le loyer mensuel est fixé à mille deux cents (1 200) euros
    payable le premier de chaque mois
    
    Article 4 - CHARGES
    Les charges sont évaluées à cent cinquante (150) euros par mois
    
    Article 5 - DÉPÔT DE GARANTIE
    Un dépôt de garantie de mille deux cents (1 200) euros
    est versé à la signature
    
    Fait à Marseille, le 15 janvier 2020
    En deux exemplaires originaux
    
    Le Bailleur                   Le Locataire
    """
    
    client_data = """
    Bailleur : Madame Claire ROUGE, 8 boulevard Longchamp, 13001 Marseille
    Locataire : Monsieur Thomas VERT, 22 avenue du Prado, 13006 Marseille
    Bien : Appartement T3, 25 rue Paradis, 13001 Marseille
    Durée : 3 ans
    Date début : 1er mars 2026
    Loyer : 1 500 euros
    Charges : 180 euros
    Dépôt : 1 500 euros
    Lieu : Marseille
    Date : 18 décembre 2025
    """
    
    request = ActGenerationRequest(
        act_type=ActType.LEASE_RESIDENTIAL,
        template_content=template,
        client_data=client_data,
    )
    
    machine = MachineActes()
    result = machine.generate(request)
    
    _print_result(result)


def demo_nda():
    """Test 3 : Accord de confidentialité"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🔒 TEST 3 : Accord de confidentialité (NDA)")
    logger.info("="*70)
    logger.info("")
    
    template = """
    ACCORD DE CONFIDENTIALITÉ
    
    Entre :
    
    La société TechCorp SAS
    Siège social : 10 rue de l'Innovation, 75002 Paris
    Représentée par : M. François BLANC, Directeur Général
    
    Ci-après "la Partie Divulgatrice"
    
    Et :
    
    La société InnoSoft SARL
    Siège social : 5 avenue des Startups, 69001 Lyon
    Représentée par : Mme Sarah DUPONT, Présidente
    
    Ci-après "la Partie Réceptrice"
    
    PRÉAMBULE
    Dans le cadre d'un projet de collaboration commerciale,
    les parties sont amenées à échanger des informations confidentielles.
    
    Article 1 - DÉFINITION
    Les informations confidentielles désignent toutes données,
    documents et savoir-faire échangés.
    
    Article 2 - OBLIGATIONS
    La Partie Réceptrice s'engage à :
    - Ne pas divulguer les informations
    - Les utiliser uniquement dans le cadre du projet
    - Les protéger avec le même soin que ses propres informations
    
    Article 3 - DURÉE
    Le présent accord est conclu pour une durée de deux (2) ans
    à compter de sa signature.
    
    Fait à Paris, le 10 mars 2020
    En deux exemplaires
    
    Pour TechCorp SAS            Pour InnoSoft SARL
    """
    
    client_data = """
    Partie Divulgatrice : Société DataLab SA, 12 rue de la Data, 75008 Paris, M. Jean MARTIN, CEO
    Partie Réceptrice : Société CloudTech SAS, 8 boulevard Cloud, 69002 Lyon, M. Paul BERNARD, CTO
    Projet : Développement plateforme IA
    Durée : 3 ans
    Lieu : Paris
    Date : 18 décembre 2025
    """
    
    request = ActGenerationRequest(
        act_type=ActType.NDA,
        template_content=template,
        client_data=client_data,
    )
    
    machine = MachineActes()
    result = machine.generate(request)
    
    _print_result(result)


def demo_avec_json():
    """Test 4 : Données en format JSON"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("📊 TEST 4 : Données client en JSON")
    logger.info("="*70)
    logger.info("")
    
    template = """
    CONTRAT DE PRESTATION DE SERVICES
    
    Entre :
    Société ABC, 10 rue Test, 75001 Paris
    Représentée par M. Test Dupont
    
    Et :
    Client XYZ, 5 avenue Client, 69001 Lyon
    
    Objet : Prestation de développement web
    Durée : 6 mois
    Prix : 10 000 euros HT
    
    Fait à Paris, le 1er janvier 2020
    """
    
    client_data_json = """{
        "societe_prestataire": "DevCorp SAS",
        "adresse_prestataire": "25 rue du Code, 75011 Paris",
        "representant": "Mme Sophie DEV",
        "societe_cliente": "BizCorp SARL",
        "adresse_cliente": "12 avenue Business, 69003 Lyon",
        "objet": "Développement application mobile",
        "duree": "12 mois",
        "prix": "50 000 euros HT",
        "lieu": "Paris",
        "date": "18 décembre 2025"
    }"""
    
    request = ActGenerationRequest(
        act_type=ActType.CONTRACT_SERVICE,
        template_content=template,
        client_data=client_data_json,
        client_data_format=DataInputFormat.JSON,
    )
    
    machine = MachineActes()
    result = machine.generate(request)
    
    _print_result(result)


def _print_result(result):
    """Affiche un résultat de génération"""
    
    logger.info("📊 RÉSULTAT")
    logger.info("-"*70)
    logger.info(f"Type : {result.act_type.value}")
    logger.info(f"Format : {result.output_format.value}")
    logger.info(f"Confiance : {result.confidence:.0%}")
    logger.info(f"Validation requise : {'Oui' if result.validation_required else 'Non'}")
    logger.info("")
    
    if result.warnings:
        logger.warning("⚠️ AVERTISSEMENTS :")
        for warning in result.warnings:
            logger.warning(f"  • {warning}")
        logger.info("")
    
    logger.info("📝 APERÇU :")
    logger.info("-"*70)
    logger.info(result.preview_text)
    logger.info("")
    
    logger.info("📄 ACTE COMPLET :")
    logger.info("="*70)
    # Afficher les 1500 premiers caractères
    display_text = result.generated_act[:1500]
    if len(result.generated_act) > 1500:
        display_text += "\n\n... (suite tronquée pour l'affichage) ..."
    print(display_text)
    logger.info("="*70)
    logger.info("")


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🤖 DÉMONSTRATION : Pilier 1 - Machine à Actes")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script montre la génération automatique d'actes :")
    logger.info("  1. Contrat de vente automobile")
    logger.info("  2. Bail d'habitation")
    logger.info("  3. Accord de confidentialité (NDA)")
    logger.info("  4. Données client en JSON")
    logger.info("")
    
    try:
        # Test 1 : Contrat de vente
        demo_contrat_vente()
        
        # Test 2 : Bail d'habitation
        demo_bail_habitation()
        
        # Test 3 : NDA
        demo_nda()
        
        # Test 4 : JSON
        demo_avec_json()
        
        logger.info("")
        logger.info("="*70)
        logger.info("📝 RÉCAPITULATIF")
        logger.info("="*70)
        logger.info("")
        logger.info("✅ TYPES D'ACTES DISPONIBLES :")
        logger.info("   • Contrats (vente, travail, prestation)")
        logger.info("   • Baux (commercial, habitation)")
        logger.info("   • Actes juridiques (NDA, donation, succession)")
        logger.info("   • Actes procéduraux (assignation, conclusions)")
        logger.info("   • + Templates personnalisés")
        logger.info("")
        logger.info("✅ FORMATS D'ENTRÉE :")
        logger.info("   • Texte libre")
        logger.info("   • JSON structuré")
        logger.info("   • CSV")
        logger.info("   • Formulaire web")
        logger.info("")
        logger.info("✅ FORMATS DE SORTIE :")
        logger.info("   • Texte brut")
        logger.info("   • HTML")
        logger.info("   • PDF (à venir)")
        logger.info("   • DOCX (à venir)")
        logger.info("")
        logger.info("✅ INTELLIGENCE :")
        logger.info("   • Liaison automatique (pas de [VARIABLES])")
        logger.info("   • Adaptation contextuelle (genre, accords)")
        logger.info("   • Mimétisme de style")
        logger.info("   • Validation avant export")
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

