import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useApp } from '../store/store';
import { OAuthProvider, linkWithPopup, reauthenticateWithPopup, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import {
  getOutlookCalendarCredentials,
  disconnectOutlookCalendar,
  saveOutlookCalendarCredentials,
} from '../services/firebaseService';
import { getOutlookCalendarList, refreshOutlookAccessToken } from '../services/outlookCalendarService';

interface OutlookCalendarConnectionProps {
  lawyerId: string;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Composant pour connecter/déconnecter le calendrier Outlook
 * Utilise Firebase Auth avec Microsoft OAuth Provider
 */
export const OutlookCalendarConnection: React.FC<OutlookCalendarConnectionProps> = ({
  lawyerId,
  onConnectionChange,
}) => {
  const { currentUser } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadConnectionStatus();
  }, [lawyerId]);

  const loadConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const credentials = await getOutlookCalendarCredentials(lawyerId);

      if (credentials && credentials.outlookCalendarConnected && credentials.outlookCalendarAccessToken) {
        // Vérifier si le token est encore valide
        try {
          await getOutlookCalendarList(credentials.outlookCalendarAccessToken);
          setIsConnected(true);
          setLastSync(credentials.outlookCalendarLastSyncAt || null);
          onConnectionChange?.(true);
        } catch (tokenError: any) {
          console.warn('⚠️ Outlook Calendar token expired or invalid:', tokenError);

          // Essayer de rafraîchir le token
          if (credentials.outlookCalendarRefreshToken) {
            try {
              const newAccessToken = await refreshOutlookAccessToken(credentials.outlookCalendarRefreshToken);
              await saveOutlookCalendarCredentials(lawyerId, {
                accessToken: newAccessToken,
                refreshToken: credentials.outlookCalendarRefreshToken,
              });
              setIsConnected(true);
              setLastSync(credentials.outlookCalendarLastSyncAt || null);
              onConnectionChange?.(true);
              console.log('✅ Outlook Calendar token refreshed successfully');
            } catch (refreshError) {
              console.error('❌ Error refreshing Outlook token:', refreshError);
              setIsConnected(false);
              setLastSync(null);
              onConnectionChange?.(false);
            }
          } else {
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
      console.error('❌ Error loading Outlook connection status:', error);
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

      // Créer un provider Microsoft avec les scopes Calendar
      const provider = new OAuthProvider('microsoft.com');
      provider.addScope('https://graph.microsoft.com/Calendars.ReadWrite');
      provider.addScope('https://graph.microsoft.com/User.Read');
      provider.addScope('offline_access');
      provider.setCustomParameters({
        prompt: 'consent',
      });

      let result;
      let credential;

      // Vérifier si l'utilisateur est déjà connecté avec Microsoft
      const isMicrosoftUser = auth.currentUser.providerData.some(
        (providerData) => providerData.providerId === 'microsoft.com'
      );

      if (isMicrosoftUser) {
        try {
          result = await reauthenticateWithPopup(auth.currentUser, provider);
          credential = OAuthProvider.credentialFromResult(result);
        } catch (reauthError: any) {
          if (reauthError.code === 'auth/popup-closed-by-user') {
            throw reauthError;
          }
          console.log('⚠️ Reauthentication failed, trying signInWithPopup...');
          result = await signInWithPopup(auth, provider);
          credential = OAuthProvider.credentialFromResult(result);
        }
      } else {
        try {
          result = await linkWithPopup(auth.currentUser, provider);
          credential = OAuthProvider.credentialFromResult(result);
        } catch (linkError: any) {
          if (linkError.code === 'auth/credential-already-in-use') {
            alert('Votre compte Microsoft est déjà lié. Si vous avez besoin de mettre à jour le token, veuillez vous déconnecter et vous reconnecter avec Microsoft.');
            return;
          } else if (linkError.code === 'auth/popup-closed-by-user') {
            throw linkError;
          } else {
            // Essayer signInWithPopup comme fallback
            result = await signInWithPopup(auth, provider);
            credential = OAuthProvider.credentialFromResult(result);
          }
        }
      }

      if (!credential || !credential.accessToken) {
        throw new Error("Impossible de récupérer le token d'accès Microsoft");
      }

      console.log('✅ Outlook Calendar token obtained');

      // Sauvegarder les credentials
      await saveOutlookCalendarCredentials(lawyerId, {
        accessToken: credential.accessToken,
        // Le refresh token n'est pas toujours disponible depuis Firebase Auth
      });

      await loadConnectionStatus();
      alert('Calendrier Outlook connecté avec succès !');
    } catch (error: any) {
      console.error('❌ Error connecting Outlook Calendar:', error);

      if (error.code === 'auth/popup-closed-by-user') {
        alert('La connexion a été annulée.');
      } else {
        alert('Erreur lors de la connexion : ' + (error.message || 'Erreur inconnue'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre calendrier Outlook ?')) {
      return;
    }

    try {
      setIsLoading(true);
      await disconnectOutlookCalendar(lawyerId);
      setIsConnected(false);
      setLastSync(null);
      onConnectionChange?.(false);
      alert('Calendrier Outlook déconnecté avec succès.');
    } catch (error) {
      console.error('❌ Error disconnecting Outlook Calendar:', error);
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

    if (diffMins < 1) return "À l'instant";
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
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          <span className="text-sm text-slate-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="font-bold text-lg">Synchronisation Outlook</h3>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Calendrier connecté</span>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              <span className="font-medium">Type :</span> Outlook Calendar
            </p>
            <p>
              <span className="font-medium">Dernière synchronisation :</span> {formatLastSync(lastSync)}
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
            Connectez votre calendrier Outlook pour synchroniser automatiquement vos disponibilités et
            vos rendez-vous avec Microsoft 365.
          </p>

          <Button
            variant="primary"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connecter Outlook Calendar
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
