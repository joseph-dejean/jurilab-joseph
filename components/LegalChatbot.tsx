import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/store';
import { streamLegalChat } from '../services/geminiService';
import { MessageSquare, X, Send, AlertTriangle, Scale, ExternalLink } from 'lucide-react';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Components for Markdown rendering
const MarkdownComponents = {
  // Custom link renderer to add icons and styling
  a: ({ node, ...props }: any) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium hover:underline hover:text-primary-700 dark:hover:text-primary-300 transition-colors bg-primary-50 dark:bg-primary-900/30 px-1 rounded mx-0.5"
      title="Ouvrir sur Légifrance"
    >
      {props.children}
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  ),
  // Headers
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2 text-deep-900 dark:text-surface-100" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mt-3 mb-2 text-deep-800 dark:text-surface-200" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-base font-semibold mt-2 mb-1 text-deep-700 dark:text-surface-300" {...props} />,
  // Lists
  ul: ({ node, ...props }: any) => <ul className="list-disc w-full ml-4 my-2 space-y-1" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
  li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
  // Blockquotes
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-primary-300 dark:border-primary-700 pl-4 py-1 my-2 bg-surface-50 dark:bg-deep-800 italic rounded-r" {...props} />
  ),
  // Paragraphs
  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
};

export const LegalChatbot: React.FC = () => {
  const { isChatOpen, toggleChat, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0 && isChatOpen) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: t.chatbot.welcome
      }]);
    }
  }, [isChatOpen, messages.length, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isChatOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const firstUserMessageIndex = messages.findIndex(m => m.role === 'user');
    const historyMessages = firstUserMessageIndex === -1 ? [] : messages.slice(firstUserMessageIndex);

    const history = historyMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);

      const stream = streamLegalChat(history, userText);

      let fullText = '';

      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }

        setMessages(prev => prev.map(m =>
          m.id === modelMsgId
            ? { ...m, text: fullText }
            : m
        ));
      }

      setMessages(prev => prev.map(m =>
        m.id === modelMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (error: any) {
      console.error("Chat stream failed:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: error.message || "Désolé, une erreur est survenue.",
        isError: true,
      };
      setMessages(prev => [...prev.filter(m => !m.isStreaming), errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button - Hidden when chat is open */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed z-50 bottom-24 sm:bottom-8 right-4 sm:right-6 p-3 sm:p-4 rounded-2xl shadow-glass-lg transition-all duration-300 ease-smooth group bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:shadow-glow hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <>
          {/* Mobile: Drawer from bottom / Desktop: Compact floating window */}
          <div className="fixed z-50 
            inset-x-0 bottom-0 h-[85vh] max-h-[700px]
            sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[500px] sm:w-[380px] 
            lg:h-[550px] lg:w-[400px]
            bg-white dark:bg-deep-900 
            rounded-t-3xl sm:rounded-3xl 
            shadow-2xl 
            border border-surface-200/50 dark:border-deep-700/50 
            flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in"
          >

            {/* Header with prominent close button */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 py-3 sm:p-4 flex items-center gap-3 shrink-0">
              {/* Mobile drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full sm:hidden" />

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm truncate">{t.chatbot.title}</h3>
                <p className="text-xs text-primary-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
              {/* Large, visible close button */}
              <button
                onClick={toggleChat}
                className="p-2.5 -mr-1 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Compact Disclaimer Banner */}
            <div className="bg-accent-50 dark:bg-accent-950/30 px-3 py-2 border-b border-accent-100 dark:border-accent-900/30 flex gap-2 items-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs leading-tight text-accent-700 dark:text-accent-300 line-clamp-2">
                {t.chatbot.disclaimer}
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-50 dark:bg-deep-900/50 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-md shadow-md'
                        : msg.isError
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900/30 rounded-tl-md'
                          : 'bg-white dark:bg-deep-800 text-deep-700 dark:text-surface-200 border border-surface-200 dark:border-deep-700 rounded-tl-md shadow-card'
                      }`}
                  >
                    {msg.role === 'model' ? (
                      <div className="markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={MarkdownComponents}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-primary-400 rounded-sm animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Compact Input Area */}
            <div className="p-3 pb-4 sm:pb-3 bg-white dark:bg-deep-900 border-t border-surface-200 dark:border-deep-800 shrink-0">
              <div className="relative flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t.chatbot.placeholder}
                  className="flex-1 pr-12 pl-3 py-2.5 rounded-xl border border-surface-200 dark:border-deep-700 bg-surface-50 dark:bg-deep-800 text-sm input-focus outline-none resize-none max-h-24 text-deep-800 dark:text-surface-200"
                  rows={1}
                  style={{ fontSize: '16px' }} // Prevent iOS zoom
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
            onClick={toggleChat}
          />
        </>
      )}
    </>
  );
};
