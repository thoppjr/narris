import { useEffect, useState } from "react";
import { useFormattingStore } from "../stores/formattingStore";
import { BOOK_TEMPLATES } from "../lib/commands";
import type { FormattingSettings } from "../lib/commands";

interface FormatPanelProps {
  projectId: string;
  onClose: () => void;
}

const FONT_OPTIONS = [
  "Georgia",
  "Garamond",
  "Palatino",
  "Baskerville",
  "Times New Roman",
  "Bookman",
  "Cambria",
  "Libre Baskerville",
  "Merriweather",
  "Lora",
  "Crimson Text",
  "EB Garamond",
];

const HEADING_FONT_OPTIONS = [
  "sans-serif",
  "Georgia",
  "Garamond",
  "Palatino",
  "Baskerville",
  "Helvetica",
  "Arial",
  "Futura",
  "Gill Sans",
  "Optima",
];

const SCENE_BREAK_OPTIONS = [
  { value: "asterisks", label: "* * *" },
  { value: "flourish", label: "Flourish (❧)" },
  { value: "line", label: "Horizontal Line" },
  { value: "dots", label: "• • •" },
  { value: "blank", label: "Blank Space" },
  { value: "custom", label: "Custom Image" },
];

const LEAD_IN_OPTIONS = [
  { value: "none", label: "None" },
  { value: "small-caps", label: "Small Caps" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
];

export default function FormatPanel({ projectId, onClose }: FormatPanelProps) {
  const { settings, loadSettings, saveSettings, applyTemplate } = useFormattingStore();
  const [activeTab, setActiveTab] = useState<"templates" | "typography" | "layout" | "ornaments">("templates");

  useEffect(() => {
    loadSettings(projectId);
  }, [projectId, loadSettings]);

  if (!settings) return null;

  const updateField = <K extends keyof FormattingSettings>(key: K, value: FormattingSettings[K]) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
        activeTab === tab
          ? "bg-sage-600 text-white"
          : "bg-sand-100 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-200 dark:hover:bg-stone-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      {/* Header */}
      <div className="px-6 py-4 border-b border-sand-200 dark:border-stone-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800 dark:text-sand-200">Book Formatting</h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-sm rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 dark:hover:bg-stone-600 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-sand-200 dark:border-stone-700 flex gap-2">
        {tabBtn("templates", "Templates")}
        {tabBtn("typography", "Typography")}
        {tabBtn("layout", "Layout")}
        {tabBtn("ornaments", "Ornaments")}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "templates" && (
          <TemplatesTab
            currentTemplate={settings.template_name}
            onApply={(template) => applyTemplate(projectId, template)}
          />
        )}
        {activeTab === "typography" && (
          <TypographyTab settings={settings} updateField={updateField} />
        )}
        {activeTab === "layout" && (
          <LayoutTab settings={settings} updateField={updateField} />
        )}
        {activeTab === "ornaments" && (
          <OrnamentsTab settings={settings} updateField={updateField} />
        )}
      </div>
    </div>
  );
}

function TemplatesTab({ currentTemplate, onApply }: {
  currentTemplate: string;
  onApply: (template: (typeof BOOK_TEMPLATES)[0]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted dark:text-sand-400 mb-4">
        Choose a template to set typography, spacing, and ornamental styles. You can customize individual settings after applying.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {BOOK_TEMPLATES.map((template) => (
          <button
            key={template.name}
            onClick={() => onApply(template)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              currentTemplate === template.name
                ? "border-sage-500 bg-sage-50 dark:bg-sage-900/30"
                : "border-sand-200 dark:border-stone-700 hover:border-sage-300 dark:hover:border-sage-600"
            }`}
          >
            <div className="font-medium text-sm text-stone-800 dark:text-sand-200">{template.label}</div>
            <div className="text-xs text-ink-muted dark:text-sand-400 mt-1">{template.description}</div>
            <div className="text-xs text-ink-muted dark:text-sand-500 mt-2">
              {template.bodyFont} · {template.bodySizePt}pt · {template.lineHeight}× leading
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypographyTab({ settings, updateField }: {
  settings: FormattingSettings;
  updateField: <K extends keyof FormattingSettings>(key: K, value: FormattingSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <FieldGroup label="Body Font">
        <select
          value={settings.body_font}
          onChange={(e) => updateField("body_font", e.target.value)}
          className="input-field"
          style={{ fontFamily: settings.body_font }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </FieldGroup>

      <FieldGroup label="Heading Font">
        <select
          value={settings.heading_font}
          onChange={(e) => updateField("heading_font", e.target.value)}
          className="input-field"
          style={{ fontFamily: settings.heading_font }}
        >
          {HEADING_FONT_OPTIONS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Body Size (pt)">
          <input
            type="number"
            value={settings.body_size_pt}
            onChange={(e) => updateField("body_size_pt", parseFloat(e.target.value) || 11)}
            step={0.5}
            min={8}
            max={18}
            className="input-field"
          />
        </FieldGroup>
        <FieldGroup label="Heading Size (pt)">
          <input
            type="number"
            value={settings.heading_size_pt}
            onChange={(e) => updateField("heading_size_pt", parseFloat(e.target.value) || 18)}
            step={0.5}
            min={12}
            max={36}
            className="input-field"
          />
        </FieldGroup>
      </div>

      <FieldGroup label={`Line Height: ${settings.line_height}`}>
        <input
          type="range"
          value={settings.line_height}
          onChange={(e) => updateField("line_height", parseFloat(e.target.value))}
          step={0.05}
          min={1.2}
          max={2.2}
          className="w-full accent-sage-600"
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Paragraph Indent (em)">
          <input
            type="number"
            value={settings.paragraph_indent_em}
            onChange={(e) => updateField("paragraph_indent_em", parseFloat(e.target.value) || 0)}
            step={0.25}
            min={0}
            max={4}
            className="input-field"
          />
        </FieldGroup>
        <FieldGroup label="Paragraph Spacing (em)">
          <input
            type="number"
            value={settings.paragraph_spacing_em}
            onChange={(e) => updateField("paragraph_spacing_em", parseFloat(e.target.value) || 0)}
            step={0.25}
            min={0}
            max={3}
            className="input-field"
          />
        </FieldGroup>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.justify_text}
          onChange={(e) => updateField("justify_text", e.target.checked)}
          className="accent-sage-600 w-4 h-4"
        />
        <span className="text-sm text-stone-700 dark:text-sand-300">Justify text</span>
      </label>

      {/* Preview */}
      <div className="mt-6 p-6 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700">
        <div className="text-xs text-ink-muted dark:text-sand-400 mb-3">Preview</div>
        <h3
          style={{
            fontFamily: settings.heading_font,
            fontSize: `${settings.heading_size_pt}pt`,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "0.75em",
          }}
        >
          Chapter One
        </h3>
        <p
          style={{
            fontFamily: settings.body_font,
            fontSize: `${settings.body_size_pt}pt`,
            lineHeight: settings.line_height,
            textIndent: `${settings.paragraph_indent_em}em`,
            textAlign: settings.justify_text ? "justify" : "left",
            marginBottom: `${settings.paragraph_spacing_em}em`,
          }}
        >
          The morning sun cast long shadows across the cobblestone street as she stepped
          outside, the cool air carrying the scent of fresh bread from the bakery
          two doors down. She pulled her coat tighter and began walking.
        </p>
        <p
          style={{
            fontFamily: settings.body_font,
            fontSize: `${settings.body_size_pt}pt`,
            lineHeight: settings.line_height,
            textIndent: `${settings.paragraph_indent_em}em`,
            textAlign: settings.justify_text ? "justify" : "left",
          }}
        >
          It was the kind of day that promised nothing and everything at once,
          the kind of day when the world felt both impossibly large and
          intimately small.
        </p>
      </div>
    </div>
  );
}

function LayoutTab({ settings, updateField }: {
  settings: FormattingSettings;
  updateField: <K extends keyof FormattingSettings>(key: K, value: FormattingSettings[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-muted dark:text-sand-400">
        Page margins for PDF export. Inner margin is the gutter (binding side).
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Top Margin (in)">
          <input
            type="number"
            value={settings.margin_top_in}
            onChange={(e) => updateField("margin_top_in", parseFloat(e.target.value) || 0.75)}
            step={0.125}
            min={0.25}
            max={2}
            className="input-field"
          />
        </FieldGroup>
        <FieldGroup label="Bottom Margin (in)">
          <input
            type="number"
            value={settings.margin_bottom_in}
            onChange={(e) => updateField("margin_bottom_in", parseFloat(e.target.value) || 0.75)}
            step={0.125}
            min={0.25}
            max={2}
            className="input-field"
          />
        </FieldGroup>
        <FieldGroup label="Inner Margin (in)">
          <input
            type="number"
            value={settings.margin_inner_in}
            onChange={(e) => updateField("margin_inner_in", parseFloat(e.target.value) || 0.875)}
            step={0.125}
            min={0.25}
            max={2}
            className="input-field"
          />
        </FieldGroup>
        <FieldGroup label="Outer Margin (in)">
          <input
            type="number"
            value={settings.margin_outer_in}
            onChange={(e) => updateField("margin_outer_in", parseFloat(e.target.value) || 0.625)}
            step={0.125}
            min={0.25}
            max={2}
            className="input-field"
          />
        </FieldGroup>
      </div>

      {/* Margin diagram */}
      <div className="flex justify-center mt-4">
        <div className="relative w-48 h-64 border-2 border-stone-400 dark:border-stone-500 rounded bg-white dark:bg-stone-800">
          <div
            className="absolute bg-sand-100 dark:bg-stone-700 border border-dashed border-sand-400 dark:border-stone-500"
            style={{
              top: `${(settings.margin_top_in / 2) * 100}%`,
              bottom: `${(settings.margin_bottom_in / 2) * 100}%`,
              left: `${(settings.margin_inner_in / 2) * 100}%`,
              right: `${(settings.margin_outer_in / 2) * 100}%`,
            }}
          >
            <div className="h-full flex flex-col justify-center px-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-1 bg-sand-300 dark:bg-stone-500 rounded mb-1.5" />
              ))}
            </div>
          </div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-ink-muted dark:text-sand-400">
            {settings.margin_top_in}&quot;
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-ink-muted dark:text-sand-400">
            {settings.margin_bottom_in}&quot;
          </div>
          <div className="absolute top-1/2 -left-8 -translate-y-1/2 text-[10px] text-ink-muted dark:text-sand-400">
            {settings.margin_inner_in}&quot;
          </div>
          <div className="absolute top-1/2 -right-8 -translate-y-1/2 text-[10px] text-ink-muted dark:text-sand-400">
            {settings.margin_outer_in}&quot;
          </div>
        </div>
      </div>
    </div>
  );
}

function OrnamentsTab({ settings, updateField }: {
  settings: FormattingSettings;
  updateField: <K extends keyof FormattingSettings>(key: K, value: FormattingSettings[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Drop Caps */}
      <div>
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-3">Drop Caps</h3>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={settings.drop_cap_enabled}
            onChange={(e) => updateField("drop_cap_enabled", e.target.checked)}
            className="accent-sage-600 w-4 h-4"
          />
          <span className="text-sm text-stone-700 dark:text-sand-300">Enable drop caps on chapter starts</span>
        </label>
        {settings.drop_cap_enabled && (
          <FieldGroup label={`Drop cap size: ${settings.drop_cap_lines} lines`}>
            <input
              type="range"
              value={settings.drop_cap_lines}
              onChange={(e) => updateField("drop_cap_lines", parseInt(e.target.value))}
              min={2}
              max={5}
              className="w-full accent-sage-600"
            />
          </FieldGroup>
        )}
        {settings.drop_cap_enabled && (
          <div className="mt-3 p-4 bg-white dark:bg-stone-800 rounded-lg border border-sand-200 dark:border-stone-700">
            <p style={{ fontFamily: settings.body_font, fontSize: `${settings.body_size_pt}pt`, lineHeight: settings.line_height }}>
              <span style={{ float: "left", fontSize: `${settings.drop_cap_lines}em`, lineHeight: 0.8, paddingRight: "0.08em", fontWeight: "bold" }}>T</span>
              he morning sun cast long shadows across the cobblestone street as she stepped outside, the cool air carrying the faint scent of fresh bread from the bakery.
            </p>
          </div>
        )}
      </div>

      {/* Lead-ins */}
      <div>
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-3">Lead-in Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {LEAD_IN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField("lead_in_style", opt.value)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                settings.lead_in_style === opt.value
                  ? "border-sage-500 bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300"
                  : "border-sand-200 dark:border-stone-700 text-stone-600 dark:text-sand-400 hover:border-sage-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {settings.lead_in_style !== "none" && (
          <FieldGroup label={`Lead-in words: ${settings.lead_in_words}`}>
            <input
              type="range"
              value={settings.lead_in_words}
              onChange={(e) => updateField("lead_in_words", parseInt(e.target.value))}
              min={1}
              max={8}
              className="w-full accent-sage-600 mt-2"
            />
          </FieldGroup>
        )}
      </div>

      {/* Scene Breaks */}
      <div>
        <h3 className="text-sm font-medium text-stone-800 dark:text-sand-200 mb-3">Scene Breaks</h3>
        <div className="space-y-2">
          {SCENE_BREAK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateField("scene_break_style", opt.value)}
              className={`w-full px-4 py-3 text-sm rounded-lg border-2 transition-colors text-center ${
                settings.scene_break_style === opt.value
                  ? "border-sage-500 bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300"
                  : "border-sand-200 dark:border-stone-700 text-stone-600 dark:text-sand-400 hover:border-sage-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {settings.scene_break_style === "custom" && (
            <div className="mt-3 space-y-2">
              {settings.scene_break_custom && settings.scene_break_custom.startsWith("data:image") ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={settings.scene_break_custom} alt="Custom break" className="max-h-12 max-w-full" />
                  <button
                    onClick={() => updateField("scene_break_custom", "")}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/svg+xml,image/png,image/jpeg,image/gif";
                    input.onchange = () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        updateField("scene_break_custom", reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                  className="w-full px-4 py-2 text-sm rounded-lg border-2 border-dashed border-sand-300 dark:border-stone-600 text-ink-muted hover:border-sage-400 transition-colors"
                >
                  Upload SVG or PNG ornament...
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 dark:text-sand-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
