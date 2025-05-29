
import React from 'react';
import { PlayerStoryState, GameData, ConversationThread, InboxMessage, AppState, WhisperTalkAppData } from '../../types';
import { ChevronLeftIcon, PaperAirplaneIcon, CameraIconSolid, MicrophoneIcon, UserCircleIcon } from '../icons';

interface WhisperTalkAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
  onSendMessage: (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => void;
  onMarkAsRead: (threadId: string, messageId?: string) => void;
}

const WhisperTalkApp: React.FC<WhisperTalkAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
  onSendMessage, // Placeholder for now
  onMarkAsRead
}) => {
  const appState = playerState.smartphoneInstalledApps['whispertalk'];
  const appData = appState.appSpecificData as WhisperTalkAppData;

  const threads = Object.values(playerState.inboxThreads).sort((a, b) => 
    new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
  );

  const setCurrentView = (view: 'chat_list' | 'chat_screen', threadId?: string) => {
    const newAppData: WhisperTalkAppData = { currentView: view, selectedThreadId: threadId };
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'whispertalk': {
          ...appState,
          appSpecificData: newAppData,
        },
      },
    });
    if (view === 'chat_screen' && threadId) {
        onMarkAsRead(threadId); // Mark all messages in thread as read when opening
    }
  };
  
  const selectedThread = appData.selectedThreadId ? playerState.inboxThreads[appData.selectedThreadId] : null;

  const getContactDisplay = (thread: ConversationThread) => {
    if (thread.groupName) return { name: thread.groupName, avatar: null }; // Group avatar placeholder
    const contactId = thread.participants.find(pId => pId !== 'player');
    const character = contactId ? gameData.characters[contactId] : null;
    const contactDef = character?.smartphoneContactId ? gameData.smartphoneContacts?.find(c => c.id === character.smartphoneContactId) : null;
    return {
      name: character?.name || 'Unknown Contact',
      avatar: contactDef?.profilePictureUrl,
    };
  };


  if (appData.currentView === 'chat_screen' && selectedThread) {
    const { name: contactName, avatar: contactAvatar } = getContactDisplay(selectedThread);
    return (
      <div className="h-full flex flex-col bg-gray-800/30 text-white">
        {/* Header */}
        <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm">
          <button onClick={() => setCurrentView('chat_list')} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Back to chat list">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          {contactAvatar ? (
            <img src={contactAvatar} alt={contactName} className="w-8 h-8 rounded-full mr-3" />
          ) : (
            <UserCircleIcon className="w-8 h-8 rounded-full mr-3 text-gray-400" />
          )}
          <h2 className="text-lg font-semibold truncate">{contactName}</h2>
          {/* Placeholder call/video icons */}
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {selectedThread.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === 'player' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-2.5 rounded-xl shadow ${msg.senderId === 'player' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p className={`text-xs mt-1 ${msg.senderId === 'player' ? 'text-purple-200' : 'text-gray-400'} text-opacity-80`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area - Placeholder */}
        <div className="p-3 border-t border-white/10 bg-black/50 backdrop-blur-md">
          <div className="flex items-center bg-gray-700 rounded-full p-1">
            <input type="text" placeholder="Type a message..." className="flex-grow bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-gray-400" disabled />
            <button className="p-2 text-gray-400 hover:text-purple-400" aria-label="Attach file"><CameraIconSolid className="w-5 h-5" /></button>
            <button className="p-2 text-gray-400 hover:text-purple-400" aria-label="Record voice message"><MicrophoneIcon className="w-5 h-5" /></button>
            <button className="p-2 text-purple-500 hover:text-purple-400" aria-label="Send message"><PaperAirplaneIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    );
  }

  // Chat List View (Default)
  return (
    <div className="h-full flex flex-col text-white">
      <div className="p-4 sticky top-0 bg-black/50 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold text-purple-300 mb-1">Chats</h1>
         {/* Placeholder Search */}
      </div>
      <div className="flex-grow overflow-y-auto scrollbar-hide">
        {threads.length === 0 && (
          <p className="text-center text-gray-400 mt-10">No conversations yet.</p>
        )}
        {threads.map((thread) => {
          const lastMessage = thread.messages[thread.messages.length - 1];
          const { name: contactName, avatar: contactAvatar } = getContactDisplay(thread);
          return (
            <button
              key={thread.threadId}
              onClick={() => setCurrentView('chat_screen', thread.threadId)}
              className={`w-full flex items-center p-3 hover:bg-white/5 transition-colors text-left ${thread.hasUnread ? 'bg-purple-500/10' : ''}`}
              aria-label={`Chat with ${contactName}`}
            >
              {contactAvatar ? (
                <img src={contactAvatar} alt={contactName} className="w-10 h-10 rounded-full mr-3" />
              ) : (
                <UserCircleIcon className="w-10 h-10 rounded-full mr-3 text-gray-400" />
              )}
              <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-baseline">
                  <h3 className={`font-semibold truncate ${thread.hasUnread ? 'text-purple-300' : 'text-gray-100'}`}>{contactName}</h3>
                  {lastMessage && (
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {lastMessage && (
                  <p className={`text-sm truncate ${thread.hasUnread ? 'text-gray-200' : 'text-gray-400'}`}>
                    {lastMessage.senderId !== 'player' && !thread.groupName && `${gameData.characters[lastMessage.senderId]?.name || 'Them'}: `}
                    {lastMessage.body}
                  </p>
                )}
              </div>
              {thread.hasUnread && (
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full ml-2 flex-shrink-0"></span>
              )}
            </button>
          );
        })}
      </div>
       {/* Placeholder FAB for new message */}
    </div>
  );
};

export default WhisperTalkApp;
