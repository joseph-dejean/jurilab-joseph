/**
 * Backend Service - Manages conversations and AI interactions
 */

import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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
// FIRESTORE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all conversations for a lawyer
 */
export async function getConversations(lawyerId: string): Promise<Conversation[]> {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('lawyerId', '==', lawyerId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        lawyerId: data.lawyerId,
        title: data.title,
        messages: data.messages || {},
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw new Error('Failed to load conversations');
  }
}

/**
 * Get a single conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      lawyerId: data.lawyerId,
      title: data.title,
      messages: data.messages || {},
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw new Error('Failed to load conversation');
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(lawyerId: string, title: string): Promise<Conversation> {
  try {
    const conversationsRef = collection(db, 'conversations');
    const now = serverTimestamp();
    
    const docRef = await addDoc(conversationsRef, {
      lawyerId,
      title,
      messages: {},
      createdAt: now,
      updatedAt: now,
    });
    
    return {
      id: docRef.id,
      lawyerId,
      title,
      messages: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    await updateDoc(docRef, {
      title,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating conversation title:', error);
    throw new Error('Failed to update conversation title');
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw new Error('Failed to delete conversation');
  }
}

/**
 * Add a message to a conversation
 */
async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'model',
  text: string
): Promise<ConversationMessage> {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    const messageId = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    const message: ConversationMessage = {
      id: messageId,
      role,
      text,
      timestamp,
    };
    
    await updateDoc(docRef, {
      [`messages.${messageId}`]: message,
      updatedAt: serverTimestamp(),
    });
    
    return message;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    throw new Error('Failed to add message');
  }
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
    const history = conversation?.messages 
      ? Object.values(conversation.messages).sort((a, b) => 
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
