import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Editor from "./Editor";
import { useChapterStore } from "../stores/chapterStore";
import { useProjectStore } from "../stores/projectStore";

interface EditorViewProps {
  projectId: string;
  onBack: () => void;
}

export default function EditorView({ projectId, onBack }: EditorViewProps) {
  const { loadChapters, createChapter, clear } = useChapterStore();
  const project = useProjectStore((s) =>
    s.projects.find((p) => p.id === projectId)
  );

  useEffect(() => {
    loadChapters(projectId).then(async () => {
      // Auto-create first chapter if project is empty
      const currentChapters = useChapterStore.getState().chapters;
      if (currentChapters.length === 0) {
        await createChapter(projectId, "Chapter 1");
      }
    });
    return () => clear();
  }, [projectId, loadChapters, createChapter, clear]);

  if (!project) return null;

  return (
    <div className="h-screen flex">
      <Sidebar
        projectTitle={project.title}
        onBack={() => {
          clear();
          onBack();
        }}
      />
      <Editor />
    </div>
  );
}
