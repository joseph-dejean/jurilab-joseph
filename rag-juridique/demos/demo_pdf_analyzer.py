"""
Démonstration de l'analyseur de style PDF

Ce script analyse vos PDFs et génère automatiquement des templates JSON
pour reproduire leur style exact.
"""

import sys
from pathlib import Path

# Ajouter le répertoire racine au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.logging_config import setup_logging
from loguru import logger
from utils.pdf_style_analyzer import PDFStyleAnalyzer
from utils.pdf_template_manager import PDFTemplateManager

setup_logging()


def main():
    """Point d'entrée principal"""
    
    logger.info("")
    logger.info("="*70)
    logger.info("🎨 ANALYSEUR AUTOMATIQUE DE STYLE PDF")
    logger.info("="*70)
    logger.info("")
    logger.info("Ce script analyse vos PDFs et génère automatiquement des")
    logger.info("templates JSON pour reproduire leur style exact.")
    logger.info("")
    
    # Vérifier les PDFs disponibles
    test_dir = Path("data/test_pdfs")
    pdf_files = sorted(test_dir.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning("⚠️ Aucun PDF trouvé dans data/test_pdfs/")
        logger.info("")
        logger.info("📋 INSTRUCTIONS :")
        logger.info("   1. Déposez vos PDFs dans : data/test_pdfs/")
        logger.info("   2. Relancez ce script")
        logger.info("")
        logger.info("Exemple :")
        logger.info("   data/test_pdfs/contrat_20pages.pdf")
        logger.info("   data/test_pdfs/conclusion_5pages.pdf")
        logger.info("")
        return
    
    logger.info(f"✅ {len(pdf_files)} PDF(s) trouvé(s) :")
    for i, pdf in enumerate(pdf_files, 1):
        logger.info(f"   {i}. {pdf.name} ({pdf.stat().st_size // 1024} Ko)")
    logger.info("")
    
    # Initialiser les outils
    analyzer = PDFStyleAnalyzer()
    manager = PDFTemplateManager()
    
    # Analyser chaque PDF
    for i, pdf_file in enumerate(pdf_files, 1):
        logger.info("="*70)
        logger.info(f"📄 ANALYSE {i}/{len(pdf_files)} : {pdf_file.name}")
        logger.info("="*70)
        logger.info("")
        
        try:
            # 1. Analyser le style
            logger.info("🔍 Étape 1/3 : Extraction des métadonnées...")
            template_config = analyzer.analyze_pdf(pdf_file)
            logger.info("")
            
            # 2. Afficher le résultat
            logger.info("🎨 Étape 2/3 : Résultat de l'analyse")
            logger.info("-"*70)
            logger.info(f"Template : {template_config.get('template_name', 'N/A')}")
            logger.info(f"Type : {template_config.get('document_type', 'N/A')}")
            logger.info("")
            
            # En-tête
            header = template_config.get('header', {})
            logger.info("📋 EN-TÊTE :")
            logger.info(f"   • Texte : {header.get('text', 'N/A')[:50]}...")
            logger.info(f"   • Police : {header.get('font', 'N/A')}")
            logger.info(f"   • Taille : {header.get('font_size', 'N/A')}")
            logger.info(f"   • Couleur : {header.get('color', 'N/A')}")
            logger.info(f"   • Logo : {'Oui' if header.get('has_logo') else 'Non'}")
            logger.info("")
            
            # Pied de page
            footer = template_config.get('footer', {})
            logger.info("📋 PIED DE PAGE :")
            logger.info(f"   • Texte : {footer.get('text', 'N/A')[:50]}...")
            logger.info(f"   • Taille : {footer.get('font_size', 'N/A')}")
            logger.info(f"   • Numéros : {'Oui' if footer.get('has_page_numbers') else 'Non'}")
            logger.info("")
            
            # Page
            page = template_config.get('page', {})
            logger.info("📋 MISE EN PAGE :")
            logger.info(f"   • Format : {page.get('format', 'N/A')}")
            logger.info(f"   • Marges : T={page.get('margin_top', 0)}, B={page.get('margin_bottom', 0)}, L={page.get('margin_left', 0)}, R={page.get('margin_right', 0)}")
            logger.info("")
            
            # Styles
            styles = template_config.get('styles', {})
            logger.info("📋 STYLES :")
            logger.info(f"   • Titre : {styles.get('title_font', 'N/A')} ({styles.get('title_size', 'N/A')}pt)")
            logger.info(f"   • Corps : {styles.get('body_font', 'N/A')} ({styles.get('body_size', 'N/A')}pt)")
            logger.info(f"   • Interligne : {styles.get('line_spacing', 'N/A')}")
            logger.info("")
            
            # 3. Sauvegarder le template
            logger.info("💾 Étape 3/3 : Sauvegarde du template...")
            
            # Sauvegarder le JSON brut
            json_output = test_dir / f"{pdf_file.stem}_template.json"
            analyzer.save_template(template_config, json_output)
            
            # Sauvegarder dans le gestionnaire de templates
            template_name = pdf_file.stem.lower().replace(" ", "_")
            manager.save_template(
                template_name=template_name,
                template_config=template_config,
            )
            
            logger.info("")
            logger.success(f"✅ Analyse terminée : {pdf_file.name}")
            logger.info("")
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'analyse : {e}")
            import traceback
            traceback.print_exc()
            logger.info("")
    
    # Récapitulatif
    logger.info("="*70)
    logger.info("📊 RÉCAPITULATIF")
    logger.info("="*70)
    logger.info("")
    
    templates = manager.list_templates()
    logger.info(f"✅ {len(templates)} template(s) disponible(s) :")
    for template in templates:
        logger.info(f"   • {template['name']} ({'défaut' if template.get('is_default') else 'personnalisé'})")
    logger.info("")
    
    logger.info("📁 Fichiers générés :")
    json_files = list(test_dir.glob("*_template.json"))
    for json_file in json_files:
        logger.info(f"   • {json_file}")
    logger.info("")
    
    logger.info("🎯 PROCHAINES ÉTAPES :")
    logger.info("   1. Vérifier les templates JSON générés")
    logger.info("   2. Ajuster manuellement si nécessaire")
    logger.info("   3. Utiliser ces templates dans les Piliers 1 et 4")
    logger.info("")
    
    logger.success("✅ ANALYSE TERMINÉE")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("\n⚠️ Analyse interrompue par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale : {e}")
        import traceback
        traceback.print_exc()

