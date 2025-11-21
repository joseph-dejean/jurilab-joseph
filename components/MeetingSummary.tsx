import React, { useState } from 'react';
import { Appointment } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FileText,
  Share2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { processCompletedMeeting } from '../services/meetingProcessor';
import { getLawyerById } from '../services/firebaseService';
import { useApp } from '../store/store';

interface MeetingSummaryProps {
  appointment: Appointment;
  lawyerName: string;
  clientName: string;
  onSummaryShared?: () => void;
  onSummaryRegenerated?: () => void;
}

export const MeetingSummary: React.FC<MeetingSummaryProps> = ({
  appointment,
  lawyerName,
  clientName,
  onSummaryShared,
  onSummaryRegenerated,
}) => {
  const { currentUser } = useApp();
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareWithClient = async () => {
    if (!appointment.id) return;

    setIsSharing(true);
    try {
      const { shareSummaryWithClient: shareFunction } = await import('../services/firebaseService');
      await shareFunction(appointment.id);
      
      if (onSummaryShared) {
        onSummaryShared();
      }
      
      alert('✅ Résumé partagé avec le client');
    } catch (error) {
      console.error('Error sharing summary:', error);
      alert('❌ Erreur lors du partage du résumé');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!appointment.transcript || !appointment.id) {
      alert('Aucun transcript disponible pour régénérer le résumé');
      return;
    }

    const confirmed = confirm('Voulez-vous régénérer le résumé ? L\'ancien résumé sera remplacé.');
    if (!confirmed) return;

    setIsRegenerating(true);
    try {
      const appointmentDate = format(parseISO(appointment.date), 'PPP', { locale: fr });
      
      await processCompletedMeeting(appointment, lawyerName, clientName);
      
      if (onSummaryRegenerated) {
        onSummaryRegenerated();
      }
      
      alert('✅ Résumé régénéré avec succès');
    } catch (error) {
      console.error('Error regenerating summary:', error);
      alert('❌ Erreur lors de la régénération du résumé');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!appointment.summary && !appointment.transcript) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <FileText className="w-5 h-5" />
          <p className="text-sm">
            Le résumé de cette réunion n'est pas encore disponible. Il sera généré automatiquement après la fin de la réunion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-brand-DEFAULT" />
            <h3 className="text-lg font-semibold text-navy dark:text-white">
              Résumé de la consultation
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(parseISO(appointment.date), 'PPP', { locale: fr })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(parseISO(appointment.date), 'HH:mm', { locale: fr })}
            </span>
            {appointment.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.duration} min
              </span>
            )}
            {appointment.meetingEndedAt && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Terminé le {format(parseISO(appointment.meetingEndedAt), 'PPP à HH:mm', { locale: fr })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {appointment.summary && (
            <>
              {!appointment.summaryShared && (
                <button
                  onClick={handleShareWithClient}
                  disabled={isSharing}
                  className="flex items-center gap-2 px-3 py-2 bg-brand-DEFAULT hover:bg-brand-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  {isSharing ? 'Partage...' : 'Partager avec le client'}
                </button>
              )}
              {appointment.summaryShared && (
                <span className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Partagé avec le client
                </span>
              )}
              <button
                onClick={handleRegenerateSummary}
                disabled={isRegenerating || !appointment.transcript}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                title="Régénérer le résumé"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Avocat :</strong> {lawyerName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Client :</strong> {clientName}
          </span>
        </div>
      </div>

      {/* Summary */}
      {appointment.summary ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-navy dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Résumé
            </h4>
            <button
              onClick={() => copyToClipboard(appointment.summary || '')}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {appointment.summary}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⏳ Le résumé est en cours de génération. Veuillez patienter quelques instants...
          </p>
        </div>
      )}

      {/* Transcript */}
      {appointment.transcript && (
        <div>
          <button
            onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Transcript complet
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({appointment.transcript.length} caractères)
              </span>
            </div>
            {isTranscriptExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {isTranscriptExpanded && (
            <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transcript de la réunion
                </p>
                <button
                  onClick={() => copyToClipboard(appointment.transcript || '')}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono">
                {appointment.transcript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info pour le client si partagé */}
      {appointment.summaryShared && currentUser?.role !== 'LAWYER' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Résumé partagé par votre avocat
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Ce résumé a été généré automatiquement à partir de votre consultation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

