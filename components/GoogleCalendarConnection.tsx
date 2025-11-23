import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useApp } from '../store/store';
import { GoogleAuthProvider, linkWithPopup, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getGoogleCalendarCredentials, disconnectGoogleCalendar, saveGoogleCalendarCredentials } from '../services/firebaseService';

interface GoogleCalendarConnectionProps {
  lawyerId: string;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Composant pour connecter/déconnecter le calendrier Google Calendar
 * Utilise Firebase Auth pour obtenir le token OAuth Google
 */
export const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  lawyerId,
  onConnectionChange,
}) => {
  const { currentUser } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Charger l'état de connexion au montage et vérifier la validité du token
  useEffect(() => {
    loadConnectionStatus();
  }, [lawyerId]);

  const loadConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const credentials = await getGoogleCalendarCredentials(lawyerId);
      
      if (credentials && credentials.googleCalendarConnected && credentials.googleCalendarAccessToken) {
        // Vérifier si le token est encore valide en testant une requête simple
        try {
          const { getGoogleCalendarList } = await import('../services/googleCalendarService');
          await getGoogleCalendarList(credentials.googleCalendarAccessToken);
          
          // Token valide
          setIsConnected(true);
          setLastSync(credentials.googleCalendarLastSyncAt || null);
          onConnectionChange?.(true);
        } catch (tokenError: any) {
          // Token expiré ou invalide
          console.warn('⚠️ Google Calendar token expired or invalid:', tokenError);
          
          // Essayer de rafraîchir le token si on a un refresh token
          if (credentials.googleCalendarRefreshToken) {
            try {
              const { refreshGoogleAccessToken } = await import('../services/googleCalendarService');
              const { updateGoogleCalendarAccessToken } = await import('../services/firebaseService');
              
              const newAccessToken = await refreshGoogleAccessToken(credentials.googleCalendarRefreshToken);
              await updateGoogleCalendarAccessToken(lawyerId, newAccessToken);
              
              // Recharger les credentials avec le nouveau token
              const updatedCredentials = await getGoogleCalendarCredentials(lawyerId);
              if (updatedCredentials) {
                setIsConnected(true);
                setLastSync(updatedCredentials.googleCalendarLastSyncAt || null);
                onConnectionChange?.(true);
                console.log('✅ Google Calendar token refreshed successfully');
              }
            } catch (refreshError) {
              console.error('❌ Error refreshing token:', refreshError);
              // Token non rafraîchissable, considérer comme déconnecté
              setIsConnected(false);
              setLastSync(null);
              onConnectionChange?.(false);
            }
          } else {
            // Pas de refresh token, considérer comme déconnecté
            console.warn('⚠️ No refresh token available, connection may be lost');
            setIsConnected(false);
            setLastSync(null);
            onConnectionChange?.(false);
          }
        }
      } else {
        setIsConnected(false);
        setLastSync(null);
        onConnectionChange?.(false);
      }
    } catch (error) {
      console.error('❌ Error loading connection status:', error);
      setIsConnected(false);
      setLastSync(null);
      onConnectionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!auth.currentUser) {
      alert('Vous devez être connecté pour connecter votre calendrier.');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Vérifier d'abord si on a déjà un token valide
      const existingCredentials = await getGoogleCalendarCredentials(lawyerId);
      if (existingCredentials && existingCredentials.googleCalendarConnected) {
        // Tester si le token est encore valide en faisant une requête simple
        try {
          const { getGoogleCalendarList } = await import('../services/googleCalendarService');
          await getGoogleCalendarList(existingCredentials.googleCalendarAccessToken);
          // Si ça fonctionne, le token est valide, pas besoin de reconnecter
          console.log('✅ Google Calendar token is still valid');
          await loadConnectionStatus();
          alert('Votre calendrier Google est déjà connecté et fonctionne correctement.');
          return;
        } catch (tokenError: any) {
          // Token expiré, on continue pour obtenir un nouveau token
          console.log('⚠️ Token expired, refreshing...');
        }
      }
      
      // Créer un provider Google avec le scope Calendar
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.setCustomParameters({
        prompt: 'consent', // Forcer le consentement pour obtenir le refresh token
        access_type: 'offline', // Nécessaire pour obtenir le refresh token
      });
      
      let result;
      let credential;
      
      // Vérifier si l'utilisateur est déjà connecté avec Google
      const isGoogleUser = auth.currentUser.providerData.some(
        (providerData) => providerData.providerId === 'google.com'
      );
      
      if (isGoogleUser) {
        // Si déjà connecté avec Google, essayer d'obtenir le token directement
        // Firebase Auth stocke le token dans la session
        try {
          // Essayer de récupérer le token depuis l'ID token
          const idTokenResult = await auth.currentUser.getIdTokenResult();
          // Malheureusement, Firebase Auth ne donne pas directement l'access token Google
          // Il faut utiliser reauthenticateWithPopup pour obtenir un nouveau token
          console.log('🔄 User already connected with Google, reauthenticating to get Calendar token...');
          result = await reauthenticateWithPopup(auth.currentUser, provider);
          credential = GoogleAuthProvider.credentialFromResult(result);
        } catch (reauthError: any) {
          // Si reauthenticate échoue, essayer signInWithPopup
          if (reauthError.code === 'auth/popup-closed-by-user') {
            throw reauthError;
          }
          console.log('⚠️ Reauthentication failed, trying signInWithPopup...');
          result = await signInWithPopup(auth, provider);
          credential = GoogleAuthProvider.credentialFromResult(result);
        }
      } else {
        // Sinon, essayer de lier le compte
        try {
          result = await linkWithPopup(auth.currentUser, provider);
          credential = GoogleAuthProvider.credentialFromResult(result);
        } catch (linkError: any) {
          // Si linkWithPopup échoue (credential-already-in-use), c'est que le compte Google
          // est déjà lié à cet utilisateur Firebase, donc on peut récupérer le token
          if (linkError.code === 'auth/credential-already-in-use') {
            console.log('✅ Google account already linked to this user');
            // Le compte est déjà lié, on peut juste utiliser signInWithPopup pour obtenir le token
            // Mais attention : cela va changer l'utilisateur actuel
            // Une meilleure solution serait d'utiliser le token existant s'il est valide
            // Pour l'instant, on informe l'utilisateur
            alert('Votre compte Google est déjà lié. Si vous avez besoin de mettre à jour le token, veuillez vous déconnecter et vous reconnecter avec Google.');
            return;
          } else {
            throw linkError;
          }
        }
      }
      
      if (!credential || !credential.accessToken) {
        throw new Error('Impossible de récupérer le token d\'accès Google');
      }

      console.log('✅ Google Calendar token obtained');
      
      // Sauvegarder les credentials
      await saveGoogleCalendarCredentials(lawyerId, {
        accessToken: credential.accessToken,
        // refreshToken n'est pas disponible directement depuis Firebase Auth
        // Il faudrait un backend pour l'obtenir
      });

      // Recharger l'état
      await loadConnectionStatus();
      
      alert('Calendrier Google connecté avec succès !');
    } catch (error: any) {
      console.error('❌ Error connecting Google Calendar:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        alert('Ce compte Google est déjà lié à votre compte. La connexion devrait fonctionner automatiquement.');
        // Recharger l'état au cas où
        await loadConnectionStatus();
      } else if (error.code === 'auth/popup-closed-by-user') {
        alert('La connexion a été annulée.');
      } else {
        alert('Erreur lors de la connexion : ' + (error.message || 'Erreur inconnue'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre calendrier Google ?')) {
      return;
    }

    try {
      setIsLoading(true);
      await disconnectGoogleCalendar(lawyerId);
      setIsConnected(false);
      setLastSync(null);
      onConnectionChange?.(false);
      alert('Calendrier Google déconnecté avec succès.');
    } catch (error) {
      console.error('❌ Error disconnecting Google Calendar:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (syncDate: string | null): string => {
    if (!syncDate) return 'Jamais';
    const date = new Date(syncDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          <span className="text-sm text-slate-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-5 w-5 text-primary-500" />
        <h3 className="font-bold text-lg">Synchronisation Google Calendar</h3>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Calendrier connecté</span>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              <span className="font-medium">Type :</span> Google Calendar
            </p>
            <p>
              <span className="font-medium">Dernière synchronisation :</span>{' '}
              {formatLastSync(lastSync)}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Déconnecter le calendrier
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Connectez votre calendrier Google pour synchroniser automatiquement vos disponibilités
            et vos rendez-vous.
          </p>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connecter Google Calendar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

