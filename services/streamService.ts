/**
 * GetStream.io Chat Service
 * Gère les interactions avec l'API GetStream.io pour la messagerie
 */

import { StreamChat, Channel, User as StreamUser } from 'stream-chat';

// Configuration depuis les variables d'environnement
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || '';
const STREAM_API_SECRET = import.meta.env.VITE_STREAM_API_SECRET || '';
const STREAM_APP_ID = import.meta.env.VITE_STREAM_APP_ID || '';

// Debug log
if (typeof window !== 'undefined') {
  console.log('🔧 Stream API Key loaded:', STREAM_API_KEY ? '✅ Yes' : '❌ No');
  console.log('🔧 Stream App ID loaded:', STREAM_APP_ID ? '✅ Yes' : '❌ No');
}

// Instance globale du client Stream (singleton)
let streamClient: StreamChat | null = null;

/**
 * Initialise et connecte un utilisateur au client Stream Chat
 * @param userId ID de l'utilisateur (doit correspondre à l'ID Firebase)
 * @param userName Nom de l'utilisateur
 * @param userRole Rôle de l'utilisateur (pour les permissions)
 */
export const initializeStreamClient = async (
  userId: string,
  userName: string,
  userRole: string
): Promise<StreamChat> => {
  if (!STREAM_API_KEY) {
    throw new Error('VITE_STREAM_API_KEY is not configured');
  }

  if (!STREAM_APP_ID) {
    throw new Error('VITE_STREAM_APP_ID is not configured');
  }

  try {
    // Créer une nouvelle instance si elle n'existe pas
    if (!streamClient) {
      streamClient = StreamChat.getInstance(STREAM_API_KEY);
    }

    // Générer un token côté client (pour le développement)
    // En production, ce token devrait être généré côté serveur
    const token = await generateStreamToken(userId);

    // Connecter l'utilisateur avec le token
    await streamClient.connectUser(
      {
        id: userId,
        name: userName,
        role: userRole.toLowerCase(), // GetStream utilise des rôles en lowercase
      },
      token
    );

    console.log('✅ Stream client connected for user:', userId);
    return streamClient;
  } catch (error) {
    console.error('❌ Error initializing Stream client:', error);
    throw error;
  }
};

/**
 * Génère un token Stream pour un utilisateur
 * NOTE: En production, cette fonction devrait être appelée côté serveur
 * Pour le développement, on génère un token JWT signé côté client
 */
const generateStreamToken = async (userId: string): Promise<string> => {
  // IMPORTANT: En production, cette fonction doit être remplacée par un appel à votre backend
  // Le backend doit utiliser STREAM_API_SECRET pour générer un token sécurisé
  
  if (!STREAM_API_SECRET) {
    console.warn('⚠️ STREAM_API_SECRET not set. Cannot generate valid token.');
    throw new Error('STREAM_API_SECRET is required to generate tokens. Please set it in your .env file.');
  }

  try {
    // Utiliser la bibliothèque jose pour générer un JWT valide
    const { SignJWT } = await import('jose');
    
    // Convertir la clé secrète en format Uint8Array pour jose
    const secretKey = new TextEncoder().encode(STREAM_API_SECRET);
    
    // Créer le token JWT selon la spécification GetStream
    // GetStream attend : user_id dans le payload, iat et exp dans les claims
    // Note: GetStream peut être strict sur le timing, donc on utilise le timestamp actuel
    const now = Math.floor(Date.now() / 1000);
    
    const token = await new SignJWT({
      user_id: userId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now - 5) // iat : 5 secondes dans le passé pour éviter les problèmes de timing
      .setExpirationTime(now + 3600) // exp : expire dans 1 heure
      .sign(secretKey);
    
    console.log('✅ Token generated successfully for user:', userId);
    return token;
  } catch (error) {
    console.error('❌ Error generating Stream token:', error);
    throw new Error('Failed to generate Stream token. Make sure STREAM_API_SECRET is set correctly.');
  }
};

/**
 * Déconnecte l'utilisateur du client Stream
 */
export const disconnectStreamClient = async (): Promise<void> => {
  if (streamClient) {
    try {
      await streamClient.disconnectUser();
      console.log('✅ Stream client disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting Stream client:', error);
    }
  }
};

/**
 * Récupère l'instance du client Stream (si déjà initialisé)
 */
export const getStreamClient = (): StreamChat | null => {
  return streamClient;
};

/**
 * Génère un hash court à partir d'une chaîne (pour créer des IDs de channel courts)
 */
const generateShortHash = async (input: string): Promise<string> => {
  // Utiliser l'API SubtleCrypto du navigateur pour créer un hash SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Prendre les 16 premiers caractères du hash (32 caractères en hex)
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  return hashHex;
};

// Note: La création d'utilisateurs via API REST nécessite un backend
// GetStream créera automatiquement les utilisateurs lors de leur première connexion

/**
 * Crée ou récupère un channel de chat entre un avocat et un client
 * @param lawyerId ID de l'avocat
 * @param clientId ID du client
 * @param appointmentId ID de l'appointment (optionnel, pour lier le channel)
 * @returns Le channel GetStream créé ou existant
 */
export const createOrGetChatChannel = async (
  lawyerId: string,
  clientId: string,
  appointmentId?: string
): Promise<Channel> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized. Call initializeStreamClient first.');
  }

  // Vérifier si le client est connecté
  const currentUserId = streamClient.userID;
  if (!currentUserId) {
    throw new Error('Stream client is not connected. Please reconnect before creating a channel.');
  }

  try {
    // Récupérer les noms pour le channel
    const { getUserProfile } = await import('./firebaseService');
    const [lawyerProfile, clientProfile] = await Promise.all([
      getUserProfile(lawyerId).catch(() => null),
      getUserProfile(clientId).catch(() => null),
    ]);

    // Créer un ID de channel unique
    const combinedIds = `${lawyerId}-${clientId}`;
    const hash = await generateShortHash(combinedIds);
    const channelId = `chat-${hash}`;
    const channelType = 'messaging';

    // Vérifier si le channel existe déjà
    const channels = await streamClient.queryChannels({
      type: channelType,
      id: channelId,
    });

    let channel: Channel;

    if (channels.length > 0) {
      channel = channels[0];
      console.log('✅ Existing channel found:', channelId);
    } else {
      // Déterminer le nom du channel (seulement le nom de l'interlocuteur)
      const otherUserName = currentUserId === lawyerId 
        ? (clientProfile?.name || 'Client')
        : (lawyerProfile?.name || 'Avocat');
      
      // Créer le channel SANS membres d'abord (pour éviter l'erreur)
      channel = streamClient.channel(channelType, channelId, {
        name: otherUserName, // Seulement le nom de l'interlocuteur
        created_by_id: currentUserId,
        appointmentId: appointmentId || undefined,
        lawyerId,
        clientId,
        clientCanMessage: true, // Par défaut, le client peut envoyer des messages
      });

      await channel.create();
      
      // Ajouter les membres APRÈS la création (GetStream créera les utilisateurs automatiquement)
      await channel.addMembers([lawyerId, clientId]);
      
      // Initialiser la permission dans Firebase (par défaut, le client peut envoyer des messages)
      try {
        const { ref, set } = await import('firebase/database');
        const { database } = await import('../firebaseConfig');
        const permissionRef = ref(database, `chatPermissions/${channelId}`);
        await set(permissionRef, {
          clientCanMessage: true,
          lawyerId,
          clientId,
          channelId,
        });
        console.log('✅ Chat permission initialized in Firebase');
      } catch (firebaseError) {
        console.warn('⚠️ Error initializing chat permission in Firebase (non-blocking):', firebaseError);
      }
      
      console.log('✅ New channel created:', channelId);
    }

    return channel;
  } catch (error) {
    console.error('❌ Error creating/getting chat channel:', error);
    throw error;
  }
};

/**
 * Récupère tous les channels d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Liste des channels
 */
export const getUserChannels = async (userId: string): Promise<Channel[]> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized. Call initializeStreamClient first.');
  }

  try {
    // Récupérer tous les channels où l'utilisateur est membre
    const channels = await streamClient.queryChannels({
      members: { $in: [userId] },
      type: 'messaging',
    });

    // Trier par dernier message (plus récent en premier)
    channels.sort((a, b) => {
      const aLastMessage = a.state.messages[a.state.messages.length - 1];
      const bLastMessage = b.state.messages[b.state.messages.length - 1];
      
      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;
      
      return new Date(bLastMessage.created_at || 0).getTime() - 
             new Date(aLastMessage.created_at || 0).getTime();
    });

    return channels;
  } catch (error) {
    console.error('❌ Error getting user channels:', error);
    throw error;
  }
};

/**
 * Récupère un channel par son ID
 * @param channelId ID du channel
 * @returns Le channel ou null si non trouvé
 */
export const getChannelById = async (channelId: string): Promise<Channel | null> => {
  if (!streamClient) {
    throw new Error('Stream client not initialized. Call initializeStreamClient first.');
  }

  try {
    const channels = await streamClient.queryChannels({
      id: channelId,
      type: 'messaging',
    });

    return channels.length > 0 ? channels[0] : null;
  } catch (error) {
    console.error('❌ Error getting channel by ID:', error);
    return null;
  }
};

/**
 * Récupère le nombre de messages non lus pour un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Nombre de messages non lus
 */
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  if (!streamClient) {
    return 0;
  }

  try {
    const channels = await getUserChannels(userId);
    let unreadCount = 0;

    for (const channel of channels) {
      const unread = channel.countUnread();
      unreadCount += unread;
    }

    return unreadCount;
  } catch (error) {
    console.error('❌ Error getting unread message count:', error);
    return 0;
  }
};

/**
 * Active ou désactive la permission du client d'envoyer des messages
 * Stocke la permission dans Firebase au lieu de GetStream (pour éviter les problèmes de permissions)
 * @param channelId ID du channel
 * @param clientCanMessage true pour autoriser, false pour interdire
 */
export const toggleClientMessagePermission = async (
  channelId: string,
  clientCanMessage: boolean
): Promise<void> => {
  try {
    const { ref, get, set } = await import('firebase/database');
    const { database } = await import('../firebaseConfig');
    
    // Récupérer le channel pour obtenir lawyerId et clientId
    const channel = await getChannelById(channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }
    
    const lawyerId = channel.data?.lawyerId as string;
    const clientId = channel.data?.clientId as string;
    
    if (!lawyerId || !clientId) {
      throw new Error('Channel missing lawyerId or clientId');
    }
    
    // Vérifier si la permission existe déjà
    const permissionRef = ref(database, `chatPermissions/${channelId}`);
    const snapshot = await get(permissionRef);
    
    if (snapshot.exists()) {
      // Mettre à jour seulement clientCanMessage
      const { update } = await import('firebase/database');
      await update(permissionRef, { clientCanMessage });
    } else {
      // Créer la permission avec toutes les infos nécessaires
      await set(permissionRef, {
        clientCanMessage,
        lawyerId,
        clientId,
        channelId,
      });
    }
    
    console.log(`✅ Client message permission ${clientCanMessage ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('❌ Error toggling client message permission:', error);
    throw error;
  }
};

/**
 * Récupère la permission du client d'envoyer des messages depuis Firebase
 * @param channelId ID du channel
 * @returns true si le client peut envoyer des messages, false sinon (défaut: true)
 */
export const getClientMessagePermission = async (
  channelId: string
): Promise<boolean> => {
  try {
    const { ref, get } = await import('firebase/database');
    const { database } = await import('../firebaseConfig');
    
    const permissionRef = ref(database, `chatPermissions/${channelId}/clientCanMessage`);
    const snapshot = await get(permissionRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as boolean;
    }
    
    // Par défaut, le client peut envoyer des messages
    return true;
  } catch (error) {
    console.error('❌ Error getting client message permission:', error);
    // En cas d'erreur, on autorise par défaut
    return true;
  }
};

