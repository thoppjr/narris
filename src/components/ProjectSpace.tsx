import { useEffect, useState } from "react";
import { useProjectStore } from "../stores/projectStore";

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

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center px-6 py-12">
      {/* Header */}
      <div className="w-full max-w-3xl mb-12">
        <h1 className="text-4xl font-light tracking-tight text-stone-800 mb-2">
          Narris
        </h1>
        <p className="text-ink-muted text-lg">
          Your writing space. Pick up where you left off, or start something
          new.
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
