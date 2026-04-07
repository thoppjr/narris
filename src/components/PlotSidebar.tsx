import { useEffect, useState } from "react";
import * as cmd from "../lib/commands";
import type { PlotPoint } from "../lib/commands";

interface PlotSidebarProps {
  projectId: string;
  onClose: () => void;
}

export default function PlotSidebar({ projectId, onClose }: PlotSidebarProps) {
  const [points, setPoints] = useState<PlotPoint[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const load = () => {
    cmd.listPlotPoints(projectId).then((pts) => {
      // Sort by vertical position (top to bottom on the canvas)
      setPoints([...pts].sort((a, b) => a.pos_y - b.pos_y));
    });
  };

  useEffect(() => { load(); }, [projectId]); // eslint-disable-line

  const toggleCompleted = async (p: PlotPoint) => {
    await cmd.togglePlotPointCompleted(p.id, !p.completed);
    load();
  };

  const startEdit = (p: PlotPoint) => {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditDesc(p.description);
  };

  const saveEdit = async (p: PlotPoint) => {
    await cmd.updatePlotPoint(p.id, editTitle, editDesc, p.color, p.pos_x, p.pos_y);
    setEditingId(null);
    load();
  };

  return (
    <div className="w-72 h-full border-l border-sand-200 dark:border-stone-700 bg-sand-50 dark:bg-stone-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sand-200 dark:border-stone-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800 dark:text-sand-200">Plot Points</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-sand-200 dark:hover:bg-stone-700 text-ink-muted transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Plot point cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {points.length === 0 && (
          <div className="text-center text-xs text-ink-muted dark:text-sand-400 py-8">
            No plot points yet. Add them in the Plot Points canvas.
          </div>
        )}

        {/* Vertical line connecting cards */}
        <div className="relative">
          {points.length > 1 && (
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-sand-300 dark:bg-stone-600 z-0" />
          )}

          <div className="relative z-10 space-y-2">
            {points.map((p, idx) => (
              <div key={p.id} className="flex gap-2 items-start">
                {/* Connector dot */}
                <div className="flex-shrink-0 mt-3 relative">
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white dark:border-stone-900"
                    style={{ backgroundColor: p.completed ? "#aaa" : p.color }}
                  />
                  {idx < points.length - 1 && (
                    <div className="absolute top-3 left-1.5 w-px bg-sand-300 dark:bg-stone-600" style={{ height: "calc(100% + 0.5rem)" }} />
                  )}
                </div>

                {/* Card */}
                <div
                  className={`flex-1 rounded-lg border p-3 transition-all ${
                    p.completed
                      ? "bg-sand-100 dark:bg-stone-800 border-sand-200 dark:border-stone-700 opacity-50"
                      : "bg-white dark:bg-stone-800 border-sand-200 dark:border-stone-700"
                  }`}
                  style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                >
                  {editingId === p.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-1 focus:ring-sage-300"
                        autoFocus
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1 text-xs rounded bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-1 focus:ring-sage-300 resize-none"
                        placeholder="Description..."
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(p)} className="px-2 py-1 text-xs rounded bg-sage-600 text-white hover:bg-sage-700">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs rounded bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleCompleted(p)}
                          className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            p.completed
                              ? "bg-sage-500 border-sage-500 text-white"
                              : "border-sand-400 dark:border-stone-500 hover:border-sage-400"
                          }`}
                        >
                          {p.completed && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${p.completed ? "line-through text-ink-muted" : "text-stone-800 dark:text-sand-200"}`}>
                            {p.title}
                          </div>
                          {p.description && (
                            <div className={`text-xs mt-0.5 ${p.completed ? "text-ink-muted/60" : "text-ink-muted dark:text-sand-400"}`}>
                              {p.description}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => startEdit(p)}
                          className="flex-shrink-0 p-0.5 rounded text-ink-muted hover:text-sage-600 hover:bg-sage-50 dark:hover:bg-sage-900/30"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-sand-200 dark:border-stone-700 text-[10px] text-ink-muted dark:text-sand-400 text-center">
        Ordered by canvas position (top to bottom)
      </div>
    </div>
  );
}
