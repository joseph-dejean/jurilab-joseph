# 📋 Plan Complet : Ingestion depuis data.gouv.fr / DILA

## 🎯 Objectif

Ingérer **TOUTES** les données juridiques françaises depuis les sources officielles :
- **Codes juridiques complets** (~35,000 articles)
- **Jurisprudence** (~50,000+ décisions)
- **Mises à jour régulières**

---

## 📚 Sources de données disponibles

### 1. DILA (Direction de l'Information Légale et Administrative)

**URL** : `https://echanges.dila.gouv.fr/OPENDATA/LEGI/`

**Contenu** :
- Codes juridiques complets (Code Civil, Code Pénal, etc.)
- Format : **XML** (LEGI)
- Structure : Archives complètes avec historique

**Avantages** :
- ✅ Source officielle
- ✅ Données complètes et à jour
- ✅ Format structuré (XML)

**Inconvénients** :
- ⚠️ Parsing XML complexe
- ⚠️ Fichiers volumineux
- ⚠️ Structure hiérarchique profonde

### 2. data.gouv.fr

**URL** : `https://www.data.gouv.fr/`

**Contenu** :
- Jeux de données juridiques
- Formats variés (CSV, JSON, XML)
- Datasets communautaires

**Avantages** :
- ✅ API REST disponible
- ✅ Formats variés
- ✅ Documentation

**Inconvénients** :
- ⚠️ Données moins complètes que DILA
- ⚠️ Nécessite recherche dans le catalogue

### 3. API Légifrance PISTE (Non fonctionnelle actuellement)

**Statut** : ❌ Erreurs 500 serveur

**Quand disponible** :
- ✅ Données complètes
- ✅ API REST moderne
- ✅ Métadonnées riches

---

## 🏗️ Architecture d'ingestion proposée

### Stratégie multi-sources avec priorité

```
1. DILA OPENDATA (PRIORITÉ 1) ← Source officielle, complète
   ↓ (si échec)
2. data.gouv.fr API (PRIORITÉ 2) ← Alternative
   ↓ (si échec)
3. Hugging Face (PRIORITÉ 3) ← Datasets communautaires
   ↓ (si échec)
4. Génération enrichie (PRIORITÉ 4) ← Fallback
```

---

## 📥 Plan d'implémentation : DILA OPENDATA

### Étape 1 : Explorer la structure DILA

**URL de base** : `https://echanges.dila.gouv.fr/OPENDATA/LEGI/`

**Structure typique** :
```
OPENDATA/
├── LEGI/
│   ├── LEGI/
│   │   ├── LEGITEXT000006070721/  (Code Civil)
│   │   │   ├── LEGI/
│   │   │   │   ├── SCTA/
│   │   │   │   │   └── LEGISCTA000006074899.xml
│   │   │   │   └── ARTICLES/
│   │   │   │       └── LEGIARTI000006419101.xml
│   │   ├── LEGITEXT000006070716/  (Code Pénal)
│   │   └── ...
```

### Étape 2 : Télécharger les archives

**Méthode 1 : Téléchargement manuel**
1. Aller sur `https://echanges.dila.gouv.fr/OPENDATA/LEGI/`
2. Télécharger les archives ZIP par code
3. Extraire localement

**Méthode 2 : Script automatique**
- Scraper la page pour trouver les dernières versions
- Télécharger automatiquement
- Extraire et parser

### Étape 3 : Parser les fichiers XML

**Structure XML LEGI typique** :

```xml
<LEGI>
  <TEXTE>
    <META>
      <META_COMMUN>
        <ID>LEGITEXT000006070721</ID>
        <NATURE>CODE</NATURE>
        <TITRE>Code civil</TITRE>
      </META_COMMUN>
    </META>
    <STRUCTURE>
      <ARTICLE>
        <META>
          <META_ARTICLE>
            <ID>LEGIARTI000006419101</ID>
            <NUM>1101</NUM>
            <ETAT>VIGUEUR</ETAT>
            <DATE_DEBUT>2016-10-01</DATE_DEBUT>
          </META_ARTICLE>
        </META>
        <BLOC_TEXTUEL>
          <CONTENU>
            Le contrat est un accord de volontés...
          </CONTENU>
        </BLOC_TEXTUEL>
      </ARTICLE>
    </STRUCTURE>
  </TEXTE>
</LEGI>
```

### Étape 4 : Convertir en format Vertex AI

**Mapping XML → Vertex AI** :

```python
{
  "id": article.meta.id,  # LEGIARTI000006419101
  "jsonData": json.dumps({
    "content": article.contenu,
    "title": f"Article {article.num}",
    "metadata": {
      "code_id": texte.meta.id,  # LEGITEXT000006070721
      "code_name": texte.meta.titre,  # Code civil
      "article_num": article.num,  # 1101
      "etat": article.etat,  # VIGUEUR
      "date_debut": article.date_debut,  # 2016-10-01
      "date_fin": article.date_fin,  # null
      "type": "article_code",
      "source": "DILA OPENDATA",
    }
  })
}
```

---

## 🔧 Implémentation technique

### Bibliothèques nécessaires

```bash
pip install requests beautifulsoup4 lxml xmltodict
```

### Structure du code

```
ingestion/
├── ingestion_massive.py (existant)
├── sources/
│   ├── dila_opendata.py      # Parser DILA XML
│   ├── datagouv_api.py       # Client data.gouv.fr
│   └── base_parser.py         # Classe de base
└── parsers/
    ├── xml_legi_parser.py     # Parser XML LEGI
    └── json_parser.py         # Parser JSON (si disponible)
```

### Fonctionnalités à implémenter

1. **Téléchargement automatique**
   - Détecter les dernières versions
   - Télécharger les archives ZIP
   - Gérer les erreurs réseau

2. **Parsing XML**
   - Parser structure LEGI
   - Extraire articles avec métadonnées
   - Gérer les versions historiques

3. **Conversion format**
   - XML → Format Vertex AI
   - Validation des données
   - Gestion des erreurs

4. **Checkpointing**
   - Sauvegarder progression
   - Reprendre en cas d'erreur
   - Logs détaillés

---

## 📊 Plan d'exécution par phases

### Phase 1 : Exploration et test (1-2 jours)

**Objectifs** :
- Explorer la structure DILA
- Télécharger un code complet (Code Civil)
- Parser un échantillon (100 articles)
- Valider le format

**Livrables** :
- Script de téléchargement DILA
- Parser XML basique
- Test avec 100 articles Code Civil

### Phase 2 : Parser complet (2-3 jours)

**Objectifs** :
- Parser tous les articles d'un code
- Gérer les métadonnées complètes
- Gérer les versions historiques
- Validation complète

**Livrables** :
- Parser XML complet
- Code Civil complet (~8,000 articles)
- Format Vertex AI validé

### Phase 3 : Ingestion tous codes (3-5 jours)

**Objectifs** :
- Automatiser pour tous les codes
- Gérer les erreurs et retry
- Checkpointing robuste
- Logs et monitoring

**Livrables** :
- 7 codes juridiques complets
- ~35,000 articles ingérés
- Scripts de monitoring

### Phase 4 : Jurisprudence (3-5 jours)

**Objectifs** :
- Identifier sources jurisprudence
- Parser décisions de justice
- Intégrer dans même datastore

**Livrables** :
- Jurisprudence ingérée
- ~50,000+ décisions

---

## 🛠️ Détails techniques

### 1. Téléchargement DILA

```python
import requests
from pathlib import Path
import zipfile

def download_dila_code(code_id: str, output_dir: Path):
    """
    Télécharge un code depuis DILA OPENDATA
    
    Args:
        code_id: ID du code (ex: LEGITEXT000006070721)
        output_dir: Dossier de destination
    """
    base_url = "https://echanges.dila.gouv.fr/OPENDATA/LEGI/"
    
    # Trouver l'URL du dernier dump
    # (nécessite scraper la page ou utiliser API si disponible)
    
    # Télécharger l'archive ZIP
    zip_url = f"{base_url}LEGI/{code_id}/LEGI.zip"
    response = requests.get(zip_url, stream=True)
    
    # Sauvegarder
    zip_path = output_dir / f"{code_id}.zip"
    with open(zip_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    # Extraire
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(output_dir / code_id)
    
    return output_dir / code_id
```

### 2. Parser XML LEGI

```python
import xml.etree.ElementTree as ET
from typing import List, Dict

def parse_legi_xml(xml_path: Path) -> List[Dict]:
    """
    Parse un fichier XML LEGI et extrait les articles
    
    Returns:
        Liste d'articles au format dict
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    articles = []
    
    # Namespace LEGI
    ns = {
        'legi': 'http://www.legifrance.gouv.fr/XML/LEGI',
        'common': 'http://www.legifrance.gouv.fr/XML/COMMON'
    }
    
    # Parcourir les articles
    for article in root.findall('.//legi:ARTICLE', ns):
        meta = article.find('legi:META/legi:META_ARTICLE', ns)
        contenu = article.find('legi:BLOC_TEXTUEL/legi:CONTENU', ns)
        
        if meta is not None and contenu is not None:
            article_data = {
                "id": meta.find('legi:ID', ns).text,
                "num": meta.find('legi:NUM', ns).text,
                "etat": meta.find('legi:ETAT', ns).text,
                "date_debut": meta.find('legi:DATE_DEBUT', ns).text if meta.find('legi:DATE_DEBUT', ns) is not None else None,
                "date_fin": meta.find('legi:DATE_FIN', ns).text if meta.find('legi:DATE_FIN', ns) is not None else None,
                "content": contenu.text,
            }
            articles.append(article_data)
    
    return articles
```

### 3. Intégration dans ingestion_massive.py

```python
def _try_datagouv(
    self,
    code_name: str,
    code_info: Dict[str, Any],
    start_from: int = 0,
) -> List[Dict[str, Any]]:
    """Essaie de télécharger depuis DILA/data.gouv.fr"""
    
    # Essayer DILA d'abord
    articles = self._try_dila_opendata(code_name, code_info, start_from)
    if articles:
        return articles
    
    # Essayer data.gouv.fr API
    articles = self._try_datagouv_api(code_name, code_info, start_from)
    if articles:
        return articles
    
    return []
```

---

## 📋 Checklist d'implémentation

### Étape 1 : Exploration
- [ ] Explorer structure DILA OPENDATA
- [ ] Télécharger manuellement un code (Code Civil)
- [ ] Analyser structure XML
- [ ] Identifier les champs nécessaires

### Étape 2 : Parser basique
- [ ] Créer `ingestion/sources/dila_opendata.py`
- [ ] Implémenter téléchargement ZIP
- [ ] Implémenter extraction ZIP
- [ ] Implémenter parser XML basique
- [ ] Tester avec 10 articles

### Étape 3 : Parser complet
- [ ] Gérer tous les champs XML
- [ ] Gérer les métadonnées complètes
- [ ] Gérer les versions historiques
- [ ] Gérer les erreurs de parsing
- [ ] Tester avec Code Civil complet

### Étape 4 : Intégration
- [ ] Intégrer dans `ingestion_massive.py`
- [ ] Gérer les checkpoints
- [ ] Gérer les retry
- [ ] Logs détaillés
- [ ] Tester avec tous les codes

### Étape 5 : data.gouv.fr (optionnel)
- [ ] Explorer API data.gouv.fr
- [ ] Identifier datasets juridiques
- [ ] Implémenter client API
- [ ] Parser formats variés

---

## ⚠️ Défis et solutions

### Défi 1 : Structure XML complexe

**Problème** : XML LEGI très hiérarchique et namespaces

**Solution** :
- Utiliser `lxml` avec namespaces
- Créer des fonctions helper pour navigation
- Parser progressivement (structure → articles → contenu)

### Défi 2 : Fichiers volumineux

**Problème** : Archives ZIP de plusieurs GB

**Solution** :
- Téléchargement stream (chunk par chunk)
- Extraction progressive
- Parsing en streaming si possible

### Défi 3 : Versions historiques

**Problème** : Articles modifiés/abrogés avec historique

**Solution** :
- Parser toutes les versions
- Marquer avec `etat` (VIGUEUR, ABROGE, MODIFIE)
- Garder `date_debut` et `date_fin`

### Défi 4 : Performance

**Problème** : Parsing de 35,000 articles peut être lent

**Solution** :
- Parsing parallèle (multiprocessing)
- Checkpointing fréquent
- Optimisation XML (lxml C)

---

## 🎯 Résultat attendu

### Après implémentation complète

**Codes juridiques** :
- ✅ Code Civil : ~8,000 articles
- ✅ Code Pénal : ~5,000 articles
- ✅ Code du Travail : ~10,000 articles
- ✅ Code de Commerce : ~3,000 articles
- ✅ Code de Procédure Civile : ~2,000 articles
- ✅ Code de Procédure Pénale : ~2,000 articles
- ✅ Code de la Sécurité Sociale : ~5,000 articles

**Total** : ~35,000 articles complets avec métadonnées

**Format** : Tous au format Vertex AI avec segmentation par métadonnées

---

## 📝 Prochaines étapes immédiates

1. **Explorer DILA** : Télécharger manuellement Code Civil
2. **Analyser XML** : Comprendre la structure
3. **Créer parser basique** : 10 articles pour test
4. **Valider format** : Vérifier conversion Vertex AI
5. **Implémenter complet** : Tous les codes

---

**Date** : 19 Décembre 2025  
**Statut** : Plan d'implémentation complet

