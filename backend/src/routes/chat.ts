/**
 * Chat Routes - API pour le chat avec historique
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { streamChat, chat } from '../services/geminiService.js';
import {
  createConversation,
  getConversation,
  getConversationsByLawyer,
  addMessageToConversation,
  updateConversationTitle,
  deleteConversation,
} from '../services/firebaseService.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const CreateConversationSchema = z.object({
  lawyerId: z.string().min(1),
  title: z.string().optional().default('Nouvelle conversation'),
  metadata: z.object({
    mode: z.enum(['chat', 'document_generation']).optional(),
    documentType: z.string().optional(),
  }).optional(),
});

const SendMessageSchema = z.object({
  conversationId: z.string().min(1),
  message: z.string().min(1).max(10000),
  lawyerId: z.string().min(1),
  stream: z.boolean().optional().default(true),
  contextData: z.object({
    userName: z.string().optional(),
    currentTime: z.string().optional(),
    appointments: z.object({
      upcoming: z.array(z.any()).optional(),
      recent: z.array(z.any()).optional(),
    }).optional(),
  }).optional(),
});

const SendMessageNoHistorySchema = z.object({
  message: z.string().min(1).max(10000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional().default([]),
  stream: z.boolean().optional().default(true),
  contextData: z.object({
    userName: z.string().optional(),
    currentTime: z.string().optional(),
  }).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/conversations/:lawyerId
 * Récupère toutes les conversations d'un avocat
 */
router.get('/conversations/:lawyerId', async (req: Request, res: Response) => {
  try {
    const lawyerId = req.params.lawyerId as string;
    const conversations = await getConversationsByLawyer(lawyerId);
    
    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations',
    });
  }
});

/**
 * GET /api/chat/conversation/:conversationId
 * Récupère une conversation spécifique
 */
router.get('/conversation/:conversationId', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation',
    });
  }
});

/**
 * POST /api/chat/conversation
 * Crée une nouvelle conversation
 */
router.post('/conversation', async (req: Request, res: Response) => {
  try {
    const validation = CreateConversationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { lawyerId, title, metadata } = validation.data;
    const conversation = await createConversation(lawyerId, title, metadata);

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
    });
  }
});

/**
 * POST /api/chat/send
 * Envoie un message dans une conversation existante (avec historique)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const validation = SendMessageSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { conversationId, message, lawyerId, stream, contextData } = validation.data;

    // Récupérer la conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Vérifier que l'avocat est bien le propriétaire
    if (conversation.lawyerId !== lawyerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Ajouter le message utilisateur ORIGINAL à l'historique
    await addMessageToConversation(conversationId, 'user', message);

    // Préparer l'historique pour Gemini
    const history = (conversation.messages || []).map(msg => ({
      role: msg.role,
      text: msg.text,
    }));

    if (stream) {
      // Mode streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      for await (const chunk of streamChat(history, message, contextData)) {
        if (chunk.error) {
          res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
          break;
        }
        if (chunk.text) {
          fullResponse += chunk.text;
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      // Sauvegarder la réponse complète (pas besoin de dé-anonymiser pour le stockage)
      if (fullResponse) {
        await addMessageToConversation(conversationId, 'model', fullResponse);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Mode non-streaming
      const response = await chat(history, message);
      await addMessageToConversation(conversationId, 'model', response);

      res.json({
        success: true,
        data: {
          response,
          conversationId,
        },
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

/**
 * POST /api/chat/quick
 * Chat rapide sans sauvegarder l'historique (pour le chatbot public)
 */
router.post('/quick', async (req: Request, res: Response) => {
  try {
    const validation = SendMessageNoHistorySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: validation.error.errors,
      });
    }

    const { message, history, stream, contextData } = validation.data;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of streamChat(history, message, contextData)) {
        if (chunk.error) {
          res.write(`data: ${JSON.stringify({ error: chunk.error })}\n\n`);
          break;
        }
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await chat(history, message);
      res.json({
        success: true,
        data: { 
          response,
        },
      });
    }
  } catch (error) {
    console.error('Error in quick chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
    });
  }
});

/**
 * PATCH /api/chat/conversation/:conversationId/title
 * Met à jour le titre d'une conversation
 */
router.patch('/conversation/:conversationId/title', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    await updateConversationTitle(conversationId, title);

    res.json({
      success: true,
      message: 'Title updated',
    });
  } catch (error) {
    console.error('Error updating title:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update title',
    });
  }
});

/**
 * DELETE /api/chat/conversation/:conversationId
 * Supprime une conversation
 */
router.delete('/conversation/:conversationId', async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.conversationId as string;
    await deleteConversation(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
    });
  }
});

export default router;
