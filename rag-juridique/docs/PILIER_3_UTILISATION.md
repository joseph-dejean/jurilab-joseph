# 🔍 Pilier 3 - Guide d'utilisation

## ✅ Fonctionnalités implémentées

### 📝 Formats supportés

1. **Texte direct** ✅
2. **PDF** ✅ (PyMuPDF - haute précision)
3. **DOCX** ✅ (python-docx)

### 🔎 Patterns détectés (droit français)

| Format | Exemple | Statut |
|--------|---------|--------|
| Standard | `article 1101 du Code civil` | ✅ |
| Abréviation | `art. 1101 du Code civil` | ✅ |
| Ordinal | `article premier` | ✅ |
| Ordinal 1er | `article 1er` | ✅ |
| Avec alinéa | `article 1101, alinéa 2` | ✅ |
| Alinéa abrégé | `article 1101, al. 2` | ✅ |
| Plage | `articles 1101 à 1105` | ✅ |
| Notation légistique | `L. 110-1` | ✅ |
| Simple | `l'article 414` | ✅ |

---

## 🚀 Utilisation

### Option 1 : Texte direct

```python
from api.audit_conformite import AuditConformite
from api.models import AuditRequest
from datetime import datetime

# Votre document
mon_contrat = """
CONTRAT DE VENTE

Conformément à l'art. 1101 du Code civil...
"""

# Audit
request = AuditRequest(
    document_title="Mon Contrat",
    document_content=mon_contrat,  # ← TEXTE
    document_date=datetime(2020, 1, 1)
)

auditor = AuditConformite()
resultat = auditor.audit(request)

print(f"Score : {resultat.conformity_score}%")
print(f"Problèmes : {len(resultat.issues)}")
```

### Option 2 : Fichier PDF

```python
# Audit d'un PDF
request = AuditRequest(
    document_title="Contrat signé",
    document_file_path="contrat.pdf",  # ← FICHIER
    document_date=datetime(2020, 1, 1)
)

auditor = AuditConformite()
resultat = auditor.audit(request)
```

### Option 3 : Fichier DOCX

```python
# Audit d'un DOCX
request = AuditRequest(
    document_title="Projet de contrat",
    document_file_path="contrat.docx",  # ← FICHIER
)

auditor = AuditConformite()
resultat = auditor.audit(request)
```

---

## 📊 Interpréter les résultats

### Rapport d'audit

```python
resultat = auditor.audit(request)

# Score global
print(resultat.conformity_score)  # 0-100%

# Statistiques
print(resultat.total_references)  # Nombre de références trouvées
print(resultat.valid_references)  # Nombre valides

# Problèmes détectés
for issue in resultat.issues:
    print(f"[{issue.severity.value}] {issue.description}")
    print(f"Référence : {issue.article_reference}")
    print(f"Recommandation : {issue.recommendation}")

# Recommandations Gemini
for rec in resultat.recommendations:
    print(rec)
```

### Gravité des problèmes

| Niveau | Description |
|--------|-------------|
| `CRITICAL` | Article **ABROGÉ** → Mise à jour urgente |
| `HIGH` | Article **MODIFIÉ** après signature → Vérifier version |
| `MEDIUM` | Article **MODIFIÉ** (pas d'anachronisme) → À contrôler |
| `LOW` | Référence **INTROUVABLE** → Vérifier orthographe |

---

## 🧪 Démonstrations

### Test rapide

```bash
# Texte + patterns améliorés
python demos/demo_audit.py

# PDF + tous les formats
python demos/demo_audit_pdf.py

# Limites du système
python demos/demo_audit_limites.py
```

---

## ⚙️ Installation (si pas déjà fait)

```bash
# Activer venv
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Linux/Mac

# Installer dépendances
pip install pymupdf python-docx
```

---

## 🔧 Extraction PDF : Pourquoi PyMuPDF ?

**PyMuPDF (fitz)** = Meilleure extraction pour documents juridiques

| Bibliothèque | Précision | Vitesse | Mise en forme |
|--------------|-----------|---------|---------------|
| **PyMuPDF** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| PyPDF2 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| pdfplumber | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| pdfminer | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**Avantages PyMuPDF** :
- ✅ Extraction ultra-précise (chaque mot compte en droit)
- ✅ Rapide (C++ backend)
- ✅ Gère les PDF complexes (multi-colonnes, tables)
- ✅ Open source et maintenu

---

## 🌍 Internationalisation

**MVP actuel** : France uniquement 🇫🇷

**Future** : Support multi-pays (voir `docs/TODO_PLUS_TARD.md`)

---

## 📝 Exemples de cas d'usage

### Cas 1 : Avocat avec vieux contrat

```python
# J'ai un contrat signé en 2010
request = AuditRequest(
    document_title="Contrat de vente 2010",
    document_file_path="vieux_contrat.pdf",
    document_date=datetime(2010, 1, 15)
)

result = auditor.audit(request)

# Si article 1134 cité → ALERTE (abrogé en 2016)
```

### Cas 2 : Juriste qui prépare un nouveau contrat

```python
# Je viens de rédiger un contrat
mon_nouveau_contrat = """
CONTRAT DE PRESTATION
Article 1 - Conformément à l'art. 1101...
"""

request = AuditRequest(
    document_title="Nouveau contrat 2024",
    document_content=mon_nouveau_contrat
)

result = auditor.audit(request)
# → Score 100% si tout est conforme
```

### Cas 3 : Étudiant qui analyse un jugement

```python
# Analyse d'un jugement ancien
request = AuditRequest(
    document_title="Cass. Civ. 1ère, 2005",
    document_file_path="jugement_2005.pdf",
    document_date=datetime(2005, 3, 10)
)

result = auditor.audit(request)
# → Montre quels articles ont changé depuis 2005
```

---

## 🎯 Résumé : Qui fait quoi ?

| Qui ? | Quoi ? |
|-------|--------|
| **👤 UTILISATEUR** | Fournit un document (texte/PDF/DOCX) |
| **🤖 SYSTÈME** | Extrait les références automatiquement |
| **🤖 SYSTÈME** | Vérifie via Vertex AI Search |
| **🤖 SYSTÈME** | Génère le rapport |
| **👤 UTILISATEUR** | Lit le rapport et corrige |

**C'est comme un "correcteur orthographique" pour les références juridiques !** ✅

---

## 📚 Fichiers clés

- `api/audit_conformite.py` → Code principal
- `api/models.py` → Modèles de données
- `demos/demo_audit*.py` → Démonstrations
- `docs/PILIER_3_AMELIORATIONS.md` → Améliorations futures
- `docs/TODO_PLUS_TARD.md` → Internationalisation

---

**Dernière mise à jour** : 18 Décembre 2025  
**Statut** : ✅ Opérationnel (MVP France)

