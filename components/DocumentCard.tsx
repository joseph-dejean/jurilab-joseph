/**
 * DocumentCard Component
 * Displays a document card with quick actions and improved design
 */

import React from 'react';
import {
    FileText,
    Image,
    File,
    Download,
    Eye,
    Trash2,
    Share2,
    Lock,
    Calendar,
    StickyNote,
    Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Document, UserRole } from '../types';
import { formatFileSize } from '../services/documentService';

interface DocumentCardProps {
    document: Document;
    userRole: UserRole;
    onView: (doc: Document) => void;
    onDownload: (doc: Document) => void;
    onDelete?: (doc: Document) => void;
    onToggleShare?: (doc: Document) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    userRole,
    onView,
    onDownload,
    onDelete,
    onToggleShare,
}) => {
    const getFileIcon = () => {
        const iconClass = "w-8 h-8";
        switch (document.fileType) {
            case 'PDF':
                return <FileText className={`${iconClass} text-red-500`} />;
            case 'DOC':
            case 'DOCX':
                return <FileText className={`${iconClass} text-blue-500`} />;
            case 'TXT':
                return <File className={`${iconClass} text-gray-500`} />;
            case 'IMAGE':
                return <Image className={`${iconClass} text-green-500`} />;
            default:
                return <File className={`${iconClass} text-gray-500`} />;
        }
    };

    const getFileGradient = () => {
        switch (document.fileType) {
            case 'PDF':
                return 'from-red-500/10 to-orange-500/10';
            case 'DOC':
            case 'DOCX':
                return 'from-blue-500/10 to-indigo-500/10';
            case 'TXT':
                return 'from-gray-500/10 to-slate-500/10';
            case 'IMAGE':
                return 'from-green-500/10 to-emerald-500/10';
            default:
                return 'from-gray-500/10 to-slate-500/10';
        }
    };

    const isLawyer = userRole === UserRole.LAWYER;
    const hasNote = isLawyer && document.lawyerNote;
    const hasAISummary = !!document.aiSummary;

    return (
        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
            {/* Gradient accent on top */}
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${getFileGradient()}`} />
            
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                    {/* File Icon with gradient background */}
                    <div className={`relative p-3 bg-gradient-to-br ${getFileGradient()} rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        {getFileIcon()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-DEFAULT transition-colors">
                            {document.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {document.fileName}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(document.uploadedAt), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                {formatFileSize(document.fileSize)}
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                {document.fileType}
                            </span>
                        </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-col gap-2 shrink-0">
                        {/* Sharing status badge (for lawyers) */}
                        {isLawyer && (
                            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                document.sharedWithClient
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                                {document.sharedWithClient ? (
                                    <span className="flex items-center gap-1">
                                        <Share2 className="w-3 h-3" /> Partagé
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Privé
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {document.description && (
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {document.description}
                    </p>
                )}

                {/* Indicators Row */}
                {(hasNote || hasAISummary) && (
                    <div className="flex items-center gap-2 mt-4">
                        {hasNote && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Note</span>
                            </div>
                        )}
                        {hasAISummary && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Résumé IA</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => onView(document)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-DEFAULT/10 to-purple-500/10 hover:from-brand-DEFAULT/20 hover:to-purple-500/20 text-brand-dark dark:text-brand-light rounded-xl transition-all font-semibold text-sm group/btn"
                    >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        Voir
                    </button>

                    <button
                        onClick={() => onDownload(document)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all hover:scale-105"
                        title="Télécharger"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    {isLawyer && onToggleShare && (
                        <button
                            onClick={() => onToggleShare(document)}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:scale-105 ${
                                document.sharedWithClient
                                    ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                            title={document.sharedWithClient ? 'Retirer le partage' : 'Partager avec le client'}
                        >
                            {document.sharedWithClient ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                    )}

                    {isLawyer && onDelete && (
                        <button
                            onClick={() => onDelete(document)}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition-all hover:scale-105"
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-br ${getFileGradient()} opacity-30 rounded-2xl`} />
            </div>
        </div>
    );
};
