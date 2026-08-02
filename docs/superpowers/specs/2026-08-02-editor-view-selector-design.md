# Editor View Selector Design

## Goal

Make Vditor's three editor views directly selectable from the top of the Local Markdown window. The selector shows all three choices at once, starts in instant-rendering (`ir`) mode, and keeps the current selection while the user switches between open files.

## Toolbar hierarchy

The main toolbar has three semantic regions:

1. The current save/status message on the left.
2. A centered segmented selector containing **WYSIWYG**, **IR**, and **Split**.
3. **Open file**, the conditionally visible **Save**, and **Close** on the right.

The selector is one compact control rather than three unrelated action buttons. Its selected segment has a clear filled background and accessible selected state. It remains disabled until Vditor is ready.

On narrow windows, the toolbar may stop being geometrically centered: the status can be hidden and the selector can flow immediately before the file actions. All three view choices remain visible rather than collapsing into a dropdown.

## Examples placement

**Examples** moves out of the main toolbar and becomes a pinned first entry in the sidebar above user files. This separates content navigation from file operations.

The pinned entry always remains available, including after the user views another file. Because Examples is built-in content rather than an open user file, **Close** is disabled while it is active. Selecting it restores the built-in example content and activates it without creating duplicate sidebar entries.

## View behavior

The labels map to Vditor modes as follows:

| Label | Vditor mode | Meaning |
| --- | --- | --- |
| WYSIWYG | `wysiwyg` | Fully rendered editing |
| IR | `ir` | Instant rendering |
| Split | `sv` | Markdown source and preview panes |

Before changing modes, Local Markdown captures the active editor value so unsaved edits and embedded-attachment references are retained. It then asks the existing Vditor instance to change mode, updates the selected segment, restores attachment previews as needed, and returns focus to the editor.

The chosen view is application-wide rather than file-specific. Switching files does not change it. Reloading the page starts in IR again; the setting is not persisted.

Clicking the already-selected view is a no-op. If a mode change cannot be completed, the prior selection remains active and the status area reports that the editor view could not be changed.

## Accessibility

The selector is exposed as a labeled group of toggle buttons. Each segment is keyboard focusable and communicates its current state with `aria-pressed`. Focus styling follows the app's existing visible button outline. Full labels remain present at every supported width.

The pinned Examples entry uses the same current-item semantics as user files so assistive technology can identify the active document.

## Scope and architecture

The feature stays within `local-markdown.html` and reuses the current single Vditor instance and session model. A small view-mode mapping is the single source of truth for labels and Vditor mode values. View-selection rendering and view switching are kept separate from file activation, so file lifecycle code does not need to know about individual modes.

The existing uncommitted embedded-image implementation remains intact. Mode switching must continue to canonicalize temporary attachment-preview URLs before storing editor text and must reschedule previews after Vditor changes its editable surface.

The README will be updated during implementation to describe the visible selector and the new Examples location.

## Verification

Automated checks will cover:

- IR is selected by default.
- The selector exposes WYSIWYG, IR, and Split together.
- Each segment maps to the correct Vditor mode.
- Selecting a different segment captures the current value and updates the editor mode.
- Selecting the active segment does nothing.
- The view selection survives file switches but not a page reload.
- Examples is pinned in the sidebar and cannot be closed.
- Existing file editing, autosave, and embedded-image behavior remains unchanged.

Browser verification will check the desktop layout, the narrow-window fallback, keyboard focus, active styling, view switching, file switching, and attachment previews in all three modes.
