
import { ParsedCommand, PlayerStoryState, ShellMessage, GameData, CommandDefinition, FileSystemNodeType, FileNode, EvidenceItem, InitialFileNode, InitialFileSystemItem, Character, Puzzle, DialogueEntry, DialogueResponseOption } from '../types';
// Fix: Import getInitialNodeFromPath from fileSystemService
import { getNodeFromPath, resolvePath, listDirectoryContents, readFileContents, changeDirectory, getInitialNodeFromPath } from './fileSystemService';


function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getSystemMessage(gameData: GameData, key: keyof GameData['systemMessages'], placeholders?: Record<string, string>): string {
    let message = gameData.systemMessages?.[key] || `(System message key '${key}' not found)`;
    if (placeholders) {
        Object.entries(placeholders).forEach(([pk, pv]) => {
            message = message.replace(new RegExp(`{${pk.toUpperCase()}}`, 'g'), pv);
        });
    }
    return message;
}


// --- Command Handlers ---
async function handleHelp(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  let helpText = '利用可能なコマンド:\n'; // TODO: Make this configurable?
  if (parsedCommand.args.length > 0) {
    const cmdName = parsedCommand.args[0];
    const cmdDef = gameData.commandDefinitions[cmdName];
    if (cmdDef) {
      helpText = getSystemMessage(gameData, 'command_usage', { COMMAND_SYNTAX: cmdDef.syntax }) + `\n説明: ${cmdDef.description}`;
    } else {
      helpText = getSystemMessage(gameData, 'error_unknown_command', { COMMAND_NAME: cmdName });
    }
  } else {
    Object.values(gameData.commandDefinitions).forEach(cmd => {
      helpText += `  ${cmd.name.padEnd(15)} - ${cmd.description} (使用法: ${cmd.syntax})\n`;
    });
  }
  return {
    outputMessages: [{ id: generateId(), type: 'output', text: helpText }],
    newPlayerStoryState: playerStoryState
  };
}

async function handleLs(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  const targetPath = parsedCommand.args.length > 0 ? resolvePath(playerStoryState.currentPath, parsedCommand.args[0]) : playerStoryState.currentPath;
  const contents = listDirectoryContents(targetPath, playerStoryState.fileSystemState);
  if (contents.startsWith('Error: Path not found:')) {
    return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_path_not_found', { PATH_NAME: targetPath.substring(targetPath.lastIndexOf('/') + 1) || targetPath })}], newPlayerStoryState: playerStoryState };
  }
  if (contents.startsWith('Error: Not a directory:')) {
     return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_not_a_directory', { PATH_NAME: targetPath.substring(targetPath.lastIndexOf('/') + 1) || targetPath })}], newPlayerStoryState: playerStoryState };
  }
   if (contents === "(empty directory)") {
    return { outputMessages: [{ id: generateId(), type: 'output', text: getSystemMessage(gameData, 'empty_directory') || "(empty directory)" }], newPlayerStoryState: playerStoryState };
  }
  return {
    outputMessages: [{ id: generateId(), type: 'output', text: contents }],
    newPlayerStoryState: playerStoryState
  };
}

async function handleCd(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length === 0) {
    return {
      outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.cd.syntax }) }],
      newPlayerStoryState: playerStoryState
    };
  }
  const { newPath, error } = changeDirectory(parsedCommand.args[0], playerStoryState);
  if (error) {
     let translatedErrorKey: keyof GameData['systemMessages'] = 'error_path_not_found';
     if (error.includes('not a directory:')) {
        translatedErrorKey = 'error_not_a_directory';
     }
    return {
      outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, translatedErrorKey, { PATH_NAME: parsedCommand.args[0] }) }],
      newPlayerStoryState: playerStoryState
    };
  }
  return {
    outputMessages: [], 
    newPlayerStoryState: { ...playerStoryState, currentPath: newPath }
  };
}

async function handleCat(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length === 0) {
    return {
      outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.cat.syntax }) }],
      newPlayerStoryState: playerStoryState
    };
  }
  const filePath = resolvePath(playerStoryState.currentPath, parsedCommand.args[0]);
  const contentOrError = readFileContents(filePath, playerStoryState.fileSystemState);

  let outputText = '';
  let outputType: ShellMessage['type'] = 'output';
  let updatedPlayerStoryState = { ...playerStoryState };

  if (contentOrError.startsWith('Error: File not found:')) {
    outputText = getSystemMessage(gameData, 'error_file_not_found', { FILE_NAME: parsedCommand.args[0] });
    outputType = 'error';
  } else if (contentOrError.startsWith('Error: Not a file:')) {
     outputText = getSystemMessage(gameData, 'error_is_a_directory', { PATH_NAME: parsedCommand.args[0]}); // Using PATH_NAME as it might be a dir
     outputType = 'error';
  } else if (contentOrError === 'Error: File is encrypted. Use `decrypt` command.') {
    outputText = getSystemMessage(gameData, 'error_encrypted', { FILE_NAME: parsedCommand.args[0] });
    outputType = 'error';
  } else {
      outputText = contentOrError;
      const evidenceKey = Object.keys(gameData.evidence).find(key => gameData.evidence[key].source === filePath);
      if (evidenceKey && !updatedPlayerStoryState.discoveredEvidenceIds.includes(evidenceKey)) {
        updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, evidenceKey];
      }
  }
  
  return {
    outputMessages: [{ id: generateId(), type: outputType, text: outputText }],
    newPlayerStoryState: updatedPlayerStoryState
  };
}

async function handleAnalyze(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length === 0) {
        return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.analyze.syntax }) }], newPlayerStoryState: playerStoryState };
    }
    const targetName = parsedCommand.args[0];
    const filePath = resolvePath(playerStoryState.currentPath, targetName);
    const node = getNodeFromPath(filePath, playerStoryState.fileSystemState);

    let analysisText = getSystemMessage(gameData, 'info_analysis_notFound', { TARGET_NAME: targetName });
    const updatedPlayerStoryState = { ...playerStoryState };
    let newEvidenceUnlockedThisTurn: string[] = [];


    if (node && node.type === FileSystemNodeType.FILE && (node as FileNode).canAnalyze && (node as FileNode).analysisResult) {
        analysisText = (node as FileNode).analysisResult!;
        const evidenceKey = Object.keys(gameData.evidence).find(key => gameData.evidence[key].source === filePath);
        if (evidenceKey && !updatedPlayerStoryState.discoveredEvidenceIds.includes(evidenceKey)) {
            updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, evidenceKey];
            newEvidenceUnlockedThisTurn.push(gameData.evidence[evidenceKey]?.title || evidenceKey);
        }
    } else if (gameData.evidence[targetName] && updatedPlayerStoryState.discoveredEvidenceIds.includes(targetName)) {
        const evidenceItem = gameData.evidence[targetName];
        analysisText = `'${evidenceItem.title}'の分析:\n${evidenceItem.content}`; // TODO: Configurable base for evidence analysis?
    }

    const insightConfig = gameData.analysisInsights?.[targetName] || gameData.analysisInsights?.[filePath];
    if (insightConfig) {
        if (insightConfig.overrideBaseResult) {
            analysisText = insightConfig.overrideBaseResult;
        } else if (insightConfig.appendText) {
            analysisText += `\n${insightConfig.appendText}`;
        }

        if (insightConfig.unlocksEvidenceIds) {
            insightConfig.unlocksEvidenceIds.forEach(evId => {
                if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId) && gameData.evidence[evId]) {
                    updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, evId];
                    newEvidenceUnlockedThisTurn.push(gameData.evidence[evId]?.title || evId);
                }
            });
        }
        if (insightConfig.setNarrativeFlags) {
            updatedPlayerStoryState.narrativeFlags = { ...updatedPlayerStoryState.narrativeFlags, ...insightConfig.setNarrativeFlags };
        }
    }
    
    if (newEvidenceUnlockedThisTurn.length > 0) {
         analysisText += `\n` + getSystemMessage(gameData, 'info_new_evidence_added', { EVIDENCE_TITLE: newEvidenceUnlockedThisTurn.join(', ') });
    }

    return {
        outputMessages: [{ id: generateId(), type: 'output', text: analysisText }],
        newPlayerStoryState: updatedPlayerStoryState
    };
}

async function handleDecrypt(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length < 2) {
    return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.decrypt.syntax }) }], newPlayerStoryState: playerStoryState };
  }
  const fileName = parsedCommand.args[0];
  const passwordAttempt = parsedCommand.args[1];
  const filePath = resolvePath(playerStoryState.currentPath, fileName);
  
  const newFsState = JSON.parse(JSON.stringify(playerStoryState.fileSystemState));
  const nodeInNewFs = getNodeFromPath(filePath, newFsState) as FileNode | null; 

  let outputMessages: ShellMessage[] = [];
  let updatedPlayerStoryState = { ...playerStoryState }; 

  const puzzle = Object.values(gameData.puzzles).find(p => p.puzzleType === 'decryption' && p.targetFilePath === filePath);

  if (nodeInNewFs && nodeInNewFs.type === FileSystemNodeType.FILE) {
    if (nodeInNewFs.isEncrypted) {
      const correctPassword = puzzle?.correctPassword || nodeInNewFs.password; // Prefer puzzle definition
      if (correctPassword === passwordAttempt) {
        nodeInNewFs.isEncrypted = false;
        const originalInitialNode = getInitialNodeFromPath(filePath, gameData.initialFileSystem) as InitialFileNode | null;
        nodeInNewFs.content = nodeInNewFs.decryptedContent || originalInitialNode?.decryptedContent || getSystemMessage(gameData, 'error_file_not_found', { FILE_NAME: "解読済みコンテンツ" }); // Fallback
        nodeInNewFs.canAnalyze = true; 
        updatedPlayerStoryState.fileSystemState = newFsState; 
        
        outputMessages.push({ id: generateId(), type: 'output', text: getSystemMessage(gameData, 'info_decryption_success', { FILE_NAME: fileName }) });
        
        if (puzzle && !updatedPlayerStoryState.solvedPuzzleIds.includes(puzzle.id)) {
          updatedPlayerStoryState.solvedPuzzleIds = [...updatedPlayerStoryState.solvedPuzzleIds, puzzle.id];
          if (puzzle.unlocksEvidenceOnSuccess) {
            puzzle.unlocksEvidenceOnSuccess.forEach(evId => {
              if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId)) {
                updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, evId];
              }
            });
          }
          if (puzzle.narrativeScriptKeySuccess && gameData.narrativeScript[puzzle.narrativeScriptKeySuccess]) {
            outputMessages = outputMessages.concat(gameData.narrativeScript[puzzle.narrativeScriptKeySuccess]);
          }
        }
      } else {
        outputMessages.push({ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_invalid_password') });
      }
    } else {
      outputMessages.push({ id: generateId(), type: 'output', text: getSystemMessage(gameData, 'info_file_not_encrypted', { FILE_NAME: fileName }) });
    }
  } else {
    outputMessages.push({ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_file_not_found', { FILE_NAME: fileName }) });
  }
  return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
}

async function handleResetPassword(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length < 3 || parsedCommand.args[1] !== '--q') {
        return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.reset_password.syntax }) }], newPlayerStoryState: playerStoryState };
    }
    const accountName = parsedCommand.args[0];
    const answerAttempt = parsedCommand.args[2].toLowerCase(); 

    let outputMessages: ShellMessage[] = [];
    const updatedPlayerStoryState = { ...playerStoryState };

    const puzzle = Object.values(gameData.puzzles).find(p => p.puzzleType === 'passwordReset' && p.targetAccount?.toLowerCase() === accountName.toLowerCase());

    if (puzzle && puzzle.securityQuestionAnswerPairs) {
        const isCorrectAnswer = puzzle.securityQuestionAnswerPairs.some(pair => 
            pair.answers.some(ans => ans.toLowerCase() === answerAttempt)
        );

        if (isCorrectAnswer) {
            outputMessages.push({ id: generateId(), type: 'output', text: getSystemMessage(gameData, 'reset_password_success', { ACCOUNT_NAME: accountName }) });
            if (!updatedPlayerStoryState.solvedPuzzleIds.includes(puzzle.id)) {
                updatedPlayerStoryState.solvedPuzzleIds = [...updatedPlayerStoryState.solvedPuzzleIds, puzzle.id];
                if (puzzle.unlocksEvidenceOnSuccess) {
                    puzzle.unlocksEvidenceOnSuccess.forEach(evId => {
                        if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId)) {
                            updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, evId];
                        }
                    });
                }
                if (puzzle.narrativeScriptKeySuccess && gameData.narrativeScript[puzzle.narrativeScriptKeySuccess]) {
                    outputMessages = outputMessages.concat(gameData.narrativeScript[puzzle.narrativeScriptKeySuccess]);
                }
            }
        } else {
            outputMessages.push({ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'reset_password_failure', { ACCOUNT_NAME: accountName }) });
            if (puzzle.narrativeScriptKeyFailure && gameData.narrativeScript[puzzle.narrativeScriptKeyFailure]) {
                outputMessages = outputMessages.concat(gameData.narrativeScript[puzzle.narrativeScriptKeyFailure]);
            }
        }
    } else {
        outputMessages.push({ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'reset_password_target_not_found', { ACCOUNT_NAME: accountName }) });
    }
    return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
}


async function handleSubmitEvidence(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length < 2) {
        return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.submit_evidence.syntax }) }], newPlayerStoryState: playerStoryState };
    }
    const targetCharId = parsedCommand.args[0];
    const evidenceId = parsedCommand.args[1];

    const characterTemplate = gameData.characters[targetCharId];
    const evidenceItem = gameData.evidence[evidenceId];
    let updatedPlayerStoryState = { ...playerStoryState };
    let responseText = '';
    let responseSource = 'System';

    if (!characterTemplate) {
        responseText = getSystemMessage(gameData, 'submit_evidence_char_not_found', { CHAR_ID: targetCharId });
    } else if (!evidenceItem || !playerStoryState.discoveredEvidenceIds.includes(evidenceId)) {
        responseText = getSystemMessage(gameData, 'submit_evidence_item_not_found', { EVIDENCE_ID: evidenceId });
    } else {
        responseSource = characterTemplate.name;
        let charDynamicData = updatedPlayerStoryState.characterDynamicData[characterTemplate.id];
        if (!charDynamicData) charDynamicData = { trustLevel: characterTemplate.initialTrustLevel || 50 };


        const evidenceResponseConfig = characterTemplate.commandResponses?.submitEvidence?.[evidenceId];
        const defaultEvidenceResponseConfig = characterTemplate.commandResponses?.defaultSubmitEvidence;

        if (evidenceResponseConfig) {
            responseText = evidenceResponseConfig.responseText;
            if (evidenceResponseConfig.trustChange) {
                charDynamicData.trustLevel = Math.max(0, Math.min(100, charDynamicData.trustLevel + evidenceResponseConfig.trustChange));
            }
            if (evidenceResponseConfig.setNarrativeFlags) {
                updatedPlayerStoryState.narrativeFlags = { ...updatedPlayerStoryState.narrativeFlags, ...evidenceResponseConfig.setNarrativeFlags };
            }
            if (evidenceResponseConfig.unlocksEvidenceIds) {
                let newEvUnlockedTexts: string[] = [];
                evidenceResponseConfig.unlocksEvidenceIds.forEach(unlockedEvId => {
                    if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(unlockedEvId) && gameData.evidence[unlockedEvId]) {
                        updatedPlayerStoryState.discoveredEvidenceIds = [...updatedPlayerStoryState.discoveredEvidenceIds, unlockedEvId];
                        newEvUnlockedTexts.push(gameData.evidence[unlockedEvId].title);
                    }
                });
                if (newEvUnlockedTexts.length > 0) {
                     responseText += `\n(` + getSystemMessage(gameData, 'info_new_evidence_added', { EVIDENCE_TITLE: newEvUnlockedTexts.join(', ')}) + `)`;
                }
            }
        } else if (defaultEvidenceResponseConfig) {
            responseText = defaultEvidenceResponseConfig.responseText.replace('{EVIDENCE_TITLE}', evidenceItem.title);
            if (defaultEvidenceResponseConfig.trustChange) {
                charDynamicData.trustLevel = Math.max(0, Math.min(100, charDynamicData.trustLevel + defaultEvidenceResponseConfig.trustChange));
            }
        } else {
            responseText = getSystemMessage(gameData, 'submit_evidence_default_ack', { CHAR_NAME: characterTemplate.name, EVIDENCE_TITLE: evidenceItem.title });
        }
        updatedPlayerStoryState.characterDynamicData = { ...updatedPlayerStoryState.characterDynamicData, [characterTemplate.id]: charDynamicData };
    }
    return { outputMessages: [{ id: generateId(), type: 'output', text: responseText, source: responseSource }], newPlayerStoryState: updatedPlayerStoryState };
}

async function handleConnect(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length === 0) {
    return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.connect.syntax }) }], newPlayerStoryState: playerStoryState };
  }
  const target = parsedCommand.args[0];
  let outputText = '';
  const updatedPlayerStoryState = { ...playerStoryState };

  const connectionConfig = gameData.connectionPoints?.[target.toLowerCase()];

  if (connectionConfig) {
    outputText = connectionConfig.successResponseText;
    if (connectionConfig.setNarrativeFlags) {
        updatedPlayerStoryState.narrativeFlags = { ...updatedPlayerStoryState.narrativeFlags, ...connectionConfig.setNarrativeFlags };
    }
  } else {
    outputText = connectionConfig?.failureResponseText || getSystemMessage(gameData, 'connect_failed_default', { TARGET_HOST: target });
  }
  return { outputMessages: [{ id: generateId(), type: 'system', text: outputText }], newPlayerStoryState: updatedPlayerStoryState };
}

async function handleAccuse(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length === 0) {
        return { outputMessages: [{id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.accuse.syntax })}], newPlayerStoryState: playerStoryState };
    }
    const accusedEntityRaw = parsedCommand.args.join(" ");
    const accusedEntityLower = accusedEntityRaw.toLowerCase();
    let finalMessages: ShellMessage[] = [];
    let ruleMatched = false;
    
    const updatedPlayerStoryState = { ...playerStoryState };
    updatedPlayerStoryState.narrativeFlags = { ...playerStoryState.narrativeFlags }; 

    if (gameData.accusationRules) {
        for (const rule of gameData.accusationRules) {
            const keywordsMatch = rule.accusedEntityKeywords.some(keyword => accusedEntityLower.includes(keyword.toLowerCase()));
            if (!keywordsMatch) continue;

            let conditionsMet = true;
            if (rule.requiredEvidenceIds) {
                conditionsMet = rule.requiredEvidenceIds.every(id => updatedPlayerStoryState.discoveredEvidenceIds.includes(id));
            }
            if (conditionsMet && rule.requiredNarrativeFlags) {
                conditionsMet = Object.entries(rule.requiredNarrativeFlags).every(([key, value]) => updatedPlayerStoryState.narrativeFlags[key] === value);
            }

            if (conditionsMet) {
                updatedPlayerStoryState.narrativeFlags.final_choice_made = accusedEntityRaw; 
                updatedPlayerStoryState.narrativeFlags.story_completed_successfully = rule.isCorrectEnding;
                if (rule.setNarrativeFlagsOnSuccess) {
                    updatedPlayerStoryState.narrativeFlags = { ...updatedPlayerStoryState.narrativeFlags, ...rule.setNarrativeFlagsOnSuccess };
                }
                finalMessages = gameData.narrativeScript[rule.narrativeScriptKeySuccess] || 
                                [{id: generateId(), type: 'system', text: `告発(${accusedEntityRaw})は処理されました。`}]; // Generic fallback
                updatedPlayerStoryState.gameStage = 'ending';
                ruleMatched = true;
                break; 
            }
        }
    }

    if (!ruleMatched) {
        updatedPlayerStoryState.narrativeFlags.final_choice_made = accusedEntityRaw;
        updatedPlayerStoryState.narrativeFlags.story_completed_successfully = false;
        const failureKey = gameData.defaultAccusationFailureNarrativeScriptKey || 'final_choice_insufficient'; // Ensure 'final_choice_insufficient' exists
        finalMessages = gameData.narrativeScript[failureKey] || 
                        [{id: generateId(), type: 'system', text: `あなたは${accusedEntityRaw}を告発しましたが、証拠の追跡は不明瞭でした。`}]; // Generic fallback
        updatedPlayerStoryState.gameStage = 'ending';
    }
    
    if(gameData.narrativeScript['story_completed_end']) { // This is a general "thanks for playing" type message
        finalMessages = finalMessages.concat(gameData.narrativeScript['story_completed_end']);
    }
     // Append the specific story completion message if conditions are met by a rule
    if (updatedPlayerStoryState.narrativeFlags.story_completed_successfully && gameData.systemMessages?.story_complete_message) {
        finalMessages.push({ id: generateId(), type: 'system', text: gameData.systemMessages.story_complete_message });
    }


    return { outputMessages: finalMessages, newPlayerStoryState: updatedPlayerStoryState };
}


async function handleClear(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  return {
    outputMessages: [{ id: generateId(), type: 'clear_signal', text: '' }], 
    newPlayerStoryState: playerStoryState 
  };
}

async function handleExit(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  return {
    outputMessages: [{ id: generateId(), type: 'exit_signal', text: '' }], 
    newPlayerStoryState: playerStoryState 
  };
}


export async function processEmailSubmission(
    targetCharacterId: string,
    emailBody: string,
    attachmentIds: string[],
    playerStoryState: PlayerStoryState,
    gameData: GameData
): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    let currentProcessingState = { ...playerStoryState };
    let aggregatedMessages: ShellMessage[] = [];

    const targetCharacterTemplate = gameData.characters[targetCharacterId];
    if (!targetCharacterTemplate) {
        return { 
            outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'email_char_not_found_error', { CHAR_ID: targetCharacterId })}],
            newPlayerStoryState: playerStoryState
        };
    }
    
    // This "sending..." message is usually filtered by App.tsx, but keep it here for direct calls
    // aggregatedMessages.push({ id: generateId(), type: 'system', text: `メールを ${targetCharacterTemplate.name} に送信中...` });


    if (emailBody.trim()) {
        let charDynamicData = currentProcessingState.characterDynamicData[targetCharacterTemplate.id];
        if (!charDynamicData) { 
            charDynamicData = { trustLevel: targetCharacterTemplate.initialTrustLevel || 50 };
        }

        currentProcessingState.narrativeFlags = { 
            ...currentProcessingState.narrativeFlags, 
            [`contacted_${targetCharacterTemplate.id.toLowerCase()}`]: true 
        };
        
        let foundResponseEntry: DialogueEntry | null = null;
        const lowerEmailBody = emailBody.trim().toLowerCase();

        for (const key in targetCharacterTemplate.dialogueState) {
            if (key === 'default') continue; // Handle default last
            
            const dialogueEntry = targetCharacterTemplate.dialogueState[key] as DialogueEntry; // Assuming it's DialogueEntry if not string[]
            
            if (lowerEmailBody.includes(key.toLowerCase())) {
                 // Check conditions if it's a DialogueEntry object
                if (typeof dialogueEntry === 'object' && dialogueEntry.responses) {
                    const meetsTrustMin = dialogueEntry.requiredTrustMin === undefined || charDynamicData.trustLevel >= dialogueEntry.requiredTrustMin;
                    const meetsTrustMax = dialogueEntry.requiredTrustMax === undefined || charDynamicData.trustLevel <= dialogueEntry.requiredTrustMax;
                    const meetsNarrativeFlags = !dialogueEntry.requiredNarrativeFlags || Object.entries(dialogueEntry.requiredNarrativeFlags).every(
                        ([flagKey, expectedValue]) => currentProcessingState.narrativeFlags[flagKey] === expectedValue
                    );

                    if (meetsTrustMin && meetsTrustMax && meetsNarrativeFlags) {
                        foundResponseEntry = dialogueEntry;
                        break;
                    }
                } else if (Array.isArray(dialogueEntry)) { // Simple string array
                     foundResponseEntry = { responses: dialogueEntry }; // Wrap for consistent handling
                     break;
                }
            }
        }
        
        let responseText = '';
        if (foundResponseEntry) {
            const selectedResponse = foundResponseEntry.responses[Math.floor(Math.random() * foundResponseEntry.responses.length)];
            if (typeof selectedResponse === 'string') {
                responseText = `${targetCharacterTemplate.name}: ${selectedResponse}`;
            } else { // DialogueResponseOption
                responseText = `${targetCharacterTemplate.name}: ${selectedResponse.text}`;
                if (selectedResponse.trustChange) {
                    charDynamicData.trustLevel = Math.max(0, Math.min(100, charDynamicData.trustLevel + selectedResponse.trustChange));
                }
                if (selectedResponse.setNarrativeFlags) {
                     currentProcessingState.narrativeFlags = { ...currentProcessingState.narrativeFlags, ...selectedResponse.setNarrativeFlags };
                }
            }
             if (foundResponseEntry.triggeredNarrativeFlags) {
                currentProcessingState.narrativeFlags = { ...currentProcessingState.narrativeFlags, ...foundResponseEntry.triggeredNarrativeFlags };
            }
        } else {
            const defaultEntry = targetCharacterTemplate.dialogueState['default'];
            if (defaultEntry) {
                 if (typeof defaultEntry === 'object' && (defaultEntry as DialogueEntry).responses) {
                    const selectedDefault = (defaultEntry as DialogueEntry).responses[Math.floor(Math.random() * (defaultEntry as DialogueEntry).responses.length)];
                     responseText = `${targetCharacterTemplate.name}: ${typeof selectedDefault === 'string' ? selectedDefault : selectedDefault.text}`;
                 } else if (Array.isArray(defaultEntry)) {
                     responseText = `${targetCharacterTemplate.name}: ${defaultEntry[Math.floor(Math.random() * defaultEntry.length)]}`;
                 }
            }
        }
         if (!responseText) { // Ultimate fallback
            responseText = `${targetCharacterTemplate.name}: ` + (gameData.systemMessages?.email_no_reply_default?.replace('{CHAR_NAME}', '') || "それについては何と言っていいかわかりません。");
        }
        
        currentProcessingState.characterDynamicData = { 
            ...currentProcessingState.characterDynamicData, 
            [targetCharacterTemplate.id]: charDynamicData 
        };
        
        if (responseText) { 
            aggregatedMessages.push({ 
                id: generateId(), 
                type: 'output', 
                text: responseText, 
                source: targetCharacterTemplate.name
            });
        }
    }


    // Process attachments as submitted evidence
    for (const evidenceId of attachmentIds) {
        const evidenceCommand: ParsedCommand = {
            command: 'submit_evidence',
            args: [targetCharacterId, evidenceId],
            raw: `submit_evidence ${targetCharacterId} ${evidenceId}`
        };
        const evidenceResult = await handleSubmitEvidence(evidenceCommand, currentProcessingState, gameData);
        aggregatedMessages = [...aggregatedMessages, ...evidenceResult.outputMessages];
        currentProcessingState = evidenceResult.newPlayerStoryState;
    }
    
    // If only the "sending..." message was added and no actual replies/evidence responses, provide a default.
    const substantialReplies = aggregatedMessages.filter(msg => !(msg.type === 'system' && msg.text.includes("送信中..."))); // This pattern needs to be robust
    if (substantialReplies.length === 0 && !emailBody.trim() && attachmentIds.length === 0) { // No input, no attachments
         // Don't add a "no reply" if player sent nothing.
    } else if (substantialReplies.length === 0) {
        aggregatedMessages.push({
            id: generateId(),
            type: 'system',
            text: getSystemMessage(gameData, 'email_no_reply_default', { CHAR_NAME: targetCharacterTemplate.name })
        });
    }


    return { outputMessages: aggregatedMessages, newPlayerStoryState: currentProcessingState };
}


export const COMMAND_DEFINITIONS: Record<string, CommandDefinition> = {
  help: { name: 'help', description: '利用可能なコマンド、または特定のコマンドのヘルプを表示します。', syntax: 'help [command]', handler: handleHelp },
  ls: { name: 'ls', description: 'ファイルとディレクトリを一覧表示します。', syntax: 'ls [path]', handler: handleLs },
  dir: { name: 'dir', description: 'ファイルとディレクトリを一覧表示します（lsのエイリアス）。', syntax: 'dir [path]', handler: handleLs },
  cd: { name: 'cd', description: '現在のディレクトリを変更します。', syntax: 'cd <directory>', handler: handleCd },
  cat: { name: 'cat', description: 'ファイルの内容を表示します。', syntax: 'cat <filename>', handler: handleCat },
  type: { name: 'type', description: 'ファイルの内容を表示します（catのエイリアス）。', syntax: 'type <filename>', handler: handleCat },
  analyze: { name: 'analyze', description: '手がかりを得るためにファイルまたはデータ項目を分析します。', syntax: 'analyze <filename/data_id>', handler: handleAnalyze },
  decrypt: { name: 'decrypt', description: 'ファイルを解読します。', syntax: 'decrypt <filename> <password>', handler: handleDecrypt },
  reset_password: { name: 'reset_password', description: 'アカウントのパスワードリセットを試みます。', syntax: 'reset_password <account> --q "<answer>"', handler: handleResetPassword },
  submit_evidence: { name: 'submit_evidence', description: '発見された証拠をキャラクターに提出します。(推奨: Chatパネルから送信してください)', syntax: 'submit_evidence <target_character_id> <evidence_id>', handler: handleSubmitEvidence },
  connect: { name: 'connect', description: 'システム/ホストへのシミュレートされた接続を確立します。', syntax: 'connect <hostname/IP>', handler: handleConnect },
  accuse: { name: 'accuse', description: '捜査を終結させるために最終的な告発を行います。', syntax: 'accuse <entity_name>', handler: handleAccuse },
  clear: { name: 'clear', description: 'ターミナルの画面をクリアします。', syntax: 'clear', handler: handleClear },
  exit: { name: 'exit', description: '現在のセッションを終了し、ログイン画面に戻ります。', syntax: 'exit', handler: handleExit },
};

export async function processCommand(
  parsedCommand: ParsedCommand,
  playerStoryState: PlayerStoryState, 
  gameData: GameData
): Promise<{ outputMessages: ShellMessage[]; newPlayerStoryState: PlayerStoryState, anOutputDelay?: number }> { 
  if (!parsedCommand.command) {
    return { outputMessages: [], newPlayerStoryState: playerStoryState }; 
  }

  if (playerStoryState.narrativeFlags.story_completed_successfully && 
      parsedCommand.command !== 'help' && 
      parsedCommand.command !== 'clear' && 
      parsedCommand.command !== 'exit') {
     return { 
         outputMessages: [{id: generateId(), type: 'system', text: getSystemMessage(gameData, 'story_complete_message')}], 
         newPlayerStoryState: playerStoryState 
     };
  }
  
  if (playerStoryState.gameStage === 'ending' && 
      !playerStoryState.narrativeFlags.story_completed_successfully && 
      parsedCommand.command !== 'help' && 
      parsedCommand.command !== 'clear' && 
      parsedCommand.command !== 'exit') {
     return { 
        outputMessages: [{id: generateId(), type: 'system', text: getSystemMessage(gameData, 'investigation_ended_message')}], 
        newPlayerStoryState: playerStoryState 
    };
  }


  const commandDef = gameData.commandDefinitions[parsedCommand.command];

  if (commandDef) {
    try {
      return await commandDef.handler(parsedCommand, playerStoryState, gameData);
    } catch (error) {
      console.error("Error processing command:", error);
      return {
        outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'runtime_error_command', {COMMAND_NAME: parsedCommand.command}) }],
        newPlayerStoryState: playerStoryState
      };
    }
  } else {
    return {
      outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_unknown_command', {COMMAND_NAME: parsedCommand.command}) }],
      newPlayerStoryState: playerStoryState
    };
  }
}