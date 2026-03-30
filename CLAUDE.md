# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Narris is an all-in-one writing and formatting desktop app for indie authors. See `PRD.md` for the full product requirements document.

**Target platforms:** Linux (Debian/Ubuntu, ChromeOS Linux), x86_64 and arm64.

## Planned Tech Stack (per PRD)

- **App shell:** Tauri 2.x (Rust backend + webview frontend)
- **Frontend:** React + TypeScript
- **Editor:** TipTap (ProseMirror-based)
- **Canvas:** tldraw or reactflow (for plot point infinity canvas)
- **State management:** Zustand or Jotai
- **Local database:** SQLite via Tauri plugin
- **PDF generation:** typst or weasyprint
- **EPUB generation:** Custom Rust module
- **Styling:** Tailwind CSS

## Project Status

This project is in the pre-development phase. Only the PRD exists — no application code has been written yet. Phase 1 (Foundation) is the next milestone: Tauri app shell, TipTap editor, chapter CRUD, drag-and-drop sidebar, project space, and SQLite persistence.

## Design Principles

- **Japandi UI style:** Minimal, organic, rounded corners, muted earthy colors, generous whitespace
- **Offline-first:** All core features must work without internet
- **Local-first data:** Projects stored as SQLite databases (`.narris` files)
- **Small footprint:** Target <100MB binary, <2s startup, <300MB RAM for 100k-word manuscripts
