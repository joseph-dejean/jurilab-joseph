import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/store';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { MessageSquare } from 'lucide-react';

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

  // Récupérer le channel depuis l'URL si présent
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
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-navy-dark">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-brand-dark dark:text-brand" />
            {t.dashboard.messages}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {currentUser.role === 'LAWYER' 
              ? 'Communiquez avec vos clients'
              : 'Communiquez avec vos avocats'}
          </p>
        </div>

        {/* Chat Layout */}
        <div className="bg-white dark:bg-navy rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="flex h-full">
            {/* Chat List - Left Side */}
            <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col">
              <ChatList 
                onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
                selectedChannelId={selectedChannelId}
              />
            </div>

            {/* Chat Window - Right Side */}
            <div className="hidden md:flex md:w-2/3 flex-col">
              {selectedChannelId ? (
                <ChatWindow channelId={selectedChannelId} />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-navy/50">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Sélectionnez une conversation pour commencer
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Show ChatWindow as overlay when channel selected */}
            {selectedChannelId && (
              <div className="md:hidden absolute inset-0 z-50 bg-white dark:bg-navy">
                <ChatWindow 
                  channelId={selectedChannelId} 
                  onBack={() => setSelectedChannelId(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

