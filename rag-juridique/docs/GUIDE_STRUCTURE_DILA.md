# 🔍 Guide : Explorer la Structure DILA OPENDATA

## Problème actuel

Les URLs DILA testées retournent 404. La structure peut avoir changé.

## Solution : Explorer manuellement d'abord

### Étape 1 : Explorer la page DILA

1. Aller sur : `https://echanges.dila.gouv.fr/OPENDATA/LEGI/`
2. Explorer la structure des dossiers
3. Identifier où se trouvent les codes

### Étape 2 : Télécharger manuellement (pour test)

1. Télécharger manuellement le Code Civil depuis DILA
2. Mettre dans `data/raw/dila/LEGITEXT000006070721/`
3. Le script utilisera les fichiers locaux

### Étape 3 : Adapter les URLs

Une fois la structure identifiée, ajuster les URLs dans `dila_opendata.py`

---

## Structure DILA typique (à vérifier)

```
OPENDATA/
├── LEGI/
│   ├── LEGI/
│   │   ├── LEGITEXT000006070721/  (Code Civil)
│   │   │   ├── LEGI/
│   │   │   │   └── [fichiers XML]
│   │   │   └── LEGI.zip  (archive complète)
│   │   └── ...
│   └── [autres structures possibles]
```

---

## Alternative : Utiliser les fichiers locaux

Si DILA ne fonctionne pas, vous pouvez :

1. **Télécharger manuellement** les archives depuis DILA
2. **Extraire** dans `data/raw/dila/{code_id}/`
3. **Le script les utilisera** automatiquement

Le script cherche déjà dans `data/raw/dila/` si le téléchargement échoue.

---

## Prochaine étape

**Option 1** : Explorer DILA manuellement et ajuster les URLs

**Option 2** : Télécharger manuellement et utiliser fichiers locaux

**Option 3** : Continuer avec génération enrichie pour l'instant (20 articles/code)

Quelle option préférez-vous ?

