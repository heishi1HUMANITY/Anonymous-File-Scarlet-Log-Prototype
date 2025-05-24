
import React from 'react';
import { ShellMessage } from '../types';

interface ShellOutputLineProps {
  message: ShellMessage;
  currentPath?: string; // Only for 'prompt' type for the live prompt
  currentUsername?: string; // Only for 'prompt' type for the live prompt
}

const ShellOutputLine: React.FC<ShellOutputLineProps> = ({ message, currentPath, currentUsername }) => {
  let textColor = 'text-green-400'; // Default for output
  let prefix = '';

  switch (message.type) {
    case 'input':
      textColor = 'text-blue-400'; // Player input
      // No explicit prefix for input to allow it to follow the prompt naturally
      break;
    case 'error':
      textColor = 'text-red-500';
      prefix = 'エラー: ';
      break;
    case 'system':
      textColor = 'text-yellow-400'; // System messages, narrative
      if (message.source) {
        prefix = `[${message.source}] `;
      }
      break;
    case 'prompt':
      textColor = 'text-cyan-400';
      // Determine username: use usernameAtCommandTime for historical, currentUsername for live, fallback to 'user'
      const displayUsername = message.usernameAtCommandTime || currentUsername || 'user';
      // Determine path: use pathAtCommandTime for historical, currentPath for live, fallback to '/'
      const displayPath = message.pathAtCommandTime || currentPath || '/';
      return (
        <div className="whitespace-pre-wrap inline-block"> {/* Changed to inline-block to allow input on same line */}
          <span className={textColor}>{displayUsername}@anonymous-node</span>
          <span className="text-gray-500">:</span>
          <span className="text-purple-400">{displayPath}</span>
          <span className="text-gray-500">$</span>&nbsp;
        </div>
      );
    case 'progress':
        textColor = 'text-lime-400';
        if (message.isRawHTML) {
            return <div className={`${textColor} whitespace-pre-wrap`} dangerouslySetInnerHTML={{ __html: message.text }} />;
        }
        break;
    default: // output
      textColor = 'text-green-400'; // Standard output
      if (message.source) {
        prefix = `[${message.source}] `;
      }
  }
  
  // For input messages, we don't want the "> " prefix if they are to appear right after the prompt.
  // The prompt itself ends with "$ ", so the input text just follows.
  // If we decide inputs should *also* be on new lines *with* a prefix, we can re-add it here.
  // For now, input text stands alone.

  return (
    <div className={`${textColor} whitespace-pre-wrap`}>
      {prefix && <span className="font-semibold">{prefix}</span>}
      {message.text}
    </div>
  );
};

export default ShellOutputLine;
