import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WhisperTalkApp from '../WhisperTalkApp';
import { PlayerStoryState, GameData, WhisperTalkAppData, ConversationThread, InboxMessage } from '../../../types';

// Mock the icons to prevent issues during testing
jest.mock('../../icons', () => ({
  ChevronLeftIcon: () => <div data-testid="chevron-left-icon" />,
  PaperAirplaneIcon: () => <div data-testid="paper-airplane-icon" />,
  CameraIconSolid: () => <div data-testid="camera-icon" />,
  MicrophoneIcon: () => <div data-testid="microphone-icon" />,
  UserCircleIcon: () => <div data-testid="user-circle-icon" />,
}));

const mockGameData: GameData = {
  gameSetting: "Test Setting",
  playerCharacter: { id: 'player', name: 'Player One', profilePictureUrl: 'player.png' },
  characters: {
    npc1: { id: 'npc1', name: 'NPC One', profilePictureUrl: 'npc1.png', smartphoneContactId: 'contact_npc1' },
  },
  smartphoneContacts: [
    { id: 'contact_npc1', characterId: 'npc1', name: 'NPC One', profilePictureUrl: 'npc1.png', isBlocked: false },
  ],
  storyFlags: {},
  storyEvents: [],
  locations: {},
  items: {},
  dialogues: {},
  quests: {},
  narrativeSnippets: {},
  playerActions: {},
  gameVariables: {},
  achievements: [],
  soundtrack: {},
  loadingScreenTips: [],
  accessCodes: [],
  networkNodes: {},
  emails: {},
  browserBookmarks: [],
  mapMarkers: [],
  helpTopics: [],
};

const initialThreadId = 'thread1';
const npcId = 'npc1';

const mockInitialPlayerState: PlayerStoryState = {
  playerCharacterId: 'player',
  currentLocation: 'start_location',
  inventory: [],
  storyFlags: {},
  activeQuests: [],
  completedQuests: [],
  activeDialogues: [],
  completedDialogues: [],
  currentDateTime: new Date().toISOString(),
  smartphoneData: {
    contacts: ['contact_npc1'],
    messages: [], // Keep this empty as threads will populate
    callHistory: [],
    installedApps: ['whispertalk'],
    notifications: [],
  },
  smartphoneInstalledApps: {
    whispertalk: {
      id: 'whispertalk',
      name: 'WhisperTalk',
      iconUrl: 'whispertalk.png',
      isSystemApp: true,
      appSpecificData: {
        currentView: 'chat_screen', // Start in chat screen for easier testing
        selectedThreadId: initialThreadId,
      } as WhisperTalkAppData,
    },
  },
  inboxThreads: {
    [initialThreadId]: {
      threadId: initialThreadId,
      participants: ['player', npcId],
      messages: [
        {
          id: 'msg1',
          threadId: initialThreadId,
          timestamp: new Date(Date.now() - 100000).toISOString(),
          senderId: npcId,
          recipientId: 'player',
          body: 'Hello there!',
          type: 'received',
          isRead: true,
        },
      ],
      lastMessageTimestamp: new Date(Date.now() - 100000).toISOString(),
      hasUnread: false,
    } as ConversationThread,
  },
  gameVariables: {},
  playerStats: {},
  playerPosition: { x: 0, y: 0, z: 0 },
  playerAchievements: [],
  playerSettings: {},
};

describe('WhisperTalkApp', () => {
  let mockOnPlayerStateChange: jest.Mock;
  let mockGoHome: jest.Mock;
  let mockOnSendMessage: jest.Mock;
  let mockOnMarkAsRead: jest.Mock;
  let scrollIntoViewMock: jest.Mock;

  beforeEach(() => {
    mockOnPlayerStateChange = jest.fn();
    mockGoHome = jest.fn();
    mockOnSendMessage = jest.fn(); // Not directly used by the UI send, but good to have
    mockOnMarkAsRead = jest.fn();

    scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    
    // Ensure each test starts with a fresh state by deep cloning
    const freshPlayerState = JSON.parse(JSON.stringify(mockInitialPlayerState));
     // Explicitly set appSpecificData to start in chat_screen with the selected thread
    if (freshPlayerState.smartphoneInstalledApps.whispertalk) {
        (freshPlayerState.smartphoneInstalledApps.whispertalk.appSpecificData as WhisperTalkAppData) = {
            currentView: 'chat_screen',
            selectedThreadId: initialThreadId,
        };
    }


    render(
      <WhisperTalkApp
        playerState={freshPlayerState}
        gameData={mockGameData}
        onPlayerStateChange={mockOnPlayerStateChange}
        goHome={mockGoHome}
        onSendMessage={mockOnSendMessage}
        onMarkAsRead={mockOnMarkAsRead}
      />
    );
  });

  test('renders initial message from NPC', () => {
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  test('player sends a message and it appears, input clears, and state updates', async () => {
    const inputField = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(inputField, { target: { value: 'Player message' } });
    expect(inputField).toHaveValue('Player message');
    fireEvent.click(sendButton);

    // Check if player's message appears
    expect(screen.getByText('Player message')).toBeInTheDocument();
    // Check if input field is cleared
    expect(inputField).toHaveValue('');

    // Check onPlayerStateChange for player message
    expect(mockOnPlayerStateChange).toHaveBeenCalledTimes(1);
    const firstCallArgs = mockOnPlayerStateChange.mock.calls[0][0] as PlayerStoryState;
    const playerMessages = firstCallArgs.inboxThreads[initialThreadId].messages;
    const lastPlayerMessage = playerMessages[playerMessages.length - 1];

    expect(lastPlayerMessage.body).toBe('Player message');
    expect(lastPlayerMessage.senderId).toBe('player');
    expect(lastPlayerMessage.recipientId).toBe(npcId);
    expect(lastPlayerMessage.isRead).toBe(true);
  });

  test('NPC responds after player sends a message and state updates', async () => {
    const inputField = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(inputField, { target: { value: 'Test for NPC response' } });
    fireEvent.click(sendButton);

    // Wait for NPC response
    await waitFor(() => {
      expect(screen.getByText("Thanks for your message! I'll get back to you soon.")).toBeInTheDocument();
    }, { timeout: 2000 }); // Timeout for simulated NPC response

    // Check onPlayerStateChange for NPC message (should be the second call)
    // Call 0: Player message state update
    // Call 1: NPC message state update
    expect(mockOnPlayerStateChange).toHaveBeenCalledTimes(2); 
    const secondCallArgs = mockOnPlayerStateChange.mock.calls[1][0] as PlayerStoryState;
    const npcMessages = secondCallArgs.inboxThreads[initialThreadId].messages;
    const lastNpcMessage = npcMessages[npcMessages.length - 1];

    expect(lastNpcMessage.body).toBe("Thanks for your message! I'll get back to you soon.");
    expect(lastNpcMessage.senderId).toBe(npcId);
    expect(lastNpcMessage.recipientId).toBe('player');
  });

  test('chat history scrolls when new messages are added', async () => {
    const inputField = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message');

    // Initial scroll for existing messages
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1); 

    fireEvent.change(inputField, { target: { value: 'Scroll test message 1' } });
    fireEvent.click(sendButton);

    // Wait for player message to render and trigger scroll
    await waitFor(() => expect(screen.getByText('Scroll test message 1')).toBeInTheDocument());
    // Scroll for player message + initial render
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);


    // Wait for NPC response to render and trigger scroll
    await waitFor(() => {
      expect(screen.getByText("Thanks for your message! I'll get back to you soon.")).toBeInTheDocument();
    }, { timeout: 2000 });
    // Scroll for NPC message + player message + initial render
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(3);
  });
  
  test('send button is disabled when input is empty and enabled when not', () => {
    const inputField = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByLabelText('Send message') as HTMLButtonElement;

    // Initially, if there's no pre-filled message (which there isn't by default setup)
    expect(sendButton.disabled).toBe(true);

    fireEvent.change(inputField, { target: { value: 'Not empty' } });
    expect(sendButton.disabled).toBe(false);

    fireEvent.change(inputField, { target: { value: '  ' } }); // Whitespace only
    expect(sendButton.disabled).toBe(true);

    fireEvent.change(inputField, { target: { value: '' } }); // Empty again
    expect(sendButton.disabled).toBe(true);
  });

  test('sending message with enter key press', async () => {
    const inputField = screen.getByPlaceholderText('Type a message...');
    
    fireEvent.change(inputField, { target: { value: 'Enter key test' } });
    fireEvent.keyPress(inputField, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(screen.getByText('Enter key test')).toBeInTheDocument();
    expect(inputField).toHaveValue('');
    expect(mockOnPlayerStateChange).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("Thanks for your message! I'll get back to you soon.")).toBeInTheDocument();
    }, { timeout: 2000 });
    expect(mockOnPlayerStateChange).toHaveBeenCalledTimes(2);
  });

  test('onMarkAsRead is called when opening a chat screen', () => {
    // In beforeEach, setCurrentView is effectively called by setting initial state.
    // We need to simulate going to chat list and back to chat screen.
    
    // 1. Reset player state to be on chat_list view initially for this specific test
    const playerStateChatList: PlayerStoryState = JSON.parse(JSON.stringify(mockInitialPlayerState));
    if (playerStateChatList.smartphoneInstalledApps.whispertalk) {
        (playerStateChatList.smartphoneInstalledApps.whispertalk.appSpecificData as WhisperTalkAppData) = {
            currentView: 'chat_list',
            selectedThreadId: undefined,
        };
    }
    // Mark the thread as unread for this test
    playerStateChatList.inboxThreads[initialThreadId].hasUnread = true;
    playerStateChatList.inboxThreads[initialThreadId].messages.forEach(m => m.isRead = false);


    const mockOnMarkAsReadLocal = jest.fn(); // Local mock for this specific test

    render(
      <WhisperTalkApp
        playerState={playerStateChatList}
        gameData={mockGameData}
        onPlayerStateChange={mockOnPlayerStateChange} // Can reuse the global one, or make a new one
        goHome={mockGoHome}
        onSendMessage={mockOnSendMessage}
        onMarkAsRead={mockOnMarkAsReadLocal}
      />
    );
    
    // Find the button for the specific thread and click it
    // The name comes from `getContactDisplay` -> gameData.characters[npcId].name
    const chatButton = screen.getByLabelText(`Chat with ${mockGameData.characters[npcId].name}`);
    fireEvent.click(chatButton);

    // onMarkAsRead should be called when the chat screen is opened
    expect(mockOnMarkAsReadLocal).toHaveBeenCalledWith(initialThreadId);
  });

});
