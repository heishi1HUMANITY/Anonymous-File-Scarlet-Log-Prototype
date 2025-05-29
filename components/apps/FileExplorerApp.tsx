
import React from 'react';
import { PlayerStoryState, GameData, AppState, FileExplorerAppData, FileSystemStructure, FileSystemItem, FileSystemNodeType, FileNode } from '../../types';
import { ChevronLeftIcon, FolderIcon, DocumentTextIcon } from '../icons'; // Assuming generic icons
import { LUNAS_PHONE_SHELL_ID } from '../../src/constants'; // To identify the phone's FS
import { getNodeFromPath, resolvePath } from '../../services/fileSystemService';

interface FileExplorerAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const FileExplorerApp: React.FC<FileExplorerAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['fileexplorer_sm'];
  const appData = appState.appSpecificData as FileExplorerAppData;
  const phoneFileSystem = playerState.deviceFileSystems[LUNAS_PHONE_SHELL_ID];

  const updateAppData = (newData: Partial<FileExplorerAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'fileexplorer_sm': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const navigateToPath = (newPath: string) => {
    const resolved = resolvePath(appData.currentPath, newPath);
    const node = getNodeFromPath(resolved, phoneFileSystem);
    if (node && node.type === FileSystemNodeType.DIRECTORY) {
      updateAppData({ currentPath: resolved });
    } else if (node && node.type === FileSystemNodeType.FILE) {
      // Placeholder: Open file or show info. For now, just log or select.
      updateAppData({ selectedFile: node.name });
      console.log("Selected file:", node.name);
    }
  };

  const goUpOneLevel = () => {
    if (appData.currentPath === '/') return;
    const parentPath = resolvePath(appData.currentPath, '..');
    navigateToPath(parentPath);
  };

  const currentDirectoryNode = getNodeFromPath(appData.currentPath, phoneFileSystem);
  let itemsInCurrentDir: FileSystemItem[] = [];
  if (currentDirectoryNode && currentDirectoryNode.type === FileSystemNodeType.DIRECTORY) {
    itemsInCurrentDir = Object.values(currentDirectoryNode.children).sort((a, b) => {
      if (a.type === FileSystemNodeType.DIRECTORY && b.type !== FileSystemNodeType.DIRECTORY) return -1;
      if (a.type !== FileSystemNodeType.DIRECTORY && b.type === FileSystemNodeType.DIRECTORY) return 1;
      return a.name.localeCompare(b.name);
    });
  }
  
  const renderFileItem = (item: FileSystemItem) => (
    <button
      key={item.name}
      onClick={() => navigateToPath(item.name)}
      className="w-full flex items-center p-3 hover:bg-white/10 rounded-lg text-left transition-colors"
      aria-label={item.name}
    >
      {item.type === FileSystemNodeType.DIRECTORY ? 
        <FolderIcon className="w-5 h-5 mr-3 text-yellow-400 flex-shrink-0" /> :
        <DocumentTextIcon className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
      }
      <span className="truncate text-sm">{item.name}</span>
      {/* Placeholder for size/date */}
    </button>
  );

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
            <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-purple-300 truncate">{appState.appName}</h1>
        </div>
        {/* Placeholder for view mode switch (list/grid) or sort */}
      </div>
      
      {/* Path Bar */}
      <div className="p-2 bg-black/30 backdrop-blur-sm text-xs text-gray-300 border-b border-t border-white/10">
        Path: {appData.currentPath}
      </div>

      <div className="flex-grow overflow-y-auto p-2 scrollbar-hide">
        {appData.currentPath !== '/' && (
            <button onClick={goUpOneLevel} className="w-full flex items-center p-3 hover:bg-white/10 rounded-lg text-left transition-colors mb-1">
                <FolderIcon className="w-5 h-5 mr-3 text-yellow-400 opacity-70 flex-shrink-0" />
                <span className="truncate text-sm">.. (Up a level)</span>
            </button>
        )}
        {itemsInCurrentDir.length === 0 && appData.currentPath === '/' && (
            <p className="text-center text-gray-400 mt-10">Root directory appears empty or inaccessible.</p>
        )}
        {itemsInCurrentDir.length === 0 && appData.currentPath !== '/' && (
            <p className="text-center text-gray-400 mt-10">(Empty folder)</p>
        )}
        {itemsInCurrentDir.map(renderFileItem)}
      </div>
    </div>
  );
};

export default FileExplorerApp;