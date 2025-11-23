# Configuration Google Calendar pour Jurilab

Ce document explique comment configurer l'intégration Google Calendar pour synchroniser les calendriers des avocats.

## 📋 Prérequis

1. Un compte Google (pour chaque avocat)
2. Firebase configuré avec Google Auth
3. Google Cloud Console configuré avec l'API Calendar activée

## 🔧 Configuration

### 1. Configurer Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez ou sélectionnez un projet
3. Activez l'**API Google Calendar** :

   - Allez dans **APIs & Services** > **Library**
   - Recherchez "Google Calendar API"
   - Cliquez sur **Enable**

4. Configurez l'écran de consentement OAuth :

   - Allez dans **APIs & Services** > **OAuth consent screen**
   - Choisissez **External** (ou Internal si vous avez un compte Google Workspace)
   - Remplissez les informations requises
   - Ajoutez les scopes :
     - `https://www.googleapis.com/auth/calendar` (lecture/écriture de tous les calendriers)
     - `https://www.googleapis.com/auth/calendar.events` (gestion des événements)
     - `https://www.googleapis.com/auth/calendar.readonly` (lecture seule de tous les calendriers - optionnel)

5. Créez des identifiants OAuth 2.0 :
   - Allez dans **APIs & Services** > **Credentials**
   - Cliquez sur **Create Credentials** > **OAuth client ID**
   - Choisissez **Web application**
   - Ajoutez les **Authorized redirect URIs** :
     - `http://localhost:5173` (pour le dev)
     - `https://votre-domaine.com` (pour la prod)
   - Notez le **Client ID** et **Client Secret**

### 2. Configurer Firebase

1. Dans Firebase Console, allez dans **Authentication** > **Sign-in method**
2. Activez **Google** comme méthode de connexion
3. Entrez le **Client ID** et **Client Secret** de Google Cloud Console
4. Ajoutez les **Authorized domains** si nécessaire

### 3. Variables d'environnement (optionnel)

Si vous voulez gérer manuellement le rafraîchissement des tokens, créez un fichier `.env` :

```env
VITE_GOOGLE_CLIENT_ID=votre_client_id
VITE_GOOGLE_CLIENT_SECRET=votre_client_secret
```

**⚠️ Important**:

- Ne commitez JAMAIS le fichier `.env` dans Git
- Ces variables sont optionnelles car Firebase Auth gère déjà l'authentification Google

## 🚀 Utilisation

### Pour l'avocat

1. Connectez-vous en tant qu'avocat
2. Allez dans le **Dashboard**
3. Cliquez sur **"Connecter Google Calendar"**
4. Autorisez l'accès à votre calendrier Google
5. Vos disponibilités seront automatiquement synchronisées !

### Fonctionnalités

- ✅ **Synchronisation des disponibilités** : Les créneaux occupés dans Google Calendar ne sont pas proposés aux clients
- ✅ **Création automatique d'événements** : Quand un client réserve un RDV et que l'avocat l'accepte, l'événement est créé dans Google Calendar
- ✅ **Suppression automatique** : Quand un RDV est annulé, l'événement est supprimé de Google Calendar
- ✅ **Filtrage intelligent** : Les créneaux sont filtrés pour exclure les RDV déjà réservés dans l'app ET dans Google Calendar

## 🔐 Sécurité

### Chiffrement des tokens

⚠️ **IMPORTANT**: Le code actuel utilise un chiffrement basique (Base64) qui n'est **PAS sécurisé** pour la production.

Pour la production, vous devez :

1. **Utiliser un chiffrement robuste** :

   ```bash
   npm install crypto-js
   npm install --save-dev @types/crypto-js
   ```

   Puis modifiez `services/googleCalendarService.ts` :

   ```typescript
   import CryptoJS from "crypto-js";

   const ENCRYPTION_KEY =
     import.meta.env.VITE_ENCRYPTION_KEY || "your-secret-key";

   export const encryptToken = (token: string): string => {
     return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
   };

   export const decryptToken = (encryptedToken: string): string => {
     const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
     return bytes.toString(CryptoJS.enc.Utf8);
   };
   ```

2. **Alternative recommandée** :
   - Utilisez Firebase Functions comme backend proxy
   - Stockez les tokens côté serveur uniquement
   - Ne jamais exposer les tokens au client

### Gestion du refresh token

Actuellement, Firebase Auth ne fournit pas directement le refresh token Google. Pour obtenir un refresh token :

1. Utilisez l'API Google OAuth directement (au lieu de Firebase Auth)
2. Ajoutez `access_type=offline` et `prompt=consent` dans la requête OAuth
3. Stockez le refresh token pour pouvoir rafraîchir l'access token

**Note**: Firebase Auth gère automatiquement le rafraîchissement des tokens, mais pour l'API Google Calendar, on a besoin du token OAuth Google spécifique. Le code actuel utilise le token fourni par Firebase Auth, qui peut expirer.

## 📚 Documentation

- **Google Calendar API**: https://developers.google.com/calendar/api/v3/reference
- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2

## 🧪 Tests

### Tester la connexion

1. Connectez-vous en tant qu'avocat
2. Allez dans le Dashboard
3. Cliquez sur "Connecter Google Calendar"
4. Autorisez l'accès dans Google
5. Vérifiez que le statut passe à "Connecté"

### Tester la synchronisation

1. Créez un rendez-vous en tant que client
2. L'avocat accepte le rendez-vous
3. Vérifiez que l'événement apparaît dans le calendrier Google de l'avocat
4. Annulez le rendez-vous
5. Vérifiez que l'événement est supprimé de Google Calendar

## ⚠️ Limitations actuelles

1. **Chiffrement basique**: Les tokens sont chiffrés avec Base64 (non sécurisé)
2. **Refresh token**: Pas de gestion du refresh token (Firebase Auth gère cela automatiquement, mais le token peut expirer)
3. **Rate limiting**: Pas de gestion du rate limiting Google Calendar API
4. **Gestion d'erreurs**: Amélioration nécessaire pour les cas d'erreur

## 🚀 Améliorations futures

- [ ] Implémenter un vrai chiffrement des tokens (crypto-js)
- [ ] Gérer le refresh token manuellement pour plus de contrôle
- [ ] Ajouter un cache pour les disponibilités
- [ ] Gérer le rate limiting Google Calendar API
- [ ] Ajouter des tests unitaires
- [ ] Support de plusieurs calendriers par avocat
- [ ] Synchronisation bidirectionnelle (changements dans Google Calendar → app)

## 📝 Notes

- Les créneaux sont générés toutes les 15 minutes
- La durée par défaut est de 60 minutes
- Les créneaux occupés dans Google Calendar sont automatiquement exclus
- Les rendez-vous annulés dans l'app sont supprimés de Google Calendar
- Le fuseau horaire est détecté automatiquement depuis le navigateur
