import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../local-markdown.html", import.meta.url), "utf8");
const documentMarkup = html.slice(0, html.indexOf("<script src="));

test("shows all editor views with IR selected by default", () => {
  assert.match(documentMarkup, /role="group" aria-label="Editor view"/);
  assert.match(documentMarkup, /data-mode="wysiwyg"[^>]*aria-pressed="false"[^>]*>WYSIWYG<\/button>/);
  assert.match(documentMarkup, /data-mode="ir"[^>]*aria-pressed="true"[^>]*>IR<\/button>/);
  assert.match(documentMarkup, /data-mode="sv"[^>]*aria-pressed="false"[^>]*>Split<\/button>/);
});

test("uses Vditor's built-in mode transition", () => {
  assert.match(html, /name: "edit-mode", className: "LocalMarkdown-internal-edit-mode"/);
  assert.match(html, /customWysiwygToolbar\(\) \{\}/);
  assert.match(html, /function switchEditorMode\(mode\)/);
  assert.match(html, /captureEditorValue\(\);[\s\S]*button\[data-mode="\$\{mode\}"\][\s\S]*modeButton\.click\(\)/);
});

test("pins Examples in the sidebar instead of the top toolbar", () => {
  assert.doesNotMatch(documentMarkup, /id="LocalMarkdown-examples"/);
  assert.match(html, /examplesButton\.id = "LocalMarkdown-examples"/);
  assert.match(html, /examplesButton\.addEventListener\("click", showExamples\)/);
  assert.match(html, /closeButton\.disabled = Boolean\(file\.builtin \|\| file\.welcome\)/);
});

test("keeps the view selector centered on wide windows", () => {
  assert.match(html, /grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
});

test("keeps keyboard view shortcuts in sync with the selector", () => {
  assert.match(html, /function handleEditorViewShortcut\(event\)/);
  assert.match(html, /Digit7: "wysiwyg", Digit8: "ir", Digit9: "sv"/);
  assert.match(html, /addEventListener\("keydown", handleEditorViewShortcut, true\)/);
});

test("shows the formatting toolbar without a duplicate view control", () => {
  const toolbar = html.match(/toolbar:\s*\[([\s\S]*?)\],\n\s*customWysiwygToolbar/)?.[1] || "";
  for (const control of [
    "headings", "bold", "italic", "strike", "link", "list", "ordered-list",
    "check", "quote", "code", "inline-code", "upload", "table", "undo", "redo",
    "outline", "export"
  ]) {
    assert.match(toolbar, new RegExp(`"${control}"`));
  }
  assert.doesNotMatch(toolbar, /toolbarControl\("record"\)/);
  assert.doesNotMatch(toolbar, /name: "more"/);
  assert.doesNotMatch(toolbar, /"content-theme"|"help"/);
  assert.match(toolbar, /name: "edit-mode", className: "LocalMarkdown-internal-edit-mode"/);
  assert.match(html, /\.LocalMarkdown-internal-edit-mode \{ display: none !important; \}/);
  assert.doesNotMatch(html, /\.LocalMarkdown-editor \.vditor-toolbar,\n\s*\.LocalMarkdown-editor \.vditor-counter/);
});

test("positions formatting tooltips inside the clipped editor pane", () => {
  const toolbar = html.match(/toolbar:\s*\[([\s\S]*?)\],\n\s*customWysiwygToolbar/)?.[1] || "";
  assert.match(html, /function toolbarControl\(name, tipPosition = "s"\)/);
  assert.match(toolbar, /toolbarControl\("emoji", "se"\)/);
  assert.match(toolbar, /toolbarControl\("bold", "se"\)/);
  assert.match(toolbar, /toolbarControl\("quote"\)/);
  assert.match(toolbar, /toolbarControl\("fullscreen", "sw"\)/);
  assert.match(html, /\.LocalMarkdown-editor \{[^}]*overflow: hidden;/);
});
