

import React, { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import ShellInterface from './components/ShellInterface';
import DataRepository from './components/DataRepository';
import CharacterProfile from './components/CharacterProfile';
import ChatPanel from './components/ChatPanel'; // Ensure correct relative path
import { PlayerStoryState, GameData, ShellMessage, ParsedCommand, StoryContentData, PlayerProfile, Character, FileSystemStructure, FileSystemNodeType, FileSystemItem, InitialFileSystemItem, InitialFileNode, InitialDirectoryNode, InitialFileSystemStructure, InboxMessage, ConversationThread, EvidenceItem, CommandDefinition } from './types';
import { COMMAND_DEFINITIONS, processCommand, processEmailSubmission } from './services/gameLogicService';
import { runAutomatedDebugSequence } from './services/debugService'; // Import debug service
import { storiesMap } from './src/game-content/stories';

type AppPhase = 'loading' | 'login' | 'story_loading' | 'playing' | 'no_more_stories' | 'error_loading_story';
type ActiveSidePanelTab = 'contacts' | 'chat'; 

const PLAYER_PROFILE_STORAGE_PREFIX = 'anonymousFilePlayerProfile_';
const PLAYER_STORY_STATE_STORAGE_PREFIX = 'anonymousFileStoryState_';
const DEFAULT_INITIAL_STORY = 1;

export const DEFAULT_DELAY_SETTINGS = {
  MIN_READ_DELAY_MS: 500,
  MAX_READ_DELAY_MS: 10000,
  READ_DELAY_JITTER_MS: 1000,
  MIN_REPLY_DELAY_MS: 1000,
  MAX_REPLY_DELAY_MS: 60000,
  REPLY_DELAY_JITTER_MS: 2000,
};


function processInitialFS(initialFS: InitialFileSystemItem, name: string): FileSystemItem {
  if (initialFS.type === FileSystemNodeType.DIRECTORY || (initialFS.type === undefined && 'children' in initialFS)) {
    const dirNode = initialFS as InitialDirectoryNode;
    const children: Record<string, FileSystemItem> = {};
    for (const childName in dirNode.children) {
      children[childName] = processInitialFS(dirNode.children[childName], childName);
    }
    return { type: FileSystemNodeType.DIRECTORY, name: name, children: children };
  } else {
    const fileNode = initialFS as InitialFileNode;
    return {
      type: FileSystemNodeType.FILE,
      name: name,
      content: fileNode.content,
      isEncrypted: fileNode.isEncrypted,
      password: fileNode.password,
      decryptedContent: fileNode.decryptedContent,
      canAnalyze: fileNode.canAnalyze,
      analysisResult: fileNode.analysisResult,
    };
  }
}

function buildRuntimeFileSystem(initialStructure: InitialFileSystemStructure): FileSystemStructure {
    const runtimeFS: FileSystemStructure = {};
    for (const key in initialStructure) {
        if (key === '/') { 
            const rootNode = initialStructure[key] as InitialDirectoryNode;
            const children: Record<string, FileSystemItem> = {};
            if (rootNode.children) { 
              for (const childName in rootNode.children) {
                  children[childName] = processInitialFS(rootNode.children[childName], childName);
              }
            }
            runtimeFS[key] = {type: FileSystemNodeType.DIRECTORY, name: '/', children: children};
        } else {
          runtimeFS[key] = processInitialFS(initialStructure[key] as InitialFileSystemItem, key);
        }
    }
    return runtimeFS;
}

export function calculateTrustBasedDelay(
  trustLevel: number, 
  minDelayAtHighTrust: number, 
  maxDelayAtLowTrust: number, 
  randomJitterRange: number = 0 
): number {
  const normalizedTrust = Math.max(0, Math.min(100, trustLevel)) / 100; 
  const delayRange = maxDelayAtLowTrust - minDelayAtHighTrust;
  let calculatedDelay = maxDelayAtLowTrust - (normalizedTrust * delayRange);
  if (randomJitterRange > 0) {
    calculatedDelay += (Math.random() - 0.5) * randomJitterRange;
  }
  return Math.max(minDelayAtHighTrust, Math.min(calculatedDelay, maxDelayAtLowTrust));
}


const App: React.FC = () => {
  const [playerStoryState, setPlayerStoryState] = useState<PlayerStoryState | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [currentStoryData, setCurrentStoryData] = useState<StoryContentData | null>(null);

  const [appPhase, setAppPhase] = useState<AppPhase>('loading');
  const [initialShellMessages, setInitialShellMessages] = useState<ShellMessage[]>([]);
  const [resetCounter, setResetCounter] = useState(0);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isDebugModeActive, setIsDebugModeActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<ActiveSidePanelTab>('contacts');

  const gameData: GameData | null = useMemo(() => {
    if (!currentStoryData) return null;
    return {
      ...currentStoryData,
      commandDefinitions: COMMAND_DEFINITIONS,
    };
  }, [currentStoryData]);

  const getDefaultConnectionSequence = useCallback((username: string): ShellMessage[] => {
    const sequenceTexts = [
      "接続シーケンスを初期化中...", ".......... 20%",
      "サーバーに接続中 @ anon-relay.securenetwork...", ".................... 60%",
      "ユーザー資格情報を認証中...", ".............................. 90%",
      `認証成功。ようこそ、${username}。`, "セキュアシェル環境をロード中...",
      "........................................ 100% 完了", "ANONYMOUS_NODE_742への接続が確立されました。",
      "着信通信を受信中...", ".................... 100% 完了"
    ];
    return sequenceTexts.map((text, index) => ({
      id: `conn_seq_default_${index}_${Date.now()}`, text,
      type: text.includes('%') || text.startsWith('.') ? 'progress' : 'system',
    }));
  }, []);

  const initializePlayerStoryState = useCallback((storyData: StoryContentData, username: string, password?: string): PlayerStoryState => {
    const initialFS = buildRuntimeFileSystem(storyData.initialFileSystem);

    const initialCharacterDynamicData: Record<string, { trustLevel: number }> = {};
    Object.entries(storyData.characters).forEach(([charId, charTmpl]) => {
        initialCharacterDynamicData[charId] = { trustLevel: charTmpl.initialTrustLevel !== undefined ? charTmpl.initialTrustLevel : 50 };
    });

    const baseState: PlayerStoryState = {
      currentPath: '/',
      fileSystemState: initialFS,
      discoveredEvidenceIds: [],
      solvedPuzzleIds: [],
      narrativeFlags: {},
      characterDynamicData: initialCharacterDynamicData,
      gameStage: 'introduction',
      evidenceNotes: {},
      characterNotes: {},
      username: username,
      password: password,
      currentStoryNumber: storyData.storyInfo.storyNumber,
      inboxThreads: {}, 
    };

    let finalState = baseState;
    if (storyData.initialPlayerStateOverrides) {
        finalState = {
            ...baseState,
            ...storyData.initialPlayerStateOverrides,
            fileSystemState: baseState.fileSystemState,
            characterDynamicData: baseState.characterDynamicData,
            username: baseState.username,
            password: baseState.password,
            currentStoryNumber: baseState.currentStoryNumber,
            evidenceNotes: storyData.initialPlayerStateOverrides.evidenceNotes || {},
            characterNotes: storyData.initialPlayerStateOverrides.characterNotes || {},
            inboxThreads: storyData.initialPlayerStateOverrides.inboxThreads || {},
        };
    }
    return finalState;
  }, []);


  useEffect(() => {
    setAppPhase('login');
  }, []);

  useEffect(() => {
    if (appPhase === 'playing' && playerStoryState && playerProfile && !isDebugModeActive) {
      const key = PLAYER_STORY_STATE_STORAGE_PREFIX + playerProfile.username + `_STORY_${playerStoryState.currentStoryNumber}`;
      localStorage.setItem(key, JSON.stringify(playerStoryState));
    }
  }, [playerStoryState, playerProfile, appPhase, isDebugModeActive]);

  useEffect(() => {
    if (playerProfile && !isDebugModeActive) {
        const key = PLAYER_PROFILE_STORAGE_PREFIX + playerProfile.username;
        localStorage.setItem(key, JSON.stringify(playerProfile));
    }
  }, [playerProfile, isDebugModeActive]);


  const handlePlayerStoryStateChange = (newState: PlayerStoryState) => {
    setPlayerStoryState(newState);

    if (newState.narrativeFlags.story_completed_successfully && gameData) {
        setPlayerProfile(prev => {
            if (!prev) return null;
            return { ...prev, highestStoryCompleted: Math.max(prev.highestStoryCompleted, newState.currentStoryNumber) };
        });
    }
  };
  
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      alert("ユーザー名を入力してください。"); // Simple UI message, could be moved to systemMessages for extreme config
      return;
    }
    if (!loginPassword.trim()) {
        alert("パスワードを入力してください。"); // Simple UI message
        return;
    }

    setAppPhase('story_loading');
    const trimmedUsername = loginUsername.trim();

    if (trimmedUsername === 'adminalpine' && loginPassword === 'adminalpine') { 
        setIsDebugModeActive(true);
        const storyDataForDebug = storiesMap.get(DEFAULT_INITIAL_STORY);
        if (!storyDataForDebug) {
            setErrorMessage("デバッグモード用のストーリー1の読み込みに失敗しました。");
            setAppPhase('error_loading_story');
            return;
        }
        setCurrentStoryData(storyDataForDebug);
        const initialDebugState = initializePlayerStoryState(storyDataForDebug, trimmedUsername, loginPassword);
        setPlayerStoryState(initialDebugState);
        setPlayerProfile({ username: trimmedUsername, highestStoryCompleted: 0 });

        const { finalMessages: debugMessages, finalDebugState: postDebugPlayerState } = await runAutomatedDebugSequence(
            initialDebugState,
            storyDataForDebug,
            COMMAND_DEFINITIONS,
            processCommand,
            processEmailSubmission,
            calculateTrustBasedDelay,
            DEFAULT_DELAY_SETTINGS
        );
        setInitialShellMessages(debugMessages);
        setPlayerStoryState(postDebugPlayerState);
        setAppPhase('playing');
        setActiveSidePanelTab('contacts');
        return;
    }

    setIsDebugModeActive(false);
    const profileKey = PLAYER_PROFILE_STORAGE_PREFIX + trimmedUsername;
    const savedProfileJSON = localStorage.getItem(profileKey);
    let loadedProfile: PlayerProfile;

    if (savedProfileJSON) {
        loadedProfile = JSON.parse(savedProfileJSON) as PlayerProfile;
    } else {
        loadedProfile = { username: trimmedUsername, highestStoryCompleted: 0 };
    }
    setPlayerProfile(loadedProfile);

    const storyToPlayNumber = loadedProfile.highestStoryCompleted + 1;
    const storyData = storiesMap.get(storyToPlayNumber);

    if (!storyData) {
        setAppPhase(storyToPlayNumber > 1 ? 'no_more_stories' : 'error_loading_story');
        if(storyToPlayNumber <=1 && appPhase === 'error_loading_story' && !errorMessage) {
             setErrorMessage(`ストーリー ${storyToPlayNumber} の読み込みに失敗しました。コンテンツが定義されていません。`);
        }
        return;
    }
    setCurrentStoryData(storyData);

    const storyStateKey = PLAYER_STORY_STATE_STORAGE_PREFIX + trimmedUsername + `_STORY_${storyData.storyInfo.storyNumber}`;
    const savedStoryStateJSON = localStorage.getItem(storyStateKey);
    let storyStateForPlay: PlayerStoryState;
    let welcomeMessages: ShellMessage[];

    if (savedStoryStateJSON) {
      try {
        let parsedState = JSON.parse(savedStoryStateJSON) as PlayerStoryState;
        if (parsedState.username === trimmedUsername && parsedState.currentStoryNumber === storyData.storyInfo.storyNumber) {
          storyStateForPlay = { ...parsedState, password: loginPassword };
          if (!storyStateForPlay.inboxThreads) storyStateForPlay.inboxThreads = {};
          if (!storyStateForPlay.characterDynamicData) { 
            const initialCharacterDynamicData: Record<string, { trustLevel: number }> = {};
            Object.entries(storyData.characters).forEach(([charId, charTmpl]) => {
                initialCharacterDynamicData[charId] = { trustLevel: charTmpl.initialTrustLevel !== undefined ? charTmpl.initialTrustLevel : 50 };
            });
            storyStateForPlay.characterDynamicData = initialCharacterDynamicData;
          }
          welcomeMessages = [{ id: `resume_story_${Date.now()}`, type: 'system', text: `ストーリー「${storyData.storyInfo.title}」を再開します。ようこそ、${trimmedUsername}。`}];
        } else {
          throw new Error("Saved story state mismatch.");
        }
      } catch (error) {
        console.warn("Failed to load or parse saved story state, starting new for this story:", error);
        localStorage.removeItem(storyStateKey);
        storyStateForPlay = initializePlayerStoryState(storyData, trimmedUsername, loginPassword);
        let connectionMsgs: ShellMessage[] = (storyData.connectionSequence && storyData.connectionSequence.length > 0)
            ? storyData.connectionSequence.map(msg => ({ ...msg, text: msg.text.replace(/\[USERNAME\]/g, trimmedUsername) }))
            : getDefaultConnectionSequence(trimmedUsername);
        const gameStartMessages = storyData.narrativeScript.welcome || [];
        welcomeMessages = [...connectionMsgs, ...gameStartMessages];
      }
    } else {
      storyStateForPlay = initializePlayerStoryState(storyData, trimmedUsername, loginPassword);
      let connectionMsgs: ShellMessage[] = (storyData.connectionSequence && storyData.connectionSequence.length > 0)
          ? storyData.connectionSequence.map(msg => ({ ...msg, text: msg.text.replace(/\[USERNAME\]/g, trimmedUsername) }))
          : getDefaultConnectionSequence(trimmedUsername);
      const gameStartMessages = storyData.narrativeScript.welcome || [];
      welcomeMessages = [...connectionMsgs, ...gameStartMessages];
    }

    setPlayerStoryState(storyStateForPlay);
    setInitialShellMessages(welcomeMessages);
    setAppPhase('playing');
    setActiveSidePanelTab('contacts');
  };

  const handleRequestExit = () => {
    if (appPhase === 'playing' && playerStoryState && playerProfile && !isDebugModeActive) {
      const key = PLAYER_STORY_STATE_STORAGE_PREFIX + playerProfile.username + `_STORY_${playerStoryState.currentStoryNumber}`;
      localStorage.setItem(key, JSON.stringify(playerStoryState));
    }
    if (playerProfile && !isDebugModeActive) {
        const key = PLAYER_PROFILE_STORAGE_PREFIX + playerProfile.username;
        localStorage.setItem(key, JSON.stringify(playerProfile));
    }

    setLoginUsername(playerProfile?.username || '');
    setLoginPassword('');
    setAppPhase('login');
    setInitialShellMessages([]);
    setIsDebugModeActive(false);
    setPlayerStoryState(null);
    setCurrentStoryData(null);
    setActiveSidePanelTab('contacts');
  };

  const handleSendMessageFromChat = async (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => {
    if (!playerStoryState || !gameData) return;

    const timestamp = new Date().toISOString();
    const character = gameData.characters[targetCharacterId];
    if (!character) {
        console.error("Target character not found for chat message:", targetCharacterId);
        return;
    }

    const sentMessageId = `msg_sent_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const sentMessage: InboxMessage = {
        id: sentMessageId, timestamp, sender: playerStoryState.username, recipient: character.name,
        body: messageBody,
        attachments: attachmentIds.map(id => {
            const evidenceItem = gameData.evidence[id] as EvidenceItem | undefined;
            return { id, title: evidenceItem?.title || id };
        }),
        type: 'sent', isRead: true, recipientReadTimestamp: null, 
    };

    const tempPlayerStoryStateForSentMsg = JSON.parse(JSON.stringify(playerStoryState)) as PlayerStoryState;
    if (!tempPlayerStoryStateForSentMsg.inboxThreads) tempPlayerStoryStateForSentMsg.inboxThreads = {};
    const threadId = `thread_${targetCharacterId}`;
    if (!tempPlayerStoryStateForSentMsg.inboxThreads[threadId]) {
        tempPlayerStoryStateForSentMsg.inboxThreads[threadId] = {
            threadId, characterId: targetCharacterId, characterName: character.name,
            messages: [], lastMessageTimestamp: timestamp, hasUnread: false,
        };
    }
    const currentThreadForSent = tempPlayerStoryStateForSentMsg.inboxThreads[threadId];
    currentThreadForSent.messages.push(sentMessage);
    currentThreadForSent.lastMessageTimestamp = timestamp;
    setPlayerStoryState(tempPlayerStoryStateForSentMsg);

    const trustLevel = playerStoryState.characterDynamicData[targetCharacterId]?.trustLevel ?? 50;
    const characterConfig = gameData.characters[targetCharacterId]; 

    const charMinReadDelay = characterConfig?.minReadDelayMs ?? DEFAULT_DELAY_SETTINGS.MIN_READ_DELAY_MS;
    const charMaxReadDelay = characterConfig?.maxReadDelayMs ?? DEFAULT_DELAY_SETTINGS.MAX_READ_DELAY_MS;
    const charReadJitter = characterConfig?.readDelayJitterMs ?? DEFAULT_DELAY_SETTINGS.READ_DELAY_JITTER_MS;
    const actualReadDelay = calculateTrustBasedDelay(trustLevel, charMinReadDelay, charMaxReadDelay, charReadJitter);
    await new Promise(resolve => setTimeout(resolve, actualReadDelay));

    setPlayerStoryState(prevState => {
        if (!prevState) return null;
        const updatedState = JSON.parse(JSON.stringify(prevState)) as PlayerStoryState;
        const threadToUpdate = updatedState.inboxThreads[threadId];
        if (threadToUpdate) {
            const messageToMark = threadToUpdate.messages.find(m => m.id === sentMessageId);
            if (messageToMark && messageToMark.type === 'sent') {
                messageToMark.recipientReadTimestamp = new Date().toISOString();
            }
        }
        return updatedState;
    });

    const charMinReplyDelay = characterConfig?.minReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MIN_REPLY_DELAY_MS;
    const charMaxReplyDelay = characterConfig?.maxReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MAX_REPLY_DELAY_MS;
    const charReplyJitter = characterConfig?.replyDelayJitterMs ?? DEFAULT_DELAY_SETTINGS.REPLY_DELAY_JITTER_MS;
    const actualReplyDelay = calculateTrustBasedDelay(trustLevel, charMinReplyDelay, charMaxReplyDelay, charReplyJitter);
    await new Promise(resolve => setTimeout(resolve, actualReplyDelay));
    
    const stateBeforeReplyProcessing = playerStoryState ? JSON.parse(JSON.stringify(playerStoryState)) as PlayerStoryState : tempPlayerStoryStateForSentMsg;
    const threadForReplyLogic = stateBeforeReplyProcessing.inboxThreads[threadId];
    if (threadForReplyLogic) {
        const sentMsgInState = threadForReplyLogic.messages.find(m => m.id === sentMessageId);
        if (sentMsgInState && !sentMsgInState.recipientReadTimestamp) {
            sentMsgInState.recipientReadTimestamp = new Date().toISOString();
        }
    }

    const { outputMessages: replyShellMessages, newPlayerStoryState: stateAfterRepliesLogic } =
        await processEmailSubmission( targetCharacterId, messageBody, attachmentIds, stateBeforeReplyProcessing, gameData );

    let finalPlayerStoryState = JSON.parse(JSON.stringify(stateAfterRepliesLogic)) as PlayerStoryState;
     if (!finalPlayerStoryState.inboxThreads) finalPlayerStoryState.inboxThreads = {};
    if (!finalPlayerStoryState.inboxThreads[threadId]) { 
        finalPlayerStoryState.inboxThreads[threadId] = {
            threadId, characterId: targetCharacterId, characterName: character.name,
            messages: [], lastMessageTimestamp: timestamp, hasUnread: false,
        };
    }
    const finalThreadRef = finalPlayerStoryState.inboxThreads[threadId];

    const sentMessageExistsInFinal = finalThreadRef.messages.some(m => m.id === sentMessageId);
    if (!sentMessageExistsInFinal) {
      let insertionIndex = finalThreadRef.messages.length;
      for (let i = 0; i < finalThreadRef.messages.length; i++) {
        if (new Date(sentMessage.timestamp) < new Date(finalThreadRef.messages[i].timestamp)) {
          insertionIndex = i; break;
        }
      }
      finalThreadRef.messages.splice(insertionIndex, 0, { ...sentMessage, recipientReadTimestamp: new Date().toISOString()});
    } else {
      const existingSentMsg = finalThreadRef.messages.find(m => m.id === sentMessageId);
      if (existingSentMsg && !existingSentMsg.recipientReadTimestamp) {
        existingSentMsg.recipientReadTimestamp = new Date().toISOString();
      }
    }

    const replyTimestamp = new Date().toISOString();
    let hasNewReplies = false;
    const sendingMessageTextPattern = `メールを ${character.name} に送信中...`; // This string pattern should be robust or ideally handled differently

    replyShellMessages.forEach(shellMsg => {
        if (shellMsg.type === 'clear_signal' || shellMsg.type === 'exit_signal') return;
        if (shellMsg.type === 'system' && shellMsg.text === sendingMessageTextPattern) return; 

        const receivedMessage: InboxMessage = {
            id: `${shellMsg.id}_chat_reply_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            timestamp: replyTimestamp, sender: shellMsg.source || character.name, recipient: playerStoryState.username, 
            body: shellMsg.text, type: 'received', isRead: false, 
        };
        finalThreadRef.messages.push(receivedMessage);
        hasNewReplies = true;
    });

    if (hasNewReplies) {
        finalThreadRef.lastMessageTimestamp = replyTimestamp;
        finalThreadRef.hasUnread = true;
    } else if (finalThreadRef.messages.length > 0) {
        finalThreadRef.lastMessageTimestamp = finalThreadRef.messages[finalThreadRef.messages.length - 1].timestamp;
    }

    setPlayerStoryState(finalPlayerStoryState);
  };

  const handleMarkAsRead = (threadId: string, messageId?: string) => {
    setPlayerStoryState(prev => {
        if (!prev || !prev.inboxThreads || !prev.inboxThreads[threadId]) return prev;
        const newInboxThreads = JSON.parse(JSON.stringify(prev.inboxThreads)) as Record<string, ConversationThread>;
        const thread = newInboxThreads[threadId];
        let allMessagesInThreadRead = true;
        thread.messages.forEach(msg => {
            if (msg.type === 'received' && !msg.isRead) {
                 if (messageId === undefined || msg.id === messageId ) msg.isRead = true;
            }
            if(msg.type === 'received' && !msg.isRead) allMessagesInThreadRead = false;
        });
        thread.hasUnread = !allMessagesInThreadRead;
        return { ...prev, inboxThreads: newInboxThreads };
    });
  };


  if (appPhase === 'loading') {
    return <div className="flex items-center justify-center h-screen bg-black text-green-400"><p>アプリケーションをロード中...</p></div>;
  }
  if (appPhase === 'error_loading_story') {
    return <div className="flex flex-col items-center justify-center h-screen bg-black text-red-400 p-4">
        <p className="text-xl mb-4">エラー</p>
        <p className="mb-4">{errorMessage || "ストーリーファイルの読み込み中に予期せぬエラーが発生しました。"}</p>
        <button onClick={() => { setErrorMessage(null); setAppPhase('login');}} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded">ログインに戻る</button>
    </div>;
  }
   if (appPhase === 'no_more_stories') {
    return <div className="flex flex-col items-center justify-center h-screen bg-black text-green-400 p-4">
        <p className="text-xl mb-4">すべてのストーリーをクリアしました！</p>
        <p className="mb-4">プレイしていただきありがとうございます。</p>
        <button onClick={() => setAppPhase('login')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded">ログイン画面に戻る</button>
    </div>;
  }

  if (appPhase === 'login') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-black text-green-400">
        <div className="w-full max-w-md p-6 md:p-8 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-center text-teal-400 mb-6">Anonymous File</h1>
          <h2 className="text-xl text-center text-teal-300 mb-8">ログイン</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-teal-300 mb-1">ユーザー名:</label>
              <input type="text" id="username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-green-300 placeholder-gray-500"
                placeholder="ユーザー名を入力" autoFocus />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-teal-300 mb-1">パスワード:</label>
              <input type="password" id="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-green-300 placeholder-gray-500"
                placeholder="パスワードを入力" />
            </div>
            <button type="submit"
              className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75">
              接続
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (appPhase === 'story_loading' || !playerStoryState || !gameData) {
     return <div className="flex items-center justify-center h-screen bg-black text-green-400"><p>ストーリー「{currentStoryData?.storyInfo.title || '...'}」をロード中...</p></div>;
  }

  const unreadMessagesExist = playerStoryState.inboxThreads && Object.values(playerStoryState.inboxThreads).some(t => t.hasUnread);
  const activeTabStyle = "px-3 py-2 bg-gray-700 text-teal-300 rounded-t-md text-sm focus:outline-none";
  const inactiveTabStyle = "px-3 py-2 bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-teal-400 rounded-t-md text-sm focus:outline-none";


  return (
    <div className="h-screen w-screen flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 bg-black">
      <div className="md:w-2/3 h-1/2 md:h-full">
        <ShellInterface
          key={`shell-${resetCounter}-${playerStoryState.username}-story${playerStoryState.currentStoryNumber}-${isDebugModeActive}`}
          playerState={playerStoryState}
          gameData={gameData}
          onPlayerStateChange={handlePlayerStoryStateChange}
          initialMessages={initialShellMessages}
          onRequestExit={handleRequestExit}
          debugModeSpeed={isDebugModeActive}
        />
      </div>
      <div className="md:w-1/3 h-1/2 md:h-full flex flex-col gap-2 md:gap-4">
        <div className="flex-grow-[2] basis-0 overflow-hidden">
            <DataRepository
                playerState={playerStoryState}
                gameData={gameData}
                onPlayerStateChange={handlePlayerStoryStateChange}
            />
        </div>
        <div className="flex-grow-[1] basis-0 overflow-hidden flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveSidePanelTab('contacts')}
                    className={activeSidePanelTab === 'contacts' ? activeTabStyle : inactiveTabStyle}
                    aria-pressed={activeSidePanelTab === 'contacts'}
                >
                    Contacts
                </button>
                <button
                    onClick={() => { setActiveSidePanelTab('chat'); }}
                    className={`${activeSidePanelTab === 'chat' ? activeTabStyle : inactiveTabStyle} relative`}
                    aria-pressed={activeSidePanelTab === 'chat'}
                >
                    Chat
                    {unreadMessagesExist && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
                    )}
                </button>
            </div>
            <div className="flex-grow overflow-hidden">
                 {activeSidePanelTab === 'contacts' && playerStoryState && gameData && (
                    <CharacterProfile
                        playerState={playerStoryState}
                        gameData={gameData}
                        onPlayerStateChange={handlePlayerStoryStateChange}
                    />
                 )}
                 {activeSidePanelTab === 'chat' && playerStoryState && gameData && (
                    <ChatPanel
                        playerState={playerStoryState}
                        gameData={gameData}
                        onMarkAsRead={handleMarkAsRead}
                        onSendMessage={handleSendMessageFromChat}
                    />
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;