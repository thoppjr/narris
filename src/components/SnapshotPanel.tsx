import { useState, useEffect } from "react";
import * as cmd from "../lib/commands";
import type { ChapterSnapshot } from "../lib/commands";
import { useChapterStore } from "../stores/chapterStore";

interface SnapshotPanelProps {
  chapterId: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SnapshotPanel({ chapterId, projectId, isOpen, onClose }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<ChapterSnapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const chapter = useChapterStore((s) => s.chapters.find((c) => c.id === chapterId));
  const updateContent = useChapterStore((s) => s.updateContent);

  useEffect(() => {
    if (isOpen && chapterId) {
      cmd.listSnapshots(chapterId).then(setSnapshots);
    }
  }, [isOpen, chapterId]);

  if (!isOpen || !chapter) return null;

  const handleCreate = async () => {
    const name = snapshotName.trim() || new Date().toLocaleString();
    const wordCount = chapter.content ? chapter.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length : 0;
    const snap = await cmd.createSnapshot(chapterId, projectId, name, chapter.content, wordCount);
    setSnapshots((prev) => [snap, ...prev]);
    setSnapshotName("");
  };

  const handleRevert = async (snap: ChapterSnapshot) => {
    if (!confirm(`Revert "${chapter.title}" to snapshot "${snap.name}"? This will replace the current content.`)) return;
    await updateContent(chapterId, snap.content, snap.word_count);
    onClose();
  };

  const handleDelete = async (id: string) => {
    await cmd.deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (previewId === id) setPreviewId(null);
  };

  const previewSnap = previewId ? snapshots.find((s) => s.id === previewId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg w-[640px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-sand-200 dark:border-stone-700">
          <h3 className="text-sm font-semibold text-stone-700 dark:text-sand-200">
            Snapshots — {chapter.title}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink dark:hover:text-sand-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create snapshot */}
        <div className="px-5 py-3 border-b border-sand-200 dark:border-stone-700 flex gap-2">
          <input
            type="text"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Snapshot name (optional)..."
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-sand-50 dark:bg-stone-700 border border-sand-200 dark:border-stone-600 text-stone-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm rounded-lg bg-sage-600 text-white font-medium hover:bg-sage-700 transition-colors"
          >
            Save Snapshot
          </button>
        </div>

        {/* Snapshot list or preview */}
        <div className="flex-1 overflow-y-auto">
          {previewSnap ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-stone-700 dark:text-sand-200">{previewSnap.name}</div>
                  <div className="text-xs text-ink-muted dark:text-sand-400">
                    {previewSnap.word_count} words — {new Date(previewSnap.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewId(null)} className="px-3 py-1.5 text-xs rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors">
                    Back
                  </button>
                  <button onClick={() => handleRevert(previewSnap)} className="px-3 py-1.5 text-xs rounded-lg bg-clay-600 text-white font-medium hover:bg-clay-700 transition-colors">
                    Revert to This
                  </button>
                </div>
              </div>
              <div
                className="prose prose-sm max-w-none text-stone-700 dark:text-sand-200 bg-sand-50 dark:bg-stone-700 rounded-lg p-4 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: previewSnap.content }}
              />
            </div>
          ) : (
            <div className="divide-y divide-sand-200 dark:divide-stone-700">
              {snapshots.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-muted dark:text-sand-400">
                  No snapshots yet. Save one to create a restore point.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div key={snap.id} className="group flex items-center justify-between px-5 py-3 hover:bg-sand-50 dark:hover:bg-stone-750 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-stone-700 dark:text-sand-200 truncate">{snap.name}</div>
                      <div className="text-xs text-ink-muted dark:text-sand-400">
                        {snap.word_count} words — {new Date(snap.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewId(snap.id)} className="px-2 py-1 text-xs rounded bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 transition-colors">
                        Preview
                      </button>
                      <button onClick={() => handleRevert(snap)} className="px-2 py-1 text-xs rounded bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-200 hover:bg-sage-200 transition-colors">
                        Revert
                      </button>
                      <button onClick={() => handleDelete(snap.id)} className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
