import { invoke } from "@tauri-apps/api/core";

export interface Project {
  id: string;
  title: string;
  author: string;
  genre: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  sort_order: number;
  chapter_type: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

// --- Project commands ---

export function createProject(title: string): Promise<Project> {
  return invoke("create_project", { title });
}

export function listProjects(): Promise<Project[]> {
  return invoke("list_projects");
}

export function updateProject(id: string, title: string, author: string, genre: string): Promise<void> {
  return invoke("update_project", { id, title, author, genre });
}

export function deleteProject(id: string): Promise<void> {
  return invoke("delete_project", { id });
}

// --- Chapter commands ---

export function createChapter(projectId: string, title: string, sortOrder: number): Promise<Chapter> {
  return invoke("create_chapter", { projectId, title, sortOrder });
}

export function listChapters(projectId: string): Promise<Chapter[]> {
  return invoke("list_chapters", { projectId });
}

export function updateChapterContent(id: string, content: string, wordCount: number): Promise<void> {
  return invoke("update_chapter_content", { id, content, wordCount });
}

export function updateChapterTitle(id: string, title: string): Promise<void> {
  return invoke("update_chapter_title", { id, title });
}

export function reorderChapters(chapterIds: string[]): Promise<void> {
  return invoke("reorder_chapters", { chapterIds });
}

export function deleteChapter(id: string): Promise<void> {
  return invoke("delete_chapter", { id });
}
