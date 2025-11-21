# Instructions pour créer un rendez-vous de test

## Méthode 1 : Firebase Console (Recommandé)

1. **Aller dans Firebase Console**
   - https://console.firebase.google.com/project/jurilab-8bc6d/database/jurilab-8bc6d-default-rtdb/data

2. **Naviguer vers `appointments`**
   - Cliquez sur `appointments` dans l'arborescence

3. **Créer un nouveau rendez-vous**
   - Cliquez sur le bouton `+` (Ajouter un enfant)
   - Utilisez cet ID : `appt_test_11h`

4. **Ajouter les champs suivants** (cliquez sur chaque champ pour l'ajouter) :

   ```
   id: "appt_test_11h"
   lawyerId: "gNJSckZj8sQ8YYxBoiTsaOnDHlG2"
   clientId: "XEoWj85YVCQRjHZkyJMRJLonIB62"
   date: "2025-01-21T11:00:00.000Z"  (ou la date d'aujourd'hui à 11h)
   status: "CONFIRMED"
   type: "VIDEO"
   duration: 60
   notes: "Rendez-vous de test pour la visioconférence"
   ```

5. **Pour tester immédiatement** (sans attendre 11h) :
   - Modifiez le champ `date` pour mettre une heure dans les 15 prochaines minutes
   - Exemple : Si maintenant il est 10h30, mettez `2025-01-21T10:45:00.000Z`

## Méthode 2 : Modifier temporairement les règles Firebase

Si vous voulez utiliser le script, vous pouvez temporairement modifier les règles :

1. **Aller dans Firebase Console → Realtime Database → Rules**

2. **Remplacer temporairement** la section `appointments` par :
   ```json
   "appointments": {
     ".read": "auth != null",
     ".write": true,  // ⚠️ TEMPORAIRE - À retirer après le test
     ".indexOn": ["clientId", "lawyerId"],
     "$appointmentId": {
       ".read": "auth != null && (data.child('clientId').val() === auth.uid || data.child('lawyerId').val() === auth.uid)",
       ".write": "!data.exists() && auth != null && newData.child('clientId').val() === auth.uid || data.exists()",
       ".validate": "newData.hasChildren(['id', 'lawyerId', 'clientId', 'date', 'status', 'type'])"
     }
   }
   ```

3. **Publier les règles**

4. **Exécuter le script** : `node scripts/createTestAppointment.js`

5. **⚠️ IMPORTANT : Remettre les règles d'origine après le test !**

## Format de date ISO

Pour la date, utilisez le format ISO 8601 :
- Format : `YYYY-MM-DDTHH:mm:ss.sssZ`
- Exemple : `2025-01-21T11:00:00.000Z` (21 janvier 2025 à 11h00 UTC)
- Pour aujourd'hui à 11h : Remplacez `2025-01-21` par la date d'aujourd'hui

## Vérification

Après avoir créé le rendez-vous :
1. Rechargez l'application
2. Connectez-vous en tant que client (soso@gmail.com)
3. Allez dans "Mes rendez-vous" ou le Dashboard
4. Le rendez-vous devrait apparaître
5. Si la date est dans les 15 prochaines minutes, le bouton "Rejoindre la visio" devrait être visible

