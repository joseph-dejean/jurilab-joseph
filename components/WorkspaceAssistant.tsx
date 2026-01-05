import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamWorkspaceChat } from '../services/geminiService';
import { useApp } from '../store/store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    isStreaming?: boolean;
    isError?: boolean;
}

export const WorkspaceAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'model',
        text: "Bonjour Maître. Je suis votre assistant exécutif et juridique. Je peux consulter votre agenda, analyser vos dossiers, ou effectuer des recherches juridiques sur Légifrance. Que puis-je faire pour vous ?"
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { currentUser, appointments } = useApp();

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        // Only auto-scroll when a new message is added, not on every character stream
        scrollToBottom();
    }, [messages.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsgText = input.trim();
        setInput('');
        setIsLoading(true);

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userMsgText
        };

        // Add temporary loading bot message
        const botMsgId = (Date.now() + 1).toString();
        const botMsg: Message = {
            id: botMsgId,
            role: 'model',
            text: '',
            isStreaming: true
        };

        setMessages(prev => [...prev, userMsg, botMsg]);

        try {
            // Prepare history for API
            // Filter out the welcome message as Gemini expects history to start with user or be empty
            const history = messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.text }]
                }));

            // Prepare context data
            const contextData = {
                userName: currentUser?.name || 'Maître',
                currentTime: format(new Date(), 'EEEE d MMMM yyyy à HH:mm', { locale: fr }),
                appointments: appointments.map(appt => ({
                    client: appt.clientName,
                    date: format(new Date(appt.date), 'dd/MM/yyyy HH:mm'),
                    notes: appt.notes,
                    type: appt.type,
                    status: appt.status
                }))
            };

            const stream = streamWorkspaceChat(history, userMsgText, contextData);

            let fullResponse = '';

            for await (const chunk of stream) {
                if (chunk.error) {
                    throw new Error(chunk.error);
                }

                if (chunk.text) {
                    fullResponse += chunk.text;
                    setMessages(prev => prev.map(msg =>
                        msg.id === botMsgId
                            ? { ...msg, text: fullResponse }
                            : msg
                    ));
                }
            }

            // Finalize message
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, isStreaming: false }
                    : msg
            ));

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === botMsgId
                    ? { ...msg, text: "Désolé, une erreur est survenue. Veuillez réessayer.", isError: true, isStreaming: false }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/40 dark:bg-deep-800/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 overflow-hidden relative">
            {/* Chat Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-deep-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                        )}

                        <div
                            className={`max-w-[85%] rounded-2xl p-3 shadow-md backdrop-blur-sm ${msg.role === 'user'
                                ? 'bg-primary-600/90 text-white rounded-br-none border border-primary-400/30'
                                : msg.isError
                                    ? 'bg-red-50/80 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    : 'bg-white/70 dark:bg-deep-800/70 text-slate-800 dark:text-slate-100 border border-white/40 dark:border-white/10 rounded-bl-none'
                                }`}
                        >
                            {msg.isStreaming && !msg.text ? (
                                <div className="flex gap-1 h-6 items-center px-2">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            ) : (
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white prose-invert' : 'dark:prose-invert'} prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => (
                                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all" />
                                            ),
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <table {...props} className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead {...props} className="bg-slate-50 dark:bg-deep-800" />,
                                            th: ({ node, ...props }) => <th {...props} className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider" />,
                                            td: ({ node, ...props }) => <td {...props} className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap" />,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && currentUser?.avatarUrl && (
                            <img
                                src={currentUser.avatarUrl}
                                alt="User"
                                className="w-8 h-8 rounded-full border-2 border-white/50 dark:border-white/10 shadow-sm"
                            />
                        )}
                        {msg.role === 'user' && !currentUser?.avatarUrl && (
                            <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                                <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Posez une question à votre assistant..."
                        disabled={isLoading}
                        className="flex-1 bg-white/60 dark:bg-deep-900/60 border border-white/30 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-primary-600/90 hover:bg-primary-700/90 text-white rounded-xl px-4 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg md:w-auto w-12 hover:shadow-primary-500/30 backdrop-blur-sm"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};
