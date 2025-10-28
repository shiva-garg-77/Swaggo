# Internationalization (i18n) Implementation

This document outlines the internationalization implementation for the Swaggo application, supporting multiple languages with a flexible and scalable architecture.

## Table of Contents
1. [Overview](#overview)
2. [Supported Languages](#supported-languages)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Adding New Languages](#adding-new-languages)
6. [Using Translations](#using-translations)
7. [Language Selector Component](#language-selector-component)
8. [Testing](#testing)
9. [Best Practices](#best-practices)

## Overview

The i18n implementation provides:
- Multi-language support with fallback to default language
- Context-based translation management
- Persistent language selection using localStorage
- Dynamic language switching without page reload
- Accessible language selector component
- Comprehensive translation files with nested structure

## Supported Languages

Currently supported languages:
- **English (en)** - Default language
- **Spanish (es)**
- **French (fr)**

## Architecture

The i18n system consists of:
1. **I18nContext** - React context for managing translations
2. **useTranslation hook** - Custom hook for accessing translations
3. **Language selector component** - UI component for language switching
4. **JSON translation files** - Language-specific translation files
5. **Provider wrapper** - Top-level provider in the component tree

## Implementation Details

### I18nContext.js

The core context provides:
- Current language state
- Translation objects
- Language switching functionality
- Parameterized translation support
- localStorage persistence

```javascript
import { I18nProvider } from '../context/I18nContext';

// Wrap your app with the provider
<I18nProvider>
  <App />
</I18nProvider>
```

### useTranslation Hook

The hook provides easy access to translation functions:

```javascript
import { useTranslation } from '../hooks/useTranslation';

const MyComponent = () => {
  const { t, language, changeLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('common.itemsSelected', { count: 5 })}</p>
      <button onClick={() => changeLanguage('es')}>
        Change to Spanish
      </button>
    </div>
  );
};
```

### Translation Files Structure

Translation files follow a nested JSON structure:

```json
{
  "common": {
    "appName": "Swaggo",
    "loading": "Loading...",
    "save": "Save"
  },
  "auth": {
    "login": {
      "title": "Login to your account",
      "emailOrUsername": "Email or Username"
    }
  }
}
```

### Parameterized Translations

Support for dynamic content using parameter replacement:

```javascript
// Translation key with parameters
t('common.itemsSelected', { count: 5 })
// Result: "5 items selected"
```

## Adding New Languages

To add a new language:

1. **Create translation file**:
   ```
   Website/Frontend/locales/{language_code}.json
   ```

2. **Add to AVAILABLE_LANGUAGES** in `I18nContext.js`:
   ```javascript
   const AVAILABLE_LANGUAGES = {
     // ... existing languages
     de: { code: 'de', name: 'Deutsch', translations: deTranslations }
   };
   ```

3. **Import translation file**:
   ```javascript
   import deTranslations from '../locales/de.json';
   ```

## Using Translations

### Basic Usage

```javascript
const { t } = useTranslation();

// Simple translation
t('common.save') // "Save"

// Nested translation
t('auth.login.title') // "Login to your account"
```

### With Parameters

```javascript
// Translation with parameters
t('common.itemsSelected', { count: 5 }) // "5 items selected"

// Multiple parameters
t('common.ago', { time: '5 minutes' }) // "5 minutes ago"
```

### Conditional Translations

```javascript
const { language } = useTranslation();

// Use different content based on language
{language === 'en' && <EnglishContent />}
{language === 'es' && <SpanishContent />}
```

## Language Selector Component

The `LanguageSelector` component provides a UI for language switching:

### Variants

1. **Dropdown** (default):
   ```jsx
   <LanguageSelector />
   ```

2. **Icon only**:
   ```jsx
   <LanguageSelector variant="icon" />
   ```

3. **List**:
   ```jsx
   <LanguageSelector variant="list" />
   ```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS classes |
| showLabels | boolean | true | Whether to show language labels |
| variant | string | 'dropdown' | Display variant ('dropdown', 'icon', 'list') |

## Testing

### I18nContext Tests

Tests cover:
- Default language initialization
- Language switching functionality
- Parameterized translations
- Missing key handling
- Available languages list

### LanguageSelector Tests

Tests cover:
- Component rendering
- Dropdown functionality
- Language switching
- Accessibility features
- Different variants

## Best Practices

### Translation Key Organization

1. **Use descriptive, hierarchical keys**:
   ```
   auth.login.title
   auth.signup.password
   chat.messages.send
   ```

2. **Group related translations**:
   ```
   common.*          # Shared translations
   auth.*            # Authentication related
   chat.*            # Chat functionality
   settings.*        # Settings and preferences
   ```

### Translation File Maintenance

1. **Keep translations consistent** across languages
2. **Use parameterized translations** for dynamic content
3. **Maintain the same structure** in all language files
4. **Regularly audit** for missing translations

### Performance Considerations

1. **Only load current language** translations
2. **Cache translations** in context state
3. **Use localStorage** for language persistence
4. **Avoid deep nesting** in translation objects

### Accessibility

1. **Provide ARIA labels** for language selector
2. **Use semantic HTML** for language options
3. **Support keyboard navigation** in dropdowns
4. **Announce language changes** to screen readers

## Future Enhancements

Planned improvements:
- **Async loading** of translation files
- **Pluralization support** for complex languages
- **RTL language support** (Arabic, Hebrew)
- **Translation management tool** integration
- **Real-time translation updates** via API
- **Language detection** based on browser settings

## Troubleshooting

### Common Issues

1. **Missing translations**:
   - Ensure key exists in all language files
   - Check for typos in key names
   - Verify nested object structure

2. **Language not persisting**:
   - Check localStorage permissions
   - Verify I18nProvider is at app root
   - Confirm changeLanguage is being called

3. **Parameter replacement not working**:
   - Ensure parameters are passed as object
   - Check parameter names match translation placeholders
   - Verify translation key exists

### Debugging Tips

1. **Log current language**:
   ```javascript
   const { language } = useTranslation();
   console.log('Current language:', language);
   ```

2. **Check available translations**:
   ```javascript
   const { translations } = useTranslation();
   console.log('Translations:', translations);
   ```

3. **Verify language files**:
   - Check file paths
   - Validate JSON syntax
   - Ensure consistent structure