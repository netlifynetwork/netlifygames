# Netlify Games

A Windows-first desktop game store and launcher built with Electron, React, TypeScript and Vite.

## What's included
- Steam-inspired dark store with featured games, search and category browsing
- A dedicated detail page for every game
- My Library page for collecting games
- **Downloads page** with live progress, pause, resume, cancel, completed-file opening and download-folder selection
- Electron secure preload bridge (context isolation enabled)
- Windows NSIS installer configuration
- GitHub Actions workflow that builds a Windows installer and uploads it as an artifact

## Run locally
```bash
npm install
npm run dev
```

## Build the Windows installer
```bash
npm run dist
```
The installer is generated in `release/`. GitHub Actions also runs this build on pushes and pull requests to `main`; download the resulting installer from the workflow run's Artifacts section.

## Enable a real game download
The catalogue entries are sample/demo listings and do not include third-party game installers. To enable a download, add a legitimate HTTPS package URL and filename to the game entry in `src/catalog.ts`:

```ts
downloadUrl: "https://your-domain.example/game-installer.exe",
filename: "game-installer.exe"
```

Only distribute game builds you own or are authorized to distribute. Paid checkout, account sign-in, ownership verification, full game installation/launch management, cloud saves and auto-updates are not implemented yet. Purchase prices are currently catalogue UI only and no payments are taken.

## Current limitations
- The Downloads page is implemented, but a game without a configured `downloadUrl` displays an explanatory message rather than downloading a fake file.
- Actual downloads require the Electron desktop app; the browser preview is for browsing the store, library and game details.
- The sample catalogue is not a live commercial store and game art/text are demonstration content.
