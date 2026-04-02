import { useState, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import * as cmd from "../lib/commands";

interface ProjectSettingsProps {
  projectId: string;
  onClose: () => void;
}

export default function ProjectSettings({ projectId, onClose }: ProjectSettingsProps) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const refreshProjects = useProjectStore((s) => s.loadProjects);

  const [isbn, setIsbn] = useState(project?.isbn || "");
  const [copyrightYear, setCopyrightYear] = useState(project?.copyright_year || new Date().getFullYear().toString());
  const [publisher, setPublisher] = useState(project?.publisher || "");
  const [bleedEnabled, setBleedEnabled] = useState(project?.bleed_enabled || false);
  const [bleedSize, setBleedSize] = useState(project?.bleed_size_in || 0.125);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setIsbn(project.isbn || "");
      setCopyrightYear(project.copyright_year || new Date().getFullYear().toString());
      setPublisher(project.publisher || "");
      setBleedEnabled(project.bleed_enabled || false);
      setBleedSize(project.bleed_size_in || 0.125);
    }
  }, [project]);

  const handleSave = async () => {
    await cmd.updateProjectMetadata(projectId, isbn, copyrightYear, publisher, bleedEnabled, bleedSize);
    await refreshProjects();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink dark:hover:text-sand-200 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-sm font-medium text-stone-800 dark:text-sand-200">Project Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-sage-600 dark:text-sage-400">Saved</span>}
          <button onClick={handleSave} className="px-4 py-1.5 text-sm rounded-lg bg-sage-600 text-white font-medium hover:bg-sage-700 transition-colors">
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-8">
          {/* Front Matter Metadata */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-4 uppercase tracking-wider">Front Matter Metadata</h3>
            <p className="text-xs text-ink-muted dark:text-sand-400 mb-4">
              These fields auto-populate your Title Page, Copyright page, and other front matter sections.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted dark:text-sand-400 mb-1">ISBN</label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-0-000-00000-0"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted dark:text-sand-400 mb-1">Copyright Year</label>
                <input
                  type="text"
                  value={copyrightYear}
                  onChange={(e) => setCopyrightYear(e.target.value)}
                  placeholder="2026"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted dark:text-sand-400 mb-1">Publisher</label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="Self-published / Publisher name"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                />
              </div>
            </div>
          </section>

          {/* Bleed Management */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-4 uppercase tracking-wider">Bleed Settings</h3>
            <p className="text-xs text-ink-muted dark:text-sand-400 mb-4">
              Enable bleed for print exports. KDP recommends 0.125" bleed; IngramSpark may require different sizes.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bleedEnabled}
                  onChange={(e) => setBleedEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-sand-300 text-sage-600 focus:ring-sage-300"
                />
                <span className="text-sm text-stone-700 dark:text-sand-200">Enable bleed for print exports</span>
              </label>
              {bleedEnabled && (
                <div>
                  <label className="block text-xs font-medium text-ink-muted dark:text-sand-400 mb-1">Bleed Size (inches)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={bleedSize}
                      onChange={(e) => setBleedSize(parseFloat(e.target.value) || 0)}
                      step={0.0625}
                      min={0}
                      max={0.5}
                      className="w-32 px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-800 border border-sand-200 dark:border-stone-700 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => setBleedSize(0.125)} className={`px-2 py-1 text-xs rounded ${bleedSize === 0.125 ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}>
                        KDP (0.125")
                      </button>
                      <button onClick={() => setBleedSize(0.0625)} className={`px-2 py-1 text-xs rounded ${bleedSize === 0.0625 ? "bg-sage-600 text-white" : "bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300"}`}>
                        Ingram (0.0625")
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Auto Front Matter Preview */}
          <section>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-4 uppercase tracking-wider">Auto-Generated Front Matter Preview</h3>
            <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-6 space-y-4">
              <div className="text-center">
                <div className="text-xl font-light text-stone-800 dark:text-sand-100 mb-2">{project.title}</div>
                {project.author && <div className="text-sm text-ink-muted dark:text-sand-400">by {project.author}</div>}
              </div>
              <hr className="border-sand-200 dark:border-stone-700" />
              <div className="text-xs text-ink-muted dark:text-sand-400 space-y-1">
                <p>Copyright &copy; {copyrightYear || "____"} {project.author || "Author Name"}</p>
                <p>All rights reserved.</p>
                {isbn && <p>ISBN: {isbn}</p>}
                {publisher && <p>Published by {publisher}</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
