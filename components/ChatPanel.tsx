
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlayerStoryState, GameData, ConversationThread, InboxMessage, EvidenceItem, Character } from '../types';

interface ChatContactDisplayItem {
  characterId: string;
  characterName: string;
  lastMessageTimestamp?: string;
  hasUnread?: boolean;
  lastMessageSnippet?: string;
}

interface ChatPanelProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onMarkAsRead: (threadId: string, messageId?: string) => void;
  onSendMessage: (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ playerState, gameData, onMarkAsRead, onSendMessage }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [chatInputBody, setChatInputBody] = useState<string>('');
  const [chatAttachments, setChatAttachments] = useState<EvidenceItem[]>([]);

  const displayedChatContacts = useMemo(() => {
    if (!playerState.characterDynamicData || !gameData.characters) return [];

    const contacts: ChatContactDisplayItem[] = Object.keys(playerState.characterDynamicData)
      .map(charId => {
        const characterTemplate = gameData.characters[charId];
        if (!characterTemplate) return null;

        const threadId = `thread_${charId}`;
        const thread = playerState.inboxThreads ? playerState.inboxThreads[threadId] : undefined;
        
        let lastMessageSnippet = "メッセージなし";
        if (thread && thread.messages.length > 0) {
            const lastMsg = thread.messages[thread.messages.length -1];
            lastMessageSnippet = lastMsg.body;
            if (lastMsg.attachments && lastMsg.attachments.length > 0) {
                lastMessageSnippet += ` (+${lastMsg.attachments.length}添付)`;
            }
        }


        return {
          characterId: charId,
          characterName: characterTemplate.name,
          lastMessageTimestamp: thread?.lastMessageTimestamp,
          hasUnread: thread?.hasUnread,
          lastMessageSnippet: lastMessageSnippet,
        };
      })
      .filter(contact => contact !== null) as ChatContactDisplayItem[];

    // Sort: unread first (by time), then read (by time), then no threads (by name)
    return contacts.sort((a, b) => {
      const aHasThread = !!a.lastMessageTimestamp;
      const bHasThread = !!b.lastMessageTimestamp;

      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;

      if (aHasThread && bHasThread) {
        return new Date(b.lastMessageTimestamp!).getTime() - new Date(a.lastMessageTimestamp!).getTime();
      }
      if (aHasThread && !bHasThread) return -1; // Active chats before potential chats
      if (!aHasThread && bHasThread) return 1;

      return a.characterName.localeCompare(b.characterName); // Alphabetical for no-thread contacts
    });
  }, [playerState.characterDynamicData, playerState.inboxThreads, gameData.characters]);

  const currentChatThread = selectedCharacterId ? (playerState.inboxThreads ? playerState.inboxThreads[`thread_${selectedCharacterId}`] : null) : null;
  const selectedCharacterTemplate = selectedCharacterId ? gameData.characters[selectedCharacterId] : null;


  const handleCharacterSelect = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId);
    const threadId = `thread_${characterId}`;
    const thread = playerState.inboxThreads ? playerState.inboxThreads[threadId] : null;

    if (thread && thread.hasUnread) {
        thread.messages.forEach(msg => {
            if (msg.type === 'received' && !msg.isRead) {
                onMarkAsRead(threadId, msg.id);
            }
        });
        onMarkAsRead(threadId); // Mark all in thread as read (updates thread.hasUnread)
    }
    setChatInputBody('');
    setChatAttachments([]);
  }, [playerState.inboxThreads, onMarkAsRead]);
  
  useEffect(() => {
    if (selectedCharacterId && !gameData.characters[selectedCharacterId]) {
        const firstAvailableContact = displayedChatContacts.length > 0 ? displayedChatContacts[0] : null;
        setSelectedCharacterId(firstAvailableContact ? firstAvailableContact.characterId : null);
    }
  }, [selectedCharacterId, gameData.characters, displayedChatContacts]);


  useEffect(() => {
    if (displayedChatContacts.length > 0) {
        const currentSelectionStillValid = selectedCharacterId && displayedChatContacts.some(c => c.characterId === selectedCharacterId);
        if (!currentSelectionStillValid) {
            const firstUnread = displayedChatContacts.find(c => c.hasUnread);
            if (firstUnread) {
                handleCharacterSelect(firstUnread.characterId);
            } else {
                handleCharacterSelect(displayedChatContacts[0].characterId);
            }
        }
    } else {
        setSelectedCharacterId(null); 
    }
  }, [displayedChatContacts, selectedCharacterId, handleCharacterSelect]);


  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const evidenceId = event.dataTransfer.getData('text/plain');
    if (evidenceId && gameData.evidence[evidenceId]) {
      const evidenceItemTemplate = gameData.evidence[evidenceId];
      const evidenceItem: EvidenceItem = {
        ...evidenceItemTemplate,
        id: evidenceId, 
        discovered: playerState.discoveredEvidenceIds.includes(evidenceId) 
      };
      if (!chatAttachments.find(att => att.id === evidenceItem.id)) {
        setChatAttachments(prev => [...prev, evidenceItem]);
      }
    }
  };

  const removeAttachment = (evidenceId: string) => {
    setChatAttachments(prev => prev.filter(att => att.id !== evidenceId));
  };

  const handleSendMessageClick = () => {
    if (selectedCharacterId && (chatInputBody.trim() || chatAttachments.length > 0)) {
      onSendMessage(selectedCharacterId, chatInputBody, chatAttachments.map(att => att.id));
      setChatInputBody('');
      setChatAttachments([]);
    }
  };

  const handleChatInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { // metaKey for Cmd on Mac
      event.preventDefault();
      handleSendMessageClick();
    }
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-4 bg-gray-800 border-t-0 border border-gray-700 rounded-b-lg shadow-xl text-gray-300">
      {displayedChatContacts.length === 0 ? (
        <p className="text-gray-400 italic text-center mt-10">連絡可能なキャラクターはいません。</p>
      ) : (
        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 overflow-y-auto pr-2 border-r-0 md:border-r md:border-gray-700 terminal-output mb-2 md:mb-0">
            <h3 className="text-lg font-semibold text-teal-400 mb-2">チャットリスト</h3>
            <ul className="space-y-1">
              {displayedChatContacts.map(contact => (
                <li key={contact.characterId}>
                  <button
                    onClick={() => handleCharacterSelect(contact.characterId)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors ${selectedCharacterId === contact.characterId ? 'bg-gray-700 text-teal-300' : 'text-gray-300 hover:text-teal-400'} ${contact.hasUnread ? 'font-bold' : ''}`}
                    aria-pressed={selectedCharacterId === contact.characterId}
                  >
                    <div className="flex justify-between items-center">
                      <span>{contact.characterName}</span>
                      {contact.hasUnread && <span className="w-2 h-2 bg-teal-400 rounded-full ml-2" title="Unread messages"></span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{contact.lastMessageSnippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-2/3 overflow-y-auto md:pl-2 flex flex-col">
            {selectedCharacterTemplate ? (
              <div className="flex-grow flex flex-col">
                <h3 className="text-lg font-semibold text-teal-400 mb-3 border-b border-gray-700 pb-2">
                  {selectedCharacterTemplate.name} とのチャット
                </h3>
                <div className="space-y-3 overflow-y-auto flex-grow pr-1 mb-3 terminal-output p-2 bg-gray-900 rounded-md min-h-[150px]" role="log">
                  {currentChatThread && currentChatThread.messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg max-w-[85%] clear-both ${msg.type === 'sent' ? 'bg-blue-700 self-end ml-auto float-right' : 'bg-gray-700 self-start mr-auto float-left'}`}
                    >
                      <div className={`text-xs mb-1 ${msg.type === 'sent' ? 'text-blue-300 text-right' : 'text-gray-400 text-left'}`}>
                        <strong>{msg.sender === playerState.username ? 'You' : msg.sender}</strong> - <span className="italic">{formatDate(msg.timestamp)}</span>
                        {msg.type === 'sent' && msg.recipientReadTimestamp && (
                          <span className="ml-2 text-blue-200 opacity-80">
                            既読
                          </span>
                        )}
                        {msg.type === 'received' && !msg.isRead && <span className="ml-2 text-xs text-teal-400">(新規)</span>}
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <p className="text-xs text-gray-400 mb-1">添付ファイル:</p>
                          <ul className="list-disc list-inside pl-1">
                            {msg.attachments.map(att => (
                              <li key={att.id} className="text-xs text-blue-300">
                                {att.title} ({att.id})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {!currentChatThread && (
                    <p className="text-gray-400 italic text-center p-4">
                        {selectedCharacterTemplate.name} とのチャットを開始します。
                    </p>
                  )}
                </div>
                {/* Message Input Area */}
                <div className="mt-auto pt-3 border-t border-gray-700">
                  <textarea
                    rows={3}
                    className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 terminal-output mb-2"
                    value={chatInputBody}
                    onChange={(e) => setChatInputBody(e.target.value)}
                    onKeyDown={handleChatInputKeyDown} // Added keydown handler
                    placeholder={`${selectedCharacterTemplate.name}にメッセージを送信 (Ctrl+Enterで送信)`}
                    aria-label="Chat message input"
                    disabled={!selectedCharacterId}
                  />
                  <div 
                    className={`mb-2 p-2 border-2 border-dashed rounded-md min-h-[40px] ${selectedCharacterId ? 'border-gray-600 hover:border-teal-500' : 'border-gray-700 bg-gray-850 cursor-not-allowed'}`}
                    onDragOver={selectedCharacterId ? handleDragOver : undefined}
                    onDrop={selectedCharacterId ? handleDrop : undefined}
                    aria-label="Drop attachments here"
                    aria-disabled={!selectedCharacterId}
                  >
                    {chatAttachments.length === 0 ? (
                      <p className="text-gray-500 text-center text-xs">Data Repositoryから証拠をドラッグ＆ドロップして添付</p>
                    ) : (
                      <ul className="flex flex-wrap gap-1">
                        {chatAttachments.map(att => (
                          <li key={att.id} className="flex items-center bg-gray-700 p-1 rounded text-xs">
                            <span>{att.title}</span>
                            <button onClick={() => removeAttachment(att.id)} className="ml-1.5 text-red-400 hover:text-red-300 text-xs" aria-label={`Remove ${att.title}`}>✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button 
                    onClick={handleSendMessageClick}
                    className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedCharacterId || (!chatInputBody.trim() && chatAttachments.length === 0)}
                  >
                    送信
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">チャットする連絡先を選択してください。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
