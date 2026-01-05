# 🎨 Système de Templates PDF - Guide complet

## Vue d'ensemble

Le système de **templates PDF** permet de **reproduire automatiquement** le style visuel de vos documents existants (logo, en-tête, pied de page, polices, couleurs).

### 🎯 Principe

```
┌───────────────────────────────────────────────────────────────┐
│  Votre PDF existant → Gemini analyse le style → JSON config  │
│                                                                │
│  Ensuite : Nouveau contenu → Génération PDF avec même style  │
└───────────────────────────────────────────────────────────────┘
```

**Avantage** : Zéro configuration manuelle ! Le LLM détecte tout automatiquement.

---

## 📋 Étapes d'utilisation

### 1️⃣ Déposer vos PDFs modèles

Placez vos PDFs de référence dans le dossier :

```
data/test_pdfs/
├── contrat_20pages.pdf        # ← Votre contrat modèle
├── conclusion_5pages.pdf      # ← Vos conclusions modèles
└── README.md
```

**Critères** :
- PDFs avec votre **logo**
- PDFs avec votre **en-tête** (nom du cabinet, coordonnées)
- PDFs avec votre **pied de page**
- PDFs représentatifs de votre **charte graphique**

---

### 2️⃣ Analyser les PDFs

Lancez le script d'analyse :

```bash
# Définir PYTHONPATH
$env:PYTHONPATH = (Get-Location).Path

# Lancer l'analyse
python demos/demo_pdf_analyzer.py
```

**Ce qui se passe** :
1. ✅ Extraction des métadonnées (polices, couleurs, marges)
2. ✅ Analyse du contenu (en-tête, pied de page, structure)
3. ✅ Détection des images/logos
4. ✅ **Gemini analyse le style** et génère un JSON
5. ✅ Sauvegarde du template

---

### 3️⃣ Résultat

Après analyse, vous obtenez :

#### **Fichiers JSON générés** :

```
data/test_pdfs/
├── contrat_20pages.pdf
├── contrat_20pages_template.json     # ← Template JSON
├── conclusion_5pages.pdf
└── conclusion_5pages_template.json   # ← Template JSON
```

#### **Templates enregistrés** :

```
templates/pdf_templates/
├── default/
│   └── template.json
└── custom/
    ├── contrat_20pages/
    │   ├── template.json
    │   ├── logo.png (si détecté)
    │   └── metadata.json
    └── conclusion_5pages/
        ├── template.json
        └── metadata.json
```

---

## 🔍 Structure du JSON de template

Voici un exemple de template JSON généré automatiquement :

```json
{
  "template_name": "Cabinet Dupont & Associés",
  "document_type": "contrat",
  "header": {
    "has_logo": true,
    "logo_position": "left",
    "text": "CABINET DUPONT & ASSOCIÉS - AVOCATS",
    "font": "Helvetica-Bold",
    "font_size": 14,
    "color": "#003366",
    "alignment": "center"
  },
  "footer": {
    "text": "10 rue de la République, 75001 Paris | Tél: 01 23 45 67 89 | contact@dupont-avocats.fr",
    "font_size": 9,
    "color": "#666666",
    "has_page_numbers": true,
    "alignment": "center"
  },
  "page": {
    "format": "A4",
    "orientation": "portrait",
    "margin_top": 80,
    "margin_bottom": 60,
    "margin_left": 50,
    "margin_right": 50
  },
  "styles": {
    "title_font": "Helvetica-Bold",
    "title_size": 18,
    "title_color": "#003366",
    "body_font": "Helvetica",
    "body_size": 11,
    "body_color": "#000000",
    "line_spacing": 1.5
  }
}
```

---

## 🛠️ Utilisation dans les Piliers

### Pilier 1 : Machine à Actes

Génération d'actes avec votre template :

```python
from api.machine_actes import MachineActes
from api.models import ActGenerationRequest, ActType, OutputFormat

request = ActGenerationRequest(
    act_type=ActType.CONTRACT_SALE,
    template_content=template_content,
    client_data=client_data,
    output_format=OutputFormat.PDF,          # ← PDF !
    pdf_template="contrat_20pages",          # ← Votre template
)

machine = MachineActes()
result = machine.generate(request)

# result.generated_act → PDF avec votre style
```

### Pilier 4 : Synthèse et Stratégie

Génération de notes stratégiques avec votre template :

```python
from api.synthese_strategie import SynthesisAideStrategie
from api.models import SynthesisRequest, SynthesisType, OutputFormat

request = SynthesisRequest(
    synthesis_type=SynthesisType.STRATEGIC_NOTE,
    documents=documents,
    output_format=OutputFormat.PDF,          # ← PDF !
    pdf_template="conclusion_5pages",        # ← Votre template
)

synthese = SynthesisAideStrategie()
result = synthese.generate_synthesis(request)

# result.output_content → PDF avec votre style
```

---

## 🎨 Modification manuelle des templates

Si vous souhaitez **ajuster** un template :

### 1. Ouvrir le JSON

```bash
# Template dans le gestionnaire
templates/pdf_templates/custom/contrat_20pages/template.json

# OU Template brut
data/test_pdfs/contrat_20pages_template.json
```

### 2. Modifier les valeurs

```json
{
  "header": {
    "font_size": 14,          // ← Modifier la taille
    "color": "#003366",       // ← Modifier la couleur
    "text": "MON CABINET"     // ← Modifier le texte
  }
}
```

### 3. Sauvegarder

Le template modifié sera automatiquement utilisé lors de la prochaine génération.

---

## 📊 Gestion des templates

### Lister les templates disponibles

```python
from utils.pdf_template_manager import PDFTemplateManager

manager = PDFTemplateManager()
templates = manager.list_templates()

for template in templates:
    print(f"{template['name']} - {template.get('created_at', 'N/A')}")
```

### Charger un template

```python
# Template par défaut
config = manager.load_template()

# Template personnalisé
config = manager.load_template("contrat_20pages")
```

### Supprimer un template

```python
manager.delete_template("old_template")
```

---

## 🧪 Tests

### Test 1 : Analyse automatique

```bash
python demos/demo_pdf_analyzer.py
```

**Vérifications** :
- ✅ PDFs détectés
- ✅ JSON générés
- ✅ Templates enregistrés

### Test 2 : Module d'analyse direct

```bash
python utils/pdf_style_analyzer.py
```

**Résultat** : Analyse technique + JSON brut

### Test 3 : Gestionnaire de templates

```bash
python utils/pdf_template_manager.py
```

**Résultat** : Liste des templates disponibles

---

## 🎯 Piliers concernés

| Pilier | Input PDF | Output PDF | Template |
|--------|-----------|------------|----------|
| **Pilier 1** : Machine à Actes | ✅ Acte modèle | ✅ Nouvel acte | ✅ |
| **Pilier 3** : Audit | ✅ Contrat | ❌ | ❌ |
| **Pilier 4** : Synthèse | ✅ Dossiers | ✅ Notes | ✅ |
| **Pilier 5** : Chatbot | ❌ | 🔜 Optionnel | 🔜 |

---

## 🔮 Fonctionnalités avancées (à venir)

### Phase 2

- [ ] Export PDF avec **logo intégré**
- [ ] Export PDF avec **en-tête/pied de page dynamiques**
- [ ] Génération **DOCX** avec styles
- [ ] Numérotation automatique des pages

### Phase 3

- [ ] Templates **multi-pages** (première page différente)
- [ ] **Filigrane** personnalisé
- [ ] **Signature électronique** intégrée
- [ ] Templates **responsive** (A4/Letter auto)

---

## ⚙️ Architecture technique

### Modules créés

```
utils/
├── __init__.py
├── pdf_style_analyzer.py       # Analyse automatique avec Gemini
├── pdf_template_manager.py     # Gestion des templates
└── pdf_generator.py            # Génération PDF (à venir)

templates/
└── pdf_templates/
    ├── default/
    │   └── template.json
    └── custom/
        ├── template_1/
        └── template_2/

data/
└── test_pdfs/
    ├── votre_pdf.pdf
    └── votre_pdf_template.json
```

### Dépendances

```bash
pip install pymupdf reportlab pillow
```

---

## 🎓 Workflow complet

```
1. Déposer PDF modèle
   ↓
2. Lancer analyse (Gemini)
   ↓
3. Vérifier JSON généré
   ↓
4. (Optionnel) Ajuster manuellement
   ↓
5. Utiliser template dans Pilier 1 ou 4
   ↓
6. Générer PDF avec style identique
```

---

## ❓ FAQ

### Q : Combien de templates puis-je créer ?
**R** : Illimité ! Créez un template par type de document (contrats, conclusions, assignations, etc.)

### Q : Puis-je avoir plusieurs logos ?
**R** : Actuellement, un logo par template. Multi-logos en Phase 2.

### Q : Le style est-il parfaitement reproduit ?
**R** : Gemini analyse très bien, mais des ajustements manuels peuvent être nécessaires pour une correspondance pixel-perfect.

### Q : Que se passe-t-il si je n'ai pas de PDF modèle ?
**R** : Le système utilise un template par défaut simple et professionnel.

### Q : Puis-je partager mes templates ?
**R** : Oui ! Le JSON est portable. Vous pouvez le partager avec d'autres cabinets.

---

## 📞 Support

- **Documentation complète** : Ce fichier
- **Scripts de test** : `demos/demo_pdf_analyzer.py`
- **Modules** : `utils/pdf_*.py`

---

**✅ Votre identité visuelle, automatiquement reproduite !** 🎨

