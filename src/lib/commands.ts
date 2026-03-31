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

export function splitChapter(
  id: string,
  newTitle: string,
  originalContent: string,
  originalWordCount: number,
  newContent: string,
  newWordCount: number
): Promise<Chapter> {
  return invoke("split_chapter", { id, newTitle, originalContent, originalWordCount, newContent, newWordCount });
}

export function mergeChapters(
  keepId: string,
  removeId: string,
  mergedContent: string,
  mergedWordCount: number
): Promise<void> {
  return invoke("merge_chapters", { keepId, removeId, mergedContent, mergedWordCount });
}

// --- Plot Points ---

export interface PlotPoint {
  id: string;
  project_id: string;
  title: string;
  description: string;
  color: string;
  pos_x: number;
  pos_y: number;
}

export interface PlotConnection {
  id: string;
  project_id: string;
  source_id: string;
  target_id: string;
}

export function createPlotPoint(projectId: string, title: string, posX: number, posY: number): Promise<PlotPoint> {
  return invoke("create_plot_point", { projectId, title, posX, posY });
}

export function listPlotPoints(projectId: string): Promise<PlotPoint[]> {
  return invoke("list_plot_points", { projectId });
}

export function updatePlotPoint(id: string, title: string, description: string, color: string, posX: number, posY: number): Promise<void> {
  return invoke("update_plot_point", { id, title, description, color, posX, posY });
}

export function deletePlotPoint(id: string): Promise<void> {
  return invoke("delete_plot_point", { id });
}

export function createPlotConnection(projectId: string, sourceId: string, targetId: string): Promise<PlotConnection> {
  return invoke("create_plot_connection", { projectId, sourceId, targetId });
}

export function listPlotConnections(projectId: string): Promise<PlotConnection[]> {
  return invoke("list_plot_connections", { projectId });
}

export function deletePlotConnection(id: string): Promise<void> {
  return invoke("delete_plot_connection", { id });
}

// --- Characters ---

export interface Character {
  id: string;
  project_id: string;
  name: string;
  fields: string; // JSON string
}

export function createCharacter(projectId: string, name: string): Promise<Character> {
  return invoke("create_character", { projectId, name });
}

export function listCharacters(projectId: string): Promise<Character[]> {
  return invoke("list_characters", { projectId });
}

export function updateCharacter(id: string, name: string, fields: string): Promise<void> {
  return invoke("update_character", { id, name, fields });
}

export function deleteCharacter(id: string): Promise<void> {
  return invoke("delete_character", { id });
}

// --- Backup ---

export function exportProject(projectId: string): Promise<unknown> {
  return invoke("export_project", { projectId });
}

export function importProject(data: unknown): Promise<Project> {
  return invoke("import_project", { data });
}

// --- Export ---

export function exportEpub(projectId: string, outputPath: string): Promise<void> {
  return invoke("export_epub", { projectId, outputPath });
}

export function exportPdf(projectId: string, outputPath: string, trimSize: string): Promise<void> {
  return invoke("export_pdf", { projectId, outputPath, trimSize });
}
