"""Test d'extraction d'un article complet"""

from pathlib import Path
from lxml import etree

# Trouver un fichier XML
xml_file = Path("C:/LEGI/legi/global/code_et_TNC_en_vigueur/code_en_vigueur/LEGI/TEXT/00/00/06/07/07/LEGITEXT000006070721/article/LEGI/ARTI/00/00/06/41/92/LEGIARTI000006419279.xml")

if not xml_file.exists():
    print(f"❌ Fichier non trouvé: {xml_file}")
    exit(1)

print(f"📄 Fichier: {xml_file.name}")
print()

tree = etree.parse(str(xml_file))
root = tree.getroot()

print(f"Tag racine: {root.tag}")
print()

# Afficher TOUS les enfants directs
print("=== ENFANTS DIRECTS ===")
for child in root:
    print(f"  - {child.tag}")
    # Afficher les enfants de niveau 2
    for subchild in child:
        print(f"    └─ {subchild.tag}")

print()
print("=== META ===")
meta = root.find('META')
if meta is not None:
    print("  META trouvé")
    for child in meta:
        print(f"    - {child.tag}")
        if child.tag == 'META_ARTICLE':
            print(f"      ID: {child.find('ID').text if child.find('ID') is not None else 'N/A'}")
            print(f"      NUM: {child.find('NUM').text if child.find('NUM') is not None else 'N/A'}")
            print(f"      ETAT: {child.find('ETAT').text if child.find('ETAT') is not None else 'N/A'}")
else:
    print("  ❌ META non trouvé")

print()
print("=== CONTEXTE ===")
contexte = root.find('CONTEXTE')
if contexte is not None:
    print("  CONTEXTE trouvé")
    for child in contexte:
        print(f"    - {child.tag}")
        if child.tag == 'META_COMMUN':
            print(f"      ID (code): {child.find('ID').text if child.find('ID') is not None else 'N/A'}")
            print(f"      TITRE (code): {child.find('TITRE').text if child.find('TITRE') is not None else 'N/A'}")
else:
    print("  ❌ CONTEXTE non trouvé")

print()
print("=== VERSIONS ===")
versions = root.find('VERSIONS')
if versions is not None:
    print("  VERSIONS trouvé")
    # Chercher la version en vigueur
    for version in versions:
        if version.tag == 'VERSION':
            etat = version.find('META_VERSION/ETAT')
            if etat is not None and etat.text == 'VIGUEUR':
                print(f"    Version en vigueur trouvée")
                meta_version = version.find('META_VERSION')
                if meta_version is not None:
                    print(f"      DATE_DEBUT: {meta_version.find('DATE_DEBUT').text if meta_version.find('DATE_DEBUT') is not None else 'N/A'}")
                    print(f"      DATE_FIN: {meta_version.find('DATE_FIN').text if meta_version.find('DATE_FIN') is not None else 'N/A'}")
else:
    print("  ❌ VERSIONS non trouvé")

print()
print("=== BLOC_TEXTUEL ===")
bloc = root.find('BLOC_TEXTUEL')
if bloc is not None:
    contenu = bloc.find('CONTENU')
    if contenu is not None:
        text = ''.join(contenu.itertext()).strip()
        print(f"  Contenu (premiers 200 chars): {text[:200]}...")
else:
    print("  ❌ BLOC_TEXTUEL non trouvé")

print()
print("✅ Test terminé")

