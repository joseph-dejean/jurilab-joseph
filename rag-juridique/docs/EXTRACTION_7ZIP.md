# 📦 Extraction Archive Freemium avec 7-Zip

## ⚠️ Problème : Chemins trop longs sur Windows

Windows a une limite de 260 caractères pour les chemins. L'archive Freemium contient des fichiers avec des chemins très longs qui dépassent cette limite.

## ✅ Solution : Utiliser 7-Zip

### Étape 1 : Installer 7-Zip

Si vous n'avez pas 7-Zip :
1. Télécharger : https://www.7-zip.org/
2. Installer

### Étape 2 : Extraire l'archive

**Option A : Interface graphique**
1. Clic droit sur `Freemium_legi_global_20250713-140000.tar.gz`
2. 7-Zip → Extraire vers...
3. Destination : `C:\LEGI` (chemin court recommandé)

**Option B : Ligne de commande**
```powershell
# Si 7-Zip est installé
& "C:\Program Files\7-Zip\7z.exe" x "data\raw\datagouv\Freemium_legi_global_20250713-140000.tar.gz" -o"C:\LEGI"
```

### Étape 3 : Vérifier l'extraction

```powershell
Get-ChildItem C:\LEGI -Recurse -Directory | Select-Object -First 10
```

Vous devriez voir une structure comme :
```
C:\LEGI\
├── legi\
│   ├── global\
│   │   ├── code_et_TNC_non_vigueur\
│   │   └── code_et_TNC_vigueur\
│   └── ...
```

### Étape 4 : Adapter le script

Une fois extrait, le script peut utiliser les fichiers :

```powershell
$env:PYTHONPATH = (Get-Location).Path; .\venv\Scripts\python.exe -c "from ingestion.download_and_ingest_freemium import ingest_from_extracted; from pathlib import Path; ingest_from_extracted(Path('C:/LEGI'))"
```

---

## 🔄 Alternative : Extraire seulement les codes nécessaires

Si vous voulez extraire seulement les codes principaux :

1. Ouvrir l'archive avec 7-Zip
2. Naviguer vers `legi/global/code_et_TNC_vigueur/LEGI/`
3. Extraire seulement les dossiers :
   - `LEGITEXT000006070721` (Code Civil)
   - `LEGITEXT000006070716` (Code Pénal)
   - `LEGITEXT000006072050` (Code du Travail)
   - etc.

---

**Une fois extrait, dites-moi et on pourra continuer avec l'ingestion !**

