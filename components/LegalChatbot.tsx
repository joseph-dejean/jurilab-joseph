import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/store';
import { streamLegalChat } from '../services/geminiService';
import { MessageSquare, X, Send, AlertTriangle, Globe, ExternalLink, RefreshCw } from 'lucide-react';
import { ChatMessage } from '../types';
import { Button } from './Button';

export const LegalChatbot: React.FC = () => {
  const { isChatOpen, toggleChat, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };

    // Optimistic update
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      // Create placeholder for model response
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);

      const stream = streamLegalChat(history, userText);
      
      let fullText = '';
      let sources: any[] = [];

      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
        }
        if (chunk.groundingMetadata?.groundingChunks) {
           // Extract chunks that are 'web' type
           const webSources = chunk.groundingMetadata.groundingChunks
             .filter((c: any) => c.web)
             .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
           
           if (webSources.length > 0) {
              sources = [...sources, ...webSources];
           }
        }

        // Update message in place
        setMessages(prev => prev.map(m => 
          m.id === modelMsgId 
            ? { ...m, text: fullText, sources: sources.length > 0 ? sources : undefined } 
            : m
        ));
      }
      
      // Finalize
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Désolé, je rencontre une erreur technique pour le moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-105 ${isChatOpen ? 'bg-slate-200 text-slate-600 rotate-90 dark:bg-slate-800 dark:text-slate-300' : 'bg-primary-600 text-white'}`}
      >
        {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-primary-600 p-4 flex items-center gap-3 text-white">
             <div className="bg-white/20 p-2 rounded-full">
               <RefreshCw className="h-5 w-5" />
             </div>
             <div>
               <h3 className="font-bold text-sm">{t.chatbot.title}</h3>
               <p className="text-xs opacity-80 flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                 Online • Gemini 2.5
               </p>
             </div>
             <button onClick={toggleChat} className="ml-auto hover:bg-white/20 p-1 rounded">
               <X className="h-5 w-5" />
             </button>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 border-b border-amber-100 dark:border-amber-800/30 flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight text-amber-800 dark:text-amber-200 font-medium">
              {t.chatbot.disclaimer}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm 
                    ${msg.role === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                >
                  {msg.text}
                  {msg.isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-primary-400 animate-pulse align-middle">|</span>}
                  
                  {/* Sources Display */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {t.chatbot.sources}
                      </p>
                      <ul className="space-y-1">
                        {msg.sources.map((src, idx) => (
                          <li key={idx}>
                            <a 
                              href={src.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <ExternalLink className="h-3 w-3" /> {src.title || src.uri}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
             <div className="relative">
               <textarea
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSend();
                   }
                 }}
                 placeholder={t.chatbot.placeholder}
                 className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none max-h-32"
                 rows={1}
               />
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() || isLoading}
                 className="absolute right-2 top-2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 <Send className="h-4 w-4" />
               </button>
             </div>
          </div>

        </div>
      )}
    </>
  );
};