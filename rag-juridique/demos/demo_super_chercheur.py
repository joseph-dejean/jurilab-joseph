"""
Démonstration du Super-Chercheur de Jurisprudence
Pilier 2 de LEGAL-RAG FRANCE
"""

import sys
from pathlib import Path

# Ajouter le répertoire parent au PATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.super_chercheur import quick_search, search_in_code
from api.models import SearchFilters, SearchRequest, Jurisdiction, LegalMatter
from config.logging_config import get_logger

logger = get_logger(__name__)


def demo_recherche_simple():
    """Démo: Recherche simple"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 1 : Recherche simple")
    print("="*70)
    
    query = "Qu'est-ce qu'un contrat ?"
    print(f"\n🔍 Question: {query}")
    
    response = quick_search(query)
    
    print(f"\n✅ {response.total} résultats trouvés en {response.processing_time_ms:.0f}ms")
    
    for i, result in enumerate(response.results[:3], 1):
        print(f"\n{i}. {result.title}")
        print(f"   Score: {result.score:.2%}")
        print(f"   {result.content[:200]}...")
        
        if result.metadata.get("breadcrumb"):
            print(f"   📍 {result.metadata['breadcrumb']}")
    
    # Analyse de tendances
    if response.trends:
        print(f"\n📊 ANALYSE DE TENDANCES:")
        print(f"   • Probabilité de succès: {response.trends.success_probability:.0%}")
        print(f"   • Cas similaires: {response.trends.similar_cases_count}")
        
        if response.trends.dominant_jurisprudence:
            print(f"   • Jurisprudence dominante: {response.trends.dominant_jurisprudence}")
        
        if response.trends.key_arguments:
            print(f"   • Arguments clés:")
            for arg in response.trends.key_arguments:
                print(f"     - {arg}")


def demo_recherche_code_civil():
    """Démo: Recherche dans le Code Civil"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 2 : Recherche dans le Code Civil")
    print("="*70)
    
    query = "majorité"
    print(f"\n🔍 Recherche: {query}")
    print(f"📘 Code: Code Civil (LEGITEXT000006070721)")
    
    response = search_in_code(
        query=query,
        code_id="LEGITEXT000006070721",
        en_vigueur_only=True
    )
    
    print(f"\n✅ {response.total} article(s) trouvé(s)")
    
    for i, result in enumerate(response.results, 1):
        print(f"\n{i}. {result.title}")
        print(f"   Score: {result.score:.2%}")
        print(f"   {result.content}")
        
        metadata = result.metadata
        print(f"   📅 Date: {metadata.get('date_debut', 'N/A')}")
        print(f"   ⚖️ État: {metadata.get('etat', 'N/A')}")


def demo_comparaison_requetes():
    """Démo: Comparaison de requêtes similaires"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 3 : Comparaison de requêtes")
    print("="*70)
    
    queries = [
        "contrat",
        "accord entre parties",
        "convention"
    ]
    
    print("\n🔍 Comparaison de requêtes similaires:")
    print("   (toutes visent le même concept juridique)")
    
    for query in queries:
        response = quick_search(query)
        top_result = response.results[0] if response.results else None
        
        print(f"\n• '{query}':")
        if top_result:
            print(f"  → {top_result.title} (score: {top_result.score:.2%})")
        else:
            print(f"  → Aucun résultat")


def demo_evolution_temporelle():
    """Démo: Analyse d'évolution temporelle"""
    
    print("\n" + "="*70)
    print("📝 DÉMO 4 : Évolution temporelle")
    print("="*70)
    
    query = "propriété"
    print(f"\n🔍 Recherche: {query}")
    
    response = quick_search(query)
    
    if response.trends and response.trends.temporal_evolution:
        evolution = response.trends.temporal_evolution
        
        print(f"\n📈 ÉVOLUTION TEMPORELLE:")
        print(f"   • Tendance: {evolution.get('trend', 'N/A')}")
        print(f"   • Année pic: {evolution.get('peak_year', 'N/A')}")
        
        if "yearly_distribution" in evolution:
            print(f"   • Distribution par année:")
            for year, count in evolution["yearly_distribution"].items():
                print(f"     {year}: {count} article(s)")


def demo_interactive():
    """Mode interactif"""
    
    print("\n" + "="*70)
    print("🎮 MODE INTERACTIF")
    print("="*70)
    print("\n💡 Tapez 'exit' pour quitter")
    
    while True:
        try:
            query = input("\n🔍 Votre question juridique: ").strip()
            
            if query.lower() in ["exit", "quit", "q"]:
                print("\n👋 Au revoir !")
                break
            
            if not query:
                continue
            
            response = quick_search(query)
            
            print(f"\n✅ {response.total} résultat(s) ({response.processing_time_ms:.0f}ms)")
            
            for i, result in enumerate(response.results[:3], 1):
                print(f"\n{i}. {result.title}")
                print(f"   {result.content[:150]}...")
            
            if response.trends and response.trends.success_probability:
                print(f"\n📊 Probabilité estimée: {response.trends.success_probability:.0%}")
        
        except KeyboardInterrupt:
            print("\n\n👋 Au revoir !")
            break
        except Exception as e:
            print(f"\n❌ Erreur: {e}")


def main():
    """Menu principal"""
    
    print("\n" + "="*70)
    print("🎯 DÉMONSTRATION - SUPER-CHERCHEUR DE JURISPRUDENCE")
    print("   Pilier 2 de LEGAL-RAG FRANCE")
    print("="*70)
    
    print("\nChoisissez une démonstration:")
    print("  1. Recherche simple")
    print("  2. Recherche dans le Code Civil")
    print("  3. Comparaison de requêtes")
    print("  4. Évolution temporelle")
    print("  5. Mode interactif")
    print("  6. Toutes les démos (1-4)")
    print("  0. Quitter")
    
    choice = input("\nVotre choix (1-6): ").strip()
    
    if choice == "1":
        demo_recherche_simple()
    elif choice == "2":
        demo_recherche_code_civil()
    elif choice == "3":
        demo_comparaison_requetes()
    elif choice == "4":
        demo_evolution_temporelle()
    elif choice == "5":
        demo_interactive()
    elif choice == "6":
        demo_recherche_simple()
        demo_recherche_code_civil()
        demo_comparaison_requetes()
        demo_evolution_temporelle()
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

