// src/constants.ts

// Device Identifiers
export const PLAYER_MAIN_NODE_ID = "player_main_node";
export const LUNAS_PHONE_SHELL_ID = "luna_phone_shell"; // Example, used in story-01

// Storage Keys
export const PLAYER_PROFILE_STORAGE_PREFIX = 'anonymousCellPlayerProfile_';
export const PLAYER_STORY_STATE_STORAGE_PREFIX = 'anonymousCellStoryState_';

// Default Story and Debug Settings
export const DEFAULT_INITIAL_STORY = 1;
export const BYPASS_LOGIN_FOR_TESTING = true; // Set to false for normal login flow
export const RUN_DEBUG_SEQUENCE_ON_BYPASS = false; // Set to true to run debug sequence on bypass

// Default Delay Settings for Character Interactions
export const DEFAULT_DELAY_SETTINGS = {
  MIN_READ_DELAY_MS: 500, // Min delay for character to "read" a message (high trust)
  MAX_READ_DELAY_MS: 10000, // Max delay for character to "read" (low trust)
  READ_DELAY_JITTER_MS: 1000, // Random variation in read delay

  MIN_REPLY_DELAY_MS: 1000, // Min delay for character to reply (high trust)
  MAX_REPLY_DELAY_MS: 60000, // Max delay for character to reply (low trust)
  REPLY_DELAY_JITTER_MS: 2000, // Random variation in reply delay
};

// Add other constants as needed
