"""
Démonstration du Chatbot Avocat
Pilier 5 de LEGAL-RAG FRANCE - Hub central conversationnel
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au PATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.chatbot_avocat import ChatbotAvocat, quick_chat
from api.models import ChatRequest
from config.logging_config import get_logger

logger = get_logger(__name__)


def demo_question_simple():
    """Démo: Question simple avec RAG"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 1 : Question simple avec RAG")
    print("="*70)
    
    question = "Qu'est-ce qu'un contrat selon le Code civil ?"
    print(f"\n👤 Question: {question}")
    
    response = quick_chat(question)
    
    print(f"\n🤖 Réponse:")
    print(response.response)
    
    if response.sources:
        print(f"\n📚 Sources utilisées ({len(response.sources)}):")
        for i, source in enumerate(response.sources, 1):
            print(f"   {i}. {source.reference}")
            print(f"      Pertinence: {source.relevance:.0%}")
    
    if response.suggested_actions:
        print(f"\n💡 Actions suggérées:")
        for action in response.suggested_actions:
            print(f"   • {action}")
    
    print(f"\n📊 Confiance: {response.confidence:.0%}")


def demo_conversation():
    """Démo: Conversation avec historique"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 2 : Conversation avec historique")
    print("="*70)
    
    chatbot = ChatbotAvocat()
    
    # Question 1
    print("\n👤 Question 1: Quelle est la majorité en France ?")
    req1 = ChatRequest(message="Quelle est la majorité en France ?", use_rag=True)
    resp1 = chatbot.chat(req1)
    print(f"🤖 Réponse 1: {resp1.response[:200]}...")
    
    # Question 2 (dans la même conversation)
    print("\n👤 Question 2: Et pour les contrats ?")
    req2 = ChatRequest(
        message="Et pour les contrats ?",
        conversation_id=resp1.conversation_id,
        use_rag=True
    )
    resp2 = chatbot.chat(req2)
    print(f"🤖 Réponse 2: {resp2.response[:200]}...")
    
    print(f"\n📝 ID de conversation: {resp1.conversation_id}")


def demo_sans_rag():
    """Démo: Chat sans RAG (connaissance générale)"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 3 : Chat sans RAG")
    print("="*70)
    
    question = "Qu'est-ce que le droit ?"
    print(f"\n👤 Question: {question}")
    
    response = quick_chat(question, use_rag=False)
    
    print(f"\n🤖 Réponse:")
    print(response.response[:300] + "...")
    
    print(f"\n📚 Sources: {len(response.sources)} (sans RAG)")


def demo_questions_juridiques():
    """Démo: Série de questions juridiques"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 4 : Questions juridiques variées")
    print("="*70)
    
    questions = [
        "Quelles sont les conditions de validité d'un contrat ?",
        "Qu'est-ce que la prescription acquisitive ?",
        "Comment fonctionne la rupture du contrat de travail ?",
    ]
    
    for i, question in enumerate(questions, 1):
        print(f"\n👤 Question {i}: {question}")
        response = quick_chat(question)
        print(f"🤖 Réponse: {response.response[:150]}...")
        print(f"   Sources: {len(response.sources)} | Confiance: {response.confidence:.0%}")


def demo_interactive():
    """Mode interactif"""
    
    print("\n" + "="*70)
    print("🎮 MODE INTERACTIF - CHATBOT AVOCAT")
    print("="*70)
    print("\n💡 Conseils:")
    print("   • Posez des questions juridiques claires")
    print("   • Le chatbot cite ses sources")
    print("   • Tapez 'exit' pour quitter")
    print("   • Tapez 'clear' pour nouvelle conversation")
    
    chatbot = ChatbotAvocat()
    conv_id = None
    
    while True:
        try:
            question = input("\n👤 Vous: ").strip()
            
            if question.lower() in ["exit", "quit", "q"]:
                print("\n👋 Au revoir !")
                break
            
            if question.lower() == "clear":
                if conv_id:
                    chatbot.clear_conversation(conv_id)
                conv_id = None
                print("🔄 Nouvelle conversation démarrée")
                continue
            
            if not question:
                continue
            
            # Envoyer la question
            request = ChatRequest(
                message=question,
                conversation_id=conv_id,
                use_rag=True,
                max_sources=3
            )
            
            response = chatbot.chat(request)
            conv_id = response.conversation_id
            
            # Afficher la réponse
            print(f"\n🤖 Assistant: {response.response}")
            
            # Afficher les sources si disponibles
            if response.sources:
                print(f"\n📚 Sources:")
                for i, source in enumerate(response.sources, 1):
                    print(f"   {i}. {source.reference} ({source.relevance:.0%})")
            
            # Afficher les suggestions
            if response.suggested_actions:
                print(f"\n💡 Suggestions:")
                for action in response.suggested_actions:
                    print(f"   • {action}")
        
        except KeyboardInterrupt:
            print("\n\n👋 Au revoir !")
            break
        except Exception as e:
            print(f"\n❌ Erreur: {e}")


def main():
    """Menu principal"""
    
    print("\n" + "="*70)
    print("🎯 DÉMONSTRATION - CHATBOT AVOCAT")
    print("   Pilier 5 de LEGAL-RAG FRANCE - Hub Central Conversationnel")
    print("="*70)
    
    print("\nChoisissez une démonstration:")
    print("  1. Question simple avec RAG")
    print("  2. Conversation avec historique")
    print("  3. Chat sans RAG")
    print("  4. Questions juridiques variées")
    print("  5. Mode interactif")
    print("  6. Toutes les démos (1-4)")
    print("  0. Quitter")
    
    choice = input("\nVotre choix (0-6): ").strip()
    
    if choice == "1":
        demo_question_simple()
    elif choice == "2":
        demo_conversation()
    elif choice == "3":
        demo_sans_rag()
    elif choice == "4":
        demo_questions_juridiques()
    elif choice == "5":
        demo_interactive()
    elif choice == "6":
        demo_question_simple()
        demo_conversation()
        demo_sans_rag()
        demo_questions_juridiques()
    elif choice == "0":
        print("\n👋 Au revoir !")
    else:
        print("\n❌ Choix invalide")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Au revoir !")
    except Exception as e:
        logger.error(f"Erreur: {e}")
        import traceback
        traceback.print_exc()

