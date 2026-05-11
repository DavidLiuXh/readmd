# ReadMD

A beautiful local Markdown file reader Chrome extension — with directory tree, split view, dark/light mode, syntax highlighting, KaTeX math, and Mermaid diagrams.

---

## Features

- 📁 Browse local directories and read `.md` files without any server
- 🌲 Recursive directory tree with collapsible folders and filename search
- 🔗 Click `.md` links in content to navigate between files
- ⬅ ➡ Back / forward navigation history (Alt+← / Alt+→)
- 🌓 Light / dark theme with system preference detection
- 🌐 Chinese / English UI with auto browser language detection
- ⬜ Split-screen mode to compare two files side by side
- 💻 Syntax highlighting via highlight.js
- 📐 Math formulas via KaTeX
- 🔀 Flowcharts and diagrams via Mermaid
- 📂 One-click open from local directory pages (`file:///path/to/dir/`)
- 🕒 Recent directories with one-click permission restore

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| State | Zustand |
| Markdown | marked + marked-highlight + marked-katex-extension |
| Code highlight | highlight.js |
| Math | KaTeX |
| Diagrams | Mermaid |
| Local DB | idb (IndexedDB) |
| Styles | CSS Modules + CSS Variables |
| Extension | Chrome Manifest V3 |

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- Google Chrome (or any Chromium-based browser)

---

## Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start dev server

```bash
npm run dev
```

This starts Vite's dev server at `http://localhost:5173`. The page hot-reloads on file changes, useful for styling and logic development.

> Note: Chrome extension APIs (`chrome.storage`, `chrome.tabs`, etc.) are not available in the dev server. For full extension functionality, use the build + load workflow below.

### 3. Type check

```bash
npx tsc --noEmit
```

---

## Build

```bash
npm run build
```

Output is in the `dist/` directory. This is the directory you load into Chrome as an unpacked extension.

---

## Local Testing in Chrome

1. Run `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `dist/` folder
5. Click the ReadMD icon in the toolbar — a new tab opens with the reader

**After making code changes:**

1. Run `npm run build` again
2. Go to `chrome://extensions/`
3. Click the **refresh** icon on the ReadMD card
4. Reload the reader tab

---

## Two Ways to Open Files

### Method 1 — Open Folder button (File System Access API)

Click the **📂 Open Folder** button inside the extension and select any directory containing `.md` files.

> macOS restriction: some system-protected directories (e.g. `~` root) may be blocked by the browser. Use a subdirectory like `~/Documents/notes` instead.

### Method 2 — Local directory page (recommended, no permission issues)

1. In Chrome's address bar, type a local directory path, e.g.:
   ```
   file:///Users/yourname/Documents/notes/
   ```
2. Chrome shows the directory listing — a **📖 ReadMD (N files)** button appears at the bottom right
3. Click it to open the reader with all `.md` files loaded automatically

This method bypasses all macOS/Chrome permission restrictions.

---

## Packaging for Distribution

To create a `.zip` for uploading to the Chrome Web Store:

```bash
npm run build
cd dist && zip -r ../readmd-extension.zip . && cd ..
```

Then upload `readmd-extension.zip` on the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Regenerating Icons

Icon source is `icon-source.svg`. To regenerate all PNG sizes after editing:

```bash
node -e "
const sharp = require('sharp')
const fs = require('fs')
const svg = fs.readFileSync('icon-source.svg')
const sizes = [16, 32, 48, 96, 128]
Promise.all(sizes.map(size =>
  sharp(svg).resize(size, size).png().toFile('public/icons/icon' + size + '.png')
)).then(() => console.log('done'))
"
npm run build
```

---

## Project Structure

```
readmd/
├── public/
│   ├── manifest.json        # Chrome MV3 config
│   ├── background.js        # Service worker: open reader tab
│   ├── content.js           # Injected into file:// directory pages
│   └── icons/               # Extension icons (16/32/48/96/128px)
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root layout: ActivityBar + FilePanel + MarkdownViewer
│   ├── App.module.css       # CSS variables (light/dark themes)
│   ├── types.ts             # Shared TypeScript types
│   ├── store/               # Zustand global state
│   ├── db/                  # IndexedDB wrapper (idb)
│   ├── i18n/                # zh / en locale strings
│   ├── hooks/
│   │   ├── useFileSystem.ts # File System Access API + directory URL mode
│   │   └── useTheme.ts      # Theme + locale init and toggle
│   ├── lib/
│   │   ├── markdown.ts      # marked + hljs + KaTeX pipeline
│   │   └── imageResolver.ts # Resolve relative image paths to blob URLs
│   └── components/
│       ├── ActivityBar/     # Left icon bar (files / search / recent)
│       ├── FilePanel/       # Collapsible file tree panel
│       └── MarkdownViewer/  # Content renderer with toolbar
├── icon-source.svg          # Master icon (edit this, then regenerate PNGs)
├── reader.html              # Extension page HTML entry
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## License

MIT
