import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/store';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { currentUser, t } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Get channel from URL if present
  useEffect(() => {
    const channelParam = searchParams.get('channel');
    if (channelParam) {
      setSelectedChannelId(channelParam);
    }
  }, [searchParams]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-surface-50 dark:bg-deep-950">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-deep-500 hover:text-deep-700 dark:hover:text-surface-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-display-sm font-serif text-deep-900 dark:text-surface-100">
                {t.dashboard.messages}
              </h1>
              <p className="text-deep-600 dark:text-surface-400">
                {currentUser.role === 'LAWYER' 
                  ? 'Communiquez avec vos clients'
                  : 'Communiquez avec vos avocats'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Layout */}
        <div className="glass rounded-2xl overflow-hidden shadow-glass-lg" style={{ height: 'calc(100vh - 280px)' }}>
          <div className="flex h-full">
            {/* Chat List - Left Side */}
            <div className={`w-full md:w-96 border-r border-surface-200 dark:border-deep-800 flex flex-col ${
              selectedChannelId ? 'hidden md:flex' : 'flex'
            }`}>
              <ChatList 
                onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
                selectedChannelId={selectedChannelId}
              />
            </div>

            {/* Chat Window - Right Side */}
            <div className={`flex-1 flex flex-col ${
              selectedChannelId ? 'flex' : 'hidden md:flex'
            }`}>
              {selectedChannelId ? (
                <ChatWindow 
                  channelId={selectedChannelId} 
                  onBack={() => setSelectedChannelId(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-surface-50 dark:bg-deep-900/50">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-surface-100 dark:bg-deep-800 flex items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-deep-300 dark:text-deep-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-deep-700 dark:text-surface-300 mb-2">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-deep-500 dark:text-surface-500 max-w-xs mx-auto">
                      Choisissez un contact dans la liste pour commencer à discuter
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
