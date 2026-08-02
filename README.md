# Local Markdown

A lightweight Markdown editor that runs from a single HTML file.

Open `local-markdown.html` in desktop Chrome, choose a Markdown file, and start writing. You can run it without installing an app or creating an account. Local Markdown edits files directly on your computer and does not upload your notes.

[Download `local-markdown.html`](https://github.com/linziheng/local-markdown-html/raw/refs/heads/main/local-markdown.html)

> Local Markdown works best in desktop Chrome or Edge. It needs an internet connection to load the editor library from jsDelivr.

## Why Local Markdown?

Sometimes a full code editor is more than you need. You may only want to fix a README, clean up meeting notes, or draft a document without copying it into an online service.

Local Markdown gives you a focused editor that you can keep as one HTML file. It opens only the files you select. Changes go back to those files, and your workspace returns after a browser refresh.

## Get started

1. [Download `local-markdown.html`](https://github.com/linziheng/local-markdown-html/raw/refs/heads/main/local-markdown.html), or download the whole repository.
2. Open the HTML file in desktop Chrome or Edge.
3. Select **Open** to edit an existing `.md` or `.markdown` file. Select **+** to create a new file.
4. For a new file, select **Save** once and choose its name and location.
5. Keep writing. Local Markdown saves existing files shortly after you stop typing.

Refresh the browser whenever you need to. Local Markdown restores open files and unsaved edits. Chrome may ask you to reconnect a file before it can write to disk again.

## What it can do

- Open individual Markdown files without requesting access to an entire folder.
- Keep several files open and switch between them from the sidebar.
- Edit in Visual, Markdown, or Split view.
- Autosave files after their first manual save.
- Restore open files and unsaved edits after a browser refresh.
- Paste screenshots or copied images into the current Markdown file.
- Use standard external image links when compatibility with other Markdown readers matters.
- Provide common formatting tools, keyboard shortcuts, outline navigation, and export options.

## Everyday controls

| Control | What it does |
| --- | --- |
| **+** | Creates a new Markdown file. |
| **Open** | Opens one local `.md` or `.markdown` file. |
| **Save** | Lets you choose a name and location for a new file. |
| **Reconnect** | Restores permission to a file after Chrome loses disk access. |
| **Close** | Removes the active file from the sidebar without deleting it from your computer. |
| **Examples** | Opens the built-in formatting guide and keyboard shortcut reference. |

A dot beside a filename means that the file has unsaved changes.

## Choose how you write

- **Visual** shows the formatted document while you edit it.
- **Markdown** keeps Markdown syntax visible with inline formatting. This is the default view.
- **Split** places the Markdown source beside a live preview.

The formatting toolbar includes headings, emphasis, links, lists, quotes, code, tables, image upload, undo, and redo. The selected view stays active when you switch between files.

## Paste images into a Markdown file

1. Create or open a file.
2. Put the cursor where the image should appear.
3. Copy an image or take a screenshot.
4. Press `Command + V` on macOS or `Ctrl + V` on Windows.

Local Markdown processes the image in the browser and stores it inside the same Markdown file. The image moves with the file when you copy or rename it, and Chrome does not need access to the surrounding folder.

Pasted images use Local Markdown's embedded attachment format. Other Markdown editors can still read the text, but they may not display these images. Use a standard image URL when the file needs to render the same way in other Markdown viewers:

```md
![Image description](https://example.com/image.jpg)
```

You can also make an external image clickable:

```md
[![Image description](https://example.com/image.jpg)](https://example.com/)
```

## Privacy and file access

- Local Markdown requests access only to files that you open or save.
- It does not request access to the containing folder.
- Your document content is not uploaded to a server.
- To restore your workspace after a refresh, Local Markdown keeps a copy of open documents in browser storage on your device.
- External images are loaded from their original websites when displayed.
- The editor library is loaded from jsDelivr, but document content is not sent there.

## Browser support

Local Markdown uses the File System Access API and is designed for desktop Chrome. Chromium-based desktop versions of Edge should also work. Safari and Firefox do not currently provide the same direct file workflow.

An internet connection is required when Vditor is not already cached by the browser. This project does not currently bundle the editor library for fully offline use.

## Repository files

- `local-markdown.html`: the complete application.
- `README.md`: usage documentation.

The application has no build step. Download the HTML file, open it, and use it.
