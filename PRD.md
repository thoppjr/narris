# Narris — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-30
**Status:** Draft

---

## 1. Overview

**Narris** is an all-in-one writing, editing, and formatting application designed for indie authors to get their stories completed and published. It runs locally on Linux (including Chromebook Linux environments) and supports arm64 processors.

### 1.1 Mission

Give indie authors a single, beautiful tool that takes them from first draft to publish-ready export — no subscriptions, no cloud dependency, no excuses.

### 1.2 Target Users

- Self-published / indie fiction and non-fiction authors
- Small press editors and formatters
- Authors working on Chromebooks, Linux desktops, or ARM-based devices

### 1.3 Platform & Runtime Constraints

| Constraint | Detail |
|---|---|
| **Primary OS** | Linux (Debian/Ubuntu-based, including ChromeOS Linux container) |
| **Architecture** | Must run on both x86_64 and **arm64** |
| **Distribution** | Local-first desktop app (AppImage, Flatpak, or .deb) |
| **Offline** | Fully functional offline; cloud sync is optional |
| **Frameworks** | Tauri 2.x (Rust backend + webview frontend) recommended for small binary size and ARM support |

---

## 2. Feature Requirements

### 2.1 Writing & Editing Environment

#### 2.1.1 Rich Text Editor

- Clean, distraction-free word processor
- Supported formatting: **bold**, *italics*, headings (H2–H6), ordered/unordered lists, blockquotes, small caps, monospace
- Keyboard shortcuts for all formatting actions
- Undo/redo with full history

#### 2.1.2 Drag-and-Drop Sidebar

- Visual navigation panel listing all manuscript sections (chapters, scenes, front/back matter)
- Drag-and-drop reordering of any section
- Collapsible groups for Parts/Volumes
- Section status indicators (draft, revised, final)

#### 2.1.3 Front & Back Matter Management

- Auto-generated templates for:
  - Title Page
  - Copyright Page
  - Epigraph
  - Dedication
  - Table of Contents (auto-linked)
  - About the Author
  - Also By (bibliography)
- Specialized formatting per section type
- Ability to add/remove/reorder matter pages

#### 2.1.4 Parts & Volumes

- Group chapters into Parts or Volumes
- Part title pages with customizable styling
- Useful for epic fantasy, multi-act structures, and box sets

#### 2.1.5 Text Message Builder

- Unique tool for formatting dialogue as smartphone text message bubbles
- Left/right alignment for sender/receiver
- Customizable bubble colors and contact names
- Renders correctly in EPUB and PDF export

#### 2.1.6 Footnotes & Endnotes

- Inline footnote/endnote insertion
- Auto-numbering (per chapter or per book)
- Supports academic, non-fiction, and world-building use cases
- Renders as popups in EPUB; as traditional footnotes in PDF

#### 2.1.7 Find and Replace

- Standard find and replace across the entire manuscript or within a single chapter
- Regex support
- Case-sensitive and whole-word options

#### 2.1.8 Split & Merge Chapters

- Split a chapter at cursor position into two chapters
- Merge two adjacent chapters/scenes into one
- Preserves formatting during operations

#### 2.1.9 Smart Quotes

- Auto-conversion of straight quotes (`"` `'`) to curly/typographer quotes (`"` `"` `'` `'`)
- Consistency checker that flags mixed quote styles
- Toggle on/off per project

#### 2.1.10 Project Space

- Create, open, rename, and delete projects
- Project dashboard showing all projects with metadata (title, word count, last edited, status)
- Project-level settings (language, default template, genre)

#### 2.1.11 Plot Points (Infinity Canvas)

- Create key plot points as visual "cards"
- Drag, drop, and reposition cards on an infinity canvas (pannable, zoomable)
- Connect cards with directional arrows or lines to show narrative flow
- Color-code cards by act, storyline, or custom tags
- Cards can link to specific chapters/scenes in the manuscript

#### 2.1.12 Character Sheets

- Create in-depth character profiles per project
- Default fields: name, appearance, personality, motivations, backstory, relationships
- Custom fields: authors can add any variable they want to track
- Character image/avatar support
- Link characters to scenes where they appear

---

### 2.2 Formatting & Layout Engine

#### 2.2.1 Pre-built Templates

- 17+ professional, genre-specific layout templates
- Genres include (at minimum): Romance, Thriller, Sci-Fi, Fantasy, Literary Fiction, Horror, Mystery, Non-Fiction, Memoir, Children's, Young Adult, Poetry, Self-Help, Cookbook, Historical Fiction, Urban Fantasy, Cozy Mystery
- Each template defines: fonts, margins, heading styles, ornamental breaks, drop caps

#### 2.2.2 Custom Theme Builder

- Design unique chapter headings with custom fonts, sizes, alignments, and background images
- Save and reuse custom themes across projects
- Import/export theme files

#### 2.2.3 Typography Controls

- Access to 1,500+ fonts via bundled Google Fonts subset (offline-capable)
- Granular control over:
  - Font family, size, weight
  - Line height / leading
  - Paragraph spacing
  - Margins (per page, per section)
  - Text justification and alignment

#### 2.2.4 Drop Caps & Lead-ins

- Automated drop cap styling for the first letter of a chapter
- Lead-in styling (first N words in small caps, bold, or custom style)
- Configurable per template or per chapter

#### 2.2.5 Ornamental Breaks

- Scene break styling options: `***`, flourishes, custom uploaded images/glyphs
- Library of built-in ornamental break images
- Upload custom break images (SVG, PNG)

#### 2.2.6 Image Handling

- Inline images within text flow
- Full-page images
- Full-bleed images (extend to the edge of the printed page, no margins)
- Two-page image spreads (PDF only)
- Image caption support
- Automatic image compression for EPUB

#### 2.2.7 Master Pages

- Design a page layout once (e.g., "About the Author") and save to a gallery
- Insert saved master pages into any project
- Master page library stored locally, shared across projects

#### 2.2.8 Large Print Formatting

- One-click toggle to adjust fonts, sizing, and spacing for accessibility standards
- Minimum 16pt body text, increased leading, sans-serif option
- Applies to PDF export without modifying the source manuscript

---

### 2.3 Productivity & Goal Tracking

#### 2.3.1 Word Count Tracking

- Real-time word count for:
  - Current text selection
  - Current chapter/scene
  - Entire manuscript
- Character count and page estimate
- Word count displayed in the editor footer bar

#### 2.3.2 Goal Setting

- Set a total manuscript word count target
- Set a target completion deadline
- Visual progress bar

#### 2.3.3 Writing Habits

- Calculate required daily word count to hit deadline
- Track daily writing streaks
- Simple statistics dashboard: words per day, days active, streak length
- Historical word count chart

#### 2.3.4 Sprint Timer

- Built-in Pomodoro-style writing sprint timer
- Configurable sprint duration and break intervals
- Track words written during sprint
- Optional distraction-free mode during sprints (hides sidebar, menus)

---

### 2.4 Exporting & Publishing

#### 2.4.1 Device Previewer

- Live preview panel simulating the book on:
  - Print (trimmed page view)
  - iPad
  - Kindle Paperwhite
  - Kindle Oasis
  - Mobile phone (generic)
- Updates in real-time as the author edits

#### 2.4.2 Multi-Format Export

##### EPUB
- Valid EPUB 3.0 output
- Passes epubcheck validation
- Ready for: Kindle (KDP), Apple Books, Kobo, Draft2Digital, Smashwords
- Embedded fonts, images, and styles

##### PDF (Print-Ready)
- Formatted for paperback/hardcover printing
- Automatic trim size adjustments: 5×8, 5.25×8, 5.5×8.5, 6×9 (and custom)
- Bleed and margin settings per platform (KDP Print, IngramSpark)
- Embedded fonts, CMYK-aware color handling
- PDF/A compliance option

##### DOCX
- Clean Word-compatible export
- Preserves headings, basic formatting, and comments
- Suitable for sending to editors

#### 2.4.3 Box Set Creator

- Merge multiple separate Narris projects into a single EPUB or PDF
- Combined TOC generation
- Per-book title pages within the combined file
- Shared front/back matter options

---

### 2.5 Data, Syncing & Collaboration

#### 2.5.1 Auto-Save

- Continuous local auto-save (every few seconds on change)
- Never lose more than a few seconds of work

#### 2.5.2 Cloud Sync (Optional)

- Optional sync to a cloud backend (self-hosted or hosted)
- Conflict resolution for concurrent edits
- End-to-end encryption for synced data

#### 2.5.3 Offline Mode

- Full functionality without internet
- Changes queue and sync when connection is re-established

#### 2.5.4 Manual Backups

- Download a `.json` (or `.narris`) snapshot of the entire project
- Import snapshots to restore projects
- Export includes all text, settings, images, and metadata

#### 2.5.5 Collaboration Roles

- Multi-user support with role-based access:
  - **Owner**: Full control
  - **Co-writer**: Can edit manuscript content
  - **Editor**: Track Changes and Comments (suggest mode)
  - **Beta Reader**: Read-only access with ability to leave comments
- Invitations via link or email

---

### 2.6 Accessibility & UX

#### 2.6.1 Dark Mode

- Full dark UI theme
- Toggle between light and dark modes
- Respects system theme preference

#### 2.6.2 OpenDyslexic Font

- Available as an editor font option
- Available as an export font for the final book
- Bundled with the application (no download required)

#### 2.6.3 UI Theme: Simple / Japandi Style

- Minimal, clean, organic aesthetic
- Rounded corners and soft shapes
- Muted, earthy color palette (warm grays, soft whites, desaturated greens/blues)
- Generous whitespace
- Subtle shadows and natural textures
- Typography-forward design using clean sans-serif UI fonts

---

## 3. Technical Architecture (Recommended)

### 3.1 Stack

| Layer | Technology | Rationale |
|---|---|---|
| **App Shell** | Tauri 2.x | Small binary, native performance, ARM64 support, Linux-first |
| **Frontend** | React + TypeScript | Rich ecosystem, component model fits editor UI |
| **Editor** | TipTap (ProseMirror) | Extensible rich text editor, supports custom nodes for text bubbles, footnotes, etc. |
| **Canvas** | tldraw or reactflow | Infinity canvas for plot point cards |
| **State** | Zustand or Jotai | Lightweight, works well with React |
| **Local DB** | SQLite (via Tauri plugin) | Embedded, zero-config, ARM-compatible, fast |
| **PDF Engine** | typst or weasyprint | Rust-native (typst) or Python-based (weasyprint) PDF generation |
| **EPUB Gen** | Custom Rust module | Full control over EPUB 3.0 output |
| **Fonts** | Bundled Google Fonts subset | Offline-capable, 1,500+ fonts |
| **Styling** | Tailwind CSS | Utility-first, easy to build Japandi theme |

### 3.2 Project Data Model (High Level)

```
Project
├── metadata (title, author, genre, created, modified)
├── settings (template, typography, goals)
├── sections[]
│   ├── type (chapter | scene | front_matter | back_matter | part)
│   ├── title
│   ├── content (ProseMirror JSON)
│   ├── order (integer)
│   └── parent_id (for nesting under Parts)
├── characters[]
│   ├── name, avatar, fields[]
│   └── scene_links[]
├── plot_points[]
│   ├── title, description, color, position {x, y}
│   └── connections[] (to other plot_points or sections)
├── images[]
│   └── blob + metadata
├── goals
│   ├── target_word_count
│   ├── deadline
│   └── daily_logs[]
└── collaboration
    └── roles[]
```

### 3.3 File Format

- Projects stored locally as SQLite databases (one `.narris` file per project)
- Backup/export as JSON for portability
- Images stored as blobs within the database or in a companion directory

### 3.4 Build & Distribution

| Format | Target |
|---|---|
| `.deb` | Debian/Ubuntu, ChromeOS Linux |
| `AppImage` | Universal Linux |
| `Flatpak` | Sandboxed Linux |

- CI pipeline builds for both `x86_64` and `arm64`
- Minimum tested platforms: Ubuntu 22.04+, Debian 12+, ChromeOS Linux (Crostini)

---

## 4. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Startup time** | < 2 seconds on cold launch |
| **Editor responsiveness** | < 50ms input latency |
| **Binary size** | < 100 MB (including bundled fonts) |
| **Memory usage** | < 300 MB for a 100k-word manuscript |
| **Offline capability** | 100% core features work offline |
| **Accessibility** | WCAG 2.1 AA compliance for the UI |

---

## 5. Milestones (Suggested)

| Phase | Scope | Key Deliverables |
|---|---|---|
| **Phase 1 — Foundation** | Project scaffold, editor, sidebar, basic save/load | Tauri app shell, TipTap editor, chapter CRUD, drag-and-drop sidebar, project space, SQLite persistence |
| **Phase 2 — Formatting** | Templates, typography, front/back matter | Template system, Google Fonts integration, drop caps, ornamental breaks, front/back matter generators |
| **Phase 3 — Export** | EPUB, PDF, DOCX export | EPUB 3.0 generator, print-ready PDF, DOCX export, device previewer |
| **Phase 4 — Productivity** | Word count, goals, sprints | Word count tracker, goal setting, writing habits dashboard, sprint timer |
| **Phase 5 — Creative Tools** | Plot canvas, character sheets, text messages | Infinity canvas, character sheet system, text message builder, footnotes/endnotes |
| **Phase 6 — Polish** | Themes, accessibility, collaboration | Dark mode, Japandi theme, OpenDyslexic, large print, collaboration roles, cloud sync |

---

## 6. Open Questions

1. **Cloud provider**: Self-hosted sync (e.g., CouchDB/PocketBase) vs. managed service? Or defer cloud entirely to post-launch?
2. **Font bundling**: Bundle all 1,500 fonts (large binary) or download on-demand with a curated default set?
3. **Collaboration transport**: WebSocket-based real-time or async (pull-based) collaboration?
4. **Plugin/extension system**: Should Narris support third-party plugins in the future?
5. **Licensing model**: Open source, freemium, or one-time purchase?
6. **Mobile/tablet**: Future consideration for Android tablet (ARM) app via the same Tauri codebase?

---

*This is a living document. Update as decisions are made and scope evolves.*
