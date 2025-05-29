
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ShellInterface from './components/ShellInterface';
import DataRepository from './components/DataRepository';
import CharacterProfile from './components/CharacterProfile';
import ChatPanel from './components/ChatPanel';
import SmartphoneUI from './components/SmartphoneUI';
import LoginScreen from './components/LoginScreen';
import {
    PlayerStoryState, GameData, ShellMessage, StoryContentData, PlayerProfile,
    DeviceConfig, ConversationThread, TerminalChatMessage, TerminalChatThread, MessageAttachment // fix: Added TerminalChatThread and MessageAttachment
} from './types';
import { COMMAND_DEFINITIONS, processCommand, processTerminalCharacterInteraction } from './services/gameLogicService';
import { runAutomatedDebugSequence, DEBUG_USERNAME, DEBUG_PASSWORD } from './services/debugService';
import { storiesMap } from './src/game-content/stories';
import { 
    PLAYER_MAIN_NODE_ID, 
    PLAYER_PROFILE_STORAGE_PREFIX, 
    PLAYER_STORY_STATE_STORAGE_PREFIX,
    DEFAULT_INITIAL_STORY,
    BYPASS_LOGIN_FOR_TESTING,
    RUN_DEBUG_SEQUENCE_ON_BYPASS,
    DEFAULT_DELAY_SETTINGS
} from './src/constants';
import { initializePlayerStoryState, buildRuntimeFileSystem } from './src/utils/stateInitializer';
import { calculateTrustBasedDelay } from './src/utils/gameUtils';


type AppPhase = 'loading' | 'login' | 'story_loading' | 'playing' | 'no_more_stories' | 'error_loading_story';
type ActiveSidePanelTab = 'contacts' | 'chat';

interface PromptConfigForSequence {
    promptUsername?: string;
    promptHostname?: string;
    connectionMessage?: string;
}

const App: React.FC = () => {
  const [playerStoryState, setPlayerStoryState] = useState<PlayerStoryState | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [currentStoryData, setCurrentStoryData] = useState<StoryContentData | null>(null);

  const [appPhase, setAppPhase] = useState<AppPhase>(BYPASS_LOGIN_FOR_TESTING ? 'loading' : 'login');
  const [initialShellMessages, setInitialShellMessages] = useState<ShellMessage[]>([]);
  const [currentUsernameForLoad, setCurrentUsernameForLoad] = useState<string | null>(BYPASS_LOGIN_FOR_TESTING ? DEBUG_USERNAME : null);
  // fix: Explicitly type useState for isDebugModeActive as boolean
  const [isDebugModeActive, setIsDebugModeActive] = useState<boolean>(BYPASS_LOGIN_FOR_TESTING && RUN_DEBUG_SEQUENCE_ON_BYPASS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<ActiveSidePanelTab>('contacts');


  const gameData: GameData | null = useMemo(() => {
    if (!currentStoryData) return null;
    return {
      ...currentStoryData,
      commandDefinitions: COMMAND_DEFINITIONS,
    };
  }, [currentStoryData]);

  const getDefaultConnectionSequence = useCallback((username: string, deviceConfig?: PromptConfigForSequence): ShellMessage[] => {
    const hostname = deviceConfig?.promptHostname || currentStoryData?.storyInfo.playerDefaultDeviceConfig?.promptHostname || "anonymous-node";
    const resolvedUsername = (deviceConfig?.promptUsername === "{PLAYER_USERNAME}" || 
                             currentStoryData?.storyInfo.playerDefaultDeviceConfig?.promptUsername === "{PLAYER_USERNAME}") 
                             ? username 
                             : (deviceConfig?.promptUsername || username);

    const sequenceTexts = [
      "接続シーケンスを初期化中...", ".......... 20%",
      `サーバーに接続中 @ ${hostname}...`, ".................... 60%",
      "ユーザー資格情報を認証中...", ".............................. 90%",
      `認証成功。ようこそ、${resolvedUsername}。`, "セキュアシェル環境をロード中...",
      "........................................ 100% 完了", `${hostname}への接続が確立されました。`,
    ];
    if (deviceConfig?.connectionMessage && deviceConfig.connectionMessage.trim() !== "") { // Ensure connection message is not empty
        sequenceTexts.push(deviceConfig.connectionMessage);
    }
    return sequenceTexts.map((text, index) => ({
      id: `conn_seq_default_${index}_${Date.now()}_${Math.random()}`, text,
      type: text.includes('%') || text.startsWith('.') ? 'progress' : 'system',
    }));
  }, [currentStoryData]);


  useEffect(() => {
    if (BYPASS_LOGIN_FOR_TESTING && appPhase === 'loading') {
        console.warn(`LOGIN BYPASSED FOR TESTING - Using ${DEBUG_USERNAME}`);
        setAppPhase('story_loading');
        
        const storyDataForBypass = storiesMap.get(DEFAULT_INITIAL_STORY);
        if (!storyDataForBypass) {
            setErrorMessage("Bypass: Story 1 loading failed.");
            setAppPhase('error_loading_story');
            return;
        }
        setCurrentStoryData(storyDataForBypass);
        const initialBypassState = initializePlayerStoryState(storyDataForBypass, DEBUG_USERNAME, DEBUG_PASSWORD);
        setPlayerStoryState(initialBypassState);
        setPlayerProfile({ username: DEBUG_USERNAME, highestStoryCompleted: 0 });

        const playerDeviceConfigForBypass: PromptConfigForSequence | undefined = 
            storyDataForBypass.deviceConfigurations?.[PLAYER_MAIN_NODE_ID] || storyDataForBypass.storyInfo.playerDefaultDeviceConfig;

        if (RUN_DEBUG_SEQUENCE_ON_BYPASS) {
            setIsDebugModeActive(true);
            runAutomatedDebugSequence(
                initialBypassState,
                storyDataForBypass,
                COMMAND_DEFINITIONS,
                processCommand,
                processTerminalCharacterInteraction,
                calculateTrustBasedDelay,
                DEFAULT_DELAY_SETTINGS
            ).then(({ finalMessages, finalDebugState }) => {
                setInitialShellMessages(finalMessages);
                setPlayerStoryState(finalDebugState); 
                setAppPhase('playing');
            }).catch(err => {
                console.error("Debug sequence failed:", err);
                setErrorMessage("Debug sequence failed. Check console.");
                setAppPhase('error_loading_story');
            });
        } else {
            setIsDebugModeActive(false);
            let welcomeMessages = (storyDataForBypass.connectionSequence || getDefaultConnectionSequence(DEBUG_USERNAME, playerDeviceConfigForBypass))
                .map(msg => ({ ...msg, text: msg.text.replace(/\[USERNAME\]/g, DEBUG_USERNAME) }));
            if (storyDataForBypass.narrativeScript.welcome) {
                 welcomeMessages = welcomeMessages.concat(storyDataForBypass.narrativeScript.welcome);
            }
            setInitialShellMessages(welcomeMessages);
            setAppPhase('playing');
        }
    } else if (!BYPASS_LOGIN_FOR_TESTING && appPhase === 'loading') {
        setAppPhase('login');
    }
  }, [appPhase, getDefaultConnectionSequence]);

  useEffect(() => {
    if (appPhase === 'playing' && playerStoryState && playerProfile && !isDebugModeActive) {
      const key = PLAYER_STORY_STATE_STORAGE_PREFIX + playerProfile.username + `_STORY_${playerStoryState.currentStoryNumber}`;
      localStorage.setItem(key, JSON.stringify(playerStoryState));
    }
  }, [playerStoryState, playerProfile, appPhase, isDebugModeActive]);

  useEffect(() => {
    if (playerProfile && !isDebugModeActive && appPhase !== 'login' && appPhase !== 'loading') { // Avoid saving empty profile during login init
        const key = PLAYER_PROFILE_STORAGE_PREFIX + playerProfile.username;
        localStorage.setItem(key, JSON.stringify(playerProfile));
    }
  }, [playerProfile, isDebugModeActive, appPhase]);


  const handlePlayerStoryStateChange = (newState: PlayerStoryState) => {
    setPlayerStoryState(newState);
    if (newState.narrativeFlags.story_completed_successfully && gameData && playerProfile) { 
        setPlayerProfile(prev => {
            if (!prev) return { username: newState.username, highestStoryCompleted: newState.currentStoryNumber }; // Should ideally not happen if playerProfile is set
            return { ...prev, highestStoryCompleted: Math.max(prev.highestStoryCompleted, newState.currentStoryNumber) };
        });
    }
  };

  const handleLogin = async (username: string, password?: string) => {
    setAppPhase('story_loading');
    const trimmedUsername = username.trim();
    setCurrentUsernameForLoad(trimmedUsername);

    if (trimmedUsername === DEBUG_USERNAME && password === DEBUG_PASSWORD) {
        setIsDebugModeActive(true);
        const storyDataForDebug = storiesMap.get(DEFAULT_INITIAL_STORY);
        if (!storyDataForDebug) {
            setErrorMessage("デバッグモード用のストーリー1の読み込みに失敗しました。");
            setAppPhase('error_loading_story');
            return;
        }
        setCurrentStoryData(storyDataForDebug);
        const initialDebugState = initializePlayerStoryState(storyDataForDebug, trimmedUsername, password);
        setPlayerStoryState(initialDebugState);
        setPlayerProfile({ username: trimmedUsername, highestStoryCompleted: 0 });

        try {
            const { finalMessages: debugMessages, finalDebugState: postDebugPlayerState } = await runAutomatedDebugSequence(
                initialDebugState,
                storyDataForDebug,
                COMMAND_DEFINITIONS,
                processCommand,
                processTerminalCharacterInteraction,
                calculateTrustBasedDelay,
                DEFAULT_DELAY_SETTINGS
            );
            setInitialShellMessages(debugMessages); 
            setPlayerStoryState(postDebugPlayerState);
        } catch (err) {
            console.error("Debug sequence failed during login:", err);
            setErrorMessage("Debug sequence failed. Check console.");
            setAppPhase('error_loading_story');
            return;
        }
        setAppPhase('playing');
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
        if (storyToPlayNumber <= 1 && appPhase === 'error_loading_story' && !errorMessage) {
             setErrorMessage(`ストーリー ${storyToPlayNumber} の読み込みに失敗しました。コンテンツが定義されていません。`);
        }
        return;
    }
    setCurrentStoryData(storyData);

    const storyStateKey = PLAYER_STORY_STATE_STORAGE_PREFIX + trimmedUsername + `_STORY_${storyData.storyInfo.storyNumber}`;
    const savedStoryStateJSON = localStorage.getItem(storyStateKey);
    let storyStateForPlay: PlayerStoryState;
    let welcomeMessagesForTerminal: ShellMessage[] = [];
    const playerDeviceConfigForLogin: PromptConfigForSequence | undefined = 
        storyData.deviceConfigurations?.[PLAYER_MAIN_NODE_ID] || storyData.storyInfo.playerDefaultDeviceConfig;


    if (savedStoryStateJSON) {
      try {
        let parsedState = JSON.parse(savedStoryStateJSON) as PlayerStoryState;
        if (parsedState.username === trimmedUsername && parsedState.currentStoryNumber === storyData.storyInfo.storyNumber && parsedState.saveVersion === "0.3.0_anonymous_cell_refactor") {
          storyStateForPlay = { ...parsedState, password: password };
          if (!storyStateForPlay.deviceFileSystems) { 
            storyStateForPlay.deviceFileSystems = {};
            storyStateForPlay.deviceFileSystems[PLAYER_MAIN_NODE_ID] = buildRuntimeFileSystem(storyData.initialFileSystem);
             if (storyData.deviceConfigurations) {
                for (const deviceId in storyData.deviceConfigurations) {
                    if (deviceId !== PLAYER_MAIN_NODE_ID) {
                       storyStateForPlay.deviceFileSystems[deviceId] = buildRuntimeFileSystem(storyData.deviceConfigurations[deviceId].initialFileSystem);
                    }
                }
            }
          }
          if (!storyStateForPlay.currentConnectedDeviceId) storyStateForPlay.currentConnectedDeviceId = PLAYER_MAIN_NODE_ID;
          if (!storyStateForPlay.deviceConnectionStack || storyStateForPlay.deviceConnectionStack.length === 0) storyStateForPlay.deviceConnectionStack = [PLAYER_MAIN_NODE_ID];
          if (!storyStateForPlay.smartphoneInstalledApps) storyStateForPlay.smartphoneInstalledApps = {};
          if (!storyStateForPlay.inboxThreads) storyStateForPlay.inboxThreads = {};
          if (!storyStateForPlay.terminalChatThreads) storyStateForPlay.terminalChatThreads = {};
          welcomeMessagesForTerminal = [{ id: `resume_story_${Date.now()}`, type: 'system', text: `ストーリー「${storyData.storyInfo.title}」を再開します。ようこそ、${trimmedUsername}。`}];
        } else {
          throw new Error("Saved story state mismatch or incompatible version.");
        }
      } catch (error) {
        console.warn("Failed to load or parse saved story state, starting new for this story:", error);
        localStorage.removeItem(storyStateKey); 
        storyStateForPlay = initializePlayerStoryState(storyData, trimmedUsername, password);
        welcomeMessagesForTerminal = (storyData.connectionSequence || getDefaultConnectionSequence(trimmedUsername, playerDeviceConfigForLogin))
            .map(msg => ({ ...msg, text: msg.text.replace(/\[USERNAME\]/g, trimmedUsername) }));
        if(storyData.narrativeScript.welcome) welcomeMessagesForTerminal = welcomeMessagesForTerminal.concat(storyData.narrativeScript.welcome);
      }
    } else {
      storyStateForPlay = initializePlayerStoryState(storyData, trimmedUsername, password);
      welcomeMessagesForTerminal = (storyData.connectionSequence || getDefaultConnectionSequence(trimmedUsername, playerDeviceConfigForLogin))
          .map(msg => ({ ...msg, text: msg.text.replace(/\[USERNAME\]/g, trimmedUsername) }));
      if(storyData.narrativeScript.welcome) welcomeMessagesForTerminal = welcomeMessagesForTerminal.concat(storyData.narrativeScript.welcome);
    }

    setPlayerStoryState(storyStateForPlay);
    setInitialShellMessages(welcomeMessagesForTerminal); 
    setAppPhase('playing');
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
    setCurrentUsernameForLoad(playerProfile?.username || null);
    setAppPhase('login');
    setInitialShellMessages([]);
    setIsDebugModeActive(false);
    setPlayerStoryState(null);
    setCurrentStoryData(null);
    // Do not reset playerProfile here, so login screen can prefill username if user logs back in
  };

  const handleSendMessageFromSmartphone = async (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => {
    if (!playerStoryState || !gameData) return;
    
    const tempState = JSON.parse(JSON.stringify(playerStoryState)) as PlayerStoryState;
    const char = gameData.characters[targetCharacterId];
    if(char) {
        const threadId = `thread_sp_${targetCharacterId}`; // Ensure smartphone thread IDs are distinct
        if (!tempState.inboxThreads[threadId]) {
            tempState.inboxThreads[threadId] = {
                threadId,
                participants: ['player', targetCharacterId],
                characterId: targetCharacterId,
                characterName: char.name,
                messages: [],
                lastMessageTimestamp: new Date().toISOString(),
                hasUnread: false,
            };
        }
        // Fix: Construct full MessageAttachment objects
        const messageAttachments: MessageAttachment[] = attachmentIds.map(attId => {
            const evidence = gameData.evidence[attId];
            return {
                id: attId,
                type: 'file', // Default to 'file' type
                fileName: evidence?.title || attId, // Use evidence title as filename
                // Other properties like fileSize, mimeType, url can be added if available
                evidenceId: attId
            };
        });

        tempState.inboxThreads[threadId].messages.push({
            id: `msg_sent_sp_${Date.now()}_${Math.random().toString(16).slice(2)}`, threadId, senderId: 'player', recipientId: targetCharacterId, body: messageBody,
            timestamp: new Date().toISOString(), type: 'sent', isRead: true,
            attachments: messageAttachments
        });
        tempState.inboxThreads[threadId].lastMessageTimestamp = new Date().toISOString();

        const trustLevelForDelay = tempState.playerTrustLevels[targetCharacterId] || 50;
        const replyDelay = calculateTrustBasedDelay(trustLevelForDelay, 
            char.minReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MIN_REPLY_DELAY_MS, 
            char.maxReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MAX_REPLY_DELAY_MS,
            char.replyDelayJitterMs ?? DEFAULT_DELAY_SETTINGS.REPLY_DELAY_JITTER_MS
        );

        setTimeout(() => {
            setPlayerStoryState(prevState => {
                if (!prevState) return null;
                const replyState = JSON.parse(JSON.stringify(prevState)) as PlayerStoryState;
                if (!replyState.inboxThreads[threadId]) return replyState; 

                replyState.inboxThreads[threadId].messages.push({
                    id: `msg_recv_sp_${Date.now()}_${Math.random().toString(16).slice(2)}`, threadId, senderId: targetCharacterId, recipientId: 'player', body: "Roger that. (Smartphone placeholder reply to: " + messageBody.substring(0,20) + "...)",
                    timestamp: new Date().toISOString(), type: 'received', isRead: false
                });
                replyState.inboxThreads[threadId].lastMessageTimestamp = new Date().toISOString();
                replyState.inboxThreads[threadId].hasUnread = true;
                
                const app = replyState.smartphoneInstalledApps['whispertalk'];
                if(app) {
                    app.unreadCount = (app.unreadCount || 0) + 1;
                    const newNotification = {
                        id: `notif_sp_${Date.now()}`, appId: 'whispertalk', appName: app.appName,
                        title: char.name, message: "Roger that. (Smartphone...)",
                        timestamp: new Date().toISOString(), isRead: false,
                        action: { type: 'open_chat' as const, targetId: threadId }
                    };
                    replyState.smartphoneNotificationQueue = [
                        ...replyState.smartphoneNotificationQueue,
                        newNotification
                    ];
                }
                return replyState;
            });
        }, replyDelay);
    }
    setPlayerStoryState(tempState);
  };

  const handleTerminalChatSend = async (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => {
    if (!playerStoryState || !gameData) return;

    const charTemplate = gameData.characters[targetCharacterId];
    if (!charTemplate) {
        console.error("Target character not found for terminal chat:", targetCharacterId);
        return;
    }

    const playerMsgId = `term_chat_sent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const playerMsgTimestamp = new Date().toISOString();
    const playerTerminalMessage: TerminalChatMessage = {
        id: playerMsgId,
        timestamp: playerMsgTimestamp,
        senderId: 'player',
        senderName: playerStoryState.username,
        body: messageBody,
        attachmentTitles: attachmentIds.map(id => gameData.evidence[id]?.title || id),
        type: 'sent',
        isReadByCharacter: false, 
    };

    setPlayerStoryState(prevState => {
        if (!prevState) return null;
        const newState = { ...prevState };
        const newTerminalChatThreads = { ...newState.terminalChatThreads };
        if (!newTerminalChatThreads[targetCharacterId]) {
            newTerminalChatThreads[targetCharacterId] = {
                characterId: targetCharacterId,
                messages: [],
                lastMessageTimestamp: playerMsgTimestamp,
            };
        }
        newTerminalChatThreads[targetCharacterId].messages.push(playerTerminalMessage);
        newTerminalChatThreads[targetCharacterId].lastMessageTimestamp = playerMsgTimestamp;
        newState.terminalChatThreads = newTerminalChatThreads;
        return newState;
    });

    const trustLevel = playerStoryState.playerTrustLevels[targetCharacterId] ?? 
                       (playerStoryState.characterDynamicData[targetCharacterId]?.trustLevel || 50);

    const charMinReadDelay = charTemplate.minReadDelayMs ?? DEFAULT_DELAY_SETTINGS.MIN_READ_DELAY_MS;
    const charMaxReadDelay = charTemplate.maxReadDelayMs ?? DEFAULT_DELAY_SETTINGS.MAX_READ_DELAY_MS;
    const charReadJitter = charTemplate.readDelayJitterMs ?? DEFAULT_DELAY_SETTINGS.READ_DELAY_JITTER_MS;
    const readDelay = calculateTrustBasedDelay(trustLevel, charMinReadDelay, charMaxReadDelay, charReadJitter);

    setTimeout(() => {
      setPlayerStoryState(prevState => {
        if (!prevState) return null;
        const newState = JSON.parse(JSON.stringify(prevState)) as PlayerStoryState; // Deep copy for safety
        const threads = newState.terminalChatThreads;
        if (threads && threads[targetCharacterId]) {
            const threadMessages = threads[targetCharacterId].messages;
            const msgIndex = threadMessages.findIndex(msg => msg.id === playerMsgId);
            if (msgIndex !== -1 && threadMessages[msgIndex].isReadByCharacter === false) { // Ensure we only update if not already marked
                threadMessages[msgIndex] = { ...threadMessages[msgIndex], isReadByCharacter: true };
                threads[targetCharacterId] = { ...threads[targetCharacterId], messages: [...threadMessages] }; // New array for messages
                newState.terminalChatThreads = { ...threads }; // New object for threads
                return newState;
            }
        }
        return prevState; 
      });
      
      const charMinReplyDelay = charTemplate.minReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MIN_REPLY_DELAY_MS;
      const charMaxReplyDelay = charTemplate.maxReplyDelayMs ?? DEFAULT_DELAY_SETTINGS.MAX_REPLY_DELAY_MS;
      const charReplyJitter = charTemplate.replyDelayJitterMs ?? DEFAULT_DELAY_SETTINGS.REPLY_DELAY_JITTER_MS;
      const replyDelay = calculateTrustBasedDelay(trustLevel, charMinReplyDelay, charMaxReplyDelay, charReplyJitter);

      setTimeout(async () => {
        let stateForInteractionProcessing: PlayerStoryState | null = null;
        setPlayerStoryState(currentLatestState => {
            stateForInteractionProcessing = currentLatestState;
            return currentLatestState;
        });

        if (!stateForInteractionProcessing || !gameData) {
            console.error("Cannot process NPC reply: state or gameData is null at reply time.");
            return;
        }

        const { npcReplyMessages, newPlayerStoryState: updatedStateAfterInteraction } = 
            await processTerminalCharacterInteraction(
                targetCharacterId,
                messageBody,
                attachmentIds,
                stateForInteractionProcessing, 
                gameData
            );

        setPlayerStoryState(prevPlayerState => {
          if (!prevPlayerState) return null; 
          
          let finalStateAfterReply = { 
            ...prevPlayerState, 
            narrativeFlags: { ...prevPlayerState.narrativeFlags, ...updatedStateAfterInteraction.narrativeFlags },
            playerTrustLevels: { ...prevPlayerState.playerTrustLevels, ...updatedStateAfterInteraction.playerTrustLevels },
            characterDynamicData: { ...prevPlayerState.characterDynamicData, ...updatedStateAfterInteraction.characterDynamicData },
            playerEthicalScore: updatedStateAfterInteraction.playerEthicalScore,
            discoveredEvidenceIds: [...new Set([...prevPlayerState.discoveredEvidenceIds, ...updatedStateAfterInteraction.discoveredEvidenceIds])], // Merge arrays ensuring uniqueness
            solvedPuzzleIds: [...new Set([...prevPlayerState.solvedPuzzleIds, ...updatedStateAfterInteraction.solvedPuzzleIds])],
          };

          const freshTerminalChatThreads = JSON.parse(JSON.stringify(finalStateAfterReply.terminalChatThreads)) as Record<string, TerminalChatThread>;
          if (!freshTerminalChatThreads[targetCharacterId]) {
              freshTerminalChatThreads[targetCharacterId] = {
                  characterId: targetCharacterId,
                  messages: [],
                  lastMessageTimestamp: new Date().toISOString(),
              };
          }
          npcReplyMessages.forEach(replyMsg => {
              const msgWithReadStatus = { ...replyMsg, isReadByPlayer: false }; 
              freshTerminalChatThreads[targetCharacterId].messages.push(msgWithReadStatus);
              if (new Date(replyMsg.timestamp) > new Date(freshTerminalChatThreads[targetCharacterId].lastMessageTimestamp)) {
                  freshTerminalChatThreads[targetCharacterId].lastMessageTimestamp = replyMsg.timestamp;
              }
          });
          finalStateAfterReply.terminalChatThreads = freshTerminalChatThreads;
          return finalStateAfterReply;
        });

      }, replyDelay);
    }, readDelay);
  };

  const handleMarkAsReadSmartphone = (threadId: string, messageId?: string) => {
     setPlayerStoryState(prev => {
        if (!prev || !prev.inboxThreads || !prev.inboxThreads[threadId]) return prev;
        const newInboxThreads = JSON.parse(JSON.stringify(prev.inboxThreads)) as Record<string, ConversationThread>;
        const thread = newInboxThreads[threadId];
        let allMessagesInThreadRead = true;
        let unreadCountChange = 0;

        thread.messages.forEach(msg => {
            if (msg.recipientId === 'player' && msg.type === 'received' && !msg.isRead) {
                 if (messageId === undefined || msg.id === messageId ) {
                    msg.isRead = true;
                    unreadCountChange++;
                 }
            }
            if(msg.recipientId === 'player' && msg.type === 'received' && !msg.isRead) {
                allMessagesInThreadRead = false;
            }
        });
        thread.hasUnread = !allMessagesInThreadRead;

        const updatedApps = { ...prev.smartphoneInstalledApps };
        const msgApp = updatedApps['whispertalk']; 
        if (msgApp && unreadCountChange > 0) {
            msgApp.unreadCount = Math.max(0, (msgApp.unreadCount || 0) - unreadCountChange);
        }
        
        return { ...prev, inboxThreads: newInboxThreads, smartphoneInstalledApps: updatedApps };
    });
  };
  
  const handleMarkAsReadTerminalChat = (characterId: string, messageId?: string) => {
    setPlayerStoryState(prevState => {
      if (!prevState || !prevState.terminalChatThreads || !prevState.terminalChatThreads[characterId]) return prevState;
      
      const newState = JSON.parse(JSON.stringify(prevState)) as PlayerStoryState; // Deep copy
      const threads = newState.terminalChatThreads;
      const thread = threads[characterId];
      let changed = false;

      thread.messages.forEach((msg) => { // No need for index if mutating copy
        if (msg.senderId === characterId && !msg.isReadByPlayer) {
          if (messageId === undefined || msg.id === messageId) { 
            msg.isReadByPlayer = true;
            changed = true;
          }
        }
      });

      if (changed) {
        return newState;
      }
      return prevState; // Return original state if no changes
    });
  };

  const hasUnreadTerminalChats = useMemo(() => {
    if (!playerStoryState?.terminalChatThreads) return false;
    for (const charId in playerStoryState.terminalChatThreads) {
        const thread = playerStoryState.terminalChatThreads[charId];
        if (thread.messages.some(msg => msg.senderId !== 'player' && !msg.isReadByPlayer)) {
            return true;
        }
    }
    return false;
  }, [playerStoryState?.terminalChatThreads]);

  if (appPhase === 'loading' && !BYPASS_LOGIN_FOR_TESTING) {
    return <div className="flex items-center justify-center h-screen bg-black text-green-400"><p>アプリケーションをロード中...</p></div>;
  }
  if (appPhase === 'error_loading_story' || appPhase === 'no_more_stories') {
    const title = appPhase === 'no_more_stories' ? "すべてのストーリーをクリアしました！" : "エラー";
    const body = appPhase === 'no_more_stories' ? "プレイしていただきありがとうございます。" : (errorMessage || "ストーリーファイルの読み込み中に予期せぬエラーが発生しました。");
    return <div className="flex flex-col items-center justify-center h-screen bg-black text-red-400 p-4">
        <p className="text-xl mb-4">{title}</p>
        <p className="mb-4">{body}</p>
        <button onClick={() => { setErrorMessage(null); setAppPhase('login'); setCurrentUsernameForLoad(null);}} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded">ログインに戻る</button>
    </div>;
  }

  if (appPhase === 'login' && !BYPASS_LOGIN_FOR_TESTING) {
    return <LoginScreen onLogin={handleLogin} initialUsername={currentUsernameForLoad || ''} />;
  }

  if (appPhase === 'story_loading' || !playerStoryState || !gameData) {
     return <div className="flex items-center justify-center h-screen bg-black text-green-400"><p>ストーリー「{currentStoryData?.storyInfo.title || '...'}」をロード中...</p></div>;
  }

  const TabButton: React.FC<{ tabId: ActiveSidePanelTab; currentTab: ActiveSidePanelTab; onClick: (tabId: ActiveSidePanelTab) => void; children: React.ReactNode; hasUnread?: boolean; }> = 
    ({ tabId, currentTab, onClick, children, hasUnread }) => (
    <button
      onClick={() => onClick(tabId)}
      className={`relative px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none transition-colors
                  ${currentTab === tabId 
                    ? 'bg-gray-800 text-teal-300 border-b-2 border-teal-400' 
                    : 'text-gray-400 hover:text-teal-400 hover:bg-gray-700'}`}
      aria-pressed={currentTab === tabId}
      role="tab"
      aria-controls={`side-panel-${tabId}-content`} 
      id={`side-panel-${tabId}-tab`}
    >
      {children}
      {hasUnread && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-800"></span>
      )}
    </button>
  );
  
  const currentDevicePromptConfig: DeviceConfig | StoryContentData['storyInfo']['playerDefaultDeviceConfig'] | undefined = 
    gameData.deviceConfigurations?.[playerStoryState.currentConnectedDeviceId] || 
    (playerStoryState.currentConnectedDeviceId === PLAYER_MAIN_NODE_ID ? gameData.storyInfo.playerDefaultDeviceConfig : undefined);


  return (
    <div className="h-screen w-screen flex flex-col md:flex-row p-1 bg-black overflow-hidden gap-1 md:gap-2">
      <div className="flex-grow-0 shrink-0 md:w-[320px] lg:w-[360px] xl:w-[400px] h-full p-1 flex items-center justify-center order-first overflow-hidden">
        {playerStoryState && gameData && (
          <SmartphoneUI
            playerState={playerStoryState}
            gameData={gameData}
            onPlayerStateChange={handlePlayerStoryStateChange}
            onSendMessage={handleSendMessageFromSmartphone}
            onMarkAsRead={handleMarkAsReadSmartphone}
          />
        )}
      </div>

      <div className="flex-grow basis-0 flex flex-col md:flex-row gap-1 md:gap-2 overflow-hidden order-last">
        <div className="md:w-2/3 h-1/2 md:h-full order-1"> 
          <ShellInterface
            key={`shell-session-${playerStoryState.username}-story${playerStoryState.currentStoryNumber}-${isDebugModeActive}-${playerStoryState.currentConnectedDeviceId}`} // More stable key
            playerState={playerStoryState}
            gameData={gameData}
            onPlayerStateChange={handlePlayerStoryStateChange}
            initialMessages={initialShellMessages}
            onRequestExitApplication={handleRequestExit} 
            currentDevicePromptConfig={currentDevicePromptConfig} 
            debugModeSpeed={isDebugModeActive}
          />
        </div>
        <div className="md:w-1/3 h-1/2 md:h-full flex flex-col gap-1 md:gap-2 order-2 overflow-hidden"> 
          <div className="flex-grow-[1] basis-0 overflow-hidden"> 
            <DataRepository
              playerState={playerStoryState}
              gameData={gameData}
              onPlayerStateChange={handlePlayerStoryStateChange}
            />
          </div>
          <div className="flex-grow-[1] basis-0 overflow-hidden flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
            <div className="flex border-b border-gray-700 px-2 pt-1" role="tablist" aria-label="Side Panel Tabs">
              <TabButton tabId="contacts" currentTab={activeSidePanelTab} onClick={setActiveSidePanelTab}>Contacts</TabButton>
              <TabButton tabId="chat" currentTab={activeSidePanelTab} onClick={setActiveSidePanelTab} hasUnread={hasUnreadTerminalChats}>Chat</TabButton>
            </div>
            <div className="flex-grow overflow-hidden"> 
              {activeSidePanelTab === 'contacts' && (
                <div id="side-panel-contacts-content" role="tabpanel" aria-labelledby="side-panel-contacts-tab" className="h-full">
                  <CharacterProfile
                      playerState={playerStoryState}
                      gameData={gameData}
                      onPlayerStateChange={handlePlayerStoryStateChange}
                  />
                </div>
              )}
              {activeSidePanelTab === 'chat' && (
                 <div id="side-panel-chat-content" role="tabpanel" aria-labelledby="side-panel-chat-tab" className="h-full">
                  <ChatPanel
                      playerState={playerStoryState}
                      gameData={gameData}
                      onMarkAsRead={handleMarkAsReadTerminalChat}
                      onSendMessage={handleTerminalChatSend}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
