
import { PlayerStoryState, StoryContentData, ShellMessage, GameData, ParsedCommand, CommandDefinition, EvidenceItem, InboxMessage, TerminalChatMessage, FileSystemNodeType, FileNode } from '../types';
import { parseCommand } from './commandParser';
import { getNodeFromPath } from './fileSystemService'; 
import { PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID, DEFAULT_DELAY_SETTINGS } from '../src/constants'; // Import constants

// calculateTrustBasedDelay and DEFAULT_DELAY_SETTINGS will be passed from App.tsx

export const DEBUG_USERNAME = 'adminalpine';
export const DEBUG_PASSWORD = 'adminalpine'; 

function generateDebugId(): string {
  return `debug_msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function runAutomatedDebugSequence(
  initialDebugPlayerStoryState: PlayerStoryState,
  storyDataForDebug: StoryContentData,
  commandDefinitions: Record<string, CommandDefinition>,
  processCommandFn: (parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState, anOutputDelay?: number }>,
  processTerminalChatFn: (targetCharacterId: string, messageBody: string, attachmentIds: string[], playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ npcReplyMessages: TerminalChatMessage[], newPlayerStoryState: PlayerStoryState }>,
  calculateTrustBasedDelayFn: (trustLevel: number, minDelayAtHighTrust: number, maxDelayAtLowTrust: number, randomJitterRange?: number) => number,
  // Pass DEFAULT_DELAY_SETTINGS from constants via App.tsx if needed, or use imported one
  defaultLocalDelaySettings: typeof DEFAULT_DELAY_SETTINGS 
): Promise<{ finalMessages: ShellMessage[], finalDebugState: PlayerStoryState }> {
  
  let currentDebugState = JSON.parse(JSON.stringify(initialDebugPlayerStoryState)) as PlayerStoryState;
  const allMessages: ShellMessage[] = [];

  const debugGameData: GameData = {
    ...storyDataForDebug,
    commandDefinitions: commandDefinitions,
  };

  const addSystemMessage = (text: string, isRawHTML: boolean = false) => {
    allMessages.push({ id: generateDebugId(), type: 'system', text, isRawHTML });
  };
  
  const addMessageObject = (message: ShellMessage) => {
     allMessages.push({ ...message, id: generateDebugId() });
  };

  const executeTest = async (commandString: string, description: string) => {
    addSystemMessage(`\n<span class="text-purple-300">--- DEBUG: Executing '${commandString}' (${description}) ---</span>`, true);
    const parsed: ParsedCommand = parseCommand(commandString);

    addMessageObject({
        id: generateDebugId(), type: 'prompt', text: '',
        pathAtCommandTime: currentDebugState.currentPath,
        deviceIdAtCommandTime: currentDebugState.currentConnectedDeviceId
    });
    addMessageObject({
        id: generateDebugId(), type: 'input', text: commandString,
    });

    const { outputMessages: cmdOutput, newPlayerStoryState: nextState } = await processCommandFn(parsed, currentDebugState, debugGameData);
    cmdOutput.forEach(msg => addMessageObject({ ...msg, id: generateDebugId() }));
    currentDebugState = nextState;
    addSystemMessage(`<span class="text-purple-300">--- DEBUG: Finished '${commandString}' ---</span>`, true);
  };

  const executeChatTest = async (
    targetCharacterId: string,
    messageBody: string,
    attachmentIds: string[],
    description: string
  ) => {
    const character = storyDataForDebug.characters[targetCharacterId];
    if (!character) {
      addSystemMessage(`<span class="text-red-500">--- DEBUG CHAT ERROR: Character '${targetCharacterId}' not found. Skipping chat test. ---</span>`, true);
      return;
    }
    const characterName = character.name;
    addSystemMessage(`\n<span class="text-cyan-300">--- DEBUG CHAT (Terminal): Sending message to ${characterName} (${description}) ---</span>`, true);
    
    const playerSentTerminalMessage: TerminalChatMessage = {
        id: generateDebugId(),
        timestamp: new Date().toISOString(),
        senderId: 'player',
        senderName: currentDebugState.username,
        body: messageBody,
        attachmentTitles: attachmentIds.map(id => {
            const ev = storyDataForDebug.evidence[id] as EvidenceItem | undefined;
            return ev?.title || id;
        }),
        type: 'sent'
    };
    addMessageObject({
        id: generateDebugId(), type: 'output', 
        text: `To ${characterName}: ${playerSentTerminalMessage.body}${playerSentTerminalMessage.attachmentTitles && playerSentTerminalMessage.attachmentTitles.length > 0 ? ` [Attachments: ${playerSentTerminalMessage.attachmentTitles.join(', ')}]` : ''}`,
        source: `DEBUG_CHAT_PLAYER (${currentDebugState.username})`
    });
    if (!currentDebugState.terminalChatThreads[targetCharacterId]) {
        currentDebugState.terminalChatThreads[targetCharacterId] = { characterId: targetCharacterId, messages: [], lastMessageTimestamp: new Date().toISOString() };
    }
    currentDebugState.terminalChatThreads[targetCharacterId].messages.push(playerSentTerminalMessage);

    const trustLevel = currentDebugState.characterDynamicData[targetCharacterId]?.trustLevel ?? 50;
    const characterConfig = storyDataForDebug.characters[targetCharacterId];

    const charMinReadDelay = characterConfig?.minReadDelayMs ?? defaultLocalDelaySettings.MIN_READ_DELAY_MS;
    const charMaxReadDelay = characterConfig?.maxReadDelayMs ?? defaultLocalDelaySettings.MAX_READ_DELAY_MS;
    const charReadJitter = characterConfig?.readDelayJitterMs ?? defaultLocalDelaySettings.READ_DELAY_JITTER_MS;
    const actualReadDelay = calculateTrustBasedDelayFn(trustLevel, charMinReadDelay, charMaxReadDelay, charReadJitter);
    
    addSystemMessage(`<span class="text-gray-400">... Simulating ${characterName} reading message (delay: ${actualReadDelay.toFixed(0)}ms) ...</span>`, true);
    // In debug mode, speed up delays significantly for faster testing
    await new Promise(resolve => setTimeout(resolve, actualReadDelay / (DEFAULT_DELAY_SETTINGS.MAX_REPLY_DELAY_MS / 100) )); 

    addSystemMessage(`<span class="text-green-300">--- ${characterName} has read the message. ---</span>`, true);
     // Update player's message to isReadByCharacter = true (simulating UI update)
    const playerMsgIdx = currentDebugState.terminalChatThreads[targetCharacterId].messages.findIndex(m => m.id === playerSentTerminalMessage.id);
    if (playerMsgIdx !== -1) {
        currentDebugState.terminalChatThreads[targetCharacterId].messages[playerMsgIdx].isReadByCharacter = true;
    }


    const charMinReplyDelay = characterConfig?.minReplyDelayMs ?? defaultLocalDelaySettings.MIN_REPLY_DELAY_MS;
    const charMaxReplyDelay = characterConfig?.maxReplyDelayMs ?? defaultLocalDelaySettings.MAX_REPLY_DELAY_MS;
    const charReplyJitter = characterConfig?.replyDelayJitterMs ?? defaultLocalDelaySettings.REPLY_DELAY_JITTER_MS;
    const actualReplyDelay = calculateTrustBasedDelayFn(trustLevel, charMinReplyDelay, charMaxReplyDelay, charReplyJitter);

    addSystemMessage(`<span class="text-gray-400">... Simulating ${characterName} formulating reply (delay: ${actualReplyDelay.toFixed(0)}ms) ...</span>`, true);
    await new Promise(resolve => setTimeout(resolve, actualReplyDelay / (DEFAULT_DELAY_SETTINGS.MAX_REPLY_DELAY_MS / 100) )); 
    
    const { npcReplyMessages, newPlayerStoryState: stateAfterRepliesLogic } =
      await processTerminalChatFn( 
        targetCharacterId,
        messageBody,
        attachmentIds,
        currentDebugState, 
        debugGameData
      );

    currentDebugState = stateAfterRepliesLogic;

    if (!currentDebugState.terminalChatThreads[targetCharacterId]) {
        currentDebugState.terminalChatThreads[targetCharacterId] = { characterId: targetCharacterId, messages: [], lastMessageTimestamp: new Date().toISOString() };
    }
    npcReplyMessages.forEach(terminalMsg => {
      currentDebugState.terminalChatThreads[targetCharacterId].messages.push({...terminalMsg, isReadByPlayer: true}); // Auto-read NPC msgs in debug
      addMessageObject({ 
          id: generateDebugId(), 
          type: 'output', 
          text: terminalMsg.body, 
          source: terminalMsg.senderName || terminalMsg.senderId 
      });
    });
     addSystemMessage(`<span class="text-cyan-300">--- DEBUG CHAT (Terminal): Finished interaction with ${characterName} ---</span>`, true);
  };


  addSystemMessage("===== STARTING ANONYMOUS FILE DEBUG MODE (Story " + storyDataForDebug.storyInfo.storyNumber + ") =====");
  // Initial welcome sequence is now handled by App.tsx & ShellInterface
  
  // Run initial commands
  await executeTest("help", "Display all help on main node");
  await executeTest("ls", "List root directory on main node");
  await executeTest("cat /docs/mission_brief.txt", "Read mission_brief.txt on main node");
  
  await executeTest("crack_device Luna-CellOS", "Crack Luna's phone to access its shell"); 
  
  if (currentDebugState.currentConnectedDeviceId === LUNAS_PHONE_SHELL_ID) {
    addSystemMessage("<span class='text-green-300'>DEBUG: Successfully connected to Luna's phone shell.</span>", true);
    await executeTest("ls /Downloads", "List downloads on Luna's phone");
    await executeTest("decrypt /Downloads/secret_archive_backup.zip Comet", "Decrypt secret_archive_backup.zip on Luna's phone");
  } else {
    addSystemMessage("<span class='text-yellow-300'>DEBUG: Not connected to Luna's phone shell. Skipping phone-specific tests.</span>", true);
  }
  
  // Ensure E003 is available for chat test if decryption was supposed to unlock it
  if (!currentDebugState.discoveredEvidenceIds.includes("E003_SecretZipDecrypted") && 
      storyDataForDebug.puzzles["P001_DecryptSecretZip"]?.unlocksEvidenceOnSuccess?.includes("E003_SecretZipDecrypted")) {
      // Check if puzzle was solved (which it should be after decrypt)
      if (currentDebugState.solvedPuzzleIds.includes("P001_DecryptSecretZip")) {
          currentDebugState.discoveredEvidenceIds.push("E003_SecretZipDecrypted");
           addSystemMessage("<span class='text-yellow-300'>DEBUG: Manually added E003_SecretZipDecrypted as it was unlocked by puzzle.</span>", true);
      } else {
          addSystemMessage("<span class='text-red-500'>DEBUG: E003_SecretZipDecrypted not found and puzzle P001 not solved.</span>", true);
      }
  }


  await executeChatTest(
    "AdminAlex", 
    "Hello Alex, I have decrypted an archive from Luna's phone. It seems important.", 
    ["E003_SecretZipDecrypted"], 
    "Sending message and E003 to AdminAlex via Terminal Chat"
  );
  
  await executeChatTest(
    "MysteriousInformant",
    "Can you tell me more about Luna's disappearance?",
    [],
    "Querying Mysterious Informant via Terminal Chat"
  );

  // Return to main node if shelled into phone
  if (currentDebugState.currentConnectedDeviceId !== PLAYER_MAIN_NODE_ID) {
      await executeTest("exit", "Exiting current device shell to return to main node");
  }

  // Only attempt reset_password if on main node
  if (currentDebugState.currentConnectedDeviceId === PLAYER_MAIN_NODE_ID) {
    await executeTest("reset_password rival_email --q \"oldoaktree\"", "Reset rival's email password");
  } else {
     addSystemMessage("<span class='text-yellow-300'>DEBUG: Not on main node. Skipping rival_email password reset test.</span>", true);
  }
  
  // Ensure E004 is available for accusation if reset_password was supposed to unlock it
  if (!currentDebugState.discoveredEvidenceIds.includes("E004_RivalEmailAccess") && 
      storyDataForDebug.puzzles["P002_SocialEngineerRival"]?.unlocksEvidenceOnSuccess?.includes("E004_RivalEmailAccess")) {
      if (currentDebugState.solvedPuzzleIds.includes("P002_SocialEngineerRival")) {
          currentDebugState.discoveredEvidenceIds.push("E004_RivalEmailAccess");
          addSystemMessage("<span class='text-yellow-300'>DEBUG: Manually added E004_RivalEmailAccess as it was unlocked by puzzle.</span>", true);
      } else {
          addSystemMessage("<span class='text-red-500'>DEBUG: E004_RivalEmailAccess not found and puzzle P002 not solved.</span>", true);
      }
  }

  // Only attempt accuse if on main node
  if (currentDebugState.currentConnectedDeviceId === PLAYER_MAIN_NODE_ID) {
      await executeTest("accuse RivalStreamerX", "Attempt accuse RivalStreamerX");
  } else {
      addSystemMessage("<span class='text-yellow-300'>DEBUG: Not on main node. Skipping accusation.</span>", true);
  }


  let debugClearMet = false;
  if (storyDataForDebug.clearConditions && storyDataForDebug.clearConditions.length > 0) {
      const firstClearCond = storyDataForDebug.clearConditions[0]; 
      if (firstClearCond.completionType === "narrativeFlag" && firstClearCond.flagName) {
          const flagVal = currentDebugState.narrativeFlags[firstClearCond.flagName];
          if (flagVal !== undefined) { 
              if (firstClearCond.valueMustContain && typeof flagVal === 'string') {
                  debugClearMet = flagVal.toLowerCase().includes(firstClearCond.valueMustContain.toLowerCase());
              } else if (firstClearCond.expectedValue !== undefined) {
                  debugClearMet = flagVal === firstClearCond.expectedValue;
              } else if (typeof flagVal === 'boolean' && flagVal === true) { // Generic true check for flags
                  debugClearMet = true; 
              }
          }
      }
  } else {
      addSystemMessage("<span class='text-yellow-300'>DEBUG: No clear conditions defined for this story.</span>", true);
  }
  addSystemMessage(debugClearMet ? "--- Game Clear Verification: Conditions met for this story. ---" : "--- Game Clear Verification: Conditions NOT met for this story. ---");

  addSystemMessage("\n===== ANONYMOUS FILE DEBUG MODE COMPLETE =====");
  return { finalMessages: allMessages, finalDebugState: currentDebugState };
}
