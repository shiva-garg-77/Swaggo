# Logger Migration Guide

## 🎯 Purpose

Replace `console.log` statements with environment-aware structured logging for better debugging in development and cleaner production builds.

---

## 📦 Installation

The logger is already created at `utils/logger.js`. No installation needed!

---

## 🚀 Quick Start

### Basic Usage

```javascript
import { logger } from '@/utils/logger';

// Instead of console.log
logger.debug('Debug info', { userId: 123 });

// Instead of console.info
logger.info('User logged in', { userId: 123 });

// Instead of console.warn
logger.warn('API slow response', { duration: 5000 });

// Instead of console.error
logger.error('Failed to fetch', error, { endpoint: '/api/users' });
```

### Namespaced Logger

For module-specific logging:

```javascript
import { createLogger } from '@/utils/logger';

const chatLogger = createLogger('Chat');

chatLogger.info('Message sent');  // [INFO] [Chat] Message sent
chatLogger.error('Send failed', error);
```

---

## 🔄 Migration Examples

### Before → After

#### Example 1: Debug Logging
```javascript
// ❌ BEFORE
console.log('Socket connected:', socket.id);

// ✅ AFTER
logger.debug('Socket connected', { socketId: socket.id });
```

#### Example 2: Error Handling
```javascript
// ❌ BEFORE
try {
  await sendMessage();
} catch (error) {
  console.error('Send failed:', error);
}

// ✅ AFTER
try {
  await sendMessage();
} catch (error) {
  logger.error('Send failed', error, { chatId, messageId });
}
```

#### Example 3: Performance Tracking
```javascript
// ❌ BEFORE
console.time('loadMessages');
const messages = await fetchMessages();
console.timeEnd('loadMessages');

// ✅ AFTER
const messages = await logger.trace('loadMessages', () => fetchMessages());
```

#### Example 4: Grouped Logs
```javascript
// ❌ BEFORE
console.log('Starting file upload...');
console.log('File:', file.name);
console.log('Size:', file.size);
console.log('Upload complete');

// ✅ AFTER
logger.group('File Upload', () => {
  logger.debug('File:', { name: file.name, size: file.size });
  // upload logic
  logger.info('Upload complete');
});
```

---

## 📋 Log Levels

| Level | When to Use | Production Output |
|-------|-------------|-------------------|
| `debug` | Detailed troubleshooting | ❌ Disabled |
| `info` | General information | ✅ Enabled |
| `warn` | Potentially harmful situations | ✅ Enabled + Monitored |
| `error` | Recoverable errors | ✅ Enabled + Monitored |
| `fatal` | Application-breaking errors | ✅ Enabled + Monitored |

---

## 🎨 Advanced Features

### 1. Performance Tracing

```javascript
// Automatically measures execution time
const result = logger.trace('Expensive Operation', () => {
  return complexCalculation();
});

// Works with async functions
const data = await logger.trace('API Call', async () => {
  return await fetch('/api/data');
});
```

### 2. Table Logging (Development Only)

```javascript
logger.table([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 }
], ['id', 'name']);  // Optional: specify columns
```

### 3. Contextual Logging

```javascript
// Add context to every log
const chatLogger = createLogger('Chat');

chatLogger.info('New message', { 
  chatId: chat.id,
  senderId: user.id,
  timestamp: Date.now()
});
```

---

## 🔧 Configuration

### Environment Variables

Set in `.env.local`:

```env
# Log level: DEBUG, INFO, WARN, ERROR, FATAL
NEXT_PUBLIC_LOG_LEVEL=DEBUG
```

### Production Monitoring Integration

In `utils/logger.js`, uncomment and configure:

```javascript
// For Sentry
if (window.Sentry && level >= LogLevels.ERROR) {
  window.Sentry.captureException(error || new Error(message), {
    level: level === LogLevels.FATAL ? 'fatal' : 'error',
    extra: context
  });
}

// For LogRocket
if (window.LogRocket) {
  window.LogRocket.log(level, message, context);
}
```

---

## 📝 Migration Checklist

### High Priority Files
- [ ] `MessageArea.js` - Replace ~50 console.log statements
- [ ] `SocketController.js` (backend) - Replace console logs
- [ ] `MessageInput.js` - Replace debug logs
- [ ] `ChatList.js` - Replace console logs

### Automated Migration Script

```bash
# Find all console.log statements in Chat components
grep -r "console.log" Components/Chat/ --exclude-dir=node_modules
```

### Search & Replace Patterns

Use your IDE's find & replace:

1. **Simple console.log**
   - Find: `console.log\(([^)]+)\);`
   - Replace: `logger.debug($1);`

2. **Console.error**
   - Find: `console.error\(([^,]+),\s*(.+)\);`
   - Replace: `logger.error($1, $2);`

3. **Console.warn**
   - Find: `console.warn\(([^)]+)\);`
   - Replace: `logger.warn($1);`

---

## 🧪 Testing

### Suppress Logs in Tests

```javascript
import { suppressLogs } from '@/utils/logger';

beforeAll(() => {
  suppressLogs();
});
```

### Test Logger Behavior

```javascript
import { logger } from '@/utils/logger';

test('should log error', () => {
  const spy = jest.spyOn(console, 'error');
  logger.error('Test error', new Error('Test'));
  expect(spy).toHaveBeenCalled();
});
```

---

## 📊 Benefits

### Development
- ✅ **Structured logs** with timestamps
- ✅ **Namespace filtering** by module
- ✅ **Performance tracing** built-in
- ✅ **Better debugging** with context

### Production
- ✅ **Reduced bundle size** (debug logs removed)
- ✅ **Error monitoring** integration
- ✅ **Performance insights**
- ✅ **Cleaner console** (only errors/warnings)

---

## 🚦 Best Practices

### DO ✅
```javascript
// ✅ Add context objects
logger.error('API call failed', error, {
  endpoint: '/api/messages',
  method: 'POST',
  userId: user.id
});

// ✅ Use appropriate levels
logger.debug('Rendering component');  // Development only
logger.error('Database query failed', error);  // Production

// ✅ Use namespaces for modules
const socketLogger = createLogger('Socket');
socketLogger.info('Connected');
```

### DON'T ❌
```javascript
// ❌ Don't log sensitive data
logger.info('User password', user.password);  // NEVER!

// ❌ Don't use console.log directly
console.log('Debug info');  // Use logger.debug() instead

// ❌ Don't log inside tight loops
for (let i = 0; i < 10000; i++) {
  logger.debug('Processing item', i);  // Performance issue!
}
```

---

## 🔍 Finding Console Statements

### Quick Search Commands

```bash
# Count console.log statements
grep -r "console.log" src/ | wc -l

# List files with console statements
grep -rl "console\.(log|error|warn)" src/

# Find specific patterns
grep -rn "console.log.*socket" src/
```

### VS Code Search

1. Open Search (Ctrl+Shift+F)
2. Use regex: `console\.(log|error|warn|info|debug)`
3. Replace with appropriate logger method

---

## 📈 Migration Progress Tracking

Use this template to track migration:

```markdown
## Logger Migration Status

### Components
- [x] MessageInput.js (15 logs → 15 migrated)
- [x] MessageArea.js (42 logs → 42 migrated)
- [ ] ChatList.js (18 logs → 0 migrated)
- [ ] SocketProvider.js (25 logs → 0 migrated)

### Total Progress: 57/100 (57%)

### Next Steps
1. Migrate ChatList.js
2. Migrate SocketProvider.js
3. Test in production
```

---

## 🆘 Common Issues

### Issue 1: "logger is not defined"
**Solution:** Import it
```javascript
import { logger } from '@/utils/logger';
```

### Issue 2: Logs not showing in dev
**Solution:** Check environment variable
```env
NEXT_PUBLIC_LOG_LEVEL=DEBUG
```

### Issue 3: Too many logs in production
**Solution:** Use appropriate log level
```javascript
// Development only
logger.debug('...');

// Production too
logger.error('...');
```

---

## 🎓 Real-World Examples

### Chat Component

```javascript
import { createLogger } from '@/utils/logger';

const chatLogger = createLogger('Chat');

function MessageArea() {
  const sendMessage = async (content) => {
    chatLogger.info('Sending message', { 
      chatId, 
      length: content.length 
    });
    
    try {
      const result = await logger.trace('sendMessage', () => 
        api.post('/messages', { content })
      );
      
      chatLogger.info('Message sent', { messageId: result.id });
    } catch (error) {
      chatLogger.error('Send failed', error, { 
        chatId, 
        retry: true 
      });
    }
  };
}
```

### Socket Handler

```javascript
import { createLogger } from '@/utils/logger';

const socketLogger = createLogger('Socket');

socket.on('connect', () => {
  socketLogger.info('Connected', { socketId: socket.id });
});

socket.on('error', (error) => {
  socketLogger.error('Socket error', error, { 
    reconnect: true 
  });
});

socket.on('new_message', (data) => {
  socketLogger.debug('Message received', { 
    messageId: data.messageid,
    chatId: data.chatid 
  });
});
```

---

## ✅ Completion Criteria

Migration is complete when:

- [ ] All `console.log` replaced with `logger.debug`
- [ ] All `console.error` replaced with `logger.error`
- [ ] All `console.warn` replaced with `logger.warn`
- [ ] Namespaced loggers created for major modules
- [ ] Production monitoring integrated (optional)
- [ ] Documentation updated
- [ ] Team trained on logger usage

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Ready for Migration 🚀
