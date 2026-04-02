# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

narras is an all-in-one writing and formatting desktop app for indie authors. See `PRD.md` for the full product requirements document.

**Target platforms:** Linux (Debian/Ubuntu, ChromeOS Linux), x86_64 and arm64.

## Tech Stack

- **App shell:** Tauri 2.x (Rust backend + webview frontend)
- **Frontend:** React + TypeScript
- **Editor:** TipTap (ProseMirror-based)
- **State management:** Zustand
- **Local database:** SQLite via rusqlite (bundled)
- **Styling:** Tailwind CSS v4

## Build Commands

```bash
npm install                    # Install frontend dependencies
npm run dev                    # Start Vite dev server only
npm run build                  # TypeScript check + Vite production build
npx tauri dev                  # Full Tauri dev mode (frontend + Rust backend)
npx tauri build                # Production build (outputs .deb, .rpm, .AppImage)
npx tsc --noEmit               # TypeScript type check only
cd src-tauri && cargo check    # Rust type check only
```

### System Dependencies (Linux)

```bash
apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

## Architecture

```
narras/
├── src/                        # React + TypeScript frontend
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Root component (routes between ProjectSpace and EditorView)
│   ├── index.css               # Tailwind + Japandi theme (custom colors, editor styles)
│   ├── lib/commands.ts         # Typed wrappers around Tauri invoke() calls
│   ├── stores/                 # Zustand state management
│   │   ├── projectStore.ts     # Project CRUD + current project
│   │   └── chapterStore.ts     # Chapter CRUD, reordering, active chapter
│   └── components/
│       ├── ProjectSpace.tsx    # Project dashboard (create/open/delete)
│       ├── EditorView.tsx      # Main editing layout (sidebar + editor)
│       ├── Sidebar.tsx         # Drag-and-drop chapter list (@dnd-kit)
│       └── Editor.tsx          # TipTap rich text editor + toolbar
├── src-tauri/                  # Rust backend
│   ├── src/main.rs             # Binary entry point
│   ├── src/lib.rs              # Tauri commands (project/chapter CRUD)
│   ├── src/db.rs               # SQLite database layer (rusqlite)
│   └── tauri.conf.json         # Tauri configuration
└── PRD.md                      # Full product requirements
```

### Data Flow

Frontend components use Zustand stores, which call typed command wrappers in `lib/commands.ts`. These wrappers call `invoke()` to execute Rust `#[tauri::command]` functions in `lib.rs`, which use the `Database` struct in `db.rs` to read/write SQLite.

### Database

SQLite database stored at `~/.local/share/narras/narras.db` with two tables: `projects` and `chapters`. The `chapters` table has a `sort_order` column for drag-and-drop reordering and stores editor content as HTML.

## Design Principles

- **Japandi UI style:** Minimal, organic, rounded corners, muted earthy colors, generous whitespace
- **Offline-first:** All core features must work without internet
- **Local-first data:** SQLite database, no cloud dependency
- **Small footprint:** Target <100MB binary, <2s startup, <300MB RAM for 100k-word manuscripts
