
import { PlayerStoryState, StoryContentData, ShellMessage, GameData, ParsedCommand, CommandDefinition, EvidenceItem, InboxMessage } from '../types';
import { parseCommand } from './commandParser';
// calculateTrustBasedDelay and DEFAULT_DELAY_SETTINGS will be passed from App.tsx

export const DEBUG_USERNAME = 'adminalpine';
export const DEBUG_PASSWORD = 'adminalpine'; // Not strictly used for validation here, but for identification

function generateDebugId(): string {
  return `debug_msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function runAutomatedDebugSequence(
  initialDebugPlayerStoryState: PlayerStoryState,
  storyDataForDebug: StoryContentData,
  commandDefinitions: Record<string, CommandDefinition>,
  processCommandFn: (parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState, anOutputDelay?: number }>,
  processEmailSubmissionFn: (targetCharacterId: string, emailBody: string, attachmentIds: string[], playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }>,
  calculateTrustBasedDelayFn: (trustLevel: number, minDelayAtHighTrust: number, maxDelayAtLowTrust: number, randomJitterRange?: number) => number,
  defaultDelaySettings: { MIN_READ_DELAY_MS: number, MAX_READ_DELAY_MS: number, READ_DELAY_JITTER_MS: number, MIN_REPLY_DELAY_MS: number, MAX_REPLY_DELAY_MS: number, REPLY_DELAY_JITTER_MS: number }
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
        usernameAtCommandTime: currentDebugState.username,
        pathAtCommandTime: currentDebugState.currentPath
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
    addSystemMessage(`\n<span class="text-cyan-300">--- DEBUG CHAT: Sending message to ${characterName} (${description}) ---</span>`, true);
    
    // Log player's sent message (simulating UI)
    const sentMsgDisplay: InboxMessage = {
        id: generateDebugId(),
        timestamp: new Date().toISOString(),
        sender: currentDebugState.username,
        recipient: characterName,
        body: messageBody,
        attachments: attachmentIds.map(id => {
            const ev = storyDataForDebug.evidence[id] as EvidenceItem | undefined;
            return { id, title: ev?.title || id };
        }),
        type: 'sent',
        isRead: true,
        recipientReadTimestamp: null,
    };
    addMessageObject({
        id: generateDebugId(), type: 'output', 
        text: `To ${characterName}: ${sentMsgDisplay.body}${sentMsgDisplay.attachments && sentMsgDisplay.attachments.length > 0 ? ` [Attachments: ${sentMsgDisplay.attachments.map(a=>a.title).join(', ')}]` : ''}`,
        source: `DEBUG_CHAT_PLAYER (${currentDebugState.username})`
    });


    const trustLevel = currentDebugState.characterDynamicData[targetCharacterId]?.trustLevel ?? 50;
    const characterConfig = storyDataForDebug.characters[targetCharacterId];

    // 1. "Read" Delay
    const charMinReadDelay = characterConfig?.minReadDelayMs ?? defaultDelaySettings.MIN_READ_DELAY_MS;
    const charMaxReadDelay = characterConfig?.maxReadDelayMs ?? defaultDelaySettings.MAX_READ_DELAY_MS;
    const charReadJitter = characterConfig?.readDelayJitterMs ?? defaultDelaySettings.READ_DELAY_JITTER_MS;
    const actualReadDelay = calculateTrustBasedDelayFn(trustLevel, charMinReadDelay, charMaxReadDelay, charReadJitter);
    
    addSystemMessage(`<span class="text-gray-400">... Simulating ${characterName} reading message (delay: ${actualReadDelay.toFixed(0)}ms) ...</span>`, true);
    await new Promise(resolve => setTimeout(resolve, actualReadDelay / 10)); // Reduced delay for debug speed

    addSystemMessage(`<span class="text-green-300">--- ${characterName} has read the message. ---</span>`, true);

    // 2. "Reply" Delay
    const charMinReplyDelay = characterConfig?.minReplyDelayMs ?? defaultDelaySettings.MIN_REPLY_DELAY_MS;
    const charMaxReplyDelay = characterConfig?.maxReplyDelayMs ?? defaultDelaySettings.MAX_REPLY_DELAY_MS;
    const charReplyJitter = characterConfig?.replyDelayJitterMs ?? defaultDelaySettings.REPLY_DELAY_JITTER_MS;
    const actualReplyDelay = calculateTrustBasedDelayFn(trustLevel, charMinReplyDelay, charMaxReplyDelay, charReplyJitter);

    addSystemMessage(`<span class="text-gray-400">... Simulating ${characterName} formulating reply (delay: ${actualReplyDelay.toFixed(0)}ms) ...</span>`, true);
    await new Promise(resolve => setTimeout(resolve, actualReplyDelay / 10)); // Reduced delay for debug speed
    
    // Process actual submission
    const { outputMessages: replyShellMessages, newPlayerStoryState: stateAfterRepliesLogic } =
      await processEmailSubmissionFn(
        targetCharacterId,
        messageBody,
        attachmentIds,
        currentDebugState, 
        debugGameData
      );

    currentDebugState = stateAfterRepliesLogic;

    // Log replies
    const sendingMessageTextPattern = `メールを ${characterName} に送信中...`;
    replyShellMessages.forEach(shellMsg => {
      if (shellMsg.type === 'clear_signal' || shellMsg.type === 'exit_signal') return;
      // Filter out the generic "Sending email..." message as we've handled phases explicitly
      if (shellMsg.type === 'system' && shellMsg.text === sendingMessageTextPattern) {
          return; 
      }
      addMessageObject({ ...shellMsg, id: generateDebugId(), source: shellMsg.source || characterName });
    });
     addSystemMessage(`<span class="text-cyan-300">--- DEBUG CHAT: Finished interaction with ${characterName} ---</span>`, true);
  };


  addSystemMessage("===== STARTING ANONYMOUS FILE DEBUG MODE (Story " + storyDataForDebug.storyInfo.storyNumber + ") =====");
  await executeTest("help", "Display all help");
  await executeTest("ls", "List root directory");
  await executeTest("cat /files/welcome.txt", "Read welcome.txt");
  
  // Example: Decrypt a file and get evidence for chat
  await executeTest("decrypt /files/secret.zip Comet", "Decrypt secret.zip");
  // Manually add E003 to discovered if decrypt was successful and it's related
  if (currentDebugState.fileSystemState && 
      currentDebugState.fileSystemState['/'] && 
      (currentDebugState.fileSystemState['/'] as any).children?.files?.children?.['secret.zip'] &&
      !(currentDebugState.fileSystemState['/'] as any).children.files.children['secret.zip'].isEncrypted) {
      if (!currentDebugState.discoveredEvidenceIds.includes("E003_SecretZipDecrypted")) {
          currentDebugState.discoveredEvidenceIds.push("E003_SecretZipDecrypted");
          addSystemMessage("<span class='text-yellow-300'>DEBUG: Manually added E003_SecretZipDecrypted to discovered evidence for chat test.</span>", true);
      }
  }


  // Chat Test
  await executeChatTest(
    "AdminAlex", 
    "Hello Alex, I found this important document.", 
    ["E003_SecretZipDecrypted"], // Ensure this evidence ID is valid in story-01.ts and discoverable/added above
    "Sending message and E003 to AdminAlex"
  );
  
  await executeChatTest(
    "MysteriousInformant",
    "Who are you?",
    [],
    "Querying Mysterious Informant"
  );


  await executeTest("accuse RivalStreamerX", "Attempt accuse (story specific)");

  const clearCond = storyDataForDebug.clearConditions;
  let debugClearMet = false;
  if (clearCond.completionType === "narrativeFlag" && clearCond.flagName) {
      const flagVal = currentDebugState.narrativeFlags[clearCond.flagName];
      if (flagVal) {
          if (clearCond.valueMustContain && typeof flagVal === 'string') {
              debugClearMet = flagVal.toLowerCase().includes(clearCond.valueMustContain.toLowerCase());
          } else if (clearCond.expectedValue !== undefined) {
              debugClearMet = flagVal === clearCond.expectedValue;
          } else {
              debugClearMet = true;
          }
      }
  }
  addSystemMessage(debugClearMet ? "--- Game Clear Verification: Conditions met for this story. ---" : "--- Game Clear Verification: Conditions NOT met for this story. ---");

  addSystemMessage("\n===== ANONYMOUS FILE DEBUG MODE COMPLETE =====");
  return { finalMessages: allMessages, finalDebugState: currentDebugState };
}
