# 🎯 Documentation des Prompts - LEGAL-RAG FRANCE

**Fichier source** : `prompts/prompts.py`

Ce document explique tous les prompts système utilisés dans la plateforme.

---

## 📋 Table des matières

- [Pilier 1 : Machine à Actes](#pilier-1--machine-à-actes)
- [Pilier 2 : Super-Chercheur](#pilier-2--super-chercheur)
- [Pilier 3 : Audit et Conformité](#pilier-3--audit-et-conformité)
- [Pilier 4 : Synthèse et Stratégie](#pilier-4--synthèse-et-stratégie)
- [Pilier 5 : Chatbot Avocat](#pilier-5--chatbot-avocat)
- [Modifier un prompt](#modifier-un-prompt)

---

## Pilier 1 : Machine à Actes

### `PROMPT_ACT_GENERATION`

**Usage** : Génération d'actes juridiques par mimétisme de style (mode standard)

**Variables** :
- `{act_type}` : Type d'acte (contract_sale, lease_residential, nda, etc.)
- `{template}` : Contenu de l'acte modèle source
- `{client_data}` : Données du nouveau client

**Description** :  
Ce prompt transforme un acte modèle existant en nouvel acte personnalisé en mimant fidèlement le style de rédaction. Il effectue une liaison intelligente entre le modèle et les données client sans nécessiter de variables explicites.

**Étapes** :
1. **Analyse** : Structure, éléments variables, style rédactionnel
2. **Liaison intelligente** : Correspondances automatiques (noms, dates, montants, adresses)
3. **Adaptation contextuelle** : Genre, accords, conjugaisons, conversions
4. **Mimétisme stylistique** : Conservation de la structure et du formalisme
5. **Finalisation** : Texte complet sans variables non substituées

**Règles absolues** :
- Ne jamais inventer d'informations absentes
- Ne jamais ajouter de clauses non présentes dans le modèle
- Ne jamais laisser de variables type [NOM]
- Toujours respecter le droit français
- Toujours maintenir la cohérence juridique

---

### `PROMPT_ACT_GENERATION_CUSTOM`

**Usage** : Génération d'actes avec instructions personnalisées de l'utilisateur

**Variables** :
- `{custom_instructions}` : Instructions personnalisées créées par l'utilisateur
- `{template}` : Contenu de l'acte modèle source
- `{client_data}` : Données du nouveau client

**Description** :  
Ce prompt permet aux utilisateurs avancés de créer leurs propres templates avec des instructions personnalisées. Il donne plus de flexibilité tout en maintenant les règles de base du droit français.

**Cas d'usage** :
- Templates métiers spécifiques (SaaS, freelance IT, etc.)
- Clauses particulières récurrentes
- Styles de rédaction personnalisés
- Workflows spécifiques au cabinet

**Règles de base** :
- Respecter le droit français
- Texte final complet (pas de variables)
- Adaptation intelligente selon le contexte
- Cohérence juridique

---

## Pilier 2 : Super-Chercheur

### `PROMPT_SEARCH_SUMMARY`

**Usage** : (Réservé pour futures améliorations)

**Variables** : Aucune

---

## Pilier 3 : Audit et Conformité

### `PROMPT_AUDIT_RECOMMENDATIONS`

**Usage** : Génération de recommandations après audit d'un document

**Variables** :
- `{document_title}` : Titre du document audité
- `{document_date}` : Date du document
- `{total_refs}` : Nombre total de références
- `{valid_refs}` : Nombre de références valides
- `{nb_issues}` : Nombre de problèmes détectés
- `{issues_summary}` : Liste des problèmes (formatée)

**Exemple** :
```python
from prompts import PROMPT_AUDIT_RECOMMENDATIONS

prompt = PROMPT_AUDIT_RECOMMENDATIONS.format(
    document_title="Contrat de vente 2010",
    document_date="15/01/2010",
    total_refs=10,
    valid_refs=8,
    nb_issues=2,
    issues_summary="- Article 1134 : ABROGÉ\n- Article 1147 : MODIFIÉ"
)
```

**Output attendu** :
```
🔴 Mettre à jour l'article 1134 (remplacé par l'article 1103)
⚠️ Vérifier la version de l'article 1147 (modifié en 2016)
✅ Consulter un avocat pour validation finale
```

---

## Pilier 4 : Synthèse et Stratégie

### `PROMPT_STRATEGIC_NOTE`

**Usage** : Génération d'une note stratégique pour avocat

**Variables** :
- `{documents}` : Contenu des documents à analyser

**Cas d'usage** :
- Avocat qui prépare un dossier
- Besoin de synthèse complète
- Analyse forces/faiblesses

**Sections générées** :
1. Résumé exécutif
2. Faits principaux
3. Enjeux juridiques
4. Forces/Faiblesses
5. Stratégie recommandée
6. Pronostic

---

### `PROMPT_TREND_ANALYSIS`

**Usage** : Analyse de tendances jurisprudentielles

**Variables** :
- `{jurisprudence}` : Décisions de justice récupérées
- `{query}` : Requête de recherche
- `{date_range}` : Période analysée
- `{jurisdiction}` : Juridiction

**Cas d'usage** :
- Analyser l'évolution d'une jurisprudence
- Estimer les chances de succès
- Identifier les facteurs clés

**Sections générées** :
1. Vue d'ensemble
2. Tendances principales
3. Statistiques (taux de succès, durées, montants)
4. Facteurs déterminants
5. Évolution récente
6. Pronostic

---

### `PROMPT_CLIENT_REPORT`

**Usage** : Rapport destiné au client (non-juriste)

**Variables** :
- `{internal_summary}` : Synthèse juridique interne

**Cas d'usage** :
- Communiquer avec le client
- Vulgariser l'analyse juridique
- Rassurer et informer

**Sections générées** :
1. Objet
2. Situation
3. Analyse (vulgarisée)
4. Forces du dossier
5. Points d'attention
6. Prochaines étapes
7. Estimation

**Style** : Pédagogique, accessible, rassurant

---

### `PROMPT_CASE_SUMMARY`

**Usage** : Résumé ultra-concis d'un dossier

**Variables** :
- `{documents}` : Documents à résumer

**Cas d'usage** :
- Brief rapide avant audience
- Prise de connaissance d'un nouveau dossier
- Transmission à un confrère

**Sections générées** :
1. En bref (2-3 lignes)
2. Qui ? (parties)
3. Quoi ? (objet)
4. Quand ? (dates)
5. Où ? (juridiction)
6. Pourquoi ? (fondement)
7. Prochain rendez-vous

**Style** : Ultra-concis, bullet points, 1 page max

---

### `PROMPT_PROCEDURAL_TIMELINE`

**Usage** : Chronologie procédurale

**Variables** :
- `{documents}` : Documents procéduraux

**Cas d'usage** :
- Visualiser l'historique
- Identifier les échéances
- Préparer les prochaines étapes

**Format** :
```
[DATE] - [ÉVÉNEMENT] - [PARTIE] - [IMPACT]
```

---

## Pilier 5 : Chatbot Avocat

### `PROMPT_CHATBOT_SYSTEM`

**Usage** : Prompt système du chatbot juridique

**Variables** : Aucune (prompt de base)

**Rôle** : Définir le comportement du chatbot

**Règles** :
1. Sources obligatoires
2. Citations précises
3. Structure claire
4. Pas de conseil personnalisé

---

### `PROMPT_CHATBOT_WITH_SOURCES`

**Usage** : Prompt complet avec historique et sources

**Variables** :
- `{system_prompt}` : Prompt système
- `{history_text}` : Historique de conversation
- `{context_text}` : Sources RAG
- `{question}` : Question actuelle

**Exemple** :
```python
from prompts import PROMPT_CHATBOT_SYSTEM, PROMPT_CHATBOT_WITH_SOURCES

prompt = PROMPT_CHATBOT_WITH_SOURCES.format(
    system_prompt=PROMPT_CHATBOT_SYSTEM,
    history_text="...",
    context_text="[Article 1101]...",
    question="Qu'est-ce qu'un contrat ?"
)
```

---

## Modifier un prompt

### 1. Ouvrir le fichier source

```bash
# Ouvrir l'éditeur
code prompts/prompts.py

# Ou
notepad prompts/prompts.py
```

### 2. Trouver le prompt

```python
# Exemple : Modifier PROMPT_STRATEGIC_NOTE
PROMPT_STRATEGIC_NOTE = """
...
"""
```

### 3. Modifier le texte

**Avant** :
```python
STRUCTURE OBLIGATOIRE :
1. RÉSUMÉ EXÉCUTIF (3-4 lignes)
```

**Après** :
```python
STRUCTURE OBLIGATOIRE :
1. RÉSUMÉ EXÉCUTIF (2-3 phrases)
```

### 4. Sauvegarder

```bash
# Aucune recompilation nécessaire
# Les changements sont immédiats !
```

### 5. Tester

```bash
# Relancer le script de test
python demos/demo_synthese.py
```

---

## Bonnes pratiques

### ✅ À faire

- **Être spécifique** : "Fournis 3 exemples" plutôt que "Fournis des exemples"
- **Structurer** : Sections numérotées, bullet points
- **Donner des exemples** : Montrer le format attendu
- **Définir le rôle** : "Tu es un avocat senior..."
- **Spécifier le style** : "Concis", "Pédagogique", "Formel"

### ❌ À éviter

- Prompts trop vagues : "Analyse ce document"
- Trop long : > 1000 tokens
- Instructions contradictoires
- Jargon inutile
- Demandes irréalistes

---

## Versioning

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | 18/12/2025 | Création initiale |
| 1.1 | TBD | Améliorations après feedback |

---

## FAQ

### Q : Puis-je ajouter des émojis dans les prompts ?

**R** : Oui, mais avec modération. Utile pour les listes (✅ ❌ 🔴) mais éviter dans le texte principal.

### Q : Comment tester rapidement un changement ?

**R** : 
```python
from prompts import PROMPT_STRATEGIC_NOTE
print(PROMPT_STRATEGIC_NOTE)
```

### Q : Les prompts sont-ils multilingues ?

**R** : Actuellement français uniquement. Pour internationalisation, voir `docs/TODO_PLUS_TARD.md`.

### Q : Peut-on A/B tester des prompts ?

**R** : Oui ! Créer des variantes :
```python
PROMPT_STRATEGIC_NOTE_V1 = "..."
PROMPT_STRATEGIC_NOTE_V2 = "..."
```

---

**Dernière mise à jour** : 18 Décembre 2025  
**Maintenu par** : Équipe LEGAL-RAG

