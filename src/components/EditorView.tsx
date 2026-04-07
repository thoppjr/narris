import { useEffect, useState } from "react";
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
  const commentPaneKey = useChapterStore.getState().activeChapterId || "";

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

  const handleAddComment = async (from: number, to: number, _selectedText: string) => {
    const chapterId = useChapterStore.getState().activeChapterId;
    if (!chapterId) return;
    const commentText = prompt("Add comment:", "");
    if (!commentText?.trim()) return;
    await createEditorComment(chapterId, projectId, commentText.trim(), project.author || "Author", commentColor, from, to);
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
        commentColor={commentColor}
        onAddComment={editorMode ? handleAddComment : undefined}
      />

      {/* Plot sidebar */}
      {showPlotSidebar && (
        <PlotSidebar projectId={projectId} onClose={() => setShowPlotSidebar(false)} />
      )}

      {/* Comment pane (shown in editor mode) */}
      {editorMode && (
        <CommentPane
          key={commentPaneKey}
          chapterId={commentPaneKey}
          projectId={projectId}
          authorName={project.author || "Author"}
          commentColor={commentColor}
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
