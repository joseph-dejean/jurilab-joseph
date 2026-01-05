"""
Routes pour le Pilier 4 : Synthèse et Aide à la Stratégie

Endpoints pour la synthèse de dossiers procéduraux.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from api.models import SynthesisRequest, SynthesisResponse, SynthesisType
from api.synthese_strategie import SynthesisAideStrategie

router = APIRouter()

# Instance du service
synthese_service = SynthesisAideStrategie()


@router.post("/", response_model=SynthesisResponse)
async def generate_synthesis(request: SynthesisRequest):
    """
    Génère une synthèse stratégique
    
    Args:
        request: Requête de synthèse avec documents et type
    
    Returns:
        Synthèse générée
    
    Example:
        ```json
        {
          "synthesis_type": "strategic_note",
          "documents": [
            {"title": "Procédure initiale", "content": "..."},
            {"title": "Conclusions", "content": "..."}
          ],
          "context": "Litige commercial",
          "output_format": "text"
        }
        ```
    """
    try:
        # Vérifier qu'on a des documents
        has_documents = (
            (request.documents and len(request.documents) > 0) or
            (request.documents_content and len(request.documents_content) > 0) or
            (request.documents_files and len(request.documents_files) > 0)
        )
        
        if not has_documents:
            logger.warning("⚠️ Aucun document fourni pour la synthèse")
            raise HTTPException(
                status_code=422,
                detail="Au moins un document doit être fourni : documents, documents_content, ou documents_files"
            )
        
        logger.info(f"📊 Génération synthèse : {request.synthesis_type}")
        result = synthese_service.synthesize(request)
        logger.success(f"✅ Synthèse générée ({len(result.summary)} caractères)")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur de synthèse : {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/from-files")
async def generate_synthesis_from_files(
    synthesis_type: str = Form(...),
    context: str = Form(default=""),
    output_format: str = Form(default="text"),
    files: list[UploadFile] = File(...),
):
    """
    Génère une synthèse à partir de fichiers uploadés
    
    Args:
        synthesis_type: Type de synthèse (strategic_note, case_summary, etc.)
        context: Contexte du dossier
        output_format: Format de sortie
        files: Liste de fichiers à synthétiser
    
    Returns:
        Synthèse générée
    """
    try:
        logger.info(f"📤 Upload de {len(files)} fichier(s) pour synthèse")
        
        # Extraire le contenu de chaque fichier
        documents = []
        for file in files:
            content = await file.read()
            
            # Sauvegarder temporairement
            import tempfile
            from pathlib import Path
            
            temp_dir = Path(tempfile.mkdtemp())
            temp_file = temp_dir / file.filename
            temp_file.write_bytes(content)
            
            # Extraire le texte
            from api.audit_conformite import extract_text_from_file
            text = extract_text_from_file(str(temp_file))
            
            documents.append({
                "title": file.filename,
                "content": text
            })
            
            # Nettoyer
            temp_file.unlink()
            temp_dir.rmdir()
        
        # Créer la requête
        from api.models import OutputFormat
        
        request = SynthesisRequest(
            synthesis_type=SynthesisType(synthesis_type),
            documents=documents,
            context=context,
            output_format=OutputFormat(output_format),
        )
        
        # Générer
        result = synthese_service.synthesize(request)
        
        logger.success(f"✅ Synthèse générée depuis fichiers")
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def list_synthesis_types():
    """
    Liste tous les types de synthèse disponibles
    
    Returns:
        Liste des types avec descriptions
    """
    types = {
        "strategic_note": "Note stratégique (avocat expérimenté)",
        "case_summary": "Résumé de dossier (synthèse factuelle)",
        "client_report": "Rapport client (langage accessible)",
        "trend_analysis": "Analyse de tendances jurisprudentielles",
        "procedural_timeline": "Chronologie procédurale",
    }
    
    return {
        "types": types,
        "count": len(types)
    }


@router.get("/health")
async def health():
    """Vérifie que le service de synthèse fonctionne"""
    return {
        "status": "healthy",
        "service": "Synthèse et Stratégie",
        "gemini_configured": synthese_service.model is not None
    }

