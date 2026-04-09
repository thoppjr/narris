import { useEffect, useState, useRef, useCallback } from "react";
import { save } from "@tauri-apps/plugin-dialog";
import Sidebar from "./Sidebar";
import Editor from "./Editor";
import PlotCanvas from "./PlotCanvas";
import CharacterSheets from "./CharacterSheets";
import ExportDialog from "./ExportDialog";
import FormatPanel from "./FormatPanel";
import WritingHabits from "./WritingHabits";
import DevicePreviewer from "./DevicePreviewer";
import ThemeBuilder from "./ThemeBuilder";
import MasterPages from "./MasterPages";
import ImageManager from "./ImageManager";
import ProjectSettings from "./ProjectSettings";
import SnapshotPanel from "./SnapshotPanel";
import CoverEditor from "./CoverEditor";
import PlotSidebar from "./PlotSidebar";
import CommentPane from "./CommentPane";
import { useChapterStore } from "../stores/chapterStore";
import { useProjectStore } from "../stores/projectStore";
import { useFormattingStore } from "../stores/formattingStore";
import { updateProject, exportProjectFile, createEditorComment } from "../lib/commands";
import type { EditorComment } from "../lib/commands";

type View = "editor" | "plot" | "characters" | "formatting" | "habits" | "preview" | "themes" | "master-pages" | "images" | "settings" | "cover";

interface EditorViewProps {
  projectId: string;
  onBack: () => void;
}

export default function EditorView({ projectId, onBack }: EditorViewProps) {
  const { loadChapters, createChapter, clear } = useChapterStore();
  const clearFormatting = useFormattingStore((s) => s.clear);
  const loadFormatting = useFormattingStore((s) => s.loadSettings);
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const [view, setView] = useState<View>("editor");
  const [showExport, setShowExport] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [ready, setReady] = useState(false);
  const [showPlotSidebar, setShowPlotSidebar] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [spellcheck, setSpellcheck] = useState(false);
  const [commentColor, setCommentColor] = useState("#f59e0b");
  const [showEditorModePanel, setShowEditorModePanel] = useState(false);
  const activeChapterId = useChapterStore((s) => s.activeChapterId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    const init = async () => {
      try {
        await loadChapters(projectId);
        if (cancelled) return;
        const currentChapters = useChapterStore.getState().chapters;
        if (currentChapters.length === 0) {
          await createChapter(projectId, "Chapter 1");
        }
      } catch (err) {
        console.error("Failed to load chapters:", err);
      }

      if (cancelled) return;

      try {
        await loadFormatting(projectId);
      } catch (err) {
        console.error("Failed to load formatting:", err);
      }

      if (!cancelled) {
        setReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      clear();
      clearFormatting();
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditorReady = useCallback((editor: unknown) => {
    editorRef.current = editor;
  }, []);

  const removeHighlight = useCallback((commentId: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      editor.chain().focus().removeCommentHighlightById(commentId).run();
    } catch {
      // Mark might not exist in current content
    }
  }, []);

  if (!project) return null;

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-sand-50 dark:bg-stone-900">
        <div className="text-center">
          <div className="text-lg text-stone-600 dark:text-sand-300 mb-1">Opening project...</div>
          <div className="text-sm text-ink-muted dark:text-sand-400">{project.title}</div>
        </div>
      </div>
    );
  }

  if (view === "plot") {
    return <PlotCanvas projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "characters") {
    return <CharacterSheets projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "formatting") {
    return <FormatPanel projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "habits") {
    return <WritingHabits projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "preview") {
    return <DevicePreviewer projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "themes") {
    return <ThemeBuilder onClose={() => setView("editor")} />;
  }

  if (view === "master-pages") {
    return <MasterPages projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "images") {
    return <ImageManager projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "settings") {
    return <ProjectSettings projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "cover") {
    const chapters = useChapterStore.getState().chapters;
    const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
    const pageCount = Math.max(24, Math.ceil(totalWords / 250)); // KDP minimum 24 pages
    return (
      <CoverEditor
        projectId={projectId}
        projectTitle={project.title}
        authorName={project.author}
        pageCount={pageCount}
        trimWidth={5.5}
        trimHeight={8.5}
        onClose={() => setView("editor")}
      />
    );
  }

  const handleSaveShare = async () => {
    const path = await save({
      defaultPath: `${project.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}.narras`,
      filters: [{ name: "Narras Project", extensions: ["narras"] }],
    });
    if (path) {
      try {
        await exportProjectFile(projectId, path);
        alert(`Project saved to ${path}`);
      } catch (err) {
        alert(`Export failed: ${err}`);
      }
    }
  };

  const handleAddComment = async (from: number, to: number, selectedText: string) => {
    const chapterId = useChapterStore.getState().activeChapterId;
    if (!chapterId) return;
    const commentText = prompt("Add comment:", "");
    if (!commentText?.trim()) return;
    const comment = await createEditorComment(chapterId, projectId, commentText.trim(), project.author || "Author", commentColor, from, to, "comment", selectedText);
    // Add highlight mark to editor
    const editor = editorRef.current;
    if (editor) {
      editor.chain().focus()
        .setTextSelection({ from, to })
        .setCommentHighlight({ commentId: comment.id, color: commentColor + "40" })
        .run();
    }
  };

  const handleResolveComment = (comment: EditorComment) => {
    removeHighlight(comment.id);
  };

  const handleDeleteComment = (comment: EditorComment) => {
    removeHighlight(comment.id);
  };

  const handleAcceptSuggestion = (comment: EditorComment) => {
    // The suggested new text is in comment.content, the original is in comment.suggested_text
    // The text is already in the editor (it was typed as a suggestion), so we just remove the highlight
    removeHighlight(comment.id);
  };

  const handleRejectSuggestion = (comment: EditorComment) => {
    // Revert the text: replace the current content at the position with the original text
    const editor = editorRef.current;
    if (!editor) {
      removeHighlight(comment.id);
      return;
    }

    // Find the mark in the document and replace the text under it with original
    const { doc } = editor.state;
    const markType = editor.state.schema.marks.commentHighlight;
    if (!markType) {
      removeHighlight(comment.id);
      return;
    }

    let markFrom = -1;
    let markTo = -1;
    doc.descendants((node: { marks: Array<{ type: unknown; attrs: { commentId: string } }>; nodeSize: number }, pos: number) => {
      node.marks.forEach((mark: { type: unknown; attrs: { commentId: string } }) => {
        if (mark.type === markType && mark.attrs.commentId === comment.id) {
          if (markFrom === -1) markFrom = pos;
          markTo = pos + node.nodeSize;
        }
      });
    });

    if (markFrom >= 0 && markTo >= 0 && comment.suggested_text) {
      // Replace with original text and remove highlight
      editor.chain().focus()
        .setTextSelection({ from: markFrom, to: markTo })
        .insertContent(comment.suggested_text)
        .removeCommentHighlightById(comment.id)
        .run();
    } else {
      removeHighlight(comment.id);
    }
  };

  const handleOneTimeSpellcheck = () => {
    // Enable spellcheck temporarily, then let user review
    setSpellcheck(true);
    // Auto-disable after 30 seconds so it's a "one-time check"
    setTimeout(() => setSpellcheck(false), 30000);
  };

  return (
    <div className="h-screen flex">
      <Sidebar
        projectTitle={project.title}
        onBack={() => {
          clear();
          clearFormatting();
          onBack();
        }}
        onShowPlot={() => setView("plot")}
        onShowCharacters={() => setView("characters")}
        onExport={() => setShowExport(true)}
        onShowFormatting={() => setView("formatting")}
        onShowHabits={() => setView("habits")}
        onShowPreview={() => setView("preview")}
        onShowThemes={() => setView("themes")}
        onShowMasterPages={() => setView("master-pages")}
        onShowImages={() => setView("images")}
        onShowSettings={() => setView("settings")}
        onShowSnapshots={() => setShowSnapshots(true)}
        onShowCover={() => setView("cover")}
        onTitleChange={async (newTitle: string) => {
          await updateProject(projectId, newTitle, project.author, project.genre);
          useProjectStore.getState().loadProjects();
        }}
        editorMode={editorMode}
        onToggleEditorMode={() => {
          setEditorMode((v) => !v);
          setShowEditorModePanel((v) => !v);
        }}
        showPlotSidebar={showPlotSidebar}
        onTogglePlotSidebar={() => setShowPlotSidebar((v) => !v)}
        onSaveShare={handleSaveShare}
      />

      {/* Editor mode settings panel */}
      {showEditorModePanel && editorMode && (
        <div className="w-56 border-r border-sand-200 dark:border-stone-700 bg-sand-50 dark:bg-stone-900 p-3 space-y-3">
          <h3 className="text-xs font-semibold text-stone-700 dark:text-sand-300 uppercase tracking-wider">Editor Mode</h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-sand-300">
              <input type="checkbox" checked={spellcheck} onChange={() => setSpellcheck((v) => !v)} className="rounded" />
              Real-time spellcheck
            </label>
          </div>

          <button
            onClick={handleOneTimeSpellcheck}
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 font-medium hover:bg-sage-200 dark:hover:bg-sage-900/50 transition-colors"
          >
            {spellcheck ? "Spellcheck active (30s)" : "One-time Spell Check"}
          </button>

          <div>
            <label className="block text-[10px] font-medium text-ink-muted dark:text-sand-400 uppercase tracking-wider mb-1">Comment Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCommentColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${commentColor === c ? "border-stone-800 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-sand-200 dark:border-stone-700 text-[10px] text-ink-muted dark:text-sand-400">
            Select text in the editor and click the comment button to annotate. Comments appear in the right pane.
          </div>
        </div>
      )}

      <Editor
        editorMode={editorMode}
        spellcheck={spellcheck}
        onAddComment={editorMode ? handleAddComment : undefined}
        onEditorReady={handleEditorReady}
      />

      {/* Plot sidebar */}
      {showPlotSidebar && (
        <PlotSidebar projectId={projectId} onClose={() => setShowPlotSidebar(false)} />
      )}

      {/* Comment pane (shown in editor mode) */}
      {editorMode && (
        <CommentPane
          key={activeChapterId || ""}
          chapterId={activeChapterId || ""}
          projectId={projectId}
          authorName={project.author || "Author"}
          commentColor={commentColor}
          onResolveComment={handleResolveComment}
          onDeleteComment={handleDeleteComment}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
        />
      )}

      <ExportDialog
        projectId={projectId}
        projectTitle={project.title}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />
      <SnapshotPanel
        chapterId={useChapterStore.getState().activeChapterId || ""}
        projectId={projectId}
        isOpen={showSnapshots}
        onClose={() => setShowSnapshots(false)}
      />
    </div>
  );
}
