import { create } from "zustand";
import type { WritingGoal, DailyLog } from "../lib/commands";
import * as cmd from "../lib/commands";

interface GoalsStore {
  goal: WritingGoal | null;
  logs: DailyLog[];
  loading: boolean;

  loadGoal: (projectId: string) => Promise<void>;
  saveGoal: (goal: WritingGoal) => Promise<void>;
  deleteGoal: (projectId: string) => Promise<void>;
  loadLogs: (projectId: string) => Promise<void>;
  logWords: (projectId: string, date: string, wordCount: number, wordsWritten: number, minutesActive: number) => Promise<void>;
  clear: () => void;
}

export const useGoalsStore = create<GoalsStore>((set) => ({
  goal: null,
  logs: [],
  loading: false,

  loadGoal: async (projectId: string) => {
    const goal = await cmd.getWritingGoal(projectId);
    set({ goal });
  },

  saveGoal: async (goal: WritingGoal) => {
    await cmd.saveWritingGoal(goal);
    set({ goal });
  },

  deleteGoal: async (projectId: string) => {
    await cmd.deleteWritingGoal(projectId);
    set({ goal: null });
  },

  loadLogs: async (projectId: string) => {
    set({ loading: true });
    const logs = await cmd.listDailyLogs(projectId);
    set({ logs, loading: false });
  },

  logWords: async (projectId, date, wordCount, wordsWritten, minutesActive) => {
    const log = await cmd.logDailyWords(projectId, date, wordCount, wordsWritten, minutesActive);
    set((state) => {
      const existing = state.logs.findIndex((l) => l.date === date);
      if (existing >= 0) {
        const updated = [...state.logs];
        updated[existing] = log;
        return { logs: updated };
      }
      return { logs: [...state.logs, log] };
    });
  },

  clear: () => {
    set({ goal: null, logs: [] });
  },
}));
