

export interface ShellMessage {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system' | 'prompt' | 'progress' | 'clear_signal' | 'exit_signal' | 'story_complete_signal'; // Added story_complete_signal
  source?: string;
  timestamp?: string;
  isRawHTML?: boolean; // For special formatting like progress bars
  pathAtCommandTime?: string; // Store the path as it was when the command was submitted
  usernameAtCommandTime?: string; // Store the username for historical prompts
}

export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export enum FileSystemNodeType {
  FILE = 'FILE',
  DIRECTORY = 'DIRECTORY',
}

export interface FileNode {
  type: FileSystemNodeType.FILE;
  name: string;
  content: string;
  isEncrypted?: boolean;
  password?: string;
  decryptedContent?: string;
  canAnalyze?: boolean;
  analysisResult?: string;
}

export interface DirectoryNode {
  type: FileSystemNodeType.DIRECTORY;
  name: string;
  children: Record<string, FileSystemItem>;
}

export type FileSystemItem = FileNode | DirectoryNode;

export interface FileSystemStructure {
  [key: string]: FileSystemItem;
}

export interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'log_entry';
  discovered: boolean; // This will be part of PlayerStoryState for specific story
  source?: string;
  timestamp?: string;
}

export interface Puzzle {
  id: string;
  description: string;
  isSolved: boolean; // This will be part of PlayerStoryState
  relatedEvidenceIds?: string[];
  // Extended Puzzle definition
  puzzleType?: 'passwordReset' | 'decryption' | 'other';
  targetAccount?: string; // For passwordReset
  securityQuestionAnswerPairs?: { questionHint?: string, answers: string[] }[]; // For passwordReset
  targetFilePath?: string; // For decryption
  correctPassword?: string; // For decryption
  narrativeScriptKeySuccess?: string; // For all puzzle types
  narrativeScriptKeyFailure?: string; // For passwordReset or other fail-able puzzles
  unlocksEvidenceOnSuccess?: string[]; // Evidence IDs unlocked on success
}


// --- New types for configurable command responses ---
export interface EvidenceResponseConfig {
  responseText: string;
  trustChange?: number;
  setNarrativeFlags?: Record<string, boolean | string | number>;
  unlocksEvidenceIds?: string[];
}

export interface DefaultEvidenceResponseConfig {
  responseText: string;
  trustChange?: number;
}

export interface CharacterCommandResponses {
  submitEvidence?: Record<string, EvidenceResponseConfig>; // Key: evidence ID
  defaultSubmitEvidence?: DefaultEvidenceResponseConfig;
  // Future commands could be added here, e.g., specific query responses
}
// --- End new types ---

// Dialogue enhancements
export interface DialogueResponseOption {
    text: string;
    trustChange?: number;
    setNarrativeFlags?: Record<string, boolean | string | number>;
}
export interface DialogueEntry {
    responses: (string | DialogueResponseOption)[]; // Can be simple strings or richer objects
    requiredTrustMin?: number;
    requiredTrustMax?: number;
    requiredNarrativeFlags?: Record<string, any>;
    triggeredNarrativeFlags?: Record<string, any>; // Flags to set when this dialogue is triggered
}


export interface Character {
  id: string;
  name: string;
  trustLevel: number; // This will be part of PlayerStoryState
  dialogueState: Record<string, DialogueEntry | string[]>; // Allow richer dialogue entries
  initialTrustLevel?: number; // Configurable initial trust
  // Character-specific chat delay parameters
  minReadDelayMs?: number;
  maxReadDelayMs?: number;
  readDelayJitterMs?: number;
  minReplyDelayMs?: number;
  maxReplyDelayMs?: number;
  replyDelayJitterMs?: number;
  // Configurable command responses
  commandResponses?: CharacterCommandResponses;
}

// --- Inbox Types ---
export interface InboxMessage {
  id: string;
  timestamp: string;
  sender: string; // 'Player' or character name/ID
  recipient: string; // Character name/ID or 'Player'
  body: string;
  attachments?: { id: string; title: string }[];
  type: 'sent' | 'received';
  isRead: boolean;
  recipientReadTimestamp?: string | null;
}

export interface ConversationThread {
  threadId: string;
  characterId: string;
  characterName: string;
  messages: InboxMessage[];
  lastMessageTimestamp: string;
  hasUnread: boolean;
}

export interface PlayerStoryState {
  currentPath: string;
  fileSystemState: FileSystemStructure;
  discoveredEvidenceIds: string[];
  solvedPuzzleIds: string[];
  narrativeFlags: Record<string, boolean | string | number>;
  characterDynamicData: Record<string, { trustLevel: number; }>;
  gameStage: string;
  evidenceNotes: Record<string, string>;
  characterNotes: Record<string, string>;
  username: string;
  password?: string;
  currentStoryNumber: number;
  inboxThreads: Record<string, ConversationThread>;
}

export interface PlayerProfile {
    username: string;
    highestStoryCompleted: number;
}


// --- Types for Game Content (now defined in TypeScript) ---
export interface StoryInfo {
    storyNumber: number;
    title: string;
    description?: string;
    nextStoryNumber?: number | null;
}

export interface InitialFileNode extends Omit<FileNode, 'type'> {
  type?: FileSystemNodeType.FILE;
}
export interface InitialDirectoryNode extends Omit<DirectoryNode, 'type' | 'children'> {
  type: FileSystemNodeType.DIRECTORY;
  children: Record<string, InitialFileSystemItem>;
}
export type InitialFileSystemItem = InitialFileNode | InitialDirectoryNode;

export interface InitialFileSystemStructure {
  [key: string]: InitialFileSystemItem;
}

// --- Configurable command/logic types for StoryContentData ---
export interface ConnectionPointConfig {
  successResponseText: string;
  failureResponseText?: string; // For cases other than simple "not found"
  setNarrativeFlags?: Record<string, boolean | string | number>;
}

export interface AnalysisInsightConfig {
  appendText?: string; // Appends to base analysis from FileNode or EvidenceItem
  overrideBaseResult?: string; // Completely replaces base analysis
  setNarrativeFlags?: Record<string, boolean | string | number>;
  unlocksEvidenceIds?: string[];
}

export interface AccusationRule {
  accusedEntityKeywords: string[]; // e.g., ["rivalstreamerx", "rival streamer x"]
  requiredEvidenceIds?: string[];
  requiredNarrativeFlags?: Record<string, any>; // Key-value pairs must match player state
  isCorrectEnding: boolean;
  narrativeScriptKeySuccess: string; // Key for narrativeScript messages for this outcome
  setNarrativeFlagsOnSuccess?: Record<string, boolean | string | number>;
}
// --- End configurable types ---

// --- System Messages Configuration ---
export interface SystemMessagesConfig {
  command_usage?: string; // Usage: {COMMAND_SYNTAX}
  error_command_usage?: string; // Example: "使用法: {COMMAND_SYNTAX}"
  error_file_not_found?: string; // Example: "エラー: ファイル '{FILE_NAME}' が見つかりません。"
  error_not_a_directory?: string; // Example: "エラー: '{PATH_NAME}' はディレクトリではありません。"
  error_path_not_found?: string; // Example: "エラー: パス '{PATH_NAME}' が見つかりません。"
  error_is_a_directory?: string; // Example: "エラー: '{PATH_NAME}' はファイルではなくディレクトリです。"
  error_encrypted?: string; // Example: "エラー: ファイル '{FILE_NAME}' は暗号化されています。"
  error_invalid_password?: string; // Example: "エラー: 不正なパスワードです。"
  info_decryption_success?: string; // Example: "ファイル '{FILE_NAME}' は正常に解読されました。"
  info_file_not_encrypted?: string; // Example: "ファイル '{FILE_NAME}' は暗号化されていません。"
  error_unknown_command?: string; // Example: "不明なコマンド: {COMMAND_NAME}。「help」と入力してください。"
  info_analysis_notFound?: string; // Example: "分析対象'{TARGET_NAME}'が見つからないか、分析できません。"
  info_new_evidence_added?: string; // Example: "新しい証拠'{EVIDENCE_TITLE}'がData Repositoryに追加されました。"
  connect_failed_default?: string; // Example: "{TARGET_HOST}への接続に失敗しました: ホスト不明または到達不能です。"
  reset_password_success?: string; // Example: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに成功しました。"
  reset_password_failure?: string; // Example: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに失敗しました。情報が間違っています。"
  reset_password_target_not_found?: string; // Example: "アカウント '{ACCOUNT_NAME}' が見つからないか、パスワードリセットの対象ではありません。"
  submit_evidence_char_not_found?: string; // Example: "キャラクターID '{CHAR_ID}' が見つかりません。"
  submit_evidence_item_not_found?: string; // Example: "証拠ID '{EVIDENCE_ID}' が見つからないか、まだ発見されていません。"
  submit_evidence_default_ack?: string; // Example: "{CHAR_NAME} は証拠 '{EVIDENCE_TITLE}' を確認しました。"
  email_char_not_found_error?: string; // Example: "メール送信エラー: 対象キャラクターID '{CHAR_ID}' が見つかりません。"
  email_no_reply_default?: string; // Example: "{CHAR_NAME} からの返信はありませんでした。"
  story_complete_message?: string; // Example: "このストーリーは完了しました。「exit」でログアウトしてください。"
  investigation_ended_message?: string; // Example: "捜査は終了しました。これ以上のコマンドは受け付けられません（help, clear, exitを除く）。"
  runtime_error_command?: string; // Example: "コマンド'{COMMAND_NAME}'の実行中にランタイムエラーが発生しました。"
  empty_directory?: string; // Example: "(空のディレクトリ)"
}
// --- End System Messages Configuration ---


export interface StoryContentData {
  storyInfo: StoryInfo;
  initialFileSystem: InitialFileSystemStructure;
  evidence: Record<string, Omit<EvidenceItem, 'discovered'>>;
  puzzles: Record<string, Omit<Puzzle, 'isSolved'>>;
  characters: Record<string, Omit<Character, 'trustLevel' | 'commandResponses' | 'dialogueState'> & 
    { 
      initialTrustLevel?: number; 
      dialogueState: Record<string, DialogueEntry | string[]>; // Ensure dialogueState uses the new type
      commandResponses?: CharacterCommandResponses 
    }>;
  narrativeScript: Record<string, ShellMessage[]>;
  initialPlayerStateOverrides?: Partial<Omit<PlayerStoryState, 'fileSystemState' | 'characterDynamicData' | 'username' | 'password' | 'currentStoryNumber'>>;
  clearConditions: {
    completionType: "narrativeFlag" | "allPuzzlesSolved";
    flagName?: string;
    expectedValue?: any;
    valueMustContain?: string;
  };
  connectionSequence?: ShellMessage[];
  
  // New configuration sections
  connectionPoints?: Record<string, ConnectionPointConfig>; // Key: connect target (e.g., "AdminAlex_system")
  analysisInsights?: Record<string, AnalysisInsightConfig>; // Key: file path or evidence ID
  accusationRules?: AccusationRule[];
  defaultAccusationFailureNarrativeScriptKey?: string; // e.g., "final_choice_insufficient"
  systemMessages?: SystemMessagesConfig; // For configurable system messages
}

export interface GameData extends StoryContentData {
  commandDefinitions: Record<string, CommandDefinition>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  syntax: string;
  handler: (parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState, anOutputDelay?: number }>;
}