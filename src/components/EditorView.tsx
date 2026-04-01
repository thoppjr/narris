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

  useEffect(() => {
    const init = async () => {
      try {
        await loadChapters(projectId);
        const currentChapters = useChapterStore.getState().chapters;
        if (currentChapters.length === 0) {
          await createChapter(projectId, "Chapter 1");
        }
      } catch (err) {
        console.error("Failed to load chapters:", err);
      }

      try {
        await loadFormatting(projectId);
      } catch (err) {
        console.error("Failed to load formatting:", err);
      }
    };

    init();

    return () => {
      clear();
      clearFormatting();
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!project) return null;

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
