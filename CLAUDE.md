# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```nu
bun install          # Install dependencies
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

**Preload** (`src/preload/index.js`) — minimal bridge using `@electron-toolkit/preload`; exposes `window.electron` to the renderer.

**Renderer** (`src/renderer/`) — Svelte 5 UI with `svelte-routing`.

### IPC channels (events.js)

All renderer↔main communication goes through named IPC channels defined in `src/main/plugins/events.js`. The renderer calls `ipcRenderer.send`/`ipcRenderer.once`/`ipcRenderer.on` and the main process responds via `e.sender.send`. Key channels:

| Channel | Direction | Purpose |
|---|---|---|
| `URL_VERIFY` | renderer→main→renderer | Parse gallery URL, fetch manga metadata |
| `INIT_MANGA` | main→renderer | Progress updates while fetching page list |
| `DOWNLOAD_BEGIN` | renderer→main | Start image download queue |
| `DOWNLOAD_WATCH` | main→renderer | Per-image download progress |
| `DOWNLOAD_COMPLATE` | main→renderer | Queue finished |
| `CLIPBOARD` | bidirectional | Poll clipboard every 300 ms for gallery links |
| `LOGIN` | renderer→main→renderer | Store `igneous`/`ipb_member_id`/`ipb_pass_hash` cookies |
| `CANCEL` | renderer→main | Abort current download |
| `CHANGE_DIRECTORY` | renderer→main→renderer | Open native folder picker |

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
