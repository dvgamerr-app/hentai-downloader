# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```nu
bun install --frozen-lockfile # Install the exact locked dependencies
bun run dev          # Start dev server with hot reload (Electron + Vite HMR)
bun run build        # Bundle all three processes via electron-vite
bun run build:win    # Build + package Windows NSIS installer
bun run lint         # ESLint with auto-fix
bun run format       # Prettier (includes svelte plugin)
```

No test suite exists in this project.

## Architecture

Electron desktop app with three processes wired through IPC:

**Main process** (`src/main/index.js`) — creates the `BrowserWindow` and `Tray`, loads `electron-settings` for persistent config (window position, auth cookies, download directory), and delegates all IPC handlers to `plugins/events.js`.

**Preload** (`src/preload/index.js`) — exposes `window.electron` (via `@electron-toolkit/preload`) and `window.api` (custom IPC bridge). All renderer↔main communication goes through `window.api.*`.

**Renderer** (`src/renderer/`) — Svelte 5 single-component app (`App.svelte`). No router — the whole UI lives in one component with local state controlling which view is shown (landing screen vs main downloader).

**Styling** — Tailwind CSS 4 is imported by `src/renderer/src/assets/app.css`. Font Awesome 4.7 is kept as a renderer-specific CSS subset backed only by WOFF2; add a glyph declaration when introducing a new `fa-*` icon.

### `window.api` (preload bridge)

All UI→main calls go through `window.api.*` exposed in `src/preload/index.js`:

| Method                    | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `configLoaded()`          | Returns `{directory, igneous, cookie}` from settings   |
| `clearCookie()`           | Deletes igneous/ipb cookies from settings              |
| `changeDirectory()`       | Opens native folder picker, returns path               |
| `cancel()`                | Cancels active download, clears all IPC listeners      |
| `urlVerify(url)`          | Fetches manga metadata, returns `{error, data}`        |
| `initManga(callback)`     | Registers progress callback for manga page loading     |
| `download(data, onWatch)` | Starts download queue, calls `onWatch` per image       |
| `login(cookie)`           | Parses and saves exhentai cookies, returns `{success}` |
| `clipboard(onPaste)`      | Starts clipboard polling, calls `onPaste` on new text  |

### IPC channels (events.js)

All renderer↔main communication goes through named IPC channels defined in `src/main/plugins/events.js`. The renderer calls `ipcRenderer.send`/`ipcRenderer.once`/`ipcRenderer.on` and the main process responds via `e.sender.send`. Key channels:

| Channel             | Direction              | Purpose                                                 |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `URL_VERIFY`        | renderer→main→renderer | Parse gallery URL, fetch manga metadata                 |
| `INIT_MANGA`        | main→renderer          | Progress updates while fetching page list               |
| `DOWNLOAD_BEGIN`    | renderer→main          | Start image download queue                              |
| `DOWNLOAD_WATCH`    | main→renderer          | Per-image download progress                             |
| `DOWNLOAD_COMPLATE` | main→renderer          | Queue finished                                          |
| `CLIPBOARD`         | bidirectional          | Poll clipboard every 300 ms for gallery links           |
| `LOGIN`             | renderer→main→renderer | Store `igneous`/`ipb_member_id`/`ipb_pass_hash` cookies |
| `CANCEL`            | renderer→main          | Abort current download                                  |
| `CHANGE_DIRECTORY`  | renderer→main→renderer | Open native folder picker                               |

### Scraping layer (`src/main/plugins/`)

- `ehentai.js` — core scraping module. Uses **native `fetch`** (Node.js built-in, no axios) with manual cookie headers. Exports `parseHentai` (metadata fetch), `download` (image queue), `cancel`.
- `lib/config.js` — minimal file, just ensures the `./config` directory exists.
- `ex/gallery.js`, `ex/login.js`, `ex/logout.js` — exhentai-specific page parsing (legacy, not wired up).

**Auth flow**: exhentai requires three cookies (`igneous`, `ipb_member_id`, `ipb_pass_hash`) stored via `electron-settings`. `buildCookieHeader(hostname)` assembles them into a `Cookie:` header per request. Without `igneous`, exhentai requests throw `"Please join your browser session."`.

**Image streaming**: images are downloaded via `fetch()` and streamed to disk using `pipeline(Readable.fromWeb(res.body), writer)` — no buffering in memory.

### Logging

`ehentai.js` uses **`dayjs`** (replaces deprecated moment) to write two date-stamped log files: `YYYY-MM-DD.log` (info) and `YYYY-MM-DD-error.log` (errors). The main process also uses `electron-log`.

## Build config

- `electron.vite.config.mjs` — Vite config for all three processes; SVG/PNG assets handled via `?asset` imports.
- `electron-builder.yml` — packaging targets: Windows (NSIS), macOS (DMG), Linux (AppImage, snap, deb).
- `electron-settings` persists config to `<appName>.json` in the user data directory.

## Optimization log — 2026-08-02

- Removed two renderer-only wrappers by making the queue container the scroll owner and replacing the landing overlay element with a `::before` layer.
- Moved the body drag/user-select declarations from inline HTML into the renderer stylesheet and replaced static table-column styles with Tailwind utilities.
- Reduced repeated URL trimming, status string comparisons, and integer parsing in the renderer.
- Subset Font Awesome CSS to the 22 glyphs referenced by `App.svelte` and removed legacy EOT/WOFF/TTF/SVG references. The renderer now emits only the 77.16 kB WOFF2 font instead of 953.52 kB across five formats.
- Consolidated preload request/response IPC boilerplate into `requestOnce`.
- Prevented duplicate main-process IPC registrations when a macOS window is recreated, and stop clipboard polling when its window closes.
- Consolidated log writing, cached cookie settings per request, reused parsed page totals, and moved download-directory/file-extension work out of the per-image hot path.
- Updated compatible locked versions of Vite, electron-builder, electron-updater, ESLint, and eslint-plugin-svelte. `bun audit` decreased from 70 findings (1 critical, 48 high, 19 moderate, 2 low) to 58 (1 critical, 39 high, 16 moderate, 2 low); remaining findings are transitive and require upstream or breaking upgrades.

### Measured production output

- Renderer CSS: 65.28 kB → 31.96 kB.
- Renderer JavaScript: 150.04 kB → 149.26 kB.
- Emitted font assets: 953.52 kB → 77.16 kB.

### Verification

- `bun install --frozen-lockfile`: passed before the targeted lockfile update.
- ESLint: passed.
- Scoped Prettier formatting/check: passed; the repository-wide baseline still reports 23 legacy files.
- `bun run build`: passed for main, preload, and renderer.
- Playwright Electron smoke test: the repository driver launched a child Electron process but did not return a window within the automation timeout; the spawned process tree was terminated.
- No automated test suite exists.
