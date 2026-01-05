# 📝 Pilier 1 : Machine à Actes

## Vue d'ensemble

Le **Pilier 1** transforme un acte juridique modèle et des données client en un nouvel acte personnalisé, en mimant fidèlement le style et la structure de l'original.

### 🎯 Objectif

**Automatiser la rédaction d'actes** sans utiliser de variables fixes :
- Analyse intelligente du modèle
- Liaison automatique avec les données client
- Adaptation contextuelle (genre, accords, conversions)
- Mimétisme stylistique fidèle

### ✨ Caractéristiques

- **🤖 Intelligence artificielle** : Gemini Pro pour génération avancée
- **📄 Multi-formats** : Texte, PDF, DOCX en entrée et sortie
- **🎨 Mimétisme** : Conserve le style exact du modèle
- **🔗 Liaison intelligente** : Pas de variables type `[NOM]` à définir
- **✅ Validation** : Relecture avant export
- **🎨 Templates personnalisés** : Créez vos propres prompts

---

## 🚀 Installation

### Prérequis

```bash
# Dépendances déjà installées
pip install google-generativeai pymupdf python-docx
```

### Configuration

Ajoutez votre clé API Gemini dans `.env` :

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_PRO_MODEL=models/gemini-pro-latest
```

---

## 📖 Utilisation

### 1️⃣ Exemple basique : Contrat de vente

```python
from api.machine_actes import MachineActes
from api.models import ActGenerationRequest, ActType

# Modèle source
template = """
CONTRAT DE VENTE AUTOMOBILE

Entre :
Monsieur Jean DURAND, 5 rue de la République, 69001 Lyon
ci-après "le Vendeur"

Et :
Madame Marie LEBLANC, 12 avenue des Champs, 75008 Paris
ci-après "l'Acheteur"

Article 1 - OBJET
Le Vendeur cède un véhicule Renault Clio.

Article 2 - PRIX
Prix : 50 000 euros

Fait à Lyon, le 15 janvier 2020
"""

# Données du nouveau client
client_data = """
Vendeur : Pierre MARTIN, 10 rue de la Paix, 75001 Paris
Acheteur : Sophie DUPONT, 25 avenue Victor Hugo, 69003 Lyon
Véhicule : Mercedes Classe A
Prix : 75 000 euros
Lieu : Paris
Date : 18 décembre 2025
"""

# Génération
machine = MachineActes()
request = ActGenerationRequest(
    act_type=ActType.CONTRACT_SALE,
    template_content=template,
    client_data=client_data,
)

result = machine.generate(request)

print(result.generated_act)
print(f"Confiance : {result.confidence:.0%}")
```

### 2️⃣ Avec fichier PDF/DOCX

```python
request = ActGenerationRequest(
    act_type=ActType.LEASE_RESIDENTIAL,
    template_file="templates/bail_habitation.pdf",  # ← PDF
    client_data=client_data,
    output_format=OutputFormat.TEXT,
)

result = machine.generate(request)
```

### 3️⃣ Données en JSON structuré

```python
import json

client_json = {
    "vendeur": "Pierre MARTIN",
    "acheteur": "Sophie DUPONT",
    "prix": "75 000 euros",
    "date": "18 décembre 2025"
}

request = ActGenerationRequest(
    act_type=ActType.CONTRACT_SALE,
    template_content=template,
    client_data=json.dumps(client_json),
    client_data_format=DataInputFormat.JSON,
)
```

### 4️⃣ Template personnalisé

```python
custom_instructions = """
Tu dois :
1. Ajouter une clause de garantie supplémentaire
2. Utiliser un style très formel
3. Inclure une section "Conditions particulières"
"""

request = ActGenerationRequest(
    act_type=ActType.CUSTOM,
    template_content=template,
    client_data=client_data,
    custom_prompt=custom_instructions,
    custom_template_name="Mon template SaaS",
)
```

---

## 🧩 Types d'actes disponibles

### Contrats
- `CONTRACT_SALE` : Contrat de vente
- `CONTRACT_WORK` : Contrat de travail
- `CONTRACT_SERVICE` : Contrat de prestation

### Baux
- `LEASE_COMMERCIAL` : Bail commercial
- `LEASE_RESIDENTIAL` : Bail d'habitation

### Actes juridiques
- `NDA` : Accord de confidentialité
- `DONATION` : Donation
- `SUCCESSION` : Succession
- `MANDATE` : Mandat
- `POWER_OF_ATTORNEY` : Procuration

### Actes procéduraux
- `ASSIGNMENT` : Assignation
- `CONCLUSIONS` : Conclusions

### Divers
- `PARTNERSHIP` : Contrat de société
- `CUSTOM` : Type personnalisé

---

## 📊 Formats supportés

### Formats d'entrée (données client)

| Format | Description | Exemple |
|--------|-------------|---------|
| `TEXT` | Texte libre | `"Vendeur : Jean DUPONT"` |
| `JSON` | JSON structuré | `{"vendeur": "Jean DUPONT"}` |
| `FORM` | Formulaire web | Clés/valeurs |
| `CSV` | CSV | Header + ligne |

### Formats de sortie

| Format | Extension | Statut |
|--------|-----------|--------|
| `TEXT` | `.txt` | ✅ Disponible |
| `HTML` | `.html` | ✅ Disponible |
| `PDF` | `.pdf` | 🔜 À venir |
| `DOCX` | `.docx` | 🔜 À venir |

---

## 🧠 Comment ça marche ?

### Architecture

```
┌──────────────┐
│   MODÈLE     │ ──┐
│  (template)  │   │
└──────────────┘   │
                   ├──> GEMINI PRO ──> NOUVEL ACTE
┌──────────────┐   │   (Prompt)
│   DONNÉES    │   │
│   CLIENT     │ ──┘
└──────────────┘
```

### Étapes internes

1. **Extraction** : Lecture du modèle (texte/PDF/DOCX)
2. **Analyse** : Gemini identifie la structure et le style
3. **Liaison** : Correspondances automatiques modèle ↔ données
4. **Adaptation** : Genre, accords, conjugaisons, conversions
5. **Génération** : Nouvel acte mimant le style original
6. **Validation** : Score de confiance + warnings

### Prompt Engineering

Le système utilise **deux prompts** (dans `prompts/prompts.py`) :

#### `PROMPT_ACT_GENERATION` (standard)

Analyse le modèle, repère les éléments variables, fait les correspondances intelligentes.

#### `PROMPT_ACT_GENERATION_CUSTOM` (personnalisé)

Permet aux utilisateurs de définir leurs propres instructions.

---

## ⚙️ Modèles de données

### `ActGenerationRequest`

```python
class ActGenerationRequest(BaseModel):
    act_type: ActType                          # Type d'acte
    template_content: Optional[str]            # Contenu du modèle
    template_file: Optional[str]               # OU fichier modèle
    client_data: str                           # Données client
    client_data_format: DataInputFormat = TEXT # Format données
    output_format: OutputFormat = TEXT         # Format sortie
    preserve_formatting: bool = True           # Préserver mise en forme
    custom_prompt: Optional[str] = None        # Prompt personnalisé
    custom_template_name: Optional[str] = None # Nom template
```

### `ActGenerationResponse`

```python
class ActGenerationResponse(BaseModel):
    act_type: ActType                 # Type d'acte généré
    generated_act: str                # Acte généré (texte/base64)
    preview_text: str                 # Aperçu (500 chars)
    confidence: float                 # Score 0-1
    validation_required: bool = True  # Validation nécessaire
    output_format: OutputFormat       # Format du fichier
    warnings: list[str]               # Avertissements
    generated_at: datetime            # Date de génération
```

---

## 🎓 Démonstration

### Lancer les tests

```bash
# Définir PYTHONPATH
$env:PYTHONPATH = (Get-Location).Path

# Test basique
python api/machine_actes.py

# Démonstration complète (4 exemples)
python demos/demo_machine_actes.py
```

### Exemples inclus

1. **Contrat de vente automobile**
2. **Bail d'habitation**
3. **Accord de confidentialité (NDA)**
4. **Données client en JSON**

---

## ⚠️ Avertissements et validation

### Détection automatique

Le système détecte :
- ✅ Variables non substituées (`[...]`)
- ✅ Actes trop courts (< 100 caractères)
- ✅ Erreurs de génération Gemini

### Score de confiance

- **≥ 90%** : Génération optimale, pas de warnings
- **≥ 75%** : Génération correcte avec warnings
- **< 75%** : Vérification manuelle recommandée

### Validation obligatoire

**IMPORTANT** : Tous les actes nécessitent une validation humaine avant signature !

```python
if result.validation_required:
    print("⚠️ Relecture obligatoire par un juriste")
```

---

## 🔮 Roadmap

### Phase 1 (MVP) ✅

- [x] Génération texte basique
- [x] Support PDF/DOCX en entrée
- [x] Formats JSON/CSV
- [x] Templates personnalisés
- [x] Validation et warnings

### Phase 2 (Q1 2026)

- [ ] Export PDF avec mise en forme
- [ ] Export DOCX avec styles
- [ ] Bibliothèque de templates prédéfinis
- [ ] Interface de sauvegarde templates
- [ ] Historique des générations

### Phase 3 (Q2 2026)

- [ ] Suggestions de clauses (RAG)
- [ ] Vérification conformité réglementaire
- [ ] Détection d'incohérences juridiques
- [ ] Enrichissement automatique (jurisprudence)
- [ ] Multi-langues (UE)

---

## 🛠️ Dépannage

### Problème : "GEMINI_API_KEY manquante"

**Solution** :

```bash
# Ajoutez dans .env
GEMINI_API_KEY=votre_clé_api
```

### Problème : Génération très lente

**Cause** : Gemini Pro peut prendre 10-30s pour des actes longs.

**Solutions** :
- Utiliser Gemini Flash pour tests rapides
- Implémenter un système de cache

### Problème : Variables non substituées

Si le résultat contient `[NOM]`, `[DATE]`, etc. :

**Solutions** :
1. Vérifier que les données client contiennent toutes les infos
2. Reformuler les données plus clairement
3. Utiliser un prompt personnalisé plus explicite

### Problème : Style pas respecté

**Solutions** :
- Vérifier que `preserve_formatting=True`
- Fournir un modèle plus long et détaillé
- Ajouter des exemples dans le prompt personnalisé

---

## 📚 Ressources

- **Code source** : `api/machine_actes.py`
- **Modèles** : `api/models.py`
- **Prompts** : `prompts/prompts.py` et `prompts/PROMPTS.md`
- **Démos** : `demos/demo_machine_actes.py`

---

## 🤝 Contribution

Pour ajouter un **nouveau type d'acte** :

1. Ajouter dans `ActType` (Enum)
2. Tester avec un modèle représentatif
3. Documenter le cas d'usage

Pour créer un **template personnalisé** :

1. Utiliser `custom_prompt` dans la requête
2. Sauvegarder avec `custom_template_name`
3. Partager sur le wiki du projet

---

## 📄 Licence

© 2025 LEGAL-RAG FRANCE - Tous droits réservés.

---

**✅ Le Pilier 1 est maintenant prêt !**

Prochaine étape : Intégration FastAPI + Frontend 🚀

