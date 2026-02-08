import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, Save, Trash2, Edit2, CheckCircle, Circle } from 'lucide-react';
import { Button } from './Button';
import { DiligenceEntry } from '../types';
import { format, parseISO, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface DiligenceTrackerProps {
    lawyerId: string;
    clientId: string;
}

export const DiligenceTracker: React.FC<DiligenceTrackerProps> = ({ lawyerId, clientId }) => {
    const [diligences, setDiligences] = useState<DiligenceEntry[]>([]);
    const [activeEntry, setActiveEntry] = useState<DiligenceEntry | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [billable, setBillable] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Categories prédéfinies
    const categories = [
        'Recherche',
        'Rédaction',
        'Révision documents',
        'Consultation',
        'Correspondance',
        'Appel téléphonique',
        'Déplacement',
        'Réunion',
        'Préparation audience',
        'Autre'
    ];

    // Charger les diligences depuis Firestore
    useEffect(() => {
        const q = query(
            collection(db, 'diligences'),
            where('lawyerId', '==', lawyerId),
            where('clientId', '==', clientId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries: DiligenceEntry[] = [];
            let active: DiligenceEntry | null = null;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const entry: DiligenceEntry = {
                    id: doc.id,
                    lawyerId: data.lawyerId,
                    clientId: data.clientId,
                    startTime: data.startTime instanceof Timestamp ? data.startTime.toDate().toISOString() : data.startTime,
                    endTime: data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate().toISOString() : data.endTime) : undefined,
                    duration: data.duration,
                    description: data.description,
                    category: data.category,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    billable: data.billable !== undefined ? data.billable : true
                };

                entries.push(entry);

                // Trouver l'entrée active (sans endTime)
                if (!entry.endTime) {
                    active = entry;
                }
            });

            setDiligences(entries);
            setActiveEntry(active);

            // Si une entrée est active, calculer le temps écoulé
            if (active) {
                const elapsed = Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000);
                setElapsedSeconds(elapsed);
            }
        });

        return () => unsubscribe();
    }, [lawyerId, clientId]);

    // Mettre à jour le chronomètre toutes les secondes
    useEffect(() => {
        if (activeEntry) {
            intervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - new Date(activeEntry.startTime).getTime()) / 1000);
                setElapsedSeconds(elapsed);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setElapsedSeconds(0);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [activeEntry]);

    // Démarrer une nouvelle diligence
    const startDiligence = async () => {
        if (activeEntry) return; // Ne peut pas démarrer si une entrée est déjà active

        const now = new Date().toISOString();
        await addDoc(collection(db, 'diligences'), {
            lawyerId,
            clientId,
            startTime: now,
            description: '',
            category: category || 'Autre',
            createdAt: now,
            updatedAt: now,
            billable: true
        });

        setDescription('');
    };

    // Arrêter la diligence active
    const stopDiligence = async () => {
        if (!activeEntry) return;

        const endTime = new Date();
        const startTime = new Date(activeEntry.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        const entryRef = doc(db, 'diligences', activeEntry.id);
        await updateDoc(entryRef, {
            endTime: endTime.toISOString(),
            duration,
            description: description || 'Travail sur le dossier',
            category: category || activeEntry.category || 'Autre',
            billable,
            updatedAt: new Date().toISOString()
        });

        setDescription('');
        setCategory('');
        setBillable(true);
    };

    // Supprimer une diligence
    const deleteDiligence = async (id: string) => {
        if (window.confirm('Supprimer cette diligence ?')) {
            await deleteDoc(doc(db, 'diligences', id));
        }
    };

    // Mettre à jour une diligence
    const updateDiligence = async (id: string) => {
        const entryRef = doc(db, 'diligences', id);
        await updateDoc(entryRef, {
            description: editDescription,
            updatedAt: new Date().toISOString()
        });
        setEditingId(null);
        setEditDescription('');
    };

    // Formater la durée en HH:MM:SS
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculer le temps total
    const totalTime = diligences.reduce((acc, entry) => acc + (entry.duration || 0), 0);
    const billableTime = diligences.filter(e => e.billable).reduce((acc, entry) => acc + (entry.duration || 0), 0);

    return (
        <div className="space-y-6">
            {/* Chronomètre actif */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-deep-900 dark:text-surface-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-500" />
                        Suivi du temps de travail
                    </h4>
                    <div className="text-sm text-deep-500">
                        Total: <span className="font-bold text-primary-600">{formatDuration(totalTime)}</span>
                        {' '}| Facturable: <span className="font-bold text-green-600">{formatDuration(billableTime)}</span>
                    </div>
                </div>

                {/* Affichage du chronomètre */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/20 dark:to-accent-950/20 rounded-2xl p-8 mb-6">
                    <div className="text-6xl font-mono font-bold text-deep-900 dark:text-surface-100 mb-4">
                        {formatDuration(elapsedSeconds)}
                    </div>
                    <div className="flex gap-3">
                        {!activeEntry ? (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={startDiligence}
                                className="shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Démarrer
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={stopDiligence}
                                className="border-2 border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                                <Pause className="w-5 h-5 mr-2" />
                                Arrêter
                            </Button>
                        )}
                    </div>
                </div>

                {/* Formulaire de description (visible quand le chronomètre est actif) */}
                {activeEntry && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
                                Catégorie
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="">Sélectionner...</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-deep-700 dark:text-surface-300 mb-2">
                                Description du travail effectué
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Décrivez le travail effectué sur ce dossier..."
                                className="w-full h-24 px-4 py-3 bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="billable"
                                checked={billable}
                                onChange={(e) => setBillable(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                            />
                            <label htmlFor="billable" className="text-sm text-deep-700 dark:text-surface-300">
                                Temps facturable au client
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Historique des diligences */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-surface-100 dark:border-deep-800">
                    <h4 className="font-semibold text-deep-900 dark:text-surface-100">Historique des diligences</h4>
                </div>

                <div className="divide-y divide-surface-100 dark:divide-deep-800 max-h-96 overflow-y-auto">
                    {diligences.length === 0 ? (
                        <div className="p-8 text-center">
                            <Clock className="w-12 h-12 text-deep-200 dark:text-deep-700 mx-auto mb-3" />
                            <p className="text-deep-500 dark:text-surface-500 text-sm">
                                Aucune diligence enregistrée pour ce client.
                            </p>
                        </div>
                    ) : (
                        diligences.map((entry) => (
                            <div key={entry.id} className="p-4 hover:bg-surface-50 dark:hover:bg-deep-800/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                                entry.billable 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-surface-100 text-deep-600 dark:bg-deep-700 dark:text-surface-400'
                                            }`}>
                                                {entry.category || 'Autre'}
                                            </span>
                                            <span className="text-2xl font-mono font-bold text-primary-600">
                                                {entry.duration ? formatDuration(entry.duration) : formatDuration(elapsedSeconds)}
                                            </span>
                                            {entry.billable && (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>

                                        {editingId === entry.id ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full h-20 px-3 py-2 bg-surface-50 dark:bg-deep-800 border border-surface-200 dark:border-deep-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateDiligence(entry.id)}
                                                    >
                                                        <Save className="w-3 h-3 mr-1" />
                                                        Enregistrer
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingId(null);
                                                            setEditDescription('');
                                                        }}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-deep-700 dark:text-surface-300 mb-2">
                                                {entry.description || 'Aucune description'}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-deep-500 dark:text-surface-500">
                                            <span>
                                                {format(parseISO(entry.startTime), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                            </span>
                                            {entry.endTime && (
                                                <>
                                                    <span>→</span>
                                                    <span>
                                                        {format(parseISO(entry.endTime), 'HH:mm', { locale: fr })}
                                                    </span>
                                                </>
                                            )}
                                            {!entry.endTime && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                                    <Circle className="w-2 h-2 fill-current animate-pulse" />
                                                    En cours
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {entry.endTime && (
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingId(entry.id);
                                                    setEditDescription(entry.description);
                                                }}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                                onClick={() => deleteDiligence(entry.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
