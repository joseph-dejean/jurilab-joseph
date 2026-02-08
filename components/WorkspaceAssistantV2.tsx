/**
 * WorkspaceAssistantV2 - Assistant amélioré avec:
 * - Historique des conversations persistant
 * - Sidebar de conversations
 * - Contexte des rendez-vous
 * - Intégration du calendrier (ajout d'événements)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  User,
  Bot,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  History,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../store/store';
import { format, parseISO, isFuture, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessageStream,
  deleteConversation,
  updateConversationTitle,
  Conversation,
  ConversationMessage,
} from '../services/backendService';
import { useCalendar } from '../context/CalendarContext';
import { parseNaturalLanguageEvent } from '../services/calendarGeminiService';
import { EventSource, CalendarEvent } from '../types/calendarTypes';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
  isStreaming?: boolean;
  isError?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const WorkspaceAssistantV2: React.FC = () => {
  const { currentUser, appointments } = useApp();
  const lawyerId = currentUser?.id || '';

  // Calendar Context Integration
  const { addEvent, apiKey: calendarApiKey } = useCalendar();

  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Input State
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════════
  // EFFETS
  // ═══════════════════════════════════════════════════════════════════════════════

  // Charger les conversations au montage
  useEffect(() => {
    if (lawyerId) {
      loadConversations();
    }
  }, [lawyerId]);

  // Flag pour éviter de recharger les messages juste après avoir créé une conversation
  const [justCreatedConversation, setJustCreatedConversation] = useState(false);

  // Prepare meetings context for the assistant
  const meetingsContext = useMemo(() => {
    if (!currentUser || !appointments) return null;

    // Filter appointments for the lawyer
    const lawyerAppointments = appointments.filter((apt) => apt.lawyerId === currentUser.id);

    // Filter for upcoming meetings (today or future, not cancelled)
    const upcomingMeetings = lawyerAppointments
      .filter((apt) => {
        const aptDate = parseISO(apt.date);
        return apt.status !== 'CANCELLED' && (isFuture(aptDate) || isToday(aptDate));
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 10); // Limit to next 10 meetings

    // Get all meetings for broader context
    const allMeetings = lawyerAppointments
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 20); // Last 20 meetings

    return {
      userName: currentUser.name,
      currentTime: new Date().toISOString(),
      upcomingMeetings: upcomingMeetings.map((apt) => ({
        id: apt.id,
        date: apt.date,
        formattedDate: format(parseISO(apt.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr }),
        clientName: apt.clientName,
        type: apt.type,
        status: apt.status,
        duration: apt.duration,
        notes: apt.notes,
      })),
      allMeetings: allMeetings.map((apt) => ({
        id: apt.id,
        date: apt.date,
        formattedDate: format(parseISO(apt.date), "d MMMM yyyy 'à' HH:mm", { locale: fr }),
        clientName: apt.clientName,
        status: apt.status,
        type: apt.type,
      })),
    };
  }, [currentUser, appointments]);

  // Charger les messages quand on change de conversation
  useEffect(() => {
    if (currentConversationId) {
      // Ne pas recharger si on vient de créer la conversation
      if (!justCreatedConversation) {
        loadConversationMessages(currentConversationId);
      }
      setJustCreatedConversation(false);
    } else {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: `Bonjour ${currentUser?.name || 'Maître'}. Je suis votre assistant exécutif et juridique. Je peux consulter votre agenda, analyser vos dossiers, ou effectuer des recherches juridiques sur Légifrance. Que puis-je faire pour vous ?`
      }]);
    }
  }, [currentConversationId]);

  // Scroll automatique
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // FONCTIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const convs = await getConversations(lawyerId);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const conv = await getConversation(conversationId);
      if (conv && conv.messages) {
        const formattedMessages: Message[] = Object.values(conv.messages).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const conv = await createConversation(lawyerId, 'Nouvelle conversation');
      setConversations([conv, ...conversations]);
      setJustCreatedConversation(true); // Éviter le rechargement des messages
      setCurrentConversationId(conv.id);
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: `Bonjour ${currentUser?.name || 'Maître'}. Je suis votre assistant exécutif et juridique. Comment puis-je vous aider ?`
      }]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSelectConversation = (convId: string) => {
    setCurrentConversationId(convId);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Supprimer cette conversation ?')) return;

    try {
      await deleteConversation(convId);
      setConversations(conversations.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleEditTitle = (convId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(convId);
    setEditTitleValue(currentTitle);
  };

  const handleSaveTitle = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateConversationTitle(convId, editTitleValue);
      setConversations(conversations.map(c =>
        c.id === convId ? { ...c, title: editTitleValue } : c
      ));
    } catch (error) {
      console.error('Error updating title:', error);
    }
    setEditingTitle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsgText = input.trim();
    setInput('');
    setIsLoading(true);

    // 1. Check for Calendar Intent (Local AI)
    const creationKeywords = /(add|create|book|schedule|remind|set|new|meeting|lunch|dinner|call|appointment|ajouter|créer|réserver|planifier|rappel|nouveau|réunion|déjeuner|dîner|appel|rendez-vous|rdv|event|événement)/i;
    const questionKeywords = /^(what|when|where|how|check|show|list|do i have|quoi|quand|où|comment|vérifier|montrer|lister|ai-je|quel|quelle)/i;
    let isCreation = creationKeywords.test(userMsgText) && !questionKeywords.test(userMsgText);

    console.log("📅 Calendar intent check:", { isCreation, hasApiKey: !!calendarApiKey, userMsgText });

    if (isCreation && calendarApiKey) {
        // Add user message to UI immediately
         const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userMsgText,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);

        try {
             console.log("📅 Attempting to parse event with Gemini...");
             const parsedEvent = await parseNaturalLanguageEvent(userMsgText, new Date(), calendarApiKey);
             
             console.log("📅 Parsed event result:", parsedEvent);
             
             if (parsedEvent && parsedEvent.title && parsedEvent.start && parsedEvent.end) {
                  // Create event
                  const startDate = new Date(parsedEvent.start);
                  const endDate = new Date(parsedEvent.end);
                  
                  console.log("📅 Creating event:", { startDate, endDate, title: parsedEvent.title });
                  
                  const newEvent: CalendarEvent = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: parsedEvent.title,
                      start: startDate,
                      end: endDate,
                      description: parsedEvent.description || '',
                      location: parsedEvent.location || '',
                      isAllDay: parsedEvent.isAllDay || false,
                      source: EventSource.LOCAL,
                      color: '#be123c',
                      type: 'EVENT' as const
                  };

                  if (!isNaN(newEvent.start.getTime()) && !isNaN(newEvent.end.getTime())) {
                        console.log("✅ Adding event to calendar:", newEvent);
                        addEvent(newEvent);
                  
                        // Add bot response
                        const responseText = `✅ **Événement créé dans votre calendrier !**\n\n📌 **${parsedEvent.title}**\n📅 ${format(newEvent.start, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}\n⏱️ Durée: jusqu'à ${format(newEvent.end, "HH:mm", { locale: fr })}\n📍 ${parsedEvent.location || 'Aucun lieu spécifié'}\n\n*Vous pouvez voir cet événement dans votre [calendrier](/calendar).*`;
                        
                        const botMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            role: 'model',
                            text: responseText,
                            timestamp: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, botMsg]);
                        setIsLoading(false);
                        return;
                  } else {
                        console.warn("⚠️ Invalid date in parsed event:", { startDate, endDate });
                  }
             } else {
                  console.warn("⚠️ Could not parse event, missing required fields:", parsedEvent);
             }
        } catch (e) {
            console.error("❌ Failed to parse event:", e);
            // Fallback to normal chat if parsing fails
        }
    }

    // 2. Normal Chat Flow (Backend AI)

    // Créer une nouvelle conversation si nécessaire
    let convId = currentConversationId;
    if (!convId) {
      try {
        const conv = await createConversation(lawyerId, userMsgText.slice(0, 50));
        convId = conv.id;
        setJustCreatedConversation(true); // Éviter le rechargement des messages
        setCurrentConversationId(convId);
        setConversations([conv, ...conversations]);
      } catch (error) {
        console.error('Error creating conversation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la conversation';
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `⚠️ ${errorMessage}`,
          isError: true
        }]);
        setIsLoading(false);
        return;
      }
    }

    // Ajouter le message utilisateur (s'il n'a pas été ajouté par le bloc calendar)
    // Note: If we fell through from calendar check, we might duplicate the user message if we added it there.
    // However, the calendar block returns if successful. If it failed, we didn't add it yet (except inside the if, which I should fix).
    // Let's ensure we don't duplicate.
    
    // Logic fix: Only add user message here if we didn't enter the calendar block OR if calendar block failed/fell through without adding it.
    // Actually, simply: Add user message here for the backend flow.
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMsgText,
      timestamp: new Date().toISOString(),
    };

    // Only add if not already added (check last message)
    setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'user' && lastMsg.text === userMsgText) return prev;
        return [...prev, userMsg];
    });

    // Ajouter le message bot en attente
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: Message = {
      id: botMsgId,
      role: 'model',
      text: '',
      isStreaming: true
    };

    setMessages(prev => [...prev, botMsg]);

    try {
      const contextData = {
        userName: currentUser?.name || 'Maître',
        currentTime: format(new Date(), 'EEEE d MMMM yyyy à HH:mm', { locale: fr }),
        appointments: meetingsContext ? {
          upcoming: meetingsContext.upcomingMeetings,
          recent: meetingsContext.allMeetings.slice(0, 5),
        } : undefined,
      };

      const stream = sendMessageStream(convId, userMsgText, lawyerId, contextData);
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

        if (chunk.done) {
          break;
        }
      }

      // Finaliser le message
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId
          ? { ...msg, isStreaming: false, timestamp: new Date().toISOString() }
          : msg
      ));

      // Mettre à jour le titre si c'est le premier message
      if (messages.length <= 1) {
        const title = userMsgText.slice(0, 50);
        await updateConversationTitle(convId, title);
        setConversations(conversations.map(c =>
          c.id === convId ? { ...c, title } : c
        ));
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId
          ? { ...msg, text: `⚠️ ${errorMessage}`, isError: true, isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-full bg-white/40 dark:bg-deep-800/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 overflow-hidden">
      {/* Sidebar - Historique des conversations */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 border-r border-white/10 dark:border-white/5 bg-white/30 dark:bg-deep-900/50 flex flex-col overflow-hidden`}>
        {showSidebar && (
          <>
            {/* Header Sidebar */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Conversations
                </h3>
                <button
                  onClick={handleNewConversation}
                  className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                  title="Nouvelle conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Aucune conversation
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      handleSelectConversation(conv.id);
                    }}
                    className={`group p-3 rounded-xl cursor-pointer transition-all ${
                      currentConversationId === conv.id
                        ? 'bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800'
                        : 'hover:bg-white/50 dark:hover:bg-deep-700/50'
                    }`}
                  >
                    {editingTitle === conv.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded bg-white dark:bg-deep-700 border border-slate-200 dark:border-slate-600"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveTitle(conv.id, e)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTitle(null); }}
                          className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                              {conv.title}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {format(new Date(conv.updatedAt), 'dd/MM HH:mm', { locale: fr })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEditTitle(conv.id, conv.title, e)}
                            className="p-1 text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-deep-700 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-deep-700 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-deep-700 rounded-r-lg shadow-md border border-l-0 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-deep-600 transition-colors"
        style={{ left: showSidebar ? '288px' : '0' }}
      >
        {showSidebar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <>
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

                  <div className="flex flex-col items-end gap-1">
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
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
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
        </>
      </div>
    </div>
  );
};

export default WorkspaceAssistantV2;
