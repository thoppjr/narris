import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useChapterStore } from "../stores/chapterStore";
import { useState } from "react";

interface SidebarProps {
  projectTitle: string;
  onBack: () => void;
  onShowPlot: () => void;
  onShowCharacters: () => void;
}

function SortableChapter({
  id,
  title,
  wordCount,
  isActive,
  onClick,
  onDelete,
}: {
  id: string;
  title: string;
  wordCount: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-150 select-none
                  ${
                    isActive
                      ? "bg-sage-100 border border-sage-300 text-stone-800"
                      : "hover:bg-sand-100 text-stone-600"
                  }`}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-ink-muted
                   hover:text-ink-light p-0.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="3" r="1.5" />
          <circle cx="9" cy="3" r="1.5" />
          <circle cx="3" cy="9" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-ink-muted">
          {wordCount.toLocaleString()} words
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded
                   text-ink-muted hover:text-red-600 hover:bg-red-50
                   transition-all duration-150"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Sidebar({ projectTitle, onBack, onShowPlot, onShowCharacters }: SidebarProps) {
  const { chapters, activeChapterId, createChapter, deleteChapter, setActiveChapter, reorder } =
    useChapterStore();
  const [newTitle, setNewTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectId = chapters[0]?.project_id;

  const handleAddChapter = async () => {
    if (!projectId) return;
    const title = newTitle.trim() || `Chapter ${chapters.length + 1}`;
    await createChapter(projectId, title);
    setNewTitle("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...chapters];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    reorder(newOrder.map((c) => c.id));
  };

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);

  return (
    <div className="w-64 h-full bg-sand-100 dark:bg-stone-900 border-r border-sand-200 dark:border-stone-700 flex flex-col">
      {/* Project header */}
      <div className="p-4 border-b border-sand-200 dark:border-stone-700">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink
                     transition-colors mb-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Projects
        </button>
        <h2 className="font-medium text-stone-800 truncate text-sm">
          {projectTitle}
        </h2>
        <div className="text-xs text-ink-muted mt-0.5">
          {totalWords.toLocaleString()} words
        </div>
      </div>

      {/* Tools */}
      <div className="px-3 py-2 border-b border-sand-200 dark:border-stone-700 flex gap-2">
        <button
          onClick={onShowPlot}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 dark:hover:bg-stone-600 transition-colors text-center"
        >
          Plot Points
        </button>
        <button
          onClick={onShowCharacters}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 hover:bg-sand-300 dark:hover:bg-stone-600 transition-colors text-center"
        >
          Characters
        </button>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {chapters.map((chapter) => (
              <SortableChapter
                key={chapter.id}
                id={chapter.id}
                title={chapter.title}
                wordCount={chapter.word_count}
                isActive={chapter.id === activeChapterId}
                onClick={() => setActiveChapter(chapter.id)}
                onDelete={() => deleteChapter(chapter.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add chapter */}
      <div className="p-3 border-t border-sand-200 dark:border-stone-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            placeholder="New chapter..."
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-sand-200
                       placeholder-ink-muted
                       focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-transparent
                       transition-all duration-200"
          />
          <button
            onClick={handleAddChapter}
            className="px-3 py-2 rounded-lg bg-sage-600 text-white text-sm font-medium
                       hover:bg-sage-700 active:bg-sage-800
                       transition-colors duration-150"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
