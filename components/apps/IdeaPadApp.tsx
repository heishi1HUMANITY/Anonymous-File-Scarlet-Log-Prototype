
import React from 'react';
import { PlayerStoryState, GameData, AppState, IdeaPadAppData, NoteDef } from '../../types';
import { ChevronLeftIcon, LightBulbIcon, PlusCircleIcon } from '../icons'; // LightBulb or similar for notes

interface IdeaPadAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const IdeaPadApp: React.FC<IdeaPadAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['ideapad'];
  const appData = appState.appSpecificData as IdeaPadAppData;

  const updateAppData = (newData: Partial<IdeaPadAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'ideapad': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };
  
  const sortedNotes = [...appData.notes].sort((a,b) => new Date(b.modifiedTimestamp).getTime() - new Date(a.modifiedTimestamp).getTime());

  const renderNoteListItem = (note: NoteDef) => (
    <button
      key={note.noteId}
      onClick={() => updateAppData({ selectedNoteId: note.noteId, currentView: 'note_detail' })}
      className="w-full p-3 mb-2 bg-yellow-600/10 hover:bg-yellow-500/20 rounded-lg text-left shadow"
      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
    >
      {note.title && <h3 className="font-semibold text-yellow-300 truncate">{note.title}</h3>}
      <p className="text-sm text-gray-300 truncate h-10">{note.content.split('\n')[0]}</p>
      <p className="text-xs text-gray-400 mt-1">{new Date(note.modifiedTimestamp).toLocaleDateString()}</p>
    </button>
  );

  if (appData.currentView === 'note_detail' && appData.selectedNoteId) {
    const note = appData.notes.find(n => n.noteId === appData.selectedNoteId);
    if (!note) return <p>Note not found.</p>;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-md shadow-sm">
          <button onClick={() => updateAppData({ currentView: 'list', selectedNoteId: undefined })} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Back to notes list">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-yellow-300 truncate">{note.title || "Note"}</h2>
          {/* Placeholder for edit/delete */}
          <div className="w-6"></div> 
        </div>
        <div className="flex-grow overflow-y-auto p-4 scrollbar-hide bg-yellow-700/5 rounded-b-lg">
          {note.title && <h3 className="text-lg font-semibold text-yellow-200 mb-2">{note.title}</h3>}
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{note.content}</p>
          <p className="text-xs text-yellow-400 mt-4">Last modified: {new Date(note.modifiedTimestamp).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-yellow-300">{appState.appName}</h1>
        </div>
        {/* Placeholder for view mode (list/grid) or sort */}
         <button className="p-1 hover:bg-white/10 rounded-full" aria-label="App Options">
            <LightBulbIcon className="w-6 h-6 text-yellow-400"/>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-3 scrollbar-hide">
        {sortedNotes.length === 0 && (
          <p className="text-center text-gray-400 mt-10">No notes yet. Tap the '+' to create one.</p>
        )}
        {sortedNotes.map(renderNoteListItem)}
      </div>
      
      {/* FAB Placeholder */}
      <button className="absolute bottom-6 right-6 p-3 bg-yellow-500 hover:bg-yellow-400 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-300" aria-label="Add new note">
        <PlusCircleIcon className="w-7 h-7 text-gray-800" />
      </button>
    </div>
  );
};

export default IdeaPadApp;