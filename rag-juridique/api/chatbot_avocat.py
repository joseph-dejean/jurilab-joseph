"""
Pilier 5 : Chatbot Avocat
Hub central conversationnel pour l'assistance juridique
"""

import uuid
from datetime import datetime
from typing import Optional

import google.generativeai as genai

from config.logging_config import get_logger
from config.settings import get_settings
from rag.vertex_search import VertexSearchClient
from api.models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    Source,
)

logger = get_logger(__name__)
settings = get_settings()

# Configuration Gemini avec clé API
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.debug("Gemini configuré avec clé API")
else:
    logger.warning("⚠️ GEMINI_API_KEY non définie dans .env")


class ConversationManager:
    """Gestionnaire de conversations avec historique"""
    
    def __init__(self):
        """Initialise le gestionnaire de conversations"""
        self.conversations: dict[str, list[ChatMessage]] = {}
        logger.debug("ConversationManager initialisé")
    
    def create_conversation(self) -> str:
        """
        Crée une nouvelle conversation
        
        Returns:
            ID de la conversation
        """
        conv_id = str(uuid.uuid4())
        self.conversations[conv_id] = []
        logger.debug(f"Nouvelle conversation créée: {conv_id}")
        return conv_id
    
    def add_message(self, conv_id: str, role: str, content: str) -> None:
        """
        Ajoute un message à la conversation
        
        Args:
            conv_id: ID de la conversation
            role: Rôle (user ou assistant)
            content: Contenu du message
        """
        if conv_id not in self.conversations:
            self.conversations[conv_id] = []
        
        message = ChatMessage(
            role=role,
            content=content,
            timestamp=datetime.now()
        )
        self.conversations[conv_id].append(message)
    
    def get_history(self, conv_id: str, max_messages: int = 10) -> list[ChatMessage]:
        """
        Récupère l'historique d'une conversation
        
        Args:
            conv_id: ID de la conversation
            max_messages: Nombre maximum de messages à retourner
        
        Returns:
            Liste des derniers messages
        """
        if conv_id not in self.conversations:
            return []
        
        return self.conversations[conv_id][-max_messages:]
    
    def clear_conversation(self, conv_id: str) -> None:
        """Efface l'historique d'une conversation"""
        if conv_id in self.conversations:
            del self.conversations[conv_id]
            logger.debug(f"Conversation {conv_id} effacée")


class ChatbotAvocat:
    """
    Chatbot Avocat - Hub central conversationnel
    
    Fonctionnalités:
    - Réponses en langage naturel avec Gemini
    - Grounding avec RAG (citations sources)
    - Routage vers les autres outils
    - Historique de conversation
    - Suggestions d'actions
    """
    
    def __init__(self):
        """Initialise le Chatbot Avocat"""
        self.vertex_client = VertexSearchClient()
        self.conversation_manager = ConversationManager()
        
        # Configuration Gemini avec API directe
        try:
            if not settings.GEMINI_API_KEY:
                logger.warning("⚠️ GEMINI_API_KEY non définie - mode dégradé activé")
                self.model = None
            else:
                self.model = genai.GenerativeModel(settings.GEMINI_FLASH_MODEL)
                logger.debug(f"✅ Modèle Gemini configuré: {settings.GEMINI_FLASH_MODEL}")
        except Exception as e:
            logger.warning(f"⚠️ Impossible de configurer Gemini: {e}")
            self.model = None
        
        logger.info("✅ ChatbotAvocat initialisé")
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Traite une requête de chat
        
        Args:
            request: Requête de chat avec message et options
        
        Returns:
            Réponse du chatbot avec sources et suggestions
        """
        logger.info(f"💬 Question: '{request.message}'")
        
        # 1. Gérer la conversation
        conv_id = request.conversation_id or self.conversation_manager.create_conversation()
        
        # 2. Ajouter le message utilisateur
        self.conversation_manager.add_message(conv_id, "user", request.message)
        
        # 3. RAG : Rechercher des sources si activé
        sources = []
        context = ""
        
        if request.use_rag:
            sources, context = self._retrieve_sources(request.message, request.max_sources)
        
        # 4. Construire le prompt avec contexte
        history = self.conversation_manager.get_history(conv_id, max_messages=5)
        prompt = self._build_prompt(request.message, context, history)
        
        # 5. Générer la réponse avec Gemini
        response_text, confidence = self._generate_response(prompt)
        
        # 6. Ajouter la réponse à l'historique
        self.conversation_manager.add_message(conv_id, "assistant", response_text)
        
        # 7. Générer des suggestions d'actions
        suggested_actions = self._generate_suggestions(request.message, response_text)
        
        # 8. Construire la réponse
        response = ChatResponse(
            response=response_text,
            sources=sources,
            conversation_id=conv_id,
            suggested_actions=suggested_actions,
            confidence=confidence,
        )
        
        logger.success(f"✅ Réponse générée (confiance: {confidence:.0%})")
        
        return response
    
    def _retrieve_sources(
        self,
        query: str,
        max_sources: int
    ) -> tuple[list[Source], str]:
        """
        Récupère des sources via RAG
        
        Args:
            query: Question de l'utilisateur
            max_sources: Nombre maximum de sources
        
        Returns:
            Tuple (liste de sources, contexte formaté)
        """
        try:
            # Recherche dans Vertex AI
            results = self.vertex_client.search(query, page_size=max_sources)
            
            sources = []
            context_parts = []
            
            for i, result in enumerate(results, 1):
                # Créer l'objet Source
                source = Source(
                    type="code" if "article" in result.get("title", "").lower() else "jurisprudence",
                    reference=result.get("title", ""),
                    text=result.get("content", "")[:300] + "...",  # Tronquer
                    relevance=result.get("score", 0.0) or 0.0,
                )
                sources.append(source)
                
                # Construire le contexte pour le prompt
                metadata = result.get("metadata", {})
                breadcrumb = metadata.get("breadcrumb", "")
                
                context_parts.append(
                    f"[Source {i}] {result.get('title', 'N/A')}\n"
                    f"Référence: {breadcrumb}\n"
                    f"Contenu: {result.get('content', 'N/A')}\n"
                )
            
            context = "\n".join(context_parts)
            
            logger.debug(f"✅ {len(sources)} source(s) récupérée(s)")
            
            return sources, context
            
        except Exception as e:
            logger.warning(f"⚠️ Erreur récupération sources: {e}")
            return [], ""
    
    def _build_prompt(
        self,
        question: str,
        context: str,
        history: list[ChatMessage]
    ) -> str:
        """
        Construit le prompt pour Gemini
        
        Args:
            question: Question de l'utilisateur
            context: Contexte RAG
            history: Historique de conversation
        
        Returns:
            Prompt complet
        """
        # Prompt système
        system_prompt = """Tu es un assistant juridique expert spécialisé en droit français.

RÔLE:
- Réponds de manière claire, précise et pédagogique
- Cite TOUJOURS tes sources (articles de loi, références juridiques)
- Si tu n'es pas sûr, dis-le clairement
- Utilise un langage professionnel mais accessible

RÈGLES:
1. Base-toi UNIQUEMENT sur les sources fournies (ne pas inventer)
2. Cite les articles avec leur référence complète
3. Structure ta réponse (définition, règles, exceptions, exemples)
4. Si les sources sont insuffisantes, indique-le
5. Ne donne JAMAIS de conseil juridique personnalisé (tu n'es pas avocat)

FORMAT DE RÉPONSE:
- Introduction courte
- Développement avec citations
- Conclusion synthétique
- [Sources utilisées] à la fin
"""
        
        # Historique de conversation
        history_text = ""
        if history:
            history_text = "\n\nHISTORIQUE DE CONVERSATION:\n"
            for msg in history[:-1]:  # Exclure le dernier (question actuelle)
                role_emoji = "👤" if msg.role == "user" else "🤖"
                history_text += f"{role_emoji} {msg.role}: {msg.content}\n"
        
        # Contexte RAG
        context_text = ""
        if context:
            context_text = f"\n\nSOURCES JURIDIQUES DISPONIBLES:\n{context}\n"
        
        # Assemblage final
        prompt = f"""{system_prompt}
{history_text}
{context_text}

QUESTION ACTUELLE:
{question}

RÉPONSE:
"""
        
        return prompt
    
    def _generate_response(self, prompt: str) -> tuple[str, float]:
        """
        Génère une réponse avec Gemini
        
        Args:
            prompt: Prompt complet
        
        Returns:
            Tuple (réponse, score de confiance)
        """
        if not self.model:
            logger.error("❌ Modèle Gemini non initialisé")
            fallback = (
                "Le modèle d'IA n'est pas disponible. "
                "Veuillez configurer les credentials Google Cloud."
            )
            return fallback, 0.0
        
        try:
            # Configuration de génération
            generation_config = genai.types.GenerationConfig(
                temperature=0.3,  # Peu créatif (factuel)
                top_p=0.95,
                top_k=40,
                max_output_tokens=1024,
            )
            
            # Génération avec Gemini (API directe)
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            response_text = response.text
            
            # Estimation de confiance basique
            # TODO: Améliorer avec analyse de la réponse
            confidence = 0.85  # Par défaut
            
            if "je ne sais pas" in response_text.lower() or "insuffisant" in response_text.lower():
                confidence = 0.4
            elif "sources" in response_text.lower() and "article" in response_text.lower():
                confidence = 0.95
            
            return response_text, confidence
            
        except Exception as e:
            logger.error(f"❌ Erreur génération Gemini: {e}")
            
            # Réponse de secours basée sur les sources RAG
            # Si on a des sources dans le prompt, on peut au moins les présenter
            if "SOURCE" in prompt and "SOURCES JURIDIQUES DISPONIBLES" in prompt:
                # Extraire les sources du prompt
                fallback = self._generate_fallback_from_sources(prompt)
                return fallback, 0.6
            else:
                fallback = (
                    "⚠️ Le service de génération de réponse est temporairement indisponible. "
                    "Cependant, j'ai trouvé des sources pertinentes ci-dessus."
                )
                return fallback, 0.3
    
    def _generate_fallback_from_sources(self, prompt: str) -> str:
        """
        Génère une réponse de secours basée sur les sources RAG
        
        Args:
            prompt: Prompt contenant les sources
        
        Returns:
            Réponse basique avec références aux sources
        """
        # Extraire la section des sources
        if "SOURCES JURIDIQUES DISPONIBLES:" in prompt:
            sources_section = prompt.split("SOURCES JURIDIQUES DISPONIBLES:")[1]
            sources_section = sources_section.split("QUESTION ACTUELLE:")[0].strip()
            
            # Compter les sources
            source_count = sources_section.count("[Source")
            
            response = f"""Voici ce que j'ai trouvé dans les sources juridiques ({source_count} sources) :

{sources_section[:800]}

⚠️ Note : Le service de génération automatique est temporairement indisponible. 
Les sources ci-dessus contiennent les informations pertinentes pour répondre à votre question.
Veuillez consulter les articles mentionnés pour plus de détails."""
            
            return response
        
        return "Sources trouvées mais impossible de les formater."
    
    def _generate_suggestions(self, question: str, response: str) -> list[str]:
        """
        Génère des suggestions d'actions basées sur la conversation
        
        Args:
            question: Question de l'utilisateur
            response: Réponse générée
        
        Returns:
            Liste de suggestions
        """
        suggestions = []
        
        # Analyse simple basée sur les mots-clés
        question_lower = question.lower()
        response_lower = response.lower()
        
        # Si on parle de contrat
        if "contrat" in question_lower or "contrat" in response_lower:
            suggestions.append("🔍 Rechercher la jurisprudence sur les contrats")
            suggestions.append("📄 Générer un modèle de contrat")
        
        # Si on parle de procédure
        if any(word in question_lower for word in ["procédure", "jugement", "tribunal"]):
            suggestions.append("📊 Analyser la stratégie procédurale")
            suggestions.append("🔍 Rechercher des cas similaires")
        
        # Si on parle de conformité
        if any(word in question_lower for word in ["conformité", "vérifier", "valide"]):
            suggestions.append("✅ Auditer un document pour conformité")
        
        # Suggestions générales
        if not suggestions:
            suggestions.append("🔍 Approfondir cette recherche")
            suggestions.append("💬 Poser une question connexe")
        
        return suggestions[:3]  # Max 3 suggestions
    
    def clear_conversation(self, conv_id: str) -> None:
        """Efface l'historique d'une conversation"""
        self.conversation_manager.clear_conversation(conv_id)


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def quick_chat(message: str, use_rag: bool = True) -> ChatResponse:
    """
    Fonction rapide pour chatter
    
    Args:
        message: Message de l'utilisateur
        use_rag: Utiliser le RAG pour grounding
    
    Returns:
        Réponse du chatbot
    
    Exemple:
        >>> response = quick_chat("Qu'est-ce qu'un contrat ?")
        >>> print(response.response)
    """
    chatbot = ChatbotAvocat()
    
    request = ChatRequest(
        message=message,
        use_rag=use_rag,
        max_sources=3,
    )
    
    return chatbot.chat(request)


# ============================================================================
# SCRIPT DE TEST
# ============================================================================

if __name__ == "__main__":
    """Test du Chatbot Avocat"""
    
    logger.info("=" * 70)
    logger.info("🧪 TEST DU CHATBOT AVOCAT")
    logger.info("=" * 70)
    
    # Test 1: Question simple avec RAG
    logger.info("\n📝 Test 1: Question avec RAG")
    response = quick_chat("Qu'est-ce qu'un contrat selon le Code civil ?")
    
    logger.info(f"\n💬 Réponse:")
    print(response.response)
    
    logger.info(f"\n📚 Sources ({len(response.sources)}):")
    for i, source in enumerate(response.sources, 1):
        logger.info(f"   {i}. {source.reference} (pertinence: {source.relevance:.0%})")
    
    logger.info(f"\n💡 Suggestions:")
    for suggestion in response.suggested_actions:
        logger.info(f"   • {suggestion}")
    
    logger.info(f"\n📊 Confiance: {response.confidence:.0%}")
    
    # Test 2: Conversation avec historique
    logger.info("\n📝 Test 2: Conversation avec historique")
    chatbot = ChatbotAvocat()
    
    # Premier message
    req1 = ChatRequest(message="Quelle est la majorité en France ?", use_rag=True)
    resp1 = chatbot.chat(req1)
    logger.info(f"\n👤 Q1: {req1.message}")
    logger.info(f"🤖 R1: {resp1.response[:100]}...")
    
    # Deuxième message (même conversation)
    req2 = ChatRequest(
        message="Et pour les contrats ?",
        conversation_id=resp1.conversation_id,
        use_rag=True
    )
    resp2 = chatbot.chat(req2)
    logger.info(f"\n👤 Q2: {req2.message}")
    logger.info(f"🤖 R2: {resp2.response[:100]}...")
    
    logger.info("\n" + "=" * 70)
    logger.info("✅ TESTS TERMINÉS")
    logger.info("=" * 70)

