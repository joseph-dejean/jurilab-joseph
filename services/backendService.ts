/**
 * Backend Service - Manages conversations and AI interactions
 */

import { supabase } from '../supabaseClient';
import { sendMessageToGemini } from './geminiService';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConversationMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  lawyerId: string;
  title: string;
  messages?: Record<string, ConversationMessage>;
  createdAt: string;
  updatedAt: string;
}

interface ContextData {
  userName?: string;
  currentTime?: string;
  appointments?: {
    upcoming: any[];
    recent: any[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function rowToConversation(row: any): Conversation {
  return {
    id: row.id,
    lawyerId: row.user_id,
    title: row.title || 'Nouvelle conversation',
    messages: row.messages || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getConversations(lawyerId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', lawyerId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error('Failed to load conversations');
  return (data || []).map(rowToConversation);
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !data) return null;
  return rowToConversation(data);
}

export async function createConversation(lawyerId: string, title: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: lawyerId, title, messages: [] })
    .select()
    .single();

  if (error) throw new Error('Failed to create conversation');
  return rowToConversation(data);
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);
  if (error) throw new Error('Failed to update conversation title');
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);
  if (error) throw new Error('Failed to delete conversation');
}

async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'model',
  text: string
): Promise<ConversationMessage> {
  const message: ConversationMessage = {
    id: Date.now().toString(),
    role,
    text,
    timestamp: new Date().toISOString(),
  };

  // messages is a JSONB array — fetch current, append, update
  const { data: current } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();

  const messages = Array.isArray(current?.messages) ? current.messages : [];
  messages.push(message);

  const { error } = await supabase
    .from('conversations')
    .update({ messages })
    .eq('id', conversationId);

  if (error) throw new Error('Failed to add message');
  return message;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI STREAMING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a message and stream the response
 */
export async function* sendMessageStream(
  conversationId: string,
  message: string,
  lawyerId: string,
  contextData?: ContextData
): AsyncGenerator<{ text?: string; error?: string; done?: boolean }> {
  try {
    // Add user message to conversation
    await addMessageToConversation(conversationId, 'user', message);
    
    // Get conversation history
    const conversation = await getConversation(conversationId);
    const history: ConversationMessage[] = Array.isArray(conversation?.messages)
      ? (conversation.messages as ConversationMessage[]).sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      : [];
    
    // Build context for AI
    let contextPrompt = '';
    if (contextData) {
      contextPrompt = `\n\n--- Contexte ---\n`;
      if (contextData.userName) {
        contextPrompt += `Utilisateur: ${contextData.userName}\n`;
      }
      if (contextData.currentTime) {
        contextPrompt += `Date/Heure actuelle: ${contextData.currentTime}\n`;
      }
      if (contextData.appointments) {
        if (contextData.appointments.upcoming.length > 0) {
          contextPrompt += `\nRendez-vous à venir:\n`;
          contextData.appointments.upcoming.forEach((apt: any) => {
            contextPrompt += `- ${apt.formattedDate}: ${apt.clientName} (${apt.type})\n`;
          });
        }
        if (contextData.appointments.recent.length > 0) {
          contextPrompt += `\nRendez-vous récents:\n`;
          contextData.appointments.recent.forEach((apt: any) => {
            contextPrompt += `- ${apt.formattedDate}: ${apt.clientName} (${apt.status})\n`;
          });
        }
      }
      contextPrompt += `--- Fin du contexte ---\n\n`;
    }
    
    // Stream response from Gemini
    let fullResponse = '';
    const enhancedMessage = contextPrompt + message;
    
    const stream = sendMessageToGemini(enhancedMessage, history.slice(-10)); // Last 10 messages for context
    
    for await (const chunk of stream) {
      if (chunk.error) {
        yield { error: chunk.error };
        return;
      }
      
      if (chunk.text) {
        fullResponse += chunk.text;
        yield { text: chunk.text };
      }
      
      if (chunk.done) {
        break;
      }
    }
    
    // Save the complete response to the conversation
    if (fullResponse) {
      await addMessageToConversation(conversationId, 'model', fullResponse);
    }
    
    yield { done: true };
  } catch (error) {
    console.error('Error in sendMessageStream:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    yield { error: errorMessage };
  }
}
