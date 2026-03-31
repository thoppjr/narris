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
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormattingSettings {
  id: string;
  project_id: string;
  template_name: string;
  body_font: string;
  heading_font: string;
  body_size_pt: number;
  heading_size_pt: number;
  line_height: number;
  paragraph_spacing_em: number;
  paragraph_indent_em: number;
  margin_top_in: number;
  margin_bottom_in: number;
  margin_inner_in: number;
  margin_outer_in: number;
  drop_cap_enabled: boolean;
  drop_cap_lines: number;
  lead_in_style: string;
  lead_in_words: number;
  scene_break_style: string;
  scene_break_custom: string;
  justify_text: boolean;
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

export function createSection(
  projectId: string,
  title: string,
  content: string,
  sortOrder: number,
  sectionType: string,
  parentId: string | null,
): Promise<Chapter> {
  return invoke("create_section", { projectId, title, content, sortOrder, sectionType, parentId });
}

export function updateSectionType(id: string, sectionType: string): Promise<void> {
  return invoke("update_section_type", { id, sectionType });
}

export function updateChapterParent(id: string, parentId: string | null): Promise<void> {
  return invoke("update_chapter_parent", { id, parentId });
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

// --- Formatting Settings ---

export function getFormattingSettings(projectId: string): Promise<FormattingSettings | null> {
  return invoke("get_formatting_settings", { projectId });
}

export function saveFormattingSettings(settings: FormattingSettings): Promise<void> {
  return invoke("save_formatting_settings", { settings });
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

// --- Templates ---

export interface BookTemplate {
  name: string;
  label: string;
  description: string;
  bodyFont: string;
  headingFont: string;
  bodySizePt: number;
  headingSizePt: number;
  lineHeight: number;
  paragraphSpacingEm: number;
  paragraphIndentEm: number;
  dropCapEnabled: boolean;
  dropCapLines: number;
  leadInStyle: string;
  leadInWords: number;
  sceneBreakStyle: string;
  justifyText: boolean;
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    name: "romance",
    label: "Romance",
    description: "Elegant and readable with gentle serif typography",
    bodyFont: "Georgia",
    headingFont: "Georgia",
    bodySizePt: 11,
    headingSizePt: 18,
    lineHeight: 1.7,
    paragraphSpacingEm: 0,
    paragraphIndentEm: 1.5,
    dropCapEnabled: true,
    dropCapLines: 3,
    leadInStyle: "italic",
    leadInWords: 3,
    sceneBreakStyle: "flourish",
    justifyText: true,
  },
  {
    name: "thriller",
    label: "Thriller",
    description: "Clean and fast-paced, minimal ornamentation",
    bodyFont: "Palatino",
    headingFont: "Helvetica",
    bodySizePt: 11,
    headingSizePt: 16,
    lineHeight: 1.5,
    paragraphSpacingEm: 0,
    paragraphIndentEm: 1.5,
    dropCapEnabled: false,
    dropCapLines: 3,
    leadInStyle: "bold",
    leadInWords: 3,
    sceneBreakStyle: "blank",
    justifyText: true,
  },
  {
    name: "fantasy",
    label: "Fantasy / Sci-Fi",
    description: "Immersive with ornamental breaks and drop caps",
    bodyFont: "Garamond",
    headingFont: "Garamond",
    bodySizePt: 11,
    headingSizePt: 20,
    lineHeight: 1.6,
    paragraphSpacingEm: 0,
    paragraphIndentEm: 1.5,
    dropCapEnabled: true,
    dropCapLines: 4,
    leadInStyle: "small-caps",
    leadInWords: 4,
    sceneBreakStyle: "flourish",
    justifyText: true,
  },
  {
    name: "literary",
    label: "Literary Fiction",
    description: "Refined and classic with generous spacing",
    bodyFont: "Baskerville",
    headingFont: "Baskerville",
    bodySizePt: 11.5,
    headingSizePt: 18,
    lineHeight: 1.7,
    paragraphSpacingEm: 0,
    paragraphIndentEm: 2,
    dropCapEnabled: true,
    dropCapLines: 3,
    leadInStyle: "small-caps",
    leadInWords: 3,
    sceneBreakStyle: "asterisks",
    justifyText: true,
  },
  {
    name: "nonfiction",
    label: "Non-Fiction",
    description: "Professional layout with clear headings and block paragraphs",
    bodyFont: "Georgia",
    headingFont: "Helvetica",
    bodySizePt: 11,
    headingSizePt: 16,
    lineHeight: 1.6,
    paragraphSpacingEm: 0.5,
    paragraphIndentEm: 0,
    dropCapEnabled: false,
    dropCapLines: 3,
    leadInStyle: "none",
    leadInWords: 0,
    sceneBreakStyle: "line",
    justifyText: true,
  },
  {
    name: "poetry",
    label: "Poetry",
    description: "Centered, airy layout with generous margins",
    bodyFont: "Georgia",
    headingFont: "Georgia",
    bodySizePt: 12,
    headingSizePt: 16,
    lineHeight: 1.8,
    paragraphSpacingEm: 1,
    paragraphIndentEm: 0,
    dropCapEnabled: false,
    dropCapLines: 3,
    leadInStyle: "none",
    leadInWords: 0,
    sceneBreakStyle: "blank",
    justifyText: false,
  },
];

// --- Section Types ---

export const FRONT_MATTER_TYPES = [
  { type: "title_page", label: "Title Page", defaultContent: "" },
  { type: "copyright", label: "Copyright", defaultContent: "<p>Copyright &copy; [Year] [Author Name]</p><p>All rights reserved.</p>" },
  { type: "dedication", label: "Dedication", defaultContent: "<p><em>For...</em></p>" },
  { type: "epigraph", label: "Epigraph", defaultContent: "<blockquote><p>Quote here...</p></blockquote><p>— Attribution</p>" },
  { type: "foreword", label: "Foreword", defaultContent: "" },
  { type: "preface", label: "Preface", defaultContent: "" },
];

export const BACK_MATTER_TYPES = [
  { type: "about_author", label: "About the Author", defaultContent: "<p>Author bio goes here...</p>" },
  { type: "also_by", label: "Also By", defaultContent: "<p>Other books by the author...</p>" },
  { type: "acknowledgments", label: "Acknowledgments", defaultContent: "" },
  { type: "appendix", label: "Appendix", defaultContent: "" },
  { type: "glossary", label: "Glossary", defaultContent: "" },
];
