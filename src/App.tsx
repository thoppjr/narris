import { useState } from "react";
import ProjectSpace from "./components/ProjectSpace";
import EditorView from "./components/EditorView";

export default function App() {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  if (openProjectId) {
    return (
      <EditorView
        projectId={openProjectId}
        onBack={() => setOpenProjectId(null)}
      />
    );
  }

  return <ProjectSpace onOpenProject={(id) => setOpenProjectId(id)} />;
}
