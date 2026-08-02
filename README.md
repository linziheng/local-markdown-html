# Local Markdown

Local Markdown is a small, zero-install editor for local Markdown files. Open one HTML file in Chrome, choose the notes you want to edit, and keep everything on your computer.

## Why use it?

- No installation, account, server, or build step.
- Open individual `.md` and `.markdown` files without granting access to an entire folder.
- Keep several files open in the sidebar and switch between them.
- Switch between WYSIWYG, instant-rendering, and split views from the top toolbar.
- Autosave files after their first save.
- Paste screenshots and copied images directly into the same Markdown file.
- Use normal external image URLs when you want standard Markdown compatibility.

## Quick start

1. Download this repository, or download `local-markdown.html` by itself.
2. Open `local-markdown.html` in desktop Chrome.
3. Select **Open file** to edit an existing Markdown file, or select **+** to create a new one.
4. If you created a new file, select **Save** once and choose its name and location.
5. Start writing. Existing and previously saved files save automatically after you stop typing.

The built-in **Examples** page is pinned at the top of the sidebar and shows common Markdown formatting and keyboard shortcuts. It is read-only for pasted images, so create or open a file before pasting a screenshot.

## File controls


| Control                     | What it does                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **+**                       | Creates a new unsaved Markdown file.                                                      |
| **Open file**               | Opens one local`.md` or `.markdown` file.                                                 |
| **Save**                    | Appears for a new file until you choose its filename and location.                        |
| **Close**                   | Removes the active file from the sidebar. It does not delete the file from your computer. |
| **Examples** in the sidebar | Opens the built-in Markdown examples and keyboard shortcuts.                              |
| A filename in the sidebar   | Switches to that open file. A dot beside the name means it has unsaved changes.           |

## Editor views

The selector in the center of the top toolbar shows all three editor views:

- **WYSIWYG** displays fully rendered content while you edit.
- **IR** uses instant rendering and is selected by default.
- **Split** shows Markdown source and its rendered preview side by side.

The selected view stays active when you switch between open files. Reloading Local Markdown returns to IR.

The formatting toolbar directly below the top bar provides headings, emphasis, links, lists, quotes, code, image upload, tables, undo/redo, and other common Markdown actions. **Outline** and **Export** are available at the right end of the toolbar.

## Add images

Local Markdown supports clipboard images and standard image URLs. Choose the method based on where the image should live.


| Image method               | How to add it                                      | Where the image lives              | Other Markdown viewers                 |
| -------------------------- | -------------------------------------------------- | ---------------------------------- | -------------------------------------- |
| Screenshot or copied image | Paste with`⌘ + V` on Mac or `Ctrl + V` on Windows | Embedded inside the same`.md` file | May not display outside Local Markdown |
| External image             | Write standard image Markdown                      | On the remote website              | Usually supported                      |
| Clickable external image   | Wrap image Markdown in a link                      | On the remote website              | Usually supported                      |

### Paste a screenshot or copied image

1. Create or open a Markdown file.
2. Put the cursor where the image should appear.
3. Take a screenshot or copy an image.
4. Press `⌘ + V` on Mac or `Ctrl + V` on Windows.

The preview appears immediately. Local Markdown processes the image in the background and stores it inside the same Markdown file. You do not need to grant Chrome access to the file's containing folder, and the image moves with the `.md` file when you copy or rename it.

> Pasted images use Local Markdown's embedded-attachment format. The Markdown body contains a short `local-markdown-attachment/…` reference, while the Base64 image data is kept in an attachment block at the end of the file. Do not manually remove that block. Other Markdown editors can still read the text, but they may not display the embedded images.

### Add an external image

Use a direct HTTPS image URL:

```md
![Random external image](https://picsum.photos/200/300)
```

The text inside `[]` is the image description. External images require an internet connection and remain dependent on the website hosting them.

### Add a clickable external image

Wrap the image in a normal Markdown link:

```md
[![Clickable random image](https://picsum.photos/200/300)](https://picsum.photos/)
```

The URL inside the inner parentheses is the image. The final URL is the page that opens when someone selects the image.

## Privacy and permissions

- Local Markdown requests access only to files you explicitly open or save.
- It does not require access to a containing folder.
- Note text and pasted images remain in your local Markdown files.
- External images are requested from their remote websites when displayed.

## Browser and network requirements

Local Markdown is designed for desktop Chrome because it uses Chrome's File System Access API. It loads Vditor from jsDelivr, so an internet connection is required when the editor library is not already cached. External image URLs also require network access.

## Repository files

- `local-markdown.html` — the complete application.
- `README.md` — usage documentation.
