# 🚀 Démarrage Rapide Firebase

## ⚡ 3 Étapes pour Faire Fonctionner l'App

### 1️⃣ Obtenez vos Clés Firebase (2 minutes)

1. Allez sur: https://console.firebase.google.com/project/jurilab-8bc6d/settings/general
2. Descendez jusqu'à "Vos applications"
3. Cliquez sur l'icône `</>` (Web app)
4. Copiez le bloc `firebaseConfig`

### 2️⃣ Collez les Clés (1 minute)

Ouvrez `firebaseConfig.ts` et remplacez:

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_CLE_API_FIREBASE",
  authDomain: "jurilab-8bc6d.firebaseapp.com",
  databaseURL: "https://jurilab-8bc6d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jurilab-8bc6d",
  storageBucket: "jurilab-8bc6d.firebasestorage.app",
  messagingSenderId: "COLLEZ_VOTRE_ID_ICI",
  appId: "COLLEZ_VOTRE_APP_ID_ICI"
};
```

**ET** dans `scripts/uploadToFirebase.js` (ligne 18-26)

### 3️⃣ Configurez les Règles Firebase (1 minute)

1. Allez sur: https://console.firebase.google.com/project/jurilab-8bc6d/database/jurilab-8bc6d-default-rtdb/rules
2. Collez ces règles:

```json
{
  "rules": {
    "lawyers": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Cliquez "Publier"

---

## 🎯 Upload et Test

### Uploadez les données CSV vers Firebase:

```bash
npm run upload-firebase
```

Attendez le message:
```
✅ Successfully uploaded all lawyers to Firebase!
```

### Testez l'app:

```bash
npm run dev
```

Ouvrez http://localhost:5173 et **ÇA MARCHE!** 🎉

---

## ✅ Checklist

- [ ] Clés Firebase copiées dans `firebaseConfig.ts`
- [ ] Clés Firebase copiées dans `scripts/uploadToFirebase.js`
- [ ] Règles Firebase configurées (`.read: true`)
- [ ] CSV uploadé avec `npm run upload-firebase`
- [ ] App testée avec `npm run dev`

---

## 🆘 Besoin d'Aide?

Lisez le guide complet: **`FIREBASE_SETUP.md`**

---

## 🔍 Vérification Rapide

Pour vérifier que tout est uploadé, allez sur:
https://console.firebase.google.com/project/jurilab-8bc6d/database/jurilab-8bc6d-default-rtdb/data

Vous devriez voir:
```
lawyers
  ├── lawyer_12345 (...)
  ├── lawyer_67890 (...)
  └── ... (7000+ entrées)
```

---

**C'est tout! Simple et rapide!** ⚡

