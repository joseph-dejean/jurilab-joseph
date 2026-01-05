# 🧹 Guide : Nettoyer les Doublons dans Vertex AI Search

## ✅ Oui, c'est facile à faire plus tard !

Plusieurs méthodes pour nettoyer les doublons :

---

## Méthode 1 : Supprimer les anciens imports (Recommandé)

### Via Console GCP

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. **Vertex AI** → **Search** → **Data Stores**
3. Cliquer sur `datastorerag_1766055384992`
4. Onglet **Documents** ou **Import History**
5. Identifier les anciens imports (par date ou nom de fichier)
6. Supprimer les documents des anciens imports

### Via API (si nécessaire)

```python
from google.cloud import discoveryengine_v1 as discoveryengine

client = discoveryengine.DocumentServiceClient()

# Supprimer un document par ID
document_path = client.document_path(
    project="jurilab-481600",
    location="global",
    data_store="datastorerag_1766055384992",
    branch="default_branch",
    document="LEGIARTI000006419101"  # ID du document à supprimer
)

client.delete_document(name=document_path)
```

---

## Méthode 2 : Réimporter avec IDs uniques

### Stratégie

1. **Identifier les doublons** : Documents avec même `article_num` mais IDs différents
2. **Créer un script de nettoyage** qui :
   - Liste tous les documents
   - Identifie les doublons (par `article_num` + `code_id`)
   - Garde le plus récent (ou celui avec le meilleur format)
   - Supprime les autres

### Script de nettoyage (à créer si nécessaire)

```python
"""Script pour nettoyer les doublons dans Vertex AI Search"""

from rag.vertex_search import VertexSearchClient
from collections import defaultdict

client = VertexSearchClient()

# Récupérer tous les documents
all_docs = client.search("", page_size=1000)  # Recherche vide pour tout récupérer

# Grouper par clé unique (code_id + article_num)
documents_by_key = defaultdict(list)

for doc in all_docs:
    metadata = doc.get('metadata', {})
    key = (
        metadata.get('code_id', 'unknown'),
        metadata.get('article_num', 'unknown')
    )
    documents_by_key[key].append(doc)

# Identifier les doublons
duplicates = {k: v for k, v in documents_by_key.items() if len(v) > 1}

print(f"✅ {len(duplicates)} groupes de doublons trouvés")

# Pour chaque groupe, garder le plus récent
for key, docs in duplicates.items():
    # Trier par ingestion_date (plus récent en premier)
    docs_sorted = sorted(
        docs,
        key=lambda x: x.get('metadata', {}).get('ingestion_date', ''),
        reverse=True
    )
    
    # Garder le premier, supprimer les autres
    keep = docs_sorted[0]
    to_delete = docs_sorted[1:]
    
    print(f"   Garder: {keep.get('id')}")
    for doc in to_delete:
        print(f"   Supprimer: {doc.get('id')}")
        # Supprimer via API (voir méthode 1)
```

---

## Méthode 3 : Réimporter tout proprement

### Stratégie "Clean Slate"

1. **Supprimer tous les documents** du datastore
2. **Réimporter uniquement les nouveaux fichiers** (sans doublons)

### Avantages

- ✅ Pas de doublons
- ✅ Format uniforme
- ✅ Métadonnées cohérentes

### Inconvénients

- ⚠️ Perte temporaire des données (pendant réimport)
- ⚠️ Temps de réimport

---

## Méthode 4 : Filtrer côté application (Temporaire)

En attendant le nettoyage, filtrer les doublons dans le code :

```python
def remove_duplicates(results):
    """Supprime les doublons basés sur article_num + code_id"""
    seen = set()
    unique_results = []
    
    for doc in results:
        metadata = doc.get('metadata', {})
        key = (
            metadata.get('code_id', ''),
            metadata.get('article_num', '')
        )
        
        if key not in seen:
            seen.add(key)
            unique_results.append(doc)
    
    return unique_results

# Utilisation
results = client.search("contrat", page_size=50)
unique_results = remove_duplicates(results)
```

---

## Recommandation

### Pour l'instant

**Continuer l'ingestion** avec les nouveaux fichiers. Les doublons n'empêchent pas le fonctionnement.

### Plus tard (quand vous aurez tout ingéré)

1. **Méthode 1** : Supprimer les anciens imports via Console (le plus simple)
2. Ou **Méthode 3** : Clean slate (si beaucoup de doublons)

---

## Identification des doublons

### Comment identifier un doublon ?

Un doublon = même contenu mais :
- IDs différents : `LEGIARTI000006419101` vs `LEGITEXT000006070721_ENRICHED_000000`
- Même `article_num` : `1101`
- Même `code_id` : `LEGITEXT000006070721`

### Exemple de doublon

```json
// Document 1 (ancien test)
{"id": "LEGIARTI000006419101", "metadata": {"article_num": "1101", "code_id": "LEGITEXT000006070721"}}

// Document 2 (nouveau)
{"id": "LEGITEXT000006070721_ENRICHED_000002", "metadata": {"article_num": "1101", "code_id": "LEGITEXT000006070721"}}
```

→ Même article, IDs différents = DOUBLON

---

## Conclusion

✅ **Oui, c'est facile à nettoyer plus tard**

**Options :**
1. Via Console GCP (le plus simple)
2. Via script Python (si beaucoup de doublons)
3. Clean slate (réimporter tout)

**Pour l'instant :** Continuez l'ingestion, les doublons n'empêchent pas le fonctionnement.

---

**Date** : 19 Décembre 2025

