import { useEffect, useState } from "react";
import * as cmd from "../lib/commands";
import type { CustomTheme, FormattingSettings } from "../lib/commands";
import { useFormattingStore, DEFAULT_SETTINGS } from "../stores/formattingStore";

interface ThemeBuilderProps {
  onClose: () => void;
}

export default function ThemeBuilder({ onClose }: ThemeBuilderProps) {
  const [themes, setThemes] = useState<CustomTheme[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<CustomTheme | null>(null);
  const [importing, setImporting] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const settings = useFormattingStore((s) => s.settings);
  const saveSettings = useFormattingStore((s) => s.saveSettings);

  useEffect(() => {
    cmd.listCustomThemes().then(setThemes).catch(console.error);
  }, []);

  const handleSaveAsTheme = async () => {
    if (!name.trim()) {
      setMessage("Please enter a theme name");
      return;
    }
    if (!settings) return;

    const { id: _id, project_id: _pid, ...settingsFields } = settings;
    const json = JSON.stringify(settingsFields);
    try {
      const theme = await cmd.createCustomTheme(name.trim(), description.trim(), json);
      setThemes([theme, ...themes]);
      setName("");
      setDescription("");
      setMessage(`Theme "${theme.name}" saved`);
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleApplyTheme = async (theme: CustomTheme) => {
    if (!settings) return;
    try {
      const parsed = JSON.parse(theme.settings_json);
      const updated: FormattingSettings = {
        id: settings.id,
        project_id: settings.project_id,
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
      await saveSettings(updated);
      setMessage(`Applied theme "${theme.name}"`);
    } catch (err) {
      setMessage(`Error applying theme: ${err}`);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    try {
      await cmd.deleteCustomTheme(id);
      setThemes(themes.filter((t) => t.id !== id));
      if (selectedTheme?.id === id) setSelectedTheme(null);
      setMessage("Theme deleted");
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleExport = (theme: CustomTheme) => {
    const data = JSON.stringify(theme, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, "-").toLowerCase()}.narris-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Theme exported");
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      const theme = await cmd.createCustomTheme(
        data.name || "Imported Theme",
        data.description || "",
        typeof data.settings_json === "string" ? data.settings_json : JSON.stringify(data.settings_json || {})
      );
      setThemes([theme, ...themes]);
      setImporting(false);
      setImportJson("");
      setMessage(`Imported theme "${theme.name}"`);
    } catch (err) {
      setMessage(`Error importing: ${err}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h1 className="text-lg font-medium text-stone-800 dark:text-sand-100">Custom Theme Builder</h1>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 text-sm transition-colors">
          Back to Editor
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {message && (
          <div className={`px-4 py-2.5 rounded-lg text-sm ${
            message.startsWith("Error") ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300"
          }`}>
            {message}
          </div>
        )}

        {/* Save current settings as theme */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">Save Current Settings as Theme</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Theme name..."
              className="w-full input-field"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full input-field"
            />
            <button
              onClick={handleSaveAsTheme}
              className="px-4 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
            >
              Save Theme
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200">Import / Export</h2>
            <button
              onClick={() => setImporting(!importing)}
              className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 text-xs hover:bg-sand-300 transition-colors"
            >
              {importing ? "Cancel" : "Import Theme"}
            </button>
          </div>
          {importing && (
            <div className="space-y-2">
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste theme JSON here..."
                rows={4}
                className="w-full input-field font-mono text-xs"
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
              >
                Import
              </button>
            </div>
          )}
        </div>

        {/* Theme list */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">
            Saved Themes ({themes.length})
          </h2>
          {themes.length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-sand-400">No custom themes yet. Save your current formatting settings as a theme to get started.</p>
          ) : (
            <div className="space-y-2">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedTheme?.id === theme.id
                      ? "border-sage-400 bg-sage-50 dark:bg-sage-900/20"
                      : "border-sand-200 dark:border-stone-700 hover:bg-sand-50 dark:hover:bg-stone-700"
                  }`}
                  onClick={() => setSelectedTheme(selectedTheme?.id === theme.id ? null : theme)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-700 dark:text-sand-200">{theme.name}</div>
                    {theme.description && (
                      <div className="text-xs text-ink-muted dark:text-sand-400 truncate">{theme.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApplyTheme(theme); }}
                      className="px-2.5 py-1 rounded text-xs bg-sage-600 text-white hover:bg-sage-700 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExport(theme); }}
                      className="px-2.5 py-1 rounded text-xs bg-sand-200 dark:bg-stone-600 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                      className="px-2.5 py-1 rounded text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
