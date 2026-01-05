# 🚀 Guide : Activer les Fonctionnalités Avancées Vertex AI Search

## 📋 Prérequis

✅ **Format d'ingestion modifié** : Les documents ont maintenant `content` en champ direct (pas dans `jsonData`)
✅ **Données ingérées** : Au moins quelques articles testés avec le nouveau format

---

## 🎯 Fonctionnalités à Activer

1. **Embeddings (Vecteurs sémantiques)**
2. **Segmentation automatique (Chunking)**
3. **Dynamic Retrieval**
4. **Recherche sémantique avancée**
5. **Grounding (Citations)**

---

## 📍 Étape 1 : Configurer les Embeddings

### Dans la Console GCP

1. **Aller dans** : Vertex AI Search → Applications → legal-rag-search
2. **Cliquer sur** : "Présentation de l'application" (menu de gauche)
3. **Stage "Retrieve"** → Cliquer sur **"Managed Retrieval"**
4. **Cliquer sur** : "Définir des vecteurs d'embedding" (lien bleu)

### Configuration des Embeddings

1. **Champ source** : Sélectionner `content`
   - C'est le champ qui contient le texte des articles
   - Vertex AI créera des embeddings sur ce champ

2. **Modèle d'embedding** : 
   - Par défaut : Modèle Google (recommandé)
   - Ou choisir un modèle personnalisé si nécessaire

3. **Sauvegarder**

### Vérification

Après configuration, vous devriez voir :
- ✅ "Embeddings configurés"
- ✅ Les options de segmentation deviennent disponibles

---

## 📍 Étape 2 : Activer la Segmentation Automatique

### Dans "Managed Retrieval"

1. **Après avoir configuré les embeddings**, retournez à "Managed Retrieval"
2. **Chercher** : "Chunking" ou "Segmentation"
3. **Activer** : "Automatic chunking" ou "Segmentation automatique"

### Configuration du Chunking

**Options disponibles** :
- **Taille des chunks** : 500-1000 tokens (défaut : 500)
- **Chevauchement** : 50-100 tokens (pour garder le contexte)
- **Méthode** : 
  - Par paragraphes (recommandé pour articles juridiques)
  - Par taille fixe
  - Intelligent (détecte les sections)

**Recommandation** :
- Taille : 500 tokens
- Chevauchement : 50 tokens
- Méthode : Intelligent ou par paragraphes

### Sauvegarder

---

## 📍 Étape 3 : Activer Dynamic Retrieval

### Dans "Managed Retrieval"

1. **Chercher** : "Dynamic Retrieval" ou "Récupération dynamique"
2. **Activer** : "Enable Dynamic Retrieval"

### Configuration

**Options** :
- **Nombre de chunks** : 5-10 (défaut : 5)
  - Nombre de segments à récupérer par requête
  - Plus = plus de contexte, mais plus lent

- **Stratégie** :
  - **Hybrid** : Sémantique + Keyword (recommandé)
  - **Semantic only** : Uniquement sémantique
  - **Keyword only** : Uniquement mots-clés

**Recommandation** :
- Nombre de chunks : 5-7
- Stratégie : Hybrid

---

## 📍 Étape 4 : Activer la Recherche Sémantique Avancée

### Dans "Configurations" (menu de gauche)

1. **Aller dans** : "Configurations"
2. **Chercher** : "Module complémentaire sémantique (embedding)"
3. **Activer** : Cocher la case

**Note** : Coût de 1,50 $/Go/mois basé sur l'abonnement de stockage.

### Vérification

Après activation :
- ✅ Recherche sémantique améliorée
- ✅ Meilleure compréhension des synonymes juridiques
- ✅ Recherche multilingue (si configuré)

---

## 📍 Étape 5 : Activer Grounding (Citations)

### Dans "Serve" → "Answer generation"

1. **Aller dans** : "Présentation de l'application"
2. **Stage "Serve"** → Cliquer sur **"Answer generation"**
3. **Chercher** : "Grounding" ou "Citations"
4. **Activer** : "Enable grounding" et "Show citations"

### Configuration

**Options** :
- **Format des citations** : 
  - Numéros de ligne
  - Références complètes
  - Liens vers sources

- **Style** :
  - Automatique
  - Personnalisé

**Recommandation** :
- Format : Références complètes (article, code, date)
- Style : Automatique

---

## 📍 Étape 6 : Vérifier le Schéma

### Dans "Données" → Votre datastore → "Schéma"

Vérifier que les champs suivants sont indexés :

✅ **Champs obligatoires** :
- `id` : string (clé)
- `content` : string (pour embeddings) ← **CRITIQUE**
- `title` : string

✅ **Métadonnées (pour filtrage)** :
- `code_id` : string
- `code_name` : string
- `type` : string
- `article_num` : string
- `etat` : string
- `date_debut` : string
- `date_fin` : string

**Vérifier** :
- ✅ "Inclus dans l'index de recherche" : Activé pour tous
- ✅ "Indexable" : Activé pour tous
- ✅ "Récup" (Retrievable) : Activé pour tous

---

## ✅ Checklist Finale

Avant de lancer l'ingestion complète :

- [ ] Embeddings configurés sur le champ `content`
- [ ] Segmentation automatique activée
- [ ] Dynamic Retrieval activé
- [ ] Module sémantique activé (si souhaité)
- [ ] Grounding activé
- [ ] Schéma vérifié (tous les champs indexés)
- [ ] Test avec quelques articles réussis

---

## 🧪 Test Final

### Tester la recherche avec embeddings

```python
from rag.vertex_search import VertexSearchClient

client = VertexSearchClient()

# Test 1 : Recherche simple
results = client.search("contrat de travail", page_size=5)
print(f"✅ {len(results)} résultats trouvés")

# Test 2 : Vérifier les métadonnées
for result in results:
    print(f"Article: {result['metadata'].get('article_num')}")
    print(f"Code: {result['metadata'].get('code_name')}")
    print(f"État: {result['metadata'].get('etat')}")
    print("---")

# Test 3 : Filtres (devraient fonctionner maintenant)
results_filtered = client.filter_by_metadata(
    query="contrat",
    code_id="LEGITEXT000006070721",
    etat="VIGUEUR"
)
print(f"✅ {len(results_filtered)} résultats filtrés")
```

### Vérifier la segmentation

Si activée, les documents longs devraient être automatiquement segmentés.
Vérifier dans les résultats si vous voyez des chunks au lieu de documents complets.

---

## 🚨 Dépannage

### Problème : "Définir des vecteurs d'embedding" ne fonctionne pas

**Solution** :
1. Vérifier que le champ `content` existe dans le schéma
2. Vérifier qu'au moins un document a été ingéré avec le nouveau format
3. Attendre quelques minutes après l'ingestion (indexation en cours)

### Problème : Segmentation ne s'active pas

**Solution** :
1. Vérifier que les embeddings sont configurés
2. Vérifier que le champ `content` est bien indexé
3. Réimporter quelques documents avec le nouveau format

### Problème : Filtres ne fonctionnent toujours pas

**Solution** :
1. Vérifier que les métadonnées sont en champs directs (pas dans `jsonData`)
2. Vérifier le schéma : les champs doivent être indexés
3. Utiliser le filtrage côté application en fallback

---

## 📝 Notes Importantes

1. **Réindexation** : Après modification du schéma, Vertex AI réindexe automatiquement (peut prendre quelques heures pour de gros volumes)

2. **Coûts** : 
   - Module sémantique : 1,50 $/Go/mois
   - Pour ~35K articles (~500 MB) : ~0,75 $/mois

3. **Performance** : 
   - Segmentation automatique améliore la précision
   - Dynamic Retrieval améliore la pertinence
   - Grounding ajoute de la traçabilité

---

**Date** : 19 Décembre 2025  
**Statut** : Prêt pour activation après ingestion test

