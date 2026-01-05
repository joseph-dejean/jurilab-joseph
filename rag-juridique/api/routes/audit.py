"""
Routes pour le Pilier 3 : Audit et Conformité

Endpoints pour l'audit de conformité des contrats.
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from api.audit_conformite import AuditConformite
from api.models import AuditRequest, AuditResponse

router = APIRouter()

# Instance du service
audit_service = AuditConformite()


@router.post("/", response_model=AuditResponse)
async def audit_contract(request: AuditRequest):
    """
    Audite un contrat pour détecter les non-conformités
    
    Args:
        request: Requête d'audit avec texte du contrat
    
    Returns:
        Rapport d'audit avec problèmes détectés
    
    Example:
        ```json
        {
          "contract_text": "CONTRAT DE VENTE\\n\\nSelon l'article 1101...",
          "contract_date": "2020-01-15",
          "deep_analysis": true
        }
        ```
    """
    import traceback
    
    try:
        logger.info("=" * 70)
        logger.info("🔍 DÉBUT AUDIT DE CONFORMITÉ")
        logger.info("=" * 70)
        
        # Étape 1: Validation du contenu
        logger.info("📋 Étape 1: Validation du contenu...")
        if not request.contract_text and not request.document_content and not request.document_file_path:
            logger.warning("⚠️ Aucun contenu fourni pour l'audit")
            raise HTTPException(
                status_code=422,
                detail="Au moins un champ de contenu doit être fourni : contract_text, document_content, ou document_file_path"
            )
        
        content_length = len(request.contract_text or request.document_content or "")
        logger.info(f"   ✅ Contenu validé ({content_length} caractères)")
        logger.info(f"   - contract_text: {bool(request.contract_text)} ({len(request.contract_text) if request.contract_text else 0} chars)")
        logger.info(f"   - document_content: {bool(request.document_content)} ({len(request.document_content) if request.document_content else 0} chars)")
        logger.info(f"   - document_file_path: {bool(request.document_file_path)}")
        
        # Étape 2: Appel au service d'audit
        logger.info("⚖️ Étape 2: Appel au service d'audit...")
        try:
            result = audit_service.audit(request)
            logger.info(f"   ✅ Service d'audit terminé")
            logger.info(f"   - {len(result.issues)} problème(s) détecté(s)")
            logger.info(f"   - Score de conformité: {result.conformity_score:.1f}%")
            logger.success(f"✅ Audit terminé avec succès")
            return result
        except Exception as service_error:
            logger.error(f"❌ ERREUR DANS LE SERVICE D'AUDIT")
            logger.error(f"   Type: {type(service_error).__name__}")
            logger.error(f"   Message: {str(service_error)}")
            logger.error(f"   Traceback complet:")
            logger.error(traceback.format_exc())
            # Relancer avec plus de détails
            raise HTTPException(
                status_code=500,
                detail=f"Erreur dans le service d'audit: {type(service_error).__name__}: {str(service_error)}"
            )
    
    except HTTPException:
        # Les HTTPException sont déjà bien formatées, on les relance telles quelles
        raise
    except Exception as e:
        # Erreur inattendue
        logger.error("=" * 70)
        logger.error("❌ ERREUR INATTENDUE DANS LA ROUTE AUDIT")
        logger.error("=" * 70)
        logger.error(f"Type d'erreur: {type(e).__name__}")
        logger.error(f"Message: {str(e)}")
        logger.error(f"Traceback complet:")
        logger.error(traceback.format_exc())
        logger.error("=" * 70)
        
        # Retourner une erreur détaillée
        error_detail = f"{type(e).__name__}: {str(e)}"
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'audit: {error_detail}. Consultez les logs serveur pour plus de détails."
        )


@router.post("/from-file", response_model=AuditResponse)
async def audit_contract_from_file(
    contract_file: UploadFile = File(...),
    contract_date: str = Form(None),
    deep_analysis: bool = Form(default=True),
):
    """
    Audite un contrat à partir d'un fichier (PDF/DOCX)
    
    Args:
        contract_file: Fichier du contrat uploadé
        contract_date: Date du contrat (optionnel)
        deep_analysis: Activer l'analyse approfondie
    
    Returns:
        Rapport d'audit
    """
    try:
        logger.info(f"📤 Upload de contrat : {contract_file.filename}")
        
        # Lire le contenu
        content = await contract_file.read()
        
        # Sauvegarder temporairement
        import tempfile
        from pathlib import Path
        
        temp_dir = Path(tempfile.mkdtemp())
        temp_file = temp_dir / contract_file.filename
        temp_file.write_bytes(content)
        
        # Extraire le texte
        from api.audit_conformite import extract_text_from_file
        contract_text = extract_text_from_file(str(temp_file))
        
        # Créer la requête
        request = AuditRequest(
            contract_text=contract_text,
            contract_date=contract_date,
            deep_analysis=deep_analysis,
        )
        
        # Auditer
        result = audit_service.audit(request)
        
        # Nettoyer
        temp_file.unlink()
        temp_dir.rmdir()
        
        logger.success(f"✅ Audit terminé depuis fichier")
        return result
    
    except ValueError as e:
        # Erreur de validation (ex: PDF scanné)
        logger.warning(f"⚠️ Validation : {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Erreur de validation: {str(e)}")
    except Exception as e:
        import traceback
        logger.error("=" * 70)
        logger.error("❌ ERREUR DANS AUDIT FROM-FILE")
        logger.error("=" * 70)
        logger.error(f"Type: {type(e).__name__}")
        logger.error(f"Message: {str(e)}")
        logger.error(f"Traceback complet:")
        logger.error(traceback.format_exc())
        logger.error("=" * 70)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'audit depuis fichier: {type(e).__name__}: {str(e)}"
        )


@router.get("/health")
async def health():
    """Vérifie que le service d'audit fonctionne"""
    return {
        "status": "healthy",
        "service": "Audit et Conformité",
        "rag_configured": audit_service.search_client is not None
    }

