
import React from 'react';
import { PlayerStoryState, GameData, AppState, ContactSphereAppData, SmartphoneContactDef } from '../../types';
import { ChevronLeftIcon, UserCircleIcon } from '../icons'; // Assuming UserCircleIcon for placeholder

interface ContactSphereAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const ContactSphereApp: React.FC<ContactSphereAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['contactsphere'];
  const appData = appState.appSpecificData as ContactSphereAppData;

  const updateAppData = (newData: Partial<ContactSphereAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'contactsphere': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const selectedContact = appData.selectedContactId ? appData.contacts.find(c => c.id === appData.selectedContactId) : null;

  if (selectedContact) {
    return (
      <div className="h-full flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm">
          <button onClick={() => updateAppData({ selectedContactId: undefined })} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Back to contacts list">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-purple-300">{selectedContact.name}</h2>
        </div>

        {/* Contact Details */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
          <div className="flex flex-col items-center mb-4">
            {selectedContact.profilePictureUrl ? (
              <img src={selectedContact.profilePictureUrl} alt={selectedContact.name} className="w-28 h-28 rounded-full mb-3 shadow-lg border-2 border-purple-400/50" />
            ) : (
              <UserCircleIcon className="w-28 h-28 text-gray-500 mb-3" />
            )}
            <h3 className="text-2xl font-semibold">{selectedContact.name}</h3>
            {selectedContact.organization && <p className="text-sm text-gray-400">{selectedContact.organization}</p>}
          </div>

          {selectedContact.phoneNumbers && selectedContact.phoneNumbers.length > 0 && (
            <div className="bg-white/5 p-3 rounded-lg">
              {selectedContact.phoneNumbers.map(pn => (
                <div key={pn.number} className="mb-1.5">
                  <p className="text-xs text-purple-300 uppercase">{pn.label}</p>
                  <p className="text-sm">{pn.number}</p>
                </div>
              ))}
            </div>
          )}

          {selectedContact.emailAddresses && selectedContact.emailAddresses.length > 0 && (
             <div className="bg-white/5 p-3 rounded-lg">
              {selectedContact.emailAddresses.map(em => (
                <div key={em.address} className="mb-1.5">
                  <p className="text-xs text-purple-300 uppercase">{em.label}</p>
                  <p className="text-sm">{em.address}</p>
                </div>
              ))}
            </div>
          )}
           {selectedContact.address && (
             <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-xs text-purple-300 uppercase">Address</p>
                <p className="text-sm whitespace-pre-line">{selectedContact.address}</p>
            </div>
          )}
          {selectedContact.notes && (
            <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-xs text-purple-300 uppercase">Notes</p>
                <p className="text-sm whitespace-pre-line">{selectedContact.notes}</p>
            </div>
          )}
          {/* Placeholder action buttons */}
          <div className="flex space-x-2 mt-4">
             <button className="flex-1 p-2.5 bg-purple-600/70 hover:bg-purple-500/80 rounded-lg text-sm">Call (Placeholder)</button>
             <button className="flex-1 p-2.5 bg-teal-600/70 hover:bg-teal-500/80 rounded-lg text-sm">Message (Placeholder)</button>
          </div>
        </div>
      </div>
    );
  }

  // Contact List View (Default)
  return (
    <div className="h-full flex flex-col text-white">
      <div className="p-4 sticky top-0 bg-black/50 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold text-purple-300 mb-1">Contacts</h1>
        {/* Placeholder Search Bar */}
      </div>
      <div className="flex-grow overflow-y-auto scrollbar-hide">
        {appData.contacts.length === 0 && (
            <p className="text-center text-gray-400 mt-10">No contacts found.</p>
        )}
        {appData.contacts.sort((a,b) => a.name.localeCompare(b.name)).map((contact) => (
          <button
            key={contact.id}
            onClick={() => updateAppData({ selectedContactId: contact.id })}
            className="w-full flex items-center p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5"
            aria-label={`View details for ${contact.name}`}
          >
            {contact.profilePictureUrl ? (
              <img src={contact.profilePictureUrl} alt={contact.name} className="w-10 h-10 rounded-full mr-3" />
            ) : (
              <UserCircleIcon className="w-10 h-10 rounded-full mr-3 text-gray-500" />
            )}
            <span className="text-md font-medium">{contact.name}</span>
          </button>
        ))}
      </div>
      {/* Placeholder FAB for new contact */}
    </div>
  );
};

export default ContactSphereApp;
