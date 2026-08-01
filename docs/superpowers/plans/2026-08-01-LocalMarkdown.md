# LocalMarkdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build LocalMarkdown as an offline, multi-document Markdown notes workspace whose complete user-facing release is the single file `localmarkdown.html`.

**Architecture:** Keep the Markdown string and a versioned workspace model authoritative. Modular source units handle workspace operations, `localStorage`, import/export, safe Markdown rendering, CodeMirror 6 Live Preview, themes, and UI orchestration; an esbuild script embeds the tested bundle and CSS into one HTML artifact.

**Tech Stack:** Node.js 24, npm lockfile, modern JavaScript modules, CodeMirror 6, markdown-it, markdown-it-task-lists, esbuild, Vitest with jsdom, Playwright with Chrome, and axe-core.

## Global Constraints

- The final user-facing application is exactly one required file named `localmarkdown.html`.
- LocalMarkdown opens directly in Google Chrome from a local file without installation, a server, an account, or a network connection.
- The built artifact embeds every runtime script, style, icon, and production dependency; it has no CDN reference, remote font, analytics, telemetry, or update check.
- Product naming is **LocalMarkdown** in source identifiers, interface copy, README, scripts, tests, release documentation, backups, and third-party notices. The required artifact name `localmarkdown.html` is the only lowercase product filename exception.
- Version 1 is an everyday-notes, multi-document workspace with Obsidian-inspired Live Preview and a separate Reading view.
- Version 1 supports paragraphs, line breaks, ATX headings, bold, italic, strikethrough, inline and fenced code, links, blockquotes, ordered and unordered lists, task lists, and horizontal rules.
- Raw HTML never executes, unsafe link schemes are rejected, and remote images never load automatically.
- The workspace storage key is `LocalMarkdown.workspace.v1`, autosave debounce is 300 milliseconds, and the backup filename is `LocalMarkdown-workspace.json`.
- Theme choices are System, Solarized Light, and Solarized Dark; System is the initial preference.
- Folders, tags, backlinks, cloud sync, collaboration, direct folder access, embedded image storage, plug-ins, mobile packaging, and exact Obsidian parity are out of scope.
- Every behavior begins with a failing test, receives the smallest implementation that passes, and is committed only after focused and regression tests pass.

---

## File structure

```text
localmarkdown.html                              Generated, complete LocalMarkdown release
package.json                                    Build/test commands and dependency declarations
package-lock.json                               Exact dependency graph
vitest.config.js                                Unit/editor test environment
playwright.config.js                            Local-file Chrome test configuration
src/LocalMarkdown/LocalMarkdown.html            Accessible application document template
src/LocalMarkdown/LocalMarkdown.css             Solarized layout and component styling
src/LocalMarkdown/constants.js                  Product, schema, storage, timing, and filename constants
src/LocalMarkdown/workspace.js                  Immutable workspace and document operations
src/LocalMarkdown/storage.js                    localStorage adapter and debounced save coordinator
src/LocalMarkdown/importExport.js               Markdown and workspace import/export
src/LocalMarkdown/markdown.js                   Safe reading-view Markdown renderer
src/LocalMarkdown/theme.js                      System/Light/Dark resolution and DOM application
src/LocalMarkdown/livePreview.js                CodeMirror decoration generation and task widgets
src/LocalMarkdown/editor.js                     LocalMarkdown editor construction and formatting commands
src/LocalMarkdown/ui.js                         Accessible DOM rendering, dialogs, menus, and toasts
src/LocalMarkdown/app.js                        Application state and orchestration
src/LocalMarkdown/main.js                       Browser entry point
scripts/build-LocalMarkdown.mjs                 Single-file release builder
scripts/verify-LocalMarkdown-release.mjs        Artifact and naming verifier
tests/LocalMarkdown/build.test.js               Build and artifact unit tests
tests/LocalMarkdown/workspace.test.js           Workspace model tests
tests/LocalMarkdown/storage.test.js             Persistence and save scheduling tests
tests/LocalMarkdown/importExport.test.js         Import/export tests
tests/LocalMarkdown/markdown.test.js             Markdown safety/rendering tests
tests/LocalMarkdown/theme.test.js                Theme tests
tests/LocalMarkdown/livePreview.test.js          Decoration and editor command tests
tests/LocalMarkdown/setup.js                     jsdom editor API shims
tests/LocalMarkdown/app.test.js                  Controller and accessible UI tests
tests/LocalMarkdown/LocalMarkdown.e2e.test.js    Chrome local-file workflows and axe checks
tests/LocalMarkdown/documentation.test.js        Naming and documentation contract tests
README.md                                       User, backup, development, and test guide
CHANGELOG.md                                    LocalMarkdown release history
THIRD_PARTY_NOTICES.md                          Bundled dependency notices
```

## Task 1: Reproducible single-file build

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `vitest.config.js`
- Create: `src/LocalMarkdown/LocalMarkdown.html`
- Create: `src/LocalMarkdown/LocalMarkdown.css`
- Create: `src/LocalMarkdown/main.js`
- Create: `scripts/build-LocalMarkdown.mjs`
- Create: `scripts/verify-LocalMarkdown-release.mjs`
- Create: `tests/LocalMarkdown/build.test.js`
- Create: `tests/LocalMarkdown/setup.js`
- Generate: `localmarkdown.html`

**Interfaces:**
- Consumes: none; this is the project foundation.
- Produces: `npm run build`, `npm run test:unit`, `npm run test:e2e`, `npm run verify`, the template tokens `/* LocalMarkdown:styles */` and `/* LocalMarkdown:script */`, and `localmarkdown.html`.

- [ ] **Step 1: Declare the LocalMarkdown toolchain and write the failing build contract**

Create `package.json` without a lowercase package-name field:

```json
{
  "private": true,
  "productName": "LocalMarkdown",
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "build": "node scripts/build-LocalMarkdown.mjs",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:e2e": "npm run build && playwright test",
    "verify:release": "node scripts/verify-LocalMarkdown-release.mjs",
    "verify": "npm run test:unit && npm run test:e2e && npm run verify:release"
  }
}
```

Install exact, locked dependencies:

```bash
npm install --save-exact @codemirror/commands @codemirror/lang-markdown @codemirror/language @codemirror/state @codemirror/view codemirror markdown-it markdown-it-task-lists
npm install --save-dev --save-exact @axe-core/playwright @playwright/test esbuild jsdom vitest
```

Create `tests/LocalMarkdown/build.test.js`:

```js
import { beforeAll, describe, expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

describe("LocalMarkdown release build", () => {
  beforeAll(() => execFileSync("node", ["scripts/build-LocalMarkdown.mjs"]));

  test("creates one self-contained LocalMarkdown HTML artifact", () => {
    const html = readFileSync("localmarkdown.html", "utf8");
    expect(html).toContain("<title>LocalMarkdown</title>");
    expect(html).toContain("LocalMarkdown");
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toContain("/* LocalMarkdown:styles */");
    expect(html).not.toContain("/* LocalMarkdown:script */");
  });
});
```

- [ ] **Step 2: Run the build contract and confirm the expected failure**

Run: `npm run test:unit -- tests/LocalMarkdown/build.test.js`  
Expected: FAIL because `scripts/build-LocalMarkdown.mjs` does not exist.

- [ ] **Step 3: Implement the HTML template, minimal style, browser entry, and builder**

Create `src/LocalMarkdown/LocalMarkdown.html`:

```html
<!doctype html>
<html lang="en" data-LocalMarkdown-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>LocalMarkdown</title>
  <style>/* LocalMarkdown:styles */</style>
</head>
<body>
  <div id="LocalMarkdown-root" aria-label="LocalMarkdown workspace"></div>
  <noscript>LocalMarkdown requires JavaScript in Chrome.</noscript>
  <script>/* LocalMarkdown:script */</script>
</body>
</html>
```

Create `src/LocalMarkdown/LocalMarkdown.css`:

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color-scheme: light dark;
}
* { box-sizing: border-box; }
html, body, #LocalMarkdown-root { min-height: 100%; margin: 0; }
.LocalMarkdown-loading { min-height: 100vh; display: grid; place-items: center; }
```

Create `src/LocalMarkdown/main.js`:

```js
const LocalMarkdownRoot = document.querySelector("#LocalMarkdown-root");
LocalMarkdownRoot.innerHTML = '<main class="LocalMarkdown-loading"><h1>LocalMarkdown</h1></main>';
```

Create `scripts/build-LocalMarkdown.mjs`:

```js
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";

const LocalMarkdownBundle = await build({
  entryPoints: ["src/LocalMarkdown/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["chrome120"],
  write: false,
  legalComments: "inline"
});

const [LocalMarkdownTemplate, LocalMarkdownStyles] = await Promise.all([
  readFile("src/LocalMarkdown/LocalMarkdown.html", "utf8"),
  readFile("src/LocalMarkdown/LocalMarkdown.css", "utf8")
]);
const LocalMarkdownScript = new TextDecoder().decode(LocalMarkdownBundle.outputFiles[0].contents);
const LocalMarkdownHtml = LocalMarkdownTemplate
  .replace("/* LocalMarkdown:styles */", LocalMarkdownStyles)
  .replace("/* LocalMarkdown:script */", LocalMarkdownScript.replaceAll("</script", "<\\/script"));
await writeFile("localmarkdown.html", LocalMarkdownHtml);
```

Create `vitest.config.js`:

```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/LocalMarkdown/**/*.test.js"],
    exclude: ["tests/LocalMarkdown/**/*.e2e.test.js"],
    environment: "jsdom",
    setupFiles: ["tests/LocalMarkdown/setup.js"]
  }
});
```

Create `tests/LocalMarkdown/setup.js` so the configured setup file exists from the first test run:

```js
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(performance.now()), 0);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
```

Create `scripts/verify-LocalMarkdown-release.mjs` with an initial build-only verifier:

```js
import { readFile } from "node:fs/promises";
const LocalMarkdownHtml = await readFile("localmarkdown.html", "utf8");
const LocalMarkdownFailures = [];
if (!LocalMarkdownHtml.includes("<title>LocalMarkdown</title>")) LocalMarkdownFailures.push("missing LocalMarkdown title");
if (/<script[^>]+src=/i.test(LocalMarkdownHtml)) LocalMarkdownFailures.push("external script tag");
if (/<link[^>]+href=/i.test(LocalMarkdownHtml)) LocalMarkdownFailures.push("external stylesheet tag");
if (LocalMarkdownFailures.length) throw new Error(LocalMarkdownFailures.join("; "));
console.log("LocalMarkdown release verified");
```

- [ ] **Step 4: Run the focused build tests and release verifier**

Run: `npm run test:unit -- tests/LocalMarkdown/build.test.js && npm run verify:release`  
Expected: PASS and output `LocalMarkdown release verified`.

- [ ] **Step 5: Commit the build foundation**

```bash
git add package.json package-lock.json vitest.config.js src/LocalMarkdown scripts tests/LocalMarkdown/build.test.js localmarkdown.html
git commit -m "build: create LocalMarkdown single-file pipeline"
```

## Task 2: Versioned workspace model

**Files:**
- Create: `src/LocalMarkdown/constants.js`
- Create: `src/LocalMarkdown/workspace.js`
- Create: `tests/LocalMarkdown/workspace.test.js`

**Interfaces:**
- Consumes: no earlier runtime interface.
- Produces: `LocalMarkdownProduct`, `LocalMarkdownSchemaVersion`, `LocalMarkdownStorageKey`, `createLocalMarkdownDocument`, `createLocalMarkdownWorkspace`, `deriveLocalMarkdownTitle`, `safeLocalMarkdownFilename`, `migrateLocalMarkdownWorkspace`, `validateLocalMarkdownWorkspace`, `addLocalMarkdownDocument`, `updateLocalMarkdownDocument`, `duplicateLocalMarkdownDocument`, `toggleLocalMarkdownPin`, `removeLocalMarkdownDocument`, `restoreLocalMarkdownDocument`, and `queryLocalMarkdownDocuments`.

- [ ] **Step 1: Write failing workspace behavior tests**

Create `tests/LocalMarkdown/workspace.test.js`:

```js
import { describe, expect, test } from "vitest";
import {
  addLocalMarkdownDocument,
  createLocalMarkdownWorkspace,
  deriveLocalMarkdownTitle,
  duplicateLocalMarkdownDocument,
  queryLocalMarkdownDocuments,
  removeLocalMarkdownDocument,
  restoreLocalMarkdownDocument,
  safeLocalMarkdownFilename,
  toggleLocalMarkdownPin,
  updateLocalMarkdownDocument,
  validateLocalMarkdownWorkspace,
  migrateLocalMarkdownWorkspace
} from "../../src/LocalMarkdown/workspace.js";

const now = "2026-08-01T08:00:00.000Z";

describe("LocalMarkdown workspace", () => {
  test("creates a versioned welcome workspace", () => {
    const workspace = createLocalMarkdownWorkspace({ id: "welcome", now });
    expect(workspace.product).toBe("LocalMarkdown");
    expect(workspace.schemaVersion).toBe(1);
    expect(workspace.activeDocumentId).toBe("welcome");
    expect(workspace.documents[0].markdown).toContain("# Welcome to LocalMarkdown");
  });

  test.each([
    ["# Project plan\nBody", "Project plan"],
    ["\nFirst useful line\nSecond", "First useful line"],
    ["   ", "Untitled note"]
  ])("derives the note title from Markdown", (markdown, title) => {
    expect(deriveLocalMarkdownTitle(markdown)).toBe(title);
  });

  test("updates without mutating the earlier workspace", () => {
    const original = createLocalMarkdownWorkspace({ id: "a", now });
    const updated = updateLocalMarkdownDocument(original, "a", "# Changed", "2026-08-01T08:01:00.000Z");
    expect(original.documents[0].markdown).not.toBe("# Changed");
    expect(updated.documents[0].markdown).toBe("# Changed");
  });

  test("orders pinned notes first and then most recently edited", () => {
    let workspace = createLocalMarkdownWorkspace({ id: "a", now });
    workspace = addLocalMarkdownDocument(workspace, { id: "b", now: "2026-08-01T08:02:00.000Z", markdown: "Meeting" });
    workspace = addLocalMarkdownDocument(workspace, { id: "c", now: "2026-08-01T08:03:00.000Z", markdown: "Project" });
    workspace = toggleLocalMarkdownPin(workspace, "b");
    expect(queryLocalMarkdownDocuments(workspace, "").map((document) => document.id)).toEqual(["b", "c", "a"]);
  });

  test("searches title and Markdown contents without case sensitivity", () => {
    let workspace = createLocalMarkdownWorkspace({ id: "a", now });
    workspace = updateLocalMarkdownDocument(workspace, "a", "# Friday\nCall SAM", now);
    expect(queryLocalMarkdownDocuments(workspace, "sam").map((document) => document.id)).toEqual(["a"]);
  });

  test("duplicates, removes, and restores a document", () => {
    let workspace = createLocalMarkdownWorkspace({ id: "a", now });
    workspace = duplicateLocalMarkdownDocument(workspace, "a", { id: "b", now });
    const removal = removeLocalMarkdownDocument(workspace, "b");
    expect(removal.workspace.documents.map(({ id }) => id)).toEqual(["a"]);
    expect(restoreLocalMarkdownDocument(removal.workspace, removal.deleted).documents).toHaveLength(2);
  });

  test("validates schema and creates safe Markdown filenames", () => {
    const workspace = createLocalMarkdownWorkspace({ id: "a", now });
    expect(validateLocalMarkdownWorkspace(workspace)).toEqual(workspace);
    expect(migrateLocalMarkdownWorkspace(workspace)).toEqual(workspace);
    expect(() => validateLocalMarkdownWorkspace({ ...workspace, product: "Other" })).toThrow("LocalMarkdown");
    expect(() => migrateLocalMarkdownWorkspace({ ...workspace, schemaVersion: 2 })).toThrow("version 2");
    expect(safeLocalMarkdownFilename("# Q3 / Notes?\nBody")).toBe("Q3 - Notes.md");
  });
});
```

- [ ] **Step 2: Run workspace tests and verify missing-module failure**

Run: `npm run test:unit -- tests/LocalMarkdown/workspace.test.js`  
Expected: FAIL because `src/LocalMarkdown/workspace.js` does not exist.

- [ ] **Step 3: Implement constants and immutable workspace operations**

Create `src/LocalMarkdown/constants.js`:

```js
export const LocalMarkdownProduct = "LocalMarkdown";
export const LocalMarkdownSchemaVersion = 1;
export const LocalMarkdownStorageKey = "LocalMarkdown.workspace.v1";
export const LocalMarkdownBackupFormat = "LocalMarkdownWorkspaceBackup";
export const LocalMarkdownBackupFilename = "LocalMarkdown-workspace.json";
export const LocalMarkdownAutosaveDelay = 300;
export const LocalMarkdownDefaultPreferences = Object.freeze({
  theme: "system",
  sidebarCollapsed: false,
  view: "live-preview"
});
```

Implement `src/LocalMarkdown/workspace.js` with these exact signatures:

```js
export function createLocalMarkdownDocument({ id, now, markdown = "" })
export function createLocalMarkdownWorkspace({ id, now })
export function deriveLocalMarkdownTitle(markdown)
export function safeLocalMarkdownFilename(markdown)
export function migrateLocalMarkdownWorkspace(value)
export function validateLocalMarkdownWorkspace(value)
export function addLocalMarkdownDocument(workspace, { id, now, markdown = "" })
export function updateLocalMarkdownDocument(workspace, documentId, markdown, now)
export function duplicateLocalMarkdownDocument(workspace, documentId, { id, now })
export function toggleLocalMarkdownPin(workspace, documentId)
export function removeLocalMarkdownDocument(workspace, documentId)
export function restoreLocalMarkdownDocument(workspace, document)
export function queryLocalMarkdownDocuments(workspace, query)
```

Use a private `replaceLocalMarkdownDocument(workspace, document)` helper, clone every changed array/object, reject duplicate IDs, select a remaining document after deletion, normalize search with `toLocaleLowerCase()`, and use this exact welcome note start:

```js
const LocalMarkdownWelcome = `# Welcome to LocalMarkdown

LocalMarkdown saves notes in this Chrome profile.

Export a **LocalMarkdown workspace backup** regularly so browser storage is never your only copy.`;
```

`migrateLocalMarkdownWorkspace` returns a validated schema-1 workspace and rejects future versions with `Unsupported LocalMarkdown workspace version N`; it is the only entry point a future schema migration will extend. Validation must reject non-objects, the wrong product or schema, duplicate document IDs, invalid timestamps, missing active IDs, non-string Markdown, non-boolean pin state, and preferences outside the approved unions.

- [ ] **Step 4: Run workspace tests and the existing build test**

Run: `npm run test:unit -- tests/LocalMarkdown/workspace.test.js tests/LocalMarkdown/build.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the workspace model**

```bash
git add src/LocalMarkdown/constants.js src/LocalMarkdown/workspace.js tests/LocalMarkdown/workspace.test.js
git commit -m "feat: add LocalMarkdown workspace model"
```

## Task 3: Atomic storage, autosave, and recovery

**Files:**
- Create: `src/LocalMarkdown/storage.js`
- Create: `tests/LocalMarkdown/storage.test.js`

**Interfaces:**
- Consumes: `LocalMarkdownStorageKey`, `migrateLocalMarkdownWorkspace`, and `validateLocalMarkdownWorkspace`.
- Produces: `LocalMarkdownStorage`, whose `load()` returns `{ kind: "empty" }`, `{ kind: "ready", workspace }`, or `{ kind: "recovery", raw, error }`; and `LocalMarkdownSaveCoordinator`, with `schedule(workspace)`, `flush()`, and `cancel()`.

- [ ] **Step 1: Write failing storage and scheduler tests**

Create `tests/LocalMarkdown/storage.test.js`:

```js
import { describe, expect, test, vi } from "vitest";
import { createLocalMarkdownWorkspace } from "../../src/LocalMarkdown/workspace.js";
import { LocalMarkdownSaveCoordinator, LocalMarkdownStorage } from "../../src/LocalMarkdown/storage.js";

const now = "2026-08-01T08:00:00.000Z";
const workspace = createLocalMarkdownWorkspace({ id: "a", now });

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value))
  };
}

describe("LocalMarkdownStorage", () => {
  test("returns empty, ready, and recovery states", () => {
    expect(new LocalMarkdownStorage(memoryStorage()).load()).toEqual({ kind: "empty" });
    expect(new LocalMarkdownStorage(memoryStorage({ "LocalMarkdown.workspace.v1": JSON.stringify(workspace) })).load()).toEqual({ kind: "ready", workspace });
    const recovery = new LocalMarkdownStorage(memoryStorage({ "LocalMarkdown.workspace.v1": "{" })).load();
    expect(recovery.kind).toBe("recovery");
    expect(recovery.raw).toBe("{");
  });

  test("serializes before one atomic setItem call", () => {
    const backend = memoryStorage();
    new LocalMarkdownStorage(backend).save(workspace);
    expect(backend.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(backend.setItem.mock.calls[0][1])).toEqual(workspace);
  });
});

describe("LocalMarkdownSaveCoordinator", () => {
  test("debounces saves and reports saving then saved", async () => {
    vi.useFakeTimers();
    const store = { save: vi.fn() };
    const onStatus = vi.fn();
    const coordinator = new LocalMarkdownSaveCoordinator({ store, delay: 300, onStatus });
    coordinator.schedule(workspace);
    coordinator.schedule({ ...workspace, activeDocumentId: "a" });
    await vi.advanceTimersByTimeAsync(300);
    expect(store.save).toHaveBeenCalledTimes(1);
    expect(onStatus.mock.calls.map(([status]) => status)).toEqual(["saving", "saved"]);
    vi.useRealTimers();
  });

  test("reports save-failed and retains the pending workspace", async () => {
    vi.useFakeTimers();
    const error = new DOMException("full", "QuotaExceededError");
    const coordinator = new LocalMarkdownSaveCoordinator({ store: { save: vi.fn(() => { throw error; }) }, delay: 300, onStatus: vi.fn() });
    coordinator.schedule(workspace);
    await vi.advanceTimersByTimeAsync(300);
    expect(coordinator.status).toBe("save-failed");
    expect(coordinator.pendingWorkspace).toBe(workspace);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run storage tests and verify the missing-module failure**

Run: `npm run test:unit -- tests/LocalMarkdown/storage.test.js`  
Expected: FAIL because `src/LocalMarkdown/storage.js` does not exist.

- [ ] **Step 3: Implement persistence and debounce state**

Create `src/LocalMarkdown/storage.js`:

```js
import { LocalMarkdownAutosaveDelay, LocalMarkdownStorageKey } from "./constants.js";
import { migrateLocalMarkdownWorkspace, validateLocalMarkdownWorkspace } from "./workspace.js";

export class LocalMarkdownStorage {
  constructor(storage = window.localStorage, key = LocalMarkdownStorageKey) { this.storage = storage; this.key = key; }
  load() {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return { kind: "empty" };
    try { return { kind: "ready", workspace: migrateLocalMarkdownWorkspace(JSON.parse(raw)) }; }
    catch (error) { return { kind: "recovery", raw, error }; }
  }
  save(workspace) {
    const validated = validateLocalMarkdownWorkspace(workspace);
    this.storage.setItem(this.key, JSON.stringify(validated));
  }
}

export class LocalMarkdownSaveCoordinator {
  constructor({ store, delay = LocalMarkdownAutosaveDelay, onStatus = () => {}, setTimer = setTimeout, clearTimer = clearTimeout }) {
    Object.assign(this, { store, delay, onStatus, setTimer, clearTimer });
    this.timer = null; this.pendingWorkspace = null; this.status = "saved";
  }
  schedule(workspace) {
    this.pendingWorkspace = workspace; this.status = "saving"; this.onStatus("saving");
    if (this.timer) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => this.flush(), this.delay);
  }
  flush() {
    if (!this.pendingWorkspace) return;
    this.timer = null;
    try {
      this.store.save(this.pendingWorkspace); this.pendingWorkspace = null;
      this.status = "saved"; this.onStatus("saved");
    } catch (error) {
      this.status = "save-failed"; this.onStatus("save-failed", error);
    }
  }
  cancel() { if (this.timer) this.clearTimer(this.timer); this.timer = null; }
}
```

`schedule` must set status to `saving` immediately, replace `pendingWorkspace`, and reset the timer. `flush` must save the latest pending value, set `saved` on success and clear pending state, or set `save-failed` and retain the value on failure. `cancel` clears only the timer; it must not discard a workspace after a failed save.

- [ ] **Step 4: Run focused and regression unit tests**

Run: `npm run test:unit -- tests/LocalMarkdown/storage.test.js tests/LocalMarkdown/workspace.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit LocalMarkdown persistence**

```bash
git add src/LocalMarkdown/storage.js tests/LocalMarkdown/storage.test.js
git commit -m "feat: persist LocalMarkdown workspaces"
```

## Task 4: Safe Markdown rendering and Solarized themes

**Files:**
- Create: `src/LocalMarkdown/markdown.js`
- Create: `src/LocalMarkdown/theme.js`
- Create: `tests/LocalMarkdown/markdown.test.js`
- Create: `tests/LocalMarkdown/theme.test.js`
- Modify: `src/LocalMarkdown/LocalMarkdown.css`

**Interfaces:**
- Consumes: approved Markdown feature and Solarized policies.
- Produces: `renderLocalMarkdown`, `renderLocalMarkdownFallback`, `resolveLocalMarkdownTheme`, `applyLocalMarkdownTheme`, and `watchLocalMarkdownSystemTheme`.

- [ ] **Step 1: Write failing renderer and theme tests**

Create `tests/LocalMarkdown/markdown.test.js`:

```js
import { describe, expect, test } from "vitest";
import { renderLocalMarkdown, renderLocalMarkdownFallback } from "../../src/LocalMarkdown/markdown.js";

describe("LocalMarkdown Markdown rendering", () => {
  test("renders the approved everyday-note constructs", () => {
    const html = renderLocalMarkdown("# Plan\n\n- [x] **Done**\n- [ ] `Next`\n\n> Note\n\n---");
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<strong>Done</strong>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<hr>");
  });

  test("escapes raw HTML and rejects unsafe links", () => {
    const html = renderLocalMarkdown('<img src=x onerror=alert(1)> [bad](javascript:alert(1))');
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("&lt;img");
  });

  test("turns remote Markdown images into inert placeholders", () => {
    const html = renderLocalMarkdown("![diagram](https://example.com/a.png)");
    expect(html).toContain("LocalMarkdown-image-placeholder");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('src="https://');
  });

  test("fallback renderer always escapes source", () => {
    expect(renderLocalMarkdownFallback("<script>alert(1)</script>")).toContain("&lt;script&gt;");
  });
});
```

Create `tests/LocalMarkdown/theme.test.js`:

```js
import { describe, expect, test, vi } from "vitest";
import { applyLocalMarkdownTheme, resolveLocalMarkdownTheme } from "../../src/LocalMarkdown/theme.js";

describe("LocalMarkdown themes", () => {
  test.each([["light", true, "light"], ["dark", false, "dark"], ["system", true, "dark"], ["system", false, "light"]])(
    "resolves %s with system dark=%s",
    (preference, systemDark, expected) => expect(resolveLocalMarkdownTheme(preference, systemDark)).toBe(expected)
  );

  test("applies a resolved theme and preference to the document", () => {
    applyLocalMarkdownTheme(document.documentElement, "system", { matches: true });
    expect(document.documentElement.getAttribute("data-LocalMarkdown-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-LocalMarkdown-theme-preference")).toBe("system");
  });
});
```

- [ ] **Step 2: Run both files and verify missing-module failures**

Run: `npm run test:unit -- tests/LocalMarkdown/markdown.test.js tests/LocalMarkdown/theme.test.js`  
Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the safe renderer and theme service**

In `src/LocalMarkdown/markdown.js`, create a private markdown-it instance with `html: false`, `linkify: false`, and `typographer: false`, enable `strikethrough`, and install `markdown-it-task-lists` with disabled, non-interactive checkboxes. Override the `image` rule to emit:

```html
<span class="LocalMarkdown-image-placeholder" role="img" aria-label="Remote image not loaded">[Image: escaped alternative text]</span>
```

Override `link_open` to add `target="_blank"` and `rel="noopener noreferrer"`. Preserve markdown-it link validation. Export:

```js
export function renderLocalMarkdown(markdown) {
  try { return LocalMarkdownParser.render(String(markdown)); }
  catch { return renderLocalMarkdownFallback(markdown); }
}
export function renderLocalMarkdownFallback(markdown) {
  return `<pre class="LocalMarkdown-render-fallback">${escapeLocalMarkdownHtml(String(markdown))}</pre>`;
}
```

In `src/LocalMarkdown/theme.js`, implement:

```js
export function resolveLocalMarkdownTheme(preference, systemDark) {
  if (preference === "light" || preference === "dark") return preference;
  if (preference === "system") return systemDark ? "dark" : "light";
  throw new TypeError(`Invalid LocalMarkdown theme: ${preference}`);
}
export function applyLocalMarkdownTheme(root, preference, media = matchMedia("(prefers-color-scheme: dark)")) {
  const resolved = resolveLocalMarkdownTheme(preference, media.matches);
  root.setAttribute("data-LocalMarkdown-theme-preference", preference);
  root.setAttribute("data-LocalMarkdown-theme", resolved);
  return resolved;
}
export function watchLocalMarkdownSystemTheme(media, callback) {
  const listener = ({ matches }) => callback(matches);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
```

Use the official palette in `src/LocalMarkdown/LocalMarkdown.css`:

```css
:root, [data-LocalMarkdown-theme="light"] {
  --LocalMarkdown-base03:#002b36; --LocalMarkdown-base02:#073642;
  --LocalMarkdown-base01:#586e75; --LocalMarkdown-base00:#657b83;
  --LocalMarkdown-base0:#839496; --LocalMarkdown-base1:#93a1a1;
  --LocalMarkdown-base2:#eee8d5; --LocalMarkdown-base3:#fdf6e3;
  --LocalMarkdown-yellow:#b58900; --LocalMarkdown-orange:#cb4b16;
  --LocalMarkdown-red:#dc322f; --LocalMarkdown-magenta:#d33682;
  --LocalMarkdown-violet:#6c71c4; --LocalMarkdown-blue:#268bd2;
  --LocalMarkdown-cyan:#2aa198; --LocalMarkdown-green:#859900;
  --LocalMarkdown-canvas:var(--LocalMarkdown-base3); --LocalMarkdown-surface:var(--LocalMarkdown-base2);
  --LocalMarkdown-text:var(--LocalMarkdown-base00); --LocalMarkdown-strong:var(--LocalMarkdown-base01);
}
[data-LocalMarkdown-theme="dark"] {
  --LocalMarkdown-canvas:var(--LocalMarkdown-base03); --LocalMarkdown-surface:var(--LocalMarkdown-base02);
  --LocalMarkdown-text:var(--LocalMarkdown-base0); --LocalMarkdown-strong:var(--LocalMarkdown-base1);
}
```

- [ ] **Step 4: Run renderer, theme, and build tests**

Run: `npm run test:unit -- tests/LocalMarkdown/markdown.test.js tests/LocalMarkdown/theme.test.js tests/LocalMarkdown/build.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit Markdown safety and Solarized themes**

```bash
git add src/LocalMarkdown/markdown.js src/LocalMarkdown/theme.js src/LocalMarkdown/LocalMarkdown.css tests/LocalMarkdown/markdown.test.js tests/LocalMarkdown/theme.test.js
git commit -m "feat: render LocalMarkdown safely with Solarized themes"
```

## Task 5: Markdown and complete-workspace portability

**Files:**
- Create: `src/LocalMarkdown/importExport.js`
- Create: `tests/LocalMarkdown/importExport.test.js`

**Interfaces:**
- Consumes: backup constants and workspace validation/document creation.
- Produces: `createLocalMarkdownBackup`, `parseLocalMarkdownBackup`, `mergeLocalMarkdownWorkspace`, `replaceLocalMarkdownWorkspace`, `importLocalMarkdownFiles`, `createLocalMarkdownDocumentDownload`, `createLocalMarkdownBackupDownload`, and `triggerLocalMarkdownDownload`.

- [ ] **Step 1: Write failing import/export tests**

Create `tests/LocalMarkdown/importExport.test.js`:

```js
import { describe, expect, test } from "vitest";
import { createLocalMarkdownWorkspace } from "../../src/LocalMarkdown/workspace.js";
import {
  createLocalMarkdownBackup,
  createLocalMarkdownBackupDownload,
  createLocalMarkdownDocumentDownload,
  importLocalMarkdownFiles,
  mergeLocalMarkdownWorkspace,
  parseLocalMarkdownBackup,
  replaceLocalMarkdownWorkspace
} from "../../src/LocalMarkdown/importExport.js";

const now = "2026-08-01T08:00:00.000Z";
const workspace = createLocalMarkdownWorkspace({ id: "a", now });

describe("LocalMarkdown portability", () => {
  test("round-trips a versioned LocalMarkdown backup", () => {
    const backup = createLocalMarkdownBackup(workspace, now);
    expect(backup).toMatchObject({ product: "LocalMarkdown", format: "LocalMarkdownWorkspaceBackup", schemaVersion: 1, exportedAt: now });
    expect(parseLocalMarkdownBackup(JSON.stringify(backup))).toEqual(workspace);
  });

  test("rejects invalid and future backups without returning a workspace", () => {
    expect(() => parseLocalMarkdownBackup('{"product":"Other"}')).toThrow("LocalMarkdown");
    expect(() => parseLocalMarkdownBackup(JSON.stringify({ ...createLocalMarkdownBackup(workspace, now), schemaVersion: 2 }))).toThrow("version 2");
  });

  test("merges conflicting IDs using new IDs and preserves current documents", () => {
    const merged = mergeLocalMarkdownWorkspace(workspace, workspace, { idFactory: () => "b", now });
    expect(merged.documents.map(({ id }) => id)).toEqual(["a", "b"]);
  });

  test("replaces only with a validated workspace", () => {
    expect(replaceLocalMarkdownWorkspace(workspace)).toEqual(workspace);
    expect(() => replaceLocalMarkdownWorkspace({ product: "Other" })).toThrow();
  });

  test("imports Markdown files and leaves empty input untitled", async () => {
    const files = [
      { name: "Plan.md", text: async () => "# Plan\nBody" },
      { name: "Empty.md", text: async () => "" }
    ];
    const imported = await importLocalMarkdownFiles(files, { idFactory: (() => { const ids = ["b", "c"]; return () => ids.shift(); })(), now });
    expect(imported.documents.map(({ markdown }) => markdown)).toEqual(["# Plan\nBody", ""]);
    expect(imported.errors).toEqual([]);
  });

  test("imports readable files and reports each unreadable file", async () => {
    const imported = await importLocalMarkdownFiles([
      { name: "Good.md", text: async () => "# Good" },
      { name: "Broken.md", text: async () => { throw new Error("cannot read"); } }
    ], { idFactory: () => "good", now });
    expect(imported.documents.map(({ markdown }) => markdown)).toEqual(["# Good"]);
    expect(imported.errors).toEqual([{ name: "Broken.md", message: "cannot read" }]);
  });

  test("creates exact download names and UTF-8 payloads", () => {
    const documentDownload = createLocalMarkdownDocumentDownload({ ...workspace.documents[0], markdown: "# Friday / Plan" });
    expect(documentDownload).toMatchObject({ filename: "Friday - Plan.md", type: "text/markdown;charset=utf-8" });
    expect(createLocalMarkdownBackupDownload(workspace, now).filename).toBe("LocalMarkdown-workspace.json");
  });
});
```

- [ ] **Step 2: Run import/export tests and verify the missing-module failure**

Run: `npm run test:unit -- tests/LocalMarkdown/importExport.test.js`  
Expected: FAIL because `src/LocalMarkdown/importExport.js` does not exist.

- [ ] **Step 3: Implement backup envelopes, merge, replacement, and downloads**

Use these exact backup and download shapes in `src/LocalMarkdown/importExport.js`:

```js
export function createLocalMarkdownBackup(workspace, exportedAt) {
  return {
    product: "LocalMarkdown",
    format: "LocalMarkdownWorkspaceBackup",
    schemaVersion: 1,
    exportedAt,
    workspace: validateLocalMarkdownWorkspace(workspace)
  };
}

export function createLocalMarkdownDocumentDownload(document) {
  return { filename: safeLocalMarkdownFilename(document.markdown), type: "text/markdown;charset=utf-8", text: document.markdown };
}

export function createLocalMarkdownBackupDownload(workspace, exportedAt) {
  return { filename: "LocalMarkdown-workspace.json", type: "application/json;charset=utf-8", text: JSON.stringify(createLocalMarkdownBackup(workspace, exportedAt), null, 2) };
}
```

`parseLocalMarkdownBackup` must validate the envelope before the nested workspace. `mergeLocalMarkdownWorkspace` must retain current preferences, add every imported document, regenerate conflicting IDs, and select the first imported document when at least one exists. `triggerLocalMarkdownDownload` must create a Blob and temporary object URL, click an `a[download]`, then revoke the URL.

`importLocalMarkdownFiles` must settle each `file.text()` independently and return `{ documents, errors }`. Each document draft is `{ id, now, markdown }`; each error is `{ name, message }`. This lets the application import valid files and report every unreadable file by name.

- [ ] **Step 4: Run portability and workspace regression tests**

Run: `npm run test:unit -- tests/LocalMarkdown/importExport.test.js tests/LocalMarkdown/workspace.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit LocalMarkdown portability**

```bash
git add src/LocalMarkdown/importExport.js tests/LocalMarkdown/importExport.test.js
git commit -m "feat: import and export LocalMarkdown notes"
```

## Task 6: CodeMirror Live Preview editor

**Files:**
- Create: `src/LocalMarkdown/livePreview.js`
- Create: `src/LocalMarkdown/editor.js`
- Create: `tests/LocalMarkdown/livePreview.test.js`
- Modify: `tests/LocalMarkdown/setup.js`
- Modify: `src/LocalMarkdown/LocalMarkdown.css`

**Interfaces:**
- Consumes: CodeMirror state, language, view, commands, and Markdown language packages.
- Produces: `LocalMarkdownLivePreview`, `buildLocalMarkdownDecorations`, `createLocalMarkdownEditor`, and editor methods `setMarkdown`, `getMarkdown`, `focus`, `format`, `destroy`.

- [ ] **Step 1: Write failing decoration and editor-command tests**

Confirm `tests/LocalMarkdown/setup.js` contains these CodeMirror shims before loading CodeMirror in jsdom:

```js
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.requestAnimationFrame ??= (callback) => setTimeout(() => callback(performance.now()), 0);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
```

Create `tests/LocalMarkdown/livePreview.test.js`:

```js
import { describe, expect, test, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { createLocalMarkdownEditor, wrapLocalMarkdownSelection } from "../../src/LocalMarkdown/editor.js";
import { buildLocalMarkdownDecorations } from "../../src/LocalMarkdown/livePreview.js";

function decorationSpecs(state) {
  const specs = [];
  buildLocalMarkdownDecorations(state).between(0, state.doc.length, (from, to, value) => specs.push({ from, to, class: value.spec.class, widget: value.spec.widget?.constructor.name }));
  return specs;
}

describe("LocalMarkdown Live Preview", () => {
  test("styles inactive headings and hides their source marker", () => {
    const state = EditorState.create({ doc: "# Heading\n\nActive", selection: { anchor: 12 }, extensions: [markdown()] });
    const specs = decorationSpecs(state);
    expect(specs.some(({ class: name }) => name?.includes("LocalMarkdown-heading-1"))).toBe(true);
    expect(specs.some(({ from, to }) => from === 0 && to === 1)).toBe(true);
  });

  test("keeps Markdown syntax visible on the active line", () => {
    const state = EditorState.create({ doc: "# Heading", selection: { anchor: 4 }, extensions: [markdown()] });
    expect(decorationSpecs(state).some(({ from, to }) => from === 0 && to === 1)).toBe(false);
  });

  test("replaces an inactive task marker with a checkbox widget", () => {
    const state = EditorState.create({ doc: "- [ ] Task\n\nActive", selection: { anchor: 14 }, extensions: [markdown()] });
    expect(decorationSpecs(state).some(({ widget }) => widget === "LocalMarkdownTaskWidget")).toBe(true);
  });

  test("wraps and unwraps a selection without corrupting history", () => {
    const parent = document.createElement("div");
    const onChange = vi.fn();
    const editor = createLocalMarkdownEditor({ parent, markdown: "word", onChange });
    editor.view.dispatch({ selection: { anchor: 0, head: 4 } });
    wrapLocalMarkdownSelection(editor.view, "**", "**");
    expect(editor.getMarkdown()).toBe("**word**");
    editor.view.dispatch({ selection: { anchor: 2, head: 6 } });
    wrapLocalMarkdownSelection(editor.view, "**", "**");
    expect(editor.getMarkdown()).toBe("word");
    editor.destroy();
  });

  test("setMarkdown does not emit an application edit", () => {
    const parent = document.createElement("div");
    const onChange = vi.fn();
    const editor = createLocalMarkdownEditor({ parent, markdown: "a", onChange });
    editor.setMarkdown("b");
    expect(editor.getMarkdown()).toBe("b");
    expect(onChange).not.toHaveBeenCalled();
    editor.destroy();
  });
});
```

- [ ] **Step 2: Run Live Preview tests and verify the missing-module failure**

Run: `npm run test:unit -- tests/LocalMarkdown/livePreview.test.js`  
Expected: FAIL because the editor modules do not exist.

- [ ] **Step 3: Implement active-line-aware Markdown decorations**

In `src/LocalMarkdown/livePreview.js`:

```js
export const LocalMarkdownLivePreview = ViewPlugin.fromClass(class {
  constructor(view) { this.decorations = buildLocalMarkdownDecorations(view.state); }
  update(update) {
    if (update.docChanged || update.selectionSet || syntaxTree(update.state) !== syntaxTree(update.startState)) {
      this.decorations = buildLocalMarkdownDecorations(update.state);
    }
  }
}, { decorations: (value) => value.decorations });

export function buildLocalMarkdownDecorations(state)
```

For every selection range, compute the full active line interval. Do not hide or replace syntax on any active line. For inactive syntax-tree nodes:

- add line classes `LocalMarkdown-heading-1` through `LocalMarkdown-heading-6` to ATX heading lines;
- replace `HeaderMark`, emphasis marks, strikethrough marks, code marks, link marks and destinations, quote marks, and list marks with zero-width decorations;
- add mark classes for strong, emphasis, strikethrough, inline code, links, quotes, and code blocks;
- replace task markers with `LocalMarkdownTaskWidget`, whose click dispatches a source change between `[ ]` and `[x]`;
- catch parsing/decoration errors and return `Decoration.none`, preserving source editing.

Use `RangeSetBuilder` and append ranges in numeric order. Never generate or insert reading-view HTML into the editor document.

- [ ] **Step 4: Implement the LocalMarkdown editor wrapper and commands**

Create `src/LocalMarkdown/editor.js` with:

```js
export function createLocalMarkdownEditor({ parent, markdown: source, onChange }) {
  let synchronizing = false;
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: source,
      extensions: [
        basicSetup,
        markdown(),
        LocalMarkdownLivePreview,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !synchronizing) onChange(update.state.doc.toString());
        })
      ]
    })
  });
  return {
    view,
    getMarkdown: () => view.state.doc.toString(),
    setMarkdown(markdownSource) {
      if (markdownSource === view.state.doc.toString()) return;
      synchronizing = true;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: markdownSource } });
      synchronizing = false;
    },
    focus: () => view.focus(),
    format: (kind) => applyLocalMarkdownFormat(view, kind),
    destroy: () => view.destroy()
  };
}

export function wrapLocalMarkdownSelection(view, before, after) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const alreadyWrapped = view.state.sliceDoc(Math.max(0, from - before.length), from) === before
    && view.state.sliceDoc(to, to + after.length) === after;
  if (alreadyWrapped) {
    view.dispatch({
      changes: [{ from: from - before.length, to: from, insert: "" }, { from: to, to: to + after.length, insert: "" }],
      selection: { anchor: from - before.length, head: to - before.length }
    });
  } else {
    view.dispatch({ changes: { from, to, insert: `${before}${selected}${after}` }, selection: { anchor: from + before.length, head: to + before.length } });
  }
  view.focus();
  return true;
}

export function applyLocalMarkdownFormat(view, kind) {
  const wrappers = { bold: ["**", "**"], italic: ["*", "*"], strikethrough: ["~~", "~~"], code: ["`", "`"], link: ["[", "](url)"] };
  if (wrappers[kind]) return wrapLocalMarkdownSelection(view, ...wrappers[kind]);
  if (kind === "task") return prefixLocalMarkdownLines(view, "- [ ] ");
  return false;
}
```

Map `bold` to `**…**`, `italic` to `*…*`, `strikethrough` to `~~…~~`, `code` to backticks, `link` to `[…](url)`, and `task` to the current line prefix `- [ ] `. Use CodeMirror transaction annotations to prevent `setMarkdown` from being confused with user input.

Use CodeMirror `indentMore` and `indentLess` for Tab and Shift-Tab only when the selection is inside a list item; otherwise preserve browser focus traversal. Extend `src/LocalMarkdown/LocalMarkdown.css` with:

```css
.cm-editor { min-height:100%; color:var(--LocalMarkdown-text); background:transparent; }
.cm-scroller { font:1rem/1.65 ui-sans-serif,system-ui,sans-serif; }
.cm-line.LocalMarkdown-heading-1 { font-size:2rem; font-weight:750; color:var(--LocalMarkdown-strong); }
.cm-line.LocalMarkdown-heading-2 { font-size:1.55rem; font-weight:720; color:var(--LocalMarkdown-strong); }
.LocalMarkdown-strong { font-weight:750; }
.LocalMarkdown-emphasis { font-style:italic; }
.LocalMarkdown-strikethrough { text-decoration:line-through; }
.LocalMarkdown-inline-code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--LocalMarkdown-orange); }
.LocalMarkdown-link { color:var(--LocalMarkdown-blue); text-decoration:underline; }
.LocalMarkdown-hidden-syntax { display:none; }
.LocalMarkdown-task-widget { accent-color:var(--LocalMarkdown-green); }
```

- [ ] **Step 5: Run Live Preview and Markdown regression tests**

Run: `npm run test:unit -- tests/LocalMarkdown/livePreview.test.js tests/LocalMarkdown/markdown.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit the Live Preview editor**

```bash
git add src/LocalMarkdown/livePreview.js src/LocalMarkdown/editor.js src/LocalMarkdown/LocalMarkdown.css tests/LocalMarkdown/livePreview.test.js
git commit -m "feat: add LocalMarkdown Live Preview editor"
```

## Task 7: Core application controller and write-first interface

**Files:**
- Create: `src/LocalMarkdown/ui.js`
- Create: `src/LocalMarkdown/app.js`
- Create: `tests/LocalMarkdown/app.test.js`
- Modify: `src/LocalMarkdown/main.js`
- Modify: `src/LocalMarkdown/LocalMarkdown.css`
- Modify: `src/LocalMarkdown/LocalMarkdown.html`

**Interfaces:**
- Consumes: workspace operations, storage/coordinator, renderer, themes, editor, and download descriptions.
- Produces: `createLocalMarkdownUi(root, handlers)`, `createLocalMarkdownApp(dependencies)`, and a functioning sidebar, editor, reading view, toolbar, save status, theme control, and view control.

- [ ] **Step 1: Write failing app-controller and UI tests**

Create `tests/LocalMarkdown/app.test.js`:

```js
import { describe, expect, test, vi } from "vitest";
import { createLocalMarkdownApp } from "../../src/LocalMarkdown/app.js";

function dependencies(loadResult) {
  return {
    root: document.createElement("div"),
    store: { load: vi.fn(() => loadResult), save: vi.fn() },
    idFactory: (() => { let id = 0; return () => `id-${++id}`; })(),
    now: () => "2026-08-01T08:00:00.000Z",
    download: vi.fn(),
    media: { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  };
}

describe("LocalMarkdown application", () => {
  test("creates and displays the welcome workspace on first run", () => {
    const deps = dependencies({ kind: "empty" });
    const app = createLocalMarkdownApp(deps);
    expect(deps.root.textContent).toContain("LocalMarkdown");
    expect(deps.root.textContent).toContain("Welcome to LocalMarkdown");
    expect(deps.store.save).toHaveBeenCalledTimes(1);
    app.destroy();
  });

  test("creates a note, searches, pins, and switches selected notes", () => {
    const deps = dependencies({ kind: "empty" });
    const app = createLocalMarkdownApp(deps);
    deps.root.querySelector('[data-LocalMarkdown-action="new-note"]').click();
    app.updateActiveMarkdown("# Friday\nCall Sam");
    deps.root.querySelector('[data-LocalMarkdown-search]').value = "sam";
    deps.root.querySelector('[data-LocalMarkdown-search]').dispatchEvent(new Event("input", { bubbles: true }));
    expect(deps.root.querySelectorAll("[data-LocalMarkdown-document]")).toHaveLength(1);
    deps.root.querySelector('[data-LocalMarkdown-action="toggle-pin"]').click();
    expect(deps.root.querySelector('[data-LocalMarkdown-document]').getAttribute("data-LocalMarkdown-pinned")).toBe("true");
    app.destroy();
  });

  test("switches between Live Preview and safe Reading view", () => {
    const deps = dependencies({ kind: "empty" });
    const app = createLocalMarkdownApp(deps);
    app.updateActiveMarkdown("# Friday");
    deps.root.querySelector('[data-LocalMarkdown-action="reading-view"]').click();
    expect(deps.root.querySelector("[data-LocalMarkdown-reading]").innerHTML).toContain("<h1>Friday</h1>");
    deps.root.querySelector('[data-LocalMarkdown-action="live-preview"]').click();
    expect(deps.root.querySelector("[data-LocalMarkdown-editor]").hidden).toBe(false);
    app.destroy();
  });

  test("exposes accessible save status without announcing every edit", () => {
    const deps = dependencies({ kind: "empty" });
    const app = createLocalMarkdownApp(deps);
    const status = deps.root.querySelector('[data-LocalMarkdown-status]');
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    app.destroy();
  });
});
```

- [ ] **Step 2: Run app tests and verify missing-module failure**

Run: `npm run test:unit -- tests/LocalMarkdown/app.test.js`  
Expected: FAIL because `src/LocalMarkdown/app.js` does not exist.

- [ ] **Step 3: Implement semantic UI construction**

In `src/LocalMarkdown/ui.js`, build DOM with `createElement`, `textContent`, and explicit attributes. The top-level structure must be:

```html
<div class="LocalMarkdown-app">
  <header class="LocalMarkdown-toolbar" aria-label="LocalMarkdown toolbar"></header>
  <div class="LocalMarkdown-workspace">
    <aside class="LocalMarkdown-sidebar" aria-label="LocalMarkdown notes"></aside>
    <main class="LocalMarkdown-main">
      <div data-LocalMarkdown-editor></div>
      <article data-LocalMarkdown-reading hidden></article>
    </main>
  </div>
  <div data-LocalMarkdown-status role="status" aria-live="polite"></div>
  <div data-LocalMarkdown-toast role="status" aria-live="polite"></div>
</div>
```

`createLocalMarkdownUi(root, handlers)` must return methods `renderWorkspace`, `renderDocuments`, `renderView`, `renderSaveStatus`, `showToast`, `showDialog`, `focusSearch`, and `destroy`. Every icon button must have visible text or `aria-label` beginning with the action, not a glyph-only accessible name.

The toolbar exposes New note, sidebar, Live Preview/Reading view, theme, `More note actions`, and `Workspace menu`. More note actions contains Pin, Duplicate, Download Markdown, and Delete. Workspace menu contains Markdown import, LocalMarkdown workspace merge/replace/export, and recovery actions. Both menus use buttons with the exact accessible names exercised in Tasks 8 and 9.

- [ ] **Step 4: Implement application state and connect the browser entry**

Create `src/LocalMarkdown/app.js` with:

```js
export function createLocalMarkdownApp({
  root,
  store = new LocalMarkdownStorage(),
  idFactory = () => crypto.randomUUID(),
  now = () => new Date().toISOString(),
  download = triggerLocalMarkdownDownload,
  media = matchMedia("(prefers-color-scheme: dark)")
})
```

The returned controller must expose `updateActiveMarkdown(markdown)` for editor integration tests and `destroy()`. Load `empty`, `ready`, and `recovery` states separately. On empty, create and immediately save the welcome workspace. On ready, render it. On recovery, render the recovery dialog without overwriting storage.

Wire New note, selection, search, pin, duplicate, Live Preview, Reading view, sidebar collapse, and theme preference. Create one editor instance and call `setMarkdown` when selection changes. Feed editor changes through `updateLocalMarkdownDocument` and `LocalMarkdownSaveCoordinator.schedule`.

Keep a session-only scroll-position map keyed by document ID and view. Before changing notes or views, record the current editor or reading scroll offset; after rendering, restore that view's last offset when it exists.

Update `src/LocalMarkdown/main.js`:

```js
import { createLocalMarkdownApp } from "./app.js";
const LocalMarkdownRoot = document.querySelector("#LocalMarkdown-root");
const LocalMarkdownApp = createLocalMarkdownApp({ root: LocalMarkdownRoot });
addEventListener("beforeunload", () => LocalMarkdownApp.destroy(), { once: true });
```

- [ ] **Step 5: Implement the approved write-first Solarized layout**

Extend `src/LocalMarkdown/LocalMarkdown.css` with the approved layout foundation:

```css
body { color:var(--LocalMarkdown-text); background:var(--LocalMarkdown-canvas); }
button, input, select { font:inherit; }
button:focus-visible, input:focus-visible, select:focus-visible, .cm-editor.cm-focused {
  outline:2px solid var(--LocalMarkdown-blue); outline-offset:2px;
}
.LocalMarkdown-app { min-height:100vh; display:grid; grid-template-rows:3.25rem 1fr auto; }
.LocalMarkdown-toolbar { display:flex; align-items:center; gap:.625rem; padding:0 .875rem; background:var(--LocalMarkdown-surface); border-bottom:1px solid color-mix(in srgb,var(--LocalMarkdown-text) 22%,transparent); }
.LocalMarkdown-workspace { min-height:0; display:grid; grid-template-columns:17rem minmax(0,1fr); }
.LocalMarkdown-app[data-LocalMarkdown-sidebar-collapsed="true"] .LocalMarkdown-workspace { grid-template-columns:0 minmax(0,1fr); }
.LocalMarkdown-sidebar { min-width:0; overflow:auto; background:var(--LocalMarkdown-surface); border-right:1px solid color-mix(in srgb,var(--LocalMarkdown-text) 22%,transparent); }
.LocalMarkdown-main { min-width:0; overflow:auto; background:var(--LocalMarkdown-canvas); }
.LocalMarkdown-main > [data-LocalMarkdown-editor], .LocalMarkdown-reading { width:min(100%,72rem); min-height:100%; margin:0 auto; padding:2rem clamp(1rem,4vw,4rem); }
[data-LocalMarkdown-document][aria-current="true"] { box-shadow:inset .2rem 0 var(--LocalMarkdown-blue); font-weight:700; }
[data-LocalMarkdown-pinned="true"]::before { content:"Pinned"; font-size:.7rem; color:var(--LocalMarkdown-yellow); }
.LocalMarkdown-reading { font:1rem/1.7 ui-serif,Georgia,serif; }
@media (max-width:48rem) { .LocalMarkdown-workspace { grid-template-columns:13rem minmax(0,1fr); } }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition-duration:.01ms!important; animation-duration:.01ms!important; animation-iteration-count:1!important; } }
```

Use no remote font or background image.

- [ ] **Step 6: Run app, editor, storage, and workspace tests**

Run: `npm run test:unit -- tests/LocalMarkdown/app.test.js tests/LocalMarkdown/livePreview.test.js tests/LocalMarkdown/storage.test.js tests/LocalMarkdown/workspace.test.js`  
Expected: PASS.

- [ ] **Step 7: Build and manually open the first integrated artifact**

Run: `npm run build && open localmarkdown.html`  
Expected: Chrome shows the Solarized LocalMarkdown workspace, welcome note, sidebar, Live Preview editor, and Reading view without console errors.

- [ ] **Step 8: Commit the integrated LocalMarkdown interface**

```bash
git add src/LocalMarkdown tests/LocalMarkdown/app.test.js localmarkdown.html
git commit -m "feat: assemble the LocalMarkdown workspace"
```

## Task 8: Document actions, errors, dialogs, and keyboard accessibility

**Files:**
- Modify: `src/LocalMarkdown/app.js`
- Modify: `src/LocalMarkdown/ui.js`
- Modify: `src/LocalMarkdown/editor.js`
- Modify: `src/LocalMarkdown/LocalMarkdown.css`
- Modify: `tests/LocalMarkdown/app.test.js`

**Interfaces:**
- Consumes: all core app and portability interfaces.
- Produces: Markdown import/download, backup export/merge/replace, delete confirmation/Undo, storage recovery/export, save-failed UI, formatting shortcuts, and dialog focus management.

- [ ] **Step 1: Add failing action and failure-state tests**

Append to `tests/LocalMarkdown/app.test.js`:

```js
test("confirms deletion and restores the exact document with Undo", () => {
  const deps = dependencies({ kind: "empty" });
  const app = createLocalMarkdownApp(deps);
  const deletedId = app.workspace.activeDocumentId;
  app.requestDelete(deletedId);
  deps.root.querySelector('[data-LocalMarkdown-dialog-confirm]').click();
  expect(app.workspace.documents.some(({ id }) => id === deletedId)).toBe(false);
  deps.root.querySelector('[data-LocalMarkdown-action="undo-delete"]').click();
  expect(app.workspace.documents.some(({ id }) => id === deletedId)).toBe(true);
  app.destroy();
});

test("offers immediate backup export after save failure", () => {
  vi.useFakeTimers();
  const deps = dependencies({ kind: "empty" });
  deps.store.save = vi.fn(() => { throw new DOMException("full", "QuotaExceededError"); });
  const app = createLocalMarkdownApp(deps);
  app.updateActiveMarkdown("unsaved");
  vi.advanceTimersByTime(300);
  expect(deps.root.textContent).toContain("Save failed");
  deps.root.querySelector('[data-LocalMarkdown-action="export-after-failure"]').click();
  expect(deps.download).toHaveBeenCalledWith(expect.objectContaining({ filename: "LocalMarkdown-workspace.json" }));
  app.destroy();
  vi.useRealTimers();
});

test("does not overwrite invalid stored LocalMarkdown data", () => {
  const deps = dependencies({ kind: "recovery", raw: "{broken", error: new SyntaxError("broken") });
  const app = createLocalMarkdownApp(deps);
  expect(deps.store.save).not.toHaveBeenCalled();
  expect(deps.root.textContent).toContain("LocalMarkdown recovery");
  app.destroy();
});

test("traps dialog focus and returns it to the invoking control", () => {
  const deps = dependencies({ kind: "empty" });
  const app = createLocalMarkdownApp(deps);
  const button = deps.root.querySelector('[data-LocalMarkdown-action="workspace-menu"]');
  button.focus();
  app.openWorkspaceImportDialog();
  const dialog = deps.root.querySelector('[role="dialog"]');
  expect(dialog.contains(document.activeElement)).toBe(true);
  dialog.querySelector('[data-LocalMarkdown-dialog-cancel]').click();
  expect(document.activeElement).toBe(button);
  app.destroy();
});
```

- [ ] **Step 2: Run the focused app tests and confirm behavior failures**

Run: `npm run test:unit -- tests/LocalMarkdown/app.test.js`  
Expected: FAIL on missing controller actions and recovery/error UI.

- [ ] **Step 3: Implement document and workspace actions**

Add controller methods `requestDelete`, `undoDelete`, `importMarkdownFiles`, `downloadActiveDocument`, `exportWorkspace`, `mergeWorkspaceBackup`, `replaceWorkspaceBackup`, `openWorkspaceImportDialog`, and `downloadRecoveryData`.

Implement the mutation boundary in `app.js` with one function so every action re-renders and schedules the same validated state:

```js
function commitLocalMarkdownWorkspace(nextWorkspace, { save = true } = {}) {
  workspace = validateLocalMarkdownWorkspace(nextWorkspace);
  ui.renderWorkspace(workspace, query);
  syncLocalMarkdownEditor();
  if (save) saveCoordinator.schedule(workspace);
}

async function importMarkdownFiles(files) {
  const { documents, errors } = await importLocalMarkdownFiles(files, { idFactory, now: now() });
  let next = workspace;
  for (const document of documents) next = addLocalMarkdownDocument(next, document);
  commitLocalMarkdownWorkspace(next);
  ui.showImportResults({ imported: documents.length, errors });
}

function undoDelete() {
  if (!pendingDeletion) return;
  clearTimeout(pendingDeletion.timeoutId);
  commitLocalMarkdownWorkspace(restoreLocalMarkdownDocument(workspace, pendingDeletion.document));
  pendingDeletion = null;
}
```

Use a hidden file input with `accept=".md,text/markdown"` and `multiple` for note import, and a separate input with `accept=".json,application/json"` for backup import. Default backup action is Merge. Replace must show counts for current and candidate documents and require a second explicit confirmation button labeled `Replace LocalMarkdown workspace`.

Deletion stores `{ document, timeoutId }` for 8 seconds. A second deletion commits the earlier pending deletion before showing the new Undo action. Undo clears the timer, restores the original identifier, selects the document, and schedules persistence.

- [ ] **Step 4: Implement save-failed and recovery paths**

On `save-failed`, keep editing enabled, keep the failed workspace in memory, show `Save failed — changes may be lost when this tab closes`, and render `Export LocalMarkdown workspace` beside it. Recovery mode must offer `Download recovery data` as `LocalMarkdown-recovery.txt` and `Start a new LocalMarkdown workspace`; the latter requires confirmation before the first successful save replaces invalid data.

Route save state through one handler:

```js
function handleLocalMarkdownSaveStatus(status, error) {
  ui.renderSaveStatus(status, error);
  if (status === "save-failed") {
    ui.showPersistentFailure({
      message: "Save failed — changes may be lost when this tab closes",
      action: "Export LocalMarkdown workspace",
      onAction: exportWorkspace
    });
  }
}
```

- [ ] **Step 5: Implement keyboard commands and accessible dialogs**

Register commands only while LocalMarkdown has focus:

```text
Mod-Shift-N  New note
Mod-Shift-F  Focus LocalMarkdown search
Mod-Shift-P  Toggle Live Preview / Reading view
Mod-Shift-B  Toggle sidebar
Mod-Shift-S  Download active Markdown
Mod-B        Bold
Mod-I        Italic
Mod-Shift-X  Strikethrough
Mod-E        Inline code
Mod-K        Link
Mod-Enter    Task item
```

Keep native browser-reserved `Mod-N`, `Mod-F`, and `Mod-S` untouched. Dialogs need `aria-modal="true"`, a labelled heading, focus on the least destructive action, Tab/Shift-Tab wrapping, Escape cancellation when safe, and focus return to the invoker.

Use an explicit key map and ignore unlisted combinations:

```js
const LocalMarkdownShortcuts = new Map([
  ["Mod-Shift-n", () => createNote()], ["Mod-Shift-f", () => ui.focusSearch()],
  ["Mod-Shift-p", () => toggleView()], ["Mod-Shift-b", () => toggleSidebar()],
  ["Mod-Shift-s", () => downloadActiveDocument()], ["Mod-b", () => editor.format("bold")],
  ["Mod-i", () => editor.format("italic")], ["Mod-Shift-x", () => editor.format("strikethrough")],
  ["Mod-e", () => editor.format("code")], ["Mod-k", () => editor.format("link")],
  ["Mod-Enter", () => editor.format("task")]
]);

function handleLocalMarkdownShortcut(event) {
  const key = normalizeLocalMarkdownShortcut(event);
  const action = LocalMarkdownShortcuts.get(key);
  if (!action) return;
  event.preventDefault();
  action();
}
```

- [ ] **Step 6: Run action tests and the complete unit suite**

Run: `npm run test:unit -- tests/LocalMarkdown/app.test.js && npm run test:unit`  
Expected: PASS.

- [ ] **Step 7: Commit complete version 1 interactions**

```bash
git add src/LocalMarkdown tests/LocalMarkdown/app.test.js
git commit -m "feat: complete LocalMarkdown workspace actions"
```

## Task 9: Chrome end-to-end and release enforcement

**Files:**
- Create: `playwright.config.js`
- Create: `tests/LocalMarkdown/LocalMarkdown.e2e.test.js`
- Modify: `scripts/verify-LocalMarkdown-release.mjs`
- Modify: `tests/LocalMarkdown/build.test.js`

**Interfaces:**
- Consumes: built `localmarkdown.html` and all user-facing workflows.
- Produces: automated local-file Chrome coverage, axe smoke checks, and strict self-contained release verification.

- [ ] **Step 1: Write the failing local-file Chrome smoke test**

Create `playwright.config.js`:

```js
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/LocalMarkdown",
  testMatch: "LocalMarkdown.e2e.test.js",
  use: { browserName: "chromium", channel: "chrome", headless: true },
  reporter: "line"
});
```

Create `tests/LocalMarkdown/LocalMarkdown.e2e.test.js`:

```js
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const LocalMarkdownUrl = pathToFileURL(resolve("localmarkdown.html")).href;

test.beforeEach(async ({ page }) => {
  await page.goto(LocalMarkdownUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("LocalMarkdown persists multiple notes, search, pin, view, and theme", async ({ page }) => {
  await expect(page.getByText("Welcome to LocalMarkdown")).toBeVisible();
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator(".cm-content").fill("# Friday\n\n- [ ] Call Sam");
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.getByText("Friday", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search LocalMarkdown notes" }).fill("sam");
  await expect(page.locator("[data-LocalMarkdown-document]")).toHaveCount(1);
  await page.getByRole("button", { name: "More note actions" }).click();
  await page.getByRole("button", { name: "Pin note" }).click();
  await page.getByRole("button", { name: "Reading view" }).click();
  await expect(page.getByRole("heading", { name: "Friday" })).toBeVisible();
  await page.getByRole("combobox", { name: "LocalMarkdown theme" }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-LocalMarkdown-theme", "dark");
});

test("LocalMarkdown passes a serious-impact axe smoke check in both themes", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    await page.getByRole("combobox", { name: "LocalMarkdown theme" }).selectOption(theme);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(({ impact }) => ["critical", "serious"].includes(impact))).toEqual([]);
  }
});
```

- [ ] **Step 2: Run the Chrome tests and confirm selector/workflow failures**

Run: `npx playwright install chrome && npm run test:e2e`  
Expected: FAIL until the integrated interface exposes the exact accessible names and local-file workflow.

- [ ] **Step 3: Fix only verified integration gaps and complete end-to-end coverage**

Add these complete tests to the same file:

```js
test("LocalMarkdown duplicates, confirms deletion, and undoes it", async ({ page }) => {
  const rows = page.locator("[data-LocalMarkdown-document]");
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator(".cm-content").fill("# Duplicate me");
  await page.getByRole("button", { name: "More note actions" }).click();
  await page.getByRole("button", { name: "Duplicate note" }).click();
  await expect(rows).toHaveCount(3);
  await page.getByRole("button", { name: "More note actions" }).click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete note" }).click();
  await expect(rows).toHaveCount(2);
  await page.getByRole("button", { name: "Undo delete" }).click();
  await expect(rows).toHaveCount(3);
});

test("LocalMarkdown downloads Markdown and a complete workspace backup", async ({ page }) => {
  await page.getByRole("button", { name: "New note" }).click();
  await page.locator(".cm-content").fill("# Friday plan");
  await page.getByRole("button", { name: "More note actions" }).click();
  const markdownEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  expect((await markdownEvent).suggestedFilename()).toBe("Friday plan.md");
  await page.getByRole("button", { name: "Workspace menu" }).click();
  const backupEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export LocalMarkdown workspace" }).click();
  expect((await backupEvent).suggestedFilename()).toBe("LocalMarkdown-workspace.json");
});

test("LocalMarkdown imports Markdown then merges and replaces validated backups", async ({ page }) => {
  await page.getByRole("button", { name: "Workspace menu" }).click();
  const markdownChooserEvent = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Markdown" }).click();
  await (await markdownChooserEvent).setFiles({ name: "Imported.md", mimeType: "text/markdown", buffer: Buffer.from("# Imported") });
  await expect(page.getByText("Imported", { exact: true })).toBeVisible();
  const backup = (title, id) => ({
    product: "LocalMarkdown", format: "LocalMarkdownWorkspaceBackup", schemaVersion: 1,
    exportedAt: "2026-08-01T08:00:00.000Z",
    workspace: {
      product: "LocalMarkdown", schemaVersion: 1, activeDocumentId: id,
      preferences: { theme: "system", sidebarCollapsed: false, view: "live-preview" },
      documents: [{ id, markdown: `# ${title}`, pinned: false, createdAt: "2026-08-01T08:00:00.000Z", updatedAt: "2026-08-01T08:00:00.000Z" }]
    }
  });
  await page.getByRole("button", { name: "Workspace menu" }).click();
  const mergeChooserEvent = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Merge LocalMarkdown workspace" }).click();
  await (await mergeChooserEvent).setFiles({ name: "merge.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup("Merged", "merged"))) });
  await expect(page.getByText("Merged", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Workspace menu" }).click();
  const replaceChooserEvent = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Replace LocalMarkdown workspace" }).click();
  await (await replaceChooserEvent).setFiles({ name: "replace.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup("Replacement", "replacement"))) });
  await page.getByRole("dialog").getByRole("button", { name: "Replace LocalMarkdown workspace" }).click();
  await expect(page.locator("[data-LocalMarkdown-document]")).toHaveCount(1);
  await expect(page.getByText("Replacement", { exact: true })).toBeVisible();
});

test("LocalMarkdown keyboard commands leave browser-reserved search untouched", async ({ page }) => {
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.locator(".cm-content").focus();
  await page.keyboard.press(`${modifier}+Shift+N`);
  await expect(page.locator("[data-LocalMarkdown-document]")).toHaveCount(2);
  await page.keyboard.press(`${modifier}+Shift+F`);
  await expect(page.getByRole("searchbox", { name: "Search LocalMarkdown notes" })).toBeFocused();
  const reservedPrevented = await page.evaluate(({ metaKey, ctrlKey }) => {
    const target = document.querySelector("[data-LocalMarkdown-search]");
    const event = new KeyboardEvent("keydown", { key: "f", metaKey, ctrlKey, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }, { metaKey: process.platform === "darwin", ctrlKey: process.platform !== "darwin" });
  expect(reservedPrevented).toBe(false);
});
```

Do not bypass the interface by calling controller methods in end-to-end tests.

- [ ] **Step 4: Strengthen release verification**

Update `scripts/verify-LocalMarkdown-release.mjs` to reject:

```js
const LocalMarkdownForbidden = [
  [/<script[^>]+src=/i, "external script"],
  [/<link[^>]+href=/i, "external stylesheet"],
  [/@import\s+url/i, "CSS import"],
  [/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/, "network API"],
  [/<(?:img|audio|video|source)[^>]+(?:src|srcset)=["']https?:/i, "remote media"]
];
```

Also assert one doctype, one inline script, at least one inline style, the LocalMarkdown storage key, both Solarized themes, the backup filename, no unreplaced build token, and a nonempty file below 1.5 MiB. Extend `tests/LocalMarkdown/build.test.js` to exercise verifier failure messages against fixture strings through exported `verifyLocalMarkdownHtml(html)`.

- [ ] **Step 5: Run the complete test and release pipeline**

Run: `npm run verify`  
Expected: all Vitest files PASS, all Playwright tests PASS in Chromium, axe reports no critical/serious issues, and the release verifier prints `LocalMarkdown release verified`.

- [ ] **Step 6: Commit Chrome and release enforcement**

```bash
git add playwright.config.js tests/LocalMarkdown scripts/verify-LocalMarkdown-release.mjs src/LocalMarkdown localmarkdown.html
git commit -m "test: verify LocalMarkdown in Chrome"
```

## Task 10: LocalMarkdown documentation and release readiness

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `tests/LocalMarkdown/documentation.test.js`
- Modify: `package.json`
- Modify: `scripts/verify-LocalMarkdown-release.mjs`
- Regenerate: `localmarkdown.html`

**Interfaces:**
- Consumes: final commands, behavior, limitations, and installed dependency licenses.
- Produces: complete user/developer/release documentation and the version 1 release candidate.

- [ ] **Step 1: Write the failing documentation contract**

Create `tests/LocalMarkdown/documentation.test.js`:

```js
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const files = ["README.md", "CHANGELOG.md", "THIRD_PARTY_NOTICES.md"];

describe("LocalMarkdown documentation", () => {
  test.each(files)("%s consistently identifies LocalMarkdown", (file) => {
    expect(readFileSync(file, "utf8")).toContain("LocalMarkdown");
  });

  test("README documents zero-install use and browser-storage risk", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("Open `localmarkdown.html` in Google Chrome");
    expect(readme).toContain("LocalMarkdown-workspace.json");
    expect(readme).toContain("browser storage is not a backup");
    expect(readme).toContain("npm run verify");
  });

  test("third-party notices cover every production package", () => {
    const notices = readFileSync("THIRD_PARTY_NOTICES.md", "utf8");
    for (const name of ["CodeMirror", "markdown-it", "markdown-it-task-lists"]) expect(notices).toContain(name);
  });
});
```

- [ ] **Step 2: Run the documentation contract and verify missing-file failures**

Run: `npm run test:unit -- tests/LocalMarkdown/documentation.test.js`  
Expected: FAIL because the three root documents do not exist.

- [ ] **Step 3: Write user and developer documentation**

Create `README.md` with these sections and exact operational content:

```markdown
# LocalMarkdown

LocalMarkdown is a lightweight, zero-install Markdown workspace contained in one file.

## Start LocalMarkdown

Open `localmarkdown.html` in Google Chrome. No installation or local server is required.

## Keep your notes safe

LocalMarkdown automatically saves notes in the current Chrome profile, but browser storage is not a backup. Use **Workspace → Export LocalMarkdown workspace** regularly. The downloaded backup is `LocalMarkdown-workspace.json`.

## Develop LocalMarkdown

`npm install` installs build-only dependencies. `npm run build` regenerates `localmarkdown.html`. `npm run verify` runs unit, Chrome, accessibility, and release checks.
```

Expand the README with Live Preview/Reading view, search/pin/import/export, System/Solarized themes, privacy, local storage recovery, keyboard shortcuts, source layout, supported Markdown, version 1 exclusions, and release instructions.

Create `CHANGELOG.md` with `# LocalMarkdown Changelog` and a `## 0.1.0 — 2026-08-01` entry listing the version 1 behavior. Create `THIRD_PARTY_NOTICES.md` with package names, exact versions from `package-lock.json`, copyright/license identifiers from each installed package, and links to the corresponding upstream license files. Do not paste a license text unless that dependency requires reproduction.

- [ ] **Step 4: Add release metadata and documentation checks**

Add to `package.json`:

```json
{
  "description": "LocalMarkdown is a lightweight, zero-install Markdown workspace.",
  "license": "MIT"
}
```

Update the release verifier to require `README.md`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`, and the design spec. Scan source, tests, scripts, and root documentation for the rejected product spellings `Local Markdown`, `Local-Markdown`, and `LOCALMARKDOWN`; allow `localmarkdown.html` only as the explicit artifact-name exception.

- [ ] **Step 5: Run documentation, unit, Chrome, and release checks**

Run: `npm run verify`  
Expected: PASS across unit tests, Chrome workflows, axe smoke checks, documentation contracts, and the single-file verifier.

- [ ] **Step 6: Inspect the final artifact manually in Chrome**

Run: `open localmarkdown.html`  
Expected: LocalMarkdown opens from the file URL, System theme resolves correctly, Live Preview reveals syntax only around the text cursor, Reading view is safe, reload restores notes, workspace export downloads, and DevTools Network shows no application-initiated requests.

- [ ] **Step 7: Check the final repository and commit the release candidate**

Run:

```bash
git status --short
git diff --check
git log --oneline --decorate -10
```

Expected: only the intended documentation, metadata, generated artifact, and test changes are uncommitted; no whitespace errors.

```bash
git add README.md CHANGELOG.md THIRD_PARTY_NOTICES.md package.json package-lock.json scripts tests localmarkdown.html
git commit -m "docs: prepare LocalMarkdown 0.1.0"
```

## Final verification checklist

- [ ] Run `npm ci` from a clean dependency directory.
- [ ] Run `npm run verify` and retain the passing command output for the handoff.
- [ ] Confirm `localmarkdown.html` is below 1.5 MiB and opens directly in Chrome.
- [ ] Confirm Chrome DevTools records no application-initiated network request.
- [ ] Confirm the Git working tree is clean.
- [ ] Review the diff from the design-spec commits through the release commit for scope and LocalMarkdown naming.
