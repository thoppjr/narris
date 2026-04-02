import { useEffect, useState } from "react";
import { useProjectStore } from "../stores/projectStore";
import { open } from "@tauri-apps/plugin-dialog";
import { importDocx, createSection } from "../lib/commands";

interface ProjectSpaceProps {
  onOpenProject: (id: string) => void;
}

export default function ProjectSpace({ onOpenProject }: ProjectSpaceProps) {
  const { projects, loading, loadProjects, createProject, deleteProject } =
    useProjectStore();
  const [newTitle, setNewTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    const title = newTitle.trim() || "Untitled Project";
    const project = await createProject(title);
    setNewTitle("");
    onOpenProject(project.id);
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setConfirmDeleteId(null);
  };

  const handleImportDocx = async () => {
    try {
      const path = await open({
        filters: [{ name: "Word Document", extensions: ["docx"] }],
        multiple: false,
      });
      if (!path) return;
      const chapters = await importDocx(path as string);
      if (chapters.length === 0) return;
      // Create a new project from the filename
      const filename = (path as string).split("/").pop()?.replace(".docx", "") || "Imported";
      const project = await createProject(filename);
      // Create chapters from imported content
      for (let i = 0; i < chapters.length; i++) {
        if (i === 0) {
          // First chapter already created by createProject flow - but we need to add content via createSection
          await createSection(project.id, chapters[i].title, chapters[i].content, i, "chapter", null);
        } else {
          await createSection(project.id, chapters[i].title, chapters[i].content, i, "chapter", null);
        }
      }
      onOpenProject(project.id);
    } catch (err) {
      console.error("DOCX import failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center px-6 py-12">
      {/* Header */}
      <div className="w-full max-w-3xl mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/narras.svg" alt="narras" className="w-16 h-16" />
          <h1 className="text-5xl tracking-tight text-stone-800 dark:text-sand-100"
              style={{ fontFamily: "'Helvetica Neue', 'Inter', 'Segoe UI', system-ui, sans-serif", fontWeight: 200, letterSpacing: "0.12em" }}>
            narras
          </h1>
        </div>
        <p className="text-ink-muted dark:text-sand-400 text-base italic tracking-wide"
           style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          it's time to tell your story
        </p>
      </div>

      {/* New Project */}
      <div className="w-full max-w-3xl mb-10">
        <div className="flex gap-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New project title..."
            className="flex-1 px-4 py-3 rounded-lg bg-white border border-sand-200
                       text-ink placeholder-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent
                       transition-all duration-200"
          />
          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-lg bg-sage-600 text-white font-medium
                       hover:bg-sage-700 active:bg-sage-800
                       transition-colors duration-150"
          >
            Create
          </button>
          <button
            onClick={handleImportDocx}
            className="px-6 py-3 rounded-lg bg-sand-200 text-stone-700 font-medium
                       hover:bg-sand-300 active:bg-sand-400
                       transition-colors duration-150"
            title="Import from .docx file"
          >
            Import
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="text-center py-12 text-ink-muted">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-ink-muted text-lg mb-2">
              No projects yet
            </div>
            <div className="text-ink-muted text-sm">
              Create your first project above to get started.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-white rounded-xl border border-sand-200 p-5
                           hover:border-sage-300 hover:shadow-sm
                           transition-all duration-200 cursor-pointer"
                onClick={() => onOpenProject(project.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-stone-800 truncate">
                      {project.title}
                    </h3>
                    <div className="flex gap-4 mt-1.5 text-sm text-ink-muted">
                      {project.genre && <span>{project.genre}</span>}
                      <span>
                        {new Date(project.updated_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDeleteId === project.id) {
                        handleDelete(project.id);
                      } else {
                        setConfirmDeleteId(project.id);
                      }
                    }}
                    onBlur={() => setConfirmDeleteId(null)}
                    className={`ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150
                      ${
                        confirmDeleteId === project.id
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-sand-100"
                      }`}
                  >
                    {confirmDeleteId === project.id ? "Confirm" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
