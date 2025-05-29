
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ParsedCommand, PlayerStoryState, ShellMessage, GameData, CommandDefinition, FileSystemNodeType, FileNode, EvidenceItem, InitialFileNode, InitialFileSystemItem, Character, Puzzle, DialogueEntry, DialogueResponseOption, SystemMessagesConfig, TerminalChatMessage, DeviceConfig, InitialFileSystemStructure, FileSystemStructure } from '../types';
import { getNodeFromPath, resolvePath, listDirectoryContents, readFileContents, changeDirectory, getInitialNodeFromPath } from './fileSystemService';
import { PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID } from '../src/constants'; // Import from new constants file

let ai: GoogleGenAI | null = null;
try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        // fix: Correctly initialize GoogleGenAI with named apiKey parameter
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        console.warn("API_KEY environment variable not found or 'process' is undefined. Gemini API features will be disabled.");
    }
} catch (error) {
    console.error("Failed to initialize GoogleGenAI. Gemini API features will be disabled.", error);
    ai = null;
}


function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getSystemMessage(gameData: GameData, key: keyof SystemMessagesConfig, placeholders?: Record<string, string>): string {
    let message = gameData.systemMessages?.[key] || `(System message key '${String(key)}' not found)`; // Ensure key is string
    if (placeholders) {
        Object.entries(placeholders).forEach(([pk, pv]) => {
            message = message.replace(new RegExp(`{${pk.toUpperCase()}}`, 'g'), pv);
        });
    }
    return message;
}

// --- Command Handlers ---
async function handleHelp(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  let helpText = '利用可能なコマンド:\n';
  const currentDeviceId = playerStoryState.currentConnectedDeviceId;

  const isCommandAllowedOnDevice = (cmdDef: CommandDefinition, deviceId: string): boolean => {
    if (cmdDef.allowedDeviceContexts && cmdDef.allowedDeviceContexts.length > 0) {
      return cmdDef.allowedDeviceContexts.includes(deviceId);
    }
    // If allowedDeviceContexts is undefined or empty, command is only available on PLAYER_MAIN_NODE_ID
    return deviceId === PLAYER_MAIN_NODE_ID;
  };

  if (parsedCommand.args.length > 0) {
    const cmdName = parsedCommand.args[0];
    const cmdDef = gameData.commandDefinitions[cmdName];
    if (cmdDef && isCommandAllowedOnDevice(cmdDef, currentDeviceId)) {
      helpText = getSystemMessage(gameData, 'command_usage', { COMMAND_SYNTAX: cmdDef.syntax }) + `\n説明: ${cmdDef.description}`;
    } else {
      helpText = getSystemMessage(gameData, 'error_unknown_command', { COMMAND_NAME: cmdName });
    }
  } else {
    Object.values(gameData.commandDefinitions).forEach(cmd => {
      if (!isCommandAllowedOnDevice(cmd, currentDeviceId)) {
        return; 
      }
      if (cmd.requiredStage && playerStoryState.gameStage !== cmd.requiredStage) {
        return;
      }
      if (cmd.requiredNarrativeFlags) {
        if (!Object.entries(cmd.requiredNarrativeFlags).every(([key, value]) => playerStoryState.narrativeFlags[key] === value)) {
            return;
        }
      }
      helpText += `  ${cmd.name.padEnd(15)} - ${cmd.description} (使用法: ${cmd.syntax})\n`;
    });
  }
  return {
    outputMessages: [{ id: generateId(), type: 'output', text: helpText }],
    newPlayerStoryState: playerStoryState
  };
}

async function handleLs(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  const currentFs = playerStoryState.deviceFileSystems[playerStoryState.currentConnectedDeviceId];
  if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};

  const targetPath = parsedCommand.args.length > 0 ? resolvePath(playerStoryState.currentPath, parsedCommand.args[0]) : playerStoryState.currentPath;
  const contents = listDirectoryContents(targetPath, currentFs);
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
  const currentFs = playerStoryState.deviceFileSystems[playerStoryState.currentConnectedDeviceId];
  if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};
  
  const { newPath, error } = changeDirectory(parsedCommand.args[0], playerStoryState.currentPath, currentFs); 
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
  const currentFs = playerStoryState.deviceFileSystems[playerStoryState.currentConnectedDeviceId];
  if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};

  const filePath = resolvePath(playerStoryState.currentPath, parsedCommand.args[0]);
  const contentOrError = readFileContents(filePath, currentFs);

  let outputText = '';
  let outputType: ShellMessage['type'] = 'output';
  let updatedPlayerStoryState = { ...playerStoryState };

  if (contentOrError.startsWith('Error: File not found:')) {
    outputText = getSystemMessage(gameData, 'error_file_not_found', { FILE_NAME: parsedCommand.args[0] });
    outputType = 'error';
  } else if (contentOrError.startsWith('Error: Not a file:')) {
     outputText = getSystemMessage(gameData, 'error_is_a_directory', { PATH_NAME: parsedCommand.args[0]});
     outputType = 'error';
  } else if (contentOrError === 'Error: File is encrypted. Use `decrypt` command.') {
    outputText = getSystemMessage(gameData, 'error_encrypted', { FILE_NAME: parsedCommand.args[0] });
    outputType = 'error';
  } else {
      outputText = contentOrError;
      const evidenceSourcePath = `${playerStoryState.currentConnectedDeviceId}:${filePath}`;
      const evidenceKey = Object.keys(gameData.evidence).find(key => gameData.evidence[key].source === evidenceSourcePath);
      if (evidenceKey && !updatedPlayerStoryState.discoveredEvidenceIds.includes(evidenceKey)) {
        updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, evidenceKey])];
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
    const currentFs = playerStoryState.deviceFileSystems[playerStoryState.currentConnectedDeviceId];
    if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};

    const targetName = parsedCommand.args[0];
    const filePath = resolvePath(playerStoryState.currentPath, targetName);
    const node = getNodeFromPath(filePath, currentFs);

    let analysisText = getSystemMessage(gameData, 'info_analysis_notFound', { TARGET_NAME: targetName });
    const updatedPlayerStoryState = { ...playerStoryState };
    let newEvidenceUnlockedThisTurn: string[] = [];


    if (node && node.type === FileSystemNodeType.FILE && (node as FileNode).canAnalyze && (node as FileNode).analysisResult) {
        analysisText = (node as FileNode).analysisResult!;
        const evidenceSourcePath = `${playerStoryState.currentConnectedDeviceId}:${filePath}`;
        const evidenceKey = Object.keys(gameData.evidence).find(key => gameData.evidence[key].source === evidenceSourcePath);
        if (evidenceKey && !updatedPlayerStoryState.discoveredEvidenceIds.includes(evidenceKey)) {
            updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, evidenceKey])];
            newEvidenceUnlockedThisTurn.push(gameData.evidence[evidenceKey]?.title || evidenceKey);
        }
    } else if (gameData.evidence[targetName] && updatedPlayerStoryState.discoveredEvidenceIds.includes(targetName)) {
        const evidenceItem = gameData.evidence[targetName];
        analysisText = `'${evidenceItem.title}'の分析:\n${evidenceItem.content}`;
    }

    const insightConfig = gameData.analysisInsights?.[targetName] || gameData.analysisInsights?.[`${playerStoryState.currentConnectedDeviceId}:${filePath}`];
    if (insightConfig) {
        if (insightConfig.overrideBaseResult) {
            analysisText = insightConfig.overrideBaseResult;
        } else if (insightConfig.appendText) {
            analysisText += `\n${insightConfig.appendText}`;
        }

        if (insightConfig.unlocksEvidenceIds) {
            insightConfig.unlocksEvidenceIds.forEach(evId => {
                if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId) && gameData.evidence[evId]) {
                    updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, evId])];
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

  const currentDeviceId = playerStoryState.currentConnectedDeviceId;
  const currentFs = playerStoryState.deviceFileSystems[currentDeviceId];
  if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};

  const fileName = parsedCommand.args[0];
  const passwordAttempt = parsedCommand.args[1];
  const filePath = resolvePath(playerStoryState.currentPath, fileName);

  const newDeviceFsState = JSON.parse(JSON.stringify(currentFs)); // Deep copy
  const nodeInNewFs = getNodeFromPath(filePath, newDeviceFsState) as FileNode | null;

  let outputMessages: ShellMessage[] = [];
  let updatedPlayerStoryState = { ...playerStoryState };

  const puzzle = Object.values(gameData.puzzles).find(p => 
      p.puzzleType === 'decryption' && 
      p.targetFilePath === filePath && 
      (p.targetDeviceIdentifier === currentDeviceId || (currentDeviceId === PLAYER_MAIN_NODE_ID && !p.targetDeviceIdentifier)) 
  );

  if (nodeInNewFs && nodeInNewFs.type === FileSystemNodeType.FILE) {
    if (nodeInNewFs.isEncrypted) {
      const correctPassword = puzzle?.correctPassword || nodeInNewFs.password;
      if (correctPassword === passwordAttempt) {
        nodeInNewFs.isEncrypted = false;
        
        let initialFsForDecryption: InitialFileSystemStructure | undefined;
        if (currentDeviceId === PLAYER_MAIN_NODE_ID) {
            initialFsForDecryption = gameData.initialFileSystem;
        } else {
            initialFsForDecryption = gameData.deviceConfigurations?.[currentDeviceId]?.initialFileSystem;
        }

        if (!initialFsForDecryption) {
             outputMessages.push({ id: generateId(), type: 'error', text: `Error: Initial file system definition not found for device ${currentDeviceId}. Cannot retrieve decrypted content base.` });
             return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
        }
        
        const originalInitialNode = getInitialNodeFromPath(filePath, initialFsForDecryption) as InitialFileNode | null;
        nodeInNewFs.content = nodeInNewFs.decryptedContent || originalInitialNode?.decryptedContent || getSystemMessage(gameData, 'error_file_not_found', { FILE_NAME: "解読済みコンテンツ(ベースなし)" });
        nodeInNewFs.canAnalyze = true; // Usually, decryption makes it analyzable
        
        updatedPlayerStoryState.deviceFileSystems = {
            ...updatedPlayerStoryState.deviceFileSystems,
            [currentDeviceId]: newDeviceFsState
        };

        outputMessages.push({ id: generateId(), type: 'output', text: getSystemMessage(gameData, 'info_decryption_success', { FILE_NAME: fileName }) });

        if (puzzle && !updatedPlayerStoryState.solvedPuzzleIds.includes(puzzle.id)) {
          updatedPlayerStoryState.solvedPuzzleIds = [...new Set([...updatedPlayerStoryState.solvedPuzzleIds, puzzle.id])];
          if (puzzle.unlocksEvidenceOnSuccess) {
            let newEvUnlockedTexts: string[] = [];
            puzzle.unlocksEvidenceOnSuccess.forEach(evId => {
              if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId) && gameData.evidence[evId]) {
                updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, evId])];
                newEvUnlockedTexts.push(gameData.evidence[evId].title);
              }
            });
            if(newEvUnlockedTexts.length > 0){
                 outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'info_new_evidence_added', { EVIDENCE_TITLE: newEvUnlockedTexts.join(', ') }) });
            }
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
    const answerAttempt = parsedCommand.args[2].toLowerCase(); // Question text is part of puzzle def, not command

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
                updatedPlayerStoryState.solvedPuzzleIds = [...new Set([...updatedPlayerStoryState.solvedPuzzleIds, puzzle.id])];
                if (puzzle.unlocksEvidenceOnSuccess) {
                    let newEvUnlockedTexts: string[] = [];
                    puzzle.unlocksEvidenceOnSuccess.forEach(evId => {
                        if (!updatedPlayerStoryState.discoveredEvidenceIds.includes(evId) && gameData.evidence[evId]) {
                            updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, evId])];
                            newEvUnlockedTexts.push(gameData.evidence[evId].title);
                        }
                    });
                    if(newEvUnlockedTexts.length > 0) {
                        outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'info_new_evidence_added', { EVIDENCE_TITLE: newEvUnlockedTexts.join(', ') }) });
                    }
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

async function handleSubmitEvidenceInternal(
    targetCharId: string,
    evidenceId: string,
    playerStoryState: PlayerStoryState,
    gameData: GameData
): Promise<{ responseText: string, newPlayerStoryState: PlayerStoryState }> {
    const characterTemplate = gameData.characters[targetCharId];
    const evidenceItem = gameData.evidence[evidenceId];
    let updatedPlayerStoryState = { ...playerStoryState }; // shallow copy
    updatedPlayerStoryState.narrativeFlags = {...playerStoryState.narrativeFlags}; // deep copy for flags
    updatedPlayerStoryState.characterDynamicData = JSON.parse(JSON.stringify(playerStoryState.characterDynamicData)); // deep copy
    updatedPlayerStoryState.playerTrustLevels = {...playerStoryState.playerTrustLevels}; // deep copy
    updatedPlayerStoryState.discoveredEvidenceIds = [...playerStoryState.discoveredEvidenceIds]; // deep copy


    let responseText = '';

    if (!characterTemplate) {
        responseText = getSystemMessage(gameData, 'submit_evidence_char_not_found', { CHAR_ID: targetCharId });
    } else if (!evidenceItem || !playerStoryState.discoveredEvidenceIds.includes(evidenceId)) {
        responseText = getSystemMessage(gameData, 'submit_evidence_item_not_found', { EVIDENCE_ID: evidenceId });
    } else {
        let charDynamicData = updatedPlayerStoryState.characterDynamicData[characterTemplate.id];
        // Ensure charDynamicData exists, should be initialized in stateInitializer
        if (!charDynamicData) {
             charDynamicData = { trustLevel: characterTemplate.initialTrustLevel || 50, canChatTerminal: false, canBeContacted: false };
        }

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
                        updatedPlayerStoryState.discoveredEvidenceIds = [...new Set([...updatedPlayerStoryState.discoveredEvidenceIds, unlockedEvId])];
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
        updatedPlayerStoryState.characterDynamicData[characterTemplate.id] = charDynamicData;
        updatedPlayerStoryState.playerTrustLevels[characterTemplate.id] = charDynamicData.trustLevel;
    }
    return { responseText, newPlayerStoryState: updatedPlayerStoryState };
}

async function handleSubmitEvidence(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length < 2) {
        return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.submit_evidence.syntax }) }], newPlayerStoryState: playerStoryState };
    }
    const targetCharId = parsedCommand.args[0];
    const evidenceId = parsedCommand.args[1];
    const characterTemplate = gameData.characters[targetCharId];

    const { responseText, newPlayerStoryState } = await handleSubmitEvidenceInternal(targetCharId, evidenceId, playerStoryState, gameData);
    
    return { 
        outputMessages: [{ id: generateId(), type: 'output', text: responseText, source: characterTemplate?.name || 'System' }], 
        newPlayerStoryState 
    };
}

async function handleConnect(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length === 0) {
    return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.connect.syntax }) }], newPlayerStoryState: playerStoryState };
  }
  const target = parsedCommand.args[0];
  let outputText = '';
  const updatedPlayerStoryState = { ...playerStoryState }; // shallow copy
  updatedPlayerStoryState.narrativeFlags = {...playerStoryState.narrativeFlags}; // deep copy for flags

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
                                [{id: generateId(), type: 'system', text: `告発(${accusedEntityRaw})は処理されました。`}];
                updatedPlayerStoryState.gameStage = 'ending'; 
                ruleMatched = true;
                break;
            }
        }
    }

    if (!ruleMatched) {
        updatedPlayerStoryState.narrativeFlags.final_choice_made = accusedEntityRaw;
        updatedPlayerStoryState.narrativeFlags.story_completed_successfully = false;
        const failureKey = gameData.defaultAccusationFailureNarrativeScriptKey || 'final_choice_insufficient';
        finalMessages = gameData.narrativeScript[failureKey] ||
                        [{id: generateId(), type: 'system', text: `あなたは${accusedEntityRaw}を告発しましたが、証拠の追跡は不明瞭でした。`}];
        updatedPlayerStoryState.gameStage = 'ending';
    }

    if(gameData.narrativeScript['story_completed_end']) {
        finalMessages = finalMessages.concat(gameData.narrativeScript['story_completed_end']);
    }
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
  let updatedPlayerStoryState = { ...playerStoryState };
  const outputMessages: ShellMessage[] = [];
  const currentDeviceStack = [...updatedPlayerStoryState.deviceConnectionStack];

  if (currentDeviceStack.length > 1) { 
    const disconnectingDeviceId = currentDeviceStack.pop()!; 
    const previousDeviceId = currentDeviceStack[currentDeviceStack.length - 1]; 

    const disconnectingDeviceConfig = gameData.deviceConfigurations?.[disconnectingDeviceId];
    if (disconnectingDeviceConfig?.disconnectionMessage) {
        outputMessages.push({ id: generateId(), type: 'system', text: disconnectingDeviceConfig.disconnectionMessage });
    } else {
        outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'device_disconnected', { DEVICE_HOSTNAME: disconnectingDeviceConfig?.promptHostname || disconnectingDeviceId }) });
    }

    updatedPlayerStoryState.deviceConnectionStack = currentDeviceStack;
    updatedPlayerStoryState.currentConnectedDeviceId = previousDeviceId;
    updatedPlayerStoryState.currentPath = "/"; // Reset path when changing device

    const connectingDeviceConfig = gameData.deviceConfigurations?.[previousDeviceId] || (previousDeviceId === PLAYER_MAIN_NODE_ID ? gameData.storyInfo.playerDefaultDeviceConfig : undefined);
    if (connectingDeviceConfig?.connectionMessage && previousDeviceId !== PLAYER_MAIN_NODE_ID) { 
         outputMessages.push({ id: generateId(), type: 'system', text: connectingDeviceConfig.connectionMessage });
    } else if (previousDeviceId === PLAYER_MAIN_NODE_ID) { // Explicitly handle PLAYER_MAIN_NODE_ID connection message
         const playerNodeHostname = connectingDeviceConfig?.promptHostname || "player_main_node";
         const playerNodeUsername = (connectingDeviceConfig?.promptUsername === '{PLAYER_USERNAME}' ? playerStoryState.username : connectingDeviceConfig?.promptUsername || playerStoryState.username);
         outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'device_connection_established', { DEVICE_HOSTNAME: playerNodeHostname, DEVICE_USERNAME: playerNodeUsername }) });
    }
  } else { 
    outputMessages.push({ id: generateId(), type: 'exit_signal', text: '' });
  }

  return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
}

async function handleCrackDevice(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
    if (parsedCommand.args.length === 0) {
        return { outputMessages: [{ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', { COMMAND_SYNTAX: gameData.commandDefinitions.crack_device.syntax }) }], newPlayerStoryState: playerStoryState };
    }
    const targetDeviceHostname = parsedCommand.args[0];
    let updatedPlayerStoryState = { ...playerStoryState }; // Shallow copy
    updatedPlayerStoryState.narrativeFlags = {...playerStoryState.narrativeFlags}; // Deep copy for flags
    updatedPlayerStoryState.solvedPuzzleIds = [...playerStoryState.solvedPuzzleIds]; // Deep copy
    updatedPlayerStoryState.deviceConnectionStack = [...playerStoryState.deviceConnectionStack]; // Deep copy

    const outputMessages: ShellMessage[] = [];

    let targetInternalDeviceId: string | undefined = undefined;
    if (gameData.deviceConfigurations) {
        for (const deviceId in gameData.deviceConfigurations) {
            if (gameData.deviceConfigurations[deviceId].promptHostname === targetDeviceHostname) {
                targetInternalDeviceId = deviceId;
                break;
            }
        }
    }

    if (!targetInternalDeviceId || !gameData.deviceConfigurations?.[targetInternalDeviceId]) {
         outputMessages.push({ id: generateId(), type: 'error', text: getSystemMessage(gameData, 'crack_device_target_invalid', { TARGET_ID: targetDeviceHostname }) });
        return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
    }
    
    const puzzle = Object.values(gameData.puzzles).find(p => p.puzzleType === 'smartphoneCrack' && p.targetDeviceIdentifier === targetInternalDeviceId);

    if (!puzzle) {
        outputMessages.push({ id: generateId(), type: 'error', text: `Error: No cracking puzzle defined for device '${targetDeviceHostname}' (ID: ${targetInternalDeviceId}).` });
        return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
    }
    
    if (playerStoryState.currentConnectedDeviceId === targetInternalDeviceId) {
        outputMessages.push({ id: generateId(), type: 'system', text: `Already connected to ${targetDeviceHostname}.` });
        return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
    }

    // Check if the target device is specifically the smartphone UI target
    const isTargetSmartphoneUI = targetInternalDeviceId === gameData.storyInfo.smartphoneDeviceTargetId;

    if (isTargetSmartphoneUI && !playerStoryState.smartphoneLocked) { 
        outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'crack_device_already_unlocked') });
    } else {
        outputMessages.push({ id: generateId(), type: 'progress', text: `Analyzing vulnerabilities on ${targetDeviceHostname}...` });
        await new Promise(r => setTimeout(r, 500)); 
        outputMessages.push({ id: generateId(), type: 'progress', text: "Attempting exploit..." });
        await new Promise(r => setTimeout(r, 700)); 
        
        const revealedPasscodeFromPuzzle = puzzle.revealedPasscode;
        if (revealedPasscodeFromPuzzle) {
            outputMessages.push({ id: generateId(), type: 'system', text: getSystemMessage(gameData, 'crack_device_success_passcode_found', { PASSCODE: revealedPasscodeFromPuzzle, DEVICE_NAME: targetDeviceHostname }) });
        } else {
             outputMessages.push({ id: generateId(), type: 'system', text: `Security bypassed. Device ${targetDeviceHostname} unlocked.` });
        }
        if(isTargetSmartphoneUI) updatedPlayerStoryState.smartphoneLocked = false; 
    }
    
    const newDeviceStack = [...updatedPlayerStoryState.deviceConnectionStack];
    if (newDeviceStack[newDeviceStack.length -1] !== targetInternalDeviceId) {
        newDeviceStack.push(targetInternalDeviceId);
    }
    
    updatedPlayerStoryState.deviceConnectionStack = newDeviceStack;
    updatedPlayerStoryState.currentConnectedDeviceId = targetInternalDeviceId;
    updatedPlayerStoryState.currentPath = "/";
    updatedPlayerStoryState.narrativeFlags = { ...updatedPlayerStoryState.narrativeFlags, smartphone_cracked: isTargetSmartphoneUI, [`device_access_${targetInternalDeviceId}`]: true };
     if (puzzle && !updatedPlayerStoryState.solvedPuzzleIds.includes(puzzle.id)) {
        updatedPlayerStoryState.solvedPuzzleIds = [...new Set([...updatedPlayerStoryState.solvedPuzzleIds, puzzle.id])];
    }
    
    const deviceConfig = gameData.deviceConfigurations[targetInternalDeviceId];
    const connectMsg = deviceConfig.connectionMessage || getSystemMessage(gameData, 'device_connection_established', { DEVICE_HOSTNAME: deviceConfig.promptHostname, DEVICE_USERNAME: deviceConfig.promptUsername });
    outputMessages.push({ id: generateId(), type: 'system', text: connectMsg });
    
    return { outputMessages, newPlayerStoryState: updatedPlayerStoryState };
}

async function handleGrep(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  if (parsedCommand.args.length < 2) {
    return { outputMessages: [{id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_command_usage', {COMMAND_SYNTAX: gameData.commandDefinitions.grep.syntax}) }], newPlayerStoryState: playerStoryState };
  }
  const currentFs = playerStoryState.deviceFileSystems[playerStoryState.currentConnectedDeviceId];
  if (!currentFs) return { outputMessages: [{id: generateId(), type: 'error', text: "Error: Current device file system not found."}], newPlayerStoryState: playerStoryState};

  const pattern = parsedCommand.args[0];
  const filename = parsedCommand.args[1];
  const filePath = resolvePath(playerStoryState.currentPath, filename);
  const fileNode = getNodeFromPath(filePath, currentFs) as FileNode | null;

  if (!fileNode || fileNode.type !== FileSystemNodeType.FILE) {
    return { outputMessages: [{id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_file_not_found', {FILE_NAME: filename}) }], newPlayerStoryState: playerStoryState };
  }
  if (fileNode.isEncrypted) {
    return { outputMessages: [{id: generateId(), type: 'error', text: getSystemMessage(gameData, 'error_encrypted', {FILE_NAME: filename}) }], newPlayerStoryState: playerStoryState };
  }
  const content = fileNode.content;
  const matchingLines = content.split('\n').filter(line => line.includes(pattern));

  if (matchingLines.length === 0) {
    return { outputMessages: [{id: generateId(), type: 'output', text: `No lines matching "${pattern}" in ${filename}` }], newPlayerStoryState: playerStoryState };
  }

  return { outputMessages: [{id: generateId(), type: 'output', text: matchingLines.join('\n') }], newPlayerStoryState: playerStoryState };
}

// Placeholder command handlers
async function handleNmapScan(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  return { outputMessages: [{id: generateId(), type: 'system', text: "Nmap scan initiated (placeholder)... results pending." }], newPlayerStoryState: playerStoryState };
}

async function handleRecoverDeleted(parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData): Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState }> {
  return { outputMessages: [{id: generateId(), type: 'system', text: "File recovery process started (placeholder)..." }], newPlayerStoryState: playerStoryState };
}

export async function processTerminalCharacterInteraction(
    targetCharacterId: string,
    messageBody: string,
    attachmentIds: string[],
    playerStoryState: PlayerStoryState,
    gameData: GameData
): Promise<{ npcReplyMessages: TerminalChatMessage[], newPlayerStoryState: PlayerStoryState }> {
    let currentProcessingState = JSON.parse(JSON.stringify(playerStoryState)) as PlayerStoryState; // Deep copy
    const npcReplyMessages: TerminalChatMessage[] = [];
    const aiMessageId = `ai_msg_${Date.now()}_${Math.random().toString(16).slice(2)}`; 

    const targetCharacterTemplate = gameData.characters[targetCharacterId];
    if (!targetCharacterTemplate) {
        npcReplyMessages.push({
            id: generateId(),
            timestamp: new Date().toISOString(),
            senderId: 'system_error',
            senderName: 'System',
            body: getSystemMessage(gameData, 'email_char_not_found_error', { CHAR_ID: targetCharacterId }),
            type: 'system_event_terminal'
        });
        return { npcReplyMessages, newPlayerStoryState: playerStoryState }; // Return original state on error
    }

    let useAIForResponse = false;
    let npcResponseText = '';

    if (messageBody.trim()) {
        let charDynamicData = currentProcessingState.characterDynamicData[targetCharacterTemplate.id];
        if (!charDynamicData) {
            charDynamicData = { 
                trustLevel: targetCharacterTemplate.initialTrustLevel || 50,
                canChatTerminal: targetCharacterTemplate.initialCanChatTerminal || false,
                canBeContacted: targetCharacterTemplate.initialCanBeContacted || false,
            };
        }
        currentProcessingState.playerTrustLevels[targetCharacterId] = charDynamicData.trustLevel;
        currentProcessingState.narrativeFlags[`contacted_terminal_${targetCharacterTemplate.id.toLowerCase()}`] = true;

        let foundResponseEntry: DialogueEntry | null = null;
        const lowerMessageBody = messageBody.trim().toLowerCase();

        if (targetCharacterTemplate.dialogueState) {
            for (const key in targetCharacterTemplate.dialogueState) {
                if (key === 'default') continue; 
                const dialogueEntry = targetCharacterTemplate.dialogueState[key] as DialogueEntry;
                if (lowerMessageBody.includes(key.toLowerCase())) {
                    if (typeof dialogueEntry === 'object' && dialogueEntry.responses) {
                        const currentTrust = currentProcessingState.playerTrustLevels[targetCharacterId] ?? charDynamicData.trustLevel;
                        const meetsTrustMin = dialogueEntry.requiredTrustMin === undefined || currentTrust >= dialogueEntry.requiredTrustMin;
                        const meetsTrustMax = dialogueEntry.requiredTrustMax === undefined || currentTrust <= dialogueEntry.requiredTrustMax;
                        const meetsNarrativeFlags = !dialogueEntry.requiredNarrativeFlags || Object.entries(dialogueEntry.requiredNarrativeFlags).every(
                            ([flagKey, expectedValue]) => currentProcessingState.narrativeFlags[flagKey] === expectedValue
                        );
                        if (meetsTrustMin && meetsTrustMax && meetsNarrativeFlags) {
                            foundResponseEntry = dialogueEntry;
                            break;
                        }
                    } else if (Array.isArray(dialogueEntry)) { 
                         foundResponseEntry = { responses: dialogueEntry };
                         break;
                    }
                }
            }
        }
        
        if (foundResponseEntry) {
            const selectedResponse = foundResponseEntry.responses[Math.floor(Math.random() * foundResponseEntry.responses.length)];
            if (typeof selectedResponse === 'string') {
                npcResponseText = selectedResponse;
            } else { 
                const responseOption = selectedResponse as DialogueResponseOption;
                npcResponseText = responseOption.text;
                if (responseOption.trustChange) {
                    charDynamicData.trustLevel = Math.max(0, Math.min(100, (currentProcessingState.playerTrustLevels[targetCharacterId] ?? charDynamicData.trustLevel) + responseOption.trustChange));
                    currentProcessingState.playerTrustLevels[targetCharacterId] = charDynamicData.trustLevel;
                }
                if (responseOption.setNarrativeFlags) {
                     currentProcessingState.narrativeFlags = { ...currentProcessingState.narrativeFlags, ...responseOption.setNarrativeFlags };
                }
                if (responseOption.ethicalScoreChange) {
                    currentProcessingState.playerEthicalScore = (currentProcessingState.playerEthicalScore ?? 0) + responseOption.ethicalScoreChange;
                }
            }
             if (foundResponseEntry.triggeredNarrativeFlags) {
                currentProcessingState.narrativeFlags = { ...currentProcessingState.narrativeFlags, ...foundResponseEntry.triggeredNarrativeFlags };
            }
        } else if (targetCharacterTemplate.dialogueState && targetCharacterTemplate.dialogueState['default']) { 
            const defaultEntry = targetCharacterTemplate.dialogueState['default'];
             if (typeof defaultEntry === 'object' && (defaultEntry as DialogueEntry).responses) {
                const selectedDefault = (defaultEntry as DialogueEntry).responses[Math.floor(Math.random() * (defaultEntry as DialogueEntry).responses.length)];
                if (typeof selectedDefault === 'string') {
                     npcResponseText = selectedDefault;
                } else {
                     const defaultOption = selectedDefault as DialogueResponseOption;
                     npcResponseText = defaultOption.text;
                      if (defaultOption.trustChange) { // Apply trust change from default if specified
                        charDynamicData.trustLevel = Math.max(0, Math.min(100, (currentProcessingState.playerTrustLevels[targetCharacterId] ?? charDynamicData.trustLevel) + defaultOption.trustChange));
                        currentProcessingState.playerTrustLevels[targetCharacterId] = charDynamicData.trustLevel;
                      }
                }
             } else if (Array.isArray(defaultEntry)) { 
                 npcResponseText = defaultEntry[Math.floor(Math.random() * defaultEntry.length)];
             }
        }
        
        currentProcessingState.characterDynamicData[targetCharacterTemplate.id] = charDynamicData;

        if (!npcResponseText && targetCharacterTemplate.aiPersonalityPrompt && ai) {
            useAIForResponse = true;
        }
    }

    if (useAIForResponse && messageBody.trim() && targetCharacterTemplate.aiPersonalityPrompt && ai) {
        npcReplyMessages.push({
            id: aiMessageId,
            timestamp: new Date().toISOString(),
            senderId: targetCharacterId,
            senderName: targetCharacterTemplate.name,
            body: getSystemMessage(gameData, 'ai_thinking', { CHAR_NAME: targetCharacterTemplate.name }),
            type: 'received',
            isLoadingAI: true,
        });

        try {
            // fix: Use correct model name and structure for generateContent
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17', // Correct model
                contents: messageBody.trim(), 
                config: {
                    systemInstruction: targetCharacterTemplate.aiPersonalityPrompt, 
                }
            });
            // fix: Access text directly from response
            const aiGeneratedText = response.text;
            
            const aiMessageIndex = npcReplyMessages.findIndex(msg => msg.id === aiMessageId);
            if (aiMessageIndex !== -1) {
                npcReplyMessages[aiMessageIndex] = {
                    ...npcReplyMessages[aiMessageIndex],
                    body: aiGeneratedText.trim() || getSystemMessage(gameData, 'ai_error', { CHAR_NAME: targetCharacterTemplate.name }),
                    isLoadingAI: false,
                };
            } else { 
                 npcReplyMessages.push({
                    id: generateId(), timestamp: new Date().toISOString(), senderId: targetCharacterId,
                    senderName: targetCharacterTemplate.name, body: aiGeneratedText.trim(), type: 'received'
                });
            }
        } catch (error) {
            console.error("Gemini API call failed:", error);
            const aiMessageIndex = npcReplyMessages.findIndex(msg => msg.id === aiMessageId);
            const errorMessage = getSystemMessage(gameData, 'ai_error', { CHAR_NAME: targetCharacterTemplate.name });
            if (aiMessageIndex !== -1) {
                npcReplyMessages[aiMessageIndex] = { ...npcReplyMessages[aiMessageIndex], body: errorMessage, isLoadingAI: false };
            } else {
                npcReplyMessages.push({
                    id: generateId(), timestamp: new Date().toISOString(), senderId: targetCharacterId,
                    senderName: targetCharacterTemplate.name, body: errorMessage, type: 'received'
                });
            }
        }
    } else if (npcResponseText) { 
        npcReplyMessages.push({
            id: generateId(),
            timestamp: new Date().toISOString(),
            senderId: targetCharacterId,
            senderName: targetCharacterTemplate.name,
            body: npcResponseText,
            type: 'received'
        });
    }

    for (const evidenceId of attachmentIds) {
        const { responseText: evidenceAckText, newPlayerStoryState: stateAfterEvidence } = 
            await handleSubmitEvidenceInternal(targetCharacterId, evidenceId, currentProcessingState, gameData);
        currentProcessingState = stateAfterEvidence; // Update state after each piece of evidence
        if (evidenceAckText) {
             npcReplyMessages.push({
                id: generateId(),
                timestamp: new Date().toISOString(),
                senderId: targetCharacterId,
                senderName: targetCharacterTemplate.name,
                body: evidenceAckText, // This is just the ack, not the full evidence content
                type: 'received' 
            });
        }
    }
    
    if (npcReplyMessages.length === 0 && !messageBody.trim() && attachmentIds.length === 0) {
        // No reply if player sent nothing.
    } else if (npcReplyMessages.length === 0) { // If still no specific reply or AI, send default
        npcReplyMessages.push({
            id: generateId(),
            timestamp: new Date().toISOString(),
            senderId: targetCharacterId,
            senderName: targetCharacterTemplate.name,
            body: getSystemMessage(gameData, 'email_no_reply_default', { CHAR_NAME: targetCharacterTemplate.name }).replace(`${targetCharacterTemplate.name}: `, ''),
            type: 'received'
        });
    }

    return { npcReplyMessages, newPlayerStoryState: currentProcessingState };
}

export const COMMAND_DEFINITIONS: Record<string, CommandDefinition> = {
  help: { name: 'help', description: '利用可能なコマンド、または特定のコマンドのヘルプを表示します。', syntax: 'help [command]', handler: handleHelp, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  ls: { name: 'ls', description: 'ファイルとディレクトリを一覧表示します。', syntax: 'ls [path]', handler: handleLs, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  dir: { name: 'dir', description: 'ファイルとディレクトリを一覧表示します（lsのエイリアス）。', syntax: 'dir [path]', handler: handleLs, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  cd: { name: 'cd', description: '現在のディレクトリを変更します。', syntax: 'cd <directory>', handler: handleCd, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  cat: { name: 'cat', description: 'ファイルの内容を表示します。', syntax: 'cat <filename>', handler: handleCat, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  type: { name: 'type', description: 'ファイルの内容を表示します（catのエイリアス）。', syntax: 'type <filename>', handler: handleCat, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  analyze: { name: 'analyze', description: '手がかりを得るためにファイルまたはデータ項目を分析します。', syntax: 'analyze <filename/data_id>', handler: handleAnalyze, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] }, 
  decrypt: { name: 'decrypt', description: 'ファイルを解読します。', syntax: 'decrypt <filename> <password>', handler: handleDecrypt, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  reset_password: { name: 'reset_password', description: 'アカウントのパスワードリセットを試みます。', syntax: 'reset_password <account> --q "<answer>"', handler: handleResetPassword, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  submit_evidence: { name: 'submit_evidence', description: '発見された証拠をキャラクターに提出します。(注意: Chatパネルの使用を推奨)', syntax: 'submit_evidence <target_character_id> <evidence_id>', handler: handleSubmitEvidence, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  connect: { name: 'connect', description: 'システム/ホストへのシミュレートされた接続を確立します。', syntax: 'connect <hostname/IP>', handler: handleConnect, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  accuse: { name: 'accuse', description: '捜査を終結させるために最終的な告発を行います。', syntax: 'accuse <entity_name>', handler: handleAccuse, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  clear: { name: 'clear', description: 'ターミナルの画面をクリアします。', syntax: 'clear', handler: handleClear, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  exit: { name: 'exit', description: '現在のデバイスシェルから切断するか、ゲームを終了します。', syntax: 'exit', handler: handleExit, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  crack_device: { name: 'crack_device', description: 'ターゲットスマートフォンのロック解除とシェルアクセスを試みます。', syntax: 'crack_device <device_hostname>', handler: handleCrackDevice, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  grep: { name: 'grep', description: 'ファイル内のパターンを検索します。', syntax: 'grep <pattern> <filename>', handler: handleGrep, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID] },
  nmap_scan: { name: 'nmap_scan', description: 'ターゲットIPのポートをスキャンします（シミュレート）。', syntax: 'nmap_scan <target_ip> [options]', handler: handleNmapScan, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
  recover_deleted: { name: 'recover_deleted', description: '削除されたファイルを復元しようとします（シミュレート）。', syntax: 'recover_deleted <disk_image> [output_dir]', handler: handleRecoverDeleted, allowedDeviceContexts: [PLAYER_MAIN_NODE_ID] },
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
      !['help', 'clear', 'exit'].includes(parsedCommand.command)) {
     return {
         outputMessages: [{id: generateId(), type: 'system', text: getSystemMessage(gameData, 'story_complete_message')}],
         newPlayerStoryState: playerStoryState
     };
  }
  if (playerStoryState.gameStage === 'ending' &&
      !playerStoryState.narrativeFlags.story_completed_successfully &&
      !['help', 'clear', 'exit'].includes(parsedCommand.command)) {
     return {
        outputMessages: [{id: generateId(), type: 'system', text: getSystemMessage(gameData, 'investigation_ended_message')}],
        newPlayerStoryState: playerStoryState
    };
  }

  const commandDef = gameData.commandDefinitions[parsedCommand.command];

  if (commandDef) {
    const currentDeviceId = playerStoryState.currentConnectedDeviceId;
    let isCommandAllowed = false;
    if (commandDef.allowedDeviceContexts && commandDef.allowedDeviceContexts.length > 0) {
        isCommandAllowed = commandDef.allowedDeviceContexts.includes(currentDeviceId);
    } else {
        isCommandAllowed = currentDeviceId === PLAYER_MAIN_NODE_ID;
    }

    if (!isCommandAllowed) {
        const currentDeviceConfig = gameData.deviceConfigurations?.[currentDeviceId] || (currentDeviceId === PLAYER_MAIN_NODE_ID ? gameData.storyInfo.playerDefaultDeviceConfig : undefined);
        const currentDeviceHostname = currentDeviceConfig?.promptHostname || currentDeviceId;
        return { 
            outputMessages: [{
                id: generateId(), 
                type: 'error', 
                text: getSystemMessage(gameData, 'command_not_available_on_device', {COMMAND_NAME: parsedCommand.command, DEVICE_HOSTNAME: currentDeviceHostname})
            }], 
            newPlayerStoryState: playerStoryState
        };
    }
    
    if (commandDef.requiredStage && playerStoryState.gameStage !== commandDef.requiredStage) {
      return { outputMessages: [{id: generateId(), type: 'error', text: `エラー: コマンド '${parsedCommand.command}' は現在のステージでは利用できません。`}], newPlayerStoryState: playerStoryState};
    }
    if (commandDef.requiredNarrativeFlags) {
      const flagsMet = Object.entries(commandDef.requiredNarrativeFlags).every(([key, value]) => playerStoryState.narrativeFlags[key] === value);
      if (!flagsMet) {
        return { outputMessages: [{id: generateId(), type: 'error', text: `エラー: コマンド '${parsedCommand.command}' の実行条件が満たされていません。`}], newPlayerStoryState: playerStoryState};
      }
    }

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
// fix: Removed incorrect export of 'changeDirectoryForDevice' as it does not exist in './fileSystemService'.
// export { changeDirectoryForDevice } from './fileSystemService';
