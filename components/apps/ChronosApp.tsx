
import React from 'react';
import { PlayerStoryState, GameData, AppState, ChronosAppData, CalendarEventDef } from '../../types';
import { ChevronLeftIcon, CalendarDaysIcon, PlusCircleIcon } from '../icons';

interface ChronosAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const ChronosApp: React.FC<ChronosAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['chronos'];
  const appData = appState.appSpecificData as ChronosAppData;

  const updateAppData = (newData: Partial<ChronosAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'chronos': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const sortedEvents = [...appData.events].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const renderEventItem = (event: CalendarEventDef) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const isAllDay = event.isAllDay || (endDate.getTime() - startDate.getTime() >= 24 * 60 * 60 * 1000 - 1000);


    return (
      <div key={event.eventId} className="p-3 mb-2 bg-white/5 rounded-lg shadow hover:bg-white/10 cursor-pointer" onClick={() => updateAppData({selectedEventId: event.eventId, currentView: 'event_detail'})}>
        <h3 className="font-semibold text-purple-300">{event.title}</h3>
        <p className="text-xs text-gray-300">
          {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          {isAllDay ? ' (All Day)' : `, ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {event.location && <p className="text-xs text-gray-400">Location: {event.location}</p>}
        {appData.currentView === 'event_detail' && event.description && <p className="text-sm mt-1 text-gray-200 whitespace-pre-wrap">{event.description}</p>}
      </div>
    );
  };
  
  if (appData.currentView === 'event_detail' && appData.selectedEventId) {
    const event = appData.events.find(e => e.eventId === appData.selectedEventId);
    if (!event) return <p>Event not found</p>;
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm">
          <button onClick={() => updateAppData({ currentView: 'agenda', selectedEventId: undefined })} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Back to agenda">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-purple-300 truncate">{event.title}</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4 scrollbar-hide">
          {renderEventItem(event)}
          {/* More details like attendees, edit/delete buttons could go here */}
        </div>
      </div>
    );
  }


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
        {/* Placeholder for view mode switcher (Month/Week/Day) */}
        <button className="p-1 hover:bg-white/10 rounded-full" aria-label="Today">
            <CalendarDaysIcon className="w-6 h-6"/>
        </button>
      </div>

      {/* Events List (Agenda View) */}
      <div className="flex-grow overflow-y-auto p-3 scrollbar-hide">
        {sortedEvents.length === 0 && (
          <p className="text-center text-gray-400 mt-10">No upcoming events.</p>
        )}
        {sortedEvents.map(renderEventItem)}
      </div>
      
      {/* FAB Placeholder */}
      <button className="absolute bottom-6 right-6 p-3 bg-purple-600 hover:bg-purple-500 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400" aria-label="Add new event">
        <PlusCircleIcon className="w-7 h-7 text-white" />
      </button>
    </div>
  );
};

export default ChronosApp;