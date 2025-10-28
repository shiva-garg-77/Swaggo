# Feature Flag Implementation

This document outlines the feature flag implementation for the Swaggo application, providing a flexible system for managing application features and experiments.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Using Feature Flags](#using-feature-flags)
5. [Managing Feature Flags](#managing-feature-flags)
6. [Feature Categories](#feature-categories)
7. [Persistence](#persistence)
8. [Components](#components)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

## Overview

The feature flag implementation provides:
- Centralized feature flag management
- Context-based feature flag access
- Local storage persistence
- Remote flag synchronization (extensible)
- Admin interface for flag management
- Component-level feature flag usage
- Comprehensive testing support

## Architecture

The feature flag system consists of:
1. **FeatureFlagContext** - React context for managing feature flags
2. **useFeatureFlags hook** - Custom hook for accessing feature flags
3. **useFeatureFlag hook** - Simplified hook for checking individual flags
4. **FeatureFlag component** - Component for conditional rendering
5. **FeatureFlagManager component** - Admin interface for flag management
6. **FEATURES constant** - Centralized feature definitions

## Implementation Details

### FeatureFlagContext.js

The core context manages:
- Current feature flag state
- Remote feature flag synchronization
- Local storage persistence
- Feature flag operations

```javascript
import { FeatureFlagProvider } from '../context/FeatureFlagContext';

// Wrap your app with the provider
<FeatureFlagProvider>
  <App />
</FeatureFlagProvider>
```

### Features Definition

Features are defined in the FEATURES constant:

```javascript
export const FEATURES = {
  // Core features
  VOICE_MESSAGES: 'voiceMessages',
  VIDEO_CALLS: 'videoCalls',
  PUSH_NOTIFICATIONS: 'pushNotifications',
  
  // Advanced features
  AI_ASSISTANT: 'aiAssistant',
  SMART_REPLIES: 'smartReplies',
  
  // UI/UX features
  DARK_MODE: 'darkMode',
  CUSTOM_THEMES: 'customThemes'
};
```

### Default Feature Flags

Default feature flags are defined in DEFAULT_FEATURE_FLAGS:

```javascript
const DEFAULT_FEATURE_FLAGS = {
  [FEATURES.VOICE_MESSAGES]: true,
  [FEATURES.VIDEO_CALLS]: true,
  [FEATURES.AI_ASSISTANT]: false,
  // ... other defaults
};
```

## Using Feature Flags

### Basic Usage with Hook

```javascript
import { useFeatureFlag } from '../hooks/useFeatureFlag';

const MyComponent = () => {
  const isVoiceMessagesEnabled = useFeatureFlag('voiceMessages');
  
  return (
    <div>
      {isVoiceMessagesEnabled && (
        <VoiceMessageRecorder />
      )}
    </div>
  );
};
```

### Advanced Usage with Context

```javascript
import { useFeatureFlags } from '../context/FeatureFlagContext';

const MyComponent = () => {
  const { isEnabled, toggleFeature } = useFeatureFlags();
  
  return (
    <div>
      {isEnabled('voiceMessages') && (
        <VoiceMessageRecorder />
      )}
      
      <button onClick={() => toggleFeature('voiceMessages')}>
        Toggle Voice Messages
      </button>
    </div>
  );
};
```

### Conditional Rendering with Component

```jsx
import { FeatureFlag } from '../context/FeatureFlagContext';

const MyComponent = () => {
  return (
    <div>
      <FeatureFlag feature="voiceMessages">
        <VoiceMessageRecorder />
      </FeatureFlag>
      
      <FeatureFlag feature="videoCalls" fallback={<TextChat />}>
        <VideoCallInterface />
      </FeatureFlag>
    </div>
  );
};
```

### Higher-Order Component

```javascript
import { withFeatureFlag } from '../context/FeatureFlagContext';

const VoiceMessageComponent = () => <VoiceMessageRecorder />;
const FallbackComponent = () => <TextMessageInput />;

const FeatureFlaggedVoiceMessage = withFeatureFlag(
  'voiceMessages',
  VoiceMessageComponent,
  FallbackComponent
);

// Usage
<VoiceMessageFeature />
```

## Managing Feature Flags

### Checking Feature Status

```javascript
const { isEnabled } = useFeatureFlags();

// Check if a feature is enabled
if (isEnabled('voiceMessages')) {
  // Feature is enabled
}

// Check multiple features
const requiredFeatures = ['voiceMessages', 'pushNotifications'];
const allEnabled = requiredFeatures.every(isEnabled);
```

### Modifying Feature Flags

```javascript
const { 
  enableFeature, 
  disableFeature, 
  toggleFeature, 
  updateFeatures,
  resetToDefaults
} = useFeatureFlags();

// Enable a feature
enableFeature('voiceMessages');

// Disable a feature
disableFeature('videoCalls');

// Toggle a feature
toggleFeature('darkMode');

// Update multiple features
updateFeatures({
  voiceMessages: true,
  videoCalls: false,
  aiAssistant: true
});

// Reset to defaults
resetToDefaults();
```

### Getting Feature Lists

```javascript
const { 
  getEnabledFeatures, 
  getAllFeatures, 
  featureFlags 
} = useFeatureFlags();

// Get all enabled features
const enabled = getEnabledFeatures;

// Get all available features
const all = getAllFeatures;

// Get current feature flag values
console.log(featureFlags);
```

## Feature Categories

### Core Features
- Voice Messages
- Video Calls
- Push Notifications
- Screen Sharing
- Offline Mode
- Message Reactions

### Advanced Features
- AI Assistant
- Smart Replies
- Message Translation
- Polling
- Scheduled Messages

### UI/UX Features
- Dark Mode
- Custom Themes
- Animations
- Rich Text Editor

### Security Features
- Biometric Authentication
- Advanced Encryption
- Message Self-Destruct

### Performance Features
- Lazy Loading
- Code Splitting
- Prefetching

### Experimental Features
- WebRTC Data Channel
- P2P Messaging
- Blockchain Integration

## Persistence

### Local Storage

Feature flags are automatically persisted to localStorage:

- **Key**: `swaggo-feature-flags`
- **Format**: JSON object of feature flag states

```javascript
// Saved feature flags
{
  "voiceMessages": true,
  "videoCalls": false,
  "darkMode": true
}
```

### Loading Process

1. Check localStorage for saved flags
2. Merge with default flags
3. Apply merged flags as initial state
4. Save changes back to localStorage

### Remote Synchronization

The system is designed to support remote flag synchronization:

```javascript
// In a real implementation, this would fetch from an API
const fetchRemoteFlags = async () => {
  const response = await fetch('/api/feature-flags');
  const remoteFlags = await response.json();
  setRemoteFlags(remoteFlags);
};
```

## Components

### FeatureFlagManager

Admin interface for managing feature flags:

```jsx
import FeatureFlagManager from '../Components/FeatureFlags/FeatureFlagManager';

// Usage in admin panel
<FeatureFlagManager />
```

Features:
- Feature search and filtering
- Category grouping
- Bulk operations
- Status indicators
- Enable/disable toggles

### FeatureFlag

Component for conditional rendering:

```jsx
<FeatureFlag feature="voiceMessages">
  <VoiceMessageRecorder />
</FeatureFlag>

<FeatureFlag feature="videoCalls" fallback={<TextChat />}>
  <VideoCallInterface />
</FeatureFlag>
```

## Testing

### FeatureFlagContext Tests

Tests cover:
- Context provider initialization
- Feature flag operations
- Local storage persistence
- Remote flag synchronization
- Error handling

### Test Examples

```javascript
// Test feature enable/disable
fireEvent.click(screen.getByTestId('enable-voice-messages'));
expect(screen.getByTestId('voice-messages-enabled')).toHaveTextContent('true');

// Test feature toggle
fireEvent.click(screen.getByTestId('toggle-voice-messages'));
const newStatus = screen.getByTestId('voice-messages-enabled').textContent;

// Test localStorage persistence
const savedFlags = JSON.parse(localStorage.getItem('swaggo-feature-flags'));
expect(savedFlags.voiceMessages).toBe(true);
```

### Mocking in Tests

```javascript
// Mock feature flags for testing
jest.mock('../context/FeatureFlagContext', () => ({
  useFeatureFlags: () => ({
    isEnabled: jest.fn().mockReturnValue(true),
    enableFeature: jest.fn(),
    disableFeature: jest.fn(),
    toggleFeature: jest.fn()
  })
}));
```

## Best Practices

### Feature Flag Naming

1. **Use descriptive names**:
   ```javascript
   // Good
   const FEATURES = {
     VOICE_MESSAGES: 'voiceMessages',
     VIDEO_CALLS: 'videoCalls'
   };
   
   // Avoid
   const FEATURES = {
     VM: 'vm',
     VC: 'vc'
   };
   ```

2. **Group related features**:
   ```javascript
   // Communication features
   VOICE_MESSAGES: 'voiceMessages',
   VIDEO_CALLS: 'videoCalls',
   SCREEN_SHARING: 'screenSharing'
   ```

### Performance Considerations

1. **Memoize expensive operations**:
   ```javascript
   const getEnabledFeatures = useMemo(() => {
     return Object.keys(featureFlags).filter(feature => isEnabled(feature));
   }, [featureFlags]);
   ```

2. **Avoid unnecessary re-renders**:
   ```javascript
   // Use specific hooks for individual features
   const isVoiceMessagesEnabled = useFeatureFlag('voiceMessages');
   
   // Instead of accessing entire context
   const { featureFlags } = useFeatureFlags();
   const isVoiceMessagesEnabled = featureFlags.voiceMessages;
   ```

### Code Organization

1. **Centralize feature definitions**:
   ```javascript
   // In FEATURES constant
   export const FEATURES = {
     VOICE_MESSAGES: 'voiceMessages',
     // ... all features
   };
   ```

2. **Use feature flags consistently**:
   ```javascript
   // Good - consistent usage
   import { useFeatureFlag } from '../hooks/useFeatureFlag';
   
   const isVoiceMessagesEnabled = useFeatureFlag(FEATURES.VOICE_MESSAGES);
   
   // Avoid - inconsistent usage
   const { isEnabled } = useFeatureFlags();
   const isVoiceMessagesEnabled = isEnabled('voiceMessages');
   ```

### Cleanup and Removal

1. **Remove unused feature flags**:
   ```javascript
   // When removing a feature
   // 1. Remove from FEATURES constant
   // 2. Remove from DEFAULT_FEATURE_FLAGS
   // 3. Remove related code
   // 4. Update tests
   ```

2. **Document feature flag lifecycle**:
   ```javascript
   // Feature flag lifecycle
   // 1. Experimental - false by default
   // 2. Beta - true for some users
   // 3. General Availability - true by default
   // 4. Deprecated - false by default
   // 5. Removed - deleted
   ```

### Security Considerations

1. **Validate feature flags on backend**:
   ```javascript
   // Always validate on backend for security-critical features
   app.post('/api/voice-message', (req, res) => {
     if (!isFeatureEnabled('voiceMessages')) {
       return res.status(403).json({ error: 'Feature not enabled' });
     }
     // Process voice message
   });
   ```

2. **Don't expose sensitive feature flags**:
   ```javascript
   // Avoid exposing security-related flags to frontend
   const SENSITIVE_FEATURES = {
     ADMIN_PANEL: 'adminPanel', // Keep server-side only
     DATABASE_ACCESS: 'databaseAccess' // Keep server-side only
   };
   ```

## Future Enhancements

Planned improvements:
- **Remote flag synchronization** via API
- **User targeting** for feature rollouts
- **A/B testing** integration
- **Analytics** for feature usage
- **Time-based** feature flags
- **Percentage rollouts** for gradual deployment
- **Feature flag dependencies** and constraints

## Troubleshooting

### Common Issues

1. **Feature flag not persisting**:
   - Check localStorage permissions
   - Verify FeatureFlagProvider is at app root
   - Confirm feature flag operations are being called

2. **Feature flag not updating**:
   - Check for proper state management
   - Verify component re-renders
   - Check for memoization issues

3. **Feature flag not loading**:
   - Check localStorage parsing errors
   - Verify default flag values
   - Check for initialization errors

### Debugging Tips

1. **Log current feature flags**:
   ```javascript
   const { featureFlags } = useFeatureFlags();
   console.log('Current feature flags:', featureFlags);
   ```

2. **Check localStorage values**:
   ```javascript
   console.log('Saved feature flags:', localStorage.getItem('swaggo-feature-flags'));
   ```

3. **Verify feature flag status**:
   ```javascript
   const { isEnabled } = useFeatureFlags();
   console.log('Voice messages enabled:', isEnabled('voiceMessages'));
   ```