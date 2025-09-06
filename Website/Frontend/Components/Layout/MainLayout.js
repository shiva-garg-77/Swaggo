"use client";
import { useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '../Helper/ThemeProvider';
import { AuthContext } from '../Helper/AuthProvider';
import ThemeToggle from '../Helper/ThemeToggle';

export default function MainLayout({ children }) {
  const { theme } = useTheme();
  const { logout } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(() => {
    if (pathname === '/home') return 'home';
    if (pathname === '/create') return 'create';
    if (pathname === '/message') return 'message';
    if (pathname === '/Profile') return 'profile';
    if (pathname === '/reel') return 'reel';
    if (pathname === '/bonus') return 'bonus';
    if (pathname === '/game') return 'games';
    if (pathname === '/setting') return 'setting';
    return 'home';
  });

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleNavigation = (route, tabName) => {
    setActiveTab(tabName);
    router.push(route);
  };

  const navItems = [
    { id: 'home', label: 'Home', route: '/home', icon: <HomeIcon /> },
    { id: 'create', label: 'Create', route: '/create', icon: <CreateIcon /> },
    { id: 'message', label: 'Message', route: '/message', icon: <MessageIcon /> },
    { id: 'profile', label: 'Profile', route: '/Profile', icon: <UserIcon /> },
    { id: 'setting', label: 'Setting', route: '/setting', icon: <SettingsIcon /> },
    { id: 'reel', label: 'Reel', route: '/reel', icon: <ReelsIcon /> },
    { id: 'bonus', label: 'Bonus', route: '/bonus', icon: <BonusIcon /> },
    { id: 'games', label: 'Games', route: '/game', icon: <GamesIcon /> },
  ];

  return (
    <div className={`min-h-screen h-screen flex transition-colors duration-300 overflow-hidden ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Desktop Sidebar - Fixed */}
      <aside className={`hidden lg:flex flex-col w-64 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-center p-8">
          <img
            src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
            alt="Swaggo"
            className="h-20 w-auto"
          />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                text={item.label}
                isActive={activeTab === item.id}
                onClick={() => handleNavigation(item.route, item.id)}
                theme={theme}
              />
            ))}
          </div>
        </nav>
        
        {/* Theme Toggle */}
        <div className="px-4 pb-2">
          <ThemeToggle />
        </div>
        
        {/* Logout Button - Smaller */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm py-2.5 px-4 rounded-full transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-1.5 mx-auto"
          >
            <LogoutIcon />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
        {/* Desktop Layout */}
        <div className="hidden lg:block flex-1">
          {/* Desktop Header Bar - Only show search on home page */}
          {pathname === '/home' && (
            <header className={`p-4 shadow-sm transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-900 shadow-gray-800/20' : 'bg-white shadow-gray-200/50'
            }`}>
              <div className="max-w-md mx-auto">
                <div className={`relative rounded-full transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`w-full px-4 py-2.5 pl-10 rounded-full bg-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'placeholder-gray-400 text-white' 
                        : 'placeholder-gray-500 text-gray-900'
                    }`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <SearchIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </header>
          )}
          
          {/* Desktop Main Content - Scrollable with shadow separation */}
          <div className="flex h-full">
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="max-w-2xl mx-auto p-6">
                {children}
              </div>
            </main>
            
            {/* Right Sidebar - Suggestions - Only show on home page */}
            {pathname === '/home' && (
              <aside className={`w-96 p-6 overflow-y-auto scrollbar-hide transition-colors duration-300 shadow-lg ${
                theme === 'dark' ? 'bg-gray-900 shadow-gray-800/20' : 'bg-white shadow-gray-200/20'
              }`}>
                <div className="sticky top-0">
                  <SuggestionsContent theme={theme} />
                </div>
              </aside>
            )}
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden flex-1 flex flex-col h-full">
          {/* Mobile Header with shadow */}
          <header className={`p-4 shadow-sm transition-colors duration-300 flex-shrink-0 ${
            theme === 'dark' ? 'bg-gray-900 shadow-gray-800/20' : 'bg-white shadow-gray-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <img
                src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
                alt="Swaggo"
                className="h-14 w-auto"
              />
              <div className="flex items-center space-x-4">
                <button className={`p-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <HeartIcon className="w-6 h-6" />
                </button>
                <button className={`p-2 transition-colors duration-200 ${
                  theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  <MessageIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>
          
          {/* Mobile Content - Scrollable */}
          <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="p-4 space-y-4">
              {children}
            </div>
          </main>
          
          {/* Mobile Bottom Navigation with shadow */}
          <nav className={`p-4 shadow-lg transition-colors duration-300 flex-shrink-0 ${
            theme === 'dark' ? 'bg-gray-900 shadow-gray-800/20' : 'bg-white shadow-gray-200/50'
          }`}>
            <div className="flex items-center justify-around">
              <MobileNavButton icon={<HomeIcon />} isActive={activeTab === 'home'} onClick={() => handleNavigation('/home', 'home')} theme={theme} />
              <MobileNavButton icon={<SearchIcon />} isActive={activeTab === 'search'} onClick={() => handleNavigation('/search', 'search')} theme={theme} />
              <MobileNavButton icon={<CreateIcon />} isActive={activeTab === 'create'} onClick={() => handleNavigation('/create', 'create')} theme={theme} />
              <MobileNavButton icon={<HeartIcon />} isActive={activeTab === 'activity'} onClick={() => handleNavigation('/activity', 'activity')} theme={theme} />
              <MobileNavButton icon={<UserIcon />} isActive={activeTab === 'profile'} onClick={() => handleNavigation('/profile', 'profile')} theme={theme} />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon, text, isActive, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
        isActive 
          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
          : (theme === 'dark'
              ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900')
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="font-medium text-left">{text}</span>
    </button>
  );
}

// Mobile Navigation Button Component
function MobileNavButton({ icon, isActive, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 transition-colors duration-200 ${
        isActive
          ? (theme === 'dark' ? 'text-red-400' : 'text-red-600')
          : (theme === 'dark' ? 'text-gray-400' : 'text-gray-600')
      }`}
    >
      {icon}
    </button>
  );
}

// Icon Components
function HomeIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function ReelsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function BonusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GamesIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  );
}

// Suggestions Content Component
function SuggestionsContent({ theme }) {
  const suggestions = [
    { 
      id: 1, 
      username: 'aditya143', 
      name: 'Aditya Kumar', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 12,
      isOnline: true
    },
    { 
      id: 2, 
      username: 'shiva_dev', 
      name: 'Shiva Singh', 
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 8,
      isOnline: false
    },
    { 
      id: 3, 
      username: 'john_doe', 
      name: 'John Doe', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 15,
      isOnline: true
    },
    { 
      id: 4, 
      username: 'jane_smith', 
      name: 'Jane Smith', 
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b742?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 6,
      isOnline: false
    },
    { 
      id: 5, 
      username: 'dev_master', 
      name: 'Dev Master', 
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 23,
      isOnline: true
    },
    { 
      id: 6, 
      username: 'designer_pro', 
      name: 'Designer Pro', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      mutualFriends: 4,
      isOnline: false
    }
  ];

  return (
    <>
      <h2 className={`font-semibold text-lg mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Suggested for you
      </h2>
      
      <div className="space-y-4">
        {suggestions.map((user) => (
          <SuggestionItem key={user.id} user={user} theme={theme} />
        ))}
      </div>
    </>
  );
}

// Professional Suggestion Item Component
function SuggestionItem({ user, theme }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {user.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {user.username}
          </h4>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {user.mutualFriends} mutual friends
          </p>
        </div>
      </div>
      
      <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-lg">
        Follow
      </button>
    </div>
  );
}
