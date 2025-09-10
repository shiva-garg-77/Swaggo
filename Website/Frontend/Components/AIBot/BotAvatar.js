'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Zap, 
  Brain, 
  Heart, 
  Code, 
  Sparkles, 
  TrendingUp, 
  Volume2, 
  VolumeX,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAIBot } from '../Helper/AIBotProvider';
import { clsx } from 'clsx';

const BotAvatar = ({ 
  size = 'md', 
  showStatus = true, 
  showPersonalityIndicator = true,
  showConnectionStatus = true,
  interactive = true,
  className 
}) => {
  const {
    currentPersonality,
    personalities,
    isTyping,
    connectionStatus,
    switchPersonality,
    settings
  } = useAIBot();

  const [isHovered, setIsHovered] = useState(false);
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [animationState, setAnimationState] = useState('idle');
  const avatarRef = useRef(null);

  const currentPersona = personalities[currentPersonality];

  // Size configurations
  const sizeConfig = {
    sm: { 
      container: 'w-8 h-8', 
      avatar: 'text-sm', 
      indicator: 'w-2 h-2', 
      badge: 'w-3 h-3' 
    },
    md: { 
      container: 'w-12 h-12', 
      avatar: 'text-base', 
      indicator: 'w-3 h-3', 
      badge: 'w-4 h-4' 
    },
    lg: { 
      container: 'w-16 h-16', 
      avatar: 'text-xl', 
      indicator: 'w-4 h-4', 
      badge: 'w-5 h-5' 
    },
    xl: { 
      container: 'w-24 h-24', 
      avatar: 'text-2xl', 
      indicator: 'w-5 h-5', 
      badge: 'w-6 h-6' 
    }
  };

  const config = sizeConfig[size];

  // Animation effects based on state
  useEffect(() => {
    if (isTyping) {
      setAnimationState('thinking');
    } else if (connectionStatus === 'connecting') {
      setAnimationState('connecting');
    } else if (connectionStatus === 'error') {
      setAnimationState('error');
    } else {
      setAnimationState('idle');
    }
  }, [isTyping, connectionStatus]);

  // Handle avatar click
  const handleAvatarClick = () => {
    if (interactive) {
      setShowPersonalityMenu(!showPersonalityMenu);
    }
  };

  // Close personality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setShowPersonalityMenu(false);
      }
    };

    if (showPersonalityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPersonalityMenu]);

  // Get personality icon
  const getPersonalityIcon = (personalityKey) => {
    const iconMap = {
      assistant: Brain,
      creative: Sparkles,
      developer: Code,
      analyst: TrendingUp
    };
    return iconMap[personalityKey] || Brain;
  };

  // Get connection status color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400 animate-pulse';
      case 'error': return 'text-red-400';
      case 'disconnected': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      ref={avatarRef}
      className={clsx('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Avatar */}
      <div
        className={clsx(
          config.container,
          'relative rounded-full flex items-center justify-center font-bold cursor-pointer transition-all duration-300 transform',
          `bg-${currentPersona.color}-100 text-${currentPersona.color}-600`,
          `dark:bg-${currentPersona.color}-900 dark:text-${currentPersona.color}-300`,
          {
            'scale-110': isHovered && interactive,
            'animate-pulse': animationState === 'thinking',
            'animate-bounce': animationState === 'connecting',
            'animate-shake': animationState === 'error',
            'shadow-lg': isHovered,
            'ring-2 ring-blue-400': showPersonalityMenu,
            'ring-2 ring-red-400': animationState === 'error',
            'ring-2 ring-yellow-400': animationState === 'connecting'
          },
          config.avatar
        )}
        onClick={handleAvatarClick}
        title={`${currentPersona.name} - ${currentPersona.description}`}
      >
        {/* Avatar Content */}
        <span className="relative z-10">
          {currentPersona.avatar}
        </span>

        {/* Animated background for thinking state */}
        {animationState === 'thinking' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-spin" />
        )}

        {/* Glow effect for active state */}
        {isHovered && (
          <div 
            className={clsx(
              'absolute inset-0 rounded-full opacity-20 animate-ping',
              `bg-${currentPersona.color}-400`
            )} 
          />
        )}
      </div>

      {/* Status Indicators */}
      {showStatus && (
        <div className="absolute -top-1 -right-1 flex flex-col space-y-1">
          {/* Typing Indicator */}
          {isTyping && (
            <div className={clsx(config.indicator, 'bg-green-400 rounded-full animate-pulse')} 
                 title="AI is typing..." />
          )}

          {/* Connection Status */}
          {showConnectionStatus && (
            <div 
              className={clsx(config.indicator, 'rounded-full flex items-center justify-center')}
              title={`Connection: ${connectionStatus}`}
            >
              {connectionStatus === 'connected' ? (
                <Wifi className={clsx('w-2 h-2', getConnectionStatusColor())} />
              ) : (
                <WifiOff className={clsx('w-2 h-2', getConnectionStatusColor())} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Personality Indicator */}
      {showPersonalityIndicator && (
        <div className="absolute -bottom-1 -right-1">
          <div 
            className={clsx(
              config.badge,
              'rounded-full flex items-center justify-center',
              `bg-${currentPersona.color}-500 text-white shadow-lg`
            )}
            title={`Mode: ${currentPersona.name}`}
          >
            {React.createElement(getPersonalityIcon(currentPersonality), { 
              className: 'w-2 h-2' 
            })}
          </div>
        </div>
      )}

      {/* Personality Selection Menu */}
      {showPersonalityMenu && interactive && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50">
          <PersonalityMenu
            personalities={personalities}
            currentPersonality={currentPersonality}
            onSelect={(personalityKey) => {
              switchPersonality(personalityKey);
              setShowPersonalityMenu(false);
            }}
          />
        </div>
      )}

      {/* Hover Tooltip */}
      {isHovered && !showPersonalityMenu && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-40">
          <BotTooltip persona={currentPersona} connectionStatus={connectionStatus} />
        </div>
      )}
    </div>
  );
};

// Personality Selection Menu Component
const PersonalityMenu = ({ personalities, currentPersonality, onSelect }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 min-w-48">
    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
      Select AI Personality
    </div>
    
    <div className="space-y-1">
      {Object.entries(personalities).map(([key, persona]) => {
        const IconComponent = {
          assistant: Brain,
          creative: Sparkles,
          developer: Code,
          analyst: TrendingUp
        }[key] || Brain;

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={clsx(
              'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors',
              currentPersonality === key
                ? `bg-${persona.color}-100 text-${persona.color}-700 dark:bg-${persona.color}-900/50 dark:text-${persona.color}-300`
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            )}
          >
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm',
              `bg-${persona.color}-100 text-${persona.color}-600 dark:bg-${persona.color}-900 dark:text-${persona.color}-300`
            )}>
              {persona.avatar}
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-medium">{persona.name}</div>
              <div className="text-xs opacity-70">{persona.description}</div>
            </div>

            <IconComponent className="w-4 h-4 opacity-50" />

            {currentPersonality === key && (
              <div className={clsx('w-2 h-2 rounded-full', `bg-${persona.color}-500`)} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// Bot Tooltip Component
const BotTooltip = ({ persona, connectionStatus }) => (
  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
    <div className="flex items-center space-x-2">
      <span className="font-semibold">{persona.name}</span>
      <span className="opacity-70">•</span>
      <span className={clsx(
        'font-medium',
        connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
      )}>
        {connectionStatus}
      </span>
    </div>
    
    <div className="text-gray-300 dark:text-gray-400 mt-1">
      {persona.description}
    </div>
    
    <div className="flex items-center space-x-1 mt-1 opacity-70">
      <span>Capabilities:</span>
      <div className="flex space-x-1">
        {persona.capabilities?.slice(0, 3).map((cap, index) => (
          <span key={index} className="bg-gray-700 dark:bg-gray-600 px-1 rounded text-xs">
            {cap}
          </span>
        ))}
      </div>
    </div>
    
    {/* Tooltip Arrow */}
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
  </div>
);

// Animated Bot Status Component
export const BotStatusIndicator = ({ className }) => {
  const { isTyping, connectionStatus, currentPersonality, personalities } = useAIBot();
  const currentPersona = personalities[currentPersonality];

  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      {/* Status Light */}
      <div className="relative">
        <div 
          className={clsx(
            'w-2 h-2 rounded-full',
            connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400',
            { 'animate-pulse': isTyping || connectionStatus === 'connecting' }
          )}
        />
        {isTyping && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
        )}
      </div>

      {/* Status Text */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium">{currentPersona.name}</span>
        {isTyping ? (
          <span className="ml-1 opacity-70">is thinking...</span>
        ) : (
          <span className="ml-1 opacity-70">
            {connectionStatus === 'connected' ? 'ready' : connectionStatus}
          </span>
        )}
      </div>
    </div>
  );
};

// Floating Action Bot Avatar
export const FloatingBotAvatar = ({ 
  onToggleChat, 
  hasUnreadMessages = false,
  className 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={clsx(
        'fixed bottom-6 right-6 z-50 transition-all duration-300',
        { 'scale-110': isExpanded },
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="relative">
        <button
          onClick={onToggleChat}
          className="relative"
        >
          <BotAvatar 
            size="lg" 
            interactive={false}
            className="shadow-2xl hover:shadow-3xl transition-shadow duration-300"
          />
          
          {/* Notification Badge */}
          {hasUnreadMessages && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
              !
            </div>
          )}
        </button>

        {/* Ripple Effect */}
        {isExpanded && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30" />
        )}
      </div>
    </div>
  );
};

// CSS for shake animation (add to your global CSS)
const shakeKeyframes = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s ease-in-out infinite;
}
`;

export default BotAvatar;
