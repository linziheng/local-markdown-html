# Local Markdown

Local Markdown is a lightweight, zero-install Markdown editor for everyday notes. It runs in Chrome from a single `local-markdown.html` file and uses Vditor's instant-rendering mode, so Markdown becomes formatted as you move away from the line you are editing.

## Features

- Open local Markdown files individually instead of loading a whole folder.
- Keep multiple open files in the left sidebar while editing one active file at a time.
- Create another file with **+** and add it to the sidebar.
- Keep files on your computer instead of in browser local storage.
- Show **Save** only until a new file is saved for the first time.
- Autosave opened or previously saved files.
- Paste clipboard images into the folder containing the current Markdown file.
- Give pasted images timestamp-ordered PNG or JPEG filenames.
- View built-in Markdown examples and keyboard shortcuts.

## Use Local Markdown

1. Download `local-markdown.html`.
2. Put `dog.png` beside `local-markdown.html` to display the current image example.
3. Open `local-markdown.html` in Chrome.
4. Select **Open file** to add an existing `.md` or `.markdown` file to the left sidebar, or select **+** to add a new file.
5. For a new file, select **Save** once, edit the `.md` filename if needed, and choose its folder. The Save button then disappears and later changes save automatically.

Select a filename in the left sidebar to switch the active editor. Local Markdown asks Chrome for access only to the file or folder you select. Your Markdown files and pasted images remain local.

## Pasting images

Paste an image into the current note. For a directly opened file, Chrome does not reveal its parent folder, so Local Markdown asks you to select that file's folder the first time an image needs to be saved. It verifies the folder, saves the image there, and inserts a relative Markdown image link. Filenames begin with a timestamp so earlier images sort before later images.

## Browser and network requirements

Local Markdown is designed for desktop Chrome because it uses Chrome's File System Access API. The current version loads Vditor from jsDelivr, so an internet connection is required when the editor library is not already cached.

## Repository files

- `local-markdown.html` — the Local Markdown application.
- `README.md` — project documentation.
- `dog.png` — the image used by the built-in Markdown example; keep it in the same folder as `local-markdown.html` when distributing the example.
