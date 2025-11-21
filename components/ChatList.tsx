import React, { useEffect, useState } from 'react';
import { useApp } from '../store/store';
import { 
  getUserChannels, 
  getUnreadMessageCount,
  initializeStreamClient,
  getStreamClient 
} from '../services/streamService';
import { Channel } from 'stream-chat';
import { MessageSquare, Search, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatListProps {
  onSelectChannel: (channelId: string) => void;
  selectedChannelId: string | null;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectChannel, selectedChannelId }) => {
  const { currentUser } = useApp();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Stream client and load channels
  useEffect(() => {
    if (!currentUser) return;

    const initChat = async () => {
      try {
        setIsLoading(true);
        
        // Initialize Stream client if not already done
        const client = getStreamClient();
        if (!client) {
          await initializeStreamClient(
            currentUser.id,
            currentUser.name,
            currentUser.role
          );
        }

        // Load user channels
        const userChannels = await getUserChannels(currentUser.id);
        setChannels(userChannels);

        // Get unread count
        const count = await getUnreadMessageCount(currentUser.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    // Set up real-time updates
    const client = getStreamClient();
    if (client) {
      // Listen for new messages
      const handleEvent = () => {
        getUserChannels(currentUser.id).then(setChannels);
        getUnreadMessageCount(currentUser.id).then(setUnreadCount);
      };

      client.on('message.new', handleEvent);
      client.on('message.read', handleEvent);
      client.on('notification.message_new', handleEvent);

      return () => {
        client.off('message.new', handleEvent);
        client.off('message.read', handleEvent);
        client.off('notification.message_new', handleEvent);
      };
    }
  }, [currentUser]);

  // Get the other user's name from channel
  const getOtherUserName = (channel: Channel): string => {
    if (!currentUser) return 'Unknown';
    
    const members = Object.values(channel.state.members || {});
    const otherMember = members.find(m => m.user?.id !== currentUser.id);
    return otherMember?.user?.name || 'Unknown User';
  };

  // Get the other user's avatar
  const getOtherUserAvatar = (channel: Channel): string | undefined => {
    if (!currentUser) return undefined;
    
    const members = Object.values(channel.state.members || {});
    const otherMember = members.find(m => m.user?.id !== currentUser.id);
    return otherMember?.user?.image;
  };

  // Get last message preview
  const getLastMessage = (channel: Channel): string => {
    const messages = channel.state.messages;
    if (messages.length === 0) return 'Aucun message';
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.text) return '📎 Fichier';
    return lastMessage.text.length > 50 
      ? lastMessage.text.substring(0, 50) + '...'
      : lastMessage.text;
  };

  // Get last message time
  const getLastMessageTime = (channel: Channel): string => {
    const messages = channel.state.messages;
    if (messages.length === 0) return '';
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.created_at) return '';
    
    try {
      const date = new Date(lastMessage.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        return format(date, 'HH:mm', { locale: fr });
      } else if (diffHours < 168) { // 7 days
        return format(date, 'EEE', { locale: fr });
      } else {
        return format(date, 'dd/MM/yyyy', { locale: fr });
      }
    } catch {
      return '';
    }
  };

  // Get unread count for a channel
  const getChannelUnreadCount = (channel: Channel): number => {
    return channel.countUnread();
  };

  // Filter channels by search query
  const filteredChannels = channels.filter(channel => {
    if (!searchQuery) return true;
    const otherUserName = getOtherUserName(channel).toLowerCase();
    return otherUserName.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark dark:border-brand mx-auto mb-2"></div>
          <p className="text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-navy text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-dark dark:focus:ring-brand"
          />
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Les conversations apparaîtront ici après la réservation d'un rendez-vous
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredChannels.map((channel) => {
              const isSelected = selectedChannelId === channel.id;
              const unread = getChannelUnreadCount(channel);
              const otherUserName = getOtherUserName(channel);
              const otherUserAvatar = getOtherUserAvatar(channel);

              return (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-navy/50 transition-colors ${
                    isSelected ? 'bg-brand/10 dark:bg-brand/20 border-l-4 border-brand-dark dark:border-brand' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherUserAvatar ? (
                        <img
                          src={otherUserAvatar}
                          alt={otherUserName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-dark dark:bg-brand flex items-center justify-center text-white font-semibold">
                          {otherUserName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {unread > 0 && (
                        <div className="absolute -mt-2 ml-8 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unread > 9 ? '9+' : unread}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          unread > 0 
                            ? 'text-navy dark:text-white' 
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {otherUserName}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-shrink-0 ml-2">
                          <Clock className="h-3 w-3" />
                          {getLastMessageTime(channel)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        unread > 0 
                          ? 'text-slate-700 dark:text-slate-200 font-medium' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {getLastMessage(channel)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

