
import React, { useState, useEffect } from 'react';
import { PlayerStoryState, GameData, EvidenceItem } from '../types'; // PlayerState -> PlayerStoryState

interface DataRepositoryProps {
  playerState: PlayerStoryState; // Changed
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void; // Changed
}

const DataRepository: React.FC<DataRepositoryProps> = ({ playerState, gameData, onPlayerStateChange }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');

  const discoveredEvidenceItems: EvidenceItem[] = playerState.discoveredEvidenceIds
    .map(id => {
        const evidenceTemplate = gameData.evidence[id];
        if (!evidenceTemplate) return undefined;
        return { ...evidenceTemplate, id, discovered: true }; // Ensure id is passed through, add 'discovered'
    })
    .filter(item => item !== undefined) as EvidenceItem[];

  useEffect(() => {
    if (selectedEvidence && playerState.evidenceNotes) {
      setCurrentNote(playerState.evidenceNotes[selectedEvidence.id] || '');
    } else {
      setCurrentNote('');
    }
  }, [selectedEvidence, playerState.evidenceNotes]);
  
  useEffect(() => {
    if (selectedEvidence && !discoveredEvidenceItems.find(item => item.id === selectedEvidence.id)) {
        setSelectedEvidence(null);
    }
  }, [discoveredEvidenceItems, selectedEvidence]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setCurrentNote(newNote);
    if (selectedEvidence) {
      const updatedNotes = {
        ...playerState.evidenceNotes,
        [selectedEvidence.id]: newNote,
      };
      onPlayerStateChange({ ...playerState, evidenceNotes: updatedNotes });
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, evidenceId: string) => {
    event.dataTransfer.setData('text/plain', evidenceId);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="h-full flex flex-col p-2 md:p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl text-gray-300">
      <h2 className="text-xl font-semibold text-teal-400 mb-3 border-b border-gray-700 pb-2">Data Repository</h2>
      {discoveredEvidenceItems.length === 0 ? (
        <p className="text-gray-400 italic">収集された証拠はまだありません。ファイルシステムを探索し、アイテムを分析してください。</p>
      ) : (
        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 overflow-y-auto pr-2 border-r border-gray-700 terminal-output">
            <ul className="space-y-1">
              {discoveredEvidenceItems.map(item => (
                <li 
                  key={item.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors cursor-grab ${selectedEvidence?.id === item.id ? 'bg-gray-700 text-teal-300' : 'text-gray-300 hover:text-teal-400'}`}
                  onClick={() => setSelectedEvidence(item)}
                  role="button" // Though draggable, it's also clickable
                  tabIndex={0} // Make it focusable
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedEvidence(item);}}
                >
                  <span className="font-mono text-xs text-gray-500 mr-2">{item.id}</span> {item.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-2/3 overflow-y-auto pl-2 terminal-output">
            {selectedEvidence ? (
              <div>
                <h3 className="text-lg font-semibold text-teal-400 mb-2">{selectedEvidence.title}</h3>
                <p className="text-xs text-gray-500 mb-1">ID: {selectedEvidence.id} | 種類: {selectedEvidence.type} | ソース: {selectedEvidence.source || '該当なし'}</p>
                <pre className="whitespace-pre-wrap bg-gray-900 p-3 rounded text-sm text-gray-300 mb-4">{selectedEvidence.content}</pre>
                <div className="mt-4">
                  <label htmlFor={`evidence-note-${selectedEvidence.id}`} className="block text-sm font-medium text-teal-300 mb-1">
                    メモ:
                  </label>
                  <textarea
                    id={`evidence-note-${selectedEvidence.id}`}
                    rows={6}
                    className="w-full p-2 bg-gray-900 text-gray-300 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 terminal-output"
                    value={currentNote}
                    onChange={handleNoteChange}
                    placeholder="この証拠に関するメモを入力..."
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center mt-10">詳細を表示する証拠アイテムを選択してください。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRepository;
