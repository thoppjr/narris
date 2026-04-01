import { useEffect, useState } from "react";
import * as cmd from "../lib/commands";
import type { MasterPage } from "../lib/commands";
import { useChapterStore } from "../stores/chapterStore";

interface MasterPagesProps {
  projectId: string;
  onClose: () => void;
}

const PAGE_TYPES = [
  { value: "about_author", label: "About the Author" },
  { value: "also_by", label: "Also By" },
  { value: "title_page", label: "Title Page" },
  { value: "copyright", label: "Copyright" },
  { value: "dedication", label: "Dedication" },
  { value: "acknowledgments", label: "Acknowledgments" },
  { value: "custom", label: "Custom" },
];

export default function MasterPages({ projectId, onClose }: MasterPagesProps) {
  const [pages, setPages] = useState<MasterPage[]>([]);
  const [selected, setSelected] = useState<MasterPage | null>(null);
  const [name, setName] = useState("");
  const [pageType, setPageType] = useState("custom");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const createSection = useChapterStore((s) => s.createSection);

  useEffect(() => {
    cmd.listMasterPages().then(setPages).catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setMessage("Please enter a page name");
      return;
    }
    try {
      const page = await cmd.createMasterPage(name.trim(), pageType, content, "{}");
      setPages([...pages, page]);
      setName("");
      setContent("");
      setMessage(`Master page "${page.name}" created`);
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await cmd.updateMasterPage(selected.id, name.trim() || selected.name, content, selected.settings_json);
      setPages(pages.map((p) => p.id === selected.id ? { ...p, name: name.trim() || p.name, content } : p));
      setEditing(false);
      setSelected(null);
      setMessage("Master page updated");
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cmd.deleteMasterPage(id);
      setPages(pages.filter((p) => p.id !== id));
      if (selected?.id === id) { setSelected(null); setEditing(false); }
      setMessage("Master page deleted");
    } catch (err) {
      setMessage(`Error: ${err}`);
    }
  };

  const handleInsert = async (page: MasterPage) => {
    try {
      await createSection(projectId, page.name, page.content, page.page_type);
      setMessage(`Inserted "${page.name}" into project`);
    } catch (err) {
      setMessage(`Error inserting: ${err}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-sand-50 dark:bg-stone-900">
      <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h1 className="text-lg font-medium text-stone-800 dark:text-sand-100">Master Pages</h1>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 text-sm transition-colors">
          Back to Editor
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        {message && (
          <div className={`px-4 py-2.5 rounded-lg text-sm ${
            message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-sage-50 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300"
          }`}>
            {message}
          </div>
        )}

        {/* Create new master page */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">
            {editing ? "Edit Master Page" : "Create Master Page"}
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Page name..."
              className="w-full input-field"
            />
            {!editing && (
              <select
                value={pageType}
                onChange={(e) => setPageType(e.target.value)}
                className="w-full input-field"
              >
                {PAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="HTML content..."
              rows={6}
              className="w-full input-field font-mono text-xs"
            />
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setEditing(false); setSelected(null); setName(""); setContent(""); }}
                    className="px-4 py-2 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 text-sm hover:bg-sand-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium hover:bg-sage-700 transition-colors"
                >
                  Create Master Page
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page gallery */}
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-sand-200 mb-3">
            Saved Master Pages ({pages.length})
          </h2>
          {pages.length === 0 ? (
            <p className="text-sm text-ink-muted dark:text-sand-400">
              No master pages yet. Create a reusable page layout above.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pages.map((page) => (
                <div key={page.id} className="border border-sand-200 dark:border-stone-700 rounded-lg p-4 hover:bg-sand-50 dark:hover:bg-stone-700 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-stone-700 dark:text-sand-200">{page.name}</div>
                      <div className="text-xs text-ink-muted dark:text-sand-400">
                        {PAGE_TYPES.find((t) => t.value === page.page_type)?.label || page.page_type}
                      </div>
                    </div>
                  </div>
                  {/* Preview */}
                  <div
                    className="text-xs text-stone-500 dark:text-sand-400 line-clamp-3 mb-3 prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: page.content.substring(0, 200) }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleInsert(page)}
                      className="px-2.5 py-1 rounded text-xs bg-sage-600 text-white hover:bg-sage-700 transition-colors"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => {
                        setSelected(page);
                        setName(page.name);
                        setContent(page.content);
                        setEditing(true);
                      }}
                      className="px-2.5 py-1 rounded text-xs bg-sand-200 dark:bg-stone-600 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
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
