import React, { useState, useEffect } from 'react';
import { Calendar, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useApp } from '../store/store';
import { supabase } from '../supabaseClient';
import { getGoogleCalendarCredentials, disconnectGoogleCalendar, saveGoogleCalendarCredentials, updateGoogleCalendarAccessToken } from '../services/supabaseService';

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

  // Charger l'état de connexion au montage et gérer le retour OAuth
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const calendarConnect = localStorage.getItem('jurilab_calendar_connect');
      if (calendarConnect === 'google') {
        localStorage.removeItem('jurilab_calendar_connect');
        localStorage.removeItem('jurilab_calendar_lawyer_id');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.provider_token) {
          await saveGoogleCalendarCredentials(lawyerId, {
            accessToken: session.provider_token,
            refreshToken: session.provider_refresh_token ?? undefined,
          });
        }
      }
      loadConnectionStatus();
    };
    handleOAuthCallback();
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
    if (!currentUser) {
      alert('Vous devez être connecté pour connecter votre calendrier.');
      return;
    }

    try {
      setIsConnecting(true);

      // Check if we already have a valid provider token from the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        await saveGoogleCalendarCredentials(lawyerId, {
          accessToken: session.provider_token,
          refreshToken: session.provider_refresh_token ?? undefined,
        });
        await loadConnectionStatus();
        alert('Calendrier Google connecté avec succès !');
        return;
      }

      // Store lawyerId so we can save credentials after OAuth redirect
      localStorage.setItem('jurilab_calendar_connect', 'google');
      localStorage.setItem('jurilab_calendar_lawyer_id', lawyerId);

      // Redirect to Google OAuth with calendar scopes
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.href,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      // Page will redirect — no code after this point executes
    } catch (error: any) {
      console.error('❌ Error connecting Google Calendar:', error);
      alert('Erreur lors de la connexion : ' + (error.message || 'Erreur inconnue'));
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

