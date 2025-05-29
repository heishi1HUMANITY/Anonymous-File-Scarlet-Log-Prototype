
import React from 'react';
import { PlayerStoryState, GameData, AppState, FriendNetAppData, SocialPostDef } from '../../types';
import { ChevronLeftIcon, UserCircleIcon, HomeIcon, GlobeAltIcon, PlayCircleIcon, NotificationsBellIcon } from '../icons';

interface FriendNetAppProps {
  playerState: PlayerStoryState;
  gameData: GameData;
  onPlayerStateChange: (newState: PlayerStoryState) => void;
  goHome: () => void;
}

const FriendNetApp: React.FC<FriendNetAppProps> = ({
  playerState,
  gameData,
  onPlayerStateChange,
  goHome,
}) => {
  const appState = playerState.smartphoneInstalledApps['friendnet'];
  const appData = appState.appSpecificData as FriendNetAppData;

  const updateAppData = (newData: Partial<FriendNetAppData>) => {
    onPlayerStateChange({
      ...playerState,
      smartphoneInstalledApps: {
        ...playerState.smartphoneInstalledApps,
        'friendnet': {
          ...appState,
          appSpecificData: { ...appData, ...newData },
        },
      },
    });
  };

  const handleTabChange = (view: FriendNetAppData['currentView']) => {
    updateAppData({ currentView: view, selectedPostId: undefined });
  };

  const renderPost = (post: SocialPostDef, isDetailView: boolean = false) => {
    const authorProfile = gameData.socialMediaProfiles?.friendnet?.find(p => p.userId === post.authorUserId);
    const authorName = authorProfile?.username || post.authorUserId;
    const authorAvatar = authorProfile?.profilePictureUrl;

    return (
      <div key={post.postId} className={`bg-gray-700/30 backdrop-blur-sm rounded-lg shadow-md overflow-hidden ${isDetailView ? '' : 'mb-4'}`}>
        <div className="p-3 flex items-center">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full mr-2.5" />
          ) : (
            <UserCircleIcon className="w-8 h-8 rounded-full mr-2.5 text-gray-400" />
          )}
          <div>
            <p className="font-semibold text-sm text-purple-300">{authorName}</p>
            <p className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</p>
          </div>
        </div>
        {post.imageUrl && <img src={post.imageUrl} alt="Post image" className="w-full h-auto max-h-96 object-cover" />}
        <div className="p-3">
          <p className="text-sm text-gray-100 whitespace-pre-wrap mb-2">{post.content}</p>
          <div className="flex items-center text-xs text-gray-400 space-x-3">
            <span>{post.likesCount || 0} Likes</span>
            <span>{post.comments?.length || 0} Comments</span>
            {/* Placeholder buttons */}
          </div>
        </div>
        {!isDetailView && (
           <button 
                onClick={() => updateAppData({ currentView: 'post_detail', selectedPostId: post.postId })}
                className="block w-full text-left p-2 text-xs text-purple-300 hover:bg-white/5"
            >
                View Post
            </button>
        )}
        {isDetailView && post.comments && post.comments.length > 0 && (
            <div className="p-3 border-t border-white/10">
                <h4 className="text-xs font-semibold mb-1.5 text-gray-300">Comments:</h4>
                {post.comments.map(comment => {
                    const commenterProfile = gameData.socialMediaProfiles?.friendnet?.find(p => p.userId === comment.authorUserId);
                    return (
                        <div key={comment.commentId} className="text-xs mb-1 bg-gray-600/30 p-1.5 rounded">
                            <span className="font-semibold text-purple-400">{commenterProfile?.username || comment.authorUserId}: </span>
                            <span className="text-gray-200">{comment.text}</span>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    );
  };
  
  const renderFeed = () => (
    <div className="p-3 space-y-3">
      {appData.feedPosts.map(post => renderPost(post))}
    </div>
  );

  const renderProfile = () => (
    <div className="p-3">
      <div className="flex flex-col items-center mb-4">
        {appData.userProfile.profilePictureUrl ? (
          <img src={appData.userProfile.profilePictureUrl} alt={appData.userProfile.username} className="w-20 h-20 rounded-full mb-2 border-2 border-purple-400" />
        ) : (
          <UserCircleIcon className="w-20 h-20 text-gray-400 mb-2" />
        )}
        <h2 className="text-lg font-semibold text-purple-200">{appData.userProfile.username}</h2>
        <p className="text-xs text-gray-400">{appData.userProfile.bio || "No bio yet."}</p>
        <div className="flex space-x-3 text-xs text-gray-300 mt-2">
          <span>{appData.userProfile.followersCount} Followers</span>
          <span>{appData.userProfile.followingCount} Following</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-2 mt-4">Posts</h3>
      {appData.userProfile.posts.map(post => renderPost(post))}
      {appData.userProfile.posts.length === 0 && <p className="text-xs text-gray-400">No posts yet.</p>}
    </div>
  );

  const renderSelectedPostDetail = () => {
    if (!appData.selectedPostId) return null;
    const post = appData.feedPosts.find(p => p.postId === appData.selectedPostId) || appData.userProfile.posts.find(p => p.postId === appData.selectedPostId);
    if (!post) return <p className="p-4 text-center text-gray-400">Post not found.</p>;
    return (
      <div className="p-3">
         {renderPost(post, true)}
      </div>
    );
  };

  const renderContent = () => {
    switch (appData.currentView) {
      case 'feed': return renderFeed();
      case 'profile': return renderProfile();
      case 'post_detail': return renderSelectedPostDetail();
      case 'explore': return <p className="p-4 text-center text-gray-400">Explore (Placeholder)</p>;
      case 'reels': return <p className="p-4 text-center text-gray-400">Reels (Placeholder)</p>;
      case 'notifications': return <p className="p-4 text-center text-gray-400">Notifications (Placeholder)</p>;
      default: return renderFeed();
    }
  };
  
  const navItems = [
    { view: 'feed' as const, label: 'Feed', icon: <HomeIcon className="w-5 h-5" /> },
    { view: 'explore' as const, label: 'Explore', icon: <GlobeAltIcon className="w-5 h-5" /> },
    { view: 'reels' as const, label: 'Reels', icon: <PlayCircleIcon className="w-5 h-5" /> },
    { view: 'notifications' as const, label: 'Activity', icon: <NotificationsBellIcon className="w-5 h-5" /> },
    { view: 'profile' as const, label: 'Profile', icon: <UserCircleIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center p-3 bg-black/50 backdrop-blur-md shadow-sm sticky top-0 z-20">
         {(appData.currentView === 'post_detail' || (appData.currentView === 'profile' && appData.selectedPostId)) && (
            <button 
                onClick={() => updateAppData({ currentView: appData.currentView === 'post_detail' && appData.feedPosts.find(p => p.postId === appData.selectedPostId) ? 'feed' : 'profile', selectedPostId: undefined })} 
                className="mr-3 p-1 hover:bg-white/10 rounded-full" 
                aria-label="Back"
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        )}
        {appData.currentView !== 'post_detail' && (
            <button onClick={goHome} className="mr-3 p-1 hover:bg-white/10 rounded-full" aria-label="Go Home">
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
        )}
        <h1 className="text-xl font-bold text-purple-300">{appState.appName}</h1>
        {/* Placeholder for search/DM icons */}
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-12">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center p-1.5 bg-black/50 backdrop-blur-md border-t border-white/10 sticky bottom-0 z-20">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => handleTabChange(item.view)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-md w-1/5 ${appData.currentView === item.view ? 'text-purple-300' : 'text-gray-400 hover:text-purple-200'}`}
            aria-label={item.label}
            aria-current={appData.currentView === item.view ? 'page' : undefined}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FriendNetApp;
