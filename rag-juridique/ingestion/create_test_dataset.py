"""
Crée un dataset de test avec quelques articles du Code Civil
Pour tester le pipeline complet en attendant les vraies données
"""

import json
from pathlib import Path

from config.settings import get_settings
from config.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()


# Quelques articles réels du Code Civil pour tester
TEST_ARTICLES = [
    {
        "id": "LEGIARTI000006419329",
        "num": "1",
        "breadcrumb": ["Code civil", "Livre préliminaire", "Titre Ier", "Article 1"],
        "text": "Les lois et, lorsqu'ils sont publiés au Journal officiel de la République française, les actes administratifs entrent en vigueur à la date qu'ils fixent ou, à défaut, le lendemain de leur publication. Toutefois, l'entrée en vigueur de celles de leurs dispositions dont l'exécution nécessite des mesures d'application est reportée à la date d'entrée en vigueur de ces mesures.",
        "date_debut": "1804-02-07",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419331",
        "num": "2",
        "breadcrumb": ["Code civil", "Livre préliminaire", "Titre Ier", "Article 2"],
        "text": "La loi ne dispose que pour l'avenir ; elle n'a point d'effet rétroactif.",
        "date_debut": "1804-02-07",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419283",
        "num": "414",
        "breadcrumb": ["Code civil", "Livre I", "Titre XI", "Chapitre Ier", "Section 1", "Article 414"],
        "text": "La majorité est fixée à dix-huit ans accomplis ; à cet âge, chacun est capable d'exercer les droits dont il a la jouissance.",
        "date_debut": "2009-01-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419332",
        "num": "515",
        "breadcrumb": ["Code civil", "Livre I", "Titre VII", "Article 515"],
        "text": "Les enfants dont la filiation est légalement établie ont les mêmes droits et les mêmes devoirs dans leurs rapports avec leur père et mère. Ils entrent dans la famille de chacun d'eux.",
        "date_debut": "2005-07-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419101",
        "num": "1101",
        "breadcrumb": ["Code civil", "Livre III", "Titre III", "Chapitre I", "Section 1", "Article 1101"],
        "text": "Le contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations.",
        "date_debut": "2016-10-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419102",
        "num": "1102",
        "breadcrumb": ["Code civil", "Livre III", "Titre III", "Chapitre I", "Section 1", "Article 1102"],
        "text": "Chacun est libre de contracter ou de ne pas contracter, de choisir son cocontractant et de déterminer le contenu et la forme du contrat dans les limites fixées par la loi. La liberté contractuelle ne permet pas de déroger aux règles qui intéressent l'ordre public.",
        "date_debut": "2016-10-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419103",
        "num": "1103",
        "breadcrumb": ["Code civil", "Livre III", "Titre III", "Chapitre I", "Section 1", "Article 1103"],
        "text": "Les contrats légalement formés tiennent lieu de loi à ceux qui les ont faits.",
        "date_debut": "2016-10-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419104",
        "num": "1104",
        "breadcrumb": ["Code civil", "Livre III", "Titre III", "Chapitre I", "Section 1", "Article 1104"],
        "text": "Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public.",
        "date_debut": "2016-10-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419105",
        "num": "1105",
        "breadcrumb": ["Code civil", "Livre III", "Titre III", "Chapitre I", "Section 1", "Article 1105"],
        "text": "Les contrats, qu'ils aient ou non une dénomination propre, sont soumis à des règles générales, qui sont l'objet du présent sous-titre. Les règles particulières à certains contrats sont établies dans les dispositions propres à chacun d'eux. Les règles générales s'appliquent sous réserve de ces règles particulières.",
        "date_debut": "2016-10-01",
        "etat": "VIGUEUR"
    },
    {
        "id": "LEGIARTI000006419285",
        "num": "544",
        "breadcrumb": ["Code civil", "Livre II", "Titre Ier", "Chapitre II", "Article 544"],
        "text": "La propriété est le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu'on n'en fasse pas un usage prohibé par les lois ou par les règlements.",
        "date_debut": "1804-02-07",
        "etat": "VIGUEUR"
    },
]


def create_test_dataset():
    """Crée un dataset de test au format Vertex AI"""
    
    logger.info("=" * 70)
    logger.info("🧪 CRÉATION DATASET DE TEST")
    logger.info("=" * 70)
    
    # Conversion au format Vertex AI
    vertex_articles = []
    
    for article in TEST_ARTICLES:
        # jsonData doit être une STRING JSON, pas un objet
        json_data = {
            "content": article["text"],
            "title": f"Article {article['num']}",
            "metadata": {
                "article_id": article["id"],
                "article_num": article["num"],
                "breadcrumb": " > ".join(article["breadcrumb"]),
                "date_debut": article["date_debut"],
                "date_fin": None,
                "etat": article["etat"],
                "nature": "CODE",
                "source": "Test Dataset",
                "code_id": "LEGITEXT000006070721",
                "type": "article_code"
            }
        }
        
        vertex_format = {
            "id": article["id"],
            "jsonData": json.dumps(json_data, ensure_ascii=False)  # ✅ STRING JSON
        }
        vertex_articles.append(vertex_format)
    
    # Export en JSONL
    output_path = settings.get_jsonl_export_path("LEGITEXT000006070721_test")
    
    with open(output_path, "w", encoding="utf-8") as f:
        for article in vertex_articles:
            f.write(json.dumps(article, ensure_ascii=False) + "\n")
    
    logger.success(f"✅ Dataset de test créé: {output_path}")
    logger.success(f"📊 {len(vertex_articles)} articles exportés")
    logger.info("")
    logger.info("Articles inclus:")
    for art in TEST_ARTICLES:
        logger.info(f"   - Article {art['num']}: {art['text'][:60]}...")
    
    logger.info("")
    logger.info("=" * 70)
    logger.info("💡 PROCHAINES ÉTAPES")
    logger.info("=" * 70)
    logger.info("1. Tester l'import dans Vertex AI Search avec ce fichier")
    logger.info("2. Valider que le pipeline fonctionne end-to-end")
    logger.info("3. Remplacer par vraies données quand API Legifrance OK")
    logger.info("=" * 70)


if __name__ == "__main__":
    create_test_dataset()

