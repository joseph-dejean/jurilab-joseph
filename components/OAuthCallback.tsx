import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pisteService } from '../services/pisteService';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setErrorMsg(translateError(error));
                return;
            }

            if (!code) {
                setStatus('error');
                setErrorMsg("Code d'autorisation manquant.");
                return;
            }

            try {
                await pisteService.handleCallback(code);
                setStatus('success');
                // Redirect back to dashboard or previous page
                setTimeout(() => navigate('/dashboard'), 1500);
            } catch (err: any) {
                setStatus('error');
                setErrorMsg("Échec de l'échange de token. Veuillez réessayer.");
                console.error("OAuth Callback Error:", err);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    const translateError = (errCode: string) => {
        switch (errCode) {
            case 'access_denied': return "Vous avez refusé l'accès.";
            case 'invalid_request': return "Requête invalide.";
            default: return `Erreur d'authentification: ${errCode}`;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-deep-950 p-4">
            <div className="glass max-w-md w-full p-8 rounded-3xl text-center shadow-xl">
                {status === 'processing' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">Authentification en cours</h2>
                        <p className="text-deep-600 dark:text-surface-400">Connexion à Piste / Légifrance...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">Connexion réussie !</h2>
                        <p className="text-deep-600 dark:text-surface-400">Redirection vers votre tableau de bord...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-deep-900 dark:text-surface-100 mb-2">Erreur de connexion</h2>
                        <p className="text-red-600 dark:text-red-400 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Retour
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
