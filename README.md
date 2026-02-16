# Lendcraft

Track Magic: The Gathering card lending between friends. A mobile-first PWA with local-only storage and share codes for syncing — no server or accounts needed.

## Features

- **Event-sourced tracking** — every lend/return is an immutable event stored in IndexedDB
- **Scryfall integration** — card name autocomplete with image previews
- **Share codes** — compact encoded strings (QR or text) to sync events between friends
- **QR scanning** — scan a friend's code with your camera to import events
- **Deduplication** — importing the same event twice is a no-op
- **Offline-ready** — installable PWA with service worker caching
- **No server** — runs entirely in the browser, data stays on your device
- **JSON backup** — export/import your full event history

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

1. Set your display name on first launch
2. Record a loan — pick a card (Scryfall autocomplete), pick a friend, tap "Record Loan"
3. Share the generated QR code or text code with your friend so they have the same record
4. When a card comes back, tap "Return" on the dashboard — share that code too
5. Both sides stay in sync through share codes, no server required

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript (Vite) |
| Storage | Dexie.js (IndexedDB) |
| Encoding | pako (deflate) + base64url |
| QR | qrcode.react + html5-qrcode |
| Card data | Scryfall API |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | Tailwind CSS |

## Building for Production

```bash
npm run build
```

Output goes to `dist/` — deploy as static files anywhere (GitHub Pages, Netlify, etc.).
