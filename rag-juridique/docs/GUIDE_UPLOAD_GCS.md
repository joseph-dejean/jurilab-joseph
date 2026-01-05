# 📤 Guide : Upload vers Cloud Storage

## Option 1 : Google Cloud SDK Shell (Recommandé)

### Étape 1 : Ouvrir Google Cloud SDK Shell

1. Chercher "Google Cloud SDK Shell" dans le menu Démarrer
2. Ou installer Google Cloud SDK si pas encore installé :
   - Télécharger : https://cloud.google.com/sdk/docs/install
   - Installer avec les options par défaut

### Étape 2 : Authentifier

```bash
gcloud auth login
gcloud auth application-default login
```

### Étape 3 : Configurer le projet

```bash
gcloud config set project jurilab-481600
```

### Étape 4 : Upload le fichier

```bash
# Depuis le dossier du projet
cd "C:\Users\sofia\Desktop\perso\rag juridique"

# Upload
gsutil cp data\exports\LEGITEXT000006070721_civil_20251219_111824.jsonl gs://legal-rag-data-sofia-2025/
```

### Étape 5 : Vérifier

```bash
gsutil ls gs://legal-rag-data-sofia-2025/LEGITEXT000006070721_civil_*.jsonl
```

---

## Option 2 : Interface Web GCP Console (Plus simple)

### Étape 1 : Aller sur Cloud Storage

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionner le projet : `jurilab-481600`
3. Menu : **Cloud Storage** → **Buckets**

### Étape 2 : Ouvrir le bucket

1. Cliquer sur le bucket : `legal-rag-data-sofia-2025`
2. Cliquer sur **Upload files**

### Étape 3 : Upload

1. Glisser-déposer le fichier : `data\exports\LEGITEXT000006070721_civil_20251219_111824.jsonl`
2. Ou cliquer **Browse** et sélectionner le fichier
3. Attendre la fin de l'upload

### Étape 4 : Vérifier

Le fichier doit apparaître dans la liste des fichiers du bucket.

---

## Option 3 : Installer gsutil dans PowerShell

Si vous préférez utiliser PowerShell directement :

### Installation

1. Télécharger Google Cloud SDK : https://cloud.google.com/sdk/docs/install
2. Installer avec l'option "Add to PATH"
3. Redémarrer PowerShell

### Utilisation

```powershell
# Authentifier
gcloud auth login
gcloud auth application-default login

# Configurer projet
gcloud config set project jurilab-481600

# Upload
gsutil cp data\exports\LEGITEXT000006070721_civil_20251219_111824.jsonl gs://legal-rag-data-sofia-2025/
```

---

## Recommandation

**Utiliser l'Option 2 (Interface Web)** pour un premier test :
- Plus simple
- Pas besoin d'installer quoi que ce soit
- Glisser-déposer direct

Ensuite, pour automatiser, installer Google Cloud SDK (Option 1 ou 3).

