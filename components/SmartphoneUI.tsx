
import React, { useState, useEffect, useMemo, useRef } from 'react';
// fix: Added ChronosAppData to imports
import { PlayerStoryState, GameData, AppState, SmartphoneNotification, QuickSettingTile, IconProps as GlobalIconProps, QuickSettingsState, ChronosAppData, SmartphoneDynamicColorPalette } from '../types';
import {
  WifiIcon, SignalIcon, BatteryIcon, ChevronLeftIcon, SettingsIcon,
  BluetoothIcon, NotificationsBellIcon, FlashlightIcon, AirplaneIcon,
  ConnectedDevicesIcon, AppsIcon, DisplayIcon, WallpaperIcon, SecurityPrivacyIcon,
  SearchIcon, BrightnessIcon, CameraIconLockScreen, PhoneIconLockScreen
} from './icons'; 
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { defaultPalette } from '@/src/utils/themeUtils';


// Import App Components
import WhisperTalkApp from './apps/WhisperTalkApp';
import SnapVaultApp from './apps/SnapVaultApp';
import ContactSphereApp from './apps/ContactSphereApp';
import FriendNetApp from './apps/FriendNetApp';
import ChirpApp from './apps/ChirpApp';
import MailWiseApp from './apps/MailWiseApp';
import WebStalkerApp from './apps/WebStalkerApp';
import ChronosApp from './apps/ChronosApp';
import IdeaPadApp from './apps/IdeaPadApp';
import GeoMapperApp from './apps/GeoMapperApp';
import FileExplorerApp from './apps/FileExplorerApp';


interface SmartphoneUIProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  onSendMessage: (targetCharacterId: string, messageBody: string, attachmentIds: string[]) => void;
  onMarkAsRead: (threadId: string, messageId?: string) => void;
}

const SmartphoneAppIcon: React.FC<{app: AppState; onClick: () => void; palette: SmartphoneDynamicColorPalette}> = ({ app, onClick, palette }) => {
  const iconContainerStyle: React.CSSProperties = {
    backgroundColor: palette.surfaceVariant || 'rgba(124, 58, 237, 0.3)', // purple-600/30
    borderColor: 'rgba(255,255,255,0.2)',
  };
  const iconCharStyle: React.CSSProperties = {
    color: palette.textOnSurface || '#FFFFFF',
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg aspect-square transition-all relative focus:outline-none focus:ring-2`}
      style={{ '--icon-focus-ring': palette.accent } as React.CSSProperties}
      disabled={app.hasAccess === false}
      title={app.hasAccess === false ? `${app.appName} (Access Denied)` : app.appName}
      aria-label={app.hasAccess === false ? `${app.appName}, access denied` : app.appName}
    >
      <div 
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl mb-1 flex items-center justify-center text-2xl shadow-md ${app.hasAccess === false ? 'grayscale' : ''}`}
        style={iconContainerStyle}
      >
        {app.iconUrl ? <img src={app.iconUrl} alt="" className="w-8 h-8 object-contain" /> : 
         <span style={iconCharStyle}>{app.iconChar || app.appName.substring(0,1)}</span>
        }
      </div>
      <span 
        className={`text-xs text-center truncate w-full mt-1`}
        style={{ color: app.hasAccess === false ? palette.textNeutralSubtle : palette.textOnBackground }}
      >
          {app.appName}
      </span>
      {app.unreadCount && app.unreadCount > 0 && app.hasAccess !== false && (
          <span 
            className="absolute top-0 right-0 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center border-2 shadow-lg" 
            style={{ backgroundColor: palette.accent, borderColor: palette.background }}
            aria-label={`${app.unreadCount} unread notifications`}>
              {app.unreadCount > 9 ? '9+' : app.unreadCount}
          </span>
      )}
    </button>
  );
};

interface SettingsCategory {
    id: string;
    name: string;
    icon: React.ReactElement<GlobalIconProps>; 
    subPage?: boolean; 
}

const SmartphoneUI: React.FC<SmartphoneUIProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  onSendMessage,
  onMarkAsRead,
}) => {
  const { 
    smartphoneLocked, 
    smartphoneCurrentApp, 
    smartphoneInstalledApps, 
    currentWallpaper, 
    currentTime, 
    smartphoneNotificationQueue, 
    narrativeFlags, 
    notificationsLastCheckedTimestamp,
    quickSettingsState,
    smartphoneDynamicColorPalette 
  } = playerState;
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [isNotificationShadeOpen, setIsNotificationShadeOpen] = useState(false);
  const [currentSettingsPath, setCurrentSettingsPath] = useState<string | null>(null);
  const appContentRef = useRef<HTMLDivElement>(null); // Ref for CSSTransition

  const palette = smartphoneDynamicColorPalette;

  const phoneStyle: React.CSSProperties = {
    '--palette-primary': palette.primary,
    '--palette-accent': palette.accent,
    '--palette-background': palette.background,
    '--palette-surface': palette.surface,
    '--palette-surface-variant': palette.surfaceVariant || palette.surface,
    '--palette-text-on-primary': palette.textOnPrimary,
    '--palette-text-on-accent': palette.textOnAccent,
    '--palette-text-on-background': palette.textOnBackground,
    '--palette-text-on-surface': palette.textOnSurface,
    '--palette-text-neutral-subtle': palette.textNeutralSubtle,
    '--palette-text-neutral-medium': palette.textNeutralMedium || palette.textNeutralSubtle,
    '--palette-icon-default': palette.iconDefault || palette.textNeutralSubtle,
    '--palette-icon-active': palette.iconActive || palette.accent,
    '--palette-status-bar-bg': palette.statusBar || 'rgba(0,0,0,0.3)',
    '--palette-nav-bar-bg': palette.navBar || 'rgba(0,0,0,0.4)',
    backgroundImage: `url(${currentWallpaper || '/assets/wallpapers/default.jpg'})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: palette.textOnBackground, // Default text color for the phone
  } as React.CSSProperties;


  const smartphoneDeviceTargetId = gameData.storyInfo.smartphoneDeviceTargetId;
  const smartphoneDeviceConfig = smartphoneDeviceTargetId ? gameData.deviceConfigurations?.[smartphoneDeviceTargetId] : undefined;
  const smartphoneDeviceOwner = smartphoneDeviceConfig?.promptUsername === "{PLAYER_USERNAME}" ? playerState.username : smartphoneDeviceConfig?.promptUsername || 'Unknown User';
  const smartphoneUiDeviceName = smartphoneDeviceConfig?.promptHostname || gameData.initialSmartphoneUIState.osVersion || "CellOS";
  
  const systemTime = new Date(currentTime);
  const formattedTime = systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = systemTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const hasUnreadStatusBarNotifications = useMemo(() => {
    if (!notificationsLastCheckedTimestamp) return smartphoneNotificationQueue.some(n => !n.isRead);
    return smartphoneNotificationQueue.some(n => !n.isRead && new Date(n.timestamp) > new Date(notificationsLastCheckedTimestamp));
  }, [smartphoneNotificationQueue, notificationsLastCheckedTimestamp]);


  const handleUnlockAttempt = () => {
    if (playerState.smartphonePasscode === null || passcodeAttempt === playerState.smartphonePasscode) {
      onPlayerStateChange({ ...playerState, smartphoneLocked: false });
      setPasscodeAttempt('');
    } else {
      const passcodeFeedbackEl = document.getElementById('passcode-feedback');
      if(passcodeFeedbackEl) {
        passcodeFeedbackEl.textContent = gameData.systemMessages.smartphone_incorrect_passcode || "Incorrect Passcode";
        passcodeFeedbackEl.style.color = 'red'; // Use a more generic color or a palette error color
        passcodeFeedbackEl.classList.add('animate-shake');
        setTimeout(() => {
            passcodeFeedbackEl.textContent = "";
            passcodeFeedbackEl.classList.remove('animate-shake');
        }, 1500);
      }
      setPasscodeAttempt('');
      const newPlayerState = {...playerState, narrativeFlags: {...playerState.narrativeFlags, failed_passcode_attempts: (playerState.narrativeFlags.failed_passcode_attempts || 0) + 1}};
      onPlayerStateChange(newPlayerState);
    }
  };

  const launchApp = (appId: string) => {
    if (smartphoneInstalledApps[appId]?.hasAccess !== false) {
        onPlayerStateChange({...playerState, smartphoneCurrentApp: appId});
        setIsNotificationShadeOpen(false); 
        if (appId !== "settings_app") setCurrentSettingsPath(null); 
    } else {
        const appName = smartphoneInstalledApps[appId]?.appName || appId;
        console.warn(`App ${appName} is not accessible.`);
         const tempNotifications = [...playerState.smartphoneNotificationQueue];
         tempNotifications.unshift({
            id: `access_denied_${Date.now()}`,
            appId: 'system_ui',
            appName: 'CellOS',
            title: 'Access Denied',
            message: `You do not have access to ${appName}.`,
            timestamp: new Date().toISOString(),
            isRead: false,
        });
        onPlayerStateChange({...playerState, smartphoneNotificationQueue: tempNotifications.slice(0, 20)});

    }
  };
  
  const goHome = () => {
     onPlayerStateChange({...playerState, smartphoneCurrentApp: null});
     setIsNotificationShadeOpen(false);
     setCurrentSettingsPath(null);
  }

  const toggleNotificationShade = () => {
    const newShadeState = !isNotificationShadeOpen;
    setIsNotificationShadeOpen(newShadeState);
    if (newShadeState) { 
        onPlayerStateChange({ ...playerState, notificationsLastCheckedTimestamp: new Date().toISOString() });
    }
  };
  
  const handleNotificationTap = (notification: SmartphoneNotification) => {
    const newQueue = smartphoneNotificationQueue.map(n => n.id === notification.id ? {...n, isRead: true} : n);
    let updatedPlayerState = { ...playerState, smartphoneNotificationQueue: newQueue };

    if (notification.action?.type === 'open_app' && notification.action.targetId) {
        if (smartphoneInstalledApps[notification.action.targetId]?.hasAccess !== false) {
            updatedPlayerState.smartphoneCurrentApp = notification.action.targetId;
        }
    } else if (notification.action?.type === 'open_chat' && notification.action.targetId && smartphoneInstalledApps['whispertalk']?.hasAccess !== false) {
            updatedPlayerState.smartphoneCurrentApp = 'whispertalk';
            const whisperTalkApp = updatedPlayerState.smartphoneInstalledApps['whispertalk'];
            if (whisperTalkApp) {
                whisperTalkApp.appSpecificData = {
                    ...whisperTalkApp.appSpecificData,
                    currentView: 'chat_screen',
                    selectedThreadId: notification.action.targetId
                };
            }
    } else if (smartphoneInstalledApps[notification.appId]?.hasAccess !== false) {
         updatedPlayerState.smartphoneCurrentApp = notification.appId;
    }
    onPlayerStateChange(updatedPlayerState);
    setIsNotificationShadeOpen(false); 
  };

  const handleClearAllNotifications = () => {
    const newQueue = smartphoneNotificationQueue.map(n => ({...n, isRead: true}));
    onPlayerStateChange({...playerState, smartphoneNotificationQueue: newQueue, notificationsLastCheckedTimestamp: new Date().toISOString()});
  };

  const toggleQuickSetting = (settingKey: keyof QuickSettingsState) => {
    const currentQuickSettings = playerState.quickSettingsState || { wifiEnabled: true, bluetoothEnabled: false, doNotDisturbEnabled: false, flashlightEnabled: false, airplaneModeEnabled: false, batterySaverEnabled: false, locationServicesEnabled: true};
    const newValue = !currentQuickSettings[settingKey];
    
    const updatedQuickSettings = {
        ...currentQuickSettings,
        [settingKey]: newValue
    };
    
    if (settingKey === 'airplaneModeEnabled' && newValue === true) {
        updatedQuickSettings.wifiEnabled = false;
        updatedQuickSettings.bluetoothEnabled = false;
    } else if ((settingKey === 'wifiEnabled' || settingKey === 'bluetoothEnabled') && newValue === true) {
        updatedQuickSettings.airplaneModeEnabled = false; 
    }

    onPlayerStateChange({ ...playerState, quickSettingsState: updatedQuickSettings });
  };


  const renderStatusBar = () => (
    <div 
        className="absolute top-0 left-0 right-0 h-8 backdrop-blur-sm flex items-center justify-between px-4 text-xs z-30 rounded-t-[20px] cursor-pointer"
        style={{ backgroundColor: palette.statusBar, color: palette.textOnBackground }}
        onClick={toggleNotificationShade}
        role="button"
        aria-label="Toggle notification shade"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggleNotificationShade()}
    >
      <div className="flex items-center space-x-1.5">
        <span>{formattedTime}</span>
        {hasUnreadStatusBarNotifications && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: palette.accent}}></span>}
      </div>
      <div className="flex items-center space-x-2">
        {narrativeFlags.cameraInUse && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Camera in use"></span>}
        {narrativeFlags.micInUse && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Microphone in use"></span>}
        <WifiIcon className="w-3.5 h-3.5" active={quickSettingsState?.wifiEnabled} style={{color: quickSettingsState?.wifiEnabled ? palette.iconActive : palette.iconDefault }}/>
        <SignalIcon className="w-3 h-3" style={{color: palette.iconDefault}} />
        <div className="flex items-center">
          <BatteryIcon className="w-3.5 h-3.5" style={{color: palette.iconDefault}}/>
          <span className="text-xs ml-0.5">100%</span>
        </div>
      </div>
    </div>
  );

  const quickSettingsTilesConfig: QuickSettingTile[] = [
    { id: 'wifi', label: 'Wi-Fi', icon: <WifiIcon />, isActive: quickSettingsState?.wifiEnabled, action: () => toggleQuickSetting('wifiEnabled') },
    { id: 'bluetooth', label: 'Bluetooth', icon: <BluetoothIcon />, isActive: quickSettingsState?.bluetoothEnabled, action: () => toggleQuickSetting('bluetoothEnabled') },
    { id: 'dnd', label: 'Do Not Disturb', icon: <NotificationsBellIcon />, isActive: quickSettingsState?.doNotDisturbEnabled, action: () => toggleQuickSetting('doNotDisturbEnabled') },
    { id: 'flashlight', label: 'Flashlight', icon: <FlashlightIcon />, isActive: quickSettingsState?.flashlightEnabled, action: () => toggleQuickSetting('flashlightEnabled') },
    { id: 'airplane', label: 'Airplane Mode', icon: <AirplaneIcon className="transform rotate-45" />, isActive: quickSettingsState?.airplaneModeEnabled, action: () => toggleQuickSetting('airplaneModeEnabled') }, 
    { id: 'battery_saver', label: 'Battery Saver', icon: <BatteryIcon />, isActive: quickSettingsState?.batterySaverEnabled, action: () => toggleQuickSetting('batterySaverEnabled') },
  ];

  const settingsCategories: SettingsCategory[] = [
    { id: 'network', name: 'Network & internet', icon: <WifiIcon /> },
    { id: 'connected_devices', name: 'Connected devices', icon: <ConnectedDevicesIcon /> },
    { id: 'apps', name: 'Apps', icon: <AppsIcon /> },
    { id: 'notifications_settings', name: 'Notifications', icon: <NotificationsBellIcon /> },
    { id: 'display', name: 'Display', icon: <DisplayIcon /> },
    { id: 'wallpaper', name: 'Wallpaper & style', icon: <WallpaperIcon /> },
    { id: 'security', name: 'Security & privacy', icon: <SecurityPrivacyIcon /> },
    { id: 'system', name: 'System', icon: <SettingsIcon /> },
    { id: 'about_phone', name: 'About phone', icon: <SettingsIcon /> },
  ];
  
  const renderSettingsContent = () => {
    if (!currentSettingsPath) { 
      return (
        <div>
            <div className="p-3 mb-2 sticky top-0 backdrop-blur-md z-10 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg" style={{backgroundColor: palette.surfaceVariant || palette.background}}>
                <input type="text" placeholder="Search settings" 
                  className="w-full p-2.5 rounded-full text-sm focus:outline-none focus:ring-1"
                  style={{ backgroundColor: palette.surface, color: palette.textOnSurface, '--settings-search-ring': palette.accent } as React.CSSProperties}
                  />
            </div>
            {settingsCategories.filter(cat => !cat.subPage).map(cat => (
                <button key={cat.id} onClick={() => setCurrentSettingsPath(cat.id)}
                    className="flex items-center w-full p-3.5 hover:bg-white/5 rounded-lg transition-colors text-left">
                    {React.cloneElement(cat.icon, { className: "w-5 h-5 mr-4", style:{color: palette.iconDefault} })}
                    <span className="text-sm ml-0" style={{color: palette.textOnSurface}}>{cat.name}</span>
                </button>
            ))}
        </div>
      );
    }

    const category = settingsCategories.find(c => c.id === currentSettingsPath);
    
    if (currentSettingsPath === 'network') {
        return (
            <div>
                <h3 className="text-md font-semibold mb-3" style={{color: palette.textOnSurface}}>Internet</h3>
                <div className="flex justify-between items-center p-2.5 hover:bg-white/5 rounded-lg">
                    <label htmlFor="wifi-toggle" className="text-sm flex items-center">
                        <WifiIcon className="w-5 h-5 mr-3" style={{color: palette.iconDefault}} /> Wi-Fi
                    </label>
                    <button
                        id="wifi-toggle"
                        onClick={() => toggleQuickSetting('wifiEnabled')}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${quickSettingsState?.wifiEnabled ? 'bg-[var(--palette-accent)]' : 'bg-[var(--palette-neutral-subtle)]'}`}
                        aria-pressed={quickSettingsState?.wifiEnabled}
                    >
                        <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${quickSettingsState?.wifiEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                </div>
                 <h3 className="text-md font-semibold mt-4 mb-3" style={{color: palette.textOnSurface}}>Connections</h3>
                <div className="flex justify-between items-center p-2.5 hover:bg-white/5 rounded-lg">
                    <label htmlFor="bluetooth-toggle" className="text-sm flex items-center">
                        <BluetoothIcon className="w-5 h-5 mr-3" style={{color: palette.iconDefault}} /> Bluetooth
                    </label>
                    <button
                        id="bluetooth-toggle"
                        onClick={() => toggleQuickSetting('bluetoothEnabled')}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${quickSettingsState?.bluetoothEnabled ? 'bg-[var(--palette-accent)]' : 'bg-[var(--palette-neutral-subtle)]'}`}
                         aria-pressed={quickSettingsState?.bluetoothEnabled}
                    >
                        <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${quickSettingsState?.bluetoothEnabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                </div>
            </div>
        );
    }
    if (currentSettingsPath === 'about_phone') {
        return (
             <div>
                <p className="text-sm mb-1" style={{color: palette.textNeutralMedium}}>Device name:</p>
                <p className="text-md font-semibold mb-3" style={{color: palette.textOnSurface}}>{smartphoneUiDeviceName}</p>
                <p className="text-sm mb-1" style={{color: palette.textNeutralMedium}}>OS version:</p>
                <p className="text-md font-semibold" style={{color: palette.textOnSurface}}>{gameData.initialSmartphoneUIState.osVersion}</p>
            </div>
        );
    }


    return (
      <div>
        <p>Details for {category?.name || currentSettingsPath.split('/').pop()}.</p>
        {currentSettingsPath === 'security' && (
            <div className="mt-4 space-y-2">
                <button onClick={() => setCurrentSettingsPath('security/privacy_dashboard')} className="block w-full text-left p-2.5 hover:bg-white/5 rounded-lg">Privacy Dashboard</button>
                <button onClick={() => setCurrentSettingsPath('security/permission_manager')} className="block w-full text-left p-2.5 hover:bg-white/5 rounded-lg">Permission Manager</button>
                <button onClick={() => setCurrentSettingsPath('security/security_hub')} className="block w-full text-left p-2.5 hover:bg-white/5 rounded-lg">Security Hub</button>
            </div>
        )}
        {currentSettingsPath === 'security/privacy_dashboard' && <p className="mt-2 text-xs">Placeholder: Shows app permission usage.</p>}
        {currentSettingsPath === 'security/permission_manager' && <p className="mt-2 text-xs">Placeholder: Manage app permissions.</p>}
        {currentSettingsPath === 'security/security_hub' && <p className="mt-2 text-xs">Placeholder: Device security status.</p>}
      </div>
    );
  };

  const lockScreenNotifications = smartphoneNotificationQueue.filter(n => !n.isRead).slice(0, 3);


  if (smartphoneLocked) {
    return (
      <div style={phoneStyle} className="w-full h-full rounded-3xl shadow-2xl flex flex-col border-4 border-gray-700/50 relative overflow-hidden">
        {renderStatusBar()}
        <div className="flex-grow flex flex-col items-center justify-center p-6 z-10 pt-12">
            <div className="text-center mb-8">
                <h1 className="text-6xl md:text-7xl font-thin tracking-tight" style={{color: palette.textOnBackground}}>{formattedTime}</h1>
                <p className="text-lg" style={{color: palette.textNeutralSubtle}}>{formattedDate}</p>
            </div>
            <div id="passcode-feedback" className="h-6 text-sm mb-2 transition-all"></div>
            <input 
              type="password" 
              value={passcodeAttempt}
              onChange={(e) => setPasscodeAttempt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockAttempt()}
              placeholder="Enter passcode" 
              id="smartphone-passcode-input"
              className="backdrop-blur-sm p-3 rounded-lg mb-6 w-48 text-center tracking-[0.3em] focus:ring-2 focus:outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: palette.textOnSurface, '--passcode-ring-color': palette.accent } as React.CSSProperties}
              aria-label="Smartphone passcode input"
              autoFocus
            />
            <button
              onClick={handleUnlockAttempt}
              className="px-8 py-3 backdrop-blur-md rounded-full text-lg shadow-lg transition-colors focus:outline-none focus:ring-2"
              style={{ backgroundColor: 'rgba(124,58,237,0.7)', color: palette.textOnPrimary, '--unlock-ring-color': palette.primary } as React.CSSProperties} // Example: purple-600/70
              aria-label="Unlock device"
            >
              Unlock
            </button>
        </div>
         {lockScreenNotifications.length > 0 && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-10 space-y-2">
                {lockScreenNotifications.map(notification => (
                     <button key={notification.id} onClick={() => handleNotificationTap(notification)}
                        className="w-full p-2.5 backdrop-blur-lg rounded-xl shadow-lg text-left transition-colors"
                        style={{backgroundColor: 'rgba(0,0,0,0.5)'}}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                        >
                        <div className="flex items-center mb-1">
                            {smartphoneInstalledApps[notification.appId]?.iconUrl ? 
                                <img src={smartphoneInstalledApps[notification.appId]?.iconUrl} alt="" className="w-4 h-4 mr-1.5 rounded-full" /> :
                                smartphoneInstalledApps[notification.appId]?.iconChar ?
                                <span className="w-4 h-4 mr-1.5 text-xs flex items-center justify-center" style={{color: palette.textOnSurface}}>{smartphoneInstalledApps[notification.appId]?.iconChar}</span> :
                                <div className="w-4 h-4 mr-1.5 rounded-full" style={{backgroundColor: palette.surfaceVariant}}></div>
                            }
                            <span className="text-xs font-semibold" style={{color: palette.textOnSurface}}>{notification.appName || notification.appId}</span>
                            <span className="text-xs ml-auto" style={{color: palette.textNeutralSubtle}}>{new Date(notification.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs font-medium truncate" style={{color: palette.textOnSurface}}>{notification.title}</p>
                        <p className="text-xs truncate" style={{color: palette.textNeutralSubtle}}>{notification.message}</p>
                    </button>
                ))}
            </div>
        )}
        {lockScreenNotifications.length === 0 && (
             <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-xs px-4 z-10">
                <div className="backdrop-blur-md p-3 rounded-xl shadow-lg text-center text-sm" style={{backgroundColor: 'rgba(0,0,0,0.3)', color: palette.textNeutralSubtle}}>
                    No new notifications
                </div>
            </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 backdrop-blur-sm flex justify-around items-center z-20 rounded-b-[20px]" style={{backgroundColor: 'rgba(0,0,0,0.2)'}}>
            <button className="p-3 backdrop-blur-sm rounded-full transition-colors focus:outline-none focus:ring-2" aria-label="Camera shortcut"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', '--shortcut-ring-color': palette.accent} as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
                <CameraIconLockScreen className="w-6 h-6" style={{color: palette.textOnSurface}}/>
            </button>
            <button className="p-3 backdrop-blur-sm rounded-full transition-colors focus:outline-none focus:ring-2" aria-label="Emergency call shortcut"
              style={{backgroundColor: 'rgba(255,255,255,0.1)', '--shortcut-ring-color': palette.accent} as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
                <PhoneIconLockScreen className="w-6 h-6" style={{color: palette.textOnSurface}}/>
            </button>
        </div>
      </div>
    );
  }
  
  const currentApp = smartphoneCurrentApp ? smartphoneInstalledApps[smartphoneCurrentApp] : null;

  const renderCurrentApp = () => {
    if (!currentApp) return null; // Should be caught by parent logic but good for safety
    let backAction = goHome;
    if (currentApp.id === 'settings_app' && currentSettingsPath) {
        backAction = () => setCurrentSettingsPath(null);
    }

    const AppContent = () => {
        switch(currentApp.id) {
            case 'settings_app': return renderSettingsContent();
            case 'whispertalk': return <WhisperTalkApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} onSendMessage={onSendMessage} onMarkAsRead={onMarkAsRead} />;
            case 'snapvault': return <SnapVaultApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'contactsphere': return <ContactSphereApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'friendnet': return <FriendNetApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'chirp': return <ChirpApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'mailwise': return <MailWiseApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'webstalker': return <WebStalkerApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'chronos': return <ChronosApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'ideapad': return <IdeaPadApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'geomapper': return <GeoMapperApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            case 'fileexplorer_sm': return <FileExplorerApp playerState={playerState} gameData={gameData} onPlayerStateChange={onPlayerStateChange} goHome={goHome} />;
            default: return <p style={{color: palette.textOnBackground}}>Content for {currentApp.appName} (ID: {currentApp.id}) goes here.</p>;
        }
    };
    
    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex items-center mb-4" style={{color: palette.textOnBackground}}>
                <button onClick={backAction} className="mr-2 p-1 rounded-full hover:bg-[var(--palette-surface-variant)]" aria-label="Back">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold" style={{color: palette.primary}}>
                    {currentApp.id === 'settings_app' ? 
                        (currentSettingsPath ? (settingsCategories.find(c=>c.id === currentSettingsPath) || {name: currentSettingsPath.split('/').pop()})?.name : currentApp.appName) 
                        : currentApp.appName}
                </h2>
            </div>
            <AppContent />
        </div>
    );
  };

  const atAGlanceEvents = playerState.smartphoneInstalledApps['chronos']?.appSpecificData as ChronosAppData | undefined;
  const nextEvent = atAGlanceEvents?.events
    ?.filter(event => new Date(event.startTime) > systemTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const renderHomeScreen = () => (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-6 p-3 backdrop-blur-sm rounded-xl shadow" style={{backgroundColor: palette.surfaceVariant, color: palette.textOnSurface}}>
        <p className="text-sm">{formattedDate}</p>
        {nextEvent ? (
          <p className="text-xs" style={{color: palette.textNeutralSubtle}}>Next: {nextEvent.title} at {new Date(nextEvent.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
        ) : (
          <p className="text-xs" style={{color: palette.textNeutralSubtle}}>No upcoming events</p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-x-4 gap-y-5 flex-grow content-start">
        {playerState.smartphoneHomeScreenApps.map(appId => {
          const app = smartphoneInstalledApps[appId];
          if (!app || app.isEnabled === false) return null;
          return <SmartphoneAppIcon key={appId} app={app} onClick={() => launchApp(appId)} palette={palette} />;
        })}
      </div>
      <div className="mt-auto mb-2 sticky bottom-2 left-0 right-0 px-2 z-10">
        <div className="flex items-center p-3 backdrop-blur-lg rounded-full shadow-xl border" style={{backgroundColor: palette.surface, borderColor: palette.surfaceVariant}}>
          <SearchIcon className="w-5 h-5 mr-2" style={{color: palette.textNeutralSubtle}} />
          <input type="text" placeholder="Search apps and web" 
            className="bg-transparent flex-grow focus:outline-none text-sm placeholder-gray-400" 
            style={{color: palette.textOnSurface, '--placeholder-color': palette.textNeutralSubtle} as React.CSSProperties}/>
        </div>
      </div>
    </div>
  );


  return (
    <div style={phoneStyle} className="w-full h-full rounded-3xl shadow-2xl p-1 flex flex-col relative overflow-hidden border-4 border-gray-700/50">
      {renderStatusBar()}
      
      {isNotificationShadeOpen && (
        <div className="absolute inset-0 top-7 backdrop-blur-xl z-20 p-4 pt-2 overflow-y-auto scrollbar-hide rounded-b-3xl rounded-t-lg shadow-2xl" style={{backgroundColor: 'rgba(0,0,0,0.8)', color: palette.textOnBackground}}>
            <div className="flex justify-end items-center mb-2 h-4">
                {narrativeFlags.cameraInUse && <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" title="Camera in use"></span>}
                {narrativeFlags.micInUse && <span className="w-2 h-2 bg-red-500 rounded-full" title="Microphone in use"></span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {quickSettingsTilesConfig.map(tile => (
                    <button key={tile.id} 
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center aspect-square transition-colors`}
                        style={{backgroundColor: tile.isActive ? palette.accent : palette.surfaceVariant, color: tile.isActive ? palette.textOnAccent : palette.textOnSurface}}
                        onClick={tile.action}
                        aria-pressed={tile.isActive ?? false}
                        aria-label={tile.label}
                    >
                        {React.cloneElement(tile.icon, { className: "w-6 h-6" })}
                        <span className="text-xs mt-1.5">{tile.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex items-center space-x-2 mb-4">
                <BrightnessIcon className="w-5 h-5" style={{color: palette.textNeutralSubtle}} />
                <div className="w-full h-2 rounded-full relative" style={{backgroundColor: palette.surfaceVariant}}>
                    <div className="w-1/2 h-full rounded-full" style={{backgroundColor: palette.accent}}></div>
                </div>
            </div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold" style={{color: palette.textNeutralSubtle}}>Notifications</h3>
                {smartphoneNotificationQueue.filter(n => !n.isRead).length > 0 && (
                    <button onClick={handleClearAllNotifications} className="text-xs hover:underline" style={{color: palette.accent}}>Clear all</button>
                )}
            </div>
            {smartphoneNotificationQueue.filter(n => !n.isRead).length === 0 && (
                <p className="text-xs text-center py-4" style={{color: palette.textNeutralSubtle}}>No new notifications</p>
            )}
            <div className="space-y-2">
            {smartphoneNotificationQueue.filter(n => !n.isRead).slice(0, 5).map(notification => (
                <button key={notification.id} onClick={() => handleNotificationTap(notification)}
                    className="w-full p-3 rounded-lg text-left transition-colors"
                    style={{backgroundColor: palette.surfaceVariant || defaultPalette.surfaceVariant}}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.surface || defaultPalette.surface }
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.surfaceVariant || defaultPalette.surfaceVariant }
                    >
                    <div className="flex items-center mb-1">
                        {smartphoneInstalledApps[notification.appId]?.iconUrl ? 
                            <img src={smartphoneInstalledApps[notification.appId]?.iconUrl} alt="" className="w-4 h-4 mr-2 rounded-full" /> :
                            smartphoneInstalledApps[notification.appId]?.iconChar ?
                            <span className="w-4 h-4 mr-2 text-xs flex items-center justify-center" style={{color: palette.textOnSurface}}>{smartphoneInstalledApps[notification.appId]?.iconChar}</span> :
                            <div className="w-4 h-4 mr-2 rounded-full" style={{backgroundColor: palette.surface}}></div>
                        }
                        <span className="text-xs font-semibold" style={{color: palette.textOnSurface}}>{notification.appName || notification.appId}</span>
                        <span className="text-xs ml-auto" style={{color: palette.textNeutralSubtle}}>{new Date(notification.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs font-medium" style={{color: palette.textOnSurface}}>{notification.title}</p>
                    <p className="text-xs truncate" style={{color: palette.textNeutralSubtle}}>{notification.message}</p>
                </button>
            ))}
            </div>
        </div>
      )}

      <div className="flex-grow pt-8 overflow-y-auto scrollbar-hide" style={{backgroundColor: palette.background}}> 
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={currentApp ? currentApp.id : 'home-screen'}
            nodeRef={appContentRef}
            classNames="app-content"
            timeout={{ enter: 250, exit: 200 }}
          >
            <div ref={appContentRef} className="h-full"> {/* Wrapper div for CSSTransition nodeRef */}
              {currentApp ? renderCurrentApp() : renderHomeScreen()}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
      <div className="h-12 backdrop-blur-md flex items-center justify-center rounded-b-[20px] mt-auto z-20 sticky bottom-0" style={{backgroundColor: palette.navBar}}> 
        <button 
          onClick={goHome}
          className="w-16 h-1.5 rounded-full transition-colors"
          style={{backgroundColor: 'rgba(255,255,255,0.5)'}}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.7)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'}
          aria-label="Go to Home Screen"
        />
      </div>
    </div>
  );
};

export default SmartphoneUI;
