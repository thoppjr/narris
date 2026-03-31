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
import { FRONT_MATTER_TYPES, BACK_MATTER_TYPES } from "../lib/commands";

interface SidebarProps {
  projectTitle: string;
  onBack: () => void;
  onShowPlot: () => void;
  onShowCharacters: () => void;
  onExport: () => void;
  onShowFormatting: () => void;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  chapter: "",
  part: "Part",
  title_page: "Title Page",
  copyright: "Copyright",
  dedication: "Dedication",
  epigraph: "Epigraph",
  foreword: "Foreword",
  preface: "Preface",
  toc: "TOC",
  about_author: "About Author",
  also_by: "Also By",
  acknowledgments: "Acknowledgments",
  appendix: "Appendix",
  glossary: "Glossary",
};

function SectionBadge({ type }: { type: string }) {
  if (type === "chapter") return null;
  const label = SECTION_TYPE_LABELS[type] || type;
  const isFront = ["title_page", "copyright", "dedication", "epigraph", "foreword", "preface", "toc"].includes(type);
  const isBack = ["about_author", "also_by", "acknowledgments", "appendix", "glossary"].includes(type);
  const isPart = type === "part";

  const color = isPart
    ? "bg-clay-200 dark:bg-clay-800 text-clay-700 dark:text-clay-200"
    : isFront
      ? "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-200"
      : isBack
        ? "bg-sand-300 dark:bg-sand-700 text-sand-700 dark:text-sand-200"
        : "";

  return (
    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {label}
    </span>
  );
}

function SortableChapter({
  id,
  title,
  wordCount,
  chapterType,
  isActive,
  onClick,
  onDelete,
}: {
  id: string;
  title: string;
  wordCount: number;
  chapterType: string;
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

  const isPart = chapterType === "part";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-150 select-none
                  ${isPart ? "ml-0 font-semibold" : ""}
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
        <div className="flex items-center gap-1.5">
          <div className={`text-sm truncate ${isPart ? "text-clay-700 dark:text-clay-300" : "font-medium"}`}>
            {title}
          </div>
          <SectionBadge type={chapterType} />
        </div>
        {chapterType !== "part" && (
          <div className="text-xs text-ink-muted">
            {wordCount.toLocaleString()} words
          </div>
        )}
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

export default function Sidebar({ projectTitle, onBack, onShowPlot, onShowCharacters, onExport, onShowFormatting }: SidebarProps) {
  const { chapters, activeChapterId, createChapter, createSection, deleteChapter, setActiveChapter, reorder } =
    useChapterStore();
  const [newTitle, setNewTitle] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const projectId = chapters[0]?.project_id;

  const handleAddChapter = async () => {
    if (!projectId) return;
    const title = newTitle.trim() || `Chapter ${chapters.filter(c => c.chapter_type === "chapter").length + 1}`;
    await createChapter(projectId, title);
    setNewTitle("");
  };

  const handleAddSection = async (type: string, label: string, defaultContent: string) => {
    if (!projectId) return;
    await createSection(projectId, label, defaultContent, type);
    setShowAddMenu(false);
  };

  const handleAddPart = async () => {
    if (!projectId) return;
    const partCount = chapters.filter(c => c.chapter_type === "part").length;
    await createSection(projectId, `Part ${partCount + 1}`, "", "part");
    setShowAddMenu(false);
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
      <div className="px-3 py-2 border-b border-sand-200 dark:border-stone-700 space-y-1.5">
        <div className="flex gap-2">
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
        <div className="flex gap-2">
          <button
            onClick={onShowFormatting}
            className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-200 hover:bg-sage-200 dark:hover:bg-sage-700 transition-colors text-center"
          >
            Formatting
          </button>
          <button
            onClick={onExport}
            className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-clay-200 dark:bg-clay-800 text-clay-700 dark:text-clay-200 hover:bg-clay-300 dark:hover:bg-clay-700 transition-colors text-center"
          >
            Export
          </button>
        </div>
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
                chapterType={chapter.chapter_type}
                isActive={chapter.id === activeChapterId}
                onClick={() => setActiveChapter(chapter.id)}
                onDelete={() => deleteChapter(chapter.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add chapter / section */}
      <div className="p-3 border-t border-sand-200 dark:border-stone-700 relative">
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
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="px-2 py-2 rounded-lg bg-sand-200 dark:bg-stone-700 text-stone-600 dark:text-sand-300 text-sm
                       hover:bg-sand-300 dark:hover:bg-stone-600 transition-colors"
            title="Add section"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Add section dropdown */}
        {showAddMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-stone-800 rounded-xl border border-sand-200 dark:border-stone-700 shadow-lg py-2 max-h-80 overflow-y-auto z-50">
            <div className="px-3 py-1 text-[10px] font-semibold text-ink-muted dark:text-sand-400 uppercase tracking-wider">
              Front Matter
            </div>
            {FRONT_MATTER_TYPES.map((fm) => (
              <button
                key={fm.type}
                onClick={() => handleAddSection(fm.type, fm.label, fm.defaultContent)}
                className="w-full text-left px-3 py-1.5 text-sm text-stone-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-stone-700 transition-colors"
              >
                {fm.label}
              </button>
            ))}

            <div className="border-t border-sand-200 dark:border-stone-700 my-1" />
            <div className="px-3 py-1 text-[10px] font-semibold text-ink-muted dark:text-sand-400 uppercase tracking-wider">
              Structure
            </div>
            <button
              onClick={handleAddPart}
              className="w-full text-left px-3 py-1.5 text-sm text-stone-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-stone-700 transition-colors"
            >
              Part / Volume
            </button>

            <div className="border-t border-sand-200 dark:border-stone-700 my-1" />
            <div className="px-3 py-1 text-[10px] font-semibold text-ink-muted dark:text-sand-400 uppercase tracking-wider">
              Back Matter
            </div>
            {BACK_MATTER_TYPES.map((bm) => (
              <button
                key={bm.type}
                onClick={() => handleAddSection(bm.type, bm.label, bm.defaultContent)}
                className="w-full text-left px-3 py-1.5 text-sm text-stone-700 dark:text-sand-300 hover:bg-sand-100 dark:hover:bg-stone-700 transition-colors"
              >
                {bm.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
