
import React from 'react';
import { PlayerStoryState, GameData, AppState, GeoMapperAppData, GeoMapperSavedPlaceDef } from '../../types';
import { ChevronLeftIcon, MapPinIcon, SearchIcon } from '../icons';

interface GeoMapperAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const GeoMapperApp: React.FC<GeoMapperAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['geomapper'];
  const appData = appState.appSpecificData as GeoMapperAppData;

  const updateAppData = (newData: Partial<GeoMapperAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'geomapper': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const renderMapView = () => (
    <div className="flex-grow bg-gray-700 relative">
      {/* Placeholder Static Map Image */}
      <img src="/assets/maps/placeholder_city_map.png" alt="City Map Placeholder" className="w-full h-full object-cover opacity-80" />
      <div className="absolute top-2 left-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-lg flex items-center">
        <SearchIcon className="w-5 h-5 text-gray-300 mr-2" />
        <input type="text" placeholder="Search places" className="flex-grow bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none" />
      </div>
      {/* Placeholder for current location button, layers, etc. */}
    </div>
  );
  
  const renderPlaceDetailView = () => {
    const place = appData.savedPlaces.find(p => p.placeId === appData.selectedPlaceId);
    if(!place) {
        updateAppData({ currentView: 'map', selectedPlaceId: undefined });
        return null;
    }
    return (
        <div className="p-4">
            <button onClick={() => updateAppData({ currentView: 'map', selectedPlaceId: undefined })} className="mb-2 text-sm text-purple-300 hover:underline">{'< Back to Map'}</button>
            <h2 className="text-xl font-semibold text-purple-300 mb-1">{place.name}</h2>
            {place.address && <p className="text-sm text-gray-300 mb-1">{place.address}</p>}
            <p className="text-xs text-gray-400">Lat: {place.latitude.toFixed(4)}, Lon: {place.longitude.toFixed(4)}</p>
            {place.notes && <p className="text-sm mt-2 p-2 bg-white/5 rounded whitespace-pre-wrap">{place.notes}</p>}
            {/* Placeholder for Directions button */}
            <button className="mt-4 w-full p-2 bg-purple-600 hover:bg-purple-500 rounded-md text-sm">Directions (Placeholder)</button>
        </div>
    );
  }

  const renderSavedPlacesList = () => (
    <div className="p-3">
        <h3 className="text-md font-semibold text-gray-200 mb-2">Saved Places</h3>
        {appData.savedPlaces.length === 0 && <p className="text-xs text-gray-400">No saved places yet.</p>}
        <ul className="space-y-1">
            {appData.savedPlaces.map(place => (
                <li key={place.placeId}>
                    <button 
                        onClick={() => updateAppData({selectedPlaceId: place.placeId, currentView: 'place_detail'})}
                        className="w-full text-left p-2 hover:bg-white/10 rounded-md"
                    >
                        <p className="font-medium text-purple-300">{place.name}</p>
                        {place.address && <p className="text-xs text-gray-400 truncate">{place.address}</p>}
                    </button>
                </li>
            ))}
        </ul>
    </div>
  );


  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-purple-300">{appState.appName}</h1>
        </div>
        <button className="p-1 hover:bg-white/10 rounded-full" aria-label="Map options">
          <MapPinIcon className="w-6 h-6 text-purple-400" />
        </button>
      </div>

      {/* Main Content Area */}
      {appData.currentView === 'place_detail' && appData.selectedPlaceId ? (
          renderPlaceDetailView()
      ) : (
        <div className="flex-grow flex flex-col overflow-hidden">
            {renderMapView()}
            <div className="h-1/3 overflow-y-auto scrollbar-hide p-2 border-t border-white/10 bg-black/30 backdrop-blur-sm">
                {renderSavedPlacesList()}
                {/* Placeholder for search history or nearby places */}
            </div>
        </div>
      )}
    </div>
  );
};

export default GeoMapperApp;