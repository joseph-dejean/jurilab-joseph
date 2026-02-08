import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Mic, X, Loader2 } from 'lucide-react';
import { parseNaturalLanguageEvent, answerScheduleQuery } from '../../services/calendarGeminiService';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent, EventSource } from '../../types/calendarTypes';

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  
  const { addEvent, events, apiKey, isGoogleAuthModalOpen, closeGoogleAuthModal } = useCalendar();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!apiKey) {
        setResponseMessage("Veuillez d'abord configurer votre clé API (bouton Connecter Google Agenda) pour activer l'IA.");
        setIsError(true);
        return;
    }

    setIsProcessing(true);
    setResponseMessage(null);
    setIsError(false);

    const creationKeywords = /(add|create|book|schedule|remind|set|new|meeting|lunch|dinner|call|appointment|ajouter|créer|réserver|planifier|rappel|nouveau|réunion|déjeuner|dîner|appel|rendez-vous)/i;
    const questionKeywords = /^(what|when|where|how|check|show|list|do i have|quoi|quand|où|comment|vérifier|montrer|lister|ai-je)/i;

    let isCreation = creationKeywords.test(input) && !questionKeywords.test(input);

    try {
        if (isCreation) {
            const parsedEvent = await parseNaturalLanguageEvent(input, new Date(), apiKey);
            
            if (parsedEvent) {
                const newEvent: CalendarEvent = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: parsedEvent.title,
                    start: new Date(parsedEvent.start),
                    end: new Date(parsedEvent.end),
                    description: parsedEvent.description,
                    location: parsedEvent.location,
                    isAllDay: parsedEvent.isAllDay,
                    source: EventSource.LOCAL,
                    color: '#be123c' // Bordeaux for AI events
                };
                
                if (isNaN(newEvent.start.getTime()) || isNaN(newEvent.end.getTime())) {
                     // Sometimes AI returns invalid dates if context is weird
                     console.error("AI returned invalid date:", parsedEvent);
                     setResponseMessage("Je n'ai pas réussi à comprendre la date. Pouvez-vous préciser ?");
                     setIsError(true);
                } else {
                    addEvent(newEvent);
                    setResponseMessage(`Succès ! "${parsedEvent.title}" ajouté le ${newEvent.start.toLocaleDateString('fr-FR')} à ${newEvent.start.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`);
                    setInput('');
                }
            } else {
                console.warn("Parsing returned null, falling back to query.");
                const answer = await answerScheduleQuery(input, events, new Date(), apiKey);
                setResponseMessage(answer);
            }
        } else {
            const answer = await answerScheduleQuery(input, events, new Date(), apiKey);
            setResponseMessage(answer);
        }
    } catch (err) {
        console.error("AI Assistant Error:", err);
        setIsError(true);
        setResponseMessage("J'ai eu du mal à traiter cette demande. Vérifiez votre clé API.");
    }
    
    setIsProcessing(false);
  };

  return (
    <>
        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
                fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-lg transition-all duration-300
                ${isOpen ? 'bg-white text-gray-500 rotate-45' : 'bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:scale-110'}
            `}
        >
            {isOpen ? <PlusIcon className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        </button>

        {/* Floating Panel */}
        {isOpen && (
            <div className="fixed bottom-24 right-8 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-600 to-pink-700 p-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Assistant IA
                        </h3>
                        <p className="text-rose-100 text-xs mt-1">
                            Essayez "Ajoute une réunion avec Jean demain à 14h"
                        </p>
                    </div>

                    <div className="p-4">
                        {responseMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-rose-50 text-rose-900 border border-rose-100'}`}>
                                {responseMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tapez votre commande..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-rose-500 rounded-xl text-sm transition-all outline-none border-2"
                                disabled={isProcessing}
                            />
                            
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                                <button
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Commandes vocales bientôt disponibles"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isProcessing || !input.trim()}
                                    className="p-1.5 bg-rose-700 text-white rounded-lg hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
