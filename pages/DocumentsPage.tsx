/**
 * DocumentsPage
 * Main page for viewing and managing shared documents
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Upload,
    Search,
    Filter,
    Plus,
    FolderOpen,
    Loader2,
    ArrowLeft,
    ChevronDown,
    User
} from 'lucide-react';
import { useApp } from '../store/store';
import { Document, UserRole, Appointment } from '../types';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentViewer } from '../components/DocumentViewer';
import { Button } from '../components/Button';
import {
    getDocumentsForUser,
    toggleDocumentSharing,
    deleteDocument,
    createDocument,
    detectFileType
} from '../services/documentService';
import { getUserAppointments } from '../services/firebaseService';

export const DocumentsPage: React.FC = () => {
    const { currentUser, t } = useApp();
    const navigate = useNavigate();

    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload form state
    const [uploadName, setUploadName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadClientId, setUploadClientId] = useState('');
    const [uploadShared, setUploadShared] = useState(true);

    // Clients list from appointments
    interface ClientInfo {
        id: string;
        name: string;
    }
    const [knownClients, setKnownClients] = useState<ClientInfo[]>([]);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadDocuments();
        if (currentUser.role === UserRole.LAWYER) {
            loadKnownClients();
        }
    }, [currentUser, navigate]);

    // Load unique clients from lawyer's appointments
    const loadKnownClients = async () => {
        if (!currentUser || currentUser.role !== UserRole.LAWYER) return;

        try {
            const appointments = await getUserAppointments(currentUser.id, UserRole.LAWYER);
            
            // Extract unique clients from appointments
            const clientsMap = new Map<string, string>();
            appointments.forEach((apt: Appointment) => {
                if (apt.clientId && apt.clientName && !clientsMap.has(apt.clientId)) {
                    clientsMap.set(apt.clientId, apt.clientName);
                }
            });

            const uniqueClients: ClientInfo[] = Array.from(clientsMap.entries()).map(([id, name]) => ({
                id,
                name
            }));

            // Sort alphabetically by name
            uniqueClients.sort((a, b) => a.name.localeCompare(b.name));
            setKnownClients(uniqueClients);
        } catch (error) {
            console.error('Error loading known clients:', error);
        }
    };

    const loadDocuments = async () => {
        if (!currentUser) return;

        setIsLoading(true);
        try {
            const docs = await getDocumentsForUser(currentUser.id, currentUser.role);
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDocument = (doc: Document) => {
        setSelectedDocument(doc);
    };

    const handleDownloadDocument = (doc: Document) => {
        window.open(doc.fileUrl, '_blank');
    };

    const handleToggleShare = async (doc: Document) => {
        try {
            await toggleDocumentSharing(doc.id, !doc.sharedWithClient);
            setDocuments(docs =>
                docs.map(d => d.id === doc.id ? { ...d, sharedWithClient: !d.sharedWithClient } : d)
            );
        } catch (error) {
            console.error('Error toggling share:', error);
        }
    };

    const handleDeleteDocument = async (doc: Document) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            await deleteDocument(doc.id);
            setDocuments(docs => docs.filter(d => d.id !== doc.id));
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    const handleDocumentUpdated = (updatedDoc: Document) => {
        setDocuments(docs =>
            docs.map(d => d.id === updatedDoc.id ? updatedDoc : d)
        );
    };

    const handleDocumentDeleted = (docId: string) => {
        setDocuments(docs => docs.filter(d => d.id !== docId));
    };

    const handleUpload = async () => {
        if (!currentUser || !uploadFile || !uploadName || !uploadClientId) {
            alert('Veuillez remplir tous les champs requis');
            return;
        }

        setIsUploading(true);
        try {
            // Upload to Firebase Storage
            const { uploadFileToStorage } = await import('../services/firebaseService');
            const storagePath = `documents/${currentUser.id}/${Date.now()}_${uploadFile.name}`;
            const fileUrl = await uploadFileToStorage(uploadFile, storagePath);

            const newDoc = await createDocument({
                name: uploadName,
                fileName: uploadFile.name,
                fileUrl: fileUrl,
                fileType: detectFileType(uploadFile.name),
                fileSize: uploadFile.size,
                uploadedBy: currentUser.id,
                uploadedByRole: currentUser.role,
                lawyerId: currentUser.id,
                clientId: uploadClientId,
                description: uploadDescription,
                sharedWithClient: uploadShared,
            });

            setDocuments(docs => [newDoc, ...docs]);
            setShowUploadModal(false);
            resetUploadForm();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Erreur lors de l\'upload du document');
        } finally {
            setIsUploading(false);
        }
    };

    const resetUploadForm = () => {
        setUploadName('');
        setUploadDescription('');
        setUploadFile(null);
        setUploadClientId('');
        setUploadShared(true);
    };

    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLawyer = currentUser?.role === UserRole.LAWYER;

    if (!currentUser) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            📄 Documents
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isLawyer
                            ? 'Gérez et partagez vos documents avec vos clients'
                            : 'Consultez les documents partagés par votre avocat'
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent"
                        />
                    </div>

                    {/* Upload button (lawyers only) */}
                    {isLawyer && (
                        <Button onClick={() => setShowUploadModal(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Ajouter un document
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-DEFAULT" />
                    <span className="ml-3 text-slate-500">Chargement des documents...</span>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FolderOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {searchQuery ? 'Aucun résultat' : 'Aucun document'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                        {isLawyer
                            ? 'Commencez par ajouter un document à partager avec vos clients.'
                            : 'Votre avocat n\'a pas encore partagé de documents avec vous.'
                        }
                    </p>
                    {isLawyer && !searchQuery && (
                        <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter votre premier document
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            userRole={currentUser.role}
                            onView={handleViewDocument}
                            onDownload={handleDownloadDocument}
                            onDelete={isLawyer ? handleDeleteDocument : undefined}
                            onToggleShare={isLawyer ? handleToggleShare : undefined}
                        />
                    ))}
                </div>
            )}

            {/* Document Viewer Modal */}
            {selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    userRole={currentUser.role}
                    onClose={() => setSelectedDocument(null)}
                    onDocumentUpdated={handleDocumentUpdated}
                    onDocumentDeleted={handleDocumentDeleted}
                />
            )}

            {/* Upload Modal (Lawyers only) */}
            {showUploadModal && isLawyer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                            📤 Ajouter un document
                        </h2>

                        <div className="space-y-4">
                            {/* File input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Fichier *
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                />
                            </div>

                            {/* Document name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nom du document *
                                </label>
                                <input
                                    type="text"
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    placeholder="Ex: Contrat de bail"
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    placeholder="Description du document..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm resize-none"
                                />
                            </div>

                            {/* Client Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Client *
                                </label>
                                {knownClients.length > 0 ? (
                                    <div className="relative">
                                        <select
                                            value={uploadClientId}
                                            onChange={(e) => setUploadClientId(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="">Sélectionnez un client...</option>
                                            {knownClients.map(client => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                            Aucun client trouvé. Vous devez avoir des rendez-vous pour voir vos clients ici.
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                    Liste des clients avec lesquels vous avez eu des rendez-vous
                                </p>
                            </div>

                            {/* Share toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="shareWithClient"
                                    checked={uploadShared}
                                    onChange={(e) => setUploadShared(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-brand-DEFAULT focus:ring-brand-DEFAULT"
                                />
                                <label htmlFor="shareWithClient" className="text-sm text-slate-700 dark:text-slate-300">
                                    Partager immédiatement avec le client
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowUploadModal(false);
                                    resetUploadForm();
                                }}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading || !uploadFile || !uploadName || !uploadClientId}
                                isLoading={isUploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Ajouter
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
