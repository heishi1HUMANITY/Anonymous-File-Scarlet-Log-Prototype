
import React from 'react';
import { PlayerStoryState, GameData, AppState, WebStalkerAppData, WebContentDef, BrowserBookmarkDef, BrowserHistoryItemDef } from '../../types';
import { ChevronLeftIcon, ArrowPathIcon, ChevronRightIcon, BookmarkIcon, ClockIcon, SearchIcon } from '../icons';

interface WebStalkerAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const WebStalkerApp: React.FC<WebStalkerAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['webstalker'];
  const appData = appState.appSpecificData as WebStalkerAppData;

  const updateAppData = (newData: Partial<WebStalkerAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'webstalker': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const loadUrl = (url: string) => {
    const content = gameData.initialWebContents?.[url];
    updateAppData({ currentUrl: url, currentContent: content, currentView: 'browser' });
    // Add to history if not already the most recent entry
    if (content && (!appData.history.length || appData.history[0].url !== url)) {
        const newHistoryItem: BrowserHistoryItemDef = {
            id: `hist_${Date.now()}`,
            title: content.title,
            url: url,
            timestamp: new Date().toISOString()
        };
        updateAppData({ history: [newHistoryItem, ...appData.history].slice(0, 50) });
    }
  };
  
  const navigateBack = () => {
    // Placeholder for actual history navigation
    console.log("Navigate back (placeholder)");
  };
  const navigateForward = () => {
     // Placeholder
    console.log("Navigate forward (placeholder)");
  };
  const refreshPage = () => {
    if(appData.currentUrl) loadUrl(appData.currentUrl);
  };


  const renderBrowserView = () => (
    <div className="flex flex-col h-full bg-gray-100 text-black dark:bg-gray-800 dark:text-white">
      {/* Address Bar */}
      <div className="p-2 bg-gray-200 dark:bg-gray-700 flex items-center gap-1 shadow">
        <button onClick={navigateBack} className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" aria-label="Back"><ChevronLeftIcon className="w-5 h-5" /></button>
        <button onClick={navigateForward} className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" aria-label="Forward"><ChevronRightIcon className="w-5 h-5" /></button>
        <button onClick={refreshPage} className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" aria-label="Refresh"><ArrowPathIcon className="w-5 h-5" /></button>
        <input
          type="text"
          value={appData.currentUrl || ''}
          onChange={(e) => updateAppData({ currentUrl: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && appData.currentUrl && loadUrl(appData.currentUrl)}
          placeholder="Search or type URL"
          className="flex-grow p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        {/* Placeholder for tabs/menu */}
      </div>
      {/* Web Content */}
      <div className="flex-grow overflow-y-auto p-4 scrollbar-hide">
        {appData.currentContent ? (
          <>
            <h1 className="text-xl font-bold mb-2 text-purple-600 dark:text-purple-400">{appData.currentContent.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: appData.currentContent.htmlContent || "<p>No content loaded.</p>" }} />
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-2"/>
            <p>Enter a URL or search. Bookmarks and History available via menu.</p>
            <button onClick={() => loadUrl("game://news.example/article/luna-missing")} className="mt-4 px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm">Load Sample Page</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookmarksView = () => (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2 text-purple-400">Bookmarks</h2>
      {appData.bookmarks.length === 0 && <p className="text-gray-400">No bookmarks saved.</p>}
      <ul className="space-y-1">
        {appData.bookmarks.map(bm => (
          <li key={bm.id}>
            <button onClick={() => loadUrl(bm.url)} className="block w-full text-left p-2 hover:bg-white/10 rounded">
              <p className="font-medium truncate text-gray-100">{bm.title}</p>
              <p className="text-xs text-purple-300 truncate">{bm.url}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  
  const renderHistoryView = () => (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2 text-purple-400">History</h2>
      {appData.history.length === 0 && <p className="text-gray-400">No history yet.</p>}
      <ul className="space-y-1">
        {appData.history.map(item => (
          <li key={item.id}>
            <button onClick={() => loadUrl(item.url)} className="block w-full text-left p-2 hover:bg-white/10 rounded">
              <p className="font-medium truncate text-gray-100">{item.title}</p>
              <p className="text-xs text-purple-300 truncate">{item.url}</p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderContent = () => {
    switch(appData.currentView) {
      case 'bookmarks': return renderBookmarksView();
      case 'history': return renderHistoryView();
      case 'browser':
      default:
        return renderBrowserView();
    }
  };
  
  return (
    <div className="h-full flex flex-col text-white">
       {/* App Header */}
      <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-20">
          <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-purple-300">{appState.appName}</h1>
          {/* Placeholder for more browser controls like tabs */}
      </div>
      <div className="flex-grow overflow-hidden">
          {renderContent()}
      </div>
      {/* Bottom Navigation (placeholder or simplified) */}
       <div className="flex justify-around items-center p-2 bg-gray-700/50 backdrop-blur-md border-t border-white/10">
          <button onClick={() => updateAppData({ currentView: 'browser' })} className={`p-2 rounded-md ${appData.currentView === 'browser' ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`} aria-label="Browser"><SearchIcon className="w-5 h-5" /></button>
          <button onClick={() => updateAppData({ currentView: 'bookmarks' })} className={`p-2 rounded-md ${appData.currentView === 'bookmarks' ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`} aria-label="Bookmarks"><BookmarkIcon className="w-5 h-5" /></button>
          <button onClick={() => updateAppData({ currentView: 'history' })} className={`p-2 rounded-md ${appData.currentView === 'history' ? 'text-purple-400' : 'text-gray-300 hover:text-purple-300'}`} aria-label="History"><ClockIcon className="w-5 h-5" /></button>
          {/* Add more buttons like Tabs */}
      </div>
    </div>
  );
};

export default WebStalkerApp;