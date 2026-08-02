# Local Markdown Logo Design

## Goal

Give Local Markdown a recognizable monochrome logo in the two places identified by the user: the browser tab favicon and the sidebar header. Keep the application distributable as one self-contained HTML file.

## Selected Direction

Use the approved **B3 Outline Badge**: a horizontal rounded rectangle with a black outline and a black Markdown `M` plus downward arrow on a transparent background.

The mark should remain crisp and legible at both favicon and sidebar sizes. Its restrained outline treatment matches the application's existing black, white, and light-gray interface without competing with the “Local Markdown” title.

## Integration

### Browser favicon

Add a `<link rel="icon" type="image/svg+xml">` in the document head. Its `href` will be an SVG data URL containing the complete logo. It must not refer to an external or project-local image file.

### Sidebar header

Place the same logo geometry as inline SVG immediately before the existing “Local Markdown” text. Give the logo a dedicated class for sizing and mark it `aria-hidden="true"`; the adjacent text remains the accessible product name.

The sidebar SVG and favicon data URL may repeat the small amount of path data. Avoid JavaScript or runtime encoding for a static asset.

## Layout and Responsive Behavior

- Size the sidebar mark at 24 pixels so it reads clearly within the existing 52-pixel header.
- Preserve the current header alignment and the New File button placement.
- Keep the logo from shrinking while allowing the title to use the remaining width.
- Hide the mark at the existing 650-pixel narrow breakpoint so the product title and New File action retain the space they have today.

## Accessibility and Failure Behavior

- Keep “Local Markdown” as real text rather than incorporating it into the SVG.
- Treat the repeated sidebar mark as decorative because the adjacent text already names the product.
- Do not add color-only meaning or interaction to the logo.
- If a browser does not support an SVG favicon data URL, the application remains fully usable and the browser may display its default icon.

## Verification

Extend the existing Node test file to verify that:

- the document head declares an embedded SVG favicon;
- the sidebar header contains the inline logo before the product title;
- the sidebar logo is hidden from assistive technology;
- neither placement refers to an external logo file.

Run the Node test suite and inspect the page at normal and narrow widths. Confirm the favicon is visible, the sidebar header remains aligned, and no horizontal overlap is introduced.

## Non-goals

- No external image asset or additional runtime dependency.
- No animated logo, alternate theme, splash screen, or broader visual redesign.
- No changes to file handling, editor behavior, or toolbar controls.
