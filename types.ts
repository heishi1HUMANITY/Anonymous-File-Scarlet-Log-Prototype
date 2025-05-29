

export interface ShellMessage {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system' | 'prompt' | 'progress' | 'clear_signal' | 'exit_signal' | 'story_complete_signal';
  source?: string;
  timestamp?: string;
  isRawHTML?: boolean;
  pathAtCommandTime?: string;
  deviceIdAtCommandTime?: string; 
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
  permissions?: string; 
  owner?: string;
  group?: string;
  lastModified?: string; 
  fileType?: string; 
}

export interface DirectoryNode {
  type: FileSystemNodeType.DIRECTORY;
  name: string;
  children: Record<string, FileSystemItem>;
  permissions?: string;
  owner?: string;
  group?: string;
  lastModified?: string;
}

export type FileSystemItem = FileNode | DirectoryNode;
export type LiveFileSystemStructure = FileSystemStructure; 

export interface FileSystemStructure {
  [key: string]: FileSystemItem;
}

export interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'log_entry' | 'audio' | 'video' | 'network_capture' | 'malware_sample' | 'document';
  discovered: boolean;
  source?: string; 
  timestamp?: string; 
  metadata?: Record<string, any>; 
}

export interface Puzzle {
  id: string;
  description: string;
  isSolved: boolean;
  relatedEvidenceIds?: string[];
  puzzleType?: 'passwordReset' | 'decryption' | 'socialEngineering' | 'dataRecovery' | 'malwareAnalysis' | 'networkPuzzle' | 'smartphoneLock' | 'smartphoneCrack';
  targetAccount?: string;
  securityQuestionAnswerPairs?: { questionHint?: string, answers: string[] }[];
  targetFilePath?: string;
  correctPassword?: string;
  narrativeScriptKeySuccess?: string;
  narrativeScriptKeyFailure?: string;
  unlocksEvidenceOnSuccess?: string[];
  unlocksAppAccess?: string; 
  unlocksTerminalCommand?: string; 
  targetDeviceIdentifier?: string; 
  revealedPasscode?: string; 
  unlocksSmartphoneAccess?: boolean; 
}

export interface EvidenceResponseConfig {
  responseText: string;
  trustChange?: number;
  setNarrativeFlags?: Record<string, any>;
  unlocksEvidenceIds?: string[];
}

export interface DefaultEvidenceResponseConfig {
  responseText: string;
  trustChange?: number;
}

export interface CharacterCommandResponses {
  submitEvidence?: Record<string, EvidenceResponseConfig>;
  defaultSubmitEvidence?: DefaultEvidenceResponseConfig;
}

export interface DialogueResponseOption {
    text: string;
    trustChange?: number;
    setNarrativeFlags?: Record<string, any>;
    ethicalScoreChange?: number;
}
export interface DialogueEntry {
    responses: (string | DialogueResponseOption)[];
    requiredTrustMin?: number;
    requiredTrustMax?: number;
    requiredNarrativeFlags?: Record<string, any>;
    triggeredNarrativeFlags?: Record<string, any>;
    requiredEthicalScoreMin?: number;
    requiredEthicalScoreMax?: number;
}

export interface Character {
  id: string;
  name: string;
  initialTrustLevel?: number;
  minReadDelayMs?: number;
  maxReadDelayMs?: number;
  readDelayJitterMs?: number;
  minReplyDelayMs?: number;
  maxReplyDelayMs?: number;
  replyDelayJitterMs?: number;
  commandResponses?: CharacterCommandResponses; 
  dialogueState?: Record<string, DialogueEntry | string[]>; 
  aiPersonalityPrompt?: string; 
  smartphoneContactId?: string; 
  socialMediaUserIds?: Record<string, string>; 
  emailAddresses?: string[];
  initialCanBeContacted?: boolean;
}

export interface CharacterDynamicData {
    trustLevel: number;
    canChatTerminal?: boolean; 
    canBeContacted?: boolean;
}

export interface MessageAttachment {
  id: string; // Unique ID for this attachment instance
  type: 'image' | 'video' | 'audio' | 'file' | 'location';
  fileName: string;
  fileSize?: number; // in bytes
  mimeType?: string;
  url?: string; // Game-internal asset path or a link to a PhotoDef/FileNode
  thumbnailUrl?: string; // Optional preview
  duration?: number; // For audio/video in seconds
  lat?: number; // For location
  lon?: number; // For location
  // Could also link to an EvidenceItem ID if the attachment itself is evidence
  evidenceId?: string; 
}

export interface InboxMessage { 
  id:string;
  threadId: string; 
  timestamp: string;
  senderId: string; 
  recipientId: string; 
  body: string;
  attachments?: MessageAttachment[]; 
  type: 'sent' | 'received' | 'system_event'; 
  isRead: boolean;
  readTimestamp?: string | null;
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed';
  metadata?: Record<string, any>; 
}

export interface ConversationThread { 
  threadId: string;
  participants: string[]; 
  characterId?: string; 
  characterName?: string; 
  groupName?: string; 
  groupAdmin?: string; // Character ID of the group admin
  messages: InboxMessage[];
  lastMessageTimestamp: string;
  hasUnread: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
}

export interface TerminalChatMessage {
  id: string;
  timestamp: string;
  senderId: 'player' | string; 
  senderName?: string; 
  body: string;
  attachmentTitles?: string[]; 
  type: 'sent' | 'received' | 'system_event_terminal'; 
  isLoadingAI?: boolean;
  isReadByCharacter?: boolean; 
  isReadByPlayer?: boolean; 
}

export interface TerminalChatThread {
  characterId: string;
  messages: TerminalChatMessage[];
  lastMessageTimestamp: string; 
}

export interface CallLogEntry {
  id: string;
  contactId: string; // Links to SmartphoneContactDef.id or Character.id
  contactName: string;
  phoneNumber?: string;
  type: 'outgoing' | 'incoming' | 'missed';
  timestamp: string;
  durationSeconds: number; // 0 for missed or immediately ended calls
}

// --- Smartphone Specific App Data Types ---
export interface WhisperTalkAppData {
  currentView: 'chat_list' | 'chat_screen';
  selectedThreadId?: string;
}

export interface SnapVaultAppData {
  albums: PhotoAlbumDef[]; 
  currentView: 'photos_tab' | 'albums_tab' | 'album_detail' | 'photo_detail';
  activeTab: 'photos' | 'albums'; 
  selectedAlbumId?: string;
  selectedPhotoId?: string;
}

export interface ContactSphereAppData {
  contacts: SmartphoneContactDef[];
  selectedContactId?: string;
}

export interface SocialCommentDef {
  commentId: string;
  postId: string; // Link back to the parent post
  authorUserId: string; // SocialMediaProfileDef.userId of the comment author
  timestamp: string; // ISO 8601
  text: string;
  likesCount?: number;
}

export interface SocialPostDef {
  postId: string;
  authorUserId: string; // SocialMediaProfileDef.userId of the author
  authorCharacterId?: string; // Character.id of the author, if applicable
  timestamp: string; // ISO 8601
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount?: number;
  likedByUserIds?: string[]; // Array of SocialMediaProfileDef.userId who liked this
  comments?: SocialCommentDef[];
  repostCount?: number;
  tags?: string[];
  locationTagged?: string; // Symbolic location name or coordinates
}

export interface FriendNetProfileData {
    characterId: string; // Owner's character ID from Character.id
    userId: string; // FriendNet specific user ID (from SocialMediaProfileDef)
    username: string;
    profilePictureUrl?: string;
    bannerImageUrl?: string;
    bio?: string;
    followersCount: number;
    followingCount: number;
    posts: SocialPostDef[]; // Posts made by this user
}

export interface FriendNetAppData {
    userProfile: FriendNetProfileData; // The device owner's FriendNet profile
    feedPosts: SocialPostDef[]; // All posts to show in the main feed (could be mix from followed users)
    currentView: 'feed' | 'explore' | 'reels' | 'notifications' | 'profile' | 'post_detail';
    selectedPostId?: string;
    // Potentially: stories: any[]; directMessages: any[];
}

export interface ChirpPostDef extends Omit<SocialPostDef, 'authorUserId' | 'postId' | 'comments' | 'content' | 'locationTagged'> {
  chirpId: string; // Unique ID for the chirp
  authorCharacterId: string; // Character.id of the author
  textContent: string; // Chirp uses textContent, max ~280 chars
  reChirpCount?: number;
  quoteChirpId?: string; // ID of a chirp being quoted
  // Mentions and hashtags would be parsed from textContent or stored separately if needed for querying
}

export interface ChirpProfileData {
    characterId: string;
    userId: string; // Chirp specific user ID
    username: string; // e.g., @handle
    displayName?: string;
    profilePictureUrl?: string;
    bannerImageUrl?: string;
    bio?: string;
    followersCount: number;
    followingCount: number;
    chirpsCount?: number;
    joinDate?: string;
}
export interface ChirpAppData {
    userProfile: ChirpProfileData; // The device owner's Chirp profile
    timelineChirps: ChirpPostDef[]; // Chirps to show in the main timeline
    currentView: 'timeline' | 'search' | 'notifications' | 'messages' | 'chirp_detail' | 'profile';
    selectedChirpId?: string;
    selectedUserProfileId?: string; // For viewing other profiles
}

export interface FileAttachmentDef { 
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentId?: string; // Link to a FileNode or EvidenceItem if it's a file in the FS
  url?: string; // Path to game asset if not a dynamic file
  previewUrl?: string;
}

export interface EmailDef {
  emailId: string;
  folderPath: string; // e.g., "Inbox", "Sent", "Trash/Deleted Items"
  senderAddress: string;
  senderName?: string;
  recipientAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject: string;
  body: string; // Can be plain text or HTML string
  timestamp: string; // ISO 8601
  isRead: boolean;
  isFlagged?: boolean;
  attachments?: FileAttachmentDef[];
  phishingRisk?: 'none' | 'low' | 'medium' | 'high'; // For game mechanics
  // For threading:
  inReplyTo?: string; // emailId of the email this is a reply to
  references?: string[]; // Array of emailIds in the same thread
}

export interface EmailAccountDef {
  accountId: string;
  emailAddress: string;
  username?: string; // Display name for the account
  password?: string; // For game puzzles, if applicable
  characterId?: string; // Link to Character.id if this account belongs to a character
  folders?: Record<string, EmailDef[]>; // Key is folder name (e.g., "Inbox", "Sent")
  // signature?: string;
  // serverSettings?: any; // Placeholder for POP3/IMAP if ever needed
}

export interface MailWiseAppData {
    accounts: EmailAccountDef[];
    currentView: 'account_list' | 'folder_list' | 'email_list' | 'email_detail' | 'compose_email';
    selectedAccountId?: string;
    selectedFolderPath?: string; // e.g., "Inbox" or "Inbox/Subfolder"
    selectedEmailId?: string;
    // For compose view:
    composeTo?: string[];
    composeCc?: string[];
    composeBcc?: string[];
    composeSubject?: string;
    composeBody?: string;
    composeAttachments?: FileAttachmentDef[];
}

export interface BrowserBookmarkDef {
  id: string;
  title: string;
  url: string; // Can be game-internal like "game://some-page" or external-like
  timestamp?: string; // When it was bookmarked
}

export interface BrowserHistoryItemDef {
  id: string;
  title: string;
  url: string;
  timestamp: string; // Visited time
}

export interface WebContentDef {
    url: string; 
    title: string; 
    htmlContent: string; 
    linkedEvidence?: string[]; 
    linkedFiles?: Record<string, string>; 
    initialBrowserHistory?: BrowserHistoryItemDef[]; // If this page leads to history entries
}

export interface WebStalkerAppData {
    bookmarks: BrowserBookmarkDef[];
    history: BrowserHistoryItemDef[];
    currentUrl?: string; // The URL currently displayed
    currentContent?: WebContentDef; // The content of the current URL
    currentView: 'browser' | 'bookmarks' | 'history' | 'tabs_overview'; // 'tabs_overview' is a placeholder
    // Potentially: openTabs: WebContentDef[]; activeTabIndex: number;
}

export interface CalendarEventDef {
  eventId: string;
  title: string;
  startTime: string; 
  endTime: string; 
  location?: string; 
  description?: string;
  attendees?: string[]; 
  isAllDay?: boolean;
}

export interface ChronosAppData {
    events: CalendarEventDef[];
    currentView: 'month' | 'week' | 'day' | 'agenda' | 'event_detail';
    selectedDate?: string; // ISO date string for day/week view focus
    selectedEventId?: string;
}

export interface NoteDef { 
  noteId: string;
  title?: string;
  content: string; 
  createdTimestamp: string; 
  modifiedTimestamp: string; 
  tags?: string[];
  // color?: string; // For colored notes like Google Keep
  // isPinned?: boolean;
}

export interface IdeaPadAppData {
    notes: NoteDef[];
    currentView: 'list' | 'note_detail'; // Or 'grid'
    selectedNoteId?: string;
    // Potentially: folders: string[]; currentFolder?: string;
}

export interface GeoMapperSavedPlaceDef {
    placeId: string;
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    notes?: string;
}
export interface GeoMapperSearchHistoryDef {
    query: string;
    timestamp: string;
}
export interface GeoMapperAppData {
    savedPlaces: GeoMapperSavedPlaceDef[];
    searchHistory: GeoMapperSearchHistoryDef[];
    currentView: 'map' | 'search_results' | 'place_detail' | 'directions'; // Simplified
    selectedPlaceId?: string;
    currentMapCoordinates?: { lat: number; lon: number; zoom: number }; // For map view state
}

export interface FileExplorerAppData {
    currentPath: string; // Path within the smartphone's file system
    viewMode: 'list' | 'grid';
    selectedFile?: string; // Name of selected file/folder for actions
    // Potentially: sortOrder: 'name_asc' | 'name_desc' | 'date_asc' | ...
}


export type AnyAppData = 
  WhisperTalkAppData | 
  SnapVaultAppData | 
  ContactSphereAppData |
  FriendNetAppData | 
  ChirpAppData | 
  MailWiseAppData |
  WebStalkerAppData |
  ChronosAppData |
  IdeaPadAppData |
  GeoMapperAppData |
  FileExplorerAppData |
  Record<string, any>; // Fallback for not-yet-typed apps


export interface AppState {
  id: string; 
  appName: string;
  isSystemApp: boolean;
  unreadCount?: number;
  appSpecificData: AnyAppData; 
  isEnabled?: boolean; 
  hasAccess?: boolean; 
  iconUrl?: string; 
  iconChar?: string; 
}

export interface SmartphoneNotification {
  id: string;
  appId: string; 
  appName?: string; 
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  iconUrl?: string;
  iconChar?: string;
  action?: { type: 'open_app' | 'open_chat' | 'custom'; targetId?: string; }; 
  groupKey?: string; 
  isSummary?: boolean; 
}

export interface TimeLimitEventState {
  id: string;
  isActive: boolean;
  startTime: number; 
  durationMs: number;
  remainingTimeMs: number; 
}

export interface SmartphoneDynamicColorPalette {
  // Core Accent Colors
  primary: string;        // Main brand color, prominent UI elements
  accent: string;         // Secondary accent, FABs, highlights
  
  // Neutral Backgrounds & Surfaces
  background: string;     // Overall app background
  surface: string;        // Cards, dialogs, sheets
  surfaceVariant?: string;// Subtle variations of surface
  
  // Text Colors (for contrast)
  textOnPrimary: string;
  textOnAccent: string;
  textOnBackground: string; // Primary text on main background
  textOnSurface: string;    // Primary text on cards/dialogs
  textNeutralSubtle: string; // For less important text, placeholders
  textNeutralMedium?: string; // For secondary text

  // Optional additions for more control
  statusBar?: string;       // Specific color for status bar background
  navBar?: string;          // Specific color for navigation bar background
  iconDefault?: string;     // Default icon color
  iconActive?: string;      // Active/selected icon color
}


export interface QuickSettingsState {
  wifiEnabled: boolean;
  wifiConnectedTo?: string; 
  bluetoothEnabled: boolean;
  bluetoothConnectedDevices?: string[]; 
  doNotDisturbEnabled: boolean;
  flashlightEnabled: boolean;
  airplaneModeEnabled: boolean;
  batterySaverEnabled: boolean;
  locationServicesEnabled: boolean;
}


export interface PlayerStoryState {
  currentPath: string; 
  deviceFileSystems: Record<string, FileSystemStructure>; 
  currentConnectedDeviceId: string; 
  deviceConnectionStack: string[]; 
  terminalHistory: string[];
  terminalEnvironmentVars: Record<string, string>;
  
  smartphoneLocked: boolean;
  smartphonePasscode: string | null; 
  smartphoneHomeScreenApps: string[];
  smartphoneInstalledApps: Record<string, AppState>;
  smartphoneCurrentApp: string | null;
  smartphoneNotificationQueue: SmartphoneNotification[];
  currentWallpaper: string; // Made non-optional
  notificationsLastCheckedTimestamp?: string; 
  smartphoneDynamicColorPalette: SmartphoneDynamicColorPalette; // Made non-optional
  quickSettingsState: QuickSettingsState; // Made non-optional
  callLog?: CallLogEntry[];

  discoveredEvidenceIds: string[];
  solvedPuzzleIds: string[];
  narrativeFlags: Record<string, any>;
  gameStage: string;

  username: string; 
  password?: string;
  playerTrustLevels: Record<string, number>;
  playerEthicalScore: number;

  characterDynamicData: Record<string, CharacterDynamicData>;
  inboxThreads: Record<string, ConversationThread>; 
  terminalChatThreads: Record<string, TerminalChatThread>; 

  evidenceNotes: Record<string, string>;
  characterNotes: Record<string, string>;
  currentStoryNumber: number;

  timeLimitEvents: Record<string, TimeLimitEventState>;

  currentLocation: string | null; 
  currentTime: string; 

  saveVersion?: string;
}

export interface PlayerProfile {
    username: string;
    highestStoryCompleted: number;
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
  [key:string]: InitialFileSystemItem;
}

export interface StoryInfo {
    storyNumber: number;
    title: string;
    description?: string;
    nextStoryNumber?: number | null;
    playerDefaultDeviceConfig?: { 
        promptUsername?: string;
        promptHostname?: string;
        connectionMessage?: string;
    };
    smartphoneDeviceTargetId?: string; 
}

export interface DeviceConfig {
    promptUsername: string;
    promptHostname: string;
    initialFileSystem: InitialFileSystemStructure;
    connectionMessage?: string;
    disconnectionMessage?: string;
}

export interface ConnectionPointConfig { 
  successResponseText: string;
  failureResponseText?: string;
  setNarrativeFlags?: Record<string, any>;
}

export interface AnalysisInsightConfig {
  appendText?: string;
  overrideBaseResult?: string;
  setNarrativeFlags?: Record<string, any>;
  unlocksEvidenceIds?: string[];
}

export interface AccusationRule {
  accusedEntityKeywords: string[];
  requiredEvidenceIds?: string[];
  requiredNarrativeFlags?: Record<string, any>;
  isCorrectEnding: boolean;
  narrativeScriptKeySuccess: string;
  setNarrativeFlagsOnSuccess?: Record<string, any>;
}

export interface SystemMessagesConfig {
  command_usage?: string;
  error_command_usage?: string;
  error_file_not_found?: string;
  error_not_a_directory?: string;
  error_path_not_found?: string;
  error_is_a_directory?: string;
  error_encrypted?: string;
  error_invalid_password?: string;
  info_decryption_success?: string;
  info_file_not_encrypted?: string;
  error_unknown_command?: string;
  info_analysis_notFound?: string;
  info_new_evidence_added?: string;
  connect_failed_default?: string;
  reset_password_success?: string;
  reset_password_failure?: string;
  reset_password_target_not_found?: string;
  submit_evidence_char_not_found?: string;
  submit_evidence_item_not_found?: string;
  submit_evidence_default_ack?: string;
  email_char_not_found_error?: string;
  email_no_reply_default?: string;
  story_complete_message?: string;
  investigation_ended_message?: string;
  runtime_error_command?: string;
  empty_directory?: string;
  ai_thinking?: string;
  ai_error?: string;

  smartphone_locked_message?: string;
  smartphone_incorrect_passcode?: string;
  smartphone_app_not_installed?: string;
  smartphone_notification_new_message?: string;
  smartphone_file_received?: string;

  crack_device_target_invalid?: string;
  crack_device_already_unlocked?: string;
  crack_device_success_passcode_found?: string; 
  crack_device_shell_established?: string; 
  crack_device_shell_disconnect?: string; 
  
  device_connection_established?: string; 
  device_disconnected?: string; 
  command_not_available_on_device?: string; 
}

export interface InitialAppDef {
  id: string;
  appName: string;
  iconUrl?: string;
  iconChar?: string; 
  isSystemApp: boolean;
  initialData?: any; 
  isEnabled?: boolean;
  hasAccess?: boolean;
}

export interface SmartphoneContactDef {
  id: string;
  name: string;
  characterId?: string;
  phoneNumbers?: { label: string; number: string }[];
  emailAddresses?: { label: string; address: string }[];
  socialProfiles?: Record<string, string>; 
  profilePictureUrl?: string;
  notes?: string;
  address?: string;
  organization?: string;
}

export interface SocialMediaProfileDef {
  userId: string; // Platform-specific user ID, e.g., "lunathebeststreamer" for FriendNet
  username: string; // Display name or @handle, e.g., "Luna_Live" or "@LunaLiveGaming"
  characterId?: string; // Link to Character.id
  profilePictureUrl?: string;
  bannerImageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string; // ISO 8601
  posts?: SocialPostDef[]; // Posts made by this user on this platform (can be pre-defined)
  initialFriends?: string[]; // Array of other SocialMediaProfileDef.userIds
  initialFollowers?: string[]; // Array of other SocialMediaProfileDef.userIds
  initialFollowing?: string[]; // Array of other SocialMediaProfileDef.userIds
  isPrivate?: boolean;
}


export interface PhotoAlbumDef {
  albumId: string;
  albumName: string;
  photos: PhotoDef[];
  coverPhotoId?: string; 
}

export interface PhotoDef {
  photoId: string;
  filename: string;
  url: string; // For image poster or if it's an image
  timestamp: string; 
  location?: { lat: number; lon: number; name?: string };
  caption?: string;
  tags?: string[];
  metadata?: Record<string, any>; 
  associatedEvidenceId?: string; 
  isHidden?: boolean; 
  isLocked?: boolean; 
  accessGrantedToApps?: string[]; 
  editedUrl?: string; 
  editHistory?: { type: 'filter' | 'crop' | 'rotate'; value: string; timestamp: string }[];
  isVideo?: boolean; // Added for video type
  videoUrl?: string; // Actual video source URL
  duration?: number; // Video duration in seconds
}


export interface StoryContentData {
  storyInfo: StoryInfo;
  initialFileSystem: InitialFileSystemStructure; 
  deviceConfigurations?: Record<string, DeviceConfig>; 
  evidence: Record<string, Omit<EvidenceItem, 'discovered'>>;
  puzzles: Record<string, Omit<Puzzle, 'isSolved'>>;
  characters: Record<string, Omit<Character, 'dialogueState' | 'commandResponses' | 'initialCanBeContacted' | 'aiPersonalityPrompt'> &
    {
      initialTrustLevel?: number;
      dialogueState?: Record<string, DialogueEntry | string[]>;
      commandResponses?: CharacterCommandResponses;
      initialCanChatTerminal?: boolean; 
      initialCanBeContacted?: boolean;
      aiPersonalityPrompt?: string;
    }>;
  narrativeScript: Record<string, ShellMessage[]>;
  // fix: Removed 'quickSettingsState', 'callLog', 'smartphoneDynamicColorPalette' from Omit, allowing them to be overridden.
  initialPlayerStateOverrides?: Partial<Omit<PlayerStoryState, 
    'deviceFileSystems' | 
    'currentConnectedDeviceId' | 'deviceConnectionStack' | 
    'characterDynamicData' | 'username' | 'password' | 'currentStoryNumber' | 
    'smartphoneInstalledApps' | 'inboxThreads' | 'terminalChatThreads'
    // 'quickSettingsState' | 'callLog' | 'smartphoneDynamicColorPalette' // No longer Omit these, allow override
  >>;
  clearConditions: {
    completionType: "narrativeFlag" | "allPuzzlesSolved" | "ethicalScoreThreshold";
    flagName?: string;
    expectedValue?: any;
    valueMustContain?: string;
    ethicalScoreMin?: number;
    ethicalScoreMax?: number;
  }[];
  connectionSequence?: ShellMessage[];
  connectionPoints?: Record<string, ConnectionPointConfig>; 
  analysisInsights?: Record<string, AnalysisInsightConfig>;
  accusationRules?: AccusationRule[];
  defaultAccusationFailureNarrativeScriptKey?: string;
  systemMessages: SystemMessagesConfig;

  initialSmartphoneUIState: { 
    osVersion: string;
    wallpaperUrl?: string;
    defaultHomeScreenApps: string[];
    locked: boolean;
    passcode?: string; 
    securityQuestion?: { question: string; answer: string };
    installedApps: InitialAppDef[];
  };

  smartphoneContacts?: SmartphoneContactDef[];
  socialMediaProfiles?: Record<string, SocialMediaProfileDef[]>; // Key is platform (e.g., "friendnet", "chirp")
  emailAccounts?: EmailAccountDef[];
  photoAlbums?: PhotoAlbumDef[];
  browserBookmarks?: BrowserBookmarkDef[];
  initialWebContents?: Record<string, WebContentDef>; 
  calendarEvents?: CalendarEventDef[];
  notes?: NoteDef[];
  initialInboxMessages?: InboxMessage[];
  initialTerminalChatMessages?: TerminalChatMessage[];
  initialFriendNetPosts?: SocialPostDef[];
  initialChirpPosts?: ChirpPostDef[];
  initialSavedPlaces?: GeoMapperSavedPlaceDef[];
  initialSearchHistory?: GeoMapperSearchHistoryDef[];

  socialEngineeringScenarios?: any[];
  ethicalChoices?: any[];
  timeLimitEventDefinitions?: any[];
  malwareDefinitions?: any[];
}

export interface GameData extends StoryContentData {
  commandDefinitions: Record<string, CommandDefinition>;
}

export interface CommandDefinition {
  name: string;
  description: string;
  syntax: string;
  handler: (parsedCommand: ParsedCommand, playerStoryState: PlayerStoryState, gameData: GameData) => Promise<{ outputMessages: ShellMessage[], newPlayerStoryState: PlayerStoryState, anOutputDelay?: number }>;
  requiredStage?: string;
  requiredNarrativeFlags?: Record<string, any>;
  allowedDeviceContexts?: string[]; 
}

// Define IconProps for components/icons/* to ensure they can accept className
export interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

export interface QuickSettingTile {
  id: string;
  label: string;
  icon: React.ReactElement<IconProps>; // Use the global IconProps for icons
  isActive?: boolean; 
  action?: () => void; 
}
