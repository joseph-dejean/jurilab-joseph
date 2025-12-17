import React, { useState, useEffect } from 'react';
import {
    CheckSquare,
    Sparkles,
    Plus,
    Trash2,
    Send,
    Copy,
    Check,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { useApp } from '../store/store';
import {
    Task,
    getTasks,
    addTask,
    updateTask,
    deleteTask
} from '../services/firebaseService';
import {
    generateLegalDraft,
    suggestTasksFromAppointments
} from '../services/documentAIService';
import { Button } from './Button';

export const LawyerWorkstation: React.FC = () => {
    const { currentUser, appointments } = useApp();
    const [activeTab, setActiveTab] = useState<'tasks' | 'drafter'>('tasks');

    // Task State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [isSuggestingTasks, setIsSuggestingTasks] = useState(false);

    // Drafter State
    const [draftTopic, setDraftTopic] = useState('');
    const [draftType, setDraftType] = useState<'EMAIL' | 'CLAUSE' | 'DOCUMENT'>('CLAUSE');
    const [draftResult, setDraftResult] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        if (currentUser?.id) {
            loadTasks();
        }
    }, [currentUser?.id]);

    const loadTasks = async () => {
        if (!currentUser?.id) return;
        setIsLoadingTasks(true);
        try {
            const fetchedTasks = await getTasks(currentUser.id);
            setTasks(fetchedTasks);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const handleAddTask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newTaskText.trim() || !currentUser?.id) return;

        const tempText = newTaskText;
        setNewTaskText(''); // Optimistic clear

        try {
            const newTask = await addTask(currentUser.id, tempText);
            setTasks(prev => [newTask, ...prev]);
        } catch (error) {
            setNewTaskText(tempText); // Restore on error
            console.error(error);
        }
    };

    const handleToggleTask = async (task: Task) => {
        if (!currentUser?.id) return;

        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        ));

        try {
            await updateTask(currentUser.id, task.id, { completed: !task.completed });
        } catch (error) {
            // Revert on error
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, completed: !task.completed } : t
            ));
            console.error(error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!currentUser?.id) return;
        if (!window.confirm('Supprimer cette tâche ?')) return;

        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(prev => prev.filter(t => t.id !== taskId));

        try {
            await deleteTask(currentUser.id, taskId);
        } catch (error) {
            setTasks(previousTasks); // Revert
            console.error(error);
        }
    };

    const handleSuggestTasks = async () => {
        if (!currentUser?.id) return;
        setIsSuggestingTasks(true);

        try {
            // Filter upcoming appointments for context
            const upcoming = appointments
                .filter(a => new Date(a.date) > new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map(a => `${a.date}: ${a.type} with ${a.clientId}`) // Privacy: simplified details
                .join('\n');

            if (!upcoming) {
                alert('Aucun rendez-vous à venir pour suggérer des tâches.');
                return;
            }

            const suggestions = await suggestTasksFromAppointments(upcoming);

            // Add suggestions one by one
            for (const suggestion of suggestions) {
                const newTask = await addTask(currentUser.id, suggestion);
                setTasks(prev => [newTask, ...prev]);
            }
        } catch (error) {
            console.error("Error suggesting tasks", error);
        } finally {
            setIsSuggestingTasks(false);
        }
    };

    const handleDraft = async () => {
        if (!draftTopic.trim()) return;
        setIsDrafting(true);
        setDraftResult('');

        try {
            const result = await generateLegalDraft(draftTopic, draftType);
            setDraftResult(result);
        } catch (error) {
            console.error(error);
            setDraftResult("Erreur lors de la génération.");
        } finally {
            setIsDrafting(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(draftResult);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'tasks'
                            ? 'bg-slate-50 dark:bg-slate-800 text-brand-DEFAULT border-b-2 border-brand-DEFAULT'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <CheckSquare className="w-4 h-4" />
                    Tâches
                </button>
                <button
                    onClick={() => setActiveTab('drafter')}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'drafter'
                            ? 'bg-slate-50 dark:bg-slate-800 text-brand-DEFAULT border-b-2 border-brand-DEFAULT'
                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    Assistant IA
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-auto">
                {activeTab === 'tasks' ? (
                    <div className="space-y-4">
                        {/* Add Task Form */}
                        <form onSubmit={handleAddTask} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nouvelle tâche..."
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent"
                            />
                            <Button size="sm" type="submit" disabled={!newTaskText.trim()}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </form>

                        {/* AI Suggest Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-brand-DEFAULT border-brand-DEFAULT/20 hover:bg-brand-DEFAULT/10"
                            onClick={handleSuggestTasks}
                            disabled={isSuggestingTasks}
                        >
                            {isSuggestingTasks ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Suggérer des tâches (basé sur l'agenda)
                        </Button>

                        {/* Task List */}
                        <div className="space-y-2 mt-4">
                            {isLoadingTasks ? (
                                <div className="text-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                                </div>
                            ) : tasks.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 py-4">Aucune tâche.</p>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-3 group">
                                        <button
                                            onClick={() => handleToggleTask(task)}
                                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'border-slate-300 hover:border-brand-DEFAULT'
                                                }`}
                                        >
                                            {task.completed && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 h-full flex flex-col">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Type de contenu</label>
                                <div className="flex gap-2">
                                    {(['CLAUSE', 'EMAIL', 'DOCUMENT'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setDraftType(type)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${draftType === type
                                                    ? 'bg-brand-DEFAULT text-white shadow-md'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {type === 'EMAIL' ? 'Email' : type === 'CLAUSE' ? 'Clause' : 'Document'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Sujet / Besoin</label>
                                <textarea
                                    className="w-full h-24 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent resize-none focus:ring-2 focus:ring-brand-DEFAULT"
                                    placeholder="Ex: Clause de confidentialité pour un contrat freelance..."
                                    value={draftTopic}
                                    onChange={(e) => setDraftTopic(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleDraft}
                                disabled={isDrafting || !draftTopic.trim()}
                                className="w-full"
                            >
                                {isDrafting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Générer le brouillon
                            </Button>
                        </div>

                        {/* Result Area */}
                        {draftResult && (
                            <div className="flex-1 mt-2 relative min-h-[150px] bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 overflow-auto whitespace-pre-wrap border border-slate-200 dark:border-slate-700">
                                {draftResult}
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded shadow-sm hover:bg-slate-100 transition-colors"
                                    title="Copier"
                                >
                                    {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
