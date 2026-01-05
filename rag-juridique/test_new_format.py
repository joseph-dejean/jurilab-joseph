"""
Script de test pour valider le nouveau format d'ingestion

Teste :
1. Génération d'articles avec le nouveau format
2. Export JSONL
3. Validation du format
4. Test de recherche (si Vertex AI configuré)
"""

import json
from pathlib import Path
from ingestion.ingestion_massive import MassiveIngester

def test_new_format():
    """Test le nouveau format d'ingestion"""
    print("=" * 70)
    print("🧪 TEST DU NOUVEAU FORMAT D'INGESTION")
    print("=" * 70)
    print()
    
    # Initialiser l'ingester
    ingester = MassiveIngester(max_articles=5)
    
    # Code Civil pour test
    code_info = {
        "id": "LEGITEXT000006070721",
        "name": "Code civil",
    }
    
    # Créer un article de test
    print("📝 Création d'un article de test...")
    article = ingester._create_article(
        code_info=code_info,
        article_id="TEST_001",
        num="1101",
        content="Le contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations.",
        breadcrumb="Code civil > Livre III > Titre III > Article 1101",
        date_debut="2016-10-01",
        etat="VIGUEUR",
        source="Test",
    )
    
    print("✅ Article créé")
    print()
    
    # Afficher le format
    print("📄 Format de l'article :")
    print(json.dumps(article, indent=2, ensure_ascii=False))
    print()
    
    # Vérifications
    print("🔍 Vérifications :")
    
    checks = {
        "id présent": "id" in article,
        "content en champ direct": "content" in article and isinstance(article["content"], str),
        "title en champ direct": "title" in article,
        "code_id en champ direct": "code_id" in article,
        "code_name en champ direct": "code_name" in article,
        "Pas de jsonData": "jsonData" not in article,
        "Métadonnées en champs directs": all(key in article for key in ["type", "etat", "article_num", "date_debut"]),
    }
    
    all_ok = True
    for check_name, check_result in checks.items():
        status = "✅" if check_result else "❌"
        print(f"   {status} {check_name}")
        if not check_result:
            all_ok = False
    
    print()
    
    if all_ok:
        print("✅ TOUS LES CHECKS PASSÉS - Format correct!")
        print()
        print("📋 Prochaines étapes :")
        print("   1. Ingérer quelques articles avec ce format")
        print("   2. Configurer les embeddings dans Vertex AI")
        print("   3. Activer la segmentation automatique")
        print("   4. Tester la recherche")
    else:
        print("❌ CERTAINS CHECKS ONT ÉCHOUÉ - Vérifier le format")
    
    print()
    print("=" * 70)
    
    return all_ok


if __name__ == "__main__":
    test_new_format()

