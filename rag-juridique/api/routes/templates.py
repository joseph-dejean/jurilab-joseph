"""
Routes pour la gestion des templates PDF

Endpoints pour créer, lire, modifier et supprimer des templates PDF.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from utils.pdf_style_analyzer import PDFStyleAnalyzer
from utils.pdf_template_manager import PDFTemplateManager

router = APIRouter()

# Instances des services
analyzer = PDFStyleAnalyzer()
manager = PDFTemplateManager()


@router.get("/")
async def list_templates():
    """
    Liste tous les templates PDF disponibles
    
    Returns:
        Liste des templates avec métadonnées
    """
    try:
        templates = manager.list_templates()
        return {
            "templates": templates,
            "count": len(templates)
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{template_name}")
async def get_template(template_name: str):
    """
    Récupère un template spécifique
    
    Args:
        template_name: Nom du template
    
    Returns:
        Configuration du template
    """
    try:
        template = manager.load_template(template_name)
        return template
    
    except Exception as e:
        logger.error(f"❌ Template non trouvé : {e}")
        raise HTTPException(status_code=404, detail=f"Template '{template_name}' not found")


@router.post("/analyze")
async def analyze_pdf_template(
    pdf_file: UploadFile = File(...),
    template_name: str = Form(...)
):
    """
    Analyse un PDF et génère un template automatiquement (Gemini)
    
    Args:
        pdf_file: Fichier PDF à analyser
        template_name: Nom du template à créer
    
    Returns:
        Template généré
    """
    try:
        logger.info(f"📤 Upload PDF pour analyse : {pdf_file.filename}")
        
        # Sauvegarder temporairement
        import tempfile
        from pathlib import Path
        
        temp_dir = Path(tempfile.mkdtemp())
        temp_file = temp_dir / pdf_file.filename
        
        content = await pdf_file.read()
        temp_file.write_bytes(content)
        
        # Analyser avec Gemini
        logger.info(f"🤖 Analyse du style avec Gemini...")
        template_config = analyzer.analyze_pdf(temp_file)
        
        # Sauvegarder le template
        manager.save_template(
            template_name=template_name,
            template_config=template_config,
        )
        
        # Nettoyer
        temp_file.unlink()
        temp_dir.rmdir()
        
        logger.success(f"✅ Template '{template_name}' créé")
        
        return {
            "message": "Template created successfully",
            "template_name": template_name,
            "config": template_config
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{template_name}")
async def delete_template(template_name: str):
    """
    Supprime un template
    
    Args:
        template_name: Nom du template à supprimer
    
    Returns:
        Confirmation de suppression
    """
    try:
        success = manager.delete_template(template_name)
        
        if not success:
            raise HTTPException(status_code=400, detail="Cannot delete template")
        
        return {
            "message": "Template deleted successfully",
            "template_name": template_name
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Vérifie que le service de templates fonctionne"""
    return {
        "status": "healthy",
        "service": "Templates PDF",
        "gemini_configured": analyzer.model is not None
    }

