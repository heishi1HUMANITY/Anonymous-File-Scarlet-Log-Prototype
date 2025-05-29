
import React from 'react';
import { PlayerStoryState, GameData, AppState, MailWiseAppData, EmailAccountDef, EmailDef, FileAttachmentDef, IconProps } from '../../types';
import { 
  ChevronLeftIcon, Bars3Icon, PencilSquareIcon, EnvelopeIcon, DocumentTextIcon,
  PaperclipIcon, CameraIconSolid, ArchiveBoxIcon 
} from '../icons';
import { sanitizeHtml } from '../../utils/htmlSanitizer';

interface MailWiseAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const MailWiseApp: React.FC<MailWiseAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['mailwise'];
  const appData = appState.appSpecificData as MailWiseAppData;

  const getIconForMimeType = (mimeType?: string): React.FC<IconProps> => {
    if (mimeType?.startsWith('image/')) {
      return CameraIconSolid;
    }
    if (mimeType === 'application/pdf') {
      return DocumentTextIcon;
    }
    if (['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/vnd.rar', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'].includes(mimeType || '')) {
      return ArchiveBoxIcon;
    }
    return DocumentTextIcon; // Default
  };

  const updateAppData = (newData: Partial<MailWiseAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'mailwise': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const handleAccountSelect = (accountId: string) => {
    updateAppData({ selectedAccountId: accountId, currentView: 'folder_list', selectedFolderPath: undefined, selectedEmailId: undefined });
  };

  const handleFolderSelect = (folderPath: string) => {
    updateAppData({ selectedFolderPath: folderPath, currentView: 'email_list', selectedEmailId: undefined });
  };

  const handleEmailSelect = (emailId: string) => {
    updateAppData({ selectedEmailId: emailId, currentView: 'email_detail' });
    // Mark email as read
    if (appData.selectedAccountId && appData.selectedFolderPath) {
        const accountIndex = appData.accounts.findIndex(acc => acc.accountId === appData.selectedAccountId);
        if (accountIndex !== -1) {
            const newAccounts = JSON.parse(JSON.stringify(appData.accounts));
            const folder = newAccounts[accountIndex].folders?.[appData.selectedFolderPath];
            if (folder) {
                const emailIndex = folder.findIndex(em => em.emailId === emailId);
                if (emailIndex !== -1 && !folder[emailIndex].isRead) {
                    folder[emailIndex].isRead = true;
                    updateAppData({accounts: newAccounts}); // This will trigger onPlayerStateChange
                }
            }
        }
    }
  };
  
  const getHeaderTitle = (): string => {
    if (appData.currentView === 'email_detail' && appData.selectedEmailId) return "Email";
    if (appData.currentView === 'email_list' && appData.selectedFolderPath) return appData.selectedFolderPath;
    if (appData.currentView === 'folder_list' && appData.selectedAccountId) {
        return appData.accounts.find(acc => acc.accountId === appData.selectedAccountId)?.emailAddress || "Folders";
    }
    return appState.appName;
  };

  const handleBackNavigation = () => {
    if (appData.currentView === 'email_detail') updateAppData({ currentView: 'email_list', selectedEmailId: undefined });
    else if (appData.currentView === 'email_list') updateAppData({ currentView: 'folder_list', selectedFolderPath: undefined });
    else if (appData.currentView === 'folder_list') updateAppData({ currentView: 'account_list', selectedAccountId: undefined });
    else goHome();
  };

  const renderAccountList = () => (
    <div className="p-2">
      {appData.accounts.map(account => (
        <button key={account.accountId} onClick={() => handleAccountSelect(account.accountId)}
          className="w-full p-3 mb-2 bg-white/5 hover:bg-white/10 rounded-lg text-left">
          <p className="font-semibold text-purple-200">{account.username || account.emailAddress}</p>
          <p className="text-xs text-gray-300">{account.emailAddress}</p>
        </button>
      ))}
    </div>
  );

  const renderFolderList = () => {
    const account = appData.accounts.find(acc => acc.accountId === appData.selectedAccountId);
    if (!account || !account.folders) return <p className="p-4 text-gray-400">No folders found for this account.</p>;
    return (
      <div className="p-2">
        {Object.entries(account.folders).map(([folderName, emails]) => (
          <button key={folderName} onClick={() => handleFolderSelect(folderName)}
            className="w-full p-3 mb-2 bg-white/5 hover:bg-white/10 rounded-lg text-left flex justify-between items-center">
            <p className="font-medium text-gray-100">{folderName}</p>
            <span className="text-xs text-gray-400">{emails.filter(e => !e.isRead).length > 0 ? `${emails.filter(e => !e.isRead).length} unread` : ''}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderEmailList = () => {
    const account = appData.accounts.find(acc => acc.accountId === appData.selectedAccountId);
    const emails = account?.folders?.[appData.selectedFolderPath || ''] || [];
    if (emails.length === 0) return <p className="p-4 text-gray-400 text-center">No emails in this folder.</p>;
    
    return (
      <div className="divide-y divide-white/10">
        {emails.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(email => (
          <button key={email.emailId} onClick={() => handleEmailSelect(email.emailId)}
            className={`w-full p-3 text-left ${email.isRead ? 'bg-transparent hover:bg-white/5' : 'bg-purple-500/10 hover:bg-purple-500/20'}`}>
            <div className="flex justify-between items-baseline">
                <p className={`font-semibold truncate ${email.isRead ? 'text-gray-200' : 'text-purple-200'}`}>{email.senderName || email.senderAddress}</p>
                <div className="flex items-center"> {/* Flex container for timestamp and icon */}
                  {email.attachments && email.attachments.length > 0 && (
                    <PaperclipIcon className="w-4 h-4 text-gray-400 mr-1" /> // Changed to PaperclipIcon
                  )}
                  <p className="text-xs text-gray-400 flex-shrink-0">{new Date(email.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
            <p className={`truncate ${email.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>{email.subject}</p>
            <p className="text-xs text-gray-400 truncate">{email.body.substring(0,100)}...</p>
          </button>
        ))}
      </div>
    );
  };

  const renderEmailDetail = () => {
    const account = appData.accounts.find(acc => acc.accountId === appData.selectedAccountId);
    const email = account?.folders?.[appData.selectedFolderPath || '']?.find(em => em.emailId === appData.selectedEmailId);
    if (!email) return <p className="p-4 text-gray-400">Email not found.</p>;

    return (
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-purple-200">{email.subject}</h3>
        <div>
          <p className="text-xs text-gray-400">From: <span className="text-gray-200">{email.senderName || email.senderAddress}</span></p>
          <p className="text-xs text-gray-400">To: <span className="text-gray-200">{email.recipientAddresses.join(', ')}</span></p>
          {email.ccAddresses && email.ccAddresses.length > 0 && (
            <p className="text-xs text-gray-400">Cc: <span className="text-gray-200">{email.ccAddresses.join(', ')}</span></p>
          )}
          {email.bccAddresses && email.bccAddresses.length > 0 && (
            <p className="text-xs text-gray-400">Bcc: <span className="text-gray-200">{email.bccAddresses.join(', ')}</span></p>
          )}
          <p className="text-xs text-gray-400">Date: <span className="text-gray-200">{new Date(email.timestamp).toLocaleString()}</span></p>
        </div>
        <div className="text-sm text-gray-100 bg-white/5 p-3 rounded-md leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body) }} />
        {email.attachments && email.attachments.length > 0 && (
            <div>
                <p className="text-sm font-medium text-gray-300">Attachments:</p>
                <ul className="list-disc list-inside pl-2 text-xs">
                    {email.attachments.map(att => {
                        const Icon = getIconForMimeType(att.mimeType);
                        return (
                            <li key={att.filename} className="text-purple-300 hover:underline cursor-pointer flex items-center">
                              <Icon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                              {att.filename} ({Math.round(att.sizeBytes/1024)}KB)
                            </li>
                        );
                    })}
                </ul>
            </div>
        )}
        {/* Placeholder reply/forward buttons */}
      </div>
    );
  };

  const renderContent = () => {
    switch (appData.currentView) {
      case 'account_list': return renderAccountList();
      case 'folder_list': return renderFolderList();
      case 'email_list': return renderEmailList();
      case 'email_detail': return renderEmailDetail();
      default: return renderAccountList();
    }
  };
  
  const showBackButton = appData.currentView !== 'account_list';

  return (
    <div className="h-full flex flex-col text-white relative">
      {/* Header */}
      <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <button onClick={showBackButton ? handleBackNavigation : goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Back">
          {showBackButton ? <ChevronLeftIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" /> /* Placeholder for drawer */}
        </button>
        <h1 className="text-xl font-bold text-purple-300 truncate">{getHeaderTitle()}</h1>
        {/* Placeholder for Search icon */}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-16"> {/* Padding-bottom for FAB */}
        {renderContent()}
      </div>
      
      {/* FAB for new Email - Placeholder */}
      {appData.currentView !== 'email_detail' && (
        <button className="absolute bottom-6 right-6 p-3.5 bg-purple-600 hover:bg-purple-500 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-400" aria-label="Compose new email">
          <PencilSquareIcon className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export default MailWiseApp;
