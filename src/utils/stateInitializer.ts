// src/utils/stateInitializer.ts
import {
    PlayerStoryState, StoryContentData, FileSystemStructure, FileSystemNodeType,
    InitialFileSystemStructure, InitialDirectoryNode, InitialFileNode, InitialFileSystemItem,
    FileSystemItem, CharacterDynamicData, AppState, ConversationThread, TerminalChatThread, InitialAppDef,
    WhisperTalkAppData, SnapVaultAppData, ContactSphereAppData, PhotoAlbumDef, SmartphoneContactDef,
    FriendNetAppData, MailWiseAppData, ChirpAppData, SocialPostDef, ChirpPostDef, EmailAccountDef, SocialMediaProfileDef,
    WebStalkerAppData, ChronosAppData, IdeaPadAppData, GeoMapperAppData, FileExplorerAppData,
    BrowserBookmarkDef, BrowserHistoryItemDef, WebContentDef, CalendarEventDef, NoteDef, GeoMapperSavedPlaceDef, GeoMapperSearchHistoryDef,
    FriendNetProfileData, ChirpProfileData, QuickSettingsState, SmartphoneDynamicColorPalette
} from '../../types';
import { PLAYER_MAIN_NODE_ID, LUNAS_PHONE_SHELL_ID } from '../constants';
import { extractPaletteFromWallpaper, defaultPalette } from './themeUtils'; // Added import

export function processSingleInitialFSNode(initialFSNode: InitialFileSystemItem, name: string): FileSystemItem {
  if (initialFSNode.type === FileSystemNodeType.DIRECTORY || (initialFSNode.type === undefined && 'children' in initialFSNode)) {
    const dirNode = initialFSNode as InitialDirectoryNode;
    const children: Record<string, FileSystemItem> = {};
    if (dirNode.children) { 
        for (const childName in dirNode.children) {
            children[childName] = processSingleInitialFSNode(dirNode.children[childName], childName);
        }
    }
    return { 
        type: FileSystemNodeType.DIRECTORY, 
        name: name, 
        children: children, 
        permissions: dirNode.permissions, 
        owner: dirNode.owner, 
        group: dirNode.group, 
        lastModified: dirNode.lastModified 
    };
  } else {
    const fileNode = initialFSNode as InitialFileNode;
    return {
      type: FileSystemNodeType.FILE,
      name: name,
      content: fileNode.content,
      isEncrypted: fileNode.isEncrypted,
      password: fileNode.password,
      decryptedContent: fileNode.decryptedContent,
      canAnalyze: fileNode.canAnalyze,
      analysisResult: fileNode.analysisResult,
      permissions: fileNode.permissions,
      owner: fileNode.owner,
      group: fileNode.group,
      lastModified: fileNode.lastModified,
      fileType: fileNode.fileType
    };
  }
}

export function buildRuntimeFileSystem(initialStructure: InitialFileSystemStructure): FileSystemStructure {
    const runtimeFS: FileSystemStructure = {};
    for (const key in initialStructure) {
        if (key === '/') {
            const rootNode = initialStructure[key] as InitialDirectoryNode;
            const children: Record<string, FileSystemItem> = {};
            if (rootNode.children) {
              for (const childName in rootNode.children) {
                  children[childName] = processSingleInitialFSNode(rootNode.children[childName], childName);
              }
            }
            runtimeFS[key] = {
                type: FileSystemNodeType.DIRECTORY, 
                name: '/', 
                children: children, 
                permissions: rootNode.permissions, 
                owner: rootNode.owner, 
                group: rootNode.group, 
                lastModified: rootNode.lastModified
            };
        } else {
          console.warn("Unexpected top-level key in InitialFileSystemStructure during build:", key);
          runtimeFS[key] = processSingleInitialFSNode(initialStructure[key] as InitialFileSystemItem, key);
        }
    }
    if (!runtimeFS['/']) {
        runtimeFS['/'] = { type: FileSystemNodeType.DIRECTORY, name: '/', children: {} };
    }
    return runtimeFS;
}

export function initializePlayerStoryState(storyData: StoryContentData, username: string, password?: string): PlayerStoryState {
    const initialDeviceFileSystems: Record<string, FileSystemStructure> = {};
    initialDeviceFileSystems[PLAYER_MAIN_NODE_ID] = buildRuntimeFileSystem(storyData.initialFileSystem);

    if (storyData.deviceConfigurations) {
        for (const deviceId in storyData.deviceConfigurations) {
            const deviceConfig = storyData.deviceConfigurations[deviceId];
            if (deviceId !== PLAYER_MAIN_NODE_ID && deviceConfig.initialFileSystem) { 
                initialDeviceFileSystems[deviceId] = buildRuntimeFileSystem(deviceConfig.initialFileSystem);
            } else if (deviceId !== PLAYER_MAIN_NODE_ID && !deviceConfig.initialFileSystem) {
                 initialDeviceFileSystems[deviceId] = buildRuntimeFileSystem({ '/': { type: FileSystemNodeType.DIRECTORY, name: '/', children: {} } });
            }
        }
    }

    const initialCharacterDynamicData: Record<string, CharacterDynamicData> = {};
    Object.entries(storyData.characters).forEach(([charId, charTmpl]) => {
        initialCharacterDynamicData[charId] = { 
            trustLevel: charTmpl.initialTrustLevel !== undefined ? charTmpl.initialTrustLevel : 50,
            canChatTerminal: charTmpl.initialCanChatTerminal !== undefined ? charTmpl.initialCanChatTerminal : false,
            canBeContacted: charTmpl.initialCanBeContacted !== undefined ? charTmpl.initialCanBeContacted : false,
        };
    });
    
    const installedAppsFromStory = storyData.initialSmartphoneUIState?.installedApps ? 
                                  [...storyData.initialSmartphoneUIState.installedApps] : [];
    
    const systemAppsToEnsure = [
        { id: "settings_app", appName: "Settings", iconChar: "⚙️" },
        { id: "webstalker", appName: "WebStalker", iconChar: "🔍" },
        { id: "geomapper", appName: "GeoMapper", iconChar: "🗺️" },
        { id: "chronos", appName: "Chronos", iconChar: "📅" },
        { id: "ideapad", appName: "IdeaPad", iconChar: "📝" },
        { id: "fileexplorer_sm", appName: "FileExplorer", iconChar: "📁" },
    ];

    systemAppsToEnsure.forEach(sysApp => {
        if (!installedAppsFromStory.find(app => app.id === sysApp.id)) {
            installedAppsFromStory.push({
                id: sysApp.id,
                appName: sysApp.appName,
                isSystemApp: true,
                iconChar: sysApp.iconChar,
                initialData: {},
                isEnabled: true,
                hasAccess: true,
            });
        }
    });


    const initialSmartphoneApps: Record<string, AppState> = {};
    const smartphoneOwnerDeviceId = storyData.storyInfo.smartphoneDeviceTargetId;
    let deviceOwnerCharId: string | undefined = undefined;
    if (smartphoneOwnerDeviceId && storyData.deviceConfigurations?.[smartphoneOwnerDeviceId]) {
        const phoneOwnerUsername = storyData.deviceConfigurations[smartphoneOwnerDeviceId].promptUsername;
        deviceOwnerCharId = Object.values(storyData.characters).find(c => c.name === phoneOwnerUsername)?.id;
    }


    installedAppsFromStory.forEach(appDef => {
        let specificData: any = appDef.initialData || {};

        if (appDef.id === 'whispertalk') {
            specificData = {
                currentView: 'chat_list',
                selectedThreadId: undefined,
            } as WhisperTalkAppData;
        } else if (appDef.id === 'snapvault') {
            specificData = {
                albums: storyData.photoAlbums || [], 
                currentView: 'albums_tab',
                activeTab: 'albums',
                selectedAlbumId: undefined,
                selectedPhotoId: undefined,
            } as SnapVaultAppData;
        } else if (appDef.id === 'contactsphere') {
            specificData = {
                contacts: storyData.smartphoneContacts || [], 
                selectedContactId: undefined,
            } as ContactSphereAppData;
        } else if (appDef.id === 'friendnet') {
            const ownerProfileDef = storyData.socialMediaProfiles?.friendnet?.find(p => p.characterId === deviceOwnerCharId);
            const userProfileData: FriendNetProfileData = ownerProfileDef ? {
                characterId: ownerProfileDef.characterId || '',
                userId: ownerProfileDef.userId,
                username: ownerProfileDef.username,
                profilePictureUrl: ownerProfileDef.profilePictureUrl,
                bannerImageUrl: ownerProfileDef.bannerImageUrl,
                bio: ownerProfileDef.bio,
                followersCount: ownerProfileDef.initialFollowers?.length || 0,
                followingCount: ownerProfileDef.initialFollowing?.length || 0,
                posts: ownerProfileDef.posts || [],
            } : { characterId: deviceOwnerCharId || '', userId: 'defaultUser', username: 'User', followersCount: 0, followingCount: 0, posts:[] };
            
            specificData = {
                userProfile: userProfileData,
                feedPosts: storyData.initialFriendNetPosts || [],
                currentView: 'feed',
            } as FriendNetAppData;
        } else if (appDef.id === 'chirp') {
            const ownerChirpProfileDef = storyData.socialMediaProfiles?.chirp?.find(p => p.characterId === deviceOwnerCharId);
            const chirpProfileData: ChirpProfileData = ownerChirpProfileDef ? {
                characterId: ownerChirpProfileDef.characterId || '',
                userId: ownerChirpProfileDef.userId,
                username: ownerChirpProfileDef.username,
                displayName: storyData.characters[ownerChirpProfileDef.characterId || '']?.name || ownerChirpProfileDef.username,
                profilePictureUrl: ownerChirpProfileDef.profilePictureUrl,
                bio: ownerChirpProfileDef.bio,
                followersCount: ownerChirpProfileDef.initialFollowers?.length || 0,
                followingCount: ownerChirpProfileDef.initialFollowing?.length || 0,
            } : { characterId: deviceOwnerCharId || '', userId: 'defaultChirpUser', username: '@User', followersCount: 0, followingCount: 0};
            
            specificData = {
                userProfile: chirpProfileData,
                timelineChirps: storyData.initialChirpPosts || [],
                currentView: 'timeline',
            } as ChirpAppData;
        } else if (appDef.id === 'mailwise') {
            specificData = {
                accounts: storyData.emailAccounts || [],
                currentView: 'account_list',
            } as MailWiseAppData;
        } else if (appDef.id === 'webstalker') {
            const historyFromContent = Object.values(storyData.initialWebContents || {})
                .flatMap(wc => wc.initialBrowserHistory || [])
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            specificData = {
                bookmarks: storyData.browserBookmarks || [],
                history: historyFromContent,
                currentView: 'browser',
            } as WebStalkerAppData;
        } else if (appDef.id === 'chronos') {
            specificData = {
                events: storyData.calendarEvents || [],
                currentView: 'agenda', 
            } as ChronosAppData;
        } else if (appDef.id === 'ideapad') {
            specificData = {
                notes: storyData.notes || [],
                currentView: 'list',
            } as IdeaPadAppData;
        } else if (appDef.id === 'geomapper') {
            specificData = {
                savedPlaces: storyData.initialSavedPlaces || [],
                searchHistory: storyData.initialSearchHistory || [],
                currentView: 'map',
            } as GeoMapperAppData;
        } else if (appDef.id === 'fileexplorer_sm') {
            specificData = {
                currentPath: '/', 
                viewMode: 'list',
            } as FileExplorerAppData;
        }


        initialSmartphoneApps[appDef.id] = {
            id: appDef.id,
            appName: appDef.appName,
            isSystemApp: appDef.isSystemApp,
            unreadCount: 0, 
            appSpecificData: specificData,
            isEnabled: appDef.isEnabled !== undefined ? appDef.isEnabled : true,
            hasAccess: appDef.hasAccess !== undefined ? appDef.hasAccess : true,
            iconUrl: appDef.iconUrl, 
            iconChar: appDef.iconChar,
        };
    });
    
    const initialInboxThreads: Record<string, ConversationThread> = {};
    if (storyData.initialInboxMessages) {
        storyData.initialInboxMessages.forEach(msg => {
            const threadKey = msg.threadId; 
            if (!initialInboxThreads[threadKey]) {
                const otherParticipant = msg.senderId === 'player' ? msg.recipientId : msg.senderId;
                const character = storyData.characters[otherParticipant];
                initialInboxThreads[threadKey] = {
                    threadId: threadKey,
                    participants: ['player', otherParticipant].filter((p, i, self) => self.indexOf(p) === i), 
                    characterId: otherParticipant,
                    characterName: character?.name || otherParticipant,
                    messages: [],
                    lastMessageTimestamp: msg.timestamp,
                    hasUnread: !msg.isRead && msg.recipientId === 'player', 
                };
            }
            initialInboxThreads[threadKey].messages.push(msg);
            if (new Date(msg.timestamp) > new Date(initialInboxThreads[threadKey].lastMessageTimestamp)) {
                initialInboxThreads[threadKey].lastMessageTimestamp = msg.timestamp;
            }
             if (!msg.isRead && msg.recipientId === 'player') {
                initialInboxThreads[threadKey].hasUnread = true;
                 const whisperTalkApp = initialSmartphoneApps['whispertalk'];
                 if (whisperTalkApp) {
                     whisperTalkApp.unreadCount = (whisperTalkApp.unreadCount || 0) + 1;
                 }
            }
        });
    }

    const initialTerminalChatThreads: Record<string, TerminalChatThread> = {};
     if (storyData.initialTerminalChatMessages) {
        storyData.initialTerminalChatMessages.forEach(msg => {
            const charId = msg.senderId === 'player' ? 
                           (Object.values(storyData.characters).find(c => c.name === msg.senderName)?.id || msg.senderId) 
                           : msg.senderId;
            if (!initialTerminalChatThreads[charId]) {
                initialTerminalChatThreads[charId] = {
                    characterId: charId,
                    messages: [],
                    lastMessageTimestamp: msg.timestamp,
                };
            }
            const messageWithReadStatus = {
              ...msg,
              isReadByPlayer: msg.senderId === 'player' ? undefined : (msg.isReadByPlayer !== undefined ? msg.isReadByPlayer : false),
            };
            initialTerminalChatThreads[charId].messages.push(messageWithReadStatus);
            if (new Date(msg.timestamp) > new Date(initialTerminalChatThreads[charId].lastMessageTimestamp)) {
                initialTerminalChatThreads[charId].lastMessageTimestamp = msg.timestamp;
            }
        });
    }
    
    const defaultQuickSettings: QuickSettingsState = { 
        wifiEnabled: true, 
        bluetoothEnabled: false, 
        doNotDisturbEnabled: false, 
        flashlightEnabled: false, 
        airplaneModeEnabled: false, 
        batterySaverEnabled: false, 
        locationServicesEnabled: true 
    };

    const currentWallpaperUrl = storyData.initialSmartphoneUIState?.wallpaperUrl || "/assets/wallpapers/default.jpg";


    const baseState: PlayerStoryState = {
      currentPath: '/',
      deviceFileSystems: initialDeviceFileSystems,
      currentConnectedDeviceId: PLAYER_MAIN_NODE_ID,
      deviceConnectionStack: [PLAYER_MAIN_NODE_ID],
      terminalHistory: [],
      terminalEnvironmentVars: {},
      
      smartphoneLocked: storyData.initialSmartphoneUIState?.locked ?? true,
      smartphonePasscode: storyData.initialSmartphoneUIState?.passcode || null,
      smartphoneHomeScreenApps: storyData.initialSmartphoneUIState?.defaultHomeScreenApps || [],
      smartphoneInstalledApps: initialSmartphoneApps,
      smartphoneCurrentApp: null,
      smartphoneNotificationQueue: [],
      currentWallpaper: currentWallpaperUrl, // Ensure non-optional initialization
      notificationsLastCheckedTimestamp: new Date(0).toISOString(), 
      
      quickSettingsState: storyData.initialPlayerStateOverrides?.quickSettingsState || defaultQuickSettings,
      smartphoneDynamicColorPalette: extractPaletteFromWallpaper(currentWallpaperUrl), // Use extracted palette
      callLog: storyData.initialPlayerStateOverrides?.callLog || [],

      discoveredEvidenceIds: [],
      solvedPuzzleIds: [],
      narrativeFlags: {},
      gameStage: 'introduction', 
      username: username,
      password: password,
      playerTrustLevels: {}, 
      playerEthicalScore: 0,
      characterDynamicData: initialCharacterDynamicData,
      inboxThreads: initialInboxThreads,
      terminalChatThreads: initialTerminalChatThreads,
      evidenceNotes: {},
      characterNotes: {},
      currentStoryNumber: storyData.storyInfo.storyNumber,
      timeLimitEvents: {},
      currentLocation: null,
      currentTime: new Date().toISOString(), 
      saveVersion: "0.3.0_anonymous_cell_refactor"
    };
    
    Object.entries(storyData.characters).forEach(([charId, charDef]) => {
        baseState.playerTrustLevels[charId] = charDef.initialTrustLevel ?? 50;
    });

    let finalState = baseState;
    if (storyData.initialPlayerStateOverrides) {
        const { quickSettingsState: qsOverride, smartphoneDynamicColorPalette: paletteOverride, ...otherOverrides } = storyData.initialPlayerStateOverrides;
        finalState = {
            ...baseState,
            ...otherOverrides, // Apply other overrides first
            narrativeFlags: {
                ...baseState.narrativeFlags,
                ...(otherOverrides.narrativeFlags || {})
            },
            quickSettingsState: qsOverride || baseState.quickSettingsState,
            smartphoneDynamicColorPalette: paletteOverride || baseState.smartphoneDynamicColorPalette, // Override if provided
            callLog: otherOverrides.callLog || baseState.callLog,
        };
    }
    
    // Ensure quickSettingsState and smartphoneDynamicColorPalette are non-null and use extracted if not overridden
    finalState.quickSettingsState = finalState.quickSettingsState || defaultQuickSettings;
    finalState.smartphoneDynamicColorPalette = finalState.smartphoneDynamicColorPalette || extractPaletteFromWallpaper(finalState.currentWallpaper);
    
    return finalState;
}