import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    FileText,
    Calendar,
    Mail,
    Phone,
    ChevronRight,
    ArrowLeft,
    User,
    ExternalLink,
    Plus,
    Share2,
    Trash2,
    Download,
    Eye,
    MessageSquare,
    Clock,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/store';
import { UserRole, Appointment, Client, User as UserType } from '../types';
import { Button } from '../components/Button';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSharedDocuments, deleteDocument, toggleDocumentSharing } from '../services/documentService';
import { getClientById } from '../services/firebaseService';

interface ClientPortfolioData {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    lastAppointment?: string;
    appointments: Appointment[];
}

export const PortfolioPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, appointments, t } = useApp();
    const [clients, setClients] = useState<ClientPortfolioData[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sharedDocs, setSharedDocs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'history'>('info');

    // Check auth and role
    useEffect(() => {
        if (!currentUser || currentUser.role !== UserRole.LAWYER) {
            navigate('/dashboard');
        }
    }, [currentUser, navigate]);

    // Aggregate client data from appointments
    useEffect(() => {
        if (!currentUser || currentUser.role !== UserRole.LAWYER) return;

        const aggregateClients = async () => {
            setIsLoading(true);
            const lawyerAppointments = appointments.filter(a => a.lawyerId === currentUser.id);

            // Get unique client IDs
            const clientIds = Array.from(new Set(lawyerAppointments.map(a => a.clientId)));

            const portfolioData: ClientPortfolioData[] = [];

            for (const id of clientIds) {
                // Find client info (ideally we'd have a service to get client profiles in bulk)
                // For now, we use the first appointment to get the name if available
                const clientAppointments = lawyerAppointments
                    .filter(a => a.clientId === id)
                    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

                const lastAppt = clientAppointments[0];

                // Try to fetch full client profile
                const clientProfile = await getClientById(id);

                portfolioData.push({
                    id,
                    name: clientProfile?.name || lastAppt.clientName || 'Client Inconnu',
                    email: clientProfile?.email || 'N/A',
                    avatarUrl: clientProfile?.avatarUrl,
                    lastAppointment: lastAppt.date,
                    appointments: clientAppointments
                });
            }

            setClients(portfolioData);
            setIsLoading(false);
        };

        aggregateClients();
    }, [appointments, currentUser]);

    // Fetch documents for selected client
    useEffect(() => {
        if (selectedClientId && currentUser) {
            const fetchDocs = async () => {
                try {
                    const docs = await getSharedDocuments(currentUser.id, selectedClientId);
                    setSharedDocs(docs);
                } catch (error) {
                    console.error("Error fetching docs:", error);
                }
            };
            fetchDocs();
        }
    }, [selectedClientId, currentUser]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleToggleSharing = async (docId: string, currentShared: boolean) => {
        try {
            await toggleDocumentSharing(docId, !currentShared);
            // Update local state
            setSharedDocs(prev => prev.map(d => d.id === docId ? { ...d, sharedWithClient: !currentShared } : d));
        } catch (error) {
            alert("Erreur lors de la modification du partage");
        }
    };

    const handleDeleteDoc = async (docId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
            try {
                await deleteDocument(docId);
                setSharedDocs(prev => prev.filter(d => d.id !== docId));
            } catch (error) {
                alert("Erreur lors de la suppression");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-deep-950">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-surface-50 dark:bg-deep-950 px-4 py-8">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-deep-900 dark:text-surface-100 flex items-center gap-3">
                            <Users className="w-8 h-8 text-primary-500" />
                            Portfolio Clients
                        </h1>
                        <p className="text-deep-500 dark:text-surface-400 mt-1">
                            Gérez vos dossiers et documents clients en un seul endroit
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour au Dashboard
                    </Button>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Client List */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="glass rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-surface-100 dark:border-deep-800 bg-white/50 dark:bg-deep-900/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un client..."
                                        className="w-full pl-10 pr-4 py-2 bg-surface-50 dark:bg-deep-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                                {clients.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <User className="w-12 h-12 text-deep-200 dark:text-deep-700 mx-auto mb-3" />
                                        <p className="text-deep-500 dark:text-surface-500 text-sm">Aucun client trouvé.</p>
                                    </div>
                                ) : (
                                    clients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => setSelectedClientId(client.id)}
                                            className={`w-full text-left p-4 flex items-center gap-4 transition-all border-b border-surface-50 dark:border-deep-800/50 ${selectedClientId === client.id
                                                    ? 'bg-primary-50 dark:bg-primary-950/30 border-l-4 border-l-primary-500'
                                                    : 'hover:bg-surface-50 dark:hover:bg-deep-800/40'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center overflow-hidden">
                                                {client.avatarUrl ? (
                                                    <img src={client.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-primary-700 dark:text-primary-300 font-bold">{client.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-semibold text-deep-900 dark:text-surface-100 truncate">{client.name}</h4>
                                                <p className="text-xs text-deep-500 dark:text-surface-500 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    Dernier RDV: {client.lastAppointment ? format(parseISO(client.lastAppointment), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${selectedClientId === client.id ? 'translate-x-1 text-primary-500' : 'text-deep-300'}`} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Client Details */}
                    <div className="col-span-12 lg:col-span-8">
                        {!selectedClientId ? (
                            <div className="glass rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center border-dashed border-2 border-surface-200 dark:border-deep-800">
                                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 rounded-full flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-primary-500" />
                                </div>
                                <h3 className="text-xl font-serif text-deep-900 dark:text-surface-100 mb-2">Sélectionnez un client</h3>
                                <p className="text-deep-500 dark:text-surface-500 max-w-sm">
                                    Choisissez un client dans la liste pour consulter son dossier complet, ses documents et son historique.
                                </p>
                            </div>
                        ) : selectedClient && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Profile Header */}
                                <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -mr-8 -mt-8" />
                                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                                        <div className="w-24 h-24 rounded-2xl ring-4 ring-white dark:ring-deep-800 shadow-elevated overflow-hidden bg-white">
                                            {selectedClient.avatarUrl ? (
                                                <img src={selectedClient.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary-500 bg-primary-50">
                                                    {selectedClient.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center sm:text-left flex-grow">
                                            <h2 className="text-2xl font-serif font-bold text-deep-900 dark:text-surface-100">{selectedClient.name}</h2>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3">
                                                <span className="flex items-center gap-1.5 text-sm text-deep-500 dark:text-surface-400">
                                                    <Mail className="w-4 h-4 text-primary-500" />
                                                    {selectedClient.email}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-sm text-deep-500 dark:text-surface-400">
                                                    <Phone className="w-4 h-4 text-primary-500" />
                                                    Non renseigné
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="primary" size="sm" onClick={() => navigate(`/messages?lawyerId=${currentUser.id}&clientId=${selectedClient.id}`)}>
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Message
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Nouveau RDV
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Tabs */}
                                <div className="flex gap-2 p-1 bg-surface-100 dark:bg-deep-900 rounded-2xl w-fit">
                                    {[
                                        { id: 'info', icon: User, label: 'Résumé' },
                                        { id: 'documents', icon: FileText, label: 'Documents' },
                                        { id: 'history', icon: Calendar, label: 'Historique RDV' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                                    ? 'bg-white dark:bg-deep-800 text-primary-600 dark:text-primary-400 shadow-sm'
                                                    : 'text-deep-500 hover:text-deep-700 dark:hover:text-surface-200'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[400px]">
                                    {activeTab === 'info' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="glass rounded-2xl p-6">
                                                <h4 className="font-semibold text-deep-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-accent-500" />
                                                    Notes Rapides
                                                </h4>
                                                <textarea
                                                    className="w-full h-32 bg-surface-50 dark:bg-deep-800 border-none rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Ajoutez une note privée sur ce dossier..."
                                                ></textarea>
                                                <div className="mt-4 flex justify-end">
                                                    <Button size="sm">Enregistrer</Button>
                                                </div>
                                            </div>
                                            <div className="glass rounded-2xl p-6">
                                                <h4 className="font-semibold text-deep-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-primary-500" />
                                                    Statistiques
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-3 bg-surface-50 dark:bg-deep-800 rounded-xl">
                                                        <span className="text-sm text-deep-500">Rendez-vous totaux</span>
                                                        <span className="font-bold text-deep-900 dark:text-surface-100">{selectedClient.appointments.length}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-surface-50 dark:bg-deep-800 rounded-xl">
                                                        <span className="text-sm text-deep-500">Documents partagés</span>
                                                        <span className="font-bold text-deep-900 dark:text-surface-100">{sharedDocs.length}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-surface-50 dark:bg-deep-800 rounded-xl">
                                                        <span className="text-sm text-deep-500">Dernière activité</span>
                                                        <span className="text-sm font-medium">{selectedClient.lastAppointment ? format(parseISO(selectedClient.lastAppointment), 'dd/MM/yyyy') : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <div className="glass rounded-3xl overflow-hidden">
                                            <div className="p-6 border-b border-surface-100 dark:border-deep-800 flex items-center justify-between">
                                                <h4 className="font-semibold text-deep-900 dark:text-surface-100">Coffre-fort Documents</h4>
                                                <Button size="sm">
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Ajouter un document
                                                </Button>
                                            </div>
                                            <div className="p-0">
                                                {sharedDocs.length === 0 ? (
                                                    <div className="p-12 text-center text-deep-500">
                                                        Aucun document partagé pour le moment.
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-surface-100 dark:divide-deep-800">
                                                        {sharedDocs.map(doc => (
                                                            <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-deep-800/50">
                                                                <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-grow min-w-0">
                                                                    <h5 className="font-medium text-deep-900 dark:text-surface-100 truncate">{doc.name}</h5>
                                                                    <p className="text-xs text-deep-500">{format(parseISO(doc.uploadedAt), 'dd/MM/yyyy HH:mm')} • {doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'PDF'}</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleToggleSharing(doc.id, doc.sharedWithClient)}
                                                                        className={`p-2 rounded-lg transition-colors ${doc.sharedWithClient ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' : 'text-deep-400 bg-surface-100 dark:bg-deep-800'}`}
                                                                        title={doc.sharedWithClient ? "Partagé avec le client" : "Privé"}
                                                                    >
                                                                        <Share2 className="w-4 h-4" />
                                                                    </button>
                                                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-deep-500 hover:text-primary-600">
                                                                        <Eye className="w-4 h-4" />
                                                                    </a>
                                                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 text-deep-500 hover:text-red-500">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="glass rounded-3xl overflow-hidden">
                                            <div className="p-6 border-b border-surface-100 dark:border-deep-800">
                                                <h4 className="font-semibold text-deep-900 dark:text-surface-100">Historique des Consultations</h4>
                                            </div>
                                            <div className="divide-y divide-surface-100 dark:divide-deep-800">
                                                {selectedClient.appointments.map(appt => (
                                                    <div key={appt.id} className="p-6 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-deep-800/50">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-deep-800 flex flex-col items-center justify-center">
                                                                <span className="text-[10px] font-bold text-deep-500 uppercase">{format(parseISO(appt.date), 'MMM', { locale: fr })}</span>
                                                                <span className="text-lg font-bold text-deep-900 dark:text-surface-100">{format(parseISO(appt.date), 'dd')}</span>
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-deep-900 dark:text-surface-100">{appt.type === 'VIDEO' ? 'Visioconférence' : appt.type === 'PHONE' ? 'Appel Téléphonique' : 'Au Cabinet'}</h5>
                                                                <div className="flex items-center gap-3 text-xs text-deep-500 dark:text-surface-400 mt-1">
                                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(parseISO(appt.date), 'HH:mm')}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                                                            appt.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                                                                'bg-surface-200 text-deep-600 dark:bg-deep-800'
                                                                        }`}>{appt.status}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="sm" onClick={() => navigate('/my-appointments')}>
                                                            Détails
                                                            <ChevronRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
