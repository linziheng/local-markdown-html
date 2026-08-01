# LocalMarkdown Design Specification

Status: Approved design  
Date: 2026-08-01  
Primary browser: Google Chrome  
Release artifact: `localmarkdown.html`

## Summary

LocalMarkdown is a lightweight, zero-install Markdown workspace for everyday notes. The complete user-facing application is one self-contained HTML file named `localmarkdown.html`. A user opens that file directly in Chrome; LocalMarkdown requires no installation, server, account, network connection, or external runtime asset.

LocalMarkdown keeps multiple notes in local browser storage and provides automatic saving, search, pinning, import, export, and a dedicated reading view. Its default editing experience is an Obsidian-inspired Live Preview: the Markdown near the text cursor remains editable source, while inactive Markdown is visually formatted in the same continuous editor.

## Goals

- Make capturing and retrieving everyday notes fast.
- Deliver the entire runtime application as `localmarkdown.html`.
- Work offline after the file is downloaded, without runtime network requests.
- Provide a multi-document workspace with dependable automatic saving.
- Make formatted Markdown visible while the user continues editing.
- Keep notes portable through individual Markdown files and a complete LocalMarkdown workspace backup.
- Provide Solarized Light and Solarized Dark themes.
- Keep the repository modular, testable, reproducible, and consistently branded LocalMarkdown.

## Non-goals for version 1

- Folders, tags, or backlinks
- Cloud synchronization or accounts
- Collaborative editing
- Direct folder access through the File System Access API
- Embedded image storage
- Plug-ins or an extension API
- Mobile-specific layouts or packaging
- Exact feature parity with Obsidian

These exclusions protect the everyday-notes focus. The architecture must not prevent later additions, but version 1 will not expose incomplete foundations for them.

## Product experience

### Workspace layout

LocalMarkdown uses a write-first layout:

- A compact sidebar contains New note, search, pinned notes, and recently edited notes.
- The editor occupies most of the window.
- The header contains the LocalMarkdown wordmark, view control, theme control, document actions, and save status.
- Reading view replaces the editor rather than opening a permanent side-by-side pane.
- The sidebar can collapse for a larger writing surface.

This layout favors frequent note switching without reducing the editor to a narrow column.

### Creating and naming notes

New note creates a blank document, selects it, and moves focus into the editor. LocalMarkdown derives the display title from the first Markdown heading or the first non-empty line. A document with no non-empty content is titled “Untitled note.”

Derived titles update while editing. When exporting an individual note, LocalMarkdown converts the derived title to a safe filename, preserves the `.md` extension, and adds a numeric suffix if necessary.

### Note list behavior

- Pinned notes appear first.
- Unpinned notes follow in most-recently-edited order.
- Search matches document titles and Markdown contents without case sensitivity.
- Search results retain pinned-first, recently-edited ordering.
- The active note remains visually distinct.
- Each note menu offers Pin or Unpin, Duplicate, Download Markdown, and Delete.
- Delete requires confirmation and provides a time-limited Undo action.

## Editing model

### Live Preview

Live Preview is the default view. It is one continuous editor, not an editor beside a preview.

- Markdown syntax remains visible and editable around the text cursor.
- When the text cursor leaves a supported Markdown construct, that construct adopts its rendered visual style in place.
- Selecting formatted content reveals the source syntax required to edit it.
- Keyboard selection, text input, copy and paste, undo and redo, and input-method composition remain native editor operations.
- Formatting is decorative: the authoritative document is always the Markdown string, never rendered HTML.

The editor foundation is CodeMirror 6. LocalMarkdown will implement Live Preview with editor state, parsed Markdown ranges, and view decorations. The implementation must not replace editor content with generated HTML during ordinary typing.

### Reading view

Reading view renders the complete note without text-cursor or editing affordances. Switching views preserves scroll position as closely as practical and never changes Markdown content.

### Supported Markdown

Version 1 supports:

- Paragraphs and line breaks
- ATX headings levels 1 through 6
- Bold, italic, and strikethrough text
- Inline code and fenced code blocks
- Links
- Blockquotes
- Ordered and unordered lists
- Task lists
- Horizontal rules

Raw HTML is displayed as text rather than executed. Markdown image syntax is shown as a safe placeholder or link; LocalMarkdown does not automatically load remote images. Tables, footnotes, mathematical notation, embedded media, and application-specific wiki links are deferred.

### Keyboard behavior

LocalMarkdown provides keyboard commands for:

- Create note
- Focus search
- Toggle Live Preview and Reading view
- Toggle sidebar
- Download the active note
- Bold, italic, strikethrough, inline code, link, and task-list formatting
- Indent and outdent list items

Shortcuts use platform-appropriate modifier labels in the interface. Browser-reserved shortcuts are avoided.

## Themes and visual design

LocalMarkdown uses the official Solarized palette.

- System is the initial theme preference.
- System follows the operating system or browser color-scheme preference.
- Users can override System with Solarized Light or Solarized Dark.
- The selected preference persists locally.
- Theme changes do not alter editor content or workspace data.
- Solarized blue identifies primary actions. Solarized semantic accents distinguish interactive state and Markdown constructs without relying on color alone.

The interface uses visible keyboard focus, comfortable line length, restrained motion, and consistent spacing. LocalMarkdown honors `prefers-reduced-motion`.

## Architecture

### Runtime artifact

The release is exactly one required application file, `localmarkdown.html`. It embeds all HTML, CSS, JavaScript, editor code, Markdown rendering code, icons, and other runtime assets. It contains no CDN references, module imports, remote fonts, analytics, telemetry, or update checks.

The source repository may use development dependencies. They are build-time only and are not required to run `localmarkdown.html`.

### Source boundaries

The source is divided into units with narrow responsibilities:

- **Workspace model:** document schema, title derivation, ordering, search, duplication, and deletion undo.
- **Workspace store:** versioned serialization, Chrome storage, staged writes, migration, and storage error reporting.
- **Import and export:** Markdown import, Markdown download, workspace validation, merge, and replacement.
- **Markdown service:** parsing, safe reading-view rendering, and feature policy.
- **Live Preview editor:** CodeMirror setup, Markdown decorations, formatting commands, and editor/view synchronization.
- **Application controller:** selected document, view state, commands, save scheduling, and orchestration.
- **UI components:** sidebar, toolbar, editor host, reading view, dialogs, toasts, and status messages.
- **Theme service:** System, Solarized Light, and Solarized Dark selection.

Components communicate through explicit functions and immutable data where practical. UI modules do not access browser storage directly. The workspace store does not depend on DOM components.

### Dependency policy

Dependencies must justify their release size and maintenance cost. CodeMirror 6 supplies editing, selection, history, keyboard, accessibility, and input-method behavior. A standards-oriented Markdown parser supplies reading-view output. Rendered output is sanitized or constructed through safe DOM operations.

Production dependencies are bundled into `localmarkdown.html`. Licenses and required notices are retained in repository documentation and the built artifact where required.

## Workspace data model

The serialized workspace has this conceptual shape:

```text
LocalMarkdownWorkspace
  product: "LocalMarkdown"
  schemaVersion: 1
  exportedAt: ISO timestamp when exported
  activeDocumentId: document identifier or null
  preferences:
    theme: "system" | "light" | "dark"
    sidebarCollapsed: boolean
    view: "live-preview" | "reading"
  documents[]:
    id: stable random identifier
    markdown: source text
    pinned: boolean
    createdAt: ISO timestamp
    updatedAt: ISO timestamp
```

Timestamps are stored in UTC and formatted in local time for display. Derived titles are not authoritative persisted data; LocalMarkdown recalculates them from Markdown to prevent title/content drift.

Internal deletion-undo state is session-only and is not included in workspace exports.

## Data flow and persistence

1. On startup, LocalMarkdown loads and validates the stored workspace.
2. If no workspace exists, LocalMarkdown creates one welcome note explaining local storage and backup export.
3. Selecting a note supplies its Markdown to the editor.
4. Editing immediately updates the in-memory document and visible derived title.
5. LocalMarkdown schedules a debounced save after 300 milliseconds of inactivity.
6. Saving serializes and validates the complete workspace before writing it.
7. The status moves through Saving, Saved, or Save failed.
8. Search and ordering operate against the in-memory documents and do not require storage reads.

The version 1 Chrome storage adapter uses `localStorage` behind a narrow interface. Its key is namespaced with `LocalMarkdown` and the schema version. A future adapter can migrate the same workspace model to IndexedDB without changing editor or UI modules.

LocalMarkdown never presents browser storage as a backup. The welcome note and workspace menu explain how to export a complete LocalMarkdown workspace backup.

## Import and export

### Markdown files

- Importing one or more `.md` files creates new LocalMarkdown documents.
- Imported filenames are not trusted as HTML and are used only as fallback title text when the Markdown is empty.
- Downloading a note creates a UTF-8 `.md` file with a safe filename.

### Complete workspace backup

- Export creates a UTF-8 JSON file named `LocalMarkdown-workspace.json`.
- The backup includes the product marker, schema version, export timestamp, preferences, active document, and all documents.
- Import parses and validates the entire candidate before changing memory or storage.
- Merge is the default and assigns new identifiers when imported identifiers conflict.
- Replace requires explicit confirmation and retains the current in-memory workspace until the replacement is validated and stored successfully.
- Unsupported future schema versions produce an explanation and do not modify the workspace.

## Security and privacy

- LocalMarkdown makes no intentional network requests at runtime.
- It contains no analytics, tracking, account system, or telemetry.
- Imported Markdown is untrusted input.
- Raw HTML is not executed.
- Unsafe URL schemes are removed from rendered links.
- External links open with protections against access to the originating window.
- Remote images are not fetched automatically.
- Exported files are created locally through browser APIs.

The README states that anyone with access to the Chrome profile may be able to access locally stored notes. LocalMarkdown does not claim to encrypt workspace data.

## Error handling

### Storage unavailable or full

LocalMarkdown retains the current in-memory workspace, keeps the editor usable, shows a persistent Save failed status, explains that changes may be lost when the page closes, and offers immediate workspace export. A failed write must not intentionally delete the last successfully stored workspace.

### Invalid stored data

LocalMarkdown does not overwrite unparseable stored data automatically. It enters recovery mode, offers a download of the raw stored value when possible, and allows the user to start a new workspace only after confirmation.

### Invalid imports

LocalMarkdown reports the problem, including unsupported schema versions, and leaves the current workspace unchanged. Valid `.md` files imported alongside invalid files are reported individually rather than silently discarded.

### Editor or rendering failure

The Markdown source remains recoverable. Reading-view failures fall back to escaped plain text. A Live Preview decoration failure must not prevent source editing.

## Accessibility

- All controls have accessible names and keyboard access.
- Focus order follows the visible layout.
- Focus indicators remain visible in both Solarized themes.
- Status changes use an appropriate live region without announcing every keystroke.
- Dialog focus is trapped and returns to the invoking control.
- Color is not the only indicator of selection, errors, or save state.
- The editor retains CodeMirror accessibility behavior and does not disable browser zoom.

## Testing strategy

### Unit tests

Unit tests cover:

- Workspace schema validation and migrations
- Title derivation and safe export filenames
- Pinned and recent ordering
- Title and content search
- Duplicate and deletion-undo behavior
- Save scheduling and storage failures
- Markdown and workspace import validation
- Merge and replacement semantics
- Safe link and HTML handling
- Theme preference resolution

### Editor tests

Editor-focused tests cover:

- Live Preview decorations inside and outside the text-cursor range
- Cursor movement between Markdown constructs
- Formatting commands
- Undo and redo
- Paste behavior
- Reading-view rendering
- Fallback to source editing when a decoration fails

### Chrome end-to-end tests

Automated Chrome tests open the generated `localmarkdown.html` as a local file and verify:

- First-run welcome note
- Creating, editing, selecting, pinning, duplicating, and deleting notes
- Automatic persistence after reload
- Search by title and content
- Live Preview and Reading view switching
- System, Solarized Light, and Solarized Dark preferences
- Markdown import and download
- Complete workspace export, merge, and replacement
- Save-error and invalid-import messaging
- Core keyboard-only workflows

### Release verification

The release process verifies:

- `localmarkdown.html` is the only required runtime file.
- All runtime code and assets are embedded.
- No runtime CDN references or remote resource dependencies exist.
- LocalMarkdown naming is consistent across the interface, source, README, scripts, tests, and release documentation.
- The built artifact is regenerated from the tested source.
- Accessibility smoke checks pass in both themes.

## Repository and release requirements

- The repository title and documentation use LocalMarkdown.
- The main README explains opening `localmarkdown.html`, local storage limitations, backup workflow, development, testing, and release verification.
- Source identifiers and user-facing strings use LocalMarkdown consistently.
- The final artifact is always named exactly `localmarkdown.html`, as required.
- Release notes identify the product as LocalMarkdown.
- The repository includes third-party license notices for bundled code.

## Acceptance criteria

Version 1 is complete when a Chrome user can:

1. Download or copy `localmarkdown.html` and open it directly.
2. Use LocalMarkdown without an installation, server, account, or network connection.
3. Create and manage multiple automatically saved notes.
4. Search and pin notes.
5. Edit Markdown using the approved Live Preview behavior.
6. switch to a safe Reading view.
7. Use System, Solarized Light, and Solarized Dark themes.
8. Import and export Markdown files.
9. Export, merge, and replace a complete LocalMarkdown workspace backup.
10. Recover note source or export it when saving or rendering fails.

The automated test suite and release checks must pass against the generated `localmarkdown.html` before it is published.
