# Changelog

All notable changes to insidebar.ai extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Add HTML sanitization to markdown extractor with whitelist-based tag/attribute filtering
- Implement Content Security Policy (CSP) in sidebar to restrict iframe sources
- Block dangerous URLs (javascript:, data:, vbscript:) in extracted content
- Remove all event handlers from sanitized HTML

### Reliability
- Add global error handlers to service worker for unhandled errors and promise rejections
- Add proactive storage quota monitoring to prevent silent save failures
- Notify users at 80%, 90%, 95% storage thresholds
- Block saves when storage exceeds 95% quota
- Display accurate storage quota in options page (MB / MB with percentage)

### Fixed
- Fix Google AI Mode conversation ID collision by appending timestamp
- Fix www.google.com not loading in sidebar (CSP whitelist)

### Code Quality
- Refactor markdown extractor to reduce cyclomatic complexity from 18 to ~5
- Extract tag-specific handlers into markdownHandlers object
- Improve code maintainability and readability

### Documentation
- Add ARCHITECTURE.md with comprehensive system design documentation
- Add CHANGELOG.md for version tracking

## [1.5.0] - 2025-01-18

### Added
- Multi-language support for 10 languages:
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
- Language selection in options page
- i18n support for sidebar UI, context menus, and options page
- Translation function with substitution support
- Auto-detection of browser language on first install

### Changed
- Dynamic provider dropdown in options page (shows only enabled providers)
- "Remember Last Provider" toggle to control sidebar startup behavior
  - When enabled: Opens last selected provider
  - When disabled: Always opens default provider

### Fixed
- Clear lastSelectedProvider when provider is disabled
- Fix language switching to work immediately without page reload
- Fix missing translation keys in options page

## [1.4.0] - 2024-12-15

### Added
- Version check feature for zip installations
- Automatic version update script for version-info.json
- Download latest version link in options page
- Build date and commit hash display in About section

### Fixed
- Fix version check CORS issue by using background service worker
- Move GitHub API calls from options page to service worker

## [1.3.0] - 2024-12-10

### Added
- Custom Enter key behavior for AI providers
  - Presets: Default, Swapped, Slack-style, Discord-style, Custom
  - Per-provider key mapping configuration
  - Enable/disable toggle in options
- Auto-paste clipboard option for Prompt Library shortcut
- Auto-open sidebar after conversation save option

### Changed
- Improve keyboard shortcut UX
- Add Edge browser detection and shortcut helper
- Refine Danger Zone styling in options page

## [1.2.0] - 2024-11-28

### Added
- Prompt Library (Prompt Genie) feature
  - Save and organize reusable prompts
  - Categories and tags for organization
  - Variable substitution in prompts
  - Quick access panel for recent/favorite prompts
  - Import/export prompts as JSON
  - Default prompt library with meta-prompts
- Prompt workspace for editing text before sending
- Provider selection in workspace

### Changed
- Improve sidebar UI with workspace area
- Add multiple sort options (recent, most-used, alphabetical, newest)
- Enhanced search with category filtering

## [1.1.0] - 2024-11-15

### Added
- Chat History feature
  - Save conversations from AI provider pages
  - Keyboard shortcut (Cmd/Ctrl+Shift+S) to save
  - Advanced search with field operators
  - Fuzzy matching with Levenshtein distance
  - Favorites and tagging system
  - Provider filtering
  - Export/import conversations as JSON
- Duplicate detection for conversations
- Conversation metadata (timestamp, notes, URL)

### Changed
- Improve conversation extraction with markdown formatting
- Add relevance scoring for search results

## [1.0.0] - 2024-11-01

### Added
- Initial release
- Multi-AI provider sidebar with iframe embedding
  - ChatGPT
  - Claude
  - Gemini
  - Google AI Mode
  - Grok
  - DeepSeek
- Provider tabs for quick switching
- Context menu integration (right-click → Send to AI)
- Keyboard shortcuts
  - Cmd/Ctrl+Shift+E: Open sidebar
  - Cmd/Ctrl+Shift+P: Open Prompt Library
- Settings page
  - Enable/disable providers
  - Default provider selection
  - Theme switching (auto, light, dark)
  - Keyboard shortcut toggle
- Text injection into AI provider input fields
- Page content extraction for summarization
- IndexedDB for local data storage
- Chrome storage for settings sync

### Security
- Manifest V3 compliance
- Service worker background script
- Content Security Policy for iframe sources
- Isolated content script execution

---

## Version History Summary

- **1.5.0** (2025-01-18): Multi-language support, dynamic provider dropdown
- **1.4.0** (2024-12-15): Version checking, auto-update script
- **1.3.0** (2024-12-10): Custom Enter key behavior
- **1.2.0** (2024-11-28): Prompt Library (Prompt Genie)
- **1.1.0** (2024-11-15): Chat History with advanced search
- **1.0.0** (2024-11-01): Initial release

## Links

- [GitHub Repository](https://github.com/xiaolai/insidebar-ai)
- [Report Issues](https://github.com/xiaolai/insidebar-ai/issues)

## Upgrade Notes

### From 1.4.x to 1.5.0
- Settings will be preserved automatically
- Language will default to browser language (or English)
- You can change language in Options → Appearance → Language
- New "Remember Last Provider" setting defaults to `true` (current behavior)

### From 1.3.x to 1.4.0
- No breaking changes
- Version info now displayed in About section
- Can check for updates manually via "Check for Updates" button

### From 1.2.x to 1.3.0
- Enter key behavior defaults to "Swapped" (Enter=Newline, Shift+Enter=Send)
- Can customize or disable in Options → Enter Key Behavior
- Setting applies to all supported AI providers

### From 1.1.x to 1.2.0
- Existing conversations are preserved
- Prompt Library is a new feature, no migration needed
- Default prompt library can be imported from Options page

### From 1.0.x to 1.1.0
- IndexedDB schema upgraded from version 2 to version 3
- Migration is automatic and non-destructive
- Existing settings are preserved

## License

See LICENSE file for license information.
