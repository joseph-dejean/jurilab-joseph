# ⚠️ Erreurs de Liens Symboliques lors de l'Extraction

## Problème

Lors de l'extraction de l'archive Freemium, des erreurs apparaissent :
```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
```

## Explication

- **Liens symboliques** : Ce sont des "raccourcis" vers d'autres fichiers/dossiers
- **Windows** : Nécessite des privilèges administrateur pour créer des liens symboliques
- **Impact** : Les fichiers RÉELS sont extraits, seuls les liens symboliques échouent

## Solution

### Option 1 : Ignorer (Recommandé)

Les liens symboliques ne sont **PAS nécessaires** pour notre usage :
- On parse les fichiers XML directement
- On n'a pas besoin des liens symboliques
- Les fichiers réels sont tous extraits

### Option 2 : Activer les privilèges (si vraiment nécessaire)

Si vous voulez créer les liens symboliques :

1. **Ouvrir PowerShell en tant qu'administrateur**
2. **Activer le mode développeur Windows** :
   ```powershell
   # Dans PowerShell Admin
   gpedit.msc
   # Ou activer via Settings > Update & Security > For developers
   ```

3. **Ou utiliser mklink manuellement** (si vraiment nécessaire)

## Vérification

Pour vérifier que l'extraction est complète :

```powershell
# Vérifier la structure
Get-ChildItem "C:\LEGI\legi\global" -Directory | Select-Object Name

# Compter les fichiers XML
(Get-ChildItem "C:\LEGI" -Recurse -Filter "*.xml").Count
```

Si vous voyez les dossiers `code_et_TNC_vigueur` et des milliers de fichiers XML, **l'extraction est réussie** ✅

## Conclusion

**Ces erreurs peuvent être ignorées** - elles n'empêchent pas l'utilisation des données.

