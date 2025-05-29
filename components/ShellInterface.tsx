
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShellMessage, PlayerStoryState, GameData, ParsedCommand, FileSystemNodeType, DeviceConfig, StoryContentData } from '../types';
import { parseCommand } from '../services/commandParser';
import { processCommand } from '../services/gameLogicService';
import ShellOutputLine from './ShellOutputLine';
import { getNodeFromPath, resolvePath } from '../services/fileSystemService';
import { PLAYER_MAIN_NODE_ID } from '../src/constants';

interface ShellInterfaceProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  initialMessages?: ShellMessage[];
  onRequestExitApplication: () => void; 
  currentDevicePromptConfig?: DeviceConfig | StoryContentData['storyInfo']['playerDefaultDeviceConfig'];
  debugModeSpeed?: boolean; 
}

const ShellInterface: React.FC<ShellInterfaceProps> = ({ 
  playerState, 
  gameData, 
  onPlayerStateChange, 
  initialMessages = [], 
  onRequestExitApplication,
  currentDevicePromptConfig,
  debugModeSpeed = false 
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ShellMessage[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialMessagesProcessedRef = useRef(false); 

  const scrollToBottom = useCallback(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'auto' }); // Changed to auto for faster scroll with lots of output
  }, []);

  const processAndDisplayMessages = useCallback(async (messagesToProcess: ShellMessage[], baseDelayDefault: number = 50, perCharDelayDefault: number = 10, forInitialSetup: boolean = false) => {
    setIsProcessing(true);
    
    const baseDelay = debugModeSpeed ? 1 : baseDelayDefault;
    const perCharDelay = debugModeSpeed ? 0 : perCharDelayDefault;

    if (forInitialSetup && history.length === 0) { // Only clear history if it's actually empty for initial setup
        setHistory([]); 
    }

    for (let msgIdx = 0; msgIdx < messagesToProcess.length; msgIdx++) {
      const originalMessage = messagesToProcess[msgIdx];
      const typedMessageInstanceId = `${originalMessage.id}_typed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const messageShell: ShellMessage = { 
        ...originalMessage, 
        id: typedMessageInstanceId,
        text: originalMessage.type === 'progress' || originalMessage.isRawHTML ? originalMessage.text : '' // For progress/HTML, show full text immediately
      };
      
      setHistory(prev => [...prev, messageShell]);
      
      if (originalMessage.type !== 'progress' && !originalMessage.isRawHTML && originalMessage.text.length > 0) {
        for (let i = 0; i < originalMessage.text.length; i++) {
          if (perCharDelay > 0) await new Promise(r => setTimeout(r, perCharDelay));
          setHistory(prev => prev.map(h => 
              (h.id === typedMessageInstanceId) ? { ...h, text: originalMessage.text.substring(0, i + 1) } : h
          ));
        }
      }
      if (msgIdx < messagesToProcess.length - 1 && baseDelay > 0) {
        await new Promise(r => setTimeout(r, baseDelay));
      }
    }
    
    // setIsProcessing(false) will be handled by handleSubmit or the initial effect
  }, [debugModeSpeed, history.length]); // Add history.length to dependencies for forInitialSetup check


  useEffect(() => {
     if (initialMessages && initialMessages.length > 0 && !isProcessing && !initialMessagesProcessedRef.current ) {
        const initialBaseDelay = debugModeSpeed ? 1 : 30; 
        const initialPerCharDelay = debugModeSpeed ? 0 : 5; 
        
        // Set the ref immediately to prevent re-entry
        initialMessagesProcessedRef.current = true; 
        
        processAndDisplayMessages(initialMessages, initialBaseDelay, initialPerCharDelay, true)
            .finally(() => {
                setIsProcessing(false); // Ensure processing is false after initial messages
                // Do NOT reset initialMessagesProcessedRef.current here
            });
     } else if (initialMessagesProcessedRef.current && isProcessing && initialMessages.length > 0) {
        // If initial messages were processed but we are still processing (e.g. from debug sequence)
        // don't set isProcessing to false yet.
     }
  }, [initialMessages, debugModeSpeed, isProcessing, processAndDisplayMessages]); 


  useEffect(scrollToBottom, [history, scrollToBottom]);
  
  useEffect(() => {
    if (!isProcessing && playerState) { 
        inputRef.current?.focus();
    }
  }, [isProcessing, playerState?.currentPath, playerState?.username, playerState?.currentConnectedDeviceId]); 


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !playerState) return; 

    setIsProcessing(true);
    const currentInput = input.trim();
    setInput('');

    const historicalPromptMessage: ShellMessage = { 
        id: `prompt_${Date.now()}_${Math.random().toString(16).slice(2)}`, 
        type: 'prompt', 
        text: '', 
        pathAtCommandTime: playerState.currentPath,
        deviceIdAtCommandTime: playerState.currentConnectedDeviceId 
    };
    const historicalInputMessage: ShellMessage = {
        id: `input_${Date.now()}_${Math.random().toString(16).slice(2)}`, 
        text: currentInput, 
        type: 'input' 
    };

    setHistory(prev => [...prev, historicalPromptMessage, historicalInputMessage]);
    
    if (currentInput && (!commandHistory.length || commandHistory[commandHistory.length - 1] !== currentInput)) {
        setCommandHistory(prev => [...prev, currentInput]);
    }
    setHistoryIndex(-1); 

    const parsedCmd = parseCommand(currentInput); 
    const { outputMessages, newPlayerStoryState, anOutputDelay } = await processCommand(parsedCmd, playerState, gameData); 
    
    onPlayerStateChange(newPlayerStoryState);

    const clearSignalPresent = outputMessages.some(msg => msg.type === 'clear_signal');
    const exitSignalPresent = outputMessages.some(msg => msg.type === 'exit_signal');

    if (clearSignalPresent) {
      setHistory([]); 
      // DO NOT reset initialMessagesProcessedRef.current here. `clear` should only clear history.
    }
    
    const messagesToActuallyDisplay = outputMessages.filter(msg => msg.type !== 'clear_signal' && msg.type !== 'exit_signal');
    
    if (messagesToActuallyDisplay.length > 0) {
      const cmdBaseDelay = debugModeSpeed ? 1 : (anOutputDelay || 10); 
      const cmdPerCharDelay = debugModeSpeed ? 0 : 2; 
      await processAndDisplayMessages(messagesToActuallyDisplay, cmdBaseDelay, cmdPerCharDelay, false);
    }

    if (exitSignalPresent) {
      onRequestExitApplication(); 
    }
    
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!playerState || !gameData) return; 

    if (e.key === 'Tab') {
        e.preventDefault();
        if (isProcessing) return;

        const currentInputValue = input;
        const words = currentInputValue.trimStart().split(' ');
        const isTypingCommand = words.length <= 1 && !currentInputValue.endsWith(' ');
        const currentFs = playerState.deviceFileSystems[playerState.currentConnectedDeviceId];

        if (isTypingCommand) {
            const partialCommand = currentInputValue.trimStart().toLowerCase();
            const potentialCommands = Object.keys(gameData.commandDefinitions).filter(cmd => {
                const cmdDef = gameData.commandDefinitions[cmd];
                let isAllowedOnCurrentDevice = false;
                if (cmdDef.allowedDeviceContexts && cmdDef.allowedDeviceContexts.length > 0) {
                    isAllowedOnCurrentDevice = cmdDef.allowedDeviceContexts.includes(playerState.currentConnectedDeviceId);
                } else { 
                    isAllowedOnCurrentDevice = playerState.currentConnectedDeviceId === PLAYER_MAIN_NODE_ID;
                }
                return isAllowedOnCurrentDevice && cmd.startsWith(partialCommand);
            });

            if (potentialCommands.length === 1) {
                setInput(potentialCommands[0] + ' ');
            } else if (potentialCommands.length > 1) {
                let commonCommandPrefix = potentialCommands[0];
                for (let i = 1; i < potentialCommands.length; i++) {
                    while (potentialCommands[i].indexOf(commonCommandPrefix) !== 0 && commonCommandPrefix.length > 0) {
                        commonCommandPrefix = commonCommandPrefix.substring(0, commonCommandPrefix.length - 1);
                    }
                }

                if (commonCommandPrefix.length > partialCommand.length) {
                    setInput(commonCommandPrefix);
                } else {
                    const suggestionsMessage: ShellMessage = {
                        id: `suggestcmd_${Date.now()}`,
                        type: 'system',
                        text: "コマンド: " + potentialCommands.join('  ')
                    };
                    setHistory(prev => [...prev, suggestionsMessage]);
                }
            }
        } else { 
            const commandName = words[0].toLowerCase();
            const pathCommands = ['ls', 'dir', 'cd', 'cat', 'type', 'analyze', 'decrypt', 'grep']; 

            if (pathCommands.includes(commandName) && words.length > 0 && currentFs) {
                let argInProgress: string;
                let inputPrefixUpToArg: string; 

                const lastSpaceIdx = currentInputValue.lastIndexOf(' ');
                if (currentInputValue.endsWith(' ')) { 
                    argInProgress = '';
                    inputPrefixUpToArg = currentInputValue;
                } else {
                    argInProgress = currentInputValue.substring(lastSpaceIdx + 1);
                    inputPrefixUpToArg = currentInputValue.substring(0, lastSpaceIdx + 1);
                }
                
                let dirPortionOfArg: string; 
                let namePortionToComplete: string; 

                const lastSlashInArgInProgress = argInProgress.lastIndexOf('/');
                if (lastSlashInArgInProgress !== -1) {
                    dirPortionOfArg = argInProgress.substring(0, lastSlashInArgInProgress + 1);
                    namePortionToComplete = argInProgress.substring(lastSlashInArgInProgress + 1);
                } else {
                    dirPortionOfArg = '';
                    namePortionToComplete = argInProgress;
                }
                
                const resolvedBaseDirForSearch = resolvePath(playerState.currentPath, dirPortionOfArg);
                const baseDirNode = getNodeFromPath(resolvedBaseDirForSearch, currentFs);

                if (baseDirNode && baseDirNode.type === FileSystemNodeType.DIRECTORY) {
                    const itemsInDir = Object.values(baseDirNode.children);
                    const matches = itemsInDir.filter(item => item.name.startsWith(namePortionToComplete));

                    if (matches.length === 1) {
                        const item = matches[0];
                        let completedName = item.name;
                        let suffix = '';
                        if (item.type === FileSystemNodeType.DIRECTORY) {
                            completedName += '/';
                        } else { 
                            suffix = ' '; 
                        }
                        setInput(inputPrefixUpToArg + dirPortionOfArg + completedName + suffix);
                    } else if (matches.length > 1) {
                        let commonPathPrefix = matches[0].name;
                        for (let i = 1; i < matches.length; i++) {
                            while (matches[i].name.indexOf(commonPathPrefix) !== 0 && commonPathPrefix.length > 0) {
                                commonPathPrefix = commonPathPrefix.substring(0, commonPathPrefix.length - 1);
                            }
                        }

                        if (commonPathPrefix.length > namePortionToComplete.length) {
                            setInput(inputPrefixUpToArg + dirPortionOfArg + commonPathPrefix);
                        } else {
                            const suggestedNames = matches.map(item => item.name + (item.type === FileSystemNodeType.DIRECTORY ? '/' : '')).join('  ');
                            const suggestionsMessage: ShellMessage = {
                                id: `suggestpath_${Date.now()}`,
                                type: 'system',
                                text: "候補: " + suggestedNames
                            };
                            setHistory(prev => [...prev, suggestionsMessage]);
                        }
                    }
                }
            }
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isProcessing) return;
        if (commandHistory.length > 0) {
            const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isProcessing) return;
        if (historyIndex !== -1) {
            const newIndex = historyIndex + 1;
            if (newIndex >= commandHistory.length) { 
                setHistoryIndex(-1);
                setInput('');
            } else {
                 setHistoryIndex(newIndex);
                 setInput(commandHistory[newIndex]);
            }
        }
    } 
  };

  const isInputDisabled = isProcessing || !playerState;


  return (
    <div className="h-full flex flex-col p-2 md:p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
      <div 
        className="flex-grow overflow-y-auto terminal-output pr-2 mb-2" 
        onClick={() => inputRef.current?.focus()} 
        role="log"
        aria-live="polite"
      >
        {history.map((msg) => (
            <ShellOutputLine 
                key={msg.id} 
                message={msg}
                playerUsername={playerState.username} 
                gameData={gameData} 
                currentPath={playerState.currentPath} 
                currentDevicePromptConfig={currentDevicePromptConfig} 
            />
        ))}
        <form onSubmit={handleSubmit} className="flex items-center mt-1">
          {!isProcessing && playerState && ( 
            <ShellOutputLine 
              message={{ id: 'prompt-current', type: 'prompt', text: '' }} 
              playerUsername={playerState.username}
              gameData={gameData}
              currentPath={playerState.currentPath} 
              currentDevicePromptConfig={currentDevicePromptConfig}
            />
          )}
          <input
            ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-grow bg-transparent text-blue-300 focus:outline-none`} 
            disabled={isInputDisabled}
            autoComplete="off" spellCheck="false" aria-label="Command input"
          />
        </form>
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default ShellInterface;
