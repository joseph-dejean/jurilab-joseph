"""
Routes pour le téléchargement de documents générés

Endpoints pour télécharger les PDFs, DOCX, etc.
"""

import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from loguru import logger

router = APIRouter()

# Stockage temporaire des documents (en production, utiliser une base de données)
DOCUMENTS_STORAGE = {}
DOWNLOAD_EXPIRY = timedelta(hours=24)


@router.post("/store")
async def store_document(content: str, filename: str, content_type: str = "text/plain"):
    """
    Stocke un document pour téléchargement ultérieur
    
    Args:
        content: Contenu du document (texte ou base64)
        filename: Nom du fichier
        content_type: Type MIME du fichier
    
    Returns:
        ID de téléchargement et URL
    """
    try:
        # Générer un ID unique
        doc_id = str(uuid.uuid4())
        
        # Stocker
        DOCUMENTS_STORAGE[doc_id] = {
            "content": content,
            "filename": filename,
            "content_type": content_type,
            "created_at": datetime.now(),
            "expires_at": datetime.now() + DOWNLOAD_EXPIRY,
        }
        
        logger.info(f"💾 Document stocké : {doc_id} ({filename})")
        
        return {
            "document_id": doc_id,
            "download_url": f"/api/v1/download/{doc_id}",
            "expires_at": DOCUMENTS_STORAGE[doc_id]["expires_at"].isoformat(),
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
async def download_document(document_id: str):
    """
    Télécharge un document par son ID
    
    Args:
        document_id: ID du document
    
    Returns:
        Fichier à télécharger
    """
    try:
        # Vérifier l'existence
        if document_id not in DOCUMENTS_STORAGE:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = DOCUMENTS_STORAGE[document_id]
        
        # Vérifier l'expiration
        if datetime.now() > doc["expires_at"]:
            del DOCUMENTS_STORAGE[document_id]
            raise HTTPException(status_code=410, detail="Document expired")
        
        logger.info(f"⬇️ Téléchargement : {doc['filename']}")
        
        # Créer un fichier temporaire
        import tempfile
        
        temp_dir = Path(tempfile.mkdtemp())
        temp_file = temp_dir / doc["filename"]
        
        # Écrire le contenu
        if doc["content_type"].startswith("text/"):
            temp_file.write_text(doc["content"], encoding="utf-8")
        else:
            # Base64 pour binaires (PDF, DOCX)
            import base64
            temp_file.write_bytes(base64.b64decode(doc["content"]))
        
        # Retourner le fichier
        return FileResponse(
            path=str(temp_file),
            filename=doc["filename"],
            media_type=doc["content_type"],
            headers={
                "Content-Disposition": f"attachment; filename=\"{doc['filename']}\""
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """
    Supprime un document stocké
    
    Args:
        document_id: ID du document
    
    Returns:
        Confirmation de suppression
    """
    try:
        if document_id in DOCUMENTS_STORAGE:
            del DOCUMENTS_STORAGE[document_id]
            logger.info(f"🗑️ Document supprimé : {document_id}")
            return {"message": "Document deleted", "document_id": document_id}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cleanup/expired")
async def cleanup_expired_documents():
    """
    Nettoie les documents expirés
    
    Returns:
        Nombre de documents supprimés
    """
    try:
        now = datetime.now()
        expired_ids = [
            doc_id for doc_id, doc in DOCUMENTS_STORAGE.items()
            if now > doc["expires_at"]
        ]
        
        for doc_id in expired_ids:
            del DOCUMENTS_STORAGE[doc_id]
        
        logger.info(f"🧹 {len(expired_ids)} document(s) expiré(s) supprimé(s)")
        
        return {
            "cleaned": len(expired_ids),
            "remaining": len(DOCUMENTS_STORAGE)
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))

