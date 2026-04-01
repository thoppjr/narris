import { create } from "zustand";
import type { FormattingSettings, BookTemplate } from "../lib/commands";
import * as cmd from "../lib/commands";

interface FormattingStore {
  settings: FormattingSettings | null;
  loading: boolean;

  loadSettings: (projectId: string) => Promise<void>;
  saveSettings: (settings: FormattingSettings) => Promise<void>;
  applyTemplate: (projectId: string, template: BookTemplate) => Promise<void>;
  clear: () => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

export const DEFAULT_SETTINGS: Omit<FormattingSettings, "id" | "project_id"> = {
  template_name: "default",
  body_font: "Georgia",
  heading_font: "sans-serif",
  body_size_pt: 11,
  heading_size_pt: 18,
  line_height: 1.6,
  paragraph_spacing_em: 0,
  paragraph_indent_em: 1.5,
  margin_top_in: 0.75,
  margin_bottom_in: 0.75,
  margin_inner_in: 0.875,
  margin_outer_in: 0.625,
  drop_cap_enabled: false,
  drop_cap_lines: 3,
  lead_in_style: "none",
  lead_in_words: 3,
  scene_break_style: "asterisks",
  scene_break_custom: "",
  justify_text: true,
};

export const useFormattingStore = create<FormattingStore>((set, get) => ({
  settings: null,
  loading: false,

  loadSettings: async (projectId: string) => {
    set({ loading: true });
    try {
      const settings = await cmd.getFormattingSettings(projectId);
      if (settings) {
        set({ settings, loading: false });
      } else {
        // Create default settings for this project
        const defaults: FormattingSettings = {
          id: generateId(),
          project_id: projectId,
          ...DEFAULT_SETTINGS,
        };
        try {
          await cmd.saveFormattingSettings(defaults);
        } catch (saveErr) {
          console.error("Failed to save default formatting:", saveErr);
        }
        set({ settings: defaults, loading: false });
      }
    } catch (err) {
      console.error("Failed to load formatting settings:", err);
      set({ loading: false });
    }
  },

  saveSettings: async (settings: FormattingSettings) => {
    await cmd.saveFormattingSettings(settings);
    set({ settings });
  },

  applyTemplate: async (projectId: string, template: BookTemplate) => {
    const current = get().settings;
    const updated: FormattingSettings = {
      id: current?.id ?? generateId(),
      project_id: projectId,
      template_name: template.name,
      body_font: template.bodyFont,
      heading_font: template.headingFont,
      body_size_pt: template.bodySizePt,
      heading_size_pt: template.headingSizePt,
      line_height: template.lineHeight,
      paragraph_spacing_em: template.paragraphSpacingEm,
      paragraph_indent_em: template.paragraphIndentEm,
      margin_top_in: current?.margin_top_in ?? 0.75,
      margin_bottom_in: current?.margin_bottom_in ?? 0.75,
      margin_inner_in: current?.margin_inner_in ?? 0.875,
      margin_outer_in: current?.margin_outer_in ?? 0.625,
      drop_cap_enabled: template.dropCapEnabled,
      drop_cap_lines: template.dropCapLines,
      lead_in_style: template.leadInStyle,
      lead_in_words: template.leadInWords,
      scene_break_style: template.sceneBreakStyle,
      scene_break_custom: "",
      justify_text: template.justifyText,
    };
    await cmd.saveFormattingSettings(updated);
    set({ settings: updated });
  },

  clear: () => {
    set({ settings: null });
  },
}));
