import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Editor from "./Editor";
import PlotCanvas from "./PlotCanvas";
import CharacterSheets from "./CharacterSheets";
import { useChapterStore } from "../stores/chapterStore";
import { useProjectStore } from "../stores/projectStore";

type View = "editor" | "plot" | "characters";

interface EditorViewProps {
  projectId: string;
  onBack: () => void;
}

export default function EditorView({ projectId, onBack }: EditorViewProps) {
  const { loadChapters, createChapter, clear } = useChapterStore();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );
  const [view, setView] = useState<View>("editor");

  useEffect(() => {
    loadChapters(projectId).then(async () => {
      const currentChapters = useChapterStore.getState().chapters;
      if (currentChapters.length === 0) {
        await createChapter(projectId, "Chapter 1");
      }
    });
    return () => clear();
  }, [projectId, loadChapters, createChapter, clear]);

  if (!project) return null;

  if (view === "plot") {
    return <PlotCanvas projectId={projectId} onClose={() => setView("editor")} />;
  }

  if (view === "characters") {
    return <CharacterSheets projectId={projectId} onClose={() => setView("editor")} />;
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        projectTitle={project.title}
        onBack={() => {
          clear();
          onBack();
        }}
        onShowPlot={() => setView("plot")}
        onShowCharacters={() => setView("characters")}
      />
      <Editor />
    </div>
  );
}
