


import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PlayerStoryState, GameData, EvidenceItem, Character, TerminalChatMessage } from '../types';

interface ChatContactDisplayItem {
  characterId: string;
  characterName: string;
  tagline?: string; 
  hasUnread?: boolean;
}

interface ChatPanelProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onMarkAsRead: (characterId: string, messageId?: string) => void; 
  onSendMessage: (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ playerState, gameData, onMarkAsRead, onSendMessage }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [chatInputBody, setChatInputBody] = useState<string>('');
  const [chatAttachments, setChatAttachments] = useState<EvidenceItem[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const displayedChatContacts = useMemo(() => {
    if (!gameData.characters || !playerState.characterDynamicData) return [];

    const contacts: ChatContactDisplayItem[] = Object.values(gameData.characters)
      .filter(charTemplate => {
        return charTemplate && playerState.characterDynamicData[charTemplate.id]?.canChatTerminal === true;
      })
      .map(charTemplate => {
        if (!charTemplate) return null; 
        const thread = playerState.terminalChatThreads?.[charTemplate.id];
        const hasUnreadMessages = thread?.messages.some(msg => msg.senderId === charTemplate.id && !msg.isReadByPlayer) || false;
        return {
          characterId: charTemplate.id,
          characterName: charTemplate.name,
          tagline: `ターミナルチャット可能`,
          hasUnread: hasUnreadMessages,
        };
      })
      .filter(contact => contact !== null) as ChatContactDisplayItem[];

    // Sort by unread status first, then by name
    return contacts.sort((a, b) => {
        if (a.hasUnread && !b.hasUnread) return -1;
        if (!a.hasUnread && b.hasUnread) return 1;
        return a.characterName.localeCompare(b.characterName);
    });
  }, [gameData.characters, playerState.characterDynamicData, playerState.terminalChatThreads]);

  const selectedCharacterTemplate = selectedCharacterId ? gameData.characters[selectedCharacterId] : null;

  const currentChatThreadMessages: TerminalChatMessage[] = useMemo(() => {
    if (!selectedCharacterId || !playerState.terminalChatThreads) return [];
    return playerState.terminalChatThreads[selectedCharacterId]?.messages || [];
  }, [selectedCharacterId, playerState.terminalChatThreads]);

  const scrollToBottom = useCallback(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [currentChatThreadMessages]);


  const handleCharacterSelect = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId);
    setChatInputBody('');
    setChatAttachments([]);
    onMarkAsRead(characterId); // Mark all messages from this character as read by player
  }, [onMarkAsRead]);
  
  useEffect(() => {
    // Auto-select first contact if none is selected or if selected is no longer available
    if (!selectedCharacterId && displayedChatContacts.length > 0) {
        handleCharacterSelect(displayedChatContacts[0].characterId);
    } else if (selectedCharacterId && !displayedChatContacts.some(c => c.characterId === selectedCharacterId)) {
        const firstContactId = displayedChatContacts.length > 0 ? displayedChatContacts[0].characterId : null;
        setSelectedCharacterId(firstContactId);
        if (firstContactId) {
            onMarkAsRead(firstContactId); // Also mark as read if auto-selecting
        }
    }
  }, [selectedCharacterId, displayedChatContacts, handleCharacterSelect, onMarkAsRead]);

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
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { 
      event.preventDefault();
      handleSendMessageClick();
    }
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-4 bg-gray-800 text-gray-300">
      {displayedChatContacts.length === 0 ? (
        <p className="text-gray-400 italic text-center mt-10">ターミナル経由でチャット可能な連絡先はありません。</p>
      ) : (
        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 overflow-y-auto pr-2 border-r-0 md:border-r md:border-gray-700 terminal-output mb-2 md:mb-0">
            <h3 className="text-lg font-semibold text-teal-400 mb-2">チャット連絡先</h3>
            <ul className="space-y-1">
              {displayedChatContacts.map(contact => (
                <li key={contact.characterId}>
                  <button
                    onClick={() => handleCharacterSelect(contact.characterId)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors ${selectedCharacterId === contact.characterId ? 'bg-gray-700 text-teal-300' : 'text-gray-300 hover:text-teal-400'}`}
                    aria-pressed={selectedCharacterId === contact.characterId}
                  >
                    <div className="flex justify-between items-center">
                      <span>{contact.characterName}</span>
                      {contact.hasUnread && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full" title="Unread messages"></span>
                      )}
                    </div>
                    {contact.tagline && <p className="text-xs text-gray-500 truncate">{contact.tagline}</p>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-2/3 overflow-y-hidden md:pl-2 flex flex-col">
            {selectedCharacterTemplate ? (
              <div className="flex-grow flex flex-col h-full">
                <h3 className="text-lg font-semibold text-teal-400 mb-3 border-b border-gray-700 pb-2">
                  {selectedCharacterTemplate.name} とのターミナルチャット
                </h3>
                <div className="space-y-2 overflow-y-auto flex-grow pr-1 mb-2 terminal-output p-2 bg-gray-900 rounded-md min-h-[150px]" role="log">
                   {currentChatThreadMessages.length === 0 && (
                     <p className="text-gray-400 italic text-sm p-4 text-center">
                       会話履歴はありません。メッセージを送信して会話を開始してください。
                     </p>
                   )}
                   {currentChatThreadMessages.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.senderId === 'player' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[80%] p-2 rounded-lg ${msg.senderId === 'player' ? 'bg-blue-700 text-white' : (msg.isReadByPlayer === false && msg.senderId !== 'player' ? 'bg-sky-700 text-sky-100 font-semibold' : 'bg-gray-700 text-gray-200')} ${msg.isLoadingAI ? 'opacity-75 italic' : ''}`}>
                         <p className="text-xs font-semibold mb-0.5">{msg.senderName || (msg.senderId === 'player' ? playerState.username : '不明な送信者')}</p>
                         <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                         {msg.isLoadingAI && (
                            <div className="flex items-center justify-center mt-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-300"></div>
                                <span className="text-xs text-gray-400 ml-1">Generating...</span>
                            </div>
                         )}
                         {msg.attachmentTitles && msg.attachmentTitles.length > 0 && !msg.isLoadingAI && (
                           <div className="mt-1 pt-1 border-t border-opacity-50 border-gray-500">
                             <p className="text-xs text-gray-400">添付:</p>
                             <ul className="list-disc list-inside text-xs">
                               {msg.attachmentTitles.map((title, idx) => <li key={idx}>{title}</li>)}
                             </ul>
                           </div>
                         )}
                         {!msg.isLoadingAI && (
                           <p className="text-xs text-gray-400 mt-1 text-right">
                             {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             {msg.senderId === 'player' && msg.isReadByCharacter && <span className="ml-1 text-sky-300">(既読)</span>}
                           </p>
                         )}
                       </div>
                     </div>
                   ))}
                   <div ref={chatMessagesEndRef} />
                </div>
                
                <div className="mt-auto pt-2 border-t border-gray-700">
                  <textarea
                    rows={3} 
                    className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 terminal-output mb-2"
                    value={chatInputBody}
                    onChange={(e) => setChatInputBody(e.target.value)}
                    onKeyDown={handleChatInputKeyDown}
                    placeholder={`${selectedCharacterTemplate.name}へのメッセージ (Ctrl+Enterで送信)`}
                    aria-label="Chat message input for terminal"
                    disabled={!selectedCharacterId}
                  />
                  <div 
                    className={`mb-2 p-2 border-2 border-dashed rounded-md min-h-[40px] ${selectedCharacterId ? 'border-gray-600 hover:border-teal-500' : 'border-gray-700 bg-gray-850 cursor-not-allowed'}`}
                    onDragOver={selectedCharacterId ? handleDragOver : undefined}
                    onDrop={selectedCharacterId ? handleDrop : undefined}
                    aria-label="Drop attachments here for terminal message"
                    aria-disabled={!selectedCharacterId}
                  >
                    {chatAttachments.length === 0 ? (
                      <p className="text-gray-500 text-center text-xs">Data Repositoryから証拠をドラッグ＆ドロップ</p>
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
                    disabled={!selectedCharacterId || (!chatInputBody.trim() && chatAttachments.length === 0)}
                    className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 disabled:opacity-50"
                  >
                    送信 (Ctrl+Enter)
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">連絡先を選択してターミナル経由でメッセージを送信します。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;