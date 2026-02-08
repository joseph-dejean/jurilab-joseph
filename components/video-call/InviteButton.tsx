/**
 * InviteButton Component
 * Bouton pour générer et partager un lien d'invitation à un appel vidéo
 */

import React, { useState } from 'react';
import { UserPlus, Copy, Check, Mail, MessageCircle, ExternalLink } from 'lucide-react';

interface InviteButtonProps {
  roomId: string;
  roomUrl: string;
  onGenerateGuestLink: () => Promise<string>;
  compact?: boolean;
}

const InviteButton: React.FC<InviteButtonProps> = ({
  roomId,
  roomUrl,
  onGenerateGuestLink,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [guestLink, setGuestLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const link = await onGenerateGuestLink();
      setGuestLink(link);
    } catch (error) {
      console.error('Error generating guest link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    if (!guestLink) {
      handleGenerateLink();
    }
  };

  const handleCopyLink = () => {
    if (guestLink) {
      navigator.clipboard.writeText(guestLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Invitation à une visioconférence Jurilab');
    const body = encodeURIComponent(
      `Bonjour,\n\nVous êtes invité(e) à rejoindre une visioconférence sur Jurilab.\n\nCliquez sur ce lien pour rejoindre : ${guestLink}\n\nCordialement`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Rejoignez notre visioconférence Jurilab : ${guestLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Invite Button */}
      <button
        onClick={handleOpenModal}
        className={`group relative ${
          compact ? 'p-3' : 'p-4'
        } rounded-lg bg-slate-700 hover:bg-slate-600 transition-all duration-200`}
        title="Inviter des participants"
      >
        <UserPlus className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
      </button>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-DEFAULT/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-brand-DEFAULT" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Inviter des participants</h3>
                  <p className="text-slate-400 text-sm">Partagez ce lien pour inviter d'autres personnes</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">ℹ️</span>
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-200 font-medium mb-1">Lien d'invitation sécurisé</p>
                    <p className="text-blue-300/80 text-xs">
                      Ce lien permet à n'importe qui de rejoindre cet appel pendant 24h. 
                      Ne partagez qu'avec les personnes de confiance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Link */}
              {isGenerating ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-DEFAULT"></div>
                  <span className="ml-3 text-slate-300">Génération du lien...</span>
                </div>
              ) : guestLink ? (
                <div className="space-y-3">
                  {/* Link Display */}
                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <label className="text-slate-400 text-xs font-medium mb-2 block">
                      LIEN D'INVITATION
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={guestLink}
                        readOnly
                        className="flex-1 bg-slate-800 text-white text-sm px-3 py-2 rounded border border-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-brand-DEFAULT hover:bg-brand-dark text-white'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span className="text-sm">Copié!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-2 block">
                      PARTAGER PAR
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleShareEmail}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-2 border-t border-slate-700">
                    <button
                      onClick={() => window.open(guestLink, '_blank')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir dans un nouvel onglet
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateLink}
                  className="w-full px-4 py-3 bg-brand-DEFAULT hover:bg-brand-dark rounded-lg text-white font-medium transition-colors"
                >
                  Générer le lien d'invitation
                </button>
              )}

              {/* Room Info */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-slate-400 text-xs mb-1">ID de la salle</p>
                <p className="text-slate-300 text-sm font-mono">{roomId}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex items-center justify-between">
              <p className="text-slate-400 text-xs">
                Le lien expire dans 24 heures
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InviteButton;
