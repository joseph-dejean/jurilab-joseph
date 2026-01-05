"""Test de la structure XML pour adapter le parser"""

from pathlib import Path
from lxml import etree

# Trouver un fichier XML
legi_dir = Path("C:/LEGI/legi/global/code_et_TNC_en_vigueur/code_en_vigueur/LEGI/TEXT/00/00/06/07/07/LEGITEXT000006070721")

xml_files = list(legi_dir.rglob("*.xml"))[:3]

if not xml_files:
    print("❌ Aucun fichier XML trouvé")
    exit(1)

print(f"📄 Test avec {len(xml_files)} fichiers XML")
print()

for xml_file in xml_files:
    print(f"📄 Fichier: {xml_file.name}")
    print(f"   Chemin: {xml_file}")
    print()
    
    try:
        tree = etree.parse(str(xml_file))
        root = tree.getroot()
        
        print(f"   Tag racine: {root.tag}")
        print(f"   Namespace: {root.nsmap}")
        print()
        
        # Chercher différents éléments
        print("   Éléments trouvés:")
        
        # Articles
        articles = root.xpath('.//ARTICLE | .//legi:ARTICLE', namespaces={'legi': 'http://www.legifrance.gouv.fr/XML/LEGI'})
        print(f"   - ARTICLE: {len(articles)}")
        
        # Tous les éléments
        all_elements = root.xpath('.//*')
        element_tags = set([e.tag for e in all_elements])
        print(f"   - Tags uniques: {len(element_tags)}")
        print(f"   - Exemples: {list(element_tags)[:10]}")
        print()
        
        # Afficher la structure du premier niveau
        print("   Structure niveau 1:")
        for child in root[:5]:
            print(f"      - {child.tag}: {child.text[:50] if child.text else 'None'}...")
        print()
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        print()
    
    # Tester seulement le premier fichier
    break

print("✅ Test terminé")

