import { create } from "zustand";
import type { Chapter } from "../lib/commands";
import * as cmd from "../lib/commands";

interface ChapterStore {
  chapters: Chapter[];
  activeChapterId: string | null;
  loading: boolean;

  loadChapters: (projectId: string) => Promise<void>;
  createChapter: (projectId: string, title: string) => Promise<Chapter>;
  deleteChapter: (id: string) => Promise<void>;
  setActiveChapter: (id: string | null) => void;
  updateContent: (id: string, content: string, wordCount: number) => Promise<void>;
  updateTitle: (id: string, title: string) => Promise<void>;
  reorder: (chapterIds: string[]) => Promise<void>;
  clear: () => void;
}

export const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  activeChapterId: null,
  loading: false,

  loadChapters: async (projectId: string) => {
    set({ loading: true });
    const chapters = await cmd.listChapters(projectId);
    set({
      chapters,
      loading: false,
      activeChapterId: chapters.length > 0 ? chapters[0].id : null,
    });
  },

  createChapter: async (projectId: string, title: string) => {
    const sortOrder = get().chapters.length;
    const chapter = await cmd.createChapter(projectId, title, sortOrder);
    set((state) => ({
      chapters: [...state.chapters, chapter],
      activeChapterId: chapter.id,
    }));
    return chapter;
  },

  deleteChapter: async (id: string) => {
    await cmd.deleteChapter(id);
    set((state) => {
      const chapters = state.chapters.filter((c) => c.id !== id);
      return {
        chapters,
        activeChapterId:
          state.activeChapterId === id
            ? chapters.length > 0
              ? chapters[0].id
              : null
            : state.activeChapterId,
      };
    });
  },

  setActiveChapter: (id: string | null) => {
    set({ activeChapterId: id });
  },

  updateContent: async (id: string, content: string, wordCount: number) => {
    await cmd.updateChapterContent(id, content, wordCount);
    set((state) => ({
      chapters: state.chapters.map((c) =>
        c.id === id ? { ...c, content, word_count: wordCount } : c
      ),
    }));
  },

  updateTitle: async (id: string, title: string) => {
    await cmd.updateChapterTitle(id, title);
    set((state) => ({
      chapters: state.chapters.map((c) =>
        c.id === id ? { ...c, title } : c
      ),
    }));
  },

  reorder: async (chapterIds: string[]) => {
    await cmd.reorderChapters(chapterIds);
    set((state) => {
      const chapterMap = new Map(state.chapters.map((c) => [c.id, c]));
      const reordered = chapterIds
        .map((id, i) => {
          const ch = chapterMap.get(id);
          return ch ? { ...ch, sort_order: i } : null;
        })
        .filter((c): c is Chapter => c !== null);
      return { chapters: reordered };
    });
  },

  clear: () => {
    set({ chapters: [], activeChapterId: null });
  },
}));
