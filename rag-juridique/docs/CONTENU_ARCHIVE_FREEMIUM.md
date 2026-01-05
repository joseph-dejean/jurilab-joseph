# 📦 Contenu de l'Archive Freemium LEGI

## ❓ Question : Que contient l'archive Freemium ?

### ✅ Ce qui est INCLUS dans LEGI (archive Freemium)

**LEGI = Codes, lois et règlements consolidés**

1. **✅ Tous les codes officiels** (73 codes en vigueur + 29 abrogés)
   - Code Civil
   - Code Pénal
   - Code du Travail
   - Code de Commerce
   - Code de Procédure Civile
   - Code de Procédure Pénale
   - Code de la Sécurité Sociale
   - Et tous les autres codes officiels

2. **✅ Toutes les lois** (depuis 1945)
   - Lois
   - Décrets-lois
   - Ordonnances
   - Décrets

3. **✅ Sélection d'arrêtés** (consolidés)

4. **✅ Versions historiques**
   - Articles modifiés
   - Articles abrogés
   - Avec dates de début/fin

### ❌ Ce qui N'EST PAS inclus dans LEGI

**LEGI ne contient PAS la jurisprudence ni les décisions de justice**

Pour la jurisprudence, il faut d'autres bases :

1. **INCA** : Arrêts inédits de la Cour de cassation (depuis 1989)
   - Dataset séparé sur data.gouv.fr
   - Nécessite téléchargement séparé

2. **JADE** : Jurisprudence administrative (Conseil d'État)
   - Dataset séparé
   - Nécessite téléchargement séparé

3. **CASS** : Jurisprudence Cour de cassation (autres arrêts)
   - Dataset séparé

4. **CAPP** : Jurisprudence des cours d'appel
   - Dataset séparé

---

## 📊 Résumé

### Archive Freemium LEGI contient :

✅ **TOUS les codes** (73 codes officiels)
✅ **TOUTES les lois** (depuis 1945)
✅ **TOUS les décrets**
✅ **Versions historiques** (modifications, abrogations)

❌ **PAS de jurisprudence**
❌ **PAS de décisions de justice**

---

## 🎯 Pour avoir TOUTES les données

### Étape 1 : Archive Freemium LEGI (Codes et Lois)
- ✅ Télécharger `Freemium_legi_global_YYYYMMDD.tar.gz`
- ✅ Contient tous les codes et lois
- ✅ ~35,000 articles de codes
- ✅ Toutes les lois depuis 1945

### Étape 2 : Jurisprudence (séparé)
- 📥 INCA : Arrêts Cour de cassation
- 📥 JADE : Jurisprudence administrative
- 📥 CASS : Autres arrêts Cour de cassation
- 📥 CAPP : Cours d'appel

**Ces bases sont sur data.gouv.fr mais dans des datasets séparés**

---

## 💡 Recommandation

### Phase 1 : Codes et Lois (Archive Freemium)
1. Télécharger l'archive Freemium LEGI
2. Extraire et parser
3. Ingérer tous les codes (~35,000 articles)
4. Tester les 5 piliers avec ces données

### Phase 2 : Jurisprudence (Plus tard)
1. Identifier les datasets jurisprudence sur data.gouv.fr
2. Télécharger INCA, JADE, etc.
3. Parser et ingérer
4. Ajouter au même datastore avec métadonnées `type: "jurisprudence"`

---

## 🔍 Vérification

Pour vérifier le contenu exact de l'archive Freemium :
1. Télécharger l'archive
2. Extraire (tar.gz)
3. Explorer la structure
4. Compter les fichiers XML par type

**Structure typique attendue** :
```
Freemium_legi_global/
├── LEGI/
│   ├── LEGITEXT000006070721/  (Code Civil)
│   ├── LEGITEXT000006070716/  (Code Pénal)
│   └── ...
├── LOI/
│   └── [fichiers lois]
└── DECRET/
    └── [fichiers décrets]
```

---

**Conclusion** : L'archive Freemium contient **TOUS les codes et lois**, mais **PAS la jurisprudence**. Pour la jurisprudence, il faut télécharger les bases séparées (INCA, JADE, etc.).

