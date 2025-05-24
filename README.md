# Anonymous File: Scarlet Log Prototype

## 1. Application Overview

*   **Name:** Anonymous File: Scarlet Log Prototype
*   **Description:** A prototype for an interactive cyber mystery game, "Anonymous File - Scarlet Log" episode. Players interact via a simulated shell interface to uncover digital evidence, solve puzzles, and experience a branching narrative.
*   **Core Concept:** Players take on the role of an investigator using a terminal-like interface to delve into a digital mystery. The game emphasizes exploration, puzzle-solving, character interaction, and narrative choices that impact the story's progression.

## 2. Core Gameplay Mechanics

### 2.1. Shell Interface
The primary mode of interaction is a simulated shell environment.
*   **Supported Commands:**
    *   `help [command]`: Displays available commands or help for a specific command.
    *   `ls [path]` / `dir [path]`: Lists files and directories.
    *   `cd <directory>`: Changes the current directory.
    *   `cat <filename>` / `type <filename>`: Displays file contents.
    *   `analyze <filename/data_id>`: Analyzes a file or discovered evidence for clues.
    *   `decrypt <filename> <password>`: Decrypts an encrypted file.
    *   `reset_password <account> --q "<answer>"`: Attempts to reset an account's password using a security question.
    *   `submit_evidence <target_character_id> <evidence_id>`: Submits discovered evidence to a character (primarily intended for use via Chat Panel).
    *   `connect <hostname/IP>`: Simulates a connection to a system/host.
    *   `accuse <entity_name>`: Makes a final accusation to conclude the investigation.
    *   `clear`: Clears the terminal screen.
    *   `exit`: Exits the current session and returns to the login screen.
*   **Features:**
    *   **Command Parsing:** Handles commands with arguments, including quoted arguments.
    *   **Tab Completion:** Autocompletes commands and file/directory paths.
    *   **Command History:** Allows navigation through previously entered commands using arrow keys (Up/Down).
    *   **Typed Output:** Shell output is displayed with a typing effect for immersion.
    *   **Contextual Prompt:** Shows `username@anonymous-node:current_path$`.

### 2.2. File System
Players navigate a simulated hierarchical file system.
*   **Structure:** Contains directories and files, starting from a root (`/`).
*   **File Types:**
    *   Regular text files.
    *   Encrypted files (require decryption via `decrypt` command).
*   **Interaction:** Players can list directory contents (`ls`), change directories (`cd`), and read file contents (`cat`).

### 2.3. Evidence Collection & Analysis
*   **Discovery:** Evidence is primarily found by reading files (`cat`) or analyzing items (`analyze`).
*   **`analyze` Command:** Provides insights into files or already discovered evidence. This can unlock new evidence items or reveal crucial information.
*   **Data Repository:** All discovered evidence is listed here (see Section 2.7).

### 2.4. Puzzles
The game features interactive puzzles that players must solve to progress.
*   **Types:**
    *   **Decryption:** Requires finding and using the correct password for an encrypted file (e.g., `secret.zip`).
    *   **Password Reset:** Involves social engineering or finding clues to answer security questions for accounts (e.g., `rival_email`).
*   **Solving:** Typically involves using specific commands with the correct information derived from clues found within the game world.
*   **Rewards:** Solving puzzles can unlock new evidence, files, or trigger narrative events.

### 2.5. Character Interaction
Players can interact with non-player characters (NPCs) through a chat system.
*   **Chat Panel:**
    *   Allows sending text messages and attaching discovered evidence to characters.
    *   Character responses are dynamic, based on predefined dialogue trees, player trust levels, and current narrative flags.
    *   Features simulated read and reply delays for characters, influenced by their personality traits (configurable per character) and trust level with the player.
    *   Indicates unread messages.
*   **Contacts Panel (Character Profile):**
    *   Lists known characters available for interaction.
    *   Allows players to take private notes on each character.
*   **Trust System:**
    *   Player actions, such as submitting relevant evidence or making certain dialogue choices (implicitly through email content), can affect their trust level with characters.
    *   Trust levels can influence character responsiveness (e.g., reply delays) and unlock specific dialogue options or information (via `requiredTrustMin`/`Max` in dialogue definitions).

### 2.6. Narrative & Story Progression
*   **Branching Narrative:** Player choices, solved puzzles, and discovered evidence can influence the story's direction and outcome.
*   **Narrative Flags:** The `playerStoryState.narrativeFlags` object tracks key decisions, events, and story progression points. These flags can gate content or trigger specific narrative sequences.
*   **Story Content:** Each story is defined in `src/game-content/stories/` (e.g., `story-01.ts`).
*   **Accusation System:** The `accuse` command allows players to make a final choice, leading to different endings based on the evidence gathered and the validity of the accusation according to predefined `accusationRules`.
*   **Story Completion:** Determined by `clearConditions` (e.g., a specific narrative flag being set).

### 2.7. Data Repository
A dedicated panel for managing discovered evidence.
*   **View Evidence:** Lists all evidence items the player has found.
*   **Details:** Shows detailed information for selected evidence (ID, title, content, type, source).
*   **Notetaking:** Allows players to write and save private notes for each piece of evidence.
*   **Drag-and-Drop:** Evidence can be dragged from the repository and dropped into the Chat Panel to be attached to messages.

## 3. Player State & Persistence

### 3.1. `PlayerStoryState`
This crucial object tracks all aspects of the player's current game session for a specific story. Key fields include:
*   `currentPath`: The player's current location in the simulated file system.
*   `fileSystemState`: The current state of the file system, including any changes (e.g., decrypted files).
*   `discoveredEvidenceIds`: A list of IDs for all evidence items the player has found.
*   `solvedPuzzleIds`: A list of IDs for all puzzles the player has solved.
*   `narrativeFlags`: A record of key-value pairs tracking story progression and player choices.
*   `characterDynamicData`: Stores dynamic data for each character, notably `trustLevel`.
*   `gameStage`: The current general stage of the game/story (e.g., `introduction`, `ending`).
*   `evidenceNotes`: Player's private notes on discovered evidence.
*   `characterNotes`: Player's private notes on characters.
*   `username`: The logged-in player's username.
*   `password`: (If applicable, for the session).
*   `currentStoryNumber`: The number of the story being played.
*   `inboxThreads`: Stores all chat conversations, including messages, timestamps, and read status.

```typescript
// Example: PlayerStoryState (simplified)
const examplePlayerStoryState: PlayerStoryState = {
  currentPath: "/files",
  fileSystemState: { /* See InitialFileSystemStructure example, but this is the live, mutable version */ },
  discoveredEvidenceIds: ["E001_LunaMemo", "E002_SystemLog"],
  solvedPuzzleIds: ["P001_DecryptSecretZip"],
  narrativeFlags: {
    intro_complete: true,
    contacted_admin_alex: true,
    secret_zip_decrypted: true
  },
  characterDynamicData: {
    "AdminAlex": { trustLevel: 75 },
    "MysteriousInformant": { trustLevel: 100 }
  },
  gameStage: "mid_investigation",
  evidenceNotes: {
    "E001_LunaMemo": "Mentions 'Comet' - likely password for secret.zip."
  },
  characterNotes: {
    "AdminAlex": "Seems helpful, but cautious. Shared key info after E003."
  },
  username: "testUser",
  currentStoryNumber: 1,
  inboxThreads: {
    "thread_AdminAlex": {
      threadId: "thread_AdminAlex",
      characterId: "AdminAlex",
      characterName: "AdminAlex",
      messages: [
        // InboxMessage examples
        {
          id: "msg_sent_123", timestamp: "2024-07-30T10:00:00Z",
          sender: "testUser", recipient: "AdminAlex", body: "Hello, I found something.",
          type: "sent", isRead: true, recipientReadTimestamp: "2024-07-30T10:01:00Z"
        },
        {
          id: "msg_recv_456", timestamp: "2024-07-30T10:05:00Z",
          sender: "AdminAlex", recipient: "testUser", body: "What did you find?",
          type: "received", isRead: true
        }
      ],
      lastMessageTimestamp: "2024-07-30T10:05:00Z",
      hasUnread: false
    }
  }
};
```

### 3.2. `PlayerProfile`
Stores information about the player across multiple stories/sessions.
*   `username`: The player's unique username.
*   `highestStoryCompleted`: The number of the highest story the player has successfully completed.

```typescript
// Example: PlayerProfile
const examplePlayerProfile: PlayerProfile = {
  username: "testUser",
  highestStoryCompleted: 0 // Or 1 if they completed the first story
};
```

### 3.3. Persistence
Player progress is saved to the browser's `localStorage` (unless in Debug Mode).
*   **Profile Storage Key:** `PLAYER_PROFILE_STORAGE_PREFIX` + `username` (e.g., `anonymousFilePlayerProfile_john_doe`)
*   **Story State Storage Key:** `PLAYER_STORY_STATE_STORAGE_PREFIX` + `username` + `_STORY_` + `currentStoryNumber` (e.g., `anonymousFileStoryState_john_doe_STORY_1`)

## 4. Application Structure & UI

### 4.1. Main Layout
The application is divided into several key UI panels:
*   **Shell Interface:** The largest panel, where players input commands and see output.
*   **Side Panel (Right):**
    *   **Data Repository:** Top section, for viewing and managing evidence.
    *   **Tabbed Section (Bottom):**
        *   **Contacts Tab:** Displays character profiles and allows note-taking on characters.
        *   **Chat Tab:** Facilitates messaging with characters, including attachments.

### 4.2. Application Phases
The application progresses through several phases:
*   `loading`: Initial application load.
*   `login`: Player login screen.
*   `story_loading`: Loading assets and data for the selected story.
*   `playing`: Active gameplay.
*   `no_more_stories`: Displayed if the player has completed all available stories.
*   `error_loading_story`: If there's an issue loading story content.

### 4.3. Login System
*   Requires a username and password.
*   On first login with a new username, a new `PlayerProfile` is created.
*   The system attempts to load the story following the `highestStoryCompleted` in the player's profile.
*   If saved story state exists for the current story, it's loaded; otherwise, a new session for that story begins.
*   **Debug Mode Login:**
    *   Username: `adminalpine`
    *   Password: `adminalpine`
    *   This mode bypasses `localStorage` for persistence and runs an automated test sequence defined in `debugService.ts`. Results are displayed in the shell.

## 5. Story Content Configuration (`StoryContentData`)

Each story in the game is defined by a `StoryContentData` object (see `types.ts` and `src/game-content/stories/story-01.ts` for an example). This structure allows for rich, configurable scenarios.

*   `storyInfo`:
    *   `storyNumber`: Unique identifier for the story.
    *   `title`: Display title of the story.
    *   `description`: Brief description.
    *   `nextStoryNumber`: Points to the subsequent story, if any.
    ```typescript
    // Example: StoryInfo
    const exampleStoryInfo: StoryInfo = {
      storyNumber: 1,
      title: "The Scarlet Log",
      description: "Investigate the mysterious disappearance of a prominent streamer.",
      nextStoryNumber: 2
    };
    ```
*   `initialFileSystem`: Defines the starting file system structure.
    *   Files can have `name`, `content`, `isEncrypted` (boolean), `password` (for decryption puzzles), `decryptedContent`, `canAnalyze` (boolean), and `analysisResult` (string, base result for `analyze` command).
    ```typescript
    // Example: InitialFileSystemStructure
    import { FileSystemNodeType } from './types'; // Assuming types.ts is in the same directory for this example
    const exampleInitialFileSystem: InitialFileSystemStructure = {
      "/": {
        type: FileSystemNodeType.DIRECTORY,
        name: "/",
        children: {
          "docs": {
            type: FileSystemNodeType.DIRECTORY,
            name: "docs",
            children: {
              "readme.txt": {
                name: "readme.txt",
                content: "Welcome to the investigation."
              }
            }
          },
          "secrets": {
            type: FileSystemNodeType.DIRECTORY,
            name: "secrets",
            children: {
              "data.enc": {
                name: "data.enc",
                content: "Encrypted Data Stream Alpha...",
                isEncrypted: true,
                password: "Password123",
                decryptedContent: "The secret code is 42.",
                canAnalyze: false // Becomes true after decryption, potentially
              }
            }
          }
        }
      }
    };
    ```
*   `evidence`: A record of all potential evidence items in the story.
    *   Each item has an `id`, `title`, `content`, `type` (e.g., `text`, `log_entry`), and optional `source` (e.g., file path where it's found).
    ```typescript
    // Example: Evidence (within StoryContentData)
    const exampleEvidence = {
      "EV001_LogEntry": { // Key is the evidence ID
        id: "EV001_LogEntry", // Redundant if key is used, but good for array mapping
        title: "Suspicious Log Entry",
        content: "User 'Unknown' accessed critical files at 03:00.",
        type: "log_entry",
        source: "/logs/system.log"
      }
    };
    ```
*   `puzzles`: Defines all puzzles in the story.
    *   Each puzzle has an `id`, `description`, `puzzleType` (`passwordReset`, `decryption`), target information (e.g., `targetFilePath`, `targetAccount`), solution details (`correctPassword`, `securityQuestionAnswerPairs`), `relatedEvidenceIds` (clues), `unlocksEvidenceOnSuccess`, and `narrativeScriptKeySuccess`/`Failure` to trigger narrative events.
    ```typescript
    // Example: Puzzles (within StoryContentData)
    const examplePuzzles = {
      "PUZ001_DecryptFile": {
        id: "PUZ001_DecryptFile",
        description: "Decrypt the sensitive data file.",
        puzzleType: "decryption",
        targetFilePath: "/secrets/data.enc",
        correctPassword: "Password123",
        relatedEvidenceIds: ["EV001_LogEntry"], // Clue to password might be in this evidence
        unlocksEvidenceOnSuccess: ["EV002_DecryptedData"],
        narrativeScriptKeySuccess: "file_decrypted_success"
      },
      "PUZ002_ResetAdminPass": {
        id: "PUZ002_ResetAdminPass",
        description: "Reset the admin account password.",
        puzzleType: "passwordReset",
        targetAccount: "admin_account",
        securityQuestionAnswerPairs: [
          { questionHint: "First pet's name?", answers: ["buddy", "Buddy"] }
        ],
        narrativeScriptKeySuccess: "admin_access_gained",
        unlocksEvidenceOnSuccess: ["EV003_AdminAccess"]
      }
    };
    ```
*   `characters`: Defines all NPCs in the story.
    *   Each character has an `id`, `name`, `initialTrustLevel`.
    *   `dialogueState`: A record where keys are keywords/phrases. Values are `DialogueEntry` objects defining:
        *   `responses`: Possible replies (can be simple strings or `DialogueResponseOption` objects).
        *   `requiredTrustMin`/`Max`: Trust level conditions.
        *   `requiredNarrativeFlags`: Narrative flag conditions.
        *   `triggeredNarrativeFlags`: Flags to set when this dialogue is triggered.
        *   `DialogueResponseOption` can include `text`, `trustChange`, and `setNarrativeFlags`.
    *   `commandResponses`: Defines character-specific reactions to commands like `submit_evidence`, including `responseText`, `trustChange`, `setNarrativeFlags`, and `unlocksEvidenceIds`.
    *   Chat delay parameters (`minReadDelayMs`, `maxReplyDelayMs`, etc.) to simulate realistic response times.
    ```typescript
    // Example: Characters (within StoryContentData)
    const exampleCharacters = {
      "char_jane_doe": {
        id: "char_jane_doe",
        name: "Jane Doe",
        initialTrustLevel: 60,
        minReadDelayMs: 500, maxReadDelayMs: 8000, readDelayJitterMs: 500,
        minReplyDelayMs: 1000, maxReplyDelayMs: 15000, replyDelayJitterMs: 1000,
        dialogueState: {
          "hello": {
            responses: ["Hi there. How can I help you with your investigation?"]
          },
          "secret project": {
            responses: [
              { text: "I can't talk about that unless I trust you more.", trustChange: -5 },
              { text: "It's highly classified. What do you know?", trustChange: 0 }
            ],
            requiredTrustMin: 50, // Only show if trust is 50 or more
            triggeredNarrativeFlags: { "asked_about_secret_project": true }
          },
          "default": {
            responses: ["I'm not sure what you mean.", "Could you be more specific?"]
          }
        },
        commandResponses: {
          submitEvidence: {
            "EV001_LogEntry": { // If player submits this specific evidence
              responseText: "This log entry is very concerning! Thank you.",
              trustChange: 20,
              setNarrativeFlags: { "jane_knows_log": true }
            }
          },
          defaultSubmitEvidence: { // For any other evidence
            responseText: "Thanks for showing this to me. I'll look into it.",
            trustChange: 5
          }
        }
      }
    };
    ```
*   `narrativeScript`: A record of predefined `ShellMessage` arrays, keyed by event names (e.g., `welcome`, `puzzle_P001_decrypted`). These messages are displayed in the shell when the corresponding event occurs.
    ```typescript
    // Example: NarrativeScript (within StoryContentData)
    const exampleNarrativeScript = {
      "welcome_message": [
        { id: "ns_w_1", type: "system", text: "Welcome, Investigator. Your mission begins now." },
        { id: "ns_w_2", type: "system", source: "Handler", text: "We're counting on you." }
      ],
      "file_decrypted_success": [
        { id: "ns_fds_1", type: "system", text: "Decryption successful. New evidence unlocked." }
      ]
    };
    ```
*   `initialPlayerStateOverrides`: Allows setting specific initial values for `PlayerStoryState` fields at the start of the story (e.g., `currentPath`, `narrativeFlags`).
*   `clearConditions`: Defines how story completion is determined (e.g., a specific `narrativeFlag` being set to a certain value).
*   `connectionSequence`: An array of `ShellMessage` objects displayed when the player "connects" to the story, simulating a login/connection process.
*   `connectionPoints`: Configurable responses for the `connect` command, mapping target hostnames to `successResponseText` and optional `setNarrativeFlags`.
*   `analysisInsights`: Provides additional or overriding text/effects for the `analyze` command when used on specific files or evidence IDs. Can `appendText`, `overrideBaseResult`, `setNarrativeFlags`, or `unlocksEvidenceIds`.
*   `accusationRules`: An array defining the logic for the `accuse` command. Each rule includes:
    *   `accusedEntityKeywords`: Keywords to match the player's accusation.
    *   `requiredEvidenceIds`: Evidence needed for this outcome.
    *   `requiredNarrativeFlags`: Narrative flags needed.
    *   `isCorrectEnding`: Whether this outcome is considered a "successful" ending.
    *   `narrativeScriptKeySuccess`: Narrative script to play.
    *   `setNarrativeFlagsOnSuccess`: Flags to set.
    ```typescript
    // Example: AccusationRule (within StoryContentData.accusationRules array)
    const exampleAccusationRule: AccusationRule = {
      accusedEntityKeywords: ["mr. big", "mr big"],
      requiredEvidenceIds: ["EV001_LogEntry", "EV002_DecryptedData"],
      requiredNarrativeFlags: { "jane_knows_log": true },
      isCorrectEnding: true,
      narrativeScriptKeySuccess: "mr_big_caught_red_handed",
      setNarrativeFlagsOnSuccess: { "story_completed_successfully": true, "ending_achieved": "good_ending" }
    };
    ```
*   `defaultAccusationFailureNarrativeScriptKey`: Narrative script to play if no specific accusation rule is met.
*   `systemMessages`: A comprehensive mapping of system message keys (e.g., `error_file_not_found`) to their display text. Allows for localization or thematic customization of game feedback. Placeholders like `{FILE_NAME}` are used for dynamic content.
    ```typescript
    // Example: SystemMessagesConfig (within StoryContentData)
    const exampleSystemMessages: SystemMessagesConfig = {
      error_file_not_found: "SYSTEM ALERT: File '{FILE_NAME}' does not exist or is beyond your clearance.",
      error_unknown_command: "INVALID COMMAND: '{COMMAND_NAME}'. Type 'help' for assistance.",
      info_decryption_success: "Cipher broken. File '{FILE_NAME}' decrypted."
    };
    ```

## 6. Master Settings & Key Constants

These are application-wide settings primarily found in `App.tsx` and `debugService.ts`:

*   **Storage Prefixes (for `localStorage`):**
    *   `PLAYER_PROFILE_STORAGE_PREFIX`: `"anonymousFilePlayerProfile_"`
    *   `PLAYER_STORY_STATE_STORAGE_PREFIX`: `"anonymousFileStoryState_"`
*   **Default Initial Story:** `DEFAULT_INITIAL_STORY`: `1` (Used for debug mode and potentially for new players if no other logic dictates).
*   **Default Chat Delay Settings (`DEFAULT_DELAY_SETTINGS` in `App.tsx`):**
    These values are used for character chat simulation if not overridden by specific character configurations. They determine the range for simulated read and reply times.
    *   `MIN_READ_DELAY_MS`: 500 ms
    *   `MAX_READ_DELAY_MS`: 10000 ms (10 seconds)
    *   `READ_DELAY_JITTER_MS`: 1000 ms (±0.5s jitter)
    *   `MIN_REPLY_DELAY_MS`: 1000 ms (1 second)
    *   `MAX_REPLY_DELAY_MS`: 60000 ms (1 minute)
    *   `REPLY_DELAY_JITTER_MS`: 2000 ms (±1s jitter)
*   **Debug Mode Credentials:**
    *   Username: `DEBUG_USERNAME` (`"adminalpine"`)
    *   Password: `DEBUG_PASSWORD` (`"adminalpine"`)

## 7. Technical Details

*   **Frontend Stack:** React, TypeScript, Tailwind CSS.
*   **State Management:** Primarily React's built-in state management (`useState`, `useEffect`, `useMemo`, `useCallback`).
*   **Modularity:**
    *   `services/`: Contains core game logic (command processing, file system operations, parsing).
    *   `components/`: Reusable UI elements.
    *   `src/game-content/`: Houses story-specific data.
    *   `types.ts`: Defines all major data structures and types for the application.

This README provides a snapshot of the "Anonymous File: Scarlet Log Prototype" as of its current state.
As the application evolves, this document should be updated to reflect new features and changes.
