# 🔍 Pilier 3 - Améliorations futures

## 📋 État actuel

Le Pilier 3 fonctionne avec :
- **Extraction** : Regex (pattern matching basique)
- **Vérification** : Vertex AI Search (RAG)
- **Analyse** : Logique déterministe (if/else sur statut)
- **Recommandations** : Gemini (génération de texte)

## ✅ Ce qui fonctionne bien

1. **Détection des articles standards** : "article 1101 du Code civil" ✅
2. **Vérification via RAG** : Cherche dans Vertex AI ✅
3. **Rapports structurés** : Par sévérité (CRITICAL, HIGH, MEDIUM, LOW) ✅
4. **Recommandations IA** : Gemini génère des conseils pertinents ✅

## ❌ Limites actuelles

### 1. Extraction basique (Regex)

**Problème** : Rate beaucoup de formats

```python
# ✅ Détecte :
"article 1101 du Code civil"
"article 414 du Code civil"

# ❌ Rate :
"art. 1101"                    # Abréviation
"l'article mille cent un"      # Écrit en lettres
"Art. 1101, al. 2"            # Avec alinéa
"articles 1101 à 1103"        # Plage d'articles
"L. 110-1"                     # Notation légistique
"article L110-1 du Code de commerce"
```

**Solution** : Utiliser NLP (Spacy + règles personnalisées)

```python
import spacy
from spacy.matcher import Matcher

nlp = spacy.load("fr_core_news_md")
matcher = Matcher(nlp.vocab)

# Pattern pour "article X du Code Y"
pattern1 = [
    {"LOWER": {"IN": ["article", "art", "art."]}},
    {"TEXT": {"REGEX": r"\d+(-\d+)?"}},
    {"LOWER": {"IN": ["du", "de", "des"]}},
    {"LOWER": "code"},
    {"LOWER": {"IN": ["civil", "pénal", "travail"]}}
]

matcher.add("LEGAL_REFERENCE", [pattern1])
```

### 2. Dataset limité

**Problème** : Seulement 10 articles, tous en VIGUEUR

**Impact** :
- Aucun article ABROGE détecté
- Aucun article MODIFIE détecté
- Score de conformité toujours 100%

**Solution** :
1. Ingérer plus d'articles (tous les codes)
2. Inclure l'historique des versions
3. Marquer les articles abrogés

**Exemple de test réaliste** :

```python
# Article 1134 du Code civil
# ❌ ABROGE le 01/10/2016 (réforme du droit des contrats)
# → Remplacé par article 1103

# Un contrat de 2010 qui cite l'article 1134
# → Devrait être détecté comme PROBLÈME CRITIQUE
```

### 3. Pas de support PDF/DOCX

**Problème** : Seulement texte brut

```python
# Actuellement
request = AuditRequest(
    document_content="CONTRAT DE VENTE\n\nArticle 1...",  # Texte
)

# Besoin
request = AuditRequest(
    document_file="contrat.pdf",  # PDF/DOCX
)
```

**Solution** : Ajouter extracteurs

```python
import PyPDF2  # Pour PDF
from docx import Document  # Pour DOCX

def extract_text_from_pdf(file_path: str) -> str:
    """Extrait le texte d'un PDF"""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text

def extract_text_from_docx(file_path: str) -> str:
    """Extrait le texte d'un DOCX"""
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])
```

### 4. Pas de détection temporelle

**Problème** : Ne compare pas la date du document avec les dates de modification

```python
# Exemple manqué :
# - Document signé : 01/01/2010
# - Article 1101 : modifié le 01/10/2016
# → Version 2010 ≠ version 2024
# → Devrait détecter l'anachronisme !
```

**Solution** : Comparer les dates

```python
def _verify_reference_temporal(
    reference: dict,
    document_date: datetime
) -> AuditIssue | None:
    """Vérifie si la version citée correspond à la date du document"""
    
    # Récupérer l'historique des versions
    versions = self._get_article_history(reference["article_num"])
    
    # Trouver la version en vigueur à la date du document
    version_at_date = self._get_version_at_date(versions, document_date)
    
    # Trouver la version actuelle
    current_version = versions[-1]
    
    # Comparer
    if version_at_date != current_version:
        return AuditIssue(
            severity=IssueSeverity.HIGH,
            description=f"Article {ref['article_num']} a changé depuis {document_date}",
            recommendation="Vérifier si le contenu cité correspond à la version actuelle"
        )
```

### 5. Pas de vérification MCP en temps réel

**Problème** : Dépend uniquement de Vertex AI (données statiques)

**Solution** : Intégrer MCP Légifrance

```python
from mcp import LegiFranceClient

def _verify_with_mcp(article_id: str) -> dict:
    """Vérifie l'état actuel sur Légifrance en temps réel"""
    client = LegiFranceClient()
    article = client.get_article(article_id)
    return {
        "etat": article.etat,
        "date_debut": article.date_debut,
        "date_fin": article.date_fin,
    }
```

## 🚀 Roadmap d'amélioration

### Phase 1 (Court terme)
- [ ] Ajouter extraction PDF/DOCX
- [ ] Ingérer plus d'articles (incluant abrogés)
- [ ] Améliorer les patterns regex

### Phase 2 (Moyen terme)
- [ ] Migration vers NLP (Spacy)
- [ ] Détection temporelle (versions historiques)
- [ ] Extraction d'alinéas et paragraphes

### Phase 3 (Long terme)
- [ ] Intégration MCP Légifrance (temps réel)
- [ ] Détection de clauses abusives
- [ ] Analyse sémantique du contenu (pas juste références)

## 📊 Comment tester les erreurs ?

### Test 1 : Article inexistant

```python
document = """
Conformément à l'article 9999 du Code civil...
"""
# Devrait détecter : "Référence introuvable"
```

### Test 2 : Format non standard

```python
document = """
Selon l'art. 1101 et l'art. mille cent deux...
"""
# Regex actuelle : rate "art." et "mille cent deux"
```

### Test 3 : Article abrogé (quand données complètes)

```python
document = """
Contrat signé le 15/01/2010

Conformément à l'article 1134 du Code civil...
"""
# Article 1134 abrogé en 2016
# Devrait détecter : "Article ABROGE"
```

## 📝 Conclusion

Le Pilier 3 **fonctionne** mais c'est un **MVP** :
- ✅ Logique de base solide
- ✅ Architecture extensible
- ❌ Extraction basique (regex)
- ❌ Dataset limité
- ❌ Pas de PDF/DOCX
- ❌ Pas de détection temporelle

**Pour production** : Implémenter les améliorations Phase 1 & 2.

**Pour MVP** : Suffit pour démontrer le concept ! 🎯

