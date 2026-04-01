import { useEffect, useState } from "react";
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
import { useChapterStore } from "../stores/chapterStore";
import { useProjectStore } from "../stores/projectStore";
import { useFormattingStore } from "../stores/formattingStore";

type View = "editor" | "plot" | "characters" | "formatting" | "habits" | "preview" | "themes" | "master-pages" | "images";

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
  const [ready, setReady] = useState(false);

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
      />
      <Editor />
      <ExportDialog
        projectId={projectId}
        projectTitle={project.title}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />
    </div>
  );
}
