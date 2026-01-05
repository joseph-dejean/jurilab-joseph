"""
Routes pour le Pilier 5 : Chatbot Avocat

Endpoints pour le chatbot conversationnel avec RAG.
"""

from fastapi import APIRouter, HTTPException
from loguru import logger

from api.chatbot_avocat import ChatbotAvocat
from api.models import ChatRequest, ChatResponse

router = APIRouter()

# Instance du service
chatbot = ChatbotAvocat()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Envoie un message au chatbot avocat
    
    Args:
        request: Message utilisateur avec contexte
    
    Returns:
        Réponse du chatbot avec sources
    
    Example:
        ```json
        {
          "message": "Quelles sont les conditions de validité d'un contrat?",
          "conversation_id": "conv_123",
          "use_rag": true
        }
        ```
    """
    try:
        logger.info(f"💬 Message: \"{request.message[:50]}...\"")
        response = chatbot.chat(request)
        logger.success(f"✅ Réponse générée ({len(response.response)} caractères)")
        return response
    
    except Exception as e:
        logger.error(f"❌ Erreur chatbot : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """
    Efface l'historique d'une conversation
    
    Args:
        conversation_id: ID de la conversation
    
    Returns:
        Confirmation de suppression
    """
    try:
        chatbot.conversation_manager.clear_conversation(conversation_id)
        logger.info(f"🗑️ Conversation {conversation_id} effacée")
        return {"message": "Conversation cleared", "conversation_id": conversation_id}
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{conversation_id}")
async def get_conversation_history(conversation_id: str):
    """
    Récupère l'historique d'une conversation
    
    Args:
        conversation_id: ID de la conversation
    
    Returns:
        Historique des messages
    """
    try:
        history = chatbot.conversation_manager.get_conversation(conversation_id)
        return {
            "conversation_id": conversation_id,
            "messages": history,
            "count": len(history)
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur : {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Vérifie que le service de chatbot fonctionne"""
    return {
        "status": "healthy",
        "service": "Chatbot Avocat",
        "gemini_configured": chatbot.model is not None,
        "rag_configured": chatbot.search_client is not None
    }

