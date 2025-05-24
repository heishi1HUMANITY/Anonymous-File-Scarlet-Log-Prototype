
import React, { useState, useEffect } from 'react';
import { PlayerStoryState, GameData } from '../types'; // EvidenceItem no longer needed for attachments here

interface CharacterProfileProps {
  playerState: PlayerStoryState;
  gameData: GameData; 
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  // onSendEmail prop is removed
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ playerState, gameData, onPlayerStateChange }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');

  const knownCharactersToDisplay = Object.keys(playerState.characterDynamicData).map(charId => {
    const charTemplate = gameData.characters[charId];
    return {
        id: charId,
        name: charTemplate?.name || charId,
        // trustLevel: playerState.characterDynamicData[charId].trustLevel // Trust level removed from display object
    };
  });
  
  const selectedCharacterDetails = selectedCharacterId ? {
      id: selectedCharacterId,
      name: gameData.characters[selectedCharacterId]?.name || selectedCharacterId,
      // trustLevel: playerState.characterDynamicData[selectedCharacterId]?.trustLevel // Trust level removed
  } : null;

  useEffect(() => {
    if (selectedCharacterId) {
      setCurrentNote(playerState.characterNotes[selectedCharacterId] || '');
    } else {
      setCurrentNote('');
    }
  }, [selectedCharacterId, playerState.characterNotes]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setCurrentNote(newNote);
    if (selectedCharacterId) {
      const updatedNotes = {
        ...playerState.characterNotes,
        [selectedCharacterId]: newNote,
      };
      onPlayerStateChange({ ...playerState, characterNotes: updatedNotes });
    }
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-4 bg-gray-800 border-t-0 border border-gray-700 rounded-b-lg shadow-xl text-gray-300">
      {/* h2 title is provided by the tab button in App.tsx */}
      {knownCharactersToDisplay.length === 0 ? (
        <p className="text-gray-400 italic">連絡可能なキャラクターはまだいません。</p>
      ) : (
        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 overflow-y-auto pr-2 border-r-0 md:border-r md:border-gray-700 terminal-output mb-2 md:mb-0">
            <h3 className="text-lg font-semibold text-teal-400 mb-2">連絡先リスト</h3>
            <ul className="space-y-1">
              {knownCharactersToDisplay.map(char => (
                <li key={char.id}>
                  <button
                    onClick={() => setSelectedCharacterId(char.id)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors ${selectedCharacterId === char.id ? 'bg-gray-700 text-teal-300' : 'text-gray-300 hover:text-teal-400'}`}
                    aria-pressed={selectedCharacterId === char.id}
                  >
                    {char.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-2/3 overflow-y-auto md:pl-2 terminal-output flex flex-col">
            {selectedCharacterDetails ? (
              <div className="flex-grow flex flex-col">
                <h3 className="text-lg font-semibold text-teal-400 mb-2">{selectedCharacterDetails.name}</h3>
                {/* Trust level display removed from here */}
                {/* <p className="text-xs text-gray-500 mb-3">信頼度: {selectedCharacterDetails.trustLevel}</p> */}
                
                <div>
                  <label htmlFor={`char-note-${selectedCharacterDetails.id}`} className="block text-sm font-medium text-teal-300 mb-1">
                    連絡先メモ:
                  </label>
                  <textarea
                    id={`char-note-${selectedCharacterDetails.id}`}
                    rows={8}
                    className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 terminal-output"
                    value={currentNote}
                    onChange={handleNoteChange}
                    placeholder="この連絡先に関するプライベートメモ..."
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">連絡先を選択して詳細を表示し、メモを編集してください。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterProfile;
