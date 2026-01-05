# 📋 Stratégie Finale d'Ingestion - Legal-RAG France

## ✅ Configuration Actuelle (Validée)

### Datastore Structuré : Codes et Lois

**Type** : "Données structurées"  
**ID** : `datastorerag_1766055384992`  
**Format** : Champs directs (content, title, métadonnées)

**Fonctionnalités activées** :
- ✅ **Embeddings** : Automatiques (module sémantique activé)
- ✅ **Recherche sémantique** : Fonctionne (testé avec succès)
- ✅ **Filtrage** : Côté application (fonctionnel)
- ⚠️ **Filtres Vertex AI** : Non disponibles (limitation datastore structuré)
- ⚠️ **Segmentation automatique** : Non disponible (limitation datastore structuré)

**Avantages** :
- Parfait pour articles courts (codes juridiques)
- Format structuré = recherche rapide
- Filtrage côté application fonctionne bien

**Limitations** :
- Pas de segmentation automatique
- Filtres Vertex AI non disponibles

---

## 📚 Données à Ingérer (Phase 1)

### Codes Juridiques depuis C:\LEGI

**Source** : `C:\LEGI\legi\global\code_et_TNC_en_vigueur`

**Codes principaux** :
- Code Civil (~8,000 articles)
- Code Pénal (~5,000 articles)
- Code du Travail (~10,000 articles)
- Code de Commerce (~3,000 articles)
- Code de Procédure Civile (~2,000 articles)
- Code de Procédure Pénale (~2,000 articles)
- Code de la Sécurité Sociale (~5,000 articles)
- + 66 autres codes officiels

**Total estimé** : ~35,000 articles

**Format** : JSONL avec champs directs
- `content` : Texte de l'article
- `title` : Titre de l'article
- Métadonnées : `code_id`, `code_name`, `article_num`, `etat`, etc.

---

## 🔮 Phase 2 : Jurisprudence (Plus tard)

### Datastore Non Structuré : Jurisprudences et Conclusions

**Type** : "Données non structurées"  
**Format** : PDF, TXT, HTML

**Fonctionnalités disponibles** :
- ✅ **Segmentation automatique** : Native (par paragraphes)
- ✅ **Dynamic Retrieval** : Disponible
- ✅ **Grounding** : Citations précises
- ✅ **Filtres Vertex AI** : Disponibles

**Avantages** :
- Parfait pour documents longs (jurisprudences, conclusions)
- Segmentation intelligente automatique
- Meilleure précision pour documents complexes

**Données** :
- INCA : Arrêts Cour de cassation
- JADE : Jurisprudence administrative
- CASS : Autres arrêts
- CAPP : Cours d'appel

---

## 🚀 Plan d'Action Immédiat

### Étape 1 : Ingérer les Codes depuis C:\LEGI

1. **Parser les codes** depuis `C:\LEGI\legi\global\code_et_TNC_en_vigueur`
2. **Générer JSONL** avec le nouveau format (champs directs)
3. **Upload vers GCS** : `gs://legal-rag-data-sofia-2025/`
4. **Importer dans Vertex AI** (datastore structuré existant)

**Durée estimée** : 2-4 heures pour ~35,000 articles

### Étape 2 : Tester avec les 5 Piliers

Une fois l'ingestion terminée, tester :
- ✅ Machine à Actes
- ✅ Super-Chercheur
- ✅ Audit et Conformité
- ✅ Synthèse et Stratégie
- ✅ Chatbot Avocat

### Étape 3 : Optimiser si nécessaire

- Ajuster les prompts
- Améliorer les filtres côté application
- Optimiser les recherches

---

## 📝 Notes Importantes

### Filtrage

**Actuel** : Filtrage côté application
```python
results = client.search(query, page_size=50)
filtered = [r for r in results if r['metadata']['code_id'] == '...']
```

**Avantages** :
- Fonctionne immédiatement
- Flexible
- Pas de réindexation

**Inconvénients** :
- Récupère plus de résultats (puis filtre)
- Légèrement moins performant

### Segmentation

**Pour codes** : Pas nécessaire (articles courts)

**Pour jurisprudence** : Utiliser datastore non structuré avec segmentation automatique

---

## ✅ Checklist Avant Ingestion Complète

- [x] Format d'ingestion modifié (champs directs)
- [x] Test avec 10 articles réussi
- [x] Recherche sémantique fonctionne
- [x] Filtrage côté application fonctionne
- [x] Embeddings actifs automatiquement
- [ ] Parser DILA adapté pour C:\LEGI
- [ ] Script d'ingestion depuis C:\LEGI
- [ ] Test avec quelques codes
- [ ] Ingestion complète

---

**Date** : 19 Décembre 2025  
**Statut** : Prêt pour ingestion Phase 1 (Codes)

