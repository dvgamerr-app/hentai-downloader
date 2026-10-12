<div align="center">

<img src="resources/256x256.png" alt="Hentai Downloader icon" width="96" />

# Hentai Downloader

**Paste gallery links, press Download, get tidy folders of images.**

A small desktop app for e-hentai.org and exhentai.org that queues galleries for you, so you stop saving pages one by one in a browser.

[![Stars](https://img.shields.io/github/stars/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](https://github.com/dvgamerr-app/hentai-downloader/stargazers)
[![Latest release](https://img.shields.io/github/v/release/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](https://github.com/dvgamerr-app/hentai-downloader/releases/latest)
[![License](https://img.shields.io/github/license/dvgamerr-app/hentai-downloader?style=for-the-badge&color=18BC9C)](LICENSE)
![Platform](https://img.shields.io/badge/Windows-installer-18BC9C?style=for-the-badge)

[Website](https://dvgamerr.app/hentai-downloader/) · [Quick start](#quick-start) · [Install guide](docs/install.md) · [ภาษาไทย](README.th.md)

<img src="docs/screenshots/queue.png" alt="Download queue with one gallery in progress" width="230" />
<img src="docs/screenshots/history.png" alt="History view listing finished galleries" width="230" />
<img src="docs/screenshots/settings.png" alt="Cookie sign-in panel for exhentai.org" width="230" />

**If this saves you time, please [star the repo](https://github.com/dvgamerr-app/hentai-downloader). It helps other people find it.**

</div>

> **18+ only.** The sites this app talks to host adult-oriented galleries. Use it only if you are of legal age where you live.

## Why

- **Queue first, download later.** Paste one link or a whole list, then start the run once. The app walks through the queue for you.
- **Does not spend Credits/GP.** It fetches the normal viewer images, not the paid original files.
- **Safe to re-run.** If a gallery came out incomplete, delete the broken files and press Download again. Pages that already exist on disk are skipped and only the missing ones are fetched.
- **Gentle on the site.** One gallery, one file at a time, with timeouts and retries. That is a limit of the sites themselves, and it keeps you from getting banned.

## Features

| | Feature | What it does |
| --- | --- | --- |
| 📋 | **Clipboard watching** | Copy a gallery link anywhere and the app picks it up. |
| 📝 | **Multi-line paste** | Paste many links, one per line, and they all join the queue. |
| 🌐 | **e-hentai + exhentai** | Both sites work. For exhentai you sign in with your own browser cookies. |
| 🗂️ | **Folder per gallery** | Images are saved into a folder named after the gallery, numbered by page. |
| 🔁 | **Resume by skipping** | Existing pages are not downloaded twice. |
| 🕘 | **History** | The last 200 galleries, newest first, with a button to open the folder. |
| 📌 | **Always on top** | A compact 600×380 window that stays visible, plus a tray icon. |
| ⬆️ | **Auto update** | Installed builds check GitHub Releases and offer to restart into the new version. |

<details>
<summary>More screenshots</summary>

<img src="docs/screenshots/landing.png" alt="Start screen with the URL field" width="460" />

</details>

## Quick start

1. Open the [latest release](https://github.com/dvgamerr-app/hentai-downloader/releases/latest) and download `hentai-downloader-<version>-setup.exe`.
2. Run the installer. A desktop shortcut is created.
3. Copy a gallery link such as `https://e-hentai.org/g/1234567/abcdef0123/` and paste it into the URL field, then press Enter. Repeat to add more, or paste several lines at once.
4. Click the folder button to choose where to save, then click **Download**.

For exhentai.org, open the sign-in panel and paste your session cookie. The steps are shown inside the app and written out in the [install guide](docs/install.md).

Only the Windows installer is published on Releases today. macOS and Linux can be built from source, see below.

## Architecture

```
 Svelte 5 UI  ──window.api──▶  preload  ──IPC──▶  main process
 (renderer)                                       ├─ ehentai.js  fetch + stream to disk
                                                  ├─ history.js  electron-settings
                                                  └─ updater.js  electron-updater
```

Electron, Svelte 5, Tailwind CSS 4, bundled with electron-vite and managed with Bun. Images are streamed straight to disk, never buffered in memory.

## Develop

You need [Bun](https://bun.sh) 1.3.

```bash
bun install --frozen-lockfile
bun run dev            # Electron with hot reload
bun run build          # bundle main, preload and renderer
bun run build:win      # Windows installer
bun run build:mac      # macOS dmg
bun run build:linux    # AppImage, snap, deb
```

There is no automated test suite yet. Before sending a change, run `bunx eslint src` and `bun run build`. Architecture notes live in [CLAUDE.md](CLAUDE.md), and the previous long README is kept in [docs/readme-legacy.md](docs/readme-legacy.md).

## Support the project

- ⭐ [Star on GitHub](https://github.com/dvgamerr-app/hentai-downloader)
- 🐞 [Report a bug or request a feature](https://github.com/dvgamerr-app/hentai-downloader/issues)
- 💬 [Join the Discord](https://discord.com/invite/QDccF497Mw)
- ❤️ [Sponsor on GitHub](https://github.com/sponsors/dvgamerr)

> A note from the app itself: do not browse the site in the same session while a download runs. It can make some images fail to load.

## License and disclaimer

[MIT](LICENSE). This project is not affiliated with e-hentai.org or exhentai.org. You are responsible for following their terms and the laws that apply to you.
