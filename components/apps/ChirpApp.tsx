

import React from 'react';
import { PlayerStoryState, GameData, AppState, ChirpAppData, ChirpPostDef } from '../../types';
import { ChevronLeftIcon, HomeIcon, SearchIcon, NotificationsBellIcon, EnvelopeIcon, PencilSquareIcon, UserCircleIcon } from '../icons';

interface ChirpAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const ChirpApp: React.FC<ChirpAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['chirp'];
  const appData = appState.appSpecificData as ChirpAppData;

  const updateAppData = (newData: Partial<ChirpAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'chirp': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const handleTabChange = (view: ChirpAppData['currentView']) => {
    updateAppData({ currentView: view, selectedChirpId: undefined });
  };
  
  const renderChirp = (chirp: ChirpPostDef, isDetailView: boolean = false) => {
    const authorProfileDef = gameData.socialMediaProfiles?.chirp?.find(p => p.characterId === chirp.authorCharacterId);
    const authorName = authorProfileDef?.username || gameData.characters[chirp.authorCharacterId]?.name || chirp.authorCharacterId;
    const authorHandle = authorProfileDef?.username || `@${chirp.authorCharacterId.toLowerCase()}`;
    const authorAvatar = authorProfileDef?.profilePictureUrl;

    return (
      <div key={chirp.chirpId} className={`p-3 border-b border-white/10 ${isDetailView ? '' : 'hover:bg-white/5 cursor-pointer'}`}
           onClick={isDetailView ? undefined : () => updateAppData({currentView: 'chirp_detail', selectedChirpId: chirp.chirpId})}
      >
        <div className="flex items-start">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full mr-2.5 flex-shrink-0" />
          ) : (
            <UserCircleIcon className="w-10 h-10 rounded-full mr-2.5 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-grow">
            <div className="flex items-baseline space-x-1">
              <p className="font-semibold text-sm text-purple-200">{authorName}</p>
              <p className="text-xs text-gray-400 truncate">{authorHandle}</p>
              <p className="text-xs text-gray-500">· {new Date(chirp.timestamp).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-gray-100 mt-0.5 whitespace-pre-wrap">{chirp.textContent}</p>
            {chirp.imageUrl && <img src={chirp.imageUrl} alt="Chirp image" className="mt-2 rounded-lg max-h-60 w-auto object-cover" />}
            {/* Placeholder action buttons */}
            {!isDetailView && (
                <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pr-4">
                    {/* fix: Removed chirp.comments as it's not in ChirpPostDef type */}
                    <span>🔁 {chirp.reChirpCount || 0}</span>
                    <span>❤️ {chirp.likesCount || 0}</span>
                    <span>👁️ {chirp.repostCount || 0}</span> {/* Assuming repostCount is view count for simplicity */}
                </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderTimeline = () => (
    <div>
      {appData.timelineChirps.map(chirp => renderChirp(chirp))}
    </div>
  );

  const renderChirpDetail = () => {
    if (!appData.selectedChirpId) return null;
    const chirp = appData.timelineChirps.find(c => c.chirpId === appData.selectedChirpId);
    if (!chirp) return <p className="p-4 text-center text-gray-400">Chirp not found.</p>;
    return renderChirp(chirp, true);
  }

  const renderContent = () => {
    switch (appData.currentView) {
      case 'timeline': return renderTimeline();
      case 'chirp_detail': return renderChirpDetail();
      case 'search': return <p className="p-4 text-center text-gray-400">Search (Placeholder)</p>;
      case 'notifications': return <p className="p-4 text-center text-gray-400">Notifications (Placeholder)</p>;
      case 'messages': return <p className="p-4 text-center text-gray-400">Messages (Placeholder)</p>;
      default: return renderTimeline();
    }
  };

  const navItems = [
    { view: 'timeline' as const, label: 'Home', icon: <HomeIcon className="w-6 h-6" /> },
    { view: 'search' as const, label: 'Search', icon: <SearchIcon className="w-6 h-6" /> },
    { view: 'notifications' as const, label: 'Alerts', icon: <NotificationsBellIcon className="w-6 h-6" /> },
    { view: 'messages' as const, label: 'DMs', icon: <EnvelopeIcon className="w-6 h-6" /> },
  ];

  return (
    <div className="h-full flex flex-col text-white relative">
      {/* Header */}
      <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-20">
         {(appData.currentView === 'chirp_detail') && (
            <button 
                onClick={() => updateAppData({ currentView: 'timeline', selectedChirpId: undefined })} 
                className="mr-3 p-1 hover:bg-white/10 rounded-full" 
                aria-label="Back"
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        )}
        {appData.currentView !== 'chirp_detail' && (
             <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        )}
        <h1 className="text-xl font-bold text-purple-300">{appState.appName}</h1>
        {/* Placeholder for Profile or Settings icon */}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-16"> {/* Padding-bottom for FAB and nav */}
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center p-1.5 bg-black/50 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => handleTabChange(item.view)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-md w-1/4 ${appData.currentView === item.view ? 'text-purple-300' : 'text-gray-400 hover:text-purple-200'}`}
            aria-label={item.label}
            aria-current={appData.currentView === item.view ? 'page' : undefined}
          >
            {item.icon}
            {/* <span className="text-[10px] mt-0.5">{item.label}</span> */}
          </button>
        ))}
      </div>
      
      {/* FAB for new Chirp - Placeholder */}
      {appData.currentView === 'timeline' && (
        <button className="absolute bottom-20 right-4 p-3.5 bg-purple-600 hover:bg-purple-500 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400" aria-label="New Chirp">
          <PencilSquareIcon className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default ChirpApp;