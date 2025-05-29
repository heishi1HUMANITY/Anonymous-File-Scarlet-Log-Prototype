
import React from 'react';
import { PlayerStoryState, GameData, AppState, SnapVaultAppData, PhotoAlbumDef, PhotoDef } from '../../types';
import { ChevronLeftIcon, PlayCircleIcon } from '../icons'; // Added PlayCircleIcon

interface SnapVaultAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const SnapVaultApp: React.FC<SnapVaultAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['snapvault'];
  const appData = appState.appSpecificData as SnapVaultAppData;

  const updateAppData = (newData: Partial<SnapVaultAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'snapvault': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const handlePhotoClick = (photoId: string, albumId?: string) => {
    updateAppData({ currentView: 'photo_detail', selectedPhotoId: photoId, selectedAlbumId: albumId || appData.selectedAlbumId });
  };

  const handleAlbumClick = (albumId: string) => {
    updateAppData({ currentView: 'album_detail', selectedAlbumId: albumId, activeTab: 'albums' });
  };
  
  const handleTabChange = (tab: 'photos' | 'albums') => {
    updateAppData({ activeTab: tab, currentView: tab === 'photos' ? 'photos_tab' : 'albums_tab', selectedAlbumId: undefined, selectedPhotoId: undefined });
  };

  const getPhotoById = (photoId: string): PhotoDef | undefined => {
    for (const album of appData.albums) {
      const photo = album.photos.find(p => p.photoId === photoId);
      if (photo) return photo;
    }
    return undefined;
  };
  
  const getAllPhotos = (): PhotoDef[] => {
    let all: PhotoDef[] = [];
    appData.albums.forEach(album => {
        all = all.concat(album.photos);
    });
    return all.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }


  const renderHeader = (title: string, showBackButton: boolean = false, backAction?: () => void) => (
    <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-10">
      {showBackButton && (
        <button 
          onClick={backAction || (() => updateAppData({ currentView: appData.selectedAlbumId ? 'album_detail' : (appData.activeTab === 'albums' ? 'albums_tab' : 'photos_tab'), selectedPhotoId: undefined }))} 
          className="mr-3 p-1 hover:bg-white/10 rounded-full" 
          aria-label="Back"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}
      <h1 className="text-xl font-bold text-purple-300">{title}</h1>
    </div>
  );
  
  const renderTabs = () => (
     <div className="flex border-b border-white/10 sticky top-0 bg-black/30 backdrop-blur-md z-10">
        <button 
            onClick={() => handleTabChange('photos')}
            className={`flex-1 py-3 text-sm font-medium ${appData.activeTab === 'photos' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400 hover:text-purple-200'}`}
        >Photos</button>
        <button 
            onClick={() => handleTabChange('albums')}
            className={`flex-1 py-3 text-sm font-medium ${appData.activeTab === 'albums' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400 hover:text-purple-200'}`}
        >Albums</button>
    </div>
  );

  if (appData.currentView === 'photo_detail' && appData.selectedPhotoId) {
    const photo = getPhotoById(appData.selectedPhotoId);
    if (!photo) return <p>Photo not found.</p>;
    return (
      <div className="h-full flex flex-col bg-black text-white">
        {renderHeader(photo.filename || 'Media', true, () => updateAppData({ currentView: appData.selectedAlbumId ? 'album_detail' : (appData.activeTab === 'albums' ? 'albums_tab' : 'photos_tab'), selectedPhotoId: undefined }))}
        <div className="flex-grow flex items-center justify-center p-1 bg-black overflow-hidden">
          {photo.isVideo && photo.videoUrl ? (
            <video 
              src={photo.videoUrl} 
              poster={photo.url} // Use image url as poster
              controls 
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              aria-label={photo.caption || photo.filename}
            />
          ) : (
            <img src={photo.url} alt={photo.caption || photo.filename} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
          )}
        </div>
        <div className="p-3 bg-black/50 backdrop-blur-sm text-sm text-gray-300 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
          {photo.caption && <p className="text-base mb-1">{photo.caption}</p>}
          <p className="text-xs text-gray-400">Taken: {new Date(photo.timestamp).toLocaleString()}</p>
          {photo.isVideo && photo.duration && <p className="text-xs text-gray-400">Duration: {photo.duration}s</p>}
          {photo.location && (
            <p className="text-xs text-gray-400">
              Location: {photo.location.name || `${photo.location.lat.toFixed(4)}, ${photo.location.lon.toFixed(4)}`}
            </p>
          )}
          {photo.metadata && Object.entries(photo.metadata).length > 0 && (
            <div className="mt-1 pt-1 border-t border-gray-600">
              <h4 className="text-xs font-semibold text-gray-300 mb-0.5">Details:</h4>
              {Object.entries(photo.metadata).map(([key, value]) => (
                <p key={key} className="text-xs text-gray-400">
                  <span className="capitalize">{key.replace(/_/g, ' ')}:</span> {String(value)}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderGridItem = (photo: PhotoDef, albumIdForBackNav?: string) => (
    <button 
        key={photo.photoId} 
        onClick={() => handlePhotoClick(photo.photoId, albumIdForBackNav)} 
        className="aspect-square bg-gray-700 rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-400 relative group"
    >
        <img src={photo.url} alt={photo.caption || photo.filename} className="w-full h-full object-cover" />
        {photo.isVideo && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircleIcon className="w-10 h-10 text-white/80" />
            </div>
        )}
    </button>
  );


  if (appData.currentView === 'album_detail' && appData.selectedAlbumId) {
    const album = appData.albums.find(a => a.albumId === appData.selectedAlbumId);
    if (!album) return <p>Album not found.</p>;
    return (
      <div className="h-full flex flex-col">
        {renderHeader(album.albumName, true, () => updateAppData({currentView: 'albums_tab', selectedAlbumId: undefined}))}
        <div className="grid grid-cols-3 gap-1 p-1 flex-grow overflow-y-auto scrollbar-hide">
          {album.photos.map(photo => renderGridItem(photo, album.albumId))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-white">
       {!appData.selectedAlbumId && !appData.selectedPhotoId && renderHeader("SnapVault", false)}
       {renderTabs()}
      <div className="flex-grow overflow-y-auto scrollbar-hide p-1">
        {appData.activeTab === 'photos' && (
          <div className="grid grid-cols-3 gap-1">
            {getAllPhotos().map(photo => renderGridItem(photo))}
          </div>
        )}
        {appData.activeTab === 'albums' && (
          <div className="grid grid-cols-2 gap-2 p-2">
            {appData.albums.map(album => {
              const coverPhoto = album.photos.find(p => p.photoId === album.coverPhotoId) || album.photos[0];
              return (
                <button key={album.albumId} onClick={() => handleAlbumClick(album.albumId)} className="aspect-[4/3] bg-gray-700 rounded-lg overflow-hidden relative shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 group">
                  {coverPhoto && <img src={coverPhoto.url} alt={album.albumName} className="w-full h-full object-cover" />}
                  {coverPhoto?.isVideo && (
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircleIcon className="w-10 h-10 text-white/80" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm">
                    <p className="text-sm font-semibold truncate">{album.albumName}</p>
                    <p className="text-xs text-gray-300">{album.photos.length} items</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapVaultApp;
