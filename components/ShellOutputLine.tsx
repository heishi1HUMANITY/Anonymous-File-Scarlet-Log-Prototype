
import React from 'react';
import { ShellMessage, GameData, DeviceConfig, StoryContentData } from '../types';
import { PLAYER_MAIN_NODE_ID } from '../src/constants';

interface ShellOutputLineProps {
  message: ShellMessage;
  playerUsername: string; 
  gameData: GameData;     
  currentPath?: string;   
  currentDevicePromptConfig?: DeviceConfig | StoryContentData['storyInfo']['playerDefaultDeviceConfig']; 
}

const ShellOutputLine: React.FC<ShellOutputLineProps> = ({ 
    message, 
    playerUsername,
    gameData,
    currentPath,
    currentDevicePromptConfig
}) => {
  let textColor = 'text-green-400'; 
  let prefix = '';

  switch (message.type) {
    case 'input':
      textColor = 'text-blue-400'; 
      break;
    case 'error':
      textColor = 'text-red-500';
      prefix = 'エラー: ';
      break;
    case 'system':
      textColor = 'text-yellow-400'; 
      if (message.source) {
        prefix = `[${message.source}] `;
      }
      break;
    case 'prompt':
      textColor = 'text-cyan-400';
      let displayUsernameForPrompt: string = playerUsername;
      let displayHostnameForPrompt: string = "anonymous-node"; 
      const displayPathForPrompt = message.pathAtCommandTime || currentPath || '/';

      let promptConfigToUse: DeviceConfig | StoryContentData['storyInfo']['playerDefaultDeviceConfig'] | undefined = undefined;

      if (message.deviceIdAtCommandTime) { 
        promptConfigToUse = gameData.deviceConfigurations?.[message.deviceIdAtCommandTime];
        if (!promptConfigToUse && message.deviceIdAtCommandTime === PLAYER_MAIN_NODE_ID) {
            promptConfigToUse = gameData.storyInfo.playerDefaultDeviceConfig;
        }
      } else { 
        promptConfigToUse = currentDevicePromptConfig;
      }

      if (promptConfigToUse) {
        displayUsernameForPrompt = promptConfigToUse.promptUsername === "{PLAYER_USERNAME}" ? playerUsername : promptConfigToUse.promptUsername || playerUsername;
        displayHostnameForPrompt = promptConfigToUse.promptHostname || "anonymous-node";
      }
      
      return (
        <div className="whitespace-pre-wrap inline-block"> 
          <span className={textColor}>{displayUsernameForPrompt}@{displayHostnameForPrompt}</span>
          <span className="text-gray-500">:</span>
          <span className="text-purple-400">{displayPathForPrompt}</span>
          <span className="text-gray-500">$</span>&nbsp;
        </div>
      );
    case 'progress':
        textColor = 'text-lime-400';
        if (message.isRawHTML) {
            return <div className={`${textColor} whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: message.text }} />;
        }
        break;
    default: 
      textColor = 'text-green-400'; 
      if (message.source) {
        prefix = `[${message.source}] `;
      }
  }
  
  // Standard text display for non-progress or non-HTML messages
  if (message.isRawHTML) {
      return <div className={`${textColor} whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: prefix + message.text }} />;
  }

  return (
    <div className={`${textColor} whitespace-pre-wrap`}>
      {prefix && <span className="font-semibold">{prefix}</span>}
      {message.text}
    </div>
  );
};

export default ShellOutputLine;
