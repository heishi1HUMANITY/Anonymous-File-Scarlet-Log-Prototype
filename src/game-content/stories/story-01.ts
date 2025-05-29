
import { StoryContentData, FileSystemNodeType, ShellMessage, CharacterCommandResponses, SystemMessagesConfig, DialogueEntry, InitialAppDef, SmartphoneContactDef, SocialMediaProfileDef, EmailAccountDef, PhotoAlbumDef, PhotoDef, WebContentDef, DeviceConfig, InitialFileSystemStructure, InboxMessage, BrowserBookmarkDef, CalendarEventDef, NoteDef, GeoMapperSavedPlaceDef, GeoMapperSearchHistoryDef, ChirpPostDef, SocialPostDef } from '../../../types';
import { PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID } from '../../constants';

const story01WelcomeConnectionSequence: ShellMessage[] = [
  { id: 's1_conn_01', type: 'system', text: 'Initializing connection to Secure Node ALPHA...' },
  { id: 's1_conn_02', type: 'progress', text: '.......... 25%' },
  { id: 's1_conn_03', type: 'system', text: 'Authenticating credentials for "Operator Anonymous"...' },
  { id: 's1_conn_04', type: 'progress', text: '.................... 75%' },
  { id: 's1_conn_05', type: 'system', text: 'Authentication successful. Welcome, Operator.' },
  { id: 's1_conn_06', type: 'progress', text: '.............................. 100% Complete.' },
  { id: 's1_conn_07', type: 'system', text: 'Secure channel established. Loading mission parameters for "The Scarlet Log"...' },
];

const adminAlexCommandResponses: CharacterCommandResponses = {
  submitEvidence: {
    "E003_SecretZipDecrypted": {
      responseText: "This is... highly sensitive. Luna's own logs. Thank you for bringing this to me. This changes everything.",
      trustChange: 30,
    },
    "E004_RivalEmailAccess": {
      responseText: "Access to RivalStreamerX's emails? That's quite the breakthrough. This confirms my suspicions.",
      trustChange: 20,
    }
  },
  defaultSubmitEvidence: {
    responseText: "Interesting evidence ('{EVIDENCE_TITLE}'). I'll take it under advisement.",
    trustChange: 10,
  }
};

const story01SystemMessages: SystemMessagesConfig = {
  command_usage: "使用法: {COMMAND_SYNTAX}",
  error_command_usage: "使用法: {COMMAND_SYNTAX}",
  error_file_not_found: "エラー: ファイル '{FILE_NAME}' が見つかりません。",
  error_not_a_directory: "エラー: '{PATH_NAME}' はディレクトリではありません。",
  error_path_not_found: "エラー: パス '{PATH_NAME}' が見つかりません。",
  error_is_a_directory: "エラー: '{PATH_NAME}' はファイルではなくディレクトリです。",
  error_encrypted: "エラー: ファイル '{FILE_NAME}' は暗号化されています。`decrypt`コマンドを使用してください。",
  error_invalid_password: "エラー: 不正なパスワードです。",
  info_decryption_success: "ファイル '{FILE_NAME}' は正常に解読されました。",
  info_file_not_encrypted: "ファイル '{FILE_NAME}' は暗号化されていません。",
  error_unknown_command: "不明なコマンド: {COMMAND_NAME}。「help」と入力して利用可能なコマンドを表示してください。",
  info_analysis_notFound: "分析対象'{TARGET_NAME}'が見つからないか、分析できません。",
  info_new_evidence_added: "新しい証拠'{EVIDENCE_TITLE}'がData Repositoryに追加されました。",
  connect_failed_default: "{TARGET_HOST}への接続に失敗しました: ホスト不明または到達不能です。",
  reset_password_success: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに成功しました。",
  reset_password_failure: "アカウント '{ACCOUNT_NAME}' のパスワードリセットに失敗しました。情報が間違っています。",
  reset_password_target_not_found: "アカウント '{ACCOUNT_NAME}' が見つからないか、パスワードリセットの対象ではありません。",
  submit_evidence_char_not_found: "キャラクターID '{CHAR_ID}' が見つかりません。",
  submit_evidence_item_not_found: "証拠ID '{EVIDENCE_ID}' が見つからないか、まだ発見されていません。",
  submit_evidence_default_ack: "{CHAR_NAME} は証拠 '{EVIDENCE_TITLE}' を確認しました。",
  email_char_not_found_error: "メッセージ送信エラー: 対象キャラクターID '{CHAR_ID}' が見つかりません。",
  email_no_reply_default: "{CHAR_NAME} からの返信はありませんでした。",
  story_complete_message: "このストーリーは完了しました。「exit」でログアウトし、次のストーリーに進んでください。",
  investigation_ended_message: "捜査は終了しました。「help」コマンドで確認するか、「clear」または「exit」以外、これ以上のコマンドは受け付けられません。",
  runtime_error_command: "コマンド'{COMMAND_NAME}'の実行中にランタイムエラーが発生しました。",
  empty_directory: "(空のディレクトリ)",
  ai_thinking: "{CHAR_NAME} is thinking...",
  ai_error: "{CHAR_NAME} is currently unable to process your request. Please try again later.",

  smartphone_locked_message: "CellOSデバイスはロックされています。",
  smartphone_incorrect_passcode: "パスコードが違います。",
  smartphone_app_not_installed: "アプリ '{APP_NAME}' はインストールされていません。",
  smartphone_notification_new_message: "{SENDER_NAME}: {MESSAGE_SNIPPET}",
  crack_device_target_invalid: "ターゲットデバイス '{TARGET_ID}'（ホスト名） は無効か、クラックできません。",
  crack_device_already_unlocked: "デバイスは既にアンロックされています。 `exit` で元のターミナルに戻り、再度 `crack_device` を実行してシェルに接続できます。",
  crack_device_success_passcode_found: "{DEVICE_NAME} のパスコード '{PASSCODE}' を発見しました。デバイスをアンロックしました。",
  device_connection_established: "{DEVICE_HOSTNAME} ({DEVICE_USERNAME}) への接続を確立しました。",
  device_disconnected: "{DEVICE_HOSTNAME} から切断されました。",
  command_not_available_on_device: "コマンド '{COMMAND_NAME}' は現在のデバイス ({DEVICE_HOSTNAME}) では利用できません。",
};

const adminAlexDialogue: Record<string, DialogueEntry | string[]> = {
    "hello": { responses: [{text: "System Administrator Alex here. How can I assist your investigation?", trustChange: 5}] },
    "Luna_Live": { responses: ["Luna? She's a talented streamer. Her disappearance is highly concerning. What do you know?"] },
    "RivalStreamerX": { responses: ["RivalStreamerX? They had a... competitive relationship with Luna. Do you have specific information?"] },
    "Luna_memo": {
      responses: [{text: "Luna's memo? That's sensitive. How did you... If you have it, it might contain vital information. What did you find?", trustChange: 10}],
      requiredTrustMin: 0
    },
    "secret.zip": {
      responses: [{text: "The encrypted zip? If you manage to decrypt it, its contents could be very important.", trustChange: 10}],
      requiredTrustMin: 0 
    },
    "default": { responses: [{text: "I'm not sure I follow. Can you be more specific?", trustChange: -2}, {text: "I need more context to help with that.", trustChange: -1}, "Accessing that information requires higher clearance or a more specific query."] }
};

const initialSmartphoneApps: InitialAppDef[] = [
    { id: "contactsphere", appName: "ContactSphere", isSystemApp: true, iconChar: "👤", initialData: {} },
    { id: "whispertalk", appName: "WhisperTalk", isSystemApp: true, iconChar: "💬", initialData: {} },
    { id: "snapvault", appName: "SnapVault", isSystemApp: true, iconChar: "🖼️", initialData: {} },
    { id: "mailwise", appName: "MailWise", isSystemApp: false, iconChar: "📧", initialData: {} , isEnabled: true, hasAccess: true},
    { id: "friendnet", appName: "FriendNet", isSystemApp: false, iconChar: "🌐", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "chirp", appName: "Chirp", isSystemApp: false, iconChar: "🐦", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "webstalker", appName: "WebStalker", isSystemApp: true, iconChar: "🔍", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "geomapper", appName: "GeoMapper", isSystemApp: true, iconChar: "🗺️", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "chronos", appName: "Chronos", isSystemApp: true, iconChar: "📅", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "ideapad", appName: "IdeaPad", isSystemApp: true, iconChar: "📝", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "fileexplorer_sm", appName: "FileExplorer", isSystemApp: true, iconChar: "📁", initialData: {}, isEnabled: true, hasAccess: true },
    { id: "settings_app", appName: "Settings", isSystemApp: true, iconChar: "⚙️", initialData: {}, isEnabled: true, hasAccess: true },
];

const initialContacts: SmartphoneContactDef[] = [
    { id: "contact_alex", name: "AdminAlex", characterId: "AdminAlex", phoneNumbers: [{label: "Work", number: "555-0101"}], emailAddresses: [{label: "Work", address: "admin.alex@anonymous.net"}], profilePictureUrl: "/assets/avatars/alex.png" },
    { id: "contact_luna", name: "Luna_Live", characterId: "Luna_Live", phoneNumbers: [{label: "Mobile", number: "555-0123"}], emailAddresses: [{label: "Personal", address: "luna.live.stream@example.com"}], profilePictureUrl: "/assets/avatars/luna.png"},
    { id: "contact_rival", name: "RivalStreamerX", characterId: "RivalStreamerX", phoneNumbers: [{label: "Unknown", number: "555-0199"}], emailAddresses: [{label: "Business", address: "rival.streamer.x@example.com"}], profilePictureUrl: "/assets/avatars/rival.png"},
];

const initialPhotoAlbums: PhotoAlbumDef[] = [
    { 
        albumId: "album_kittens", 
        albumName: "Kitten Pics!", 
        coverPhotoId: "photo_comet1",
        photos: [
            { 
              photoId: "photo_comet1", 
              filename: "comet_playing.jpg", 
              url: "/assets/photos/comet_kitten.jpg", 
              timestamp: "2024-07-25T18:25:00Z", 
              caption: "Little rascal!", 
              location: { name: "Luna's Apartment", lat: 34.0522, lon: -118.2437 },
              metadata: { device: "CellOS PixelSnap 12", resolution: "4032x3024", size: "3.1MB", aperture: "f/1.8", iso: "100", exposure: "1/60s" }
            },
            { 
              photoId: "photo_comet2", 
              filename: "comet_sleeping.jpg", 
              url: "/assets/photos/comet_sleep.jpg", 
              timestamp: "2024-07-24T22:10:00Z", 
              caption: "Sleepy kitty...",
              metadata: { device: "CellOS PixelSnap 12", resolution: "3024x4032", size: "2.8MB", aperture: "f/1.8", iso: "400", exposure: "1/30s (Night Mode)" }
            },
        ]
    },
    {
        albumId: "album_stream_setup",
        albumName: "Stream Setup",
        coverPhotoId: "photo_setup1",
        photos: [
            { 
              photoId: "photo_setup1", 
              filename: "my_new_mic.jpg", 
              url: "/assets/photos/stream_setup.jpg", 
              timestamp: "2024-07-20T15:00:00Z", 
              caption: "New streaming mic! So crisp!",
              location: { name: "Luna's Apartment - Stream Room", lat: 34.0523, lon: -118.2438 },
              metadata: { device: "DSLR AlphaStream Pro", resolution: "6000x4000", size: "8.2MB", lens: "50mm f/1.4", iso: "200" }
            },
            {
              photoId: "video_stream_test1",
              filename: "stream_test_001.mp4",
              url: "/assets/photos/stream_setup.jpg", // Use a static image as poster
              isVideo: true,
              videoUrl: "/assets/videos/placeholder_video.mp4", // Placeholder, actual video file not needed for this task
              timestamp: "2024-07-21T10:30:00Z",
              caption: "Quick stream test recording. Audio sounds good!",
              duration: 45, // seconds
              metadata: { device: "StreamRec Pro", resolution: "1920x1080", format: "MP4", framerate: "30fps"}
            }
        ]
    },
    {
        albumId: "album_misc",
        albumName: "Miscellaneous",
        coverPhotoId: "photo_food",
        photos: [
             { 
               photoId: "photo_food", 
               filename: "tasty_ramen.jpg", 
               url: "/assets/photos/ramen.jpg", 
               timestamp: "2024-07-15T19:30:00Z", 
               caption: "Best ramen in town!",
               location: { name: "Ramen Ichiraku", lat: 34.0550, lon: -118.2450 },
               metadata: { device: "CellOS PixelSnap 12", resolution: "4032x3024", size: "3.5MB", mode: "FoodieCam" }
            }
        ]
    }
];

const initialBrowserBookmarks: BrowserBookmarkDef[] = [
    { id: "bm1", title: "GameDev News Hub", url: "game://gamedev.news", timestamp: "2024-07-20T10:00:00Z" },
    { id: "bm2", title: "Luna's Official Stream Page", url: "game://streamplatform.tv/luna_live", timestamp: "2024-07-21T11:00:00Z" },
];

const initialWebContents: Record<string, WebContentDef> = {
    "game://gamedev.news": {
        url: "game://gamedev.news",
        title: "GameDev News Hub - Latest Updates",
        htmlContent: "<body><h1>Latest in Game Development</h1><p>Today's top story: Indie studio 'PixelPioneers' announces new retro RPG...</p></body>",
        initialBrowserHistory: [{id: "hist1", title: "GameDev News Hub - Latest Updates", url: "game://gamedev.news", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }]
    },
    "game://streamplatform.tv/luna_live": {
        url: "game://streamplatform.tv/luna_live",
        title: "Luna_Live - Official Stream Page",
        htmlContent: "<body><h1>Welcome to Luna_Live's Channel!</h1><p>Next stream: Charity Event - Friday at 8 PM!</p><p>Status: OFFLINE</p></body>",
        initialBrowserHistory: [{id: "hist2", title: "Luna_Live - Official Stream Page", url: "game://streamplatform.tv/luna_live", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() }]
    },
    "game://news.example/article/luna-missing": {
        url: "game://news.example/article/luna-missing",
        title: "Streamer Luna_Live Reported Missing - News Portal",
        htmlContent: "<body><h1>Popular Streamer Luna_Live Vanishes</h1><p>Concerns grow as streamer Luna_Live failed to appear for her scheduled charity event...</p></body>",
        initialBrowserHistory: [{id: "hist3", title: "Streamer Luna_Live Reported Missing - News Portal", url: "game://news.example/article/luna-missing", timestamp: new Date(Date.now() - 3600000).toISOString() }]
    }
};

const initialCalendarEvents: CalendarEventDef[] = [
    { eventId: "event1", title: "Charity Stream PREP", startTime: "2024-07-28T10:00:00Z", endTime: "2024-07-28T12:00:00Z", description: "Final checks for the big stream!"},
    { eventId: "event2", title: "Charity Stream LIVE!", startTime: "2024-07-28T14:00:00Z", endTime: "2024-07-28T18:00:00Z", location: "Online - StreamPlatform", description: "Main event. Don't be late!"},
    { eventId: "event3", title: "Meeting with Alex", startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), description: "Discuss security concerns.", location: "Admin Office (Virtual)"}
];

const initialNotes: NoteDef[] = [
    { noteId: "note1", title: "Stream Ideas", content: "- New game playthrough: 'CyberWanderer'\n- Q&A session\n- Maybe a Comet cameo?", createdTimestamp: "2024-07-20T10:00:00Z", modifiedTimestamp: "2024-07-21T11:00:00Z"},
    { noteId: "note2", title: "Passwords (DO NOT USE)", content: "Old passwords, need to delete:\nGameSite: LunaOldPass123\nEmail: StreamingQueen! (changed)\nDO NOT USE THESE ANYWHERE.", createdTimestamp: "2024-07-15T12:00:00Z", modifiedTimestamp: "2024-07-15T12:05:00Z"},
    { noteId: "note3", content: "Grocery List:\n- Milk\n- Cat food (Comet's favorite)\n- Coffee", createdTimestamp: "2024-07-27T09:00:00Z", modifiedTimestamp: "2024-07-27T09:00:00Z"},
];

const initialSavedPlaces: GeoMapperSavedPlaceDef[] = [
    { placeId: "place1", name: "Home (Luna's Apartment)", latitude: 34.0522, longitude: -118.2437, address: "123 Main St, Los Angeles" },
    { placeId: "place2", name: "Favorite Ramen Shop", latitude: 34.0550, longitude: -118.2450, address: "456 Noodle Ave, Los Angeles" },
];
const initialSearchHistory: GeoMapperSearchHistoryDef[] = [
    { query: "Best coffee near me", timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
    { query: "Luna's Apartment", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
];

const initialFriendNetPosts: SocialPostDef[] = [
    {postId: "luna_post1", authorCharacterId: "Luna_Live", authorUserId: "lunathebeststreamer", timestamp: "2024-07-27T10:00:00Z", content: "So excited for tomorrow's charity stream! Hope to see you all there! #charity #gaming", likesCount: 152},
    {postId: "luna_post2", authorCharacterId: "Luna_Live", authorUserId: "lunathebeststreamer", timestamp: "2024-07-25T18:30:00Z", content: "My new kitten Comet is SO CUTE but also a little monster lol 😻", imageUrl: "/assets/photos/comet_kitten.jpg", likesCount: 340, comments: [
        {commentId: "c1", postId: "luna_post2", authorUserId: "rivalXrules", text: "Cute cat. Still won't beat my sub count.", timestamp: "2024-07-25T19:00:00Z" }
    ]},
    {postId: "rival_post1", authorCharacterId: "RivalStreamerX", authorUserId: "rivalXrules", timestamp: "2024-07-27T12:00:00Z", content: "Some people just can't handle the competition. 😉", likesCount: 78},
];

const initialChirpPosts: ChirpPostDef[] = [
    {chirpId: "luna_chirp1", authorCharacterId: "Luna_Live", timestamp: "2024-07-27T10:05:00Z", textContent: "Charity stream hype! Can't wait to see you all there for a good cause! #LunaForCharity #GamingCommunity", reChirpCount: 25},
    {chirpId: "rival_chirp1", authorCharacterId: "RivalStreamerX", timestamp: "2024-07-27T12:10:00Z", textContent: "Heard someone's trying to play hero. Only one top streamer around here. #RivalXRulz", reChirpCount: 10},
];


const playerMainNodeFileSystem: InitialFileSystemStructure = {
  "/": {
      type: FileSystemNodeType.DIRECTORY,
      name: "/",
      children: {
        "docs": {
          type: FileSystemNodeType.DIRECTORY,
          name: "docs",
          children: {
            "mission_brief.txt": { name: "mission_brief.txt", content: "Mission: Investigate the disappearance of streamer Luna_Live.\nPrimary target device: Luna's smartphone (Hostname: Luna-CellOS). To gain access to its shell, use the command `crack_device Luna-CellOS`.\nSecondary system access: AdminAlex's node (current).\nGather evidence, analyze data, report findings." }
          }
        },
        "tools": {
          type: FileSystemNodeType.DIRECTORY,
          name: "tools",
          children: {
            "network_scanner.sh": { name: "network_scanner.sh", content: "#!/bin/bash\necho 'Scanning local network... (Placeholder for nmap_scan functionality)'" }
          }
        },
        "evidence_cache": { 
            type: FileSystemNodeType.DIRECTORY,
            name: "evidence_cache",
            children: {}
        }
      }
    }
};

const lunaPhoneShellFileSystem: InitialFileSystemStructure = {
  "/": {
    type: FileSystemNodeType.DIRECTORY,
    name: "/",
    children: {
      "DCIM": {
        type: FileSystemNodeType.DIRECTORY,
        name: "DCIM",
        children: {
          "Camera": {
            type: FileSystemNodeType.DIRECTORY,
            name: "Camera",
            children: {
              "IMG_20240725_182500.jpg": { name: "IMG_20240725_182500.jpg", content: "[Raw image data for comet_kitten.jpg]", fileType: "image/jpeg", analysisResult: "EXIF data: Luna-CellOS Camera, 2024-07-25 18:25:00. Seems to be a picture of a kitten named Comet. This image is linked to evidence E005_CometPhoto."},
            }
          }
        }
      },
      "Downloads": {
        type: FileSystemNodeType.DIRECTORY,
        name: "Downloads",
        children: {
          "secret_archive_backup.zip": {
            name: "secret_archive_backup.zip",
            content: "This is an encrypted archive.",
            isEncrypted: true,
            password: "Comet", 
            decryptedContent: "Decrypted content of secret.zip:\n\nEvidence Log - Luna\n\nGetting threatening DMs from RivalStreamerX. Have copies.\nThey're trying to sabotage my upcoming charity stream.\nSuspect they might try to access my accounts.\nMy main email: luna.live.stream@example.com, Rival's: rival.streamer.x@example.com.\n\nIf anything happens, tell AdminAlex to check his DMs. Sent proof there.\nThis zip is my backup evidence.",
            canAnalyze: false,
            fileType: "application/zip"
          }
        }
      },
      "Documents": {
        type: FileSystemNodeType.DIRECTORY,
        name: "Documents",
        children: {
           "final_stream_notes.txt": { name: "final_stream_notes.txt", content: "Final notes for charity stream:\n- Thank sponsors\n- Game list: ...\n- Shoutout to Comet the kitten!\n- RivalX is being super weird lately, need to talk to Alex.", canAnalyze: true, analysisResult: "Notes for Luna's stream. Mentions kitten 'Comet' and concerns about RivalStreamerX."}
        }
      },
       "system": {
        type: FileSystemNodeType.DIRECTORY,
        name: "system",
        children: {
            "contacts.db": {name: "contacts.db", content: "[Simulated contacts database entries for Luna's phone]", fileType: "database"},
            "messages.log": {name: "messages.log", content: "[Simulated message logs for Luna's phone]", fileType: "log"}
        }
      }
    }
  }
};

const story01DeviceConfigurations: Record<string, DeviceConfig> = {
    [PLAYER_MAIN_NODE_ID]: { 
        promptUsername: "{PLAYER_USERNAME}", 
        promptHostname: "anonymous-node",
        initialFileSystem: playerMainNodeFileSystem, 
        connectionMessage: "Connected to player's main node.",
    },
    [LUNAS_PHONE_SHELL_ID]: { 
        promptUsername: "Luna_Live",
        promptHostname: "Luna-CellOS",
        initialFileSystem: lunaPhoneShellFileSystem, 
        connectionMessage: "Shell access to Luna-CellOS established.",
        disconnectionMessage: "Disconnected from Luna-CellOS shell."
    }
};

const initialInboxMessages: InboxMessage[] = [ 
    { id: "msg1_alex_to_player_sp", threadId: "thread_sp_AdminAlex", senderId: "AdminAlex", recipientId: "player", body: "Hey Operator, this is Alex. If you're seeing this on Luna's phone, good job on cracking it. Let me know what you find.", timestamp: new Date(Date.now() - 300000).toISOString(), type: 'received', isRead: false},
    { id: "msg2_luna_to_alex_draft_sp", threadId: "thread_sp_AdminAlex", senderId: "Luna_Live", recipientId: "AdminAlex", body: "Alex, I think RivalStreamerX is up to something. They've been sending weird messages... I'm scared. (This message seems to be an unsent draft from Luna, found on her phone.)", timestamp: new Date(Date.now() - 250000).toISOString(), type: 'received', isRead: false}, // Simulating player finding this as if it's to them
    { id: "msg3_rival_to_luna_sp", threadId: "thread_sp_RivalStreamerX", senderId: "RivalStreamerX", recipientId: "player", body: "You think you're so clever, Luna? Your little charity stunt won't save you. Watch your back.", timestamp: new Date(Date.now() - 400000).toISOString(), type: 'received', isRead: false},
    { id: "msg4_player_reply_draft_sp", threadId: "thread_sp_RivalStreamerX", senderId: "player", recipientId: "RivalStreamerX", body: "What do you mean by that?", timestamp: new Date(Date.now() - 390000).toISOString(), type: 'sent', isRead: true} // Simulating a sent message from player
  ];


export const story01Content: StoryContentData = {
  storyInfo: {
    storyNumber: 1,
    title: "Scarlet Log",
    description: "Investigate the disappearance of streamer Luna_Live using terminal and smartphone forensics.",
    nextStoryNumber: null,
    smartphoneDeviceTargetId: LUNAS_PHONE_SHELL_ID, 
    playerDefaultDeviceConfig: { 
        promptUsername: "{PLAYER_USERNAME}", 
        promptHostname: "anonymous-node"
    }
  },
  connectionSequence: story01WelcomeConnectionSequence,
  initialFileSystem: playerMainNodeFileSystem, 
  deviceConfigurations: story01DeviceConfigurations, 

  evidence: {
    "E001_LunaMemo": { 
      id: "E001_LunaMemo", title: "Luna_memo.log (from AdminAlex node)",
      content: "Personal Memo - Luna\nTo self: Feeling pressure from RivalStreamerX...",
      type: "log_entry", source: `admin_alex_node:/logs/Luna_memo.log` 
    },
    "E001_LunaPhoneNotes": {
      id: "E001_LunaPhoneNotes", title: "Luna's Stream Notes (from Phone)",
      content: "Final notes for charity stream:\n- Thank sponsors\n- Game list: ...\n- Shoutout to Comet the kitten!\n- RivalX is being super weird lately, need to talk to Alex.",
      type: "text", source: `${LUNAS_PHONE_SHELL_ID}:/Documents/final_stream_notes.txt`
    },
    "E002_SystemLog": { 
      id: "E002_SystemLog", title: "system.log (from AdminAlex node)",
      content: "2024-07-28 10:00:00 SYS: System boot initiated.\n...",
      type: "log_entry", source: `admin_alex_node:/logs/system.log` 
    },
    "E003_SecretZipDecrypted": {
      id: "E003_SecretZipDecrypted", title: "Decrypted Content (secret_archive_backup.zip)",
      content: "Decrypted content of secret.zip:\n\nEvidence Log - Luna\n\nGetting threatening DMs from RivalStreamerX...",
      type: "text", source: `${LUNAS_PHONE_SHELL_ID}:/Downloads/secret_archive_backup.zip`
    },
    "E004_RivalEmailAccess": {
      id: "E004_RivalEmailAccess", title: "Rival Streamer Email Access Granted",
      content: "Access to rival_email@example.com granted. DMs discussing sabotage plans against Luna_Live found.",
      type: "text" 
    },
    "E005_CometPhoto": {
      id: "E005_CometPhoto", title: "Photo of Comet the Kitten",
      content: "A photo of a small kitten, presumably named Comet. Found on Luna's phone.",
      type: "image", source: `${LUNAS_PHONE_SHELL_ID}:/DCIM/Camera/IMG_20240725_182500.jpg`,
      metadata: { filename: "IMG_20240725_182500.jpg", url: "/assets/photos/comet_kitten.jpg" }
    }
  },
  puzzles: {
    "P001_DecryptSecretZip": {
      id: "P001_DecryptSecretZip", description: "Decrypt secret_archive_backup.zip on Luna's phone", puzzleType: 'decryption',
      targetFilePath: "/Downloads/secret_archive_backup.zip", 
      targetDeviceIdentifier: LUNAS_PHONE_SHELL_ID, 
      correctPassword: "Comet", 
      relatedEvidenceIds: ["E001_LunaPhoneNotes", "E005_CometPhoto"], 
      unlocksEvidenceOnSuccess: ["E003_SecretZipDecrypted"],
      narrativeScriptKeySuccess: "puzzle_P001_decrypted"
    },
    "P002_SocialEngineerRival": { 
      id: "P002_SocialEngineerRival", description: "Reset password for rival_email", puzzleType: 'passwordReset',
      targetAccount: "rival_email",
      securityQuestionAnswerPairs: [ { questionHint: "Favorite childhood place", answers: ["oldoaktree", "オールドオークツリー"] } ],
      relatedEvidenceIds: [], 
      unlocksEvidenceOnSuccess: ["E004_RivalEmailAccess"],
      narrativeScriptKeySuccess: "puzzle_P002_access_granted",
    },
    "P003_CrackLunasPhone": {
      id: "P003_CrackLunasPhone",
      description: "Gain shell access to Luna's smartphone.",
      puzzleType: 'smartphoneCrack',
      targetDeviceIdentifier: LUNAS_PHONE_SHELL_ID,
      revealedPasscode: "1234",
      narrativeScriptKeySuccess: "puzzle_P003_phone_cracked"
    }
  },
  characters: {
    "AdminAlex": {
      id: "AdminAlex", name: "AdminAlex", initialTrustLevel: 50,
      minReadDelayMs: 400, maxReadDelayMs: 6000, readDelayJitterMs: 800,
      minReplyDelayMs: 1200, maxReplyDelayMs: 20000, replyDelayJitterMs: 1500,
      dialogueState: adminAlexDialogue, commandResponses: adminAlexCommandResponses,
      aiPersonalityPrompt: "You are AdminAlex, a helpful but professional and slightly formal system administrator in a cyber mystery game. The player is an investigator. Respond concisely and in character to their messages.",
      smartphoneContactId: "contact_alex", 
      emailAddresses: ["admin.alex@anonymous.net"],
      initialCanChatTerminal: true, 
      initialCanBeContacted: true,
    },
    "MysteriousInformant": {
      id: "MysteriousInformant", name: "Mysterious Informant", initialTrustLevel: 100, 
      minReadDelayMs: 100, maxReadDelayMs: 500, readDelayJitterMs: 50,
      minReplyDelayMs: 200, maxReplyDelayMs: 1000, replyDelayJitterMs: 100,
      aiPersonalityPrompt: "You are Mysterious Informant, a secretive and enigmatic character in a cyber mystery game. Your responses are short, cryptic, and hint at deeper knowledge. Do not reveal much. If the player asks for specifics you don't have, be evasive or turn the question back on them.",
      dialogueState: {
         "default": { responses: ["Silence is golden.", "The answers you seek are hidden in plain sight.", "Some doors are best left unopened... or are they?"] }
      },
      initialCanChatTerminal: true, 
      initialCanBeContacted: true, 
    },
    "Luna_Live": { 
        id: "Luna_Live", name: "Luna_Live", initialTrustLevel: 70,
        aiPersonalityPrompt: "You are Luna_Live, a friendly and popular streamer who has gone missing. If somehow the player messages you, express confusion, fear, and a desperate hope for help. You don't know where you are or what's happening, but you know RivalStreamerX is involved.",
        smartphoneContactId: "contact_luna",
        emailAddresses: ["luna.live.stream@example.com"],
        socialMediaUserIds: {"friendnet": "lunathebeststreamer", "chirp": "LunaLiveGaming"},
        initialCanChatTerminal: false, 
        initialCanBeContacted: true, 
    },
    "RivalStreamerX": {
        id: "RivalStreamerX", name: "RivalStreamerX", initialTrustLevel: 20,
        aiPersonalityPrompt: "You are RivalStreamerX, an arrogant and competitive streamer, suspected in a disappearance. Respond defensively, boastfully, or dismissively. You see Luna_Live as a lesser competitor. Deny any wrongdoing with an air of superiority.",
        smartphoneContactId: "contact_rival",
        emailAddresses: ["rival.streamer.x@example.com"],
        socialMediaUserIds: {"friendnet": "rivalXrules", "chirp": "TheRealRivalX"},
        initialCanChatTerminal: false,
        initialCanBeContacted: true, 
    }
  },
  narrativeScript: {
    "welcome": [
      { id: "ns_welcome_s1_2", type: "system", text: "Simulated file system access granted." },
      { id: "ns_welcome_s1_3", type: "system", text: "Type `cat /docs/mission_brief.txt` to begin." }
    ],
    "puzzle_P001_decrypted": [ { id: "p001s_1_story1", type: "system", text: "Decryption successful! New evidence 'E003_SecretZipDecrypted' added to Data Repository." } ],
    "puzzle_P002_access_granted": [ { id: "p002s_1_story1", type: "system", text: "Password reset for rival_email@example.com successful. Access granted. New evidence 'E004_RivalEmailAccess' added to Data Repository." } ],
    "puzzle_P003_phone_cracked": [ { id: "p003s_1_story1", type: "system", text: "Luna's phone security bypassed. Shell access granted." } ],
    "final_choice_rival_success": [ {id: "fcrs1", type: "system", text: "Your accusation against RivalStreamerX, backed by solid evidence, leads to their detainment. Case closed... for now." } ],
    "final_choice_insufficient": [ {id: "fci1", type: "system", text: "Your accusation lacks the definitive proof needed. The case remains open, and the shadows lengthen."} ],
    "story_completed_success": [ {id: "scs1", type: "system", text: "Investigation concluded successfully."} ],
    "story_completed_end": [ {id: "sce1", type: "system", text: "You may now `exit` the system."} ]
  },
  initialPlayerStateOverrides: {
    gameStage: "introduction",
    narrativeFlags: { intro_complete: false, final_choice_made: "" },
    discoveredEvidenceIds: [],
    solvedPuzzleIds: [],
    playerEthicalScore: 0,
  },
  clearConditions: [{
    completionType: "narrativeFlag",
    flagName: "story_completed_successfully",
    expectedValue: true
  }],
  connectionPoints: { 
    "adminalex_system_obsolete": { successResponseText: "Connecting to AdminAlex_system...\nConnection established.", setNarrativeFlags: { "contacted_admin_alex_system": true } }
  },
  analysisInsights: {
      [`${LUNAS_PHONE_SHELL_ID}:/DCIM/Camera/IMG_20240725_182500.jpg`]: { 
          appendText: "The kitten in the photo is named Comet. This might be useful information.",
          unlocksEvidenceIds: ["E005_CometPhoto"]
      }
  },
  accusationRules: [
    { accusedEntityKeywords: ["rivalstreamerx", "rival streamer x"], requiredEvidenceIds: ["E003_SecretZipDecrypted", "E004_RivalEmailAccess"], isCorrectEnding: true, narrativeScriptKeySuccess: "final_choice_rival_success" }
  ],
  defaultAccusationFailureNarrativeScriptKey: "final_choice_insufficient",
  systemMessages: story01SystemMessages,

  initialSmartphoneUIState: { 
    osVersion: "CellOS 1.0",
    // wallpaperUrl: "/assets/wallpapers/default.jpg", // Default theme
    wallpaperUrl: "/assets/wallpapers/wallpaper_blue.jpg", // Blue theme
    // wallpaperUrl: "/assets/wallpapers/wallpaper_green.jpg", // Green theme
    defaultHomeScreenApps: ["contactsphere", "whispertalk", "snapvault", "mailwise", "friendnet", "chirp", "webstalker", "chronos", "ideapad", "geomapper", "fileexplorer_sm", "settings_app"],
    locked: true, 
    passcode: "1234", 
    installedApps: initialSmartphoneApps,
  },
  smartphoneContacts: initialContacts,
  socialMediaProfiles: {
    "friendnet": [
        { userId: "lunathebeststreamer", username: "Luna_Live", characterId: "Luna_Live", profilePictureUrl: "/assets/avatars/luna.png", bio: "Just a streamer trying to make the world brighter! ✨ Charity streams every Friday!", posts: [], initialFollowers: ["rivalXrules"], initialFollowing: [] },
        { userId: "rivalXrules", username: "RivalStreamerX", characterId: "RivalStreamerX", profilePictureUrl: "/assets/avatars/rival.png", bio: "Top tier streamer. No contest. Get on my level.", posts: [], initialFollowers: [], initialFollowing: ["lunathebeststreamer"] }
    ],
    "chirp": [
        { userId: "LunaLiveGaming", username: "@LunaLiveGaming", characterId: "Luna_Live", profilePictureUrl: "/assets/avatars/luna.png", bio: "Official Chirp for Luna_Live! ✨ Spreading positivity and good vibes!", posts: [], initialFollowers: ["TheRealRivalX"], initialFollowing: [] },
        { userId: "TheRealRivalX", username: "@TheRealRivalX", characterId: "RivalStreamerX", profilePictureUrl: "/assets/avatars/rival.png", bio: "Don't believe the haters. I'm the best. #1.", posts: [], initialFollowers: [], initialFollowing: ["LunaLiveGaming"] }
    ]
  },
  initialFriendNetPosts: initialFriendNetPosts,
  initialChirpPosts: initialChirpPosts,
  emailAccounts: [
    { accountId: "luna_main_email", emailAddress: "luna.live.stream@example.com", username: "Luna L.", characterId: "Luna_Live", folders: {
        "Inbox": [
            { emailId: "email1", folderPath: "Inbox", senderAddress: "admin.alex@anonymous.net", senderName: "AdminAlex", recipientAddresses: ["luna.live.stream@example.com"], subject: "Security check-in", body: "Hi Luna, just wanted to follow up on our security discussion. Let me know if you need anything.", timestamp: "2024-07-26T14:00:00Z", isRead: true},
            { emailId: "email2_rival_threat", folderPath: "Inbox", senderAddress: "rival.streamer.x@example.com", senderName: "RivalStreamerX", recipientAddresses: ["luna.live.stream@example.com"], subject: "Watch Out", body: "Heard you're planning something big. It'd be a shame if something... happened. Just a friendly warning.", timestamp: "2024-07-27T09:15:00Z", isRead: false}
        ],
        "Sent": [
             { emailId: "email3_luna_reply_to_alex", folderPath: "Sent", senderAddress: "luna.live.stream@example.com", senderName: "Luna L.", recipientAddresses: ["admin.alex@anonymous.net"], subject: "Re: Security check-in", body: "Thanks Alex. Yeah, Rival's been acting weird. I'm a bit worried. Might need your help soon.", timestamp: "2024-07-26T18:30:00Z", isRead: true}
        ],
        "Drafts": [
             { emailId: "email4_luna_draft_complaint", folderPath: "Drafts", senderAddress: "luna.live.stream@example.com", senderName: "Luna L.", recipientAddresses: ["support@streamplatform.tv"], subject: "Formal Complaint: RivalStreamerX Harassment", body: "To Whom It May Concern,\nI am writing to formally complain about the user RivalStreamerX. Their recent behavior includes veiled threats and attempts to sabotage my channel...\n(Unsent)", timestamp: "2024-07-27T20:00:00Z", isRead: false}
        ]
    }},
    { accountId: "rival_main_email", emailAddress: "rival.streamer.x@example.com", username: "Rival X", characterId: "RivalStreamerX", password: "password123", folders: { // Password for P002
        "Inbox": [
            { emailId: "email_rival_1", folderPath: "Inbox", senderAddress: "fanboy123@example.com", senderName: "FanBoy123", recipientAddresses: ["rival.streamer.x@example.com"], subject: "You're the BEST!", body: "Rival, you're so much better than Luna! Keep it up!", timestamp: "2024-07-25T10:00:00Z", isRead: true }
        ], 
        "Sent": [
             { emailId: "email_rival_2_sent", folderPath: "Sent", senderAddress: "rival.streamer.x@example.com", senderName: "Rival X", recipientAddresses: ["anonymous_contact@darkweb.anon"], subject: "The Luna Problem", body: "Need to make sure Luna's 'charity' stream doesn't overshadow my upcoming sponsorship announcement. Take care of it. Subtly.", timestamp: "2024-07-26T11:00:00Z", isRead: true }
        ]
    }}
  ],
  photoAlbums: initialPhotoAlbums,
  browserBookmarks: initialBrowserBookmarks,
  initialWebContents: initialWebContents,
  calendarEvents: initialCalendarEvents,
  notes: initialNotes,
  initialSavedPlaces: initialSavedPlaces,
  initialSearchHistory: initialSearchHistory,

  initialInboxMessages: initialInboxMessages,
  initialTerminalChatMessages: [
    {
      id: "initial_informant_msg_1", 
      timestamp: new Date(Date.now() - 100000).toISOString(), 
      senderId: "MysteriousInformant",
      senderName: "Mysterious Informant", 
      body: "The data is yours. Find the truth. Luna is counting on you.",
      type: "received",
      isReadByPlayer: false, 
    },
    {
      id: "initial_alex_term_msg_1",
      timestamp: new Date(Date.now() - 90000).toISOString(), 
      senderId: "AdminAlex",
      senderName: "AdminAlex",
      body: "Operator, I've enabled your terminal access. Let me know if you need assistance. Consider this an initial unread message.",
      type: "received",
      isReadByPlayer: false, 
    }
  ],

  socialEngineeringScenarios: [],
  ethicalChoices: [],
  timeLimitEventDefinitions: [],
  malwareDefinitions: [],
};
