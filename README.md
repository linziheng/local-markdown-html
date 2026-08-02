# Local Markdown

Local Markdown is a lightweight, zero-install Markdown editor for everyday notes. It runs in Chrome from a single `local-markdown.html` file and uses Vditor's instant-rendering mode, so Markdown becomes formatted as you move away from the line you are editing.

## Features

- Open local Markdown files individually instead of loading a whole folder.
- Keep multiple open files in the left sidebar while editing one active file at a time.
- Create another file with **+** and add it to the sidebar.
- Keep files on your computer instead of in browser local storage.
- Show **Save** only until a new file is saved for the first time.
- Autosave opened or previously saved files.
- Paste clipboard images without granting Chrome access to a containing folder.
- Keep pasted images inside the same Markdown file while the editor uses short attachment links for fast rendering.
- View built-in Markdown examples and keyboard shortcuts.

## Use Local Markdown

1. Download `local-markdown.html`.
2. Open `local-markdown.html` in Chrome.
3. Select **Open file** to add an existing `.md` or `.markdown` file to the left sidebar, or select **+** to add a new file.
4. For a new file, select **Save** once, edit the `.md` filename if needed, and choose its folder. The Save button then disappears and later changes save automatically.

Select a filename in the left sidebar to switch the active editor. Local Markdown asks Chrome for access only to the file you select. Your Markdown files remain local.

## Pasting images

Paste an image into the current note. Local Markdown immediately previews the clipboard image from memory, then compresses it to WebP in the background when that reduces its size. The Markdown body contains a short `local-markdown-attachment/…` image link; the Base64-encoded image data is stored in a `LocalMarkdown attachments:v1` block at the end of the same `.md` file.

The attachment block is kept out of Vditor while editing, so large Base64 strings do not slow down normal Markdown parsing and rendering. Opening and saving an individual Markdown file still works without granting Chrome access to its containing folder. Other Markdown viewers do not know how to resolve the short attachment links, so embedded images are guaranteed to render in Local Markdown rather than in every third-party viewer.

## Browser and network requirements

Local Markdown is designed for desktop Chrome because it uses Chrome's File System Access API. The current version loads Vditor from jsDelivr, so an internet connection is required when the editor library is not already cached.

## Repository files

- `local-markdown.html` — the Local Markdown application.
- `README.md` — project documentation.
