/**
 * DocumentViewer Component
 * Modal for viewing documents with role-specific AI tools
 * Redesigned with modern UI, animations, and notes feature
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    Printer,
    Share2,
    Trash2,
    FileText,
    MessageSquare,
    Sparkles,
    List,
    HelpCircle,
    Loader2,
    CheckCircle,
    Lock,
    Send,
    StickyNote,
    Save,
    Clock,
    Wand2,
    Brain,
    Lightbulb,
    ChevronRight,
    Zap
} from 'lucide-react';
import { Document, UserRole } from '../types';
import { Button } from './Button';
import {
    summarizeDocumentForClient,
    summarizeDocumentForLawyer,
    explainDocument,
    extractKeyPoints,
    answerDocumentQuestion
} from '../services/documentAIService';
import { toggleDocumentSharing, saveDocumentSummary, saveDocumentNote, deleteDocument } from '../services/documentService';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DocumentViewerProps {
    document: Document;
    userRole: UserRole;
    onClose: () => void;
    onDocumentUpdated?: (doc: Document) => void;
    onDocumentDeleted?: (docId: string) => void;
}

type AIToolType = 'summary' | 'explain' | 'keypoints' | 'question' | null;

// AI Tool configuration with icons and colors
const AI_TOOLS = {
    summary: {
        icon: Brain,
        title: 'Résumé intelligent',
        description: 'Synthèse complète du document',
        lawyerDescription: 'Analyse professionnelle détaillée',
        clientDescription: 'Résumé simplifié et accessible',
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50 dark:bg-violet-900/20',
        textColor: 'text-violet-600 dark:text-violet-400',
        borderColor: 'border-violet-200 dark:border-violet-800',
    },
    explain: {
        icon: Lightbulb,
        title: 'Expliquer',
        description: 'Termes juridiques expliqués',
        lawyerDescription: '',
        clientDescription: 'Comprendre le jargon juridique',
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-200 dark:border-amber-800',
    },
    keypoints: {
        icon: List,
        title: 'Points clés',
        description: 'Clauses importantes extraites',
        lawyerDescription: 'Identifier les clauses critiques',
        clientDescription: '',
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    question: {
        icon: MessageSquare,
        title: 'Poser une question',
        description: 'L\'IA répond sur ce document',
        lawyerDescription: 'Interrogez le contenu du document',
        clientDescription: 'Posez vos questions',
        gradient: 'from-blue-500 to-cyan-600',
        bgLight: 'bg-blue-50 dark:bg-blue-900/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-200 dark:border-blue-800',
    },
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
    document,
    userRole,
    onClose,
    onDocumentUpdated,
    onDocumentDeleted,
}) => {
    const [activeAITool, setActiveAITool] = useState<AIToolType>(null);
    const [aiResult, setAiResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [question, setQuestion] = useState('');
    const [isShared, setIsShared] = useState(document.sharedWithClient);
    
    // Notes state
    const [note, setNote] = useState(document.lawyerNote || '');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [noteSaved, setNoteSaved] = useState(false);
    const [showNoteSection, setShowNoteSection] = useState(!!document.lawyerNote);

    const isLawyer = userRole === UserRole.LAWYER;

    // Mock document content (in real app, fetch from storage)
    const mockDocumentContent = `
    Ce document constitue un contrat de prestation de services entre les parties ci-dessous désignées.
    
    Article 1 - Objet du contrat
    Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s'engage 
    à fournir ses services au Client.
    
    Article 2 - Durée
    Le contrat est conclu pour une durée de 12 mois à compter de sa signature.
    
    Article 3 - Rémunération
    En contrepartie des services rendus, le Client s'engage à verser au Prestataire une rémunération 
    mensuelle de 2500€ HT.
    
    Article 4 - Confidentialité
    Les parties s'engagent à maintenir la confidentialité de toutes les informations échangées 
    dans le cadre de ce contrat.
  `;

    const handleAITool = async (tool: AIToolType) => {
        if (tool === activeAITool) {
            setActiveAITool(null);
            setAiResult('');
            return;
        }

        setActiveAITool(tool);
        setAiResult('');

        if (tool === 'question') {
            return;
        }

        setIsLoading(true);
        try {
            let result = '';
            switch (tool) {
                case 'summary':
                    result = isLawyer
                        ? await summarizeDocumentForLawyer(mockDocumentContent, document.name)
                        : await summarizeDocumentForClient(mockDocumentContent, document.name);

                    if (isLawyer) {
                        await saveDocumentSummary(document.id, result);
                    }
                    break;
                case 'explain':
                    result = await explainDocument(mockDocumentContent, document.name);
                    break;
                case 'keypoints':
                    result = await extractKeyPoints(mockDocumentContent, document.name);
                    break;
            }
            setAiResult(result);
        } catch (error) {
            console.error('AI tool error:', error);
            setAiResult('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAskQuestion = async () => {
        if (!question.trim()) return;

        setIsLoading(true);
        try {
            const result = await answerDocumentQuestion(
                mockDocumentContent,
                document.name,
                question,
                isLawyer
            );
            setAiResult(result);
        } catch (error) {
            console.error('Question error:', error);
            setAiResult('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleShare = async () => {
        try {
            await toggleDocumentSharing(document.id, !isShared);
            setIsShared(!isShared);
            if (onDocumentUpdated) {
                onDocumentUpdated({ ...document, sharedWithClient: !isShared });
            }
        } catch (error) {
            console.error('Share toggle error:', error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            await deleteDocument(document.id);
            if (onDocumentDeleted) {
                onDocumentDeleted(document.id);
            }
            onClose();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleDownload = () => {
        window.open(document.fileUrl, '_blank');
    };

    const handlePrint = () => {
        const printWindow = window.open(document.fileUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => printWindow.print();
        }
    };

    const handleSaveNote = async () => {
        if (!note.trim()) return;
        
        setIsSavingNote(true);
        try {
            await saveDocumentNote(document.id, note);
            setNoteSaved(true);
            setTimeout(() => setNoteSaved(false), 2000);
            if (onDocumentUpdated) {
                onDocumentUpdated({ 
                    ...document, 
                    lawyerNote: note,
                    lawyerNoteUpdatedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Save note error:', error);
        } finally {
            setIsSavingNote(false);
        }
    };

    // Get available tools based on role
    const getAvailableTools = () => {
        if (isLawyer) {
            return ['summary', 'keypoints', 'question'] as AIToolType[];
        }
        return ['summary', 'explain', 'question'] as AIToolType[];
    };

    const activeTool = activeAITool ? AI_TOOLS[activeAITool] : null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header with gradient accent */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-DEFAULT/10 via-purple-500/10 to-blue-500/10" />
                    <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-DEFAULT to-purple-600 rounded-xl blur opacity-40" />
                                <div className="relative p-3 bg-gradient-to-br from-brand-DEFAULT to-purple-600 rounded-xl">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="font-bold text-xl text-slate-900 dark:text-white">
                                    {document.name}
                                </h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {document.fileName}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                                        {document.fileType}
                                    </span>
                                    {isLawyer && (
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${
                                            isShared 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}>
                                            {isShared ? <Share2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                            {isShared ? 'Partagé' : 'Privé'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Document preview */}
                    <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
                        {document.fileType === 'PDF' ? (
                            <iframe
                                src={document.fileUrl}
                                className="w-full h-full min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-lg"
                                title={document.name}
                            />
                        ) : document.fileType === 'IMAGE' ? (
                            <div className="flex items-center justify-center h-full">
                                <img
                                    src={document.fileUrl}
                                    alt={document.name}
                                    className="max-w-full h-auto rounded-xl shadow-2xl"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                                    <FileText className="w-20 h-20 mb-4 opacity-50 mx-auto" />
                                    <p className="text-center mb-4">Aperçu non disponible pour ce type de fichier</p>
                                    <Button onClick={handleDownload}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Télécharger pour voir
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tools sidebar */}
                    <div className="w-96 border-l border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900">
                        {/* Quick Actions */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="w-4 h-4" />
                                    Télécharger
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Printer className="w-4 h-4" />
                                    Imprimer
                                </button>

                                {isLawyer && (
                                    <>
                                        <button
                                            onClick={handleToggleShare}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                                isShared
                                                    ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {isShared ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            {isShared ? 'Partagé' : 'Privé'}
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-auto">
                            {/* Notes Section (Lawyer only) */}
                            {isLawyer && (
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setShowNoteSection(!showNoteSection)}
                                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-lg shadow-amber-500/20">
                                                <StickyNote className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    Note privée
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {document.lawyerNote ? 'Modifier votre note' : 'Ajouter une note'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showNoteSection ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showNoteSection && (
                                        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Écrivez votre note ici... (visible uniquement par vous)"
                                                rows={4}
                                                className="w-full px-4 py-3 border border-amber-200 dark:border-amber-800 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                            />
                                            <div className="flex items-center justify-between">
                                                {document.lawyerNoteUpdatedAt && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Modifié le {format(parseISO(document.lawyerNoteUpdatedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                                    </span>
                                                )}
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveNote}
                                                    disabled={isSavingNote || !note.trim()}
                                                    className={`ml-auto transition-all ${noteSaved ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                                >
                                                    {isSavingNote ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : noteSaved ? (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    ) : (
                                                        <Save className="w-4 h-4 mr-2" />
                                                    )}
                                                    {noteSaved ? 'Enregistré !' : 'Enregistrer'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Tools Section */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-gradient-to-br from-brand-DEFAULT to-purple-600 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">
                                        Outils IA
                                    </h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 dark:from-slate-700 to-transparent" />
                                </div>

                                {/* AI Tool Cards */}
                                <div className="space-y-2">
                                    {getAvailableTools().map((toolKey) => {
                                        if (!toolKey) return null;
                                        const tool = AI_TOOLS[toolKey];
                                        const Icon = tool.icon;
                                        const isActive = activeAITool === toolKey;

                                        return (
                                            <button
                                                key={toolKey}
                                                onClick={() => handleAITool(toolKey)}
                                                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                                                    isActive 
                                                        ? `${tool.bgLight} border-2 ${tool.borderColor} shadow-lg` 
                                                        : 'border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                                                }`}
                                            >
                                                {/* Gradient background on hover */}
                                                <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                                                
                                                <div className="relative flex items-center gap-3 p-4">
                                                    <div className={`p-2.5 rounded-xl transition-all ${
                                                        isActive 
                                                            ? `bg-gradient-to-br ${tool.gradient} shadow-lg` 
                                                            : 'bg-slate-100 dark:bg-slate-800 group-hover:scale-110'
                                                    }`}>
                                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tool.textColor}`} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className={`font-semibold text-sm ${
                                                            isActive ? tool.textColor : 'text-slate-900 dark:text-white'
                                                        }`}>
                                                            {tool.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {isLawyer ? tool.lawyerDescription || tool.description : tool.clientDescription || tool.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 transition-all ${
                                                        isActive 
                                                            ? `${tool.textColor} rotate-90` 
                                                            : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1'
                                                    }`} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* AI Result Area */}
                                {activeAITool && (
                                    <div className={`mt-4 rounded-xl overflow-hidden border-2 ${activeTool?.borderColor} animate-in slide-in-from-top-2 duration-300`}>
                                        {/* Result header */}
                                        <div className={`px-4 py-3 ${activeTool?.bgLight} border-b ${activeTool?.borderColor}`}>
                                            <div className="flex items-center gap-2">
                                                {activeTool && <activeTool.icon className={`w-4 h-4 ${activeTool.textColor}`} />}
                                                <span className={`font-medium text-sm ${activeTool?.textColor}`}>
                                                    {activeTool?.title}
                                                </span>
                                                {aiResult && !isLoading && (
                                                    <span className="ml-auto flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Terminé
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Result content */}
                                        <div className="p-4 bg-white dark:bg-slate-800/50">
                                            {activeAITool === 'question' && !aiResult && (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={question}
                                                            onChange={(e) => setQuestion(e.target.value)}
                                                            placeholder="Posez votre question sur ce document..."
                                                            className="w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                                                        />
                                                        <Wand2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                    </div>
                                                    <Button
                                                        onClick={handleAskQuestion}
                                                        disabled={isLoading || !question.trim()}
                                                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                                                    >
                                                        {isLoading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        ) : (
                                                            <Zap className="w-4 h-4 mr-2" />
                                                        )}
                                                        Obtenir une réponse
                                                    </Button>
                                                </div>
                                            )}

                                            {isLoading && activeAITool !== 'question' && (
                                                <div className="flex flex-col items-center justify-center py-8">
                                                    <div className="relative">
                                                        <div className={`absolute inset-0 bg-gradient-to-r ${activeTool?.gradient} rounded-full blur-lg opacity-40 animate-pulse`} />
                                                        <div className={`relative p-4 bg-gradient-to-br ${activeTool?.gradient} rounded-full`}>
                                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                        </div>
                                                    </div>
                                                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                                        Analyse en cours...
                                                    </p>
                                                    <div className="mt-2 flex gap-1">
                                                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                        <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                    </div>
                                                </div>
                                            )}

                                            {aiResult && (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                        {aiResult}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Empty state when no tool selected */}
                                {!activeAITool && (
                                    <div className="mt-6 p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
                                        <div className="inline-flex p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                            <Sparkles className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Sélectionnez un outil IA ci-dessus pour analyser ce document
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
