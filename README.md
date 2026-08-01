# LocalMarkdown

LocalMarkdown is a lightweight, zero-install Markdown workspace for everyday notes. It runs in Chrome from a single `localmarkdown.html` file and uses Vditor's instant-rendering mode, so Markdown becomes formatted as you move away from the line you are editing.

## Features

- Open a local folder as a multi-document Markdown workspace.
- Create, switch between, and close Markdown files.
- Keep files on your computer instead of in browser local storage.
- Save new files manually once, then autosave later changes.
- Paste clipboard images into the folder containing the Markdown files.
- Give pasted images timestamp-ordered PNG or JPEG filenames.
- View built-in Markdown examples and keyboard shortcuts.

## Use LocalMarkdown

1. Download `localmarkdown.html`.
2. Put `dog.png` beside `localmarkdown.html` to display the current image example.
3. Open `localmarkdown.html` in Chrome.
4. Select **Open folder** and choose the folder containing your Markdown files.
5. Select **+** to create a note. Use **Save** once to create the file; later changes save automatically.

LocalMarkdown asks Chrome for access only to the folder you select. Your Markdown files and pasted images remain local.

## Pasting images

Open a folder and select a Markdown file before pasting an image. LocalMarkdown saves the image in that folder and inserts a relative Markdown image link. Filenames begin with a timestamp so earlier images sort before later images.

## Browser and network requirements

LocalMarkdown is designed for desktop Chrome because it uses Chrome's File System Access API. The current version loads Vditor from jsDelivr, so an internet connection is required when the editor library is not already cached.

## Repository files

- `localmarkdown.html` — the LocalMarkdown application.
- `README.md` — project documentation.
- `dog.png` — the image used by the built-in Markdown example; keep it in the same folder as `localmarkdown.html` when distributing the example.
