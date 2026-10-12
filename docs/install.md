# Install guide

## Requirements

- Windows 10 or newer for the published installer. macOS and Linux builds are produced from source (see below).
- Internet access to e-hentai.org, and a browser session on exhentai.org if you want that site.

## Install

1. Download `hentai-downloader-<version>-setup.exe` from the [latest release](https://github.com/dvgamerr-app/hentai-downloader/releases/latest).
2. Run it. It installs per user and creates a desktop shortcut.

## Updates

Installed builds check GitHub Releases on start, download a newer version in the background and ask whether to restart. If you choose Later, it is installed when you quit. Running with `bun run dev` never checks for updates.

## Sign in to exhentai.org

exhentai.org needs three cookies from your own browser session: `igneous`, `ipb_member_id` and `ipb_pass_hash`.

1. Sign in to exhentai.org in your browser.
2. Press `F12`, open **Console**, type `copy(document.cookie)` and press Enter.
3. In the app, open the sign-in panel and paste (`Ctrl+V`) into the cookie field.

The cookies are stored locally by `electron-settings` and are only sent to the site you are downloading from. Submitting the form with an empty cookie field signs you out and removes them. Without `igneous`, exhentai requests fail with `Please join your browser session.`

## Build from source

You need [Bun](https://bun.sh) 1.3.

```bash
bun install --frozen-lockfile
bun run build:win      # Windows installer
bun run build:mac      # macOS dmg
bun run build:linux    # AppImage, snap, deb
```

Installers are written to `dist/`.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Please join your browser session.` | exhentai needs the `igneous` cookie. Sign in again and paste a fresh cookie. |
| Some images are missing after a run | The site rejected a request, often because you browsed it at the same time. Delete the broken files and press Download again: existing pages are skipped. |
| `fetch failed` with a code such as `ECONNREFUSED` | A network or proxy problem on your side. The code after the message is the underlying cause. |
| A link is rejected | Use a full gallery link from `e-hentai.org` or `exhentai.org`, shaped like `/g/<id>/<token>/`. |
| Logs | The app writes `YYYY-MM-DD.log` and `YYYY-MM-DD-error.log` files. Attach the error log when you open an issue. |
