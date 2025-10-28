"use client";
import { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '../Helper/ThemeProvider';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import ThemeToggle from '../Helper/ThemeToggle';
import { useInvisibleSpeedBoost, InvisiblePreloader } from '../Helper/InvisibleSpeedBoost';

// 🚀 Enhanced Performance & Accessibility Integration
import { useAccessibilityUtils } from '../Accessibility/AccessibilityUtils.jsx';
import './compact-sidebar.css';

export default function MainLayout({ children }) {
  const { theme } = useTheme();
  const { logout } = useFixedSecureAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { fastNavigate, preloadOnHover } = useInvisibleSpeedBoost();
  
  // 🚀 Enhanced Performance & Accessibility Hooks
  const { announce } = useAccessibilityUtils();
  
  // State for accessibility and performance tracking
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [lastNavigationTime, setLastNavigationTime] = useState(0);
  
  // No heavy preloading needed - invisible speed boost handles it
  
  // Simple active tab computation
  const activeTab = (() => {
    if (pathname === '/home') return 'home';
    if (pathname === '/create') return 'create';
    if (pathname === '/message') return 'message';
    if (pathname === '/Profile') return 'profile';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/reel') return 'moments';
    if (pathname === '/bonus') return 'bonus';
    if (pathname === '/game') return 'games';
    if (pathname === '/debug') return 'debug';
    return 'home';
  })();
  
  // Check if current page should be full-screen (message page)
  const isFullScreenPage = pathname === '/message';
  

  // ♿ Enhanced accessibility announcements for route changes
  useEffect(() => {
    const routeNames = {
      '/home': 'Home Feed',
      '/create': 'Create Post',
      '/message': 'Messages',
      '/Profile': 'Profile',
      '/dashboard': 'Dashboard',
      '/reel': 'Moments',
      '/bonus': 'Bonus',
      '/game': 'Games',
      '/debug': 'Debug Tools'
    };
    
    const routeName = routeNames[pathname] || 'Page';
    announce(`Navigated to ${routeName}`);
  }, [pathname, announce]);

  const handleLogout = useCallback(async () => {
    announce('Logging out...');
    await logout();
    router.push('/');
  }, [logout, router, announce]);

  const handleNavigation = useCallback((route) => {
    const startTime = performance.now();
    
    // Update navigation history for analytics
    setNavigationHistory(prev => [...prev.slice(-9), { route, timestamp: Date.now() }]);
    setLastNavigationTime(startTime);
    
    fastNavigate(route);
  }, [fastNavigate]);

  const handleNavHover = useCallback((route) => {
    preloadOnHover(route);
  }, [preloadOnHover]);

  // All navigation items (shown in compact mode as icons only)
  const navItems = [
    { id: 'home', label: 'Home', route: '/home', icon: <HomeIcon /> },
    { id: 'create', label: 'Create', route: '/create', icon: <CreateIcon /> },
    { id: 'message', label: 'Message', route: '/message', icon: <MessageIcon /> },
    { id: 'profile', label: 'Profile', route: '/Profile', icon: <UserIcon /> },
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: <DashboardIcon /> },
    { id: 'moments', label: 'Moments', route: '/reel', icon: <MomentsIcon /> },
    { id: 'bonus', label: 'Bonus', route: '/bonus', icon: <BonusIcon /> },
    { id: 'games', label: 'Games', route: '/game', icon: <GamesIcon /> },
    { id: 'debug', label: 'Debug', route: '/debug', icon: <DebugIcon /> },
  ];
  
  return (
    <>
      {/* ✅ FIX: Only preload authenticated routes when user is authenticated */}
      <InvisiblePreloader routes={['/home', '/Profile', '/create', '/reel', '/message', '/dashboard']} />
      
      <div className={`min-h-screen h-screen flex transition-colors duration-300 overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
      {/* Desktop Sidebar - Fixed - Always visible */}
      <aside className={`hidden lg:flex flex-col transition-all duration-300 ${
        isFullScreenPage ? 'w-20' : 'w-64'
      } ${
        theme === 'dark' ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'
      }`}>
        {/* Logo */}
        <div className={`flex items-center justify-center ${
          isFullScreenPage ? 'p-4' : 'p-8'
        }`}>
          <img
            src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
            alt="Swaggo"
            className={isFullScreenPage ? 'h-10 w-auto' : 'h-20 w-auto'}
          />
        </div>
        
        {/* Navigation - Enhanced with Accessibility */}
        <nav className="flex-1 px-4 pb-4" id="navigation" role="tablist" aria-label="Main navigation">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                text={isFullScreenPage ? '' : item.label}
                isActive={activeTab === item.id}
                onClick={() => handleNavigation(item.route)}
                onMouseEnter={() => handleNavHover(item.route)}
                theme={theme}
                isCompact={isFullScreenPage}
                title={item.label}
              />
            ))}
          </div>
        </nav>
        
        {/* Theme Toggle - Hidden in compact mode */}
        {!isFullScreenPage && (
          <div className="px-4 pb-2">
            <ThemeToggle />
          </div>
        )}
        
        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm py-2.5 rounded-full transition-all duration-300 hover:shadow-lg flex items-center justify-center mx-auto ${
              isFullScreenPage ? 'px-2 w-12 h-12' : 'px-4 space-x-1.5'
            }`}
            title={isFullScreenPage ? 'Log out' : ''}
          >
            <LogoutIcon />
            {!isFullScreenPage && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
        {/* Desktop Layout */}
        <div className="hidden lg:block flex-1">
          {isFullScreenPage ? (
            /* Full-screen layout for message page */
            <main className="flex-1 h-full overflow-hidden" id="main-content" role="main" aria-label="Main content area">
              {children}
            </main>
          ) : (
            /* Normal layout with content area and optional sidebar */
            <div className="flex h-full">
              {/* Content Area */}
              <main className="flex-1 overflow-y-auto scrollbar-hide" id="main-content" role="main" aria-label="Main content area">
                <div className={`mx-auto p-6 ${
                  pathname === '/Profile' ? 'max-w-4xl' : 'max-w-2xl'
                }`}>
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
          )}
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
              <MobileNavButton icon={<HomeIcon />} isActive={activeTab === 'home'} onClick={() => handleNavigation('/home')} theme={theme} />
              <MobileNavButton icon={<CreateIcon />} isActive={activeTab === 'create'} onClick={() => handleNavigation('/create')} theme={theme} />
              <MobileNavButton icon={<MessageIcon />} isActive={activeTab === 'message'} onClick={() => handleNavigation('/message')} theme={theme} />
              <MobileNavButton icon={<UserIcon />} isActive={activeTab === 'profile'} onClick={() => handleNavigation('/Profile')} theme={theme} />
            </div>
          </nav>
        </div>
      </div>
      
    </div>
    </>
  );
}

// Navigation Item Component with enhanced interactions and accessibility
function NavItem({ icon, text, isActive, onClick, onMouseEnter, theme, isCompact = false, title = '' }) {
  return (
    <div className={isCompact ? 'compact-nav-item relative' : ''}>
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`w-full flex items-center rounded-xl transition-all duration-200 text-left transform hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
          isCompact 
            ? 'justify-center p-3' 
            : 'space-x-4 px-4 py-3'
        } ${
          isActive 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
            : (theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white focus:bg-gray-800'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 focus:bg-gray-100')
        } ${
          theme === 'dark' ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'
        }`}
        // ♿ Enhanced accessibility attributes
        role="tab"
        aria-selected={isActive}
        aria-label={title || text}
        title={isCompact ? (title || text) : undefined}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          {icon}
        </div>
        {!isCompact && text && (
          <span className="font-medium text-left">{text}</span>
        )}
        {/* Screen reader only status */}
        {isActive && (
          <span className="sr-only"> (current page)</span>
        )}
      </button>
      {isCompact && title && (
        <div className="nav-tooltip" role="tooltip" aria-hidden="true">
          {title}
        </div>
      )}
    </div>
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

function MomentsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 001-1v-1a2 2 0 100-4H4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}


function DebugIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2V8m8 0V7a2 2 0 00-2-2H9a2 2 0 00-2 2v1m8 0L15 4m2 4L15 4" />
    </svg>
  );
}

function WarpIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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