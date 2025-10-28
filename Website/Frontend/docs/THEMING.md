# Theme Implementation

This document outlines the unified theme implementation for the Swaggo application, supporting both dark mode and chat themes with a flexible and scalable architecture.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Using Themes](#using-themes)
5. [Chat Themes](#chat-themes)
6. [Theme Persistence](#theme-persistence)
7. [System Preferences](#system-preferences)
8. [Components](#components)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

## Overview

The theme implementation provides:
- Dark/light mode switching
- Multiple chat themes
- System preference detection
- Persistent theme settings
- Accessible theme toggle components
- Context-based theme management

## Architecture

The theme system consists of:
1. **UnifiedThemeProvider** - React context for managing themes
2. **useUnifiedTheme hook** - Custom hook for accessing theme values
3. **UnifiedThemeToggle component** - UI component for theme switching
4. **ThemedContainer component** - Theme-aware container wrapper
5. **CHAT_THEMES configuration** - Theme definitions

## Implementation Details

### UnifiedThemeProvider.js

The core provider manages:
- Current theme state (light/dark)
- Current chat theme state
- System preference detection
- localStorage persistence
- Document class updates

```javascript
import { UnifiedThemeProvider } from '../context/UnifiedThemeProvider';

// Wrap your app with the provider
<UnifiedThemeProvider>
  <App />
</UnifiedThemeProvider>
```

### useUnifiedTheme Hook

The hook provides access to theme values:

```javascript
import { useUnifiedTheme } from '../context/UnifiedThemeProvider';

const MyComponent = () => {
  const { theme, toggleTheme, chatTheme, changeChatTheme } = useUnifiedTheme();
  
  return (
    <div className={theme === 'dark' ? 'bg-gray-900' : 'bg-white'}>
      <h1>Current theme: {theme}</h1>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <p>Current chat theme: {chatTheme}</p>
    </div>
  );
};
```

### Theme Configuration

Chat themes are defined in `CHAT_THEMES`:

```javascript
export const CHAT_THEMES = {
  default: {
    name: 'Default',
    primary: 'blue',
    background: 'bg-gray-50 dark:bg-gray-900',
    ownBubble: 'bg-gradient-to-r from-blue-500 to-blue-600',
    receivedBubble: 'bg-white dark:bg-gray-800',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  // ... other themes
};
```

## Using Themes

### Basic Usage

```javascript
const { theme, toggleTheme } = useUnifiedTheme();

// Apply theme classes
<div className={theme === 'dark' ? 'dark' : 'light'}>
  <h1 className="text-gray-900 dark:text-white">Themed Content</h1>
</div>

// Toggle theme
<button onClick={toggleTheme}>
  Switch to {theme === 'light' ? 'dark' : 'light'} mode
</button>
```

### Conditional Styling

```javascript
const { theme } = useUnifiedTheme();

// Conditional classes
const containerClasses = `p-4 rounded-lg ${
  theme === 'dark' 
    ? 'bg-gray-800 text-white' 
    : 'bg-white text-gray-900'
}`;

// Using Tailwind dark: prefix
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

## Chat Themes

### Available Themes

1. **Default** - Blue-based default theme
2. **Green** - Green accent theme
3. **Purple** - Purple accent theme
4. **Pink** - Pink accent theme
5. **Orange** - Orange accent theme
6. **Dark Mode Only** - Pure dark theme

### Using Chat Themes

```javascript
const { currentChatTheme } = useUnifiedTheme();

// Apply chat theme styles
<div className={currentChatTheme.background}>
  <div className={currentChatTheme.ownBubble}>
    My message
  </div>
  <div className={currentChatTheme.receivedBubble}>
    Received message
  </div>
</div>
```

### Changing Chat Themes

```javascript
const { changeChatTheme } = useUnifiedTheme();

// Change to green theme
changeChatTheme('green');

// Change to purple theme
changeChatTheme('purple');
```

## Theme Persistence

Themes are automatically persisted using localStorage:

- **General theme**: `swaggo-theme` (light/dark)
- **Chat theme**: `swaggo-chat-theme` (default/green/purple/etc.)

### Manual Persistence

```javascript
// Save theme preferences
localStorage.setItem('swaggo-theme', 'dark');
localStorage.setItem('swaggo-chat-theme', 'green');

// Load theme preferences
const savedTheme = localStorage.getItem('swaggo-theme') || 'light';
const savedChatTheme = localStorage.getItem('swaggo-chat-theme') || 'default';
```

## System Preferences

The theme system automatically detects system preferences:

```javascript
const { systemPrefersDark } = useUnifiedTheme();

// Check if system prefers dark mode
if (systemPrefersDark) {
  // Apply dark theme by default
}
```

### Respecting System Preferences

```javascript
const { theme, systemPrefersDark } = useUnifiedTheme();

// Use system preference if no saved preference
useEffect(() => {
  if (!localStorage.getItem('swaggo-theme')) {
    const systemTheme = systemPrefersDark ? 'dark' : 'light';
    // Apply system theme
  }
}, [systemPrefersDark]);
```

## Components

### UnifiedThemeToggle

The main theme toggle component:

```jsx
import UnifiedThemeToggle from '../Components/Theme/UnifiedThemeToggle';

// Basic usage
<UnifiedThemeToggle />

// Hide chat themes
<UnifiedThemeToggle showChatThemes={false} />

// Custom styling
<UnifiedThemeToggle className="absolute top-4 right-4" />
```

### ThemedContainer

Theme-aware container wrapper:

```jsx
import { ThemedContainer } from '../context/UnifiedThemeProvider';

<ThemedContainer className="p-4">
  <h1>Content with theme background</h1>
</ThemedContainer>
```

## Testing

### UnifiedThemeProvider Tests

Tests cover:
- Default theme initialization
- Theme toggling functionality
- Chat theme switching
- localStorage persistence
- System preference detection
- Error handling

### Test Examples

```javascript
// Test theme toggle
fireEvent.click(screen.getByTestId('toggle-theme'));
expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

// Test chat theme change
fireEvent.click(screen.getByTestId('change-chat-theme'));
expect(screen.getByTestId('current-chat-theme')).toHaveTextContent('green');
```

## Best Practices

### CSS Class Management

1. **Use Tailwind dark: prefix** for simple dark mode:
   ```html
   <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
   ```

2. **Use context values** for complex theme logic:
   ```javascript
   const { theme } = useUnifiedTheme();
   const classes = theme === 'dark' ? 'dark-classes' : 'light-classes';
   ```

### Performance Considerations

1. **Minimize re-renders** by using `useMemo` for complex calculations:
   ```javascript
   const themeClasses = useMemo(() => ({
     background: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
     text: theme === 'dark' ? 'text-white' : 'text-gray-900'
   }), [theme]);
   ```

2. **Debounce theme changes** if applying expensive operations:
   ```javascript
   const debouncedThemeChange = useCallback(
     debounce((newTheme) => {
       // Expensive theme change operation
     }, 300),
     []
   );
   ```

### Accessibility

1. **Provide ARIA labels** for theme toggle buttons:
   ```jsx
   <button aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
   ```

2. **Maintain sufficient contrast** in all themes:
   - Test color contrast ratios
   - Ensure text readability
   - Consider color blindness

3. **Support keyboard navigation**:
   ```jsx
   <button 
     onClick={toggleTheme}
     onKeyDown={(e) => e.key === 'Enter' && toggleTheme()}
   >
   ```

### Theme Consistency

1. **Maintain consistent theme structure**:
   ```javascript
   const themes = {
     default: { primary: 'blue', background: '...' },
     green: { primary: 'green', background: '...' }
   };
   ```

2. **Use theme tokens** instead of hardcoded values:
   ```javascript
   // Good
   <div className={currentChatTheme.background}>
   
   // Avoid
   <div className="bg-gray-50 dark:bg-gray-900">
   ```

## Future Enhancements

Planned improvements:
- **Custom theme creation** interface
- **Animated theme transitions**
- **Theme export/import** functionality
- **Per-user theme preferences**
- **Time-based theme switching** (day/night)
- **High contrast themes** for accessibility

## Troubleshooting

### Common Issues

1. **Theme not persisting**:
   - Check localStorage permissions
   - Verify UnifiedThemeProvider is at app root
   - Confirm toggleTheme is being called

2. **System preference not detected**:
   - Test window.matchMedia support
   - Check browser compatibility
   - Verify system settings

3. **Theme classes not applying**:
   - Ensure Tailwind dark mode is configured
   - Check for conflicting CSS
   - Verify theme context is accessible

### Debugging Tips

1. **Log current theme**:
   ```javascript
   const { theme } = useUnifiedTheme();
   console.log('Current theme:', theme);
   ```

2. **Check localStorage values**:
   ```javascript
   console.log('Saved theme:', localStorage.getItem('swaggo-theme'));
   ```

3. **Verify system preference**:
   ```javascript
   const { systemPrefersDark } = useUnifiedTheme();
   console.log('System prefers dark:', systemPrefersDark);
   ```