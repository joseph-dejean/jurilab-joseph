"""
Routes pour le Pilier 1 : Machine à Actes

Endpoints pour la génération automatique d'actes juridiques.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from loguru import logger

from api.machine_actes import MachineActes
from api.models import ActGenerationRequest, ActGenerationResponse

router = APIRouter()

# Instance du service
machine = MachineActes()


@router.post("/generate", response_model=ActGenerationResponse)
async def generate_act(request: ActGenerationRequest):
    """
    Génère un acte juridique personnalisé
    
    Args:
        request: Requête de génération avec modèle et données client
    
    Returns:
        Acte généré avec métadonnées
    
    Example:
        ```json
        {
          "act_type": "contract_sale",
          "template_content": "CONTRAT DE VENTE\\n\\nEntre...",
          "client_data": "Vendeur: Jean DUPONT...",
          "output_format": "text"
        }
        ```
    """
    try:
        logger.info(f"🎯 Requête de génération d'acte : {request.act_type}")
        result = machine.generate(request)
        logger.success(f"✅ Acte généré avec succès (confiance: {result.confidence:.0%})")
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la génération : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-from-file")
async def generate_act_from_file(
    act_type: str = Form(...),
    template_file: UploadFile = File(...),
    client_data: str = Form(...),
    output_format: str = Form(default="text"),
):
    """
    Génère un acte à partir d'un fichier template (PDF/DOCX)
    
    Args:
        act_type: Type d'acte à générer
        template_file: Fichier template uploadé
        client_data: Données du client (texte ou JSON)
        output_format: Format de sortie (text, pdf, docx, html)
    
    Returns:
        Acte généré
    """
    try:
        logger.info(f"📤 Upload de template : {template_file.filename}")
        
        # Sauvegarder temporairement le fichier
        import tempfile
        from pathlib import Path
        
        temp_dir = Path(tempfile.mkdtemp())
        temp_file = temp_dir / template_file.filename
        
        with open(temp_file, "wb") as f:
            content = await template_file.read()
            f.write(content)
        
        # Créer la requête
        from api.models import ActType, OutputFormat, DataInputFormat
        
        request = ActGenerationRequest(
            act_type=ActType(act_type),
            template_file=str(temp_file),
            client_data=client_data,
            output_format=OutputFormat(output_format),
        )
        
        # Générer
        result = machine.generate(request)
        
        # Nettoyer
        temp_file.unlink()
        temp_dir.rmdir()
        
        logger.success(f"✅ Acte généré depuis fichier")
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def list_act_types():
    """
    Liste tous les types d'actes disponibles
    
    Returns:
        Liste des types d'actes avec descriptions
    """
    from api.models import ActType
    
    types = {
        "contract_sale": "Contrat de vente",
        "contract_work": "Contrat de travail",
        "contract_service": "Contrat de prestation",
        "lease_commercial": "Bail commercial",
        "lease_residential": "Bail d'habitation",
        "assignment": "Assignation",
        "conclusions": "Conclusions",
        "donation": "Donation",
        "succession": "Succession",
        "nda": "Accord de confidentialité",
        "partnership": "Contrat de société",
        "mandate": "Mandat",
        "power_of_attorney": "Procuration",
        "custom": "Type personnalisé",
    }
    
    return {
        "types": types,
        "count": len(types)
    }


@router.get("/health")
async def health():
    """Vérifie que le service de génération d'actes fonctionne"""
    try:
        # Test basique
        return {
            "status": "healthy",
            "service": "Machine à Actes",
            "gemini_configured": machine.model is not None
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {e}")

