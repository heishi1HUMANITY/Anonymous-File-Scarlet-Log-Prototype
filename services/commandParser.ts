
import { ParsedCommand } from '../types';

export function parseCommand(input: string): ParsedCommand {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    return { command: '', args: [], raw: '' };
  }

  // Handle quoted arguments
  const parts: string[] = [];
  let currentPart = '';
  let inQuote = false;
  for (let i = 0; i < trimmedInput.length; i++) {
    const char = trimmedInput[i];
    if (char === '"') {
      inQuote = !inQuote;
      if (!inQuote && currentPart) { // End of quote, push part if not empty
        parts.push(currentPart);
        currentPart = '';
      } else if (inQuote && currentPart) { // Quote started mid-part, unlikely valid for basic commands, but treat as literal
         currentPart += char;
      }
    } else if (char === ' ' && !inQuote) {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }
    } else {
      currentPart += char;
    }
  }
  if (currentPart) {
    parts.push(currentPart);
  }
  
  const command = parts[0]?.toLowerCase() || '';
  const args = parts.slice(1);

  return { command, args, raw: trimmedInput };
}
