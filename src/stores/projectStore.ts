import { create } from "zustand";
import type { Project } from "../lib/commands";
import * as cmd from "../lib/commands";

interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;

  loadProjects: () => Promise<void>;
  createProject: (title: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProjectId: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    const projects = await cmd.listProjects();
    set({ projects, loading: false });
  },

  createProject: async (title: string) => {
    const project = await cmd.createProject(title);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  deleteProject: async (id: string) => {
    await cmd.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }));
  },

  setCurrentProject: (id: string | null) => {
    set({ currentProjectId: id });
  },
}));
