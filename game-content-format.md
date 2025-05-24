
# Game Content TypeScript Object Format

Each story for "Anonymous File" is defined by a TypeScript constant object, adhering to the `StoryContentData` interface. This document outlines the structure and fields of this object. These objects are typically located in files like `src/game-content/stories/story-XX.ts`.

## Root Object (`StoryContentData` Interface)

The root object for a story's content contains the following top-level properties:

*   `storyInfo`: (Object, `StoryInfo`) Metadata about the story.
*   `connectionSequence`: (Array of `ShellMessage` objects, optional) A story-specific sequence of messages to display in the terminal upon connection/login for this story.
*   `initialFileSystem`: (Object, `InitialFileSystemStructure`) Defines the file system structure for the story.
*   `evidence`: (Object, `Record<string, Omit<EvidenceItem, 'discovered'>>`) A record of all evidence items discoverable in the story.
*   `puzzles`: (Object, `Record<string, Omit<Puzzle, 'isSolved'>>`) A record of all puzzles present in the story.
*   `characters`: (Object, `Record<string, Omit<Character, 'trustLevel'>>`) A record of all characters appearing in the story.
*   `narrativeScript`: (Object, `Record<string, ShellMessage[]>>`) A collection of pre-defined message sequences for various game events.
*   `initialPlayerStateOverrides`: (Object, `Partial<Omit<PlayerStoryState, ...>>`) Optional values to override parts of the default initial player state for this story.
*   `clearConditions`: (Object) Defines how to determine if this story has been successfully completed.

---

## 1. `storyInfo`

Contains metadata about the story. (Type: `StoryInfo`)

*   `storyNumber`: (Number, required) The sequential number of the story (e.g., 1, 2).
*   `title`: (String, required) The title of the story (e.g., "Scarlet Log").
*   `description`: (String, optional) A brief description of the story's plot.
*   `nextStoryNumber`: (Number | null, optional) The number of the story that follows this one. `null` or omitted if this is the last available story.

**Example (in TypeScript):**
```typescript
const storyInfo: StoryInfo = {
  storyNumber: 1,
  title: "Scarlet Log",
  description: "Investigate the disappearance of the streamer Luna_Live.",
  nextStoryNumber: 2
};
```

---

## 2. `connectionSequence`

An optional array of `ShellMessage` objects that defines a custom sequence of messages to be displayed in the terminal when the player starts or resumes this specific story. If omitted, a default connection sequence will be used.

*   Each element is a `ShellMessage` object (see `types.ts` for full definition, but typically `id`, `type`, `text` are key).

**Example (in TypeScript):**
```typescript
const connectionSequence: ShellMessage[] = [
  { id: 's1_conn_01', type: 'system', text: 'Initializing connection to Story 1 Node...' },
  { id: 's1_conn_02', type: 'progress', text: '.......... 25%' },
  // ... more messages
];
```

---

## 3. `initialFileSystem`

Defines the complete file system structure for the story. (Type: `InitialFileSystemStructure`)

*   Each node can be a file (`InitialFileNode`) or a directory (`InitialDirectoryNode`).
*   Files:
    *   `name`: (String) Name of the file.
    *   `content`: (String) Text content.
    *   `isEncrypted?`: (Boolean)
    *   `password?`: (String)
    *   `decryptedContent?`: (String)
    *   `canAnalyze?`: (Boolean)
    *   `analysisResult?`: (String)
*   Directories:
    *   `type`: (Must be `FileSystemNodeType.DIRECTORY`)
    *   `name`: (String) Name of the directory.
    *   `children`: (Object) Record of child `InitialFileSystemItem`s.

**Example (in TypeScript, root definition):**
```typescript
import { FileSystemNodeType } from '../types'; // Assuming types.ts is in a parent dir

const initialFileSystem: InitialFileSystemStructure = {
  "/": {
    type: FileSystemNodeType.DIRECTORY,
    name: "/",
    children: {
      "welcome.txt": { // Type defaults to FILE if not specified and no children
        name: "welcome.txt",
        content: "Welcome to Story 1!"
      },
      "logs": {
        type: FileSystemNodeType.DIRECTORY,
        name: "logs",
        children: {
          "system.log": { name: "system.log", content: "Log data..." }
        }
      }
    }
  }
};
```
*(Refer to `types.ts` for `InitialFileSystemStructure`, `InitialFileNode`, `InitialDirectoryNode` for full details.)*

---

## 4. `evidence`

A record (object) where each key is an `evidenceId` (e.g., "E001_SystemLog") and the value is an `Omit<EvidenceItem, 'discovered'>` object. The `discovered` field is managed in player state.

*   **`EvidenceItem` (template part)**:
    *   `id`: (String) Unique ID.
    *   `title`: (String) Display title.
    *   `content`: (String) Detailed content.
    *   `type`: (String) "text", "log_entry", "image".
    *   `source?`: (String) Path or origin.
    *   `timestamp?`: (String)

**Example (in TypeScript):**
```typescript
const evidence = {
  "E001_SystemLog": {
    id: "E001_SystemLog",
    title: "System Log Analysis",
    content: "Analysis reveals suspicious activity...",
    type: "log_entry",
    source: "/logs/system.log"
  }
};
```

---

## 5. `puzzles`

A record where each key is a `puzzleId` (e.g., "P001_DecryptArchive") and the value is an `Omit<Puzzle, 'isSolved'>` object. `isSolved` is managed in player state.

*   **`Puzzle` (template part)**:
    *   `id`: (String) Unique ID.
    *   `description`: (String) Objective description.
    *   `relatedEvidenceIds?`: (Array of Strings) `evidenceId`s related or unlocked.

**Example (in TypeScript):**
```typescript
const puzzles = {
  "P001_DecryptArchive": {
    id: "P001_DecryptArchive",
    description: "Decrypt the secret archive.",
    relatedEvidenceIds: ["E002_DecryptedFile"]
  }
};
```

---

## 6. `characters`

A record where each key is a `characterId` (e.g., "AdminAlex") and the value is an `Omit<Character, 'trustLevel'>` object. `trustLevel` is managed dynamically in player state.

*   **`Character` (template part)**:
    *   `id`: (String) Unique ID.
    *   `name`: (String) Display name.
    *   `dialogueState`: (Object) Record where keys are topics (keywords) and values are arrays of possible string responses. A "default" key is recommended.

**Example (in TypeScript):**
```typescript
const characters = {
  "AdminAlex": {
    id: "AdminAlex",
    name: "AdminAlex",
    dialogueState": {
      "hello": ["Greetings. How can I assist?"],
      "Luna_Live": ["Luna? A talented streamer. Her disappearance is concerning."],
      "default": ["I'm not sure I understand.", "Can you be more specific?"]
    }
  }
};
```

---

## 7. `narrativeScript`

A record where keys are event names (e.g., "welcome", "puzzle_P001_decrypted") and values are arrays of `ShellMessage` objects.

*   **`ShellMessage` Object (simplified for narrative script definition)**:
    *   `id`: (String) Unique ID for this message.
    *   `type`: (String) "system", "output", "progress".
    *   `text`: (String) Message content.
    *   `source?`: (String) Character source (e.g., "Mysterious Informant").
    *   `isRawHTML?`: (Boolean) For progress bars or special HTML.

**Example (in TypeScript):**
```typescript
const narrativeScript = {
  "welcome": [
    { id: "welcome1", type: "system", text: "Accessing secure node..." },
    { id: "welcome2", type: "system", text: "Connection established. Welcome to story 1." }
  ],
  "story_completed_success": [
    { id: "scs1", type: "system", text: "Congratulations! You have cleared this story." }
  ]
};
```

---

## 8. `initialPlayerStateOverrides`

An object (type `Partial<Omit<PlayerStoryState, ...>>`) containing values to override parts of the default initial player state when this story starts.

*   `currentPath?`: (String)
*   `gameStage?`: (String)
*   `narrativeFlags?`: (Object) Record of initial narrative flags.
*   `discoveredEvidenceIds?`: (Array of Strings)
*   `solvedPuzzleIds?`: (Array of Strings)

**Note**: Excludes fields like `fileSystemState`, `characterDynamicData`, `username`, etc., which are derived or managed differently.

**Example (in TypeScript):**
```typescript
const initialPlayerStateOverrides = {
  currentPath: "/files",
  gameStage: "investigation_start",
  narrativeFlags: {
    "briefing_read": false
  }
};
```

---

## 9. `clearConditions`

Defines the conditions for completing the story.

*   `completionType`: (String) e.g., `"narrativeFlag"`, `"allPuzzlesSolved"`.
*   If `"narrativeFlag"`:
    *   `flagName?`: (String) Name of the `narrativeFlag`.
    *   `expectedValue?`: (Any) Value the flag must have.
    *   `valueMustContain?`: (String) Substring if `expectedValue` is a string.

**Example (in TypeScript):**
```typescript
const clearConditions = {
  completionType: "narrativeFlag",
  flagName: "final_choice_made",
  valueMustContain: "rivalstreamerx"
};
```
