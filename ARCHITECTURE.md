# insidebar.ai Architecture Documentation

## Overview

insidebar.ai is a Chrome/Edge extension (Manifest V3) that provides unified access to multiple AI providers through a persistent side panel. The extension enables seamless interaction with ChatGPT, Claude, Gemini, Google AI Mode, Grok, and DeepSeek from a single sidebar interface.

## Core Architecture Principles

### 1. Privacy-First Design
- **Zero Server Communication**: All data stored locally in browser IndexedDB
- **No Analytics**: No telemetry or usage tracking
- **Client-Side Only**: Extension operates entirely within the browser
- **User-Controlled Data**: Users own and control all saved conversations and prompts

### 2. Manifest V3 Compliance
- **Service Worker Background**: Uses event-driven service worker instead of background pages
- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **Declarative APIs**: Uses chrome.sidePanel and chrome.contextMenus
- **Isolated Worlds**: Content scripts run in isolated JavaScript context

### 3. Modular Design
- **Shared Utilities**: Reusable modules for common functionality
- **Provider-Agnostic Core**: Core features work across all AI providers
- **Loose Coupling**: Components communicate through well-defined interfaces
- **Progressive Enhancement**: Features degrade gracefully if APIs unavailable

## System Components

### 1. Extension Structure

```
chrome-extension/
├── manifest.json                  # Extension manifest (Manifest V3)
├── background/
│   └── service-worker.js         # Background service worker
├── sidebar/
│   ├── sidebar.html              # Side panel UI
│   ├── sidebar.js                # Side panel logic
│   └── sidebar.css               # Side panel styling
├── options/
│   ├── options.html              # Settings page
│   ├── options.js                # Settings logic
│   └── options.css               # Settings styling
├── modules/                       # Shared utility modules
│   ├── providers.js              # Provider definitions
│   ├── settings.js               # Settings management
│   ├── history-manager.js        # Chat history CRUD
│   ├── prompt-manager.js         # Prompt library CRUD
│   ├── storage-monitor.js        # Quota monitoring
│   ├── i18n.js                   # Internationalization
│   ├── theme-manager.js          # Theme switching
│   ├── messaging.js              # Cross-context messaging
│   ├── text-injector.js          # Text injection utilities
│   └── version-checker.js        # Version comparison
├── content-scripts/               # Provider-specific extractors
│   ├── conversation-extractor-utils.js
│   ├── chatgpt-history-extractor.js
│   ├── claude-history-extractor.js
│   ├── gemini-history-extractor.js
│   ├── grok-history-extractor.js
│   ├── deepseek-history-extractor.js
│   ├── google-history-extractor.js
│   ├── perplexity-history-extractor.js
│   ├── text-injection-all-providers.js
│   └── enter-behavior-*.js       # Enter key customization
├── _locales/                      # i18n translations
│   ├── en/messages.json
│   ├── zh_CN/messages.json
│   ├── zh_TW/messages.json
│   ├── ja/messages.json
│   ├── ko/messages.json
│   ├── es/messages.json
│   ├── fr/messages.json
│   ├── de/messages.json
│   ├── it/messages.json
│   └── ru/messages.json
└── data/
    └── prompt-libraries/          # Default prompts
```

### 2. Component Responsibilities

#### Service Worker (`background/service-worker.js`)
**Responsibilities**:
- Manage context menus (right-click → Send to AI)
- Handle keyboard shortcuts (`Cmd/Ctrl+Shift+E`, `Cmd/Ctrl+Shift+P`)
- Coordinate conversation saves from provider pages
- Track side panel open/close state per window
- Provide duplicate detection for conversations
- Fetch version updates from GitHub API

**Key Functions**:
- `createContextMenus()` - Dynamically build menus based on enabled providers
- `toggleSidePanel(windowId)` - Open/close panel with state tracking
- `handleSaveConversation(data)` - Save from content script to IndexedDB
- `handleCheckDuplicate(conversationId)` - Prevent duplicate saves
- Global error handlers for unhandled errors and promise rejections

#### Sidebar (`sidebar/`)
**Responsibilities**:
- Display AI provider iframes in tabs
- Manage Chat History UI with search, filtering, tagging
- Manage Prompt Library (Prompt Genie) with categories, favorites
- Handle text injection into AI provider input fields
- Switch between providers dynamically

**Key Features**:
- **Provider Tabs**: Dynamic tab bar based on enabled providers
- **Chat History**:
  - Advanced search with field operators (`title:`, `tag:`, `provider:`)
  - Fuzzy matching with Levenshtein distance
  - Relevance scoring and sorting
  - Favorites and provider filtering
- **Prompt Library**:
  - Quick access panel for recent/favorite prompts
  - Multiple sort options (recent, most-used, alphabetical, newest)
  - Category and tag filtering
  - Variable substitution in prompts
  - Workspace for editing selected text before sending

#### Options Page (`options/`)
**Responsibilities**:
- Configure enabled providers and default provider
- Customize theme (auto, light, dark)
- Set language preference (10 languages)
- Configure keyboard shortcuts
- Customize Enter key behavior for AI providers
- Import/export data (prompts, conversations, settings)
- View storage quota and statistics
- Check for updates

#### Content Scripts (`content-scripts/`)
**Responsibilities**:
- Extract conversation history from AI provider pages
- Inject text into AI provider input fields
- Modify Enter key behavior based on user settings
- Add "Save Conversation" button to provider UIs
- Extract page content for summarization

**Provider-Specific Extractors**:
- Each AI provider has a dedicated history extractor
- Shared utilities in `conversation-extractor-utils.js`:
  - HTML sanitization (XSS prevention)
  - Markdown extraction from DOM
  - Duplicate detection
  - Notification display
  - Keyboard shortcut handling

## Data Architecture

### 1. IndexedDB Schema

**Database**: `SmarterPanelDB` (version 4)

**Object Store: `prompts`**
```javascript
{
  id: number,              // Auto-increment primary key
  title: string,           // Prompt title
  content: string,         // Prompt text (may include {variables})
  category: string,        // Category (e.g., "Writing", "Coding")
  tags: string[],          // Tags for filtering
  variables: string[],     // Variable names used in content
  isFavorite: boolean,     // Favorite flag
  createdAt: number,       // Timestamp
  lastUsed: number|null,   // Last usage timestamp
  useCount: number         // Usage counter
}
```

**Indexes**:
- `title`, `category`, `tags` (multiEntry), `createdAt`, `lastUsed`, `isFavorite`

**Object Store: `conversations`**
```javascript
{
  id: number,              // Auto-increment primary key
  title: string,           // Conversation title
  content: string,         // Full conversation (markdown)
  provider: string,        // AI provider (chatgpt, claude, etc.)
  timestamp: number,       // Creation timestamp
  modifiedAt: number,      // Last modification timestamp
  tags: string[],          // Tags for organization
  isFavorite: boolean,     // Favorite flag
  notes: string,           // User notes
  conversationId: string,  // Provider-specific conversation ID
  url: string,             // Source URL
  searchText: string       // Pre-computed lowercase search index
}
```

**Indexes**:
- `provider`, `timestamp`, `tags` (multiEntry), `isFavorite`, `searchText`, `conversationId`

### 2. Chrome Storage

**chrome.storage.sync** (synchronized across devices):
```javascript
{
  enabledProviders: string[],     // ['chatgpt', 'claude', 'gemini', ...]
  defaultProvider: string,        // 'chatgpt'
  lastSelectedProvider: string,   // Last used provider
  rememberLastProvider: boolean,  // Startup behavior toggle
  theme: string,                  // 'auto' | 'light' | 'dark'
  language: string,               // 'en' | 'zh_CN' | 'zh_TW' | ...
  keyboardShortcutEnabled: boolean,
  autoPasteClipboard: boolean,   // Auto-paste on Cmd+Shift+P
  autoOpenSidebarOnSave: boolean, // Open sidebar after save
  enterKeyBehavior: {
    enabled: boolean,
    preset: string,              // 'default' | 'swapped' | 'slack' | 'discord' | 'custom'
    newlineKey: string,
    newlineModifiers: object,
    sendKey: string,
    sendModifiers: object
  }
}
```

**Fallback**: Uses `chrome.storage.local` if sync unavailable

## Key Workflows

### 1. Opening Sidebar
```
User clicks extension icon / uses keyboard shortcut
  ↓
Service worker receives action click
  ↓
Service worker checks side panel state for window
  ↓
If closed:
  - chrome.sidePanel.open({windowId})
  - Update state map: sidePanelState.set(windowId, true)
If open:
  - Send 'closeSidePanel' message to sidebar
  - Update state map: sidePanelState.set(windowId, false)
  ↓
Sidebar loads, checks settings for startup provider
  ↓
If rememberLastProvider: Load lastSelectedProvider
Else: Load defaultProvider
  ↓
Render provider iframe in active tab
```

### 2. Saving Conversation
```
User on ChatGPT page presses Cmd+Shift+S
  ↓
Content script (chatgpt-history-extractor.js) extracts conversation
  - Use extractMarkdownFromElement() for each message
  - Sanitize HTML to prevent XSS
  - Format as markdown with role labels
  ↓
Content script generates conversationId from URL
  ↓
Send to service worker: {action: 'checkDuplicateConversation'}
  ↓
Service worker queries IndexedDB via history-manager.js
  ↓
If duplicate found:
  - Show modal with overwrite option
  - If cancel: abort
  - If overwrite: set overwriteId
  ↓
Send to service worker: {action: 'saveConversationFromPage', payload: data}
  ↓
Service worker calls saveConversation() from history-manager.js
  - Validate input (max lengths, required fields)
  - Check storage quota (canPerformStorageOperation)
  - If quota exceeded: throw error
  - Sanitize fields
  - Generate searchText index
  - Save to IndexedDB with retry logic (up to 3 attempts)
  - Monitor quota after save
  ↓
If successful:
  - Notify sidebar to refresh chat history
  - If autoOpenSidebarOnSave: Open sidebar and switch to chat history
  ↓
Show success notification
```

### 3. Searching Chat History
```
User types in search box: "title:API tag:nodejs OR python"
  ↓
Parse search query into structured options:
  - Extract exact phrases: "exact phrase"
  - Extract field searches: title:, tag:, provider:, content:
  - Extract exclude terms: -keyword
  - Detect operator: OR | AND (default)
  - Extract regular terms
  ↓
Query IndexedDB using cursor
  - If provider filter: Use provider index
  - Else: Use primary cursor
  ↓
For each conversation:
  - Check exclude terms (must not match)
  - Check exact phrases (must all match)
  - Check field-specific searches
  - Check general terms with fuzzy matching
  - Calculate relevance score:
    - Title matches: +10
    - Tag matches: +5
    - Notes matches: +3
    - Content matches: +1
    - Field-specific bonus: +5
    - Exact phrase bonus: +8
    - Recency bonus: +3 (< 7 days), +1 (< 30 days)
  ↓
Sort by relevance score (desc), then timestamp (desc)
  ↓
Render results in conversation list
```

### 4. Injecting Text into AI Provider
```
User selects text on page, right-click → Send to ChatGPT
  ↓
Service worker receives context menu click
  ↓
Service worker opens side panel
  ↓
Service worker sends message: {action: 'switchProvider', payload: {providerId, selectedText}}
  ↓
Sidebar receives message, switches to provider tab
  ↓
Sidebar calls injectTextIntoProvider(iframe, text)
  ↓
Text injector finds input element using provider-specific selectors:
  - ChatGPT: #prompt-textarea
  - Claude: div[contenteditable][enterkeyhint="enter"]
  - Gemini: .ql-editor.textarea
  - Grok: div[data-testid="tweetTextarea_0"]
  - DeepSeek: #chat-input
  ↓
Set text content:
  - For contenteditable: Set innerHTML and trigger input event
  - For textarea: Set value property and trigger input event
  ↓
Focus element
  ↓
Text appears in AI provider's input field
```

### 5. Storage Quota Monitoring
```
User saves conversation or prompt
  ↓
Before save: Call canPerformStorageOperation(estimatedSize)
  ↓
Check Navigator.storage.estimate()
  - If quotaInfo.level === 'danger' (95%+): Block save, throw error
  - If estimated operation would exceed 100%: Block save
  - Else: Allow operation
  ↓
Perform save to IndexedDB
  ↓
After save: Call monitorStorageQuota()
  ↓
Check quota level:
  - safe (< 80%): No action
  - warning (80-90%): Show chrome.notification with warning
  - critical (90-95%): Show chrome.notification with urgent warning
  - danger (95%+): Show chrome.notification with critical alert
  ↓
Options page displays quota: "X MB / Y MB (Z%)" with color coding:
  - Green: safe
  - Orange: warning
  - Red: critical/danger
```

## Security Measures

### 1. Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
frame-src
  https://chatgpt.com
  https://claude.ai
  https://gemini.google.com
  https://google.com
  https://www.google.com
  https://grok.com
  https://x.com
  https://chat.deepseek.com
  https://www.perplexity.ai;
```

### 2. HTML Sanitization
**Input**: AI-generated HTML from conversation extraction
**Process**:
1. Whitelist safe tags: p, div, span, br, h1-h6, strong, b, em, i, code, pre, ul, ol, li, blockquote, a
2. Whitelist safe attributes: href (for a), class (for code/pre)
3. Reject dangerous tags: script, iframe, object, embed, style, link
4. Block dangerous URLs: javascript:, data:, vbscript:
5. Remove event handlers: onclick, onerror, onload, etc.

**Output**: Safe markdown-formatted text

### 3. Input Validation
- **Max Lengths**: Title (200), Content (100,000), Tags (30 each, max 20), Notes (5,000)
- **Required Fields**: content (conversations/prompts)
- **Type Validation**: Ensure strings, booleans, arrays are correct types
- **Array Limits**: Max 20 tags, sanitize each element
- **Auto-Sanitization**: Trim whitespace, slice to max length, filter empty strings

### 4. Quota Enforcement
- **Proactive Checks**: Validate before save operations
- **Size Estimation**: Calculate object size using JSON.stringify().length * 2 (UTF-16)
- **Rejection Thresholds**: Block saves at 95% quota usage
- **User Warnings**: Notify at 80%, 90%, 95% thresholds
- **Import Validation**: Check total size before bulk imports

## Performance Optimizations

### 1. IndexedDB Query Optimization
- **Indexes**: Use indexes for frequently queried fields (provider, timestamp, isFavorite, tags)
- **Cursor-Based Filtering**: Filter results during iteration instead of loading all then filtering
- **Selective Loading**: Use `index.get()` and `index.getAll()` when possible
- **Search Text Index**: Pre-compute lowercase concatenated search text for faster searching

### 2. Lazy Loading
- **Iframe Loading**: Only load active provider iframe, lazy load others on tab switch
- **Conversation Content**: Load conversation metadata first, full content on demand
- **Prompt Preview**: Show title/category, load full content on selection

### 3. Caching
- **Settings**: Cache settings in memory, sync on changes
- **Provider Definitions**: Static PROVIDERS array, no repeated fetches
- **DOM Query Caching**: Cache frequently accessed DOM elements (planned improvement)

### 4. Retry Logic
- **IndexedDB Operations**: Retry up to 3 times with exponential backoff (100ms, 200ms, 400ms)
- **Quota Exceeded**: Immediate failure with descriptive error
- **Transient Failures**: Retry on connection closed, timeout errors

## Internationalization (i18n)

### Supported Languages
- English (en)
- Simplified Chinese (zh_CN)
- Traditional Chinese (zh_TW)
- Japanese (ja)
- Korean (ko)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Russian (ru)

### Implementation
- **Message Files**: `_locales/{locale}/messages.json`
- **Dynamic Loading**: Load translations based on user settings or browser language
- **Fallback**: English if requested language unavailable
- **Translation Function**: `t(key, ...substitutions)` for dynamic translation
- **Page Translation**: `translatePage()` updates all `data-i18n` attributes
- **HTML Translation**: `data-i18n-html` for HTML content (e.g., `<br>` tags)
- **Placeholder Translation**: `data-i18n-placeholder` for input placeholders

## Extension Lifecycle

### Installation
1. `chrome.runtime.onInstalled` fires
2. Create context menus via `createContextMenus()`
3. Load keyboard shortcut settings
4. Configure side panel behavior (`openPanelOnActionClick: false`)

### Startup
1. `chrome.runtime.onStartup` fires
2. Load keyboard shortcut settings
3. Configure side panel behavior
4. Initialize language from settings

### Update
1. `chrome.runtime.onInstalled` with `reason: 'update'` fires
2. Run database migrations if schema changed
3. Preserve user data
4. Update context menus

### Uninstall
- IndexedDB data persists (user can manually clear via browser)
- chrome.storage.sync data persists (synchronized)

## Error Handling Strategy

### 1. Global Handlers
- **Service Worker**: Catch unhandled errors and promise rejections
- **Logging**: Log detailed error info (message, filename, line, column, stack trace)
- **User Notification**: Show chrome.notification for critical errors
- **Graceful Degradation**: Extension continues functioning after non-critical errors

### 2. Storage Errors
- **Quota Exceeded**: Throw descriptive error, suggest deleting old data
- **Connection Closed**: Retry with exponential backoff
- **Database Version Mismatch**: Handle via `onupgradeneeded` callback
- **Permission Denied**: Fallback to chrome.storage.local if sync unavailable

### 3. UI Errors
- **Silent Failures**: Operations that don't affect user experience fail silently with console logs
- **User-Facing Errors**: Show inline error messages for validation, save failures
- **Fallback UI**: Show placeholder or default values if data unavailable

### 4. Network Errors
- **Version Check**: Fail gracefully if GitHub API unavailable
- **Default Library**: Show error if default prompts can't be fetched
- **Timeout Handling**: 2-minute timeout for bash commands

## Testing Strategy

### Unit Tests
- **Prompt Manager**: CRUD operations, validation, import/export (`tests/prompt-manager.test.js`)
- **Future**: History manager, search, sanitization

### Manual Testing
- Cross-browser: Chrome, Edge, Brave
- Cross-platform: Windows, macOS, Linux
- Provider compatibility: ChatGPT, Claude, Gemini, Grok, DeepSeek
- Language switching: All 10 supported languages
- Theme switching: Auto, light, dark modes

### Integration Testing
- Conversation save flow end-to-end
- Text injection across providers
- Search with complex queries
- Import/export data integrity

## Future Improvements

### Performance
- Cache DOM query references in options.js
- Replace URL polling with History API events
- Implement virtual scrolling for large conversation lists
- Add progressive loading for chat history

### Code Quality
- Add comprehensive unit tests for all modules
- Extract more reusable utilities
- Standardize CSS naming (BEM or similar)
- Add JSDoc comments to all public APIs

### Features
- Conversation branching and threading
- Advanced prompt variables with conditionals
- Export conversations as PDF/HTML
- Sync conversations across devices (optional cloud storage)
- Support more AI providers (if they allow iframe embedding)

## Known Limitations

### Iframe Embedding Restrictions
Some AI providers block iframe embedding via CSP `frame-ancestors` directive:
- **Perplexity**: Blocks all iframe embedding
- **Google (some modes)**: May block embedding
- **Workaround**: None - requires provider to whitelist extension origin

### Content Script Limitations
- **SPA Detection**: URL change polling may have slight delay
- **DOM Selectors**: May break if provider changes UI structure
- **Message Extraction**: Limited to visible DOM elements

### Storage Quotas
- **IndexedDB**: Typically ~50% of available disk space, but browser-dependent
- **chrome.storage.sync**: 100KB limit, 8KB per item (rarely hit)

### Cross-Origin Restrictions
- Cannot inject JavaScript into provider iframes (by design)
- Cannot read iframe content (by design)
- Limited to message passing and content script injection on provider pages

## Dependencies

### External Libraries
- **Marked.js** (sidebar/marked.min.js): Markdown parsing for conversation preview
- **Readability.js** (libs/Readability.js): Page content extraction

### Chrome APIs
- `chrome.sidePanel`: Side panel management
- `chrome.contextMenus`: Right-click context menus
- `chrome.commands`: Keyboard shortcuts
- `chrome.storage.sync/local`: Settings persistence
- `chrome.runtime`: Extension lifecycle, messaging
- `chrome.tabs`: Tab management
- `chrome.i18n`: Internationalization
- `chrome.notifications`: User notifications

### Browser APIs
- `indexedDB`: Local data storage
- `navigator.storage.estimate()`: Storage quota information
- `window.matchMedia`: Theme detection
- `navigator.userAgentData`: Browser detection
- `History API`: Navigation events (planned)

## Version History

See CHANGELOG.md for detailed version history.

Current Version: 1.5.0 (2025-10-18)

## Contributing

See the main README.md for contribution guidelines.

## License

See LICENSE file for license information.
